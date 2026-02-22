import { forbidden } from '../utils/responseUtils.js';

export const checkBan = async (req, res, next) => {
    if (!req.user) {
        return next();
    }

    if (req.user.isBanned) {
        // Check if temporary ban has expired
        if (req.user.banExpiry && new Date() > req.user.banExpiry) {
            req.user.isBanned = false;
            req.user.banExpiry = null;
            req.user.banReason = null;
            await req.user.save();
            return next();
        }

        const reason = req.user.banReason || 'Violations of terms of service';
        if (req.user.banExpiry) {
            return forbidden(res, `Account suspended until ${req.user.banExpiry.toISOString()}. Reason: ${reason}`);
        } else {
            return forbidden(res, `Account permanently banned. Reason: ${reason}`);
        }
    }

    next();
};
