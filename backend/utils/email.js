const nodemailer = require('nodemailer');
const { smtp, isProd } = require('../config/env');
const { HttpError } = require('./httpError');

module.exports.sendPasswordResetEmail = async ({ to, otp, name }) => {
    if (!smtp.host || !smtp.user || !smtp.pass) {
        if (isProd) {
            throw new HttpError(503, 'Email service is not configured');
        }
        console.log(`[dev] password reset OTP for ${to}: ${otp}`);
        return;
    }

    const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465,
        auth: { user: smtp.user, pass: smtp.pass },
    });

    await transporter.sendMail({
        from: `"ApnaRide" <${smtp.user}>`,
        to,
        subject: 'ApnaRide - Your password reset code',
        text: `Hi ${name}, your ApnaRide password reset code is ${otp}. It expires in 15 minutes. If you did not request it, ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
            <h2 style="margin:0 0 12px">ApnaRide</h2>
            <p>Hi ${name}, use this code to reset your password:</p>
            <p style="font-size:32px;letter-spacing:6px;font-weight:700;margin:16px 0">${otp}</p>
            <p style="color:#666">It expires in 15 minutes. If you did not request it, you can ignore this email.</p>
        </div>`,
    });
};
