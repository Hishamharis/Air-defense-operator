import zlib from 'zlib';
import { promisify } from 'util';

const gzipSync = promisify(zlib.gzip);

export const encodeFrame = (gameState) => {
    return {
        t: gameState.timestamp,
        th: gameState.threats.map(t => [Math.round(t.x), Math.round(t.y), t.id, t.type]),
        s: gameState.systems.map(s => [s.id, s.magazine]),
        i: gameState.interceptors.map(i => [Math.round(i.x), Math.round(i.y), i.targetId])
    };
};

export const encodeReplay = (frames, metadata) => {
    const rawData = {
        meta: metadata,
        frames: frames
    };
    return Buffer.from(JSON.stringify(rawData), 'utf-8');
};

export const compressReplayBuffer = async (buffer) => {
    return await gzipSync(buffer);
};
