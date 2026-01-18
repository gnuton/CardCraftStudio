
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as htmlToImage from 'html-to-image';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock html-to-image
vi.mock('html-to-image', () => ({
    toSvg: vi.fn(),
    toPng: vi.fn(), // Mock other methods if used
}));

// Mock URL.createObjectURL (not used in current impl but good practice)
// App.tsx uses data URI directly.

describe('App Component SVG Export', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('crypto', { randomUUID: () => Math.random().toString() });
        localStorage.clear();
    });

    it('triggers toSvg and downloads file when Export SVG is clicked', async () => {
        const mockDataUrl = 'data:image/svg+xml;base64,fake-svg-content';
        (htmlToImage.toSvg as any).mockResolvedValue(mockDataUrl);

        render(<App />);

        // Navigate: Library -> Deck Studio (click the Create New Deck placeholder card)
        const createDeckPlaceholder = screen.getByText('Create New Deck');
        fireEvent.click(createDeckPlaceholder);

        // Handle New Deck Dialog
        const nameInput = await screen.findByLabelText(/Deck Name/i);
        fireEvent.change(nameInput, { target: { value: 'Test Deck' } });
        const createDeckBtn = screen.getByRole('button', { name: /Create Deck/i });
        fireEvent.click(createDeckBtn);

        // Navigate: Deck Studio -> Editor (click the Create New Card placeholder)
        const createCardPlaceholder = await screen.findByText('Create New Card');
        fireEvent.click(createCardPlaceholder);

        const exportBtn = await screen.findByRole('button', { name: /Download SVG/i });
        expect(exportBtn).toBeInTheDocument();

        fireEvent.click(exportBtn);

        await waitFor(() => {
            expect(htmlToImage.toSvg).toHaveBeenCalled();
        });

        // We can inspect the arguments if we want to ensure config is passed
        // expect(htmlToImage.toSvg).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ backgroundColor: '#ffffff' }));
    });



    it('shows confirmation dialog when deleting a deck', async () => {
        render(<App />);

        // 1. Create Deck
        const createDeckPlaceholder = screen.getByText('Create New Deck');
        fireEvent.click(createDeckPlaceholder);
        const nameInput = await screen.findByLabelText(/Deck Name/i);
        fireEvent.change(nameInput, { target: { value: 'Deck To Delete' } });
        const createDeckBtn = screen.getByRole('button', { name: /Create Deck/i });
        fireEvent.click(createDeckBtn);

        // 2. Go back to Library
        const logo = await screen.findByTitle('CardCraft Studio');
        fireEvent.click(logo);

        // 3. Find Delete Deck button (Trash icon)
        // It's in the deck card.
        await waitFor(() => {
            expect(screen.getByText('Deck To Delete')).toBeInTheDocument();
        });

        // The bucket button has title "Delete Deck"
        const deleteBtn = screen.getByTitle('Delete Deck');
        fireEvent.click(deleteBtn);

        // 4. Verify Dialog
        // "Are you sure you want to delete this deck? All cards within it will be permanently lost."
        expect(await screen.findByText(/Are you sure you want to delete this deck?/)).toBeInTheDocument();

        // 5. Click Confirm
        // 5. Click Confirm
        const elements = await screen.findAllByText('Delete Deck');
        const confirmBtn = elements.find(el => el.tagName === 'BUTTON');
        if (!confirmBtn) throw new Error("Button not found");
        fireEvent.click(confirmBtn);

        // 6. Verify Deck Gone
        await waitFor(() => {
            expect(screen.queryByText('Deck To Delete')).not.toBeInTheDocument();
        });
    });
    it('shows confirmation dialog when deleting a card', async () => {
        render(<App />);

        // 1. Create Deck
        const createDeckPlaceholder = screen.getByText('Create New Deck');
        fireEvent.click(createDeckPlaceholder);
        const nameInput = await screen.findByLabelText(/Deck Name/i);
        fireEvent.change(nameInput, { target: { value: 'Card Test Deck' } });
        const createDeckBtn = screen.getByRole('button', { name: /Create Deck/i });
        fireEvent.click(createDeckBtn);

        // 2. Add a Card
        const createCardPlaceholder = await screen.findByText('Create New Card');
        fireEvent.click(createCardPlaceholder);

        // 3. Go back to Deck Studio (by clicking Done in Card Studio)
        const doneBtn = await screen.findByRole('button', { name: /Done/i });
        fireEvent.click(doneBtn);

        // 4. Find Delete Card button (Trash icon)
        // It's in the card overlay. In test it might be hidden until hover, but fireEvent.click should work if it's in the DOM.
        const deleteBtn = await screen.findByTitle('Delete Card');
        fireEvent.click(deleteBtn);

        // 5. Verify Dialog
        expect(await screen.findByText(/Are you sure you want to delete this card?/)).toBeInTheDocument();

        // 6. Click Confirm (The button text is "Delete" based on App.tsx)
        const elements = await screen.findAllByText('Delete');
        const confirmBtn = elements.find(el => el.tagName === 'BUTTON');
        if (!confirmBtn) throw new Error("Delete Button not found");
        fireEvent.click(confirmBtn);

        // 7. Verify Card Gone (The card title "New Card" should be gone)
        // Note: The "Create New Card" placeholder remains.
        await waitFor(() => {
            expect(screen.queryByText('New Card')).not.toBeInTheDocument();
        });
    });
});
