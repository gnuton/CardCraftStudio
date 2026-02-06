import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImpersonationBanner } from './ImpersonationBanner';

// Mock the auth context
const mockExitImpersonation = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../contexts/AuthContext', async () => {
    const actual = await vi.importActual('../contexts/AuthContext');
    return {
        ...actual,
        useAuth: () => mockUseAuth(),
    };
});

describe('ImpersonationBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExitImpersonation.mockResolvedValue(undefined);
    });

    it('should not render when not impersonating', () => {
        mockUseAuth.mockReturnValue({
            impersonation: {
                isImpersonating: false,
                targetUser: null,
                adminUser: null,
                sessionId: null,
                expiresAt: null,
            },
            exitImpersonation: mockExitImpersonation,
        });

        const { container } = render(<ImpersonationBanner />);
        expect(container.firstChild).toBeNull();
    });

    it('should render banner when impersonating', () => {
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        mockUseAuth.mockReturnValue({
            impersonation: {
                isImpersonating: true,
                targetUser: {
                    uid: 'target-uid',
                    email: 'user@example.com',
                    plan: 'free',
                },
                adminUser: {
                    uid: 'admin-uid',
                    email: 'admin@example.com',
                    plan: 'admin',
                    isAdmin: true,
                },
                sessionId: 'session-123',
                expiresAt,
            },
            exitImpersonation: mockExitImpersonation,
        });

        render(<ImpersonationBanner />);

        expect(screen.getByText(/IMPERSONATING USER/i)).toBeInTheDocument();
        expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
        expect(screen.getByText(/admin@example.com/i)).toBeInTheDocument();
        expect(screen.getByText(/free/i)).toBeInTheDocument();
    });

    it('should display countdown timer', async () => {
        const expiresAt = new Date(Date.now() + 65000); // 1 minute 5 seconds from now

        mockUseAuth.mockReturnValue({
            impersonation: {
                isImpersonating: true,
                targetUser: {
                    uid: 'target-uid',
                    email: 'user@example.com',
                    plan: 'free',
                },
                adminUser: {
                    uid: 'admin-uid',
                    email: 'admin@example.com',
                    plan: 'admin',
                    isAdmin: true,
                },
                sessionId: 'session-123',
                expiresAt,
            },
            exitImpersonation: mockExitImpersonation,
        });

        render(<ImpersonationBanner />);

        // Timer should show approximately 1m 5s
        await waitFor(() => {
            const timerText = screen.getByText(/1m \d+s/);
            expect(timerText).toBeInTheDocument();
        });
    });

    it('should call exitImpersonation when exit button is clicked', async () => {
        const expiresAt = new Date(Date.now() + 3600000);

        mockUseAuth.mockReturnValue({
            impersonation: {
                isImpersonating: true,
                targetUser: {
                    uid: 'target-uid',
                    email: 'user@example.com',
                    plan: 'free',
                },
                adminUser: {
                    uid: 'admin-uid',
                    email: 'admin@example.com',
                    plan: 'admin',
                    isAdmin: true,
                },
                sessionId: 'session-123',
                expiresAt,
            },
            exitImpersonation: mockExitImpersonation,
        });

        render(<ImpersonationBanner />);

        const exitButton = screen.getByRole('button', { name: /exit impersonation/i });
        fireEvent.click(exitButton);

        await waitFor(() => {
            expect(mockExitImpersonation).toHaveBeenCalledTimes(1);
        });
    });

    it('should call exitImpersonation when ESC key is pressed', async () => {
        const expiresAt = new Date(Date.now() + 3600000);

        mockUseAuth.mockReturnValue({
            impersonation: {
                isImpersonating: true,
                targetUser: {
                    uid: 'target-uid',
                    email: 'user@example.com',
                    plan: 'free',
                },
                adminUser: {
                    uid: 'admin-uid',
                    email: 'admin@example.com',
                    plan: 'admin',
                    isAdmin: true,
                },
                sessionId: 'session-123',
                expiresAt,
            },
            exitImpersonation: mockExitImpersonation,
        });

        render(<ImpersonationBanner />);

        // Simulate ESC key press
        fireEvent.keyDown(window, { key: 'Escape' });

        await waitFor(() => {
            expect(mockExitImpersonation).toHaveBeenCalledTimes(1);
        });
    });

    it('should show loading state while exiting', async () => {
        const expiresAt = new Date(Date.now() + 3600000);
        let resolveExit: () => void;
        const exitPromise = new Promise<void>((resolve) => {
            resolveExit = resolve;
        });

        mockExitImpersonation.mockReturnValue(exitPromise);

        mockUseAuth.mockReturnValue({
            impersonation: {
                isImpersonating: true,
                targetUser: {
                    uid: 'target-uid',
                    email: 'user@example.com',
                    plan: 'free',
                },
                adminUser: {
                    uid: 'admin-uid',
                    email: 'admin@example.com',
                    plan: 'admin',
                    isAdmin: true,
                },
                sessionId: 'session-123',
                expiresAt,
            },
            exitImpersonation: mockExitImpersonation,
        });

        render(<ImpersonationBanner />);

        const exitButton = screen.getByRole('button', { name: /exit impersonation/i });
        fireEvent.click(exitButton);

        // Button should show "Exiting..." and be disabled
        await waitFor(() => {
            expect(screen.getByText(/Exiting\.\.\./i)).toBeInTheDocument();
            expect(exitButton).toBeDisabled();
        });

        // Resolve the exit
        resolveExit!();
    });

    it('should display warning message about disabled admin features', () => {
        const expiresAt = new Date(Date.now() + 3600000);

        mockUseAuth.mockReturnValue({
            impersonation: {
                isImpersonating: true,
                targetUser: {
                    uid: 'target-uid',
                    email: 'user@example.com',
                    plan: 'free',
                },
                adminUser: {
                    uid: 'admin-uid',
                    email: 'admin@example.com',
                    plan: 'admin',
                    isAdmin: true,
                },
                sessionId: 'session-123',
                expiresAt,
            },
            exitImpersonation: mockExitImpersonation,
        });

        render(<ImpersonationBanner />);

        expect(
            screen.getByText(/You are viewing the application as this user would see it/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Admin features are disabled during impersonation/i)
        ).toBeInTheDocument();
    });

    it('should show expired status when time runs out', async () => {
        const expiresAt = new Date(Date.now() - 1000); // Already expired

        mockUseAuth.mockReturnValue({
            impersonation: {
                isImpersonating: true,
                targetUser: {
                    uid: 'target-uid',
                    email: 'user@example.com',
                    plan: 'free',
                },
                adminUser: {
                    uid: 'admin-uid',
                    email: 'admin@example.com',
                    plan: 'admin',
                    isAdmin: true,
                },
                sessionId: 'session-123',
                expiresAt,
            },
            exitImpersonation: mockExitImpersonation,
        });

        render(<ImpersonationBanner />);

        await waitFor(() => {
            expect(screen.getByText('Expired')).toBeInTheDocument();
        });
    });

    it('should display correct tier badge for premium user', () => {
        const expiresAt = new Date(Date.now() + 3600000);

        mockUseAuth.mockReturnValue({
            impersonation: {
                isImpersonating: true,
                targetUser: {
                    uid: 'target-uid',
                    email: 'premium@example.com',
                    plan: 'premium',
                },
                adminUser: {
                    uid: 'admin-uid',
                    email: 'admin@example.com',
                    plan: 'admin',
                    isAdmin: true,
                },
                sessionId: 'session-123',
                expiresAt,
            },
            exitImpersonation: mockExitImpersonation,
        });

        render(<ImpersonationBanner />);

        expect(screen.getByText('premium')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
        const expiresAt = new Date(Date.now() + 3600000);

        mockUseAuth.mockReturnValue({
            impersonation: {
                isImpersonating: true,
                targetUser: {
                    uid: 'target-uid',
                    email: 'user@example.com',
                    plan: 'free',
                },
                adminUser: {
                    uid: 'admin-uid',
                    email: 'admin@example.com',
                    plan: 'admin',
                    isAdmin: true,
                },
                sessionId: 'session-123',
                expiresAt,
            },
            exitImpersonation: mockExitImpersonation,
        });

        const { container } = render(<ImpersonationBanner />);

        const banner = container.firstChild as HTMLElement;
        expect(banner).toHaveAttribute('role', 'alert');
        expect(banner).toHaveAttribute('aria-live', 'polite');

        const exitButton = screen.getByRole('button', { name: /exit impersonation/i });
        expect(exitButton).toHaveAttribute('aria-label', 'Exit impersonation mode');
    });
});
