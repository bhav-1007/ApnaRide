const express = require('express');
const { authAny } = require('../middleware/authMiddleware');
const realtimeController = require('../controllers/realtimeController');

const router = express.Router();

router.post('/auth', authAny, realtimeController.authorize);

module.exports = router;
