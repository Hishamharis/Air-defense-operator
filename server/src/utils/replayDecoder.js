import zlib from 'zlib';
import { promisify } from 'util';
import fs from 'fs/promises';

const gunzipSync = promisify(zlib.gunzip);

export const decompressReplay = async (filePath) => {
    const buffer = await fs.readFile(filePath);
    return await gunzipSync(buffer);
};

export const decodeReplay = (buffer) => {
    const stringData = buffer.toString('utf-8');
    return JSON.parse(stringData);
};

export const extractMetadata = (replayObj) => {
    return replayObj.meta;
};

export const getFrameAtTime = (replayObj, timeMs) => {
    // Binary search or linear search for closest frame timestamp
    const frames = replayObj.frames;
    if (!frames || frames.length === 0) return null;

    let closestIndex = 0;
    let minDiff = Infinity;

    for (let i = 0; i < frames.length; i++) {
        const diff = Math.abs(frames[i].t - timeMs);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        } else if (diff > minDiff) {
            // since ordered, we can break early
            break;
        }
    }
    return frames[closestIndex];
};

export const validateReplayIntegrity = (replayObj) => {
    if (!replayObj || !replayObj.meta || !replayObj.frames) return false;
    if (!Array.isArray(replayObj.frames)) return false;
    return true;
};
