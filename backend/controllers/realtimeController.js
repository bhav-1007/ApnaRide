const Ride = require('../models/ride.model');
const realtime = require('../utils/realtime');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { ROLES } = require('../utils/constants');

/**
 * Realtime channel subscription authorization
 */
const realtimeController = {
    authorize: asyncHandler(async (req, res) => {
        const { socket_id: socketId, channel_name: channel } = req.body;
        const { id, role } = req.actor;

        if (!socketId || !channel) {
            throw new HttpError(400, 'socket_id and channel_name are required');
        }

        const ownChannel = role === ROLES.USER
            ? realtime.channels.user(id)
            : realtime.channels.captain(id);

        let allowed = channel === ownChannel;

        const rideMatch = /^(?:private-)?ride[-:]([a-f\d]{24})$/.exec(channel);
        if (!allowed && rideMatch) {
            allowed = !!(await Ride.exists({
                _id: rideMatch[ 1 ],
                [ role === ROLES.USER ? 'user' : 'captain' ]: id,
            }));
        }

        if (!allowed) {
            throw new HttpError(403, 'You cannot subscribe to this channel');
        }

        res.status(200).json(realtime.authorizeChannel(socketId, channel));
    }),
};

module.exports = realtimeController;
