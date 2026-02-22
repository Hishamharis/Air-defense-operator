import { Server } from 'socket.io';
import env from './env.js';
import logger from './logger.js';
import { corsOptions } from './cors.js';
import { verifyAccessToken } from '../utils/jwtUtils.js';
import redisClient from './redis.js';

// Sub-handlers
import handleRooms from '../socket/roomHandler.js';
import handleGameEvents from '../socket/gameEventHandler.js';
import handleChat from '../socket/chatHandler.js';
import handleSpectating from '../socket/spectatorHandler.js';

let io;

export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: corsOptions,
        pingTimeout: env.SOCKET_PING_TIMEOUT,
        pingInterval: env.SOCKET_PING_INTERVAL,
        maxHttpBufferSize: 1e6 // 1MB
    });

    // Authentication Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const decoded = verifyAccessToken(token);
            if (!decoded) {
                return next(new Error('Invalid or expired token'));
            }

            socket.user = { id: decoded.id, role: decoded.role };

            // Rate limit connections (max 10 per user)
            const connKey = `user_sockets:${decoded.id}`;
            const activeConns = await redisClient.smembers(connKey);

            // Clean up dead sockets first just in case
            let validConns = 0;
            for (let sid of activeConns) {
                if (io.sockets.sockets.has(sid)) validConns++;
                else await redisClient.srem(connKey, sid);
            }

            if (validConns >= 10) {
                return next(new Error('Maximum connections reached'));
            }

            // Store mapping
            await redisClient.sadd(connKey, socket.id);
            await redisClient.expire(connKey, 86400); // 24h TTL

            logger.info(`Socket connected: ${socket.id} (User: ${decoded.id})`);
            next();

        } catch (error) {
            logger.error(`Socket Auth Error: ${error.message}`);
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {

        // Attach handlers
        handleRooms(io, socket);
        handleGameEvents(io, socket);
        handleChat(io, socket);
        handleSpectating(io, socket);

        socket.on('disconnect', async () => {
            if (socket.user) {
                const connKey = `user_sockets:${socket.user.id}`;
                await redisClient.srem(connKey, socket.id);
                logger.debug(`Socket disconnected: ${socket.id} (User: ${socket.user.id})`);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO has not been initialized. Please call initializeSocket first.');
    }
    return io;
};
