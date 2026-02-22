import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import { corsOptions } from './config/cors.js';
import { sanitizeInput } from './middleware/sanitizeInput.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routers
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import gameSessionsRouter from './routes/gameSessions.js';
import leaderboardRouter from './routes/leaderboard.js';
import replaysRouter from './routes/replays.js';
import statsRouter from './routes/stats.js';
import multiplayerRouter from './routes/multiplayer.js';
import adminRouter from './routes/admin.js';
import achievementsRouter from './routes/achievements.js';
import webhooksRouter from './routes/webhooks.js';

const app = express();

// Global Middlewares (Order matters)
app.use(compression());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", process.env.CLIENT_URL || "http://localhost:5173"],
        },
    },
    crossOriginEmbedderPolicy: false
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger); // morgan + winston
app.use(sanitizeInput);

// Mount API routes
const apiRouter = express.Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/sessions', gameSessionsRouter);
apiRouter.use('/leaderboard', leaderboardRouter);
apiRouter.use('/replays', replaysRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/multiplayer', multiplayerRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/achievements', achievementsRouter);
apiRouter.use('/webhooks', webhooksRouter);

app.use('/api', apiRouter);

// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'API route not found' } });
});

// Global Error Handler
app.use(errorHandler);

export default app;
