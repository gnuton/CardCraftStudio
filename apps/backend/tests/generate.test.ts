import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import { createApp } from '../src/app';
import { googleAiService } from '../src/services/googleAiService';
import { generateTestToken, JWT_SECRET } from './testUtils';

vi.mock('../src/services/googleAiService', () => ({
    googleAiService: {
        generateImage: vi.fn(),
    },
}));

describe('Image Generation API', () => {
    let app: express.Application;

    beforeEach(() => {
        process.env.JWT_SECRET = JWT_SECRET;
        app = createApp();
        vi.clearAllMocks();
    });

    it('should return 400 if prompt is missing', async () => {
        const response = await request(app)
            .post('/api/images/generate')
            .set('Authorization', `Bearer ${generateTestToken()}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ detail: expect.stringContaining('prompt') });
    });

    it('should generate image successfully', async () => {
        const mockBase64 = 'data:image/png;base64,iVBORw0KGgo...';
        const mockFinalPrompt = 'a dragon, fantasy art style';
        (googleAiService.generateImage as any).mockResolvedValue({
            imageBase64: mockBase64,
            finalPrompt: mockFinalPrompt
        });

        const response = await request(app)
            .post('/api/images/generate')
            .set('Authorization', `Bearer ${generateTestToken()}`)
            .send({ prompt: 'a dragon', style: 'fantasy' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            imageBase64: mockBase64,
            prompt: mockFinalPrompt,
            model: 'gemini'
        });
        expect(googleAiService.generateImage).toHaveBeenCalledWith('a dragon', undefined, expect.anything(), 'gemini');
    });

    it('should handle generation errors', async () => {
        (googleAiService.generateImage as any).mockRejectedValue(new Error('Imagen API Error'));

        const response = await request(app)
            .post('/api/images/generate')
            .set('Authorization', `Bearer ${generateTestToken()}`)
            .send({ prompt: 'crash test' });

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({ detail: expect.stringContaining('Imagen API Error') });
    });
});
