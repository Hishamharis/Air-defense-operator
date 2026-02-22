export const parsePagination = (query, defaultLimit = 20, maxLimit = 100) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    let limit = parseInt(query.limit, 10) || defaultLimit;
    if (limit > maxLimit) limit = maxLimit;
    if (limit < 1) limit = defaultLimit;

    return { page, limit };
};

export const buildOffset = (page, limit) => {
    return (page - 1) * limit;
};

export const buildSequelizePagination = (page, limit) => {
    return {
        limit: limit,
        offset: buildOffset(page, limit)
    };
};

export const buildPaginationMeta = (total, page, limit) => {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};
