const http = require('http');
const app = require('./app');
const connectToDb = require('./config/db');
const { port } = require('./config/env');
const { initializeSocket } = require('./utils/realtime');

const server = http.createServer(app);

// Attach Socket.IO to the HTTP server instance
initializeSocket(server);

connectToDb()
    .then(() => {
        server.listen(port, () => {
            console.log(`ApnaRide server listening on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to database:', err.message);
        process.exit(1);
    });
