import achievementService from '../services/achievementService.js';
import { success, notFound } from '../utils/responseUtils.js';

export const getAllAchievements = async (req, res, next) => {
    try {
        const achievements = await achievementService.getAchievementDefinitions(false);
        return success(res, { achievements });
    } catch (err) { next(err); }
};

export const getAchievement = async (req, res, next) => {
    try {
        // Need to query specific achievement, simplified here
        const achievements = await achievementService.getAchievementDefinitions(true);
        const achievement = achievements.find(a => a.id === req.params.id);
        if (!achievement || (achievement.isHidden && !req.user?.role === 'ADMIN')) return notFound(res, 'Achievement');
        return success(res, { achievement });
    } catch (err) { next(err); }
};
