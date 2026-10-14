const mongoose = require('mongoose');
const pointSchema = require('./point.schema');
const {
    VEHICLE_TYPES,
    RIDE_STATUS,
    ACTIVE_RIDE_STATUSES,
    CAPTAIN_BUSY_STATUSES,
} = require('../utils/constants');

const placeSchema = new mongoose.Schema({
    address: { type: String, required: true, trim: true },
    location: { type: pointSchema, required: true },
}, { _id: false });

const rideSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'captain' },
    pickup: { type: placeSchema, required: true },
    destination: { type: placeSchema, required: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES, required: true },
    fare: { type: Number, required: true, min: 0 },
    distance: { type: Number, required: true }, // in meters
    duration: { type: Number, required: true }, // in seconds
    status: { type: String, enum: Object.values(RIDE_STATUS), default: RIDE_STATUS.PENDING },
    paymentStatus: { type: String, enum: [ 'unpaid', 'paid' ], default: 'unpaid' },

    // One-time password to start the ride
    otp: { type: String, select: false, required: true },
    otpAttempts: { type: Number, default: 0, select: false },

    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    paidAt: Date,
    cancelReason: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

rideSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Geospatial index for nearby pending rides search
rideSchema.index({ 'pickup.location': '2dsphere' });
rideSchema.index({ status: 1, vehicleType: 1, createdAt: -1 });

// Analytics and history indexes
rideSchema.index({ captain: 1, status: 1, completedAt: -1 });
rideSchema.index({ user: 1, createdAt: -1 });

// Database-level constraints to ensure consistency under concurrency:
// 1. A rider can have only one active ride at a time
// 2. A captain can only serve one ride at a time
rideSchema.index(
    { user: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ACTIVE_RIDE_STATUSES } },
        name: 'one_active_ride_per_user',
    },
);
rideSchema.index(
    { captain: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: CAPTAIN_BUSY_STATUSES } },
        name: 'one_busy_ride_per_captain',
    },
);

module.exports = mongoose.model('ride', rideSchema);
