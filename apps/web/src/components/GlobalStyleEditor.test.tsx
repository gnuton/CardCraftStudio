import { render, screen, fireEvent, within } from '@testing-library/react';
import { GlobalStyleEditor } from './GlobalStyleEditor';
import { describe, it, expect } from 'vitest';
import type { DeckStyle } from '../App';

const mockDeckStyle: DeckStyle = {
    cornerColor: '#000000',
    titleColor: '#000000',
    descriptionColor: '#000000',
    cornerFont: 'serif',
    titleFont: 'sans-serif',
    descriptionFont: 'sans-serif',
    backgroundImage: null,
    showTitle: true,
    showDescription: true,
    showArt: true,
    titleX: 0, titleY: 0, titleRotate: 0, titleScale: 1, titleWidth: 200,
    descriptionX: 0, descriptionY: 0, descriptionRotate: 0, descriptionScale: 1, descriptionWidth: 250,
    artX: 0, artY: 0, artWidth: 264, artHeight: 164, artRotate: 0,
    showCorner: true, cornerX: -125, cornerY: -185, cornerRotate: 0, cornerWidth: 40, cornerHeight: 40,
    showReversedCorner: true, reversedCornerX: 125, reversedCornerY: 185, reversedCornerRotate: 180, reversedCornerWidth: 40, reversedCornerHeight: 40,
    cardBackBackgroundColor: '#312e81',
    cardBackTitleContent: 'TEST BACK TITLE',
    showCardBackTitle: true,
    cardBackTitleX: 0, cardBackTitleY: 0, cardBackTitleRotate: 0, cardBackTitleScale: 1.5, cardBackTitleWidth: 250,
    gameHp: '20', gameMana: '10', gameSuit: '♥',
    svgFrameColor: '#000000', svgCornerColor: '#000000', svgStrokeWidth: 2,
    borderColor: '#000000', borderWidth: 12, backgroundColor: '#ffffff'
} as DeckStyle;

const mockSampleCard = {
    title: 'Sample Card',
    description: 'Sample Description',
    topLeftContent: 'A',
    bottomRightContent: 'A',
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

        // Check if transform controls (like rotation handle or delete button) appear
        // TransformWrapper renders a div with data-testid or we can check for the RotateCw icon (SVG)
        // Since we don't have testids easily, let's look for the rotation handle via its class or icon
        // Actually, TransformWrapper has a delete button with title "Delete element"
        // Wait, Card.tsx uses renderTransformable which uses TransformWrapper.
        // Let's check for the "RotateCw" icon or simply the presence of transform handles

        // We can check for the presence of the rotation handle wrapper
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

    it('allows deleting and restoring card back elements', async () => {
        render(
            <GlobalStyleEditor
                deckStyle={mockDeckStyle}
                sampleCard={mockSampleCard as any}
                onUpdateStyle={() => { }}
                onBack={() => { }}
            />
        );

        // Flip to back
        const backBtn = screen.getByRole('button', { name: 'Back' });
        fireEvent.click(backBtn);

        // Select Back Title
        const backTitle = screen.getByText('TEST BACK TITLE');
        fireEvent.mouseDown(backTitle);

        // Find delete button and click it
        const deleteBtn = screen.getByTitle('Delete element');
        fireEvent.click(deleteBtn);

        // Expected behavior: Title should disappear
        expect(screen.queryByText('TEST BACK TITLE')).not.toBeInTheDocument();

        // Check if "Card Back Title" restore button appears in side panel
        const restoreBtn = await screen.findByTestId('restore-card-back-title');
        fireEvent.click(restoreBtn);

        // Expected behavior: Title should reappear
        expect(screen.getByText('TEST BACK TITLE')).toBeInTheDocument();
    });
});
