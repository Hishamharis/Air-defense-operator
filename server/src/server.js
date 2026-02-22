import http from 'http';
import app from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';
import { syncDatabase, sequelize } from './config/database.js';
import redisClient from './config/redis.js';
import { initializeSocket } from './config/socket.js';

// Import job queues to start them
import './jobs/leaderboardSync.js';
import './jobs/sessionCleanup.js';
import './jobs/achievementProcessor.js';
import './jobs/statsAggregator.js';
import './jobs/emailQueue.js';

const PORT = env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

async function startServer() {
    try {
        logger.info(`Starting Air Defense Command Server on port ${PORT}...`);
        logger.info(`Environment: ${env.NODE_ENV}`);

        // Sync Database
        await syncDatabase(false); // Do not force drop in normal startup
        logger.info('Database sync completed.');

        // Test Redis connection
        await redisClient.ping();
        logger.info('Redis connection verified.');

        server.listen(PORT, () => {
            logger.info(`=========================================`);
            logger.info(` Server successfully running!            `);
            logger.info(` URL:        http://localhost:${PORT}    `);
            logger.info(` DB Host:    ${env.DB_HOST}              `);
            logger.info(` Redis Host: ${env.REDIS_HOST}           `);
            logger.info(` WebSockets: Enabled                     `);
            logger.info(`=========================================`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown logic
async function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    server.close(() => {
        logger.info('HTTP server closed.');
    });

    try {
        if (io) {
            io.close(() => logger.info('Socket.IO server closed.'));
        }
        await sequelize.close();
        logger.info('Database connection closed.');

        await redisClient.quit();
        logger.info('Redis connection closed.');

        // Let queues drain (Bull requires specific handle or wait, assuming process exit handles cleanly)

        logger.info('Graceful shutdown completed. Exiting process.');
        process.exit(0);
    } catch (err) {
        logger.error('Error during graceful shutdown:', err);
        process.exit(1);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
