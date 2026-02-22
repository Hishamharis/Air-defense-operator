import express from 'express';
import { body } from 'express-validator';
import * as adminController from '../controllers/adminController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { strictLimiter } from '../config/rateLimiter.js';

const router = express.Router();

// Super sensitive routes
router.use(authenticate, authorize(['ADMIN']));

router.get('/users', adminController.getUsers);

router.patch('/users/:id/ban', strictLimiter, [
    body('reason').notEmpty().isString(),
    validateRequest
], adminController.banUser);

router.patch('/users/:id/unban', adminController.unbanUser);

router.patch('/users/:id/role', [
    body('role').isIn(['PLAYER', 'MODERATOR', 'ADMIN']),
    validateRequest
], adminController.changeRole);

router.delete('/sessions/:id', strictLimiter, adminController.deleteSession);
router.delete('/replays/:id', strictLimiter, adminController.deleteReplay);

router.get('/audit', adminController.getAudit);
router.get('/stats', adminController.getStats);

router.post('/achievements', adminController.createAchievement);
router.patch('/achievements/:id', adminController.updateAchievement);

export default router;
