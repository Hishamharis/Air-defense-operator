import Queue from 'bull';
import achievementService from '../services/achievementService.js';
import { GameSession } from '../models/index.js';
import logger from '../config/logger.js';
import env from '../config/env.js';

const achievementQueue = new Queue('achievement-processor', {
    redis: { host: env.REDIS_HOST, port: env.REDIS_PORT }
});

achievementQueue.process(async (job) => {
    const { userId, sessionId } = job.data;
    try {
        const session = await GameSession.findByPk(sessionId);
        if (session) {
            await achievementService.processAchievements(userId, session);
        }
        return { success: true };
    } catch (err) {
        logger.error(`Achievement processing failed for session ${sessionId}:`, err);
        throw err;
    }
});

// Since processAchievements trigger is event based, we don't set a repeat interval here.

export default achievementQueue;
