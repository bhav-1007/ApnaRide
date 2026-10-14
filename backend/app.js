const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
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

// Trust reverse proxy (Render, Vercel, cloud load balancers)
app.set('trust proxy', 1);

// Enable CORS for external frontends and WebSocket handshakes
app.use(cors({
    origin: '*',
    credentials: true,
}));

// Security headers with relaxed CSP for Leaflet map tiles
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(apiLimiter);

// Health check endpoints for Render
app.get('/api/health', (req, res) => res.status(200).json({ name: 'ApnaRide API', status: 'ok', time: new Date() }));
app.get('/api', (req, res) => res.status(200).json({ name: 'ApnaRide API', status: 'ok' }));

// Ensure database connection is ready before processing API route logic
app.use(async (req, res, next) => {
    // Only enforce DB check on API routes or when not serving static assets
    if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/users') ||
        req.path.startsWith('/captains') ||
        req.path.startsWith('/maps') ||
        req.path.startsWith('/rides') ||
        req.path.startsWith('/realtime')
    ) {
        try {
            await connectToDb();
            next();
        } catch (err) {
            console.error('Database connection failed:', err.message);
            next(new HttpError(503, 'Service temporarily unavailable'));
        }
    } else {
        next();
    }
});

// Mount routes with /api prefix (primary standard)
app.use('/api/users', userRoutes);
app.use('/api/captains', captainRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/realtime', realtimeRoutes);

// Direct mount (supports legacy calls)
app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapRoutes);
app.use('/rides', rideRoutes);
app.use('/realtime', realtimeRoutes);

// Static file serving: In production (Render single-service deployment), serve the React frontend build
const clientDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
        if (
            req.path.startsWith('/api') ||
            req.path.startsWith('/socket.io') ||
            req.path.startsWith('/users') ||
            req.path.startsWith('/captains') ||
            req.path.startsWith('/maps') ||
            req.path.startsWith('/rides') ||
            req.path.startsWith('/realtime')
        ) {
            return next();
        }
        res.sendFile(path.join(clientDist, 'index.html'));
    });
} else {
    // Fallback if frontend dist is not built
    app.get('/', (req, res) => res.status(200).json({ name: 'ApnaRide API', status: 'ok' }));
}

// Centralized error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
