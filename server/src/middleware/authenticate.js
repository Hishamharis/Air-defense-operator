import { verifyAccessToken } from '../utils/jwtUtils.js';
import { unauthorized } from '../utils/responseUtils.js';
import redisClient from '../config/redis.js';
import { User } from '../models/index.js';

export const authenticate = async (req, res, next) => {
    try {
        let token;
        // Priority 1: Authorization Header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Priority 2: Cookie (if applicable, though we rely on Bearer per spec)
        else if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return unauthorized(res, 'Authentication token required');
        }

        const decoded = verifyAccessToken(token);
        if (!decoded) {
            return unauthorized(res, 'Invalid or expired token');
        }

        // Optional: Check if token was blacklisted globally (rare for access tokens, but possible)
        const isBlacklisted = await redisClient.get(`blacklist_token:${token}`);
        if (isBlacklisted) {
            return unauthorized(res, 'Token has been revoked');
        }

        const user = await User.findByPk(decoded.id);
        if (!user) {
            return unauthorized(res, 'User no longer exists');
        }

        req.user = user;
        next();
    } catch (error) {
        return unauthorized(res, 'Authentication failed');
    }
};
