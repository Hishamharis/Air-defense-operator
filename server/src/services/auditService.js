import { AuditLog } from '../models/index.js';
import logger from '../config/logger.js';
import { Op } from 'sequelize';
import { buildAuditFilters } from '../utils/filterUtils.js';

class AuditService {
    async log(actorUserId, action, targetType, targetId, metadata, req) {
        try {
            const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1';
            const userAgent = req?.headers?.['user-agent'] || 'Unknown';

            await AuditLog.create({
                actorUserId,
                action,
                targetType,
                targetId,
                metadata,
                ipAddress,
                userAgent
            });
            logger.debug(`[AUDIT] Action: ${action} by User: ${actorUserId} on ${targetType}:${targetId}`);
        } catch (err) {
            logger.error('Failed to write audit log:', err);
            // Don't throw, prevent failing the main request due to an audit log failure
        }
    }

    async getAuditLogs(queryOptions, pagination) {
        const where = buildAuditFilters(queryOptions);

        return await AuditLog.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: pagination.limit,
            offset: pagination.offset
        });
    }

    async purgeOldLogs(olderThanDays = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const count = await AuditLog.destroy({
            where: {
                createdAt: {
                    [Op.lt]: cutoffDate
                }
            }
        });

        logger.info(`Purged ${count} old audit logs (older than ${olderThanDays} days).`);
        return count;
    }
}

export default new AuditService();
