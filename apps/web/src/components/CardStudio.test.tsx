// @vitest-environment jsdom

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CardStudio } from './CardStudio';
import type { CardConfig } from './CardStudio';
import type { DeckStyle } from '../types/deck';

// Mock child components
vi.mock('./Card', () => ({
    Card: ({ onSelectElement, selectedElement }: any) => (
        <div data-testid="card-mock">
            <button data-testid="select-image" onClick={() => onSelectElement('art')}>Select Image</button>
            <button data-testid="select-text" onClick={() => onSelectElement('title')}>Select Text</button>
            <div data-testid="selected-element">{selectedElement}</div>
        </div>
    )
}));

vi.mock('./AssetManager', () => ({
    AssetManager: ({ isOpen, onClose, onAssetSelect }: any) => (
        isOpen ? (
            <div data-testid="asset-manager-dialog">
                Asset Manager Open
                <button data-testid="dialog-close" onClick={onClose}>Close</button>
                <button data-testid="dialog-select" onClick={() => onAssetSelect({
                    id: 'test-asset',
                    mimeType: 'image/png',
                    driveFileId: 'base64data'
                })}>Select Asset</button>
            </div>
        ) : null
    )
}));

// Mock services
vi.mock('../services/imageService', () => ({
    imageService: {
        processImage: vi.fn()
    }
}));

vi.mock('../services/assetService', () => ({
    assetService: {
        getAssetImageUrl: vi.fn((asset) => `data:${asset.mimeType};base64,${asset.driveFileId}`),
        fetchAssetData: vi.fn((asset) => Promise.resolve(`data:${asset.mimeType};base64,${asset.driveFileId}`)),
        createAsset: vi.fn()
    }
}));

vi.mock('../utils/color', () => ({
    getDominantColor: vi.fn().mockResolvedValue('#ffffff'),
    isLightColor: vi.fn().mockReturnValue(true)
}));


const mockDeckStyle: DeckStyle = {
    elements: [
        { id: 'art', type: 'image', side: 'front', name: 'Art', x: 0, y: 0, width: 100, height: 100, rotate: 0, scale: 1, zIndex: 1, opacity: 1 },
        { id: 'title', type: 'text', side: 'front', name: 'Title', x: 0, y: 0, width: 100, height: 100, rotate: 0, scale: 1, zIndex: 1, opacity: 1, fontFamily: 'sans', fontSize: 12, color: '#000', defaultContent: 'Title' }
    ],
    borderColor: '#000000',
    borderWidth: 12,
    backgroundColor: '#ffffff',
    backgroundImage: null,
    gameHp: '20',
    gameMana: '10',
    gameSuit: '♥',
    svgFrameColor: '#000000',
    svgCornerColor: '#000000',
    svgStrokeWidth: 2
};

const mockCard: CardConfig = {
    id: '1',
    name: 'Test Card',
    data: {
        art: ''
    },
    borderColor: '#000',
    borderWidth: 1
};

describe('CardStudio', () => {
    it('opens AssetManager when "Choose Image" is clicked in ImageControls', () => {
        const onUpdate = vi.fn();
        render(
            <CardStudio
                initialCard={mockCard}
                deckStyle={mockDeckStyle}
                onUpdate={onUpdate}
                onDone={() => { }}
            />
        );

        // Dialog should be closed initially
        expect(screen.queryByTestId('asset-manager-dialog')).not.toBeInTheDocument();

        // Select Image Element
        fireEvent.click(screen.getByTestId('select-image'));

        // Sidebar should appear with "Choose Image" button (since art data is empty)
        const chooseBtn = screen.getByText('Choose Image');
        fireEvent.click(chooseBtn);

        // Dialog should open
        expect(screen.getByTestId('asset-manager-dialog')).toBeInTheDocument();
    });

    it('does NOT open AssetManager when a text element is selected', () => {
        const onUpdate = vi.fn();
        render(
            <CardStudio
                initialCard={mockCard}
                deckStyle={mockDeckStyle}
                onUpdate={onUpdate}
                onDone={() => { }}
            />
        );

        // Select Text Element
        fireEvent.click(screen.getByTestId('select-text'));

        // Dialog should NOT open
        expect(screen.queryByTestId('asset-manager-dialog')).not.toBeInTheDocument();
        // But element should be selected
        expect(screen.getByTestId('selected-element')).toHaveTextContent('title');
    });

    it('updates card config when asset is selected from dialog', async () => {
        const onUpdate = vi.fn();
        render(
            <CardStudio
                initialCard={mockCard}
                deckStyle={mockDeckStyle}
                onUpdate={onUpdate}
                onDone={() => { }}
            />
        );

        // Open Dialog via Sidebar
        fireEvent.click(screen.getByTestId('select-image'));
        fireEvent.click(screen.getByText('Choose Image'));

        // Select asset in dialog
        fireEvent.click(screen.getByTestId('dialog-select'));

        // Dialog should close
        await waitFor(() => {
            expect(screen.queryByTestId('asset-manager-dialog')).not.toBeInTheDocument();
        });

        // onUpdate should be called with new data (data URL from mocked assetService)
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                art: 'data:image/png;base64,base64data'
            })
        }));

    });

    it('removes image and resets transform when confirmed in dialog', async () => {
        const onUpdate = vi.fn();
        const cardWithImage = {
            ...mockCard,
            data: { art: 'image-content' },
            transforms: { art: { x: 10, y: 10, scale: 2 } }
        };

        render(
            <CardStudio
                initialCard={cardWithImage}
                deckStyle={mockDeckStyle}
                onUpdate={onUpdate}
                onDone={() => { }}
            />
        );

        // Select Image Element
        fireEvent.click(screen.getByTestId('select-image'));

        // "Remove" button should be visible (ImageControls renders "Remove" button when hasContent or content is truthy)
        const removeBtn = screen.getByText('Remove');
        fireEvent.click(removeBtn);

        // Confirmation Dialog should appear
        // Since ConfirmationDialog is not mocked and renders into document body via portal or just div...
        // Wait, current implementation is just a div in the component tree.
        expect(screen.getByText('Remove Image')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to remove this image? This action cannot be undone.')).toBeInTheDocument();

        // Click a button with text "Remove"
        // There are two "Remove" texts: one on the button in ImageControls (still visible?), and one in Dialog confirmation button.
        // ImageControls might be covered by Dialog overlay (z-index).
        // Let's use getByRole or verify specific container.
        // The Dialog has a "Remove" button.
        // Or simpler: getByText('Remove', { selector: 'button' }) might return multiple.

        // Let's try finding by role within dialog if we can target dialog.
        // But dialog doesn't have testid.
        // However, "confirmLabel" is "Remove".

        const buttons = screen.getAllByText('Remove', { selector: 'button' });
        // Expected: ImageControls button, Dialog confirm button.
        // The last one should be the dialog button (rendered later).
        const confirmBtn = buttons[buttons.length - 1];

        fireEvent.click(confirmBtn);

        // Verify onUpdate called with empty string and reset transform
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ art: '' }),
            transforms: expect.objectContaining({ art: expect.objectContaining({ x: 0, y: 0, scale: 1 }) })
        }));
    });
});
