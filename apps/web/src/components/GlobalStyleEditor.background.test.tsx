// @vitest-environment jsdom
import * as matchers from '@testing-library/jest-dom/matchers';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalStyleEditor } from './GlobalStyleEditor';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DeckStyle } from '../types/deck';
import { assetService } from '../services/assetService';

expect.extend(matchers);

// Mock assetService
vi.mock('../services/assetService', () => ({
    assetService: {
        fetchAssetData: vi.fn(),
        getAssetImageUrl: vi.fn()
    }
}));

// Mock AssetManager to expose onAssetSelect
// We cast props to any to avoid strict typing issues in the mock
vi.mock('./AssetManager', () => ({
    AssetManager: ({ onAssetSelect, isOpen }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="mock-asset-manager">
                <button
                    onClick={() => onAssetSelect({ id: 'test-asset' })}
                    data-testid="select-asset-btn"
                >
                    Select Asset
                </button>
            </div>
        );
    }
}));

// Mock dependencies that we don't care about but are rendered
vi.mock('./Card', () => ({ Card: () => <div data-testid="mock-card">Card Preview</div> }));
vi.mock('./FontPicker', () => ({ FontPicker: () => null }));
vi.mock('../services/templateStorageService', () => ({
    templateStorageService: { listCustomTemplates: async () => [], createFromStyle: vi.fn(), save: vi.fn(), exportToFile: vi.fn() }
}));
vi.mock('../services/googleDrive', () => ({ driveService: { isSignedIn: false, listFiles: async () => [] } }));

const mockDeckStyle: DeckStyle = {
    borderColor: '#000000',
    borderWidth: 12,
    backgroundColor: '#ffffff',
    backgroundImage: null,
    globalFont: 'sans-serif',
    gameHp: '20',
    gameMana: '10',
    gameSuit: '♥',
    svgFrameColor: '#000000',
    svgCornerColor: '#000000',
    svgStrokeWidth: 2,
    cardBackBackgroundColor: '#312e81',
    elements: []
};

describe('GlobalStyleEditor Background Assignment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches asset data and updates front background when asset is selected', async () => {
        const mockOnUpdateStyle = vi.fn();
        const mockImageUrl = 'data:image/png;base64,fake-data';

        // Setup mocks
        (assetService.fetchAssetData as any).mockResolvedValue(mockImageUrl);

        render(
            <GlobalStyleEditor
                deckStyle={mockDeckStyle}
                onUpdateStyle={mockOnUpdateStyle}
                onBack={() => { }}
            />
        );

        // 1. Open Asset Manager (click on "Add Front Image" placeholder)
        const addImageBtn = screen.getByText('Add Front Image');
        fireEvent.click(addImageBtn);

        // 2. Verify Asset Manager is open
        expect(screen.getByTestId('mock-asset-manager')).toBeInTheDocument();

        // 3. Trigger asset selection
        const selectBtn = screen.getByTestId('select-asset-btn');
        fireEvent.click(selectBtn);

        // 4. Verify fetchAssetData was called
        expect(assetService.fetchAssetData).toHaveBeenCalledWith({ id: 'test-asset' });

        // 5. Verify style update with fetched URL
        await waitFor(() => {
            expect(mockOnUpdateStyle).toHaveBeenCalledWith(expect.objectContaining({
                backgroundImage: mockImageUrl
            }));
        });
    });
});
