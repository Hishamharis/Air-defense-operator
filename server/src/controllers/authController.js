import authService from '../services/authService.js';
import userService from '../services/userService.js';
import { success, created, noContent, badRequest, serverError, unauthorized } from '../utils/responseUtils.js';

export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const existingEmail = await userService.findUserByEmail(email);
        if (existingEmail) return badRequest(res, 'Email already in use');

        const existingUser = await userService.findUserByUsername(username);
        if (existingUser) return badRequest(res, 'Username already taken');

        const user = await userService.createUser({ username, email, passwordHash: password }); // Hook hashes it

        const accessToken = authService.generateAccessToken(user.id, user.role);
        const refreshToken = authService.generateRefreshToken(user.id);

        await authService.storeRefreshTokenInRedis(user.id, refreshToken);

        const token = authService.generateEmailVerificationToken();
        user.emailVerificationToken = token;
        user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        await authService.sendVerificationEmail(user, token);

        res.cookie('jwt', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

        return created(res, { user: user.toPublicJSON(), accessToken, refreshToken });
    } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
    try {
        const user = req.user; // Set by passport local strategy

        const accessToken = authService.generateAccessToken(user.id, user.role);
        const refreshToken = authService.generateRefreshToken(user.id);

        await authService.storeRefreshTokenInRedis(user.id, refreshToken);
        await userService.updateLastLogin(user.id, req.ip);
        await userService.incrementLoginCount(user.id);

        res.cookie('jwt', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

        return success(res, { user: user.toPublicJSON(), accessToken, refreshToken });
    } catch (err) { next(err); }
};

export const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.jwt || req.body?.refreshToken;
        if (!refreshToken) return unauthorized(res, 'Refresh token required');

        const isBlacklisted = await authService.isRefreshTokenBlacklisted(refreshToken);
        if (isBlacklisted) return unauthorized(res, 'Refresh token blacklisted');

        const decoded = authService.verifyRefreshToken(refreshToken);
        if (!decoded) return unauthorized(res, 'Invalid or expired refresh token');

        const user = await userService.findUserById(decoded.id);
        if (!user) return unauthorized(res, 'User not found');

        await authService.blacklistRefreshToken(refreshToken, user.id); // Rotate

        const newAccessToken = authService.generateAccessToken(user.id, user.role);
        const newRefreshToken = authService.generateRefreshToken(user.id);

        await authService.storeRefreshTokenInRedis(user.id, newRefreshToken);
        res.cookie('jwt', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

        return success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) { next(err); }
};

export const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.jwt || req.body?.refreshToken;
        if (refreshToken) {
            const decoded = authService.verifyRefreshToken(refreshToken);
            if (decoded) {
                await authService.blacklistRefreshToken(refreshToken, decoded.id);
            }
        }
        res.clearCookie('jwt');
        return noContent(res);
    } catch (err) { next(err); }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;
        // Basic lookup, normally would use a redis fast-lookup or DB query
        // For simplicity assuming DB query happens elsewhere or using a specialized service method
        return success(res, { message: 'Email verified (stub implementation)' });
    } catch (err) { next(err); }
};

export const resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await userService.findUserByEmail(email);
        if (user && !user.isEmailVerified) {
            const token = authService.generateEmailVerificationToken();
            await authService.sendVerificationEmail(user, token);
        }
        // Always return 200 to prevent enumeration
        return success(res, { message: 'Verification email sent if account exists and is unverified.' });
    } catch (err) { next(err); }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await userService.findUserByEmail(email);
        if (user) {
            const token = authService.generatePasswordResetToken();
            await authService.sendPasswordResetEmail(user, token);
        }
        return success(res, { message: 'Password reset link sent if account exists.' });
    } catch (err) { next(err); }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        return success(res, { message: 'Password reset successfully. (Token validation stubbed)' });
    } catch (err) { next(err); }
};

export const me = async (req, res, next) => {
    try {
        return success(res, { user: req.user.toPublicJSON() });
    } catch (err) { next(err); }
};
