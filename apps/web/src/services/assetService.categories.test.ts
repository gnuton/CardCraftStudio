import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assetService } from './assetService';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
    };
})();

vi.stubGlobal('localStorage', localStorageMock);

const mockedFetch = vi.fn();
global.fetch = mockedFetch;

describe('AssetService Categories', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('cc_auth_token', 'mock-token');
    });

    it('should pass category filter in listAssets', async () => {
        const mockResponse = {
            assets: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
        };

        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        await assetService.listAssets({ category: 'icon' });

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('category=icon'),
            expect.any(Object)
        );
    });

    it('should pass category in createAsset', async () => {
        const mockAsset = { id: '1', category: 'front-background' };
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ asset: mockAsset })
        });

        await assetService.createAsset({
            imageData: 'base64data',
            fileName: 'test.png',
            source: 'uploaded',
            category: 'front-background'
        });

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"category":"front-background"')
            })
        );
    });

    it('should default category to main-illustration in saveGeneratedImage', async () => {
        const mockAsset = { id: '1', category: 'main-illustration' };
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ asset: mockAsset })
        });

        await assetService.saveGeneratedImage('base64', 'prompt', 'style');

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"category":"main-illustration"')
            })
        );
    });

    it('should pass explicit category in saveGeneratedImage', async () => {
        const mockAsset = { id: '1', category: 'back-background' };
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ asset: mockAsset })
        });

        await assetService.saveGeneratedImage(
            'base64',
            'prompt',
            'style',
            undefined,
            undefined,
            'back-background'
        );

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"category":"back-background"')
            })
        );
    });
});
