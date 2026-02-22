import express from 'express';
import multer from 'multer';
import * as replayController from '../controllers/replayController.js';
import { authenticate } from '../middleware/authenticate.js';
import { checkBan } from '../middleware/checkBan.js';
import env from '../config/env.js';

const router = express.Router();

// In memory buffering for compression before disk write
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.REPLAY_MAX_BYTES }
});

router.post('/upload', authenticate, checkBan, upload.single('replayData'), replayController.uploadReplay);

router.get('/', replayController.getPublicReplays); // Public search

router.get('/:id', authenticate, checkBan, replayController.getReplay);

router.get('/:id/stream', replayController.streamReplay);

router.patch('/:id', authenticate, checkBan, replayController.togglePublic);

router.delete('/:id', authenticate, checkBan, replayController.deleteReplay);

export default router;
