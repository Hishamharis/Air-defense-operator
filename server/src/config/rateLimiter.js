import { rateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from './redis.js';
import env from './env.js';

const createRateLimiter = (windowMs, max, keyPrefix) => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        store: new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
            prefix: keyPrefix
        }),
        message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } }
    });
};

export const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'rl:auth:'); // 5 per 15 min
export const apiLimiter = createRateLimiter(15 * 60 * 1000, 100, 'rl:api:'); // 100 per 15 min
export const strictLimiter = createRateLimiter(60 * 60 * 1000, 3, 'rl:strict:'); // 3 per hour
