import leaderboardService from '../services/leaderboardService.js';
import { success } from '../utils/responseUtils.js';
import { parsePagination } from '../utils/paginationUtils.js';

export const getLeaderboard = async (req, res, next) => {
    try {
        const { period = 'ALLTIME', faction, difficulty } = req.query;
        const { page, limit } = parsePagination(req.query);

        const results = await leaderboardService.getLeaderboard(period.toUpperCase(), faction, difficulty, { offset: (page - 1) * limit, limit });
        return success(res, { leaderboard: results });
    } catch (err) { next(err); }
};

export const getMe = async (req, res, next) => {
    try {
        const { period = 'ALLTIME' } = req.query;
        const rank = await leaderboardService.getUserRank(req.user.id, period.toUpperCase());
        const adjacent = await leaderboardService.getAdjacentRanks(req.user.id, period.toUpperCase(), 5);

        return success(res, { rank, adjacent });
    } catch (err) { next(err); }
};

export const getFactionLeaderboard = async (req, res, next) => {
    try {
        const results = await leaderboardService.getTopN(100, 'ALLTIME'); // Mutilated for stub
        return success(res, { leaderboard: results });
    } catch (err) { next(err); }
};

export const getTopLeaderboard = async (req, res, next) => {
    try {
        const results = await leaderboardService.getTopN(10, 'ALLTIME');
        return success(res, { leaderboard: results });
    } catch (err) { next(err); }
};
