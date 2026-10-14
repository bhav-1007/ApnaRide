const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema({
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

userSchema.methods.generateAuthToken = function () {
    return jwt.sign({ _id: this._id, role: ROLES.USER }, jwtSecret, { expiresIn: '24h' });
};

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = function (password) {
    return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('user', userSchema);
