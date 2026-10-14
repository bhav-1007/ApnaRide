const express = require('express');
const helmet = require('helmet');
const connectToDb = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { HttpError } = require('./utils/httpError');

const userRoutes = require('./routes/userRoutes');
const captainRoutes = require('./routes/captainRoutes');
const mapRoutes = require('./routes/mapRoutes');
const rideRoutes = require('./routes/rideRoutes');
const realtimeRoutes = require('./routes/realtimeRoutes');

const app = express();

// Trust reverse proxy (Vercel / cloud hosts) for accurate client IP rate limiting
app.set('trust proxy', 1);

// Security headers and body parsers
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS headers for decoupled or serverless deployments
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(apiLimiter);

// Health check endpoints
app.get('/', (req, res) => res.status(200).json({ name: 'ApnaRide API', status: 'ok' }));
app.get('/api', (req, res) => res.status(200).json({ name: 'ApnaRide API', status: 'ok' }));

// Ensure database connection is ready before processing route logic
app.use(async (req, res, next) => {
    try {
        await connectToDb();
        next();
    } catch (err) {
        console.error('Database connection failed:', err.message);
        next(new HttpError(503, 'Service temporarily unavailable'));
    }
});

// Mount routes with /api prefix (for production & proxied requests)
app.use('/api/users', userRoutes);
app.use('/api/captains', captainRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/realtime', realtimeRoutes);

// Direct mount (supports unit/integration tests and direct calls)
app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapRoutes);
app.use('/rides', rideRoutes);
app.use('/realtime', realtimeRoutes);

// Centralized error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
