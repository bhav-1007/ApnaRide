const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authUser } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

const emailValidation = body('email').isEmail().withMessage('Invalid email');
const passwordValidation = body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long');

// Rider Authentication
router.post(
    '/register',
    authLimiter,
    emailValidation,
    passwordValidation,
    body('fullname.firstname').trim().isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
    validate,
    userController.register,
);

router.post(
    '/login',
    authLimiter,
    emailValidation,
    passwordValidation,
    validate,
    userController.login,
);

// Protected routes
router.get('/profile', authUser, userController.getProfile);
router.get('/logout', authUser, userController.logout);

// Password Reset Flow
router.post(
    '/forgot-password',
    authLimiter,
    emailValidation,
    validate,
    userController.forgotPassword,
);

router.post(
    '/reset-password',
    authLimiter,
    emailValidation,
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Code must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validate,
    userController.resetPassword,
);

module.exports = router;
