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

// Mock DB
vi.mock('./db', () => ({
    db: {
        localAssets: {
            toCollection: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([]),
            }),
            where: vi.fn().mockReturnValue({
                equals: vi.fn().mockReturnValue({
                    toArray: vi.fn().mockResolvedValue([]),
                }),
            }),
            offset: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            toArray: vi.fn().mockResolvedValue([]),
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            orderBy: vi.fn().mockReturnThis(),
            reverse: vi.fn().mockReturnThis(),
            filter: vi.fn().mockReturnThis(),
        },
        images: {
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
        }
    }
}));

describe('AssetService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should include the auth token from localStorage in headers', async () => {
        // Arrange
        const mockToken = 'mock-jwt-token';
        localStorage.setItem('cc_auth_token', mockToken);

        const mockResponse = {
            assets: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
        };

        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        // Act
        await assetService.listAssets();

        // Assert
        expect(localStorage.getItem).toHaveBeenCalledWith('cc_auth_token');

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/assets'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': `Bearer ${mockToken}`
                })
            })
        );
    });

    it('should return local assets if not authenticated', async () => {
        // Arrange
        localStorage.removeItem('cc_auth_token');

        // Act
        const result = await assetService.listAssets();

        // Assert
        expect(result.assets).toEqual([]);
        expect(result.pagination).toBeDefined();
    });
});
