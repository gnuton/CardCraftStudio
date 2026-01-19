import request from 'supertest';
import express from 'express';
import { createApp } from '../src/app';

describe('Server Health Check', () => {
    let app: express.Application;

    beforeEach(() => {
        app = createApp();
    });

    it('should return 200 OK for health check endpoint', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok', timestamp: expect.any(String) });
    });
});
