
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';
import * as htmlToImage from 'html-to-image';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock html-to-image
vi.mock('html-to-image', () => ({
    toSvg: vi.fn(),
    toPng: vi.fn(),
}));

// Mock deckIO utility
const { mockImportDeckFromZip } = vi.hoisted(() => ({
    mockImportDeckFromZip: vi.fn()
}));

vi.mock('./utils/deckIO', () => ({
    importDeckFromZip: mockImportDeckFromZip,
    exportDeckToZip: vi.fn() // mock export too just in case
}));

vi.mock('./services/db', () => ({
    db: {
        decks: {
            toArray: vi.fn().mockResolvedValue([]),
            bulkPut: vi.fn().mockResolvedValue(undefined),
            put: vi.fn().mockResolvedValue(undefined),
            delete: vi.fn().mockResolvedValue(undefined),
        }
    }
}));

vi.mock('./contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { uid: 'test-uid', email: 'test@example.com', plan: 'free' },
        token: 'test-token',
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
        impersonation: {
            isImpersonating: false,
            targetUser: null,
            adminUser: null,
            sessionId: null,
            expiresAt: null
        },
        exitImpersonation: vi.fn(),
    }),
    AuthProvider: ({ children }: any) => children,
}));

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('crypto', { randomUUID: () => Math.random().toString() });
        localStorage.clear();
    });

    const enterApp = async () => {
        // Wait for loading screen to disappear
        await waitFor(() => {
            expect(screen.queryByText(/Design. Create. Conquer./i)).not.toBeInTheDocument();
        }, { timeout: 6000 });

        // Navigate past Landing Page
        const enterBtn = await screen.findByText(/Enter Studio|Continue as Guest/i);
        fireEvent.click(enterBtn);
    };

    describe('SVG Export', () => {
        it('triggers toSvg and downloads file when Export SVG is clicked', { timeout: 15000 }, async () => {
            const mockDataUrl = 'data:image/svg+xml;base64,fake-svg-content';
            (htmlToImage.toSvg as any).mockResolvedValue(mockDataUrl);

            render(<App />);
            await enterApp();

            // Navigate: Library -> Deck Studio (click the Create New Deck placeholder card)
            const createDeckPlaceholder = await screen.findByText('Create New Deck');
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
        });
    });

    describe('Deletions', () => {
        it('shows confirmation dialog when deleting a deck', { timeout: 15000 }, async () => {
            render(<App />);
            await enterApp();

            // 1. Create Deck
            const createDeckPlaceholder = await screen.findByText('Create New Deck');
            fireEvent.click(createDeckPlaceholder);
            const nameInput = await screen.findByLabelText(/Deck Name/i);
            fireEvent.change(nameInput, { target: { value: 'Deck To Delete' } });
            const createDeckBtn = screen.getByRole('button', { name: /Create Deck/i });
            fireEvent.click(createDeckBtn);

            // 2. Go back to Library
            const logo = await screen.findByTitle('CardCraft Studio');
            fireEvent.click(logo);

            // 3. Find Delete Deck button (Trash icon)
            await waitFor(() => {
                expect(screen.getByText('Deck To Delete')).toBeInTheDocument();
            });

            const deleteBtn = screen.getByTitle('Delete Deck');
            fireEvent.click(deleteBtn);

            // 4. Verify Dialog
            expect(await screen.findByText(/Are you sure you want to delete this deck?/)).toBeInTheDocument();

            // 5. Click Confirm
            const elements = await screen.findAllByText('Delete');
            const confirmBtn = elements.find(el => el.tagName === 'BUTTON');
            if (!confirmBtn) throw new Error("Button not found");
            fireEvent.click(confirmBtn);

            // 6. Verify Deck Gone
            await waitFor(() => {
                expect(screen.queryByText('Deck To Delete')).not.toBeInTheDocument();
            });
        });

        it('shows confirmation dialog when deleting a card', { timeout: 15000 }, async () => {
            render(<App />);
            await enterApp();

            // 1. Create Deck
            const createDeckPlaceholder = await screen.findByText('Create New Deck');
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
            const deleteBtn = await screen.findByTitle('Delete Card');
            fireEvent.click(deleteBtn);

            // 5. Verify Dialog
            expect(await screen.findByText(/Are you sure you want to delete this card?/)).toBeInTheDocument();

            // 6. Click Confirm (The button text is "Delete" based on App.tsx)
            const elements = await screen.findAllByText('Delete');
            const confirmBtn = elements.find(el => el.tagName === 'BUTTON');
            if (!confirmBtn) throw new Error("Delete Button not found");
            fireEvent.click(confirmBtn);

            // 7. Verify Card Gone
            await waitFor(() => {
                expect(screen.queryByText('New Card')).not.toBeInTheDocument();
            });
        });
    });

    describe('Deck Import', () => {
        it('imports a deck from a zip file and adds it to the library', { timeout: 15000 }, async () => {
            // Setup mock implementation
            mockImportDeckFromZip.mockResolvedValue({
                name: 'Imported Deck',
                cards: [{ id: '1', name: 'Card 1', count: 1, data: {}, borderColor: '#000', borderWidth: 1 }],
                style: { backgroundColor: '#fff' }
            });

            render(<App />);
            await enterApp();

            // Ensure we are on Library screen
            expect(await screen.findByText('Decks Library')).toBeInTheDocument();

            // Find file input
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            expect(fileInput).toBeInTheDocument();

            // Simulate file selection
            const file = new File(['dummy'], 'deck.zip', { type: 'application/zip' });
            await act(async () => {
                fireEvent.change(fileInput, { target: { files: [file] } });
            });

            // Verify import was called
            expect(mockImportDeckFromZip).toHaveBeenCalledWith(file);

            // Wait for new deck to appear
            await waitFor(() => {
                expect(screen.getByText('Imported Deck')).toBeInTheDocument();
            });

            // Verify toast success (optional depending on how toast is rendered, but deck appearance is main check)
            // Verify cards count (1 card)
            expect(screen.getByText('1 Cards')).toBeInTheDocument();
        });
    });
});
