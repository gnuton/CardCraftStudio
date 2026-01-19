import request from 'supertest';
import express from 'express';
import { createApp } from '../src/app';

describe('Premium Middleware', () => {
    let app: express.Application;

    beforeEach(() => {
        app = createApp();
    });

    it('should allow search without premium (for now - free tier)', async () => {
        const response = await request(app)
            .post('/api/images/search')
            .send({ query: 'test' });

        // Search is free, should work
        expect(response.status).not.toBe(403);
    });

    it('should block generate without premium header', async () => {
        const response = await request(app)
            .post('/api/images/generate')
            .send({ prompt: 'test dragon' });

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ error: 'Premium subscription required' });
    });

    it('should allow generate with valid premium header', async () => {
        const response = await request(app)
            .post('/api/images/generate')
            .set('X-Premium-User', 'true')
            .send({ prompt: 'test dragon' });

        // Should not be 403 (will be 500 due to missing env vars, but that's ok for this test)
        expect(response.status).not.toBe(403);
    });
});
