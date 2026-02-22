import express from 'express';
import * as statsController from '../controllers/statsController.js';

const router = express.Router();

// All public, aggregated cached data
router.get('/global', statsController.getGlobalStats);
router.get('/faction/:faction', statsController.getFactionStats);
router.get('/threats', statsController.getThreatStats);
router.get('/systems', statsController.getSystemStats);

export default router;
