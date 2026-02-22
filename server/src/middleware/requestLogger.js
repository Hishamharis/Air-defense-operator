import morgan from 'morgan';
import logger from '../config/logger.js';

const stream = {
    write: (message) => {
        // Log access info at 'http' or 'info' level
        logger.info(message.trim());
    }
};

export const requestLogger = morgan('combined', {
    stream,
    skip: (req, res) => req.url === '/health' // Skip logging frequent health checks
});
