import { Replay } from '../models/index.js';
import { compressReplayBuffer } from '../utils/replayEncoder.js';
import { decodeReplay } from '../utils/replayDecoder.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import env from '../config/env.js';

class ReplayService {
    async saveReplay(sessionId, userId, buffer) {
        const compressed = await compressReplayBuffer(buffer);
        const fileSize = compressed.length;

        // Ensure storage directory exists
        const storageDir = path.resolve(process.cwd(), 'storage', 'replays');
        await fs.mkdir(storageDir, { recursive: true });

        const storageKey = `${crypto.randomUUID()}.json.gz`;
        const filePath = path.join(storageDir, storageKey);

        await fs.writeFile(filePath, compressed);

        // Very basic metadata extraction from uncompressed buffer
        const data = decodeReplay(buffer);

        const replay = await Replay.create({
            gameSessionId: sessionId,
            userId,
            fileSize,
            durationMs: data.meta?.duration || 0,
            frameCount: data.frames?.length || 0,
            compressionType: 'gzip',
            storageKey
        });

        return replay;
    }

    async getReplay(replayId, requestingUserId) {
        const replay = await Replay.findByPk(replayId);
        if (!replay) throw new Error('Replay not found');

        if (!replay.isPublic && replay.userId !== requestingUserId) {
            // Check if admin? Handled at route level usually
            throw new Error('Unauthorized game replay access');
        }

        return replay;
    }

    async streamReplay(replayId, rangeHeader) {
        const replay = await Replay.findByPk(replayId);
        if (!replay) throw new Error('Replay not found');

        const filePath = path.resolve(process.cwd(), 'storage', 'replays', replay.storageKey);

        // This function normally returns readstream and headers
        // Just returning filePath for the controller to handle streaming via fastify/express sendFile
        return { filePath, fileSize: replay.fileSize };
    }

    async toggleReplayPublic(replayId, userId) {
        const replay = await Replay.findByPk(replayId);
        if (!replay) throw new Error('Replay not found');
        if (replay.userId !== userId) throw new Error('Unauthorized');

        replay.isPublic = !replay.isPublic;
        await replay.save();
        return replay;
    }

    async deleteReplay(replayId, userId) {
        const replay = await Replay.findByPk(replayId);
        if (!replay) throw new Error('Replay not found');
        if (replay.userId !== userId) throw new Error('Unauthorized');

        const filePath = path.resolve(process.cwd(), 'storage', 'replays', replay.storageKey);
        try {
            await fs.unlink(filePath);
        } catch (e) { /* ignore missing file */ }

        await replay.destroy();
    }

    async validateReplayOwnership(replayId, userId) {
        const replay = await Replay.findByPk(replayId);
        if (!replay) throw new Error('Replay not found');
        if (replay.userId !== userId) throw new Error('Unauthorized');
        return replay;
    }

    async incrementViewCount(replayId) {
        await Replay.increment('viewCount', { by: 1, where: { id: replayId } });
    }

    async incrementDownloadCount(replayId) {
        await Replay.increment('downloadCount', { by: 1, where: { id: replayId } });
    }
}

export default new ReplayService();
