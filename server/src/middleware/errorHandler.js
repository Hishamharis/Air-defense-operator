import logger from '../config/logger.js';
import { serverError, unprocessable, conflict, badRequest } from '../utils/responseUtils.js';

export const errorHandler = (err, req, res, next) => {
    if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(e => ({
            field: e.path,
            message: e.message
        }));
        return unprocessable(res, errors);
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        const errors = err.errors.map(e => ({
            field: e.path,
            message: `Value already exists.`
        }));
        return conflict(res, 'Resource already exists', errors);
    }

    if (err.type === 'entity.parse.failed') {
        return badRequest(res, 'Invalid JSON payload');
    }

    // Unhandled errors
    logger.error(`[Unhandled Error] ${err.name}: ${err.message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body
    });

    return serverError(res, 'An unexpected error occurred processing your request.');
};
