const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { HttpError } = require('../utils/httpError');
const { ROLES } = require('../utils/constants');
const BlacklistToken = require('../models/blacklistToken.model');
const User = require('../models/user.model');
const Captain = require('../models/captain.model');

const MODELS = {
    [ROLES.USER]: User,
    [ROLES.CAPTAIN]: Captain,
};

const extractToken = (req) => {
    const header = req.headers.authorization || '';
    const [ scheme, token ] = header.split(' ');
    return scheme === 'Bearer' && token ? token : null;
};

/**
 * Authentication and authorization middleware:
 * - authenticate('user')            -> only riders
 * - authenticate('captain')         -> only captains
 * - authenticate('user','captain')  -> either
 * Attaches req.actor = { id, role, doc, token }
 */
const authenticate = (...allowedRoles) => async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) throw new HttpError(401, 'Unauthorized');

        const decoded = jwt.verify(token, jwtSecret);
        if (!allowedRoles.includes(decoded.role)) {
            throw new HttpError(403, 'Forbidden for this account type');
        }

        if (await BlacklistToken.exists({ token })) {
            throw new HttpError(401, 'Unauthorized');
        }

        const doc = await MODELS[decoded.role].findById(decoded._id);
        if (!doc) {
            throw new HttpError(401, 'Unauthorized');
        }

        req.actor = { id: doc._id, role: decoded.role, doc, token };
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    authenticate,
    authUser: authenticate(ROLES.USER),
    authCaptain: authenticate(ROLES.CAPTAIN),
    authAny: authenticate(ROLES.USER, ROLES.CAPTAIN),
};
