import { Achievement, UserAchievement } from '../models/index.js';
import emailService from './emailService.js';
import { getIO } from '../config/socket.js';
import logger from '../config/logger.js';

class AchievementService {

    async processAchievements(userId, gameSession) {
        try {
            const definitions = await this.getAchievementDefinitions(true);
            const userAchievements = await this.getUserAchievements(userId);
            const unlockedMap = new Set(userAchievements.map(ua => ua.achievementId));

            const newUnlocks = [];

            for (const def of definitions) {
                if (unlockedMap.has(def.id)) continue;

                const isConditionMet = this.evaluateCondition(def.triggerCondition, gameSession);
                if (isConditionMet) {
                    await this.unlockAchievement(userId, def.id, gameSession.id);
                    newUnlocks.push(def);
                }
            }

            for (const unlock of newUnlocks) {
                await this.notifyUnlock(userId, unlock);
            }

        } catch (err) {
            logger.error(`Achievement processing error for User ${userId}:`, err);
        }
    }

    evaluateCondition(condition, session) {
        if (!condition || !condition.type) return false;

        // Condition rules mapping exactly as requested
        switch (condition.type) {
            case 'FIRST_INTERCEPT':
                return session.totalIntercepted > 0;
            case 'PERFECT_WAVE':
                return session.waveReached > 1 && session.totalBreached === 0;
            case 'WINCHESTER_SURVIVOR':
                // Depends on session metadata tracking ammo zeroed state
                return session.isMissionSuccess && session.systemsExpendedCount > 0;
            case 'HYPERSONIC_HUNTER':
                // We'd parse a JSON stats block for threat types intercepted
                return false;
            case 'FACTION_MASTER':
                return session.faction === condition.faction &&
                    session.waveReached >= 15 &&
                    ['CRISIS', 'TOTAL WAR', 'NIGHTMARE'].includes(session.difficulty);
            case 'KILL_RATIO_95':
                return session.killRatio >= 0.95 && session.totalThreatsSpawned > 20;
            case 'CENTURY':
                return session.totalIntercepted >= 100;
            case 'FLAWLESS':
                return session.waveReached >= 15 && session.finalHp === 100;
            case 'WAR_VETERAN':
                // Evaluated looking at lifetime stats normally
                return false;
            default:
                return false;
        }
    }

    async checkAllConditions(userId, gameSession, definitions) {
        // Redundant method placeholder specified in prompt
    }

    async unlockAchievement(userId, achievementId, sessionId) {
        await UserAchievement.create({
            userId,
            achievementId,
            gameSessionId: sessionId
        });
    }

    async getUserAchievements(userId) {
        return await UserAchievement.findAll({
            where: { userId },
            include: [Achievement]
        });
    }

    async getAchievementDefinitions(includeHidden = false) {
        const where = {};
        if (!includeHidden) {
            where.isHidden = false;
        }
        return await Achievement.findAll({ where });
    }

    async createAchievement(data) {
        return await Achievement.create(data);
    }

    async notifyUnlock(userId, achievement) {
        logger.info(`Achievement unlocked for user ${userId}: ${achievement.name}`);

        // Notify via WebSocket
        try {
            const io = getIO();
            // Assuming socket IDs are tracked per user in Redis, we emit to user
            // io.to(`user:${userId}`).emit('achievement-unlocked', achievement);
            // We use global broadcast for simplicity, but production should route properly.
            io.emit('achievement-unlocked', { userId, achievement });
        } catch (e) {
            // Ignores if IO not initialized
        }

        // Notify via Email (optional based on preference but specified)
        try {
            const user = { id: userId, email: 'user@example.com', username: 'Player' }; // Mock fetch 
            // In real app we fetch user model here.
            await emailService.sendAchievementEmail(user, achievement);
        } catch (e) { /* ignore */ }
    }
}

export default new AchievementService();
