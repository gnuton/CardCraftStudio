import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { googleSearchService } from '../../src/services/googleSearch';

const mockedFetch = vi.fn();
global.fetch = mockedFetch;

describe('GoogleSearchService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.GOOGLE_API_KEY = 'test-api-key';
        process.env.GOOGLE_CUSTOM_SEARCH_CX = 'test-cx';
    });

    afterEach(() => {
        delete process.env.GOOGLE_API_KEY;
        delete process.env.GOOGLE_CUSTOM_SEARCH_CX;
    });

    it('should call Google API with correct parameters', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        link: 'http://example.com/image.jpg',
                        image: {
                            thumbnailLink: 'http://example.com/thumb.jpg',
                            contextLink: 'http://example.com'
                        },
                        title: 'Test Image',
                    }
                ]
            }),
        });

        const results = await googleSearchService.searchImages('test query', 1, 10);

        expect(mockedFetch).toHaveBeenCalledTimes(1);
        const url = new URL(mockedFetch.mock.calls[0][0]);
        expect(url.hostname).toBe('customsearch.googleapis.com');
        expect(url.pathname).toBe('/customsearch/v1');
        expect(url.searchParams.get('key')).toBe('test-api-key');
        expect(url.searchParams.get('cx')).toBe('test-cx');
        expect(url.searchParams.get('q')).toBe('test query');
        expect(url.searchParams.get('searchType')).toBe('image');
        expect(url.searchParams.get('start')).toBe('1'); // Page 1 -> start 1
        expect(url.searchParams.get('num')).toBe('10');

        expect(results).toHaveLength(1);
        expect(results[0].url).toBe('http://example.com/image.jpg');
    });

    it('should handle API errors', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            statusText: 'Forbidden',
            text: async () => 'Error body'
        });

        await expect(googleSearchService.searchImages('fail', 1, 10))
            .rejects.toThrow('Google Search API error: 403 Forbidden');
    });

    it('should handle empty results', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({}) // No items
        });

        const results = await googleSearchService.searchImages('empty', 1, 10);
        expect(results).toEqual([]);
    });

    it('should calculate start index correctly for pages', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: [] })
        });

        await googleSearchService.searchImages('query', 2, 10);

        const url = new URL(mockedFetch.mock.calls[0][0]);
        // Page 2, size 10. Start = (2-1)*10 + 1 = 11.
        expect(url.searchParams.get('start')).toBe('11');
    });
});
