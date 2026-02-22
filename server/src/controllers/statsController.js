import statsService from '../services/statsService.js';
import { success } from '../utils/responseUtils.js';

export const getGlobalStats = async (req, res, next) => {
    try {
        const stats = await statsService.getGlobalStats();
        return success(res, { stats });
    } catch (err) { next(err); }
};

export const getFactionStats = async (req, res, next) => {
    try {
        const stats = await statsService.getFactionStats(req.params.faction.toUpperCase());
        return success(res, { stats });
    } catch (err) { next(err); }
};

export const getThreatStats = async (req, res, next) => {
    try {
        const stats = await statsService.getThreatStats();
        return success(res, { stats });
    } catch (err) { next(err); }
};

export const getSystemStats = async (req, res, next) => {
    try {
        const stats = await statsService.getSystemStats();
        return success(res, { stats });
    } catch (err) { next(err); }
};
