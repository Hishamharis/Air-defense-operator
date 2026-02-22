import userService from '../services/userService.js';
import achievementService from '../services/achievementService.js';
import { success, badRequest, notFound, forbidden, noContent } from '../utils/responseUtils.js';

export const getAllUsers = async (req, res, next) => {
    try {
        // Admin only - handled by middleware
        const users = []; // Mock fetching list
        return success(res, { users, meta: { total: 0 } });
    } catch (err) { next(err); }
};

export const getUserById = async (req, res, next) => {
    try {
        const userProfile = await userService.getUserPublicProfile(req.params.id);
        if (!userProfile) return notFound(res, 'User');

        const stats = await userService.getUserDetailedStats(req.params.id);
        return success(res, { user: userProfile, stats });
    } catch (err) { next(err); }
};

export const updateUser = async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
            return forbidden(res, 'Cannot update another user');
        }

        const updates = {};
        if (req.body.username) {
            const canChange = await userService.checkUsernameChangeEligibility(req.params.id);
            if (!canChange && req.user.role !== 'ADMIN') return badRequest(res, 'Cannot change username again so soon');
            updates.username = req.body.username;
        }
        if (req.body.preferredFaction) updates.preferredFaction = req.body.preferredFaction;

        const updated = await userService.updateUser(req.params.id, updates);
        if (updates.username) await userService.recordUsernameChange(req.params.id);

        return success(res, { user: updated.toPublicJSON() });
    } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
    try {
        // Soft delete via ban
        await userService.updateUser(req.params.id, { isBanned: true, banReason: 'ACCOUNT_DELETED' });
        return noContent(res);
    } catch (err) { next(err); }
};

export const getUserStats = async (req, res, next) => {
    try {
        const stats = await userService.getUserDetailedStats(req.params.id);
        if (!stats) return notFound(res, 'User stats');
        return success(res, { stats });
    } catch (err) { next(err); }
};

export const getUserAchievements = async (req, res, next) => {
    try {
        const achievements = await achievementService.getUserAchievements(req.params.id);
        return success(res, { achievements });
    } catch (err) { next(err); }
};

export const getUserSessions = async (req, res, next) => {
    try {
        // Handled via gameSessionService in a real implementation
        return success(res, { sessions: [], meta: { total: 0 } });
    } catch (err) { next(err); }
};
