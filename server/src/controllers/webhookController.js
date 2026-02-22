import { success } from '../utils/responseUtils.js';

export const handlePing = async (req, res, next) => {
    try {
        return success(res, { message: 'pong' });
    } catch (err) { next(err); }
};

export const handleEvent = async (req, res, next) => {
    try {
        // Handle third party webhooks here (e.g. payment, discord bot integration)
        return success(res, { received: true });
    } catch (err) { next(err); }
};
