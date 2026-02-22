import { Leaderboard, GameSession, User } from '../models/index.js';
import cacheService from './cacheService.js';
import env from '../config/env.js';
import { getISOWeek, getYear, format } from 'date-fns';

class LeaderboardService {

    buildPeriodKey(period, dateInput = new Date()) {
        const d = new Date(dateInput);
        switch (period) {
            case 'DAILY': return format(d, 'yyyy-MM-dd');
            case 'WEEKLY': return `${getYear(d)}-W${getISOWeek(d)}`;
            case 'MONTHLY': return format(d, 'yyyy-MM');
            case 'ALLTIME': return 'ALLTIME';
            default: return 'ALLTIME';
        }
    }

    async updateLeaderboard(gameSession) {
        const userId = gameSession.userId;
        const periods = ['DAILY', 'WEEKLY', 'MONTHLY', 'ALLTIME'];

        for (const p of periods) {
            const periodKey = this.buildPeriodKey(p, gameSession.createdAt);

            // Upsert in Database (saving the historic high score logic)
            const [entry, created] = await Leaderboard.findOrCreate({
                where: { userId, period: p, periodKey },
                defaults: {
                    gameSessionId: gameSession.id,
                    faction: gameSession.faction,
                    difficulty: gameSession.difficulty,
                    score: gameSession.score,
                    killRatio: gameSession.killRatio,
                    waveReached: gameSession.waveReached
                }
            });

            if (!created && gameSession.score > entry.score) {
                await entry.update({
                    gameSessionId: gameSession.id,
                    score: gameSession.score,
                    killRatio: gameSession.killRatio,
                    waveReached: gameSession.waveReached
                });
            }

            // Sync to Redis for real-time reads
            const redisKey = `leaderboard:${p}:${periodKey}`;
            // ZADD automatically updates score if member exists
            const currentObj = await cacheService.zrangebyscore(redisKey, entry.score, entry.score); // Not perfect but...
            // the zadd behaviour will automatically keep the highest if we script it, but since ZADD overrides score, 
            // we must ONLY update if new score is higher.

            // To ensure safe upsert in Redis:
            const currentScore = parseFloat(await cacheService.hget(`score:${redisKey}`, userId)) || 0;
            if (gameSession.score > currentScore) {
                await cacheService.zadd(redisKey, gameSession.score, userId);
                await cacheService.hset(`score:${redisKey}`, userId, gameSession.score);
            }
        }
    }

    async getLeaderboardFromRedis(period, pagination, faction = null) {
        const periodKey = this.buildPeriodKey(period);
        let redisKey = `leaderboard:${period}:${periodKey}`;
        // If faction specific leaderboard exists, use it. But for now we just filter globally.
        // Assuming global key.

        const start = pagination.offset;
        const stop = start + pagination.limit - 1;

        const members = await cacheService.zrange(redisKey, start, stop, true);
        const results = [];

        // Populate results format array: member, score
        for (let i = 0; i < members.length; i += 2) {
            const userId = members[i];
            const score = parseInt(members[i + 1], 10);

            // Fetch username from cache or DB
            const user = await User.findByPk(userId, { attributes: ['username'] });
            results.push({
                rank: start + (i / 2) + 1,
                userId,
                username: user ? user.username : 'Unknown',
                score
            });
        }

        return results;
    }

    async getLeaderboard(period, faction, difficulty, pagination) {
        // Fallback to database if needed, but normally Redis is source of truth
        return await this.getLeaderboardFromRedis(period, pagination, faction);
    }

    async getUserRank(userId, period) {
        const periodKey = this.buildPeriodKey(period);
        const redisKey = `leaderboard:${period}:${periodKey}`;

        const rank = await cacheService.zrevrank(redisKey, userId);
        return rank !== null ? rank + 1 : null;
    }

    async getAdjacentRanks(userId, period, range = 5) {
        const rankIndex = await this.getUserRank(userId, period);
        if (rankIndex === null) return [];

        const start = Math.max(0, rankIndex - 1 - range);
        const end = rankIndex - 1 + range;

        const periodKey = this.buildPeriodKey(period);
        const redisKey = `leaderboard:${period}:${periodKey}`;
        const members = await cacheService.zrange(redisKey, start, end, true);
        // ... transform members similar to getLeaderboardFromRedis ...
        return members; // simplified
    }

    async getTopN(n, period) {
        return await this.getLeaderboardFromRedis(period, { offset: 0, limit: n });
    }

    async syncLeaderboardToRedis(period) {
        // Batch query the Leaderboard table and rebuild the Redis sorted set
        const periodKey = this.buildPeriodKey(period);
        const entries = await Leaderboard.findAll({
            where: { period, periodKey },
            attributes: ['userId', 'score']
        });

        const redisKey = `leaderboard:${period}:${periodKey}`;
        await cacheService.del(redisKey);

        for (const entry of entries) {
            await cacheService.zadd(redisKey, entry.score, entry.userId);
            await cacheService.hset(`score:${redisKey}`, entry.userId, entry.score);
        }
    }

    async invalidateLeaderboardCache(period) {
        const periodKey = this.buildPeriodKey(period);
        await cacheService.del(`leaderboard:${period}:${periodKey}`);
    }
}

export default new LeaderboardService();
