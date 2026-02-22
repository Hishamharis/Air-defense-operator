import gameSessionService from '../services/gameSessionService.js';
import { success, created, badRequest, notFound } from '../utils/responseUtils.js';
import { parsePagination, buildPaginationMeta } from '../utils/paginationUtils.js';

export const createSession = async (req, res, next) => {
    try {
        const { faction, difficulty } = req.body;
        const session = await gameSessionService.createSession(req.user.id, faction, difficulty);
        return created(res, { session });
    } catch (err) { next(err); }
};

export const updateSession = async (req, res, next) => {
    try {
        // Heartbeat update
        const session = await gameSessionService.heartbeat(req.gameSession.id, req.body);
        return success(res, { session });
    } catch (err) { next(err); }
};

export const completeSession = async (req, res, next) => {
    try {
        const session = await gameSessionService.completeSession(req.gameSession.id, req.body);
        return success(res, { session });
    } catch (err) { next(err); }
};

export const getSession = async (req, res, next) => {
    try {
        const session = await gameSessionService.getSession(req.params.id);
        if (!session) return notFound(res, 'Session');
        return success(res, { session });
    } catch (err) { next(err); }
};

export const getAllSessions = async (req, res, next) => {
    try {
        const { page, limit } = parsePagination(req.query);
        // Uses buildSessionFilters via service
        const sessions = await gameSessionService.getUserSessions(req.user.id, {}, { limit, offset: (page - 1) * limit });
        return success(res, {
            sessions: sessions.rows,
            meta: buildPaginationMeta(sessions.count, page, limit)
        });
    } catch (err) { next(err); }
};
