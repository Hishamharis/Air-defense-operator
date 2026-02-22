import express from 'express';
import * as webhookController from '../controllers/webhookController.js';

const router = express.Router();

// Basic external webhooks, e.g. third party integrations
router.post('/ping', webhookController.handlePing);
router.post('/event', webhookController.handleEvent);

export default router;
