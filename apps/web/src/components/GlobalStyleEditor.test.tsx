import { render, screen, fireEvent, within } from '@testing-library/react';
import { GlobalStyleEditor } from './GlobalStyleEditor';
import { describe, it, expect } from 'vitest';
import type { DeckStyle } from '../types/deck';

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
    elements: [
        {
            id: 'title',
            type: 'text',
            side: 'front',
            name: 'Title',
            x: 0, y: -180,
            width: 200, height: 40,
            rotate: 0, scale: 1,
            zIndex: 10, opacity: 1,
            color: '#000',
            fontFamily: 'sans-serif',
            fontSize: 16,
            textAlign: 'center',
            defaultContent: 'Title'
        },
        {
            id: 'back_title',
            type: 'text',
            side: 'back',
            name: 'Back Title',
            x: 0, y: 0,
            width: 200, height: 40,
            rotate: 0, scale: 1,
            zIndex: 10, opacity: 1,
            color: '#fff',
            fontFamily: 'sans-serif',
            fontSize: 24,
            textAlign: 'center',
            defaultContent: 'GAME TITLE'
        }
    ]
} as DeckStyle;

const mockSampleCard = {
    id: 'sample',
    name: 'Sample Card',
    data: {
        title: 'Sample Card',
        back_title: 'TEST BACK TITLE'
    }
};

describe('GlobalStyleEditor', () => {
    it('flips the card when Back button is clicked', () => {
        render(
            <GlobalStyleEditor
                deckStyle={mockDeckStyle}
                sampleCard={mockSampleCard as any}
                onUpdateStyle={() => { }}
                onBack={() => { }}
            />
        );

        // Initially shows front (Sample Card title)
        expect(screen.getByText('Sample Card')).toBeInTheDocument();

        // Find and click "Back" button in viewport controls
        const backBtn = screen.getByRole('button', { name: 'Back' });
        fireEvent.click(backBtn);

        // Now should show back title
        expect(screen.getByText('TEST BACK TITLE')).toBeInTheDocument();
    });

    it('shows transform controls when an element is clicked', async () => {
        render(
            <GlobalStyleEditor
                deckStyle={mockDeckStyle}
                sampleCard={mockSampleCard as any}
                onUpdateStyle={() => { }}
                onBack={() => { }}
            />
        );

        // Click on the title to select it
        const titleEl = screen.getByText('Sample Card');
        fireEvent.click(titleEl);

        // TransformWrapper renders rotation and resize handles when element is selected
        // Check for the presence of the rotation handle via its class
        const rotationHandle = document.querySelector('.lucide-rotate-cw');
        expect(rotationHandle).toBeInTheDocument();
    });

    it('does not allow text editing when clicking or double clicking', () => {
        render(
            <GlobalStyleEditor
                deckStyle={mockDeckStyle}
                sampleCard={mockSampleCard as any}
                onUpdateStyle={() => { }}
                onBack={() => { }}
            />
        );

        const cardPreview = screen.getByTestId('card-preview');
        const titleEl = within(cardPreview).getByText('Sample Card');

        // Clicking should select, but NOT show an input or textarea
        fireEvent.click(titleEl);
        expect(within(cardPreview).queryByRole('textbox')).not.toBeInTheDocument();

        // Double clicking should also NOT show an input
        fireEvent.doubleClick(titleEl);
        expect(within(cardPreview).queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('selects element and shows properties in inspector', async () => {
        const mockOnUpdateStyle = vi.fn();

        render(
            <GlobalStyleEditor
                deckStyle={mockDeckStyle}
                sampleCard={mockSampleCard as any}
                onUpdateStyle={mockOnUpdateStyle}
                onBack={() => { }}
            />
        );

        // Click on the title to select it
        const titleEl = screen.getByText('Sample Card');
        fireEvent.click(titleEl);

        // Check that inspector shows "Properties" header when element is selected
        expect(screen.getByText('Properties')).toBeInTheDocument();
    });

    it('adds new text elements with default name', () => {
        const mockOnUpdateStyle = vi.fn();
        render(
            <GlobalStyleEditor
                deckStyle={mockDeckStyle}
                sampleCard={mockSampleCard as any}
                onUpdateStyle={mockOnUpdateStyle}
                onBack={() => { }}
            />
        );

        // Find Add Text button
        const addTextBtn = screen.getByTitle('Add Text');

        // Click once
        fireEvent.click(addTextBtn);

        // Expect update with "New Text" (default from createDefaultElement)
        expect(mockOnUpdateStyle).toHaveBeenLastCalledWith(expect.objectContaining({
            elements: expect.arrayContaining([
                expect.objectContaining({ name: 'New Text' })
            ])
        }));
    });

    it('renders template preview when background image is set', async () => {
        const styleWithBg = {
            ...mockDeckStyle,
            backgroundImage: 'test-bg.jpg'
        };

        render(
            <GlobalStyleEditor
                deckStyle={styleWithBg}
                sampleCard={mockSampleCard as any}
                onUpdateStyle={() => { }}
                onBack={() => { }}
            />
        );

        // Expand Templates group if needed (it is expanded by default in the component)

        // Check for Template Preview image
        // Since ResolvedImage uses useEffect, we need to wait for it
        const previewImg = await screen.findByAltText('Template Preview');
        expect(previewImg).toBeInTheDocument();
        expect(previewImg).toHaveAttribute('src', 'test-bg.jpg');
    });
});

// Need to import vi for the last test
import { vi } from 'vitest';
