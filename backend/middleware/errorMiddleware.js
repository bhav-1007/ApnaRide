const { HttpError } = require('../utils/httpError');
const { isProd } = require('../config/env');

// Catch-all for non-matching API endpoints
module.exports.notFound = (req, res, next) => {
    next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Centralized error handler returning uniform JSON errors with appropriate HTTP status
// eslint-disable-next-line no-unused-vars
module.exports.errorHandler = (err, req, res, next) => {
    let status = err.status || 500;
    let message = err.message || 'Internal server error';
    let details = err.details;

    if (err.name === 'ValidationError') {
        status = 400;
        details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
        message = 'Validation failed';
    } else if (err.name === 'CastError') {
        status = 400;
        message = `Invalid ${err.path}`;
    } else if (err.code === 11000) {
        status = 409;
        message = 'Duplicate value';
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        status = 401;
        message = 'Unauthorized';
    }

    if (status >= 500) {
        console.error(err);
        if (isProd) message = 'Internal server error';
    }

    res.status(status).json({ message, ...(details ? { details } : {}) });
};
