import { User } from '../models/index.js';
import cacheService from './cacheService.js';

class UserService {
    async createUser(data) {
        return await User.create(data);
    }

    async findUserByEmail(email) {
        return await User.findOne({ where: { email: email.toLowerCase() } });
    }

    async findUserByUsername(username) {
        return await User.findOne({ where: { username } });
    }

    async findUserById(id) {
        return await User.findByPk(id);
    }

    async updateUser(id, data) {
        const user = await User.findByPk(id);
        if (!user) throw new Error('User not found');
        return await user.update(data);
    }

    async getUserPublicProfile(id) {
        const user = await await User.findByPk(id);
        return user ? user.toPublicJSON() : null;
    }

    async getUserDetailedStats(id) {
        const cacheKey = `user_detailed_stats:${id}`;
        let stats = await cacheService.get(cacheKey);

        if (!stats) {
            const user = await User.findByPk(id);
            if (!user) return null;

            // In a real scenario, you'd aggregate from GameSessions for deeper stats
            stats = {
                totalGamesPlayed: user.totalGamesPlayed,
                totalWins: user.totalWins,
                totalKills: user.totalKills,
                killRatioAverage: user.totalGamesPlayed > 0 ? (user.totalKills / (user.totalKills + user.totalBreaches)).toFixed(2) : 0,
                totalWavesCompleted: user.totalWavesCompleted,
                preferredFaction: user.preferredFaction
            };

            await cacheService.set(cacheKey, stats, 300); // 5 min cache
        }
        return stats;
    }

    async checkUsernameChangeEligibility(userId) {
        const lastChange = await cacheService.get(`username_change:${userId}`);
        return !lastChange;
    }

    async recordUsernameChange(userId) {
        // Enforce 30 day limit
        await cacheService.set(`username_change:${userId}`, new Date().toISOString(), 30 * 24 * 60 * 60);
    }

    async incrementLoginCount(userId) {
        const user = await User.findByPk(userId);
        if (user) {
            user.loginCount += 1;
            await user.save();
        }
    }

    async updateLastLogin(userId, ip) {
        const user = await User.findByPk(userId);
        if (user) {
            user.lastLoginAt = new Date();
            if (ip) user.lastLoginIp = ip;
            await user.save();
        }
    }
}

export default new UserService();
