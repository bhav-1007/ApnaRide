const crypto = require('crypto');
const { jwtSecret } = require('../config/env');
const { HttpError } = require('./httpError');
const BlacklistToken = require('../models/blacklistToken.model');
const emailService = require('./email');
const { DISPATCH } = require('./constants');

const OTP_TTL_MS = 15 * 60 * 1000;

const hashOtp = (otp) => crypto.createHmac('sha256', jwtSecret).update(otp).digest('hex');

const safeEqual = (a, b) => {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

async function blacklistToken(token) {
    await BlacklistToken.updateOne({ token }, { $setOnInsert: { token } }, { upsert: true });
}

// Generates an OTP, hashes it, saves it to the account, and sends an email.
// Always succeeds quietly so attackers cannot enumerate valid user emails.
async function requestPasswordReset(Model, email) {
    const account = await Model.findOne({ email: email.toLowerCase().trim() });
    if (!account) return;

    const otp = crypto.randomInt(100000, 1000000).toString();
    account.resetOtpHash = hashOtp(otp);
    account.resetOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    account.resetOtpAttempts = 0;
    await account.save();

    await emailService.sendPasswordResetEmail({
        to: account.email,
        otp,
        name: account.fullname.firstname,
    });
}

async function resetPassword(Model, { email, otp, newPassword }) {
    const account = await Model.findOne({ email: email.toLowerCase().trim() })
        .select('+resetOtpHash +resetOtpExpires +resetOtpAttempts +password');

    const invalid = new HttpError(400, 'Invalid or expired code');
    if (!account || !account.resetOtpHash || account.resetOtpExpires < new Date()) {
        throw invalid;
    }
    if (account.resetOtpAttempts >= DISPATCH.MAX_OTP_ATTEMPTS) {
        throw new HttpError(429, 'Too many wrong attempts. Request a new code.');
    }

    if (!safeEqual(account.resetOtpHash, hashOtp(otp))) {
        await Model.updateOne({ _id: account._id }, { $inc: { resetOtpAttempts: 1 } });
        throw invalid;
    }

    account.password = await Model.hashPassword(newPassword);
    account.resetOtpHash = undefined;
    account.resetOtpExpires = undefined;
    account.resetOtpAttempts = 0;
    await account.save();
}

module.exports = {
    blacklistToken,
    requestPasswordReset,
    resetPassword,
};
