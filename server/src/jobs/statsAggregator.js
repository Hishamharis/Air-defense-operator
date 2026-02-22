import Queue from 'bull';
import statsService from '../services/statsService.js';
import logger from '../config/logger.js';
import env from '../config/env.js';

const statsAggregatorQueue = new Queue('stats-aggregator', {
    redis: { host: env.REDIS_HOST, port: env.REDIS_PORT }
});

statsAggregatorQueue.process(async (job) => {
    try {
        await statsService.aggregateGlobalStats();
        // Pre-cache popular factions
        const popularFactions = ['US', 'RU', 'CN', 'IN', 'ON'];
        for (const faction of popularFactions) {
            await statsService.aggregateFactionStats(faction);
        }
        logger.debug('Stats aggregated successfully.');
        return { success: true };
    } catch (err) {
        logger.error('Stats aggregator job failed:', err);
        throw err;
    }
});

statsAggregatorQueue.add({}, {
    repeat: { every: env.STATS_AGGREGATION_INTERVAL }
});

export default statsAggregatorQueue;
