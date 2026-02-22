import multiplayerService from '../services/multiplayerService.js';
import env from '../config/env.js';

export default (io, socket) => {
    socket.on('spectate-room', async (data, callback) => {
        try {
            const { code } = data;
            const room = await multiplayerService.getRoom(code);

            if (!room) throw new Error('Room not found');
            if (room.status !== 'IN_PROGRESS') throw new Error('Game is not currently active to spectate');
            if (room.currentSpectators >= env.MAX_SPECTATORS_PER_ROOM) throw new Error('Spectator limit reached');

            // Join spectator sub-room
            socket.join(`room:${code}:spectators`);
            socket.join(`room:${code}`); // Standard room for updates but shouldn't emit events

            // Mark socket as spectator context
            socket.isSpectator = true;

            // Increment spectator count internally
            // await multiplayerService.updateRoomInRedis(code, { currentSpectators: room.currentSpectators + 1 });

            if (callback) callback({ success: true, room });
        } catch (err) {
            if (callback) callback({ success: false, error: err.message });
        }
    });
};
