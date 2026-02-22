import { User, GameSession, Replay, BannedUser, AuditLog } from '../models/index.js';
import auditService from '../services/auditService.js';
import { success, noContent } from '../utils/responseUtils.js';

export const getUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({ limit: 50 });
        return success(res, { users });
    } catch (err) { next(err); }
};

export const banUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        user.isBanned = true;
        user.banReason = req.body.reason;
        user.banExpiry = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
        await user.save();

        await BannedUser.create({
            userId: user.id,
            bannedByUserId: req.user.id,
            reason: req.body.reason,
            expiresAt: user.banExpiry
        });

        await auditService.log(req.user.id, 'BAN_USER', 'User', user.id, { reason: req.body.reason }, req);
        return success(res, { user: user.toPublicJSON() });
    } catch (err) { next(err); }
};

export const unbanUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        user.isBanned = false;
        user.banReason = null;
        user.banExpiry = null;
        await user.save();

        await auditService.log(req.user.id, 'UNBAN_USER', 'User', user.id, {}, req);
        return success(res, { user: user.toPublicJSON() });
    } catch (err) { next(err); }
};

export const changeRole = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        user.role = req.body.role;
        await user.save();
        await auditService.log(req.user.id, 'CHANGE_ROLE', 'User', user.id, { role: user.role }, req);
        return success(res, { user: user.toPublicJSON() });
    } catch (err) { next(err); }
};

export const deleteSession = async (req, res, next) => {
    try {
        await GameSession.destroy({ where: { id: req.params.id } });
        return noContent(res);
    } catch (err) { next(err); }
};

export const deleteReplay = async (req, res, next) => {
    try {
        await Replay.destroy({ where: { id: req.params.id } });
        return noContent(res);
    } catch (err) { next(err); }
};

export const getAudit = async (req, res, next) => {
    try {
        const logs = await AuditLog.findAll({ limit: 100, order: [['createdAt', 'DESC']] });
        return success(res, { logs });
    } catch (err) { next(err); }
};

export const getStats = async (req, res, next) => {
    try {
        // Fetch server health stats
        return success(res, { stats: { status: 'healthy' } });
    } catch (err) { next(err); }
};

export const createAchievement = async (req, res, next) => {
    try {
        return success(res, { achievement: req.body }); // Stub
    } catch (err) { next(err); }
};

export const updateAchievement = async (req, res, next) => {
    try {
        return success(res, { achievement: req.body }); // Stub
    } catch (err) { next(err); }
};
