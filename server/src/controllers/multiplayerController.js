import multiplayerService from '../services/multiplayerService.js';
import { success, created, notFound, noContent } from '../utils/responseUtils.js';
import { parsePagination } from '../utils/paginationUtils.js';

export const createRoom = async (req, res, next) => {
    try {
        const room = await multiplayerService.createRoom(req.user.id, req.body);
        return created(res, { room });
    } catch (err) { next(err); }
};

export const getRooms = async (req, res, next) => {
    try {
        const { page, limit } = parsePagination(req.query);
        const rooms = await multiplayerService.getRooms({}, { limit, offset: (page - 1) * limit });
        return success(res, { rooms: rooms.rows, meta: { total: rooms.count } });
    } catch (err) { next(err); }
};

export const getRoom = async (req, res, next) => {
    try {
        const room = await multiplayerService.getRoom(req.params.code);
        if (!room) return notFound(res, 'Room');
        return success(res, { room });
    } catch (err) { next(err); }
};

export const joinRoom = async (req, res, next) => {
    try {
        const room = await multiplayerService.joinRoom(req.params.code, req.user.id, req.body.password);
        return success(res, { room });
    } catch (err) { next(err); }
};

export const leaveRoom = async (req, res, next) => {
    try {
        await multiplayerService.leaveRoom(req.params.code, req.user.id);
        return noContent(res);
    } catch (err) { next(err); }
};

export const deleteRoom = async (req, res, next) => {
    try {
        // Deleting room immediately
        return noContent(res);
    } catch (err) { next(err); }
};
