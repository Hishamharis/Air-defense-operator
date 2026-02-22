import Redis from 'ioredis';
import env from './env.js';
import logger from './logger.js';

const redisOptions = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    tls: env.REDIS_TLS ? {} : undefined,
    retryStrategy: (times) => {
        const delay = Math.min(times * 1000, 30000); // Exponential backoff max 30s
        logger.warn(`Redis connection lost. Retrying in ${delay}ms...`);
        return delay;
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: true
};

const redisClient = new Redis(redisOptions);

export const redisSubscriber = new Redis(redisOptions);

redisClient.on('connect', () => {
    logger.info('Redis client connected successfully.');
});

redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
});

redisSubscriber.on('connect', () => {
    logger.info('Redis subscriber client connected successfully.');
});

redisSubscriber.on('error', (err) => {
    logger.error('Redis Subscriber Error:', err);
});

export default redisClient;
