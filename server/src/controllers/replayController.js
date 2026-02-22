import replayService from '../services/replayService.js';
import { success, created, badRequest, notFound, noContent } from '../utils/responseUtils.js';
import fs from 'fs';

export const uploadReplay = async (req, res, next) => {
    try {
        if (!req.file) return badRequest(res, 'No replay file uploaded');
        const sessionId = req.body.sessionId;
        if (!sessionId) return badRequest(res, 'Missing sessionId');

        // Note: Memory buffer from Multer
        const replay = await replayService.saveReplay(sessionId, req.user.id, req.file.buffer);
        return created(res, { replay });
    } catch (err) { next(err); }
};

export const getReplay = async (req, res, next) => {
    try {
        const replay = await replayService.getReplay(req.params.id, req.user?.id);
        await replayService.incrementViewCount(replay.id);
        return success(res, { replay });
    } catch (err) { next(err); }
};

export const streamReplay = async (req, res, next) => {
    try {
        const { filePath, fileSize } = await replayService.streamReplay(req.params.id, req.headers.range);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Encoding', 'gzip');
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    } catch (err) { next(err); }
};

export const togglePublic = async (req, res, next) => {
    try {
        const replay = await replayService.toggleReplayPublic(req.params.id, req.user.id);
        return success(res, { replay });
    } catch (err) { next(err); }
};

export const deleteReplay = async (req, res, next) => {
    try {
        await replayService.deleteReplay(req.params.id, req.user.id);
        return noContent(res);
    } catch (err) { next(err); }
};

export const getPublicReplays = async (req, res, next) => {
    try {
        // Stub for paginated public search
        return success(res, { replays: [], meta: { total: 0 } });
    } catch (err) { next(err); }
};
