import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import env from '../config/env.js';

export const hashPassword = async (plaintext) => {
    return await bcrypt.hash(plaintext, env.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (plaintext, hash) => {
    return await bcrypt.compare(plaintext, hash);
};

export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateSecureToken = (byteLength = 32) => {
    return crypto.randomBytes(byteLength).toString('hex');
};

export const generateRoomCode = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
