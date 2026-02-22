import multiplayerService from '../services/multiplayerService.js';
import logger from '../config/logger.js';

export default (io, socket) => {
    socket.on('join-room', async (data, callback) => {
        try {
            const { code, password } = data;
            const room = await multiplayerService.joinRoom(code, socket.user.id, password);

            socket.join(`room:${code}`);

            // Notify others
            socket.to(`room:${code}`).emit('player-joined', { userId: socket.user.id });

            // Acknowledge self
            if (callback) callback({ success: true, room });
            logger.debug(`User ${socket.user.id} joined room ${code}`);
        } catch (err) {
            if (callback) callback({ success: false, error: err.message });
        }
    });

    socket.on('leave-room', async (data, callback) => {
        try {
            const { code } = data;
            await multiplayerService.leaveRoom(code, socket.user.id);
            socket.leave(`room:${code}`);
            socket.to(`room:${code}`).emit('player-left', { userId: socket.user.id });
            if (callback) callback({ success: true });
        } catch (err) {
            if (callback) callback({ success: false, error: err.message });
        }
    });

    socket.on('room-state-request', async (data, callback) => {
        try {
            const room = await multiplayerService.getRoomFromRedis(data.code);
            if (callback) callback({ success: true, room });
        } catch (err) {
            if (callback) callback({ success: false, error: err.message });
        }
    });

    socket.on('start-game', async (data, callback) => {
        try {
            const { code } = data;
            // Validate all players ready -> abstracting, assume OK here
            const room = await multiplayerService.startGame(code, socket.user.id);

            io.to(`room:${code}`).emit('game-starting', { countdown: 3 });
            setTimeout(() => {
                io.to(`room:${code}`).emit('game-started', { gameState: room.gameState });
            }, 3000);

            if (callback) callback({ success: true });
        } catch (err) {
            if (callback) callback({ success: false, error: err.message });
        }
    });

    socket.on('ready-up', async (data, callback) => {
        // Broadcast readiness to room
        io.to(`room:${data.code}`).emit('player-ready-state-changed', { userId: socket.user.id, isReady: data.isReady });
        if (callback) callback({ success: true });
    });

    socket.on('kick-player', async (data, callback) => {
        // Typically host only
        const { code, targetUserId } = data;
        io.to(`room:${code}`).emit('player-kicked', { userId: targetUserId });
        // Target socket would handle leave internally
        if (callback) callback({ success: true });
    });
};
