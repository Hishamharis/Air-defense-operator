import { MultiplayerRoom } from '../models/index.js';
import cacheService from './cacheService.js';
import { generateRoomCode } from '../utils/hashUtils.js';

class MultiplayerService {
    async createRoom(hostUserId, options) {
        const code = generateRoomCode();

        const room = await MultiplayerRoom.create({
            code,
            hostUserId,
            name: options.name,
            maxPlayers: options.maxPlayers || 4,
            isPrivate: options.isPrivate || false,
            password: options.password,
            faction: options.faction,
            difficulty: options.difficulty
        });

        await this.storeRoomInRedis(room);
        return room;
    }

    async joinRoom(code, userId, password) {
        const room = await this.getRoom(code);
        if (!room) throw new Error('Room not found');

        if (room.status !== 'WAITING') throw new Error('Room is already in progress or completed');
        if (room.currentPlayers >= room.maxPlayers) throw new Error('Room is full');

        this.validateRoomPassword(room, password);

        // Normally handled via socket.io to update player list, DB count update
        room.currentPlayers += 1;
        await room.save();
        await this.updateRoomInRedis(code, { currentPlayers: room.currentPlayers });

        return room;
    }

    async leaveRoom(code, userId) {
        const room = await this.getRoom(code);
        if (!room) return;

        room.currentPlayers = Math.max(0, room.currentPlayers - 1);

        if (room.hostUserId === userId) {
            // Need to transfer host logic. Abstracting details here.
            // If empty, mark abandoned.
        }

        if (room.currentPlayers === 0) {
            room.status = 'ABANDONED';
            await this.deleteRoomFromRedis(code);
        } else {
            await this.updateRoomInRedis(code, { currentPlayers: room.currentPlayers });
        }
        await room.save();
    }

    async startGame(code, hostUserId) {
        const room = await this.getRoom(code);
        if (!room) throw new Error('Room not found');
        if (room.hostUserId !== hostUserId) throw new Error('Only the host can start the game');

        room.status = 'IN_PROGRESS';
        room.startedAt = new Date();
        await room.save();
        await this.updateRoomInRedis(code, { status: room.status });
        return room;
    }

    async completeMultiplayerGame(code, results) {
        const room = await this.getRoom(code);
        if (!room) return;

        room.status = 'COMPLETED';
        room.endedAt = new Date();
        room.gameState = results;
        await room.save();
        await this.deleteRoomFromRedis(code);
    }

    async getRooms(filters, pagination) {
        // Find public WAITING rooms
        return await MultiplayerRoom.findAndCountAll({
            where: { ...filters, isPrivate: false, status: 'WAITING' },
            limit: pagination.limit,
            offset: pagination.offset,
            order: [['createdAt', 'DESC']]
        });
    }

    async getRoom(code) {
        return await MultiplayerRoom.findOne({ where: { code } });
    }

    validateRoomPassword(room, password) {
        if (room.isPrivate && room.password !== password) {
            throw new Error('Invalid room password');
        }
    }

    async transferHost(roomId, newHostUserId) {
        const room = await MultiplayerRoom.findByPk(roomId);
        if (room) {
            room.hostUserId = newHostUserId;
            await room.save();
            await this.updateRoomInRedis(room.code, { hostUserId: newHostUserId });
        }
    }

    async storeRoomInRedis(room) {
        await cacheService.set(`room:${room.code}`, room.toJSON(), 86400); // 24h
    }

    async getRoomFromRedis(code) {
        return await cacheService.get(`room:${code}`);
    }

    async updateRoomInRedis(code, updates) {
        const roomStr = await cacheService.get(`room:${code}`);
        if (roomStr) {
            const room = { ...roomStr, ...updates };
            await cacheService.set(`room:${code}`, room, 86400);
        }
    }

    async deleteRoomFromRedis(code) {
        await cacheService.del(`room:${code}`);
    }
}

export default new MultiplayerService();
