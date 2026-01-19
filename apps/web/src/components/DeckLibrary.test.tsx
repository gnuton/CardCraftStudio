import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DeckLibrary } from './DeckLibrary';
import type { Deck } from './DeckLibrary';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, onClick, className }: any) => (
            <div onClick={onClick} className={className} data-testid="motion-div">
                {children}
            </div>
        )
    }
}));

describe('DeckLibrary', () => {
    const mockDecks: Deck[] = [
        {
            id: '1',
            name: 'Test Deck 1',
            cards: [],
            style: {} as any,
            updatedAt: Date.now()
        },
        {
            id: '2',
            name: 'Test Deck 2',
            cards: [],
            style: {} as any,
            updatedAt: Date.now()
        }
    ];

    const mockOnCreateDeck = vi.fn();
    const mockOnSelectDeck = vi.fn();
    const mockOnDeleteDeck = vi.fn();
    const mockOnImportDeck = vi.fn();

    it('renders list of decks', () => {
        render(
            <DeckLibrary
                decks={mockDecks}
                onCreateDeck={mockOnCreateDeck}
                onSelectDeck={mockOnSelectDeck}
                onDeleteDeck={mockOnDeleteDeck}
                onImportDeck={mockOnImportDeck}
            />
        );

        expect(screen.getByText('Test Deck 1')).toBeInTheDocument();
        expect(screen.getByText('Test Deck 2')).toBeInTheDocument();
        expect(screen.getByText('My Decks')).toBeInTheDocument();
    });

    it('renders combined Create and Import card', () => {
        render(
            <DeckLibrary
                decks={[]}
                onCreateDeck={mockOnCreateDeck}
                onSelectDeck={mockOnSelectDeck}
                onDeleteDeck={mockOnDeleteDeck}
                onImportDeck={mockOnImportDeck}
            />
        );

        expect(screen.getByText('Create New Deck')).toBeInTheDocument();
        expect(screen.getByText('Import from ZIP')).toBeInTheDocument();
    });

    it('trigger create deck when Create area is clicked', () => {
        render(
            <DeckLibrary
                decks={[]}
                onCreateDeck={mockOnCreateDeck}
                onSelectDeck={mockOnSelectDeck}
                onDeleteDeck={mockOnDeleteDeck}
                onImportDeck={mockOnImportDeck}
            />
        );

        const createArea = screen.getByText('Create New Deck').closest('div');
        fireEvent.click(createArea!);
        expect(mockOnCreateDeck).toHaveBeenCalled();
    });

    it('triggers import deck when file is selected', () => {
        render(
            <DeckLibrary
                decks={[]}
                onCreateDeck={mockOnCreateDeck}
                onSelectDeck={mockOnSelectDeck}
                onDeleteDeck={mockOnDeleteDeck}
                onImportDeck={mockOnImportDeck}
            />
        );

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(fileInput).toBeInTheDocument();

        const file = new File(['dummy content'], 'deck.zip', { type: 'application/zip' });

        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(mockOnImportDeck).toHaveBeenCalledWith(file);
    });

    it('calls onSelectDeck when a deck is clicked', () => {
        render(
            <DeckLibrary
                decks={mockDecks}
                onCreateDeck={mockOnCreateDeck}
                onSelectDeck={mockOnSelectDeck}
                onDeleteDeck={mockOnDeleteDeck}
                onImportDeck={mockOnImportDeck}
            />
        );

        fireEvent.click(screen.getByText('Test Deck 1'));
        expect(mockOnSelectDeck).toHaveBeenCalledWith('1');
    });

    it('calls onDeleteDeck when delete button is clicked', () => {
        render(
            <DeckLibrary
                decks={mockDecks}
                onCreateDeck={mockOnCreateDeck}
                onSelectDeck={mockOnSelectDeck}
                onDeleteDeck={mockOnDeleteDeck}
                onImportDeck={mockOnImportDeck}
            />
        );

        const deleteButtons = screen.getAllByTitle('Delete Deck');
        fireEvent.click(deleteButtons[0]);
        // StopPropagation test might be tricky with simple mock, but we verify call
        expect(mockOnDeleteDeck).toHaveBeenCalledWith('1');
    });
});
