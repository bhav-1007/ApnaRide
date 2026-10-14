const { validationResult } = require('express-validator');
const { HttpError } = require('../utils/httpError');

module.exports = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    next(new HttpError(400, details[ 0 ].message, details));
};
