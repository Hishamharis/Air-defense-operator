import express from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/userController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { checkBan } from '../middleware/checkBan.js';

const router = express.Router();

// Admin sees everyone
router.get('/', authenticate, checkBan, authorize(['ADMIN']), userController.getAllUsers);

router.get('/:id', authenticate, checkBan, userController.getUserById);

router.patch('/:id', authenticate, checkBan, [
    body('username').optional().isString().isLength({ min: 3, max: 24 }),
    body('preferredFaction').optional().isString(),
    validateRequest
], userController.updateUser);

router.delete('/:id', authenticate, authorize(['ADMIN']), userController.deleteUser);

router.get('/:id/stats', authenticate, checkBan, userController.getUserStats);

router.get('/:id/achievements', authenticate, checkBan, userController.getUserAchievements);

router.get('/:id/sessions', authenticate, checkBan, userController.getUserSessions);

export default router;
