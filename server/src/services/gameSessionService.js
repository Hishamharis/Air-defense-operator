import { GameSession, User } from '../models/index.js';
import { calculateScore, assessSessionValidity } from '../utils/gameUtils.js';
import Queue from 'bull';
import env from '../config/env.js';

const achievementQueue = new Queue('achievement-processor', {
    redis: { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD || undefined }
});

class GameSessionService {
    async createSession(userId, faction, difficulty) {
        return await GameSession.create({
            userId,
            faction,
            difficulty
        });
    }

    async updateSession(sessionId, data) {
        const session = await GameSession.findByPk(sessionId);
        if (!session) throw new Error('Session not found');
        return await session.update(data);
    }

    async heartbeat(sessionId, partialStats) {
        // Minimal update logic for actively running sessions
        const session = await GameSession.findByPk(sessionId);
        if (!session || session.isCompleted) return null;

        await session.update({
            waveReached: Math.max(session.waveReached, partialStats.waveReached || 1),
            totalThreatsSpawned: partialStats.totalThreatsSpawned || session.totalThreatsSpawned,
            totalIntercepted: partialStats.totalIntercepted || session.totalIntercepted,
        });
        return session;
    }

    async completeSession(sessionId, finalStats) {
        const session = await GameSession.findByPk(sessionId);
        if (!session) throw new Error('Session not found');
        if (session.isCompleted) return session; // Indempotent

        // Validate stats
        const modifier = finalStats.difficultyModifier || 1.0;
        const score = calculateScore(finalStats, modifier);

        const updatedSession = await session.update({
            ...finalStats,
            score,
            isCompleted: true,
            isMissionSuccess: finalStats.finalHp > 0
        });

        // Anti-cheat verification
        if (!assessSessionValidity(updatedSession)) {
            // In a real app we might flag the user, here we just set score to 0
            updatedSession.score = 0;
            await updatedSession.save();
        } else {
            // Update User Lifetime Stats
            const user = await User.findByPk(session.userId);
            if (user) {
                user.totalGamesPlayed += 1;
                if (updatedSession.isMissionSuccess) user.totalWins += 1;
                user.totalKills += updatedSession.totalIntercepted;
                user.totalBreaches += updatedSession.totalBreached;
                user.totalWavesCompleted += updatedSession.waveReached - 1;
                await user.save();
            }

            // Trigger Background Jobs
            await achievementQueue.add({ userId: session.userId, sessionId: session.id });
        }

        return updatedSession;
    }

    async getSession(sessionId) {
        return await GameSession.findByPk(sessionId, {
            include: ['Replay'] // Adjust based on model association setup
        });
    }

    async getUserSessions(userId, filters, pagination) {
        return await GameSession.findAndCountAll({
            where: { userId, ...filters },
            order: [['createdAt', 'DESC']],
            limit: pagination.limit,
            offset: pagination.offset
        });
    }

    async validateSessionOwnership(sessionId, userId) {
        const session = await GameSession.findByPk(sessionId);
        if (!session) throw new Error('Session not found');
        if (session.userId !== userId) throw new Error('Unauthorized game session access');
        return true;
    }
}

export default new GameSessionService();
