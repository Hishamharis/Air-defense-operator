const send = (res, statusCode, success, data = null, error = null, meta = null) => {
    res.status(statusCode).json({ success, data, error, meta });
};

export const success = (res, data = null, meta = null) => {
    send(res, 200, true, data, null, meta);
};

export const created = (res, data = null) => {
    send(res, 201, true, data);
};

export const noContent = (res) => {
    res.status(204).end();
};

export const badRequest = (res, message = 'Bad Request', details = null) => {
    send(res, 400, false, null, { code: 'BAD_REQUEST', message, details });
};

export const unauthorized = (res, message = 'Unauthorized') => {
    send(res, 401, false, null, { code: 'UNAUTHORIZED', message });
};

export const forbidden = (res, message = 'Forbidden') => {
    send(res, 403, false, null, { code: 'FORBIDDEN', message });
};

export const notFound = (res, resource = 'Resource') => {
    send(res, 404, false, null, { code: 'NOT_FOUND', message: `${resource} not found` });
};

export const conflict = (res, message = 'Conflict') => {
    send(res, 409, false, null, { code: 'CONFLICT', message });
};

export const unprocessable = (res, errors) => {
    send(res, 422, false, null, { code: 'UNPROCESSABLE_ENTITY', message: 'Validation failed', details: errors });
};

export const serverError = (res, message = 'Internal Server Error') => {
    send(res, 500, false, null, { code: 'INTERNAL_SERVER_ERROR', message });
};
