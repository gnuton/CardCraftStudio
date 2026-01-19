import express from 'express';
import cors from 'cors';
import { imageRouter } from './routes/images';

export const createApp = (): express.Application => {
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.use('/api/images', imageRouter);

    return app;
};
