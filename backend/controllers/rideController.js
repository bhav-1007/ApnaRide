const crypto = require('crypto');
const Ride = require('../models/ride.model');
const Captain = require('../models/captain.model');
const maps = require('../utils/maps');
const fare = require('../utils/fare');
const realtime = require('../utils/realtime');
const { HttpError, asyncHandler } = require('../utils/httpError');
const {
    RIDE_STATUS,
    ACTIVE_RIDE_STATUSES,
    CAPTAIN_BUSY_STATUSES,
    DISPATCH,
    ROLES,
} = require('../utils/constants');

const toPoint = ({ lat, lng }) => ({ type: 'Point', coordinates: [ lng, lat ] });
const captainPublicFields = 'fullname vehicle location';
const riderPublicFields = 'fullname';

// Lazily cancels pending ride requests that exceeded the 5-minute timeout
async function expireStaleRides() {
    await Ride.updateMany(
        {
            status: RIDE_STATUS.PENDING,
            createdAt: { $lt: new Date(Date.now() - DISPATCH.REQUEST_TTL_MS) },
        },
        {
            status: RIDE_STATUS.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: 'expired',
        },
    );
}

function findNearbyCaptains({ lat, lng, vehicleType }) {
    return Captain.find({
        status: 'active',
        'vehicle.vehicleType': vehicleType,
        location: {
            $near: {
                $geometry: toPoint({ lat, lng }),
                $maxDistance: DISPATCH.RADIUS_METERS,
            },
        },
    }).limit(DISPATCH.MAX_CAPTAINS_NOTIFIED);
}

const rideController = {
    // Calculates route and fare estimates across all vehicle types
    quote: asyncHandler(async (req, res) => {
        const { pickup, destination } = req.body;
        const route = await maps.getRoute(pickup, destination);
        res.status(200).json({
            distance: route.distance,
            duration: route.duration,
            fares: fare.calculateFares(route.distance, route.duration),
            route: route.geometry,
        });
    }),

    // Books a new ride and pushes request to nearest captains
    createRide: asyncHandler(async (req, res) => {
        const { pickup, destination, vehicleType } = req.body;
        await expireStaleRides();

        const route = await maps.getRoute(pickup, destination);
        const calculatedFare = fare.calculateFare(vehicleType, route.distance, route.duration);
        const otp = crypto.randomInt(100000, 1000000).toString();

        let ride;
        try {
            ride = await Ride.create({
                user: req.actor.id,
                pickup: { address: pickup.address, location: toPoint(pickup) },
                destination: { address: destination.address, location: toPoint(destination) },
                vehicleType,
                fare: calculatedFare,
                distance: route.distance,
                duration: route.duration,
                otp,
            });
        } catch (err) {
            if (err.code === 11000) {
                throw new HttpError(409, 'You already have a ride in progress');
            }
            throw err;
        }

        const captains = await findNearbyCaptains({ ...pickup, vehicleType });
        const payload = await Ride.findById(ride._id).populate('user', riderPublicFields).lean();

        await Promise.all(
            captains.map((c) => realtime.publish(realtime.channels.captain(c._id), realtime.EVENTS.NEW_RIDE, payload))
        );

        res.status(201).json({
            ride,
            captainsNotified: captains.length,
            route: route.geometry,
        });
    }),

    // Captain retrieves pending rides near their current location
    getNearbyRides: asyncHandler(async (req, res) => {
        const captain = req.actor.doc;
        if (!captain.location) {
            throw new HttpError(400, 'Share your location to see nearby rides');
        }

        await expireStaleRides();

        const rides = await Ride.find({
            status: RIDE_STATUS.PENDING,
            vehicleType: captain.vehicle.vehicleType,
            'pickup.location': {
                $near: {
                    $geometry: { type: 'Point', coordinates: captain.location.coordinates },
                    $maxDistance: DISPATCH.RADIUS_METERS,
                },
            },
        }).limit(10).populate('user', riderPublicFields);

        res.status(200).json({ rides });
    }),

    // Retrieves current live ride for either rider or captain
    getActiveRide: asyncHandler(async (req, res) => {
        const { id, role } = req.actor;
        await expireStaleRides();

        let ride;
        if (role === ROLES.USER) {
            ride = await Ride.findOne({ user: id, status: { $in: ACTIVE_RIDE_STATUSES } })
                .select('+otp')
                .populate('captain', captainPublicFields);
        } else {
            ride = await Ride.findOne({ captain: id, status: { $in: CAPTAIN_BUSY_STATUSES } })
                .populate('user', riderPublicFields);
        }

        res.status(200).json({ ride });
    }),

    // Paginated ride history for either role
    getRideHistory: asyncHandler(async (req, res) => {
        const { id, role } = req.actor;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const status = req.query.status;

        const filter = { [role === ROLES.USER ? 'user' : 'captain']: id };
        if (status) filter.status = status;

        const [ rides, total ] = await Promise.all([
            Ride.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate(role === ROLES.USER
                    ? { path: 'captain', select: captainPublicFields }
                    : { path: 'user', select: riderPublicFields }),
            Ride.countDocuments(filter),
        ]);

        res.status(200).json({
            rides,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    }),

    // Captain accepts a pending ride (atomic operation to prevent race conditions)
    acceptRide: asyncHandler(async (req, res) => {
        const rideId = req.params.id;
        const captain = req.actor.doc;

        let ride;
        try {
            ride = await Ride.findOneAndUpdate(
                {
                    _id: rideId,
                    status: RIDE_STATUS.PENDING,
                    vehicleType: captain.vehicle.vehicleType,
                    createdAt: { $gte: new Date(Date.now() - DISPATCH.REQUEST_TTL_MS) },
                },
                {
                    status: RIDE_STATUS.ACCEPTED,
                    captain: captain._id,
                    acceptedAt: new Date(),
                },
                { new: true },
            );
        } catch (err) {
            if (err.code === 11000) {
                throw new HttpError(409, 'You already have an active ride');
            }
            throw err;
        }

        if (!ride) {
            throw new HttpError(409, 'This ride is no longer available');
        }

        const forRider = await Ride.findById(ride._id)
            .select('+otp')
            .populate('captain', captainPublicFields)
            .lean();

        await realtime.publish(
            realtime.channels.user(ride.user),
            realtime.EVENTS.RIDE_ACCEPTED,
            forRider,
        );

        const captainView = await Ride.findById(ride._id).populate('user', riderPublicFields);
        res.status(200).json({ ride: captainView });
    }),

    // Captain starts the ride using rider's OTP
    startRide: asyncHandler(async (req, res) => {
        const rideId = req.params.id;
        const { otp } = req.body;
        const captain = req.actor.doc;
        const baseQuery = { _id: rideId, captain: captain._id, status: RIDE_STATUS.ACCEPTED };

        const ride = await Ride.findOneAndUpdate(
            { ...baseQuery, otp, otpAttempts: { $lt: DISPATCH.MAX_OTP_ATTEMPTS } },
            { status: RIDE_STATUS.ONGOING, startedAt: new Date() },
            { new: true },
        ).populate('user', riderPublicFields);

        if (!ride) {
            const current = await Ride.findOne({ _id: rideId, captain: captain._id }).select('status +otpAttempts');
            if (!current) throw new HttpError(404, 'Ride not found');
            if (current.status !== RIDE_STATUS.ACCEPTED) {
                throw new HttpError(409, `Ride is ${current.status}, not waiting to start`);
            }
            if (current.otpAttempts >= DISPATCH.MAX_OTP_ATTEMPTS) {
                throw new HttpError(429, 'Too many wrong codes');
            }

            await Ride.updateOne(baseQuery, { $inc: { otpAttempts: 1 } });
            throw new HttpError(400, 'Incorrect OTP');
        }

        await realtime.publish(realtime.channels.user(ride.user._id), realtime.EVENTS.RIDE_STARTED, ride);
        res.status(200).json({ ride });
    }),

    // Captain completes an ongoing ride
    endRide: asyncHandler(async (req, res) => {
        const rideId = req.params.id;
        const captain = req.actor.doc;

        const ride = await Ride.findOneAndUpdate(
            { _id: rideId, captain: captain._id, status: RIDE_STATUS.ONGOING },
            { status: RIDE_STATUS.COMPLETED, completedAt: new Date() },
            { new: true },
        ).populate('user', riderPublicFields);

        if (!ride) {
            throw new HttpError(409, 'Ride not found or not ongoing');
        }

        await realtime.publish(realtime.channels.user(ride.user._id), realtime.EVENTS.RIDE_ENDED, ride);
        res.status(200).json({ ride });
    }),

    // Rider cancels a pending or accepted ride
    cancelRide: asyncHandler(async (req, res) => {
        const rideId = req.params.id;
        const userId = req.actor.id;

        const ride = await Ride.findOneAndUpdate(
            {
                _id: rideId,
                user: userId,
                status: { $in: [ RIDE_STATUS.PENDING, RIDE_STATUS.ACCEPTED ] },
            },
            {
                status: RIDE_STATUS.CANCELLED,
                cancelledAt: new Date(),
                cancelReason: 'cancelled_by_rider',
            },
            { new: true },
        );

        if (!ride) {
            throw new HttpError(409, 'Ride not found or can no longer be cancelled');
        }

        if (ride.captain) {
            await realtime.publish(
                realtime.channels.captain(ride.captain),
                realtime.EVENTS.RIDE_CANCELLED,
                { rideId: ride._id },
            );
        }

        res.status(200).json({ ride });
    }),

    // Rider confirms cash payment to captain
    markPaid: asyncHandler(async (req, res) => {
        const rideId = req.params.id;
        const userId = req.actor.id;

        const ride = await Ride.findOneAndUpdate(
            {
                _id: rideId,
                user: userId,
                status: RIDE_STATUS.ONGOING,
                paymentStatus: 'unpaid',
            },
            { paymentStatus: 'paid', paidAt: new Date() },
            { new: true },
        );

        if (!ride) {
            throw new HttpError(409, 'Ride not found, not ongoing, or already paid');
        }

        await realtime.publish(
            realtime.channels.captain(ride.captain),
            realtime.EVENTS.PAYMENT_RECEIVED,
            { rideId: ride._id, fare: ride.fare },
        );

        res.status(200).json({ ride });
    }),
};

module.exports = rideController;
