import express from 'express';
import cors from 'cors';
import { imageRouter } from './routes/images';
import { driveRouter } from './routes/drive';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): express.Application => {
    const app = express();

    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : [];

    const defaultOrigins = [
        'http://localhost:5173',
        'http://localhost:5174', // Common fallback port
        'http://localhost:4173',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
    ];

    const whitelist = new Set([...defaultOrigins, ...allowedOrigins]);

    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            if (whitelist.has(origin) ||
                origin.startsWith('http://localhost') ||
                origin.startsWith('http://127.0.0.1')) {
                callback(null, true);
            } else {
                console.warn(`CORS blocked request from origin: ${origin}`);
                callback(null, false);
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-premium-user', 'Accept'],
        credentials: true,
        optionsSuccessStatus: 200
    }));
    app.use(express.json());

    app.get('/health', (req, res) => {
        const requiredVars = [
            'GOOGLE_API_KEY',
            'GOOGLE_CUSTOM_SEARCH_CX',
            'GOOGLE_CLOUD_PROJECT',
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
            'TOKEN_ENCRYPTION_KEY'
        ];

        const missingVars = requiredVars.filter(v => !process.env[v]);

        if (missingVars.length > 0) {
            return res.status(200).json({
                status: 'incomplete',
                timestamp: new Date().toISOString(),
                missingVariables: missingVars,
                message: 'Backend setup is incomplete. Missing required environment variables.'
            });
        }

        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.use('/api/images', imageRouter);
    app.use('/api/drive', driveRouter);

    app.use(errorHandler);

    return app;
};
