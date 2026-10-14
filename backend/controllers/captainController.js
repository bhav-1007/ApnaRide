const Captain = require('../models/captain.model');
const Ride = require('../models/ride.model');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { blacklistToken, requestPasswordReset, resetPassword } = require('../utils/auth');
const realtime = require('../utils/realtime');
const { RIDE_STATUS, CAPTAIN_BUSY_STATUSES } = require('../utils/constants');
const { timezone } = require('../config/env');

const dayKey = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);

/**
 * Captain authentication, location tracking, and earnings controller
 */
const captainController = {
    register: asyncHandler(async (req, res) => {
        const { fullname, email, password, vehicle } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        if (await Captain.exists({ email: normalizedEmail })) {
            throw new HttpError(409, 'An account with this email already exists');
        }

        const hashedPassword = await Captain.hashPassword(password);
        const captain = await Captain.create({
            fullname,
            email: normalizedEmail,
            password: hashedPassword,
            vehicle,
        });

        const token = captain.generateAuthToken();
        const captainJson = captain.toObject();
        delete captainJson.password;

        res.status(201).json({ token, captain: captainJson });
    }),

    login: asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const captain = await Captain.findOne({ email: normalizedEmail }).select('+password');
        if (!captain || !(await captain.comparePassword(password))) {
            throw new HttpError(401, 'Invalid email or password');
        }

        const token = captain.generateAuthToken();
        const captainJson = captain.toObject();
        delete captainJson.password;

        res.status(200).json({ token, captain: captainJson });
    }),

    getProfile: (req, res) => {
        res.status(200).json(req.actor.doc);
    },

    logout: asyncHandler(async (req, res) => {
        await blacklistToken(req.actor.token);
        res.status(200).json({ message: 'Logged out' });
    }),

    forgotPassword: asyncHandler(async (req, res) => {
        await requestPasswordReset(Captain, req.body.email);
        res.status(200).json({ message: 'If that email is registered, a reset code has been sent.' });
    }),

    resetPassword: asyncHandler(async (req, res) => {
        await resetPassword(Captain, req.body);
        res.status(200).json({ message: 'Password reset successful. You can now log in.' });
    }),

    setStatus: asyncHandler(async (req, res) => {
        const captain = await Captain.findByIdAndUpdate(
            req.actor.id,
            { status: req.body.status },
            { new: true },
        );
        res.status(200).json({ captain });
    }),

    // Called every few seconds while online to stream GPS position
    updateLocation: asyncHandler(async (req, res) => {
        const { lat, lng } = req.body;
        await Captain.updateOne(
            { _id: req.actor.id },
            {
                location: { type: 'Point', coordinates: [ lng, lat ] },
                locationUpdatedAt: new Date(),
            },
        );

        // If captain is actively serving a ride, push the location to rider
        const activeRide = await Ride.findOne({
            captain: req.actor.id,
            status: { $in: CAPTAIN_BUSY_STATUSES },
        }).select('_id');

        if (activeRide) {
            await realtime.publish(
                realtime.channels.ride(activeRide._id),
                realtime.EVENTS.CAPTAIN_LOCATION,
                { rideId: activeRide._id, lat, lng },
            );
        }

        res.status(200).json({ ok: true });
    }),

    // Captain earnings dashboard analytics computed with MongoDB aggregation
    getStats: asyncHandler(async (req, res) => {
        const days = Number(req.query.days) || 7;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const group = { _id: null, rides: { $sum: 1 }, earnings: { $sum: '$fare' }, distance: { $sum: '$distance' } };

        const [ result ] = await Ride.aggregate([
            { $match: { captain: req.actor.id, status: RIDE_STATUS.COMPLETED } },
            {
                $facet: {
                    total: [ { $group: group } ],
                    daily: [
                        { $match: { completedAt: { $gte: since } } },
                        {
                            $group: {
                                _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone } },
                                rides: { $sum: 1 },
                                earnings: { $sum: '$fare' },
                            },
                        },
                        { $sort: { _id: 1 } },
                        { $project: { _id: 0, date: '$_id', rides: 1, earnings: 1 } },
                    ],
                },
            },
        ]);

        const total = result.total[ 0 ] || { rides: 0, earnings: 0, distance: 0 };
        const today = result.daily.find((d) => d.date === dayKey(new Date())) || { rides: 0, earnings: 0 };

        res.status(200).json({
            today: { rides: today.rides, earnings: today.earnings },
            total: { rides: total.rides, earnings: total.earnings, distanceKm: Math.round(total.distance / 100) / 10 },
            daily: result.daily,
        });
    }),
};

module.exports = captainController;
