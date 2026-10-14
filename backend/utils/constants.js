const ROLES = Object.freeze({
    USER: 'user',
    CAPTAIN: 'captain',
});

const VEHICLE_TYPES = Object.freeze([ 'auto', 'car', 'moto' ]);

const RIDE_STATUS = Object.freeze({
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
});

// States where rider or captain are considered actively engaged in a ride
const ACTIVE_RIDE_STATUSES = Object.freeze([
    RIDE_STATUS.PENDING,
    RIDE_STATUS.ACCEPTED,
    RIDE_STATUS.ONGOING,
]);

const CAPTAIN_BUSY_STATUSES = Object.freeze([
    RIDE_STATUS.ACCEPTED,
    RIDE_STATUS.ONGOING,
]);

const DISPATCH = Object.freeze({
    RADIUS_METERS: 5000,          // 5 km search radius for nearby captains
    MAX_CAPTAINS_NOTIFIED: 5,     // Nearest captains notified per request
    REQUEST_TTL_MS: 5 * 60 * 1000, // 5 minutes validity for pending ride requests
    MAX_OTP_ATTEMPTS: 5,
});

module.exports = {
    ROLES,
    VEHICLE_TYPES,
    RIDE_STATUS,
    ACTIVE_RIDE_STATUSES,
    CAPTAIN_BUSY_STATUSES,
    DISPATCH,
};
