
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CardStudio, CardConfig } from './CardStudio';
import type { DeckStyle } from '../App';

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

vi.mock('./ImageProviderDialog/ImageProviderDialog', () => ({
    ImageProviderDialog: ({ isOpen, onClose, onImageSelect }: any) => (
        isOpen ? (
            <div data-testid="image-provider-dialog">
                Dialog Open
                <button data-testid="dialog-close" onClick={onClose}>Close</button>
                <button data-testid="dialog-select" onClick={() => onImageSelect('ref:new-image')}>Select Image Ref</button>
            </div>
        ) : null
    )
}));

// Mock other dependencies
vi.mock('../services/imageService', () => ({
    imageService: {
        processImage: vi.fn()
    }
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
    it('opens ImageProviderDialog when an image element is selected', () => {
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
        expect(screen.queryByTestId('image-provider-dialog')).not.toBeInTheDocument();

        // Select Image Element
        fireEvent.click(screen.getByTestId('select-image'));

        // Dialog should open
        expect(screen.getByTestId('image-provider-dialog')).toBeInTheDocument();
    });

    it('does NOT open ImageProviderDialog when a text element is selected', () => {
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
        expect(screen.queryByTestId('image-provider-dialog')).not.toBeInTheDocument();
        // But element should be selected
        expect(screen.getByTestId('selected-element')).toHaveTextContent('title');
    });

    it('updates card config when image is selected from dialog', () => {
        const onUpdate = vi.fn();
        render(
            <CardStudio
                initialCard={mockCard}
                deckStyle={mockDeckStyle}
                onUpdate={onUpdate}
                onDone={() => { }}
            />
        );

        // Open Dialog
        fireEvent.click(screen.getByTestId('select-image'));

        // Select image in dialog
        fireEvent.click(screen.getByTestId('dialog-select'));

        // Dialog should close
        expect(screen.queryByTestId('image-provider-dialog')).not.toBeInTheDocument();

        // onUpdate should be called with new data
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                art: 'ref:new-image'
            })
        }));
    });
});
