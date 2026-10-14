const express = require('express');
const { query } = require('express-validator');
const mapController = require('../controllers/mapController');
const { authUser } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.get(
    '/suggestions',
    authUser,
    query('input').isString().trim().isLength({ min: 3, max: 100 }).withMessage('Search text must be 3-100 characters'),
    validate,
    mapController.suggestions,
);

router.get(
    '/reverse',
    authUser,
    query('lat').isFloat({ min: -90, max: 90 }).toFloat(),
    query('lng').isFloat({ min: -180, max: 180 }).toFloat(),
    validate,
    mapController.reverse,
);

module.exports = router;
