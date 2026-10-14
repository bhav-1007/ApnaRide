const express = require('express');
const { body, param, query } = require('express-validator');
const rideController = require('../controllers/rideController');
const { authUser, authCaptain, authAny } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const { VEHICLE_TYPES, RIDE_STATUS } = require('../utils/constants');

const router = express.Router();

const placeRules = (field) => [
    body(`${field}.address`).isString().trim().isLength({ min: 3 }).withMessage(`Invalid ${field} address`),
    body(`${field}.lat`).isFloat({ min: -90, max: 90 }).toFloat().withMessage(`Invalid ${field} latitude`),
    body(`${field}.lng`).isFloat({ min: -180, max: 180 }).toFloat().withMessage(`Invalid ${field} longitude`),
];

const rideIdValidation = param('id').isMongoId().withMessage('Invalid ride id');

// Rider endpoints
router.post(
    '/quote',
    authUser,
    ...placeRules('pickup'),
    ...placeRules('destination'),
    validate,
    rideController.quote,
);

router.post(
    '/',
    authUser,
    ...placeRules('pickup'),
    ...placeRules('destination'),
    body('vehicleType').isIn(VEHICLE_TYPES).withMessage(`Vehicle type must be one of: ${VEHICLE_TYPES.join(', ')}`),
    validate,
    rideController.createRide,
);

router.post('/:id/cancel', authUser, rideIdValidation, validate, rideController.cancelRide);
router.post('/:id/pay', authUser, rideIdValidation, validate, rideController.markPaid);

// Captain endpoints
router.get('/nearby', authCaptain, rideController.getNearbyRides);
router.post('/:id/accept', authCaptain, rideIdValidation, validate, rideController.acceptRide);

router.post(
    '/:id/start',
    authCaptain,
    authLimiter,
    rideIdValidation,
    body('otp').isString().isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
    validate,
    rideController.startRide,
);

router.post('/:id/end', authCaptain, rideIdValidation, validate, rideController.endRide);

// Shared endpoints
router.get('/active', authAny, rideController.getActiveRide);

router.get(
    '/history',
    authAny,
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('status').optional().isIn(Object.values(RIDE_STATUS)),
    validate,
    rideController.getRideHistory,
);

module.exports = router;
