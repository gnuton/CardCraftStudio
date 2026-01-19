import { describe, it, expect, vi, beforeEach } from 'vitest';
import { imageProviderService } from './imageProviderService';

const mockedFetch = vi.fn();
global.fetch = mockedFetch;

describe('ImageProviderService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should search images successfully', async () => {
        const mockResults = [
            { url: 'http://test.com/1.jpg', thumbnail: 'http://test.com/1t.jpg', title: 'Test 1' }
        ];

        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: mockResults })
        });

        const results = await imageProviderService.searchImages('dragon', 1);

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/images/search'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'dragon', page: 1 })
            })
        );
        expect(results).toEqual(mockResults);
    });

    it('should handle search errors', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Server Error'
        });

        await expect(imageProviderService.searchImages('crash', 1))
            .rejects.toThrow('Failed to search images');
    });
});
