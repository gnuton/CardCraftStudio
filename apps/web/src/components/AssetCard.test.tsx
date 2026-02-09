import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AssetCard } from './AssetCard';
import type { Asset } from '../types/asset';

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

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

const mockedFetch = vi.fn();
global.fetch = mockedFetch;

describe('AssetCard', () => {
    const mockAsset: Asset = {
        id: '123',
        userId: 'user-1',
        fileName: 'test-image.png',
        mimeType: 'image/png',
        source: 'uploaded',
        tags: [],
        createdAt: 1234567890,
        updatedAt: 1234567890,
        usageCount: 0
    } as any; // Using any to bypass missing properties if strictly typed

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should fetch image data with correct auth token', async () => {
        // Arrange
        const mockToken = 'mock-asset-token';
        localStorage.setItem('cc_auth_token', mockToken);

        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ dataUrl: 'data:image/png;base64,fake-data' })
        });

        // Act
        render(
            <AssetCard
                asset={mockAsset}
                onClick={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        // Assert
        await waitFor(() => {
            expect(localStorage.getItem).toHaveBeenCalledWith('cc_auth_token');
        });

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/assets/123/data'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': `Bearer ${mockToken}`
                })
            })
        );
    });

    it('should not fetch image if no token is present', async () => {
        // Arrange
        localStorage.removeItem('cc_auth_token');

        // Act
        render(
            <AssetCard
                asset={mockAsset}
                onClick={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        // Assert
        // Should verify that fetch was NOT called for the data endpoint
        await waitFor(() => {
            expect(localStorage.getItem).toHaveBeenCalledWith('cc_auth_token');
        });

        expect(mockedFetch).not.toHaveBeenCalled();
    });

    it('should show "Add to Card" button only in selection mode', () => {
        const { queryByText, rerender } = render(
            <AssetCard
                asset={mockAsset}
                onClick={vi.fn()}
                onDelete={vi.fn()}
                selectionMode={false}
            />
        );

        expect(queryByText('Add to Card')).toBeNull();

        rerender(
            <AssetCard
                asset={mockAsset}
                onClick={vi.fn()}
                onDelete={vi.fn()}
                selectionMode={true}
            />
        );

        expect(queryByText('Add to Card')).toBeInTheDocument();
    });
});
