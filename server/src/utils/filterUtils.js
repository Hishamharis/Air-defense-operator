import { Op } from 'sequelize';

export const buildUserFilters = (query) => {
    const where = {};
    if (query.role) where.role = query.role.toUpperCase();
    if (query.isBanned !== undefined) where.isBanned = query.isBanned === 'true';
    if (query.faction) where.preferredFaction = query.faction.toUpperCase();
    if (query.search) {
        where[Op.or] = [
            { username: { [Op.iLike]: `%${query.search}%` } },
            { email: { [Op.iLike]: `%${query.search}%` } }
        ];
    }
    return where;
};

export const buildSessionFilters = (query) => {
    const where = {};
    if (query.faction) where.faction = query.faction;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.isCompleted !== undefined) where.isCompleted = query.isCompleted === 'true';
    if (query.startDate && query.endDate) {
        where.createdAt = {
            [Op.gte]: new Date(query.startDate),
            [Op.lte]: new Date(query.endDate)
        };
    } else if (query.startDate) {
        where.createdAt = { [Op.gte]: new Date(query.startDate) };
    } else if (query.endDate) {
        where.createdAt = { [Op.lte]: new Date(query.endDate) };
    }
    return where;
};

export const buildLeaderboardFilters = (query) => {
    const where = {};
    if (query.faction) where.faction = query.faction;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.period) where.period = query.period.toUpperCase();
    return where;
};

export const buildRoomFilters = (query) => {
    const where = {};
    where.status = query.status ? query.status.toUpperCase() : 'WAITING';
    if (query.isPrivate !== undefined) where.isPrivate = query.isPrivate === 'true';
    if (query.faction) where.faction = query.faction;
    if (query.difficulty) where.difficulty = query.difficulty;
    return where;
};

export const buildAuditFilters = (query) => {
    const where = {};
    if (query.action) where.action = query.action;
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.targetType) where.targetType = query.targetType;
    if (query.startDate && query.endDate) {
        where.createdAt = {
            [Op.between]: [new Date(query.startDate), new Date(query.endDate)]
        };
    }
    return where;
};
