import redisClient, { redisSubscriber } from '../config/redis.js';

class CacheService {
    async get(key) {
        const val = await redisClient.get(key);
        if (!val) return null;
        try { return JSON.parse(val); } catch (e) { return val; }
    }

    async set(key, value, ttlSeconds = null) {
        const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        if (ttlSeconds) {
            await redisClient.setex(key, ttlSeconds, valStr);
        } else {
            await redisClient.set(key, valStr);
        }
    }

    async del(key) {
        await redisClient.del(key);
    }

    async exists(key) {
        return await redisClient.exists(key);
    }

    async expire(key, ttlSeconds) {
        await redisClient.expire(key, ttlSeconds);
    }

    async hget(hkey, field) {
        const val = await redisClient.hget(hkey, field);
        if (!val) return null;
        try { return JSON.parse(val); } catch (e) { return val; }
    }

    async hset(hkey, field, value) {
        const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await redisClient.hset(hkey, field, valStr);
    }

    async hgetall(hkey) {
        return await redisClient.hgetall(hkey);
    }

    async zadd(key, score, member) {
        await redisClient.zadd(key, score, member);
    }

    async zrange(key, start, stop, withScores = false) {
        if (withScores) {
            return await redisClient.zrevrange(key, start, stop, 'WITHSCORES');
        }
        return await redisClient.zrevrange(key, start, stop); // Leaderboards usually descending
    }

    async zrank(key, member) {
        // zrevrank is 0-indexed, so add 1 for actual human rank
        return await redisClient.zrevrank(key, member);
    }

    async zrevrank(key, member) {
        return await redisClient.zrevrank(key, member);
    }

    async zrangebyscore(key, min, max, options = {}) {
        const args = [key, max, min]; // revrangebyscore expects max then min
        if (options.withScores) args.push('WITHSCORES');
        if (options.limit) {
            args.push('LIMIT', options.offset || 0, options.limit);
        }
        return await redisClient.zrevrangebyscore(...args);
    }

    async incr(key) {
        return await redisClient.incr(key);
    }

    async publish(channel, message) {
        const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);
        await redisClient.publish(channel, msgStr);
    }

    async subscribe(channel, callback) {
        await redisSubscriber.subscribe(channel);
        redisSubscriber.on('message', (chan, msg) => {
            if (chan === channel) {
                try {
                    callback(JSON.parse(msg));
                } catch (e) {
                    callback(msg);
                }
            }
        });
    }

    async flushPattern(pattern) {
        // Use scan to find keys matching pattern and delete them
        let cursor = '0';
        do {
            const res = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = res[0];
            const keys = res[1];
            if (keys.length > 0) {
                await redisClient.del(...keys);
            }
        } while (cursor !== '0');
    }
}

export default new CacheService();
