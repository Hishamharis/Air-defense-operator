import winston from 'winston';
import 'winston-daily-rotate-file';
import env from './env.js';

const { combine, timestamp, printf, colorize, json } = winston.format;

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message} `;
    if (Object.keys(metadata).length > 0) {
        msg += JSON.stringify(metadata);
    }
    return msg;
});

const fileTransport = new winston.transports.DailyRotateFile({
    filename: `${env.LOG_DIR}/application-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: combine(timestamp(), json())
});

const transports = [fileTransport];

if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
    transports.push(
        new winston.transports.Console({
            format: combine(colorize(), timestamp(), myFormat)
        })
    );
}

// In test environment, only output errors to console to avoid test noise
if (env.NODE_ENV === 'test') {
    transports.push(
        new winston.transports.Console({
            level: 'error',
            format: combine(colorize(), timestamp(), myFormat)
        })
    );
}

const logger = winston.createLogger({
    level: env.LOG_LEVEL,
    transports
});

export default logger;
