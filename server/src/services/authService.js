import {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken as verifyJWT,
    verifyRefreshToken as verifyRefreshJWT
} from '../utils/jwtUtils.js';
import { generateSecureToken, hashToken } from '../utils/hashUtils.js';
import cacheService from './cacheService.js';
import emailService from './emailService.js';

class AuthService {
    generateAccessToken(userId, role) {
        return generateAccessToken({ id: userId, role });
    }

    generateRefreshToken(userId) {
        return generateRefreshToken({ id: userId });
    }

    verifyAccessToken(token) {
        return verifyJWT(token);
    }

    verifyRefreshToken(token) {
        return verifyRefreshJWT(token);
    }

    async blacklistRefreshToken(token, userId) {
        // Store hash of token in redis to blacklist it until arbitrary long time (e.g. 7 days matching JWT expiry)
        const tokenHash = hashToken(token);
        await cacheService.set(`blacklist_token:${tokenHash}`, userId, 7 * 24 * 60 * 60);
    }

    async isRefreshTokenBlacklisted(token) {
        const tokenHash = hashToken(token);
        return await cacheService.exists(`blacklist_token:${tokenHash}`);
    }

    generateEmailVerificationToken() {
        return generateSecureToken(32);
    }

    generatePasswordResetToken() {
        return generateSecureToken(32);
    }

    async sendVerificationEmail(user, token) {
        await emailService.sendVerificationEmail(user, token);
    }

    async sendPasswordResetEmail(user, token) {
        await emailService.sendPasswordResetEmail(user, token);
    }

    async storeRefreshTokenInRedis(userId, token) {
        const tokenHash = hashToken(token);
        // Store valid refresh tokens per user for easy revocation
        await cacheService.set(`refresh_token:${userId}:${tokenHash}`, 'valid', 7 * 24 * 60 * 60);
    }

    async revokeAllUserTokens(userId) {
        await cacheService.flushPattern(`refresh_token:${userId}:*`);
    }
}

export default new AuthService();
