export const sanitizeInput = (req, res, next) => {
    const sanitizeObj = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Trim whitespace
                obj[key] = obj[key].trim();
                // Strip null bytes
                obj[key] = obj[key].replace(/\0/g, '');

                // Extremely basic NoSQL injection / object prototype pollution defense
                if (key.startsWith('$') || key === '__proto__') {
                    delete obj[key];
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObj(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObj(req.body);
    if (req.query) sanitizeObj(req.query);
    if (req.params) sanitizeObj(req.params);

    next();
};
