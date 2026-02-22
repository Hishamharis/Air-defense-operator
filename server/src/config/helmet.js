import env from './env.js';

export const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", env.CLIENT_URL || "http://localhost:5173"],
        },
    },
    crossOriginEmbedderPolicy: false
};
