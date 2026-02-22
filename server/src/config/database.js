import { Sequelize } from 'sequelize';
import env from './env.js';
import logger from './logger.js';

export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
        max: env.DB_POOL_MAX,
        min: env.DB_POOL_MIN,
        acquire: env.DB_POOL_ACQUIRE,
        idle: env.DB_POOL_IDLE,
    },
    dialectOptions: env.DB_SSL ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {}
});

export const syncDatabase = async (force = false) => {
    try {
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');
        await sequelize.sync({ force });
        logger.info('Database synchronized.');
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        throw error;
    }
};
