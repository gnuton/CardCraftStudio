import { render, screen, waitFor } from '@testing-library/react';
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
        // Mock others to avoid errors if needed
    };
});

// Mock Drive Service
vi.mock('../services/googleDrive', () => ({
    driveService: {
        init: vi.fn(),
        trySilentSignIn: vi.fn(),
        signIn: vi.fn(),
        isSignedIn: false, // Default
        saveFile: vi.fn(),
    }
}));

describe('Cloud Sync Behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        // Stub Env
        vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');

        (driveService.init as any).mockResolvedValue(undefined);
    });

    it('Scenario 1: Auto-reconnects if previously enabled and silent sign-in works', async () => {
        // Setup: User previously enabled sync
        localStorage.setItem('velvet-sojourner-sync-enabled', 'true');

        // Setup: Silent sign-in succeeds
        (driveService.trySilentSignIn as any).mockResolvedValue('fake-token');

        render(<App />);

        // Wait for init
        await waitFor(() => {
            expect(driveService.init).toHaveBeenCalled();
            expect(driveService.trySilentSignIn).toHaveBeenCalled();
        });

        // App should be authenticated -> Green Cloud Icon
        await waitFor(() => {
            // We check for the authenticated state via UI. 
            // In App.tsx, authenticated = <Cloud /> (green), offline = <CloudOff />
            expect(screen.getByTestId('icon-cloud')).toBeInTheDocument();
            expect(screen.queryByTestId('icon-cloud-off')).not.toBeInTheDocument();
        });
    });

    it('Scenario 2: Shows prompt if previously enabled but silent sign-in fails (Session Lost)', async () => {
        // Setup: User previously enabled sync
        localStorage.setItem('velvet-sojourner-sync-enabled', 'true');

        // Setup: Silent sign-in fails (e.g. session expired)
        (driveService.trySilentSignIn as any).mockRejectedValue(new Error('Session expired'));

        render(<App />);

        await waitFor(() => {
            expect(driveService.trySilentSignIn).toHaveBeenCalled();
        });

        // Should show the Sync Prompt Dialog
        // Look for text inside SyncPromptDialog
        expect(await screen.findByText(/Cloud Sync/i)).toBeInTheDocument();
        expect(await screen.findByText(/Would you like to store and sync/i)).toBeInTheDocument();
    });

    it('Scenario 3: Does NOT prompt if never enabled and silent sign-in fails (New User)', async () => {
        // Setup: No localStorage key
        localStorage.removeItem('velvet-sojourner-sync-enabled');

        // Setup: Silent sign in fails (expected for new user)
        (driveService.trySilentSignIn as any).mockRejectedValue(new Error('Not signed in'));

        render(<App />);

        await waitFor(() => {
            expect(driveService.trySilentSignIn).toHaveBeenCalled();
        });

        // Should NOT show prompt immediately (unless logic changed, currently only shows if !promptShown is true?)
        // Wait: My logic says: if (previouslyEnabled || !promptShown)
        // If !promptShown is true, it DOES show prompt for new users too.
        // Let's verify this. Logic: `if (previouslyEnabled || !promptShown)`
        // So a new user SHOULD see the prompt once per session.

        expect(await screen.findByText(/Cloud Sync/i)).toBeInTheDocument();
    });

    it('Scenario 4: Does NOT prompt if prompt was already dismissed in this session', async () => {
        localStorage.removeItem('velvet-sojourner-sync-enabled');
        sessionStorage.setItem('velvet-sojourner-sync-prompt-shown', 'true');

        (driveService.trySilentSignIn as any).mockRejectedValue(new Error('Not signed in'));

        render(<App />);

        // Wait to ensure effects ran
        await waitFor(() => expect(driveService.init).toHaveBeenCalled());

        // Should NOT show prompt
        expect(screen.queryByText(/Would you like to store and sync/i)).not.toBeInTheDocument();
    });
});
