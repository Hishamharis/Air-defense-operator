import { forbidden } from '../utils/responseUtils.js';

export const authorize = (roles = []) => {
    // Return middleware function
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return forbidden(res, 'You do not have permission to perform this action');
        }
        next();
    };
};
