import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createApp } from '../src/app';

describe('Server Health Check', () => {
    let app: express.Application;
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        app = createApp();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should return 200 OK for health check endpoint when all variables are set', async () => {
        process.env.GOOGLE_API_KEY = 'test-key';
        process.env.GOOGLE_CUSTOM_SEARCH_CX = 'test-cx';
        process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
        process.env.GOOGLE_CLIENT_ID = 'test-client-id';
        process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
        process.env.TOKEN_ENCRYPTION_KEY = 'test-encryption-key';

        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok', timestamp: expect.any(String) });
    });

    it('should return 200 with status incomplete when variables are missing', async () => {
        // Clear variables
        delete process.env.GOOGLE_API_KEY;

        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('incomplete');
        expect(response.body.missingVariables).toContain('GOOGLE_API_KEY');
    });
});
