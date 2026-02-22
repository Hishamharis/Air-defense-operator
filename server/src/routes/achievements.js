import express from 'express';
import * as achievementController from '../controllers/achievementController.js';

const router = express.Router();

// Public lists
router.get('/', achievementController.getAllAchievements);
router.get('/:id', achievementController.getAchievement);

export default router;
