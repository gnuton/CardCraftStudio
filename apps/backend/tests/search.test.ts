import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import { createApp } from '../src/app';
import { googleSearchService } from '../src/services/googleSearch';

// Mock the googleSearchService
vi.mock('../src/services/googleSearch', () => ({
    googleSearchService: {
        searchImages: vi.fn(),
    },
}));

describe('Image Search API', () => {
    let app: express.Application;

    beforeEach(() => {
        app = createApp();
        vi.clearAllMocks();
    });

    it('should return 400 if query is missing', async () => {
        const response = await request(app)
            .post('/api/images/search')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ detail: expect.stringContaining('query') });
    });

    it('should return search results successfully', async () => {
        const mockResults = [
            { url: 'http://example.com/1.jpg', thumbnail: 'http://example.com/1t.jpg', title: 'Test Image 1' }
        ];

        (googleSearchService.searchImages as any).mockResolvedValue(mockResults);

        const response = await request(app)
            .post('/api/images/search')
            .send({ query: 'test dragon' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ results: mockResults });
        expect(googleSearchService.searchImages).toHaveBeenCalledWith('test dragon', 1, 10);
    });

    it('should handle service errors gracefully', async () => {
        (googleSearchService.searchImages as any).mockRejectedValue(new Error('Google API Error'));

        const response = await request(app)
            .post('/api/images/search')
            .send({ query: 'crash test' });

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({ detail: expect.stringContaining('Google API Error') });
    });
});
