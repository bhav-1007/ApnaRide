const mongoose = require('mongoose');

// Logged-out JWTs. The TTL index removes each entry once the token would have expired anyway (24 hours).
const blacklistTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, expires: 24 * 60 * 60 },
});

module.exports = mongoose.model('BlacklistToken', blacklistTokenSchema);
