import { validationResult } from 'express-validator';
import { unprocessable } from '../utils/responseUtils.js';

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value
        }));
        return unprocessable(res, formattedErrors);
    }
    next();
};
