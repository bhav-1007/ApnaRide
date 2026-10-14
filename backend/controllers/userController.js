const User = require('../models/user.model');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { blacklistToken, requestPasswordReset, resetPassword } = require('../utils/auth');

/**
 * Rider authentication and account controller
 */
const userController = {
    register: asyncHandler(async (req, res) => {
        const { fullname, email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        if (await User.exists({ email: normalizedEmail })) {
            throw new HttpError(409, 'An account with this email already exists');
        }

        const hashedPassword = await User.hashPassword(password);
        const user = await User.create({
            fullname,
            email: normalizedEmail,
            password: hashedPassword,
        });

        const token = user.generateAuthToken();
        const userJson = user.toObject();
        delete userJson.password;

        res.status(201).json({ token, user: userJson });
    }),

    login: asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            throw new HttpError(401, 'Invalid email or password');
        }

        const token = user.generateAuthToken();
        const userJson = user.toObject();
        delete userJson.password;

        res.status(200).json({ token, user: userJson });
    }),

    getProfile: (req, res) => {
        res.status(200).json(req.actor.doc);
    },

    logout: asyncHandler(async (req, res) => {
        await blacklistToken(req.actor.token);
        res.status(200).json({ message: 'Logged out' });
    }),

    forgotPassword: asyncHandler(async (req, res) => {
        await requestPasswordReset(User, req.body.email);
        res.status(200).json({ message: 'If that email is registered, a reset code has been sent.' });
    }),

    resetPassword: asyncHandler(async (req, res) => {
        await resetPassword(User, req.body);
        res.status(200).json({ message: 'Password reset successful. You can now log in.' });
    }),
};

module.exports = userController;
