import { sequelize, User, GameSession } from '../models/index.js';
import cacheService from './cacheService.js';

class StatsService {
    async getGlobalStats() {
        const cached = await this.getCachedStat('stats:global');
        if (cached) return cached;
        return await this.aggregateGlobalStats();
    }

    async getFactionStats(faction) {
        const cached = await this.getCachedStat(`stats:faction:${faction}`);
        if (cached) return cached;
        return await this.aggregateFactionStats(faction);
    }

    async getThreatStats() {
        // Stub for threat intercept stats which might require parsing GameSession JSON
        return {
            'CRUISE_MISSILE': { spawned: 1000, intercepted: 950 },
            'BALLISTIC': { spawned: 500, intercepted: 300 }
        };
    }

    async getSystemStats() {
        // Stub for system usage stats
        return {
            'PATRIOT_PAC3': { fired: 50000, hits: 45000 },
            'S400': { fired: 45000, hits: 40000 }
        };
    }

    async aggregateGlobalStats() {
        const totalUsers = await User.count();
        const sessionStats = await GameSession.findOne({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalGamesPlayed'],
                [sequelize.fn('SUM', sequelize.col('totalIntercepted')), 'totalInterceptsMade'],
                [sequelize.fn('AVG', sequelize.col('killRatio')), 'averageKillRatio'],
                [sequelize.fn('SUM', sequelize.col('waveReached')), 'totalWavesCompleted']
            ],
            where: { isCompleted: true },
            raw: true
        });

        const stats = {
            totalUsersRegistered: totalUsers,
            totalGamesPlayed: parseInt(sessionStats.totalGamesPlayed || 0),
            totalInterceptsMade: parseInt(sessionStats.totalInterceptsMade || 0),
            averageKillRatio: parseFloat(sessionStats.averageKillRatio || 0),
            totalWavesCompleted: parseInt(sessionStats.totalWavesCompleted || 0),
            mostPlayedFaction: 'GDI', // Would normally be a group by count query
            hardestWaveSurvivalRate: 0.15
        };

        await this.cacheStat('stats:global', stats, 300); // 5 min
        return stats;
    }

    async aggregateFactionStats(faction) {
        const sessionStats = await GameSession.findOne({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'gamesPlayed'],
                [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
                [sequelize.fn('AVG', sequelize.col('killRatio')), 'averageKillRatio'],
                [sequelize.fn('AVG', sequelize.col('waveReached')), 'averageWaveReached']
            ],
            where: { isCompleted: true, faction },
            raw: true
        });

        const stats = {
            faction,
            gamesPlayed: parseInt(sessionStats.gamesPlayed || 0),
            averageScore: parseInt(sessionStats.averageScore || 0),
            averageKillRatio: parseFloat(sessionStats.averageKillRatio || 0),
            averageWaveReached: parseFloat(sessionStats.averageWaveReached || 1)
        };

        await this.cacheStat(`stats:faction:${faction}`, stats, 300);
        return stats;
    }

    async cacheStat(key, data, ttl) {
        await cacheService.set(key, data, ttl);
    }

    async getCachedStat(key) {
        return await cacheService.get(key);
    }
}

export default new StatsService();
