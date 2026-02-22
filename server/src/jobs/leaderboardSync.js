import Queue from 'bull';
import leaderboardService from '../services/leaderboardService.js';
import logger from '../config/logger.js';
import env from '../config/env.js';

const leaderboardSyncQueue = new Queue('leaderboard-sync', {
    redis: { host: env.REDIS_HOST, port: env.REDIS_PORT }
});

leaderboardSyncQueue.process(async (job) => {
    try {
        logger.debug('Starting scheduled leaderboard sync...');

        // Normally you'd scan for updates but since we push directly from game complete,
        // this sync ensures DB and Redis remain in exact match and cleans up stale data.
        await leaderboardService.syncLeaderboardToRedis('DAILY');
        await leaderboardService.syncLeaderboardToRedis('WEEKLY');
        await leaderboardService.syncLeaderboardToRedis('MONTHLY');
        await leaderboardService.syncLeaderboardToRedis('ALLTIME');

        logger.debug('Leaderboard sync complete.');
        return { success: true };
    } catch (err) {
        logger.error('Leaderboard sync failed:', err);
        throw err;
    }
});

// Add recurring job on module load
leaderboardSyncQueue.add({}, {
    repeat: { every: env.LEADERBOARD_SYNC_INTERVAL }
});

export default leaderboardSyncQueue;
