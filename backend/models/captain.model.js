const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const pointSchema = require('./point.schema');
const { ROLES, VEHICLE_TYPES } = require('../utils/constants');

const captainSchema = new mongoose.Schema({
    fullname: {
        firstname: {
            type: String,
            required: true,
            trim: true,
            minlength: [ 3, 'First name must be at least 3 characters long' ],
        },
        lastname: {
            type: String,
            trim: true,
            minlength: [ 3, 'Last name must be at least 3 characters long' ],
        },
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [ /^\S+@\S+\.\S+$/, 'Please enter a valid email' ],
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    status: {
        type: String,
        enum: [ 'active', 'inactive' ],
        default: 'inactive',
    },
    vehicle: {
        color: {
            type: String,
            required: true,
            trim: true,
            minlength: [ 3, 'Color must be at least 3 characters long' ],
        },
        plate: {
            type: String,
            required: true,
            trim: true,
            minlength: [ 3, 'Plate must be at least 3 characters long' ],
        },
        capacity: {
            type: Number,
            required: true,
            min: [ 1, 'Capacity must be at least 1' ],
        },
        vehicleType: {
            type: String,
            required: true,
            enum: VEHICLE_TYPES,
        },
    },
    location: {
        type: pointSchema,
    },
    locationUpdatedAt: {
        type: Date,
    },
    resetOtpHash: {
        type: String,
        select: false,
    },
    resetOtpExpires: {
        type: Date,
        select: false,
    },
    resetOtpAttempts: {
        type: Number,
        default: 0,
        select: false,
    },
}, { timestamps: true });

captainSchema.methods.generateAuthToken = function () {
    return jwt.sign({ _id: this._id, role: ROLES.CAPTAIN }, jwtSecret, { expiresIn: '24h' });
};

captainSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};

captainSchema.statics.hashPassword = function (password) {
    return bcrypt.hash(password, 10);
};

// Geospatial index for nearby captain matching ($near)
captainSchema.index({ location: '2dsphere' });
captainSchema.index({ status: 1, 'vehicle.vehicleType': 1 });

module.exports = mongoose.model('captain', captainSchema);
