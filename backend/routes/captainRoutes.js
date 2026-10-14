const express = require('express');
const { body } = require('express-validator');
const captainController = require('../controllers/captainController');
const { authCaptain } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const { VEHICLE_TYPES } = require('../utils/constants');

const router = express.Router();

const emailValidation = body('email').isEmail().withMessage('Invalid email');
const passwordValidation = body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long');

// Captain Registration & Login
router.post(
    '/register',
    authLimiter,
    emailValidation,
    passwordValidation,
    body('fullname.firstname').trim().isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
    body('vehicle.color').trim().isLength({ min: 3 }).withMessage('Color must be at least 3 characters long'),
    body('vehicle.plate').trim().isLength({ min: 3 }).withMessage('Plate must be at least 3 characters long'),
    body('vehicle.capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('vehicle.vehicleType').isIn(VEHICLE_TYPES).withMessage(`Vehicle type must be one of: ${VEHICLE_TYPES.join(', ')}`),
    validate,
    captainController.register,
);

router.post(
    '/login',
    authLimiter,
    emailValidation,
    passwordValidation,
    validate,
    captainController.login,
);

// Protected account routes
router.get('/profile', authCaptain, captainController.getProfile);
router.get('/logout', authCaptain, captainController.logout);

// Password Reset Flow
router.post(
    '/forgot-password',
    authLimiter,
    emailValidation,
    validate,
    captainController.forgotPassword,
);

router.post(
    '/reset-password',
    authLimiter,
    emailValidation,
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Code must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validate,
    captainController.resetPassword,
);

// Captain Status & Location
router.put(
    '/status',
    authCaptain,
    body('status').isIn([ 'active', 'inactive' ]).withMessage('Status must be active or inactive'),
    validate,
    captainController.setStatus,
);

router.post(
    '/location',
    authCaptain,
    body('lat').isFloat({ min: -90, max: 90 }).toFloat(),
    body('lng').isFloat({ min: -180, max: 180 }).toFloat(),
    validate,
    captainController.updateLocation,
);

// Earnings Statistics Dashboard
router.get('/stats', authCaptain, captainController.getStats);

module.exports = router;
