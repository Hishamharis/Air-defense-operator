import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env
if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
    dotenv.config();
}

const requiredVariables = [
    'PORT', 'NODE_ENV',
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'REDIS_HOST', 'REDIS_PORT',
    'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET',
    'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS',
    'CORS_ORIGINS', 'CLIENT_URL'
];

for (const key of requiredVariables) {
    if (!process.env[key]) {
        throw new Error(`CRITICAL: Required environment variable ${key} is missing.`);
    }
}

const env = {
    PORT: parseInt(process.env.PORT, 10) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    DB_HOST: process.env.DB_HOST,
    DB_PORT: parseInt(process.env.DB_PORT, 10),
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_SSL: process.env.DB_SSL === 'true',
    DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    DB_POOL_ACQUIRE: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
    DB_POOL_IDLE: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,

    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: parseInt(process.env.REDIS_PORT, 10),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
    REDIS_TLS: process.env.REDIS_TLS === 'true',

    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT, 10),
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM || 'noreply@airdefensecommand.com',

    CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
    CLIENT_URL: process.env.CLIENT_URL,

    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
    SESSION_SECRET: process.env.SESSION_SECRET || 'fallback_secret',

    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_DIR: process.env.LOG_DIR || './logs',

    ADMIN_REGISTRATION_CODE: process.env.ADMIN_REGISTRATION_CODE || 'admin123',

    SOCKET_PING_TIMEOUT: parseInt(process.env.SOCKET_PING_TIMEOUT, 10) || 5000,
    SOCKET_PING_INTERVAL: parseInt(process.env.SOCKET_PING_INTERVAL, 10) || 10000,

    MAX_PLAYERS_PER_ROOM: parseInt(process.env.MAX_PLAYERS_PER_ROOM, 10) || 4,
    MAX_SPECTATORS_PER_ROOM: parseInt(process.env.MAX_SPECTATORS_PER_ROOM, 10) || 10,

    REPLAY_MAX_BYTES: parseInt(process.env.REPLAY_MAX_BYTES, 10) || 52428800,
    REPLAY_CHUNK_SIZE: parseInt(process.env.REPLAY_CHUNK_SIZE, 10) || 65536,

    ACHIEVEMENT_PROCESSOR_INTERVAL: parseInt(process.env.ACHIEVEMENT_PROCESSOR_INTERVAL, 10) || 30000,
    LEADERBOARD_SYNC_INTERVAL: parseInt(process.env.LEADERBOARD_SYNC_INTERVAL, 10) || 60000,
    SESSION_CLEANUP_INTERVAL: parseInt(process.env.SESSION_CLEANUP_INTERVAL, 10) || 3600000,
    STATS_AGGREGATION_INTERVAL: parseInt(process.env.STATS_AGGREGATION_INTERVAL, 10) || 300000,
};

export default env;
