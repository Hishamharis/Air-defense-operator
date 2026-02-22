import express from 'express';
import { body } from 'express-validator';
import * as sessionController from '../controllers/gameSessionController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { checkBan } from '../middleware/checkBan.js';
import { sessionGuard } from '../middleware/sessionGuard.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.post('/', authenticate, checkBan, [
    body('faction').notEmpty().isString(),
    body('difficulty').notEmpty().isString(),
    validateRequest
], sessionController.createSession);

router.patch('/:id', authenticate, checkBan, sessionGuard, [
    body('waveReached').optional().isInt(),
    body('totalThreatsSpawned').optional().isInt(),
    body('totalIntercepted').optional().isInt(),
    validateRequest
], sessionController.updateSession);

router.post('/:id/complete', authenticate, checkBan, sessionGuard, [
    body('waveReached').isInt(),
    body('finalHp').isInt(),
    body('killRatio').isFloat(),
    validateRequest
], sessionController.completeSession);

router.get('/:id', authenticate, checkBan, sessionController.getSession);

router.get('/', authenticate, authorize(['ADMIN']), sessionController.getAllSessions);

export default router;
