import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const generateAccessToken = (payload) => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY });
};

export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY });
};

export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (e) {
        return null;
    }
};

export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch (e) {
        return null;
    }
};

export const decodeToken = (token) => {
    return jwt.decode(token);
};

export const getTokenExpiry = (token) => {
    const decoded = jwt.decode(token);
    return decoded && decoded.exp ? decoded.exp * 1000 : null; // in ms
};

export const isTokenExpired = (token) => {
    const exp = getTokenExpiry(token);
    if (!exp) return true;
    return Date.now() >= exp;
};
