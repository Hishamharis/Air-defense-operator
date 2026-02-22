import express from 'express';
import { query } from 'express-validator';
import * as leaderboardController from '../controllers/leaderboardController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Public routes heavily cached
router.get('/', [
    query('period').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'ALLTIME']),
    query('page').optional().isInt({ min: 1 }),
    validateRequest
], leaderboardController.getLeaderboard);

router.get('/faction/:faction', leaderboardController.getFactionLeaderboard);

router.get('/top', leaderboardController.getTopLeaderboard);

// Authenticated
router.get('/me', authenticate, [
    query('period').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'ALLTIME']),
    validateRequest
], leaderboardController.getMe);

export default router;
