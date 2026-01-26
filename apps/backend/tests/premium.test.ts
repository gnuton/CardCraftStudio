import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import { createApp } from '../src/app';
import { generateTestToken, JWT_SECRET } from './testUtils';

describe('Premium Middleware', () => {
    let app: express.Application;

    beforeEach(() => {
        process.env.JWT_SECRET = JWT_SECRET;
        app = createApp();
    });

    it('should allow search without authentication (free tier)', async () => {
        const response = await request(app)
            .post('/api/images/search')
            .send({ query: 'test' });

        // Search is free, should work (might be 403 due to missing API keys but not 401/403 from premium middleware)
        expect(response.status).not.toBe(401);
    });

    it('should return 401 when generate is called without token', async () => {
        const response = await request(app)
            .post('/api/images/generate')
            .send({ prompt: 'test dragon' });

        expect(response.status).toBe(401);
        expect(response.body.detail).toContain('Please sign in');
    });

    it('should return 403 when generate is called with free plan token', async () => {
        const response = await request(app)
            .post('/api/images/generate')
            .set('Authorization', `Bearer ${generateTestToken('free')}`)
            .send({ prompt: 'test dragon' });

        expect(response.status).toBe(403);
        expect(response.body.detail).toContain('premium subscription');
    });

    it('should allow generate with valid premium token', async () => {
        const response = await request(app)
            .post('/api/images/generate')
            .set('Authorization', `Bearer ${generateTestToken('premium')}`)
            .send({ prompt: 'test dragon' });

        // Should not be 401 or 403
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });
});
