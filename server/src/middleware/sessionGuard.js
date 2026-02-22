import { GameSession } from '../models/index.js';
import { notFound, forbidden } from '../utils/responseUtils.js';

export const sessionGuard = async (req, res, next) => {
    try {
        const sessionId = req.params.id;
        if (!sessionId) {
            return next(); // Nothing to guard
        }

        const session = await GameSession.findByPk(sessionId);
        if (!session) {
            return notFound(res, 'Game session');
        }

        if (session.userId !== req.user.id) {
            return forbidden(res, 'You do not own this game session');
        }

        req.gameSession = session; // Attach to avoid re-querying
        next();
    } catch (err) {
        next(err);
    }
};
