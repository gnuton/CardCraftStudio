import express from 'express';
import cors from 'cors';
import { imageRouter } from './routes/images';

export const createApp = (): express.Application => {
    const app = express();

    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : [];

    const defaultOrigins = [
        'http://localhost:5173',
        'http://localhost:4173'
    ];

    app.use(cors({
        origin: [...defaultOrigins, ...allowedOrigins],
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-premium-user'],
        credentials: true
    }));
    app.use(express.json());

    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.use('/api/images', imageRouter);

    return app;
};
