const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

let io = null;

// Room naming helpers matching target audiences
const channels = {
    user: (id) => `user:${id}`,
    captain: (id) => `captain:${id}`,
    ride: (id) => `ride:${id}`,
};

const EVENTS = Object.freeze({
    NEW_RIDE: 'new-ride',
    RIDE_ACCEPTED: 'ride-accepted',
    RIDE_STARTED: 'ride-started',
    RIDE_ENDED: 'ride-ended',
    RIDE_CANCELLED: 'ride-cancelled',
    PAYMENT_RECEIVED: 'payment-received',
    CAPTAIN_LOCATION: 'captain-location',
});

/**
 * Initializes the Socket.IO server on top of the Node HTTP server.
 * Includes JWT handshake authentication and room join handlers.
 */
function initializeSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: [ 'GET', 'POST' ],
        },
    });

    // Verify JWT token during handshake if present
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next();
        }
        try {
            const decoded = jwt.verify(token, jwtSecret);
            socket.actor = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        // Automatically join the user's or captain's personal room upon connection
        if (socket.actor) {
            const userRoom = socket.actor.role === 'captain'
                ? channels.captain(socket.actor._id)
                : channels.user(socket.actor._id);
            socket.join(userRoom);
        }

        // Allow clients to join ride tracking rooms (e.g. 'ride:<rideId>')
        socket.on('join', (room) => {
            if (typeof room === 'string' && room.trim()) {
                socket.join(room);
            }
        });

        socket.on('leave', (room) => {
            if (typeof room === 'string' && room.trim()) {
                socket.leave(room);
            }
        });
    });

    return io;
}

function getIO() {
    return io;
}

/**
 * Emits an event to all sockets in a specified room/channel.
 * Fails safely if socket server is not yet attached.
 */
async function publish(channel, event, data) {
    try {
        if (io) {
            io.to(channel).emit(event, data);
        }
    } catch (err) {
        console.error(`[realtime] failed to publish ${event} on ${channel}:`, err.message);
    }
}

// Kept for backward compatibility with existing authorization route
const authorizeChannel = (socketId, channel) => ({ auth: 'ok', socketId, channel });

module.exports = {
    initializeSocket,
    getIO,
    channels,
    EVENTS,
    publish,
    authorizeChannel,
};
