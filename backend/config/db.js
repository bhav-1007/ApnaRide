const mongoose = require('mongoose');
const { mongoUri } = require('./env');

/**
 * Global cache connection for serverless/Vercel warm starts
 * and local development re-use.
 */
let cached = global.__mongooseCache || (global.__mongooseCache = { promise: null });

async function connectToDb() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 8000,
        }).catch((err) => {
            cached.promise = null; // Allow retry on subsequent requests
            throw err;
        });
    }

    await cached.promise;
    return mongoose.connection;
}

module.exports = connectToDb;
