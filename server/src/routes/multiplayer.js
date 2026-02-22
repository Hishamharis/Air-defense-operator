import express from 'express';
import { body, param } from 'express-validator';
import * as multiplayerController from '../controllers/multiplayerController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { checkBan } from '../middleware/checkBan.js';

const router = express.Router();

router.post('/rooms', authenticate, checkBan, [
    body('name').isString().notEmpty(),
    body('maxPlayers').optional().isInt({ min: 2, max: 8 }),
    body('isPrivate').optional().isBoolean(),
    validateRequest
], multiplayerController.createRoom);

router.get('/rooms', authenticate, checkBan, multiplayerController.getRooms);

router.get('/rooms/:code', authenticate, checkBan, [
    param('code').isLength({ min: 6, max: 6 }).isAlphanumeric(),
    validateRequest
], multiplayerController.getRoom);

router.post('/rooms/:code/join', authenticate, checkBan, [
    param('code').isLength({ min: 6, max: 6 }),
    body('password').optional().isString(),
    validateRequest
], multiplayerController.joinRoom);

router.post('/rooms/:code/leave', authenticate, checkBan, [
    param('code').isLength({ min: 6, max: 6 }),
    validateRequest
], multiplayerController.leaveRoom);

router.delete('/rooms/:code', authenticate, checkBan, multiplayerController.deleteRoom);

export default router;
