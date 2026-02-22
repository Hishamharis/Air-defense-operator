import Queue from 'bull';
import { GameSession } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';
import env from '../config/env.js';

const sessionCleanupQueue = new Queue('session-cleanup', {
    redis: { host: env.REDIS_HOST, port: env.REDIS_PORT }
});

sessionCleanupQueue.process(async (job) => {
    try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        const [updatedRowsCount] = await GameSession.update(
            { isCompleted: true, score: 0 }, // Abandoned sessions scored 0
            {
                where: {
                    isCompleted: false,
                    createdAt: { [Op.lt]: cutoff }
                }
            }
        );

        logger.debug(`Cleaned up ${updatedRowsCount} stale game sessions.`);
        return { count: updatedRowsCount };
    } catch (err) {
        logger.error('Session cleanup job failed:', err);
        throw err;
    }
});

sessionCleanupQueue.add({}, {
    repeat: { every: env.SESSION_CLEANUP_INTERVAL }
});

export default sessionCleanupQueue;
