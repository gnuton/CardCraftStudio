import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';
import { driveService } from '../services/googleDrive';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual as any,
        Cloud: () => <div data-testid="icon-cloud" />,
        CloudOff: () => <div data-testid="icon-cloud-off" />,
        CloudAlert: () => <div data-testid="icon-cloud-alert" />,
    };
});

// Mock Drive Service
vi.mock('../services/googleDrive', () => ({
    driveService: {
        init: vi.fn(),
        trySilentSignIn: vi.fn(),
        signIn: vi.fn(),
        get isSignedIn() { return !!this.accessToken },
        accessToken: null,
        saveFile: vi.fn(),
        listFiles: vi.fn(),
        getFileContent: vi.fn(),
    }
}));

describe('Cloud Sync Behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');

        (driveService.init as any).mockResolvedValue(undefined);
        (driveService.listFiles as any).mockResolvedValue([]);
        (driveService.trySilentSignIn as any).mockResolvedValue('fake-token');
        (driveService as any).accessToken = 'fake-token';
    });

    const waitForLoadingToFinish = async () => {
        await waitFor(() => {
            expect(screen.queryByText(/Design. Create. Conquer./i)).not.toBeInTheDocument();
        }, { timeout: 6000 });
    };

    it('Scenario 1: Auto-reconnects if previously enabled and silent sign-in works', async () => {
        localStorage.setItem('cardcraftstudio-sync-enabled', 'true');
        render(<App />);

        await waitFor(() => {
            expect(driveService.init).toHaveBeenCalled();
            expect(driveService.trySilentSignIn).toHaveBeenCalled();
        });

        await waitForLoadingToFinish();

        await waitFor(() => {
            expect(screen.getByTestId('icon-cloud')).toBeInTheDocument();
        });
    });

    it('Scenario 2: Shows prompt if previously enabled but silent sign-in fails (Session Lost)', async () => {
        localStorage.setItem('cardcraftstudio-sync-enabled', 'true');
        (driveService.trySilentSignIn as any).mockRejectedValue(new Error('Session expired'));
        (driveService as any).accessToken = null;

        render(<App />);
        await waitForLoadingToFinish();

        expect(await screen.findByText(/Cloud Sync/i)).toBeInTheDocument();
        expect(await screen.findByText(/Would you like to store and sync/i)).toBeInTheDocument();
    });

    it('Scenario 3: Shows prompt for New User (first session)', async () => {
        localStorage.removeItem('cardcraftstudio-sync-enabled');
        (driveService.trySilentSignIn as any).mockRejectedValue(new Error('Not signed in'));
        (driveService as any).accessToken = null;

        render(<App />);
        await waitForLoadingToFinish();

        expect(await screen.findByText(/Cloud Sync/i)).toBeInTheDocument();
    });

    it('Scenario 4: Does NOT prompt if prompt was already dismissed in this session', async () => {
        localStorage.removeItem('cardcraftstudio-sync-enabled');
        sessionStorage.setItem('cardcraftstudio-sync-prompt-shown', 'true');
        (driveService.trySilentSignIn as any).mockRejectedValue(new Error('Not signed in'));
        (driveService as any).accessToken = null;

        render(<App />);
        await waitForLoadingToFinish();

        expect(screen.queryByText(/Would you like to store and sync/i)).not.toBeInTheDocument();
    });

    it('Scenario 5: Bidirectional Sync - Downloads new decks from cloud', async () => {
        const remoteDeck = { id: 'remote-1', name: 'Cloud Deck', cards: [], updatedAt: Date.now() };
        (driveService.listFiles as any).mockResolvedValue([
            { id: 'file-1', name: 'deck-remote-1.json', modifiedTime: new Date().toISOString() }
        ]);
        (driveService.getFileContent as any).mockResolvedValue(JSON.stringify(remoteDeck));

        render(<App />);
        await waitForLoadingToFinish();

        await screen.findByText(/My Decks/i);
        const syncBtn = screen.getByTitle(/Sync with Google Drive/i);
        fireEvent.click(syncBtn);

        await waitFor(() => {
            expect(screen.getByText('Cloud Deck')).toBeInTheDocument();
        });
    });

    it('Scenario 6: Conflict Detection - Local older than Remote', async () => {
        const localDeck = { id: 'deck-1', name: 'Local Deck', cards: [], updatedAt: 1000 };
        localStorage.setItem('cardcraftstudio-decks', JSON.stringify([localDeck]));

        (driveService.listFiles as any).mockResolvedValue([
            { id: 'file-1', name: 'deck-deck-1.json', modifiedTime: new Date(5000).toISOString() }
        ]);
        // Return different content to trigger conflict
        (driveService.getFileContent as any).mockResolvedValue(JSON.stringify({ ...localDeck, name: 'Remote Name' }));

        render(<App />);
        await waitForLoadingToFinish();

        await screen.findByText('Local Deck');
        const syncBtn = screen.getByTitle(/Sync with Google Drive/i);
        fireEvent.click(syncBtn);

        expect(await screen.findByText(/Sync Conflict Detected/i)).toBeInTheDocument();
        expect(screen.getByText('Local Deck')).toBeInTheDocument();
    });

    it('Scenario 7: No Conflict Prompt if content is identical even if remote is newer', async () => {
        const localDeck = { id: 'deck-1', name: 'Local Deck', cards: [], updatedAt: 1000, style: { cornerColor: '#000000', titleColor: '#000000', descriptionColor: '#000000', cornerFont: 'serif', titleFont: 'sans-serif', descriptionFont: 'sans-serif', backgroundImage: null } };
        localStorage.setItem('cardcraftstudio-decks', JSON.stringify([localDeck]));

        (driveService.listFiles as any).mockResolvedValue([
            { id: 'file-1', name: 'deck-deck-1.json', modifiedTime: new Date(5000).toISOString() }
        ]);
        // Return identical content
        (driveService.getFileContent as any).mockResolvedValue(JSON.stringify(localDeck));

        render(<App />);
        await waitForLoadingToFinish();

        await screen.findByText('Local Deck');
        const syncBtn = screen.getByTitle(/Sync with Google Drive/i);
        fireEvent.click(syncBtn);

        // Conflict dialog should NOT appear
        await waitFor(() => {
            expect(screen.queryByText(/Sync Conflict Detected/i)).not.toBeInTheDocument();
        });

        // It should show a "Sync completed" toast or similar
        expect(await screen.findByText(/Sync completed successfully/i)).toBeInTheDocument();
    });
});
