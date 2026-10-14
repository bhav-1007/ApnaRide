const rateLimit = require('express-rate-limit');
const { isTest } = require('../config/env');

const makeLimiter = (windowMs, limit) => rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest, // tests make multiple requests from the same IP
    message: { message: 'Too many requests, please try again later.' },
});

module.exports = {
    apiLimiter: makeLimiter(15 * 60 * 1000, 600),
    authLimiter: makeLimiter(15 * 60 * 1000, 20),
};
