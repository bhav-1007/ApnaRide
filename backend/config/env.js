// One .env file at the project root serves both the API and the frontend build.
require('dotenv').config();

// Accept common alternative names so an existing .env keeps working
const mongoUri = process.env.MONGODB_URI || process.env.ATLAS_URL;
const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

const values = {
    MONGODB_URI: mongoUri,
    JWT_SECRET: jwtSecret,
};

const missing = Object.keys(values).filter((key) => !values[ key ]);

// Fail fast: validate essential configuration on server boot
if (missing.length && process.env.NODE_ENV !== 'test') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')} (see .env.example)`);
}

module.exports = {
    isProd: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    port: process.env.PORT || 4000,
    mongoUri,
    jwtSecret,
    timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
    smtp: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
};
