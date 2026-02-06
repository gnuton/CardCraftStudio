import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, type User } from './AuthContext';
import React from 'react';

// Mock fetch
global.fetch = vi.fn();

// Mock Google OAuth
vi.mock('@react-oauth/google', () => ({
    googleLogout: vi.fn(),
}));

// Unmock AuthContext to test the real implementation
vi.unmock('./AuthContext');

describe('AuthContext - Admin Features', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        process.env.VITE_API_BASE_URL = 'http://localhost:3001';
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('Admin State', () => {
        it('should set isAdmin to true for admin users', async () => {
            const adminUser: User = {
                uid: 'admin-uid',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    token: 'admin-token',
                    user: adminUser,
                }),
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test-id-token');
            });

            await waitFor(() => {
                expect(result.current.user?.isAdmin).toBe(true);
                expect(result.current.isAdmin).toBe(true);
                expect(result.current.user?.plan).toBe('admin');
            });
        });

        it('should set isAdmin to false for non-admin users', async () => {
            const regularUser: User = {
                uid: 'user-uid',
                email: 'user@test.com',
                plan: 'premium',
                isAdmin: false,
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    token: 'user-token',
                    user: regularUser,
                }),
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test-id-token');
            });

            await waitFor(() => {
                expect(result.current.user?.isAdmin).toBeFalsy();
                expect(result.current.isAdmin).toBe(false);
            });
        });

        it('should set isAdmin to false when impersonating', async () => {
            const adminUser: User = {
                uid: 'admin-uid',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            // First login as admin
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    token: 'admin-token',
                    user: adminUser,
                }),
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test-id-token');
            });

            // Now start impersonation
            const targetUser: User = {
                uid: 'target-uid',
                email: 'target@test.com',
                plan: 'free',
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    impersonationToken: 'impersonation-token',
                    session: {
                        sessionId: 'session-123',
                        targetUser,
                        expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    },
                }),
            });

            await act(async () => {
                await result.current.startImpersonation('target-uid');
            });

            await waitFor(() => {
                // isAdmin should be false while impersonating
                expect(result.current.isAdmin).toBe(false);
                expect(result.current.impersonation.isImpersonating).toBe(true);
            });
        });
    });

    describe('startImpersonation', () => {
        it('should start impersonation successfully', async () => {
            const adminUser: User = {
                uid: 'admin-uid',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            const targetUser: User = {
                uid: 'target-uid',
                email: 'target@test.com',
                plan: 'free',
            };

            // Login as admin first
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    token: 'admin-token',
                    user: adminUser,
                }),
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test-id-token');
            });

            // Start impersonation
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    impersonationToken: 'impersonation-token',
                    session: {
                        sessionId: 'session-123',
                        targetUser,
                        expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    },
                }),
            });

            await act(async () => {
                await result.current.startImpersonation('target-uid');
            });

            await waitFor(() => {
                expect(result.current.impersonation.isImpersonating).toBe(true);
                expect(result.current.impersonation.targetUser?.email).toBe('target@test.com');
                expect(result.current.impersonation.adminUser?.email).toBe('admin@test.com');
                expect(result.current.impersonation.sessionId).toBe('session-123');
                expect(result.current.user?.email).toBe('target@test.com'); // Current user is now target
                expect(result.current.token).toBe('impersonation-token');
            });
        });

        it('should store impersonation state in localStorage', async () => {
            const adminUser: User = {
                uid: 'admin-uid',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            const targetUser: User = {
                uid: 'target-uid',
                email: 'target@test.com',
                plan: 'free',
            };

            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ token: 'admin-token', user: adminUser }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        impersonationToken: 'imp-token',
                        session: {
                            sessionId: 'session-123',
                            targetUser,
                            expiresAt: new Date(Date.now() + 3600000).toISOString(),
                        },
                    }),
                });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test-id-token');
            });
            await act(async () => {
                await result.current.startImpersonation('target-uid');
            });

            await waitFor(() => {
                const storedImpersonation = localStorage.getItem('cc_impersonation');
                expect(storedImpersonation).toBeTruthy();
                const parsed = JSON.parse(storedImpersonation!);
                expect(parsed.isImpersonating).toBe(true);
                expect(parsed.targetUser.email).toBe('target@test.com');
                expect(parsed.adminUser.email).toBe('admin@test.com');
            });
        });

        it('should throw error if non-admin tries to impersonate', async () => {
            const regularUser: User = {
                uid: 'user-uid',
                email: 'user@test.com',
                plan: 'free',
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    token: 'user-token',
                    user: regularUser,
                }),
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test-id-token');
            });

            await expect(
                act(async () => {
                    await result.current.startImpersonation('target-uid');
                })
            ).rejects.toThrow('Only admins can impersonate users');
        });

        it('should handle impersonation errors gracefully', async () => {
            const adminUser: User = {
                uid: 'admin-uid',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ token: 'admin-token', user: adminUser }),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    json: async () => ({
                        userMessage: 'User not found',
                    }),
                    text: async () => 'User not found',
                });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test-id-token');
            });

            await expect(
                act(async () => {
                    await result.current.startImpersonation('nonexistent');
                })
            ).rejects.toThrow('User not found');
        });
    });

    describe('exitImpersonation', () => {
        it('should exit impersonation and restore admin session', async () => {
            const adminUser: User = {
                uid: 'admin-uid',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            const targetUser: User = {
                uid: 'target-uid',
                email: 'target@test.com',
                plan: 'free',
            };

            // Setup: Login + Impersonate
            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ token: 'admin-token', user: adminUser }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        impersonationToken: 'imp-token',
                        session: {
                            sessionId: 'session-123',
                            targetUser,
                            expiresAt: new Date(Date.now() + 3600000).toISOString(),
                        },
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        token: 'new-admin-token',
                        user: adminUser,
                        session: {
                            sessionId: 'session-123',
                            duration: '5m 32s',
                        },
                    }),
                });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test-id-token');
            });
            await act(async () => {
                await result.current.startImpersonation('target-uid');
            });

            // Verify impersonating
            expect(result.current.impersonation.isImpersonating).toBe(true);

            // Exit impersonation
            await act(async () => {
                await result.current.exitImpersonation();
            });

            await waitFor(() => {
                expect(result.current.impersonation.isImpersonating).toBe(false);
                expect(result.current.user?.email).toBe('admin@test.com');
                expect(result.current.user?.isAdmin).toBe(true);
                expect(result.current.isAdmin).toBe(true);
                expect(result.current.token).toBe('new-admin-token');
            });
        });

        it('should clear impersonation from localStorage', async () => {
            const adminUser: User = {
                uid: 'admin-uid',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            const targetUser: User = {
                uid: 'target-uid',
                email: 'target@test.com',
                plan: 'free',
            };

            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ token: 'admin-token', user: adminUser }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        impersonationToken: 'imp-token',
                        session: {
                            sessionId: 'session-123',
                            targetUser,
                            expiresAt: new Date(Date.now() + 3600000).toISOString(),
                        },
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        token: 'new-admin-token',
                        user: adminUser,
                    }),
                });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test-id-token');
            });
            await act(async () => {
                await result.current.startImpersonation('target-uid');
            });

            expect(localStorage.getItem('cc_impersonation')).toBeTruthy();

            await act(async () => {
                await result.current.exitImpersonation();
            });

            await waitFor(() => {
                expect(localStorage.getItem('cc_impersonation')).toBeNull();
            });
        });

        it('should throw error if not impersonating', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await expect(
                act(async () => {
                    await result.current.exitImpersonation();
                })
            ).rejects.toThrow('Not currently impersonating');
        });
    });

    describe('Logout with Impersonation', () => {
        it('should clear impersonation state on logout', async () => {
            const adminUser: User = {
                uid: 'admin-uid',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            const targetUser: User = {
                uid: 'target-uid',
                email: 'target@test.com',
                plan: 'free',
            };

            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ token: 'admin-token', user: adminUser }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        impersonationToken: 'imp-token',
                        session: {
                            sessionId: 'session-123',
                            targetUser,
                            expiresAt: new Date(Date.now() + 3600000).toISOString(),
                        },
                    }),
                });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test-id-token');
            });
            await act(async () => {
                await result.current.startImpersonation('target-uid');
            });

            expect(result.current.impersonation.isImpersonating).toBe(true);

            act(() => {
                result.current.logout();
            });

            expect(result.current.user).toBeNull();
            expect(result.current.token).toBeNull();
            expect(result.current.impersonation.isImpersonating).toBe(false);
            expect(localStorage.getItem('cc_impersonation')).toBeNull();
        });
    });

    describe('Impersonation State Persistence', () => {
        it('should restore impersonation state from localStorage on mount', () => {
            const targetUser: User = {
                uid: 'target-uid',
                email: 'target@test.com',
                plan: 'free',
            };

            const adminUser: User = {
                uid: 'admin-uid',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            const impersonationState = {
                isImpersonating: true,
                targetUser,
                adminUser,
                sessionId: 'session-123',
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
            };

            localStorage.setItem('cc_auth_token', 'imp-token');
            localStorage.setItem('cc_user', JSON.stringify(targetUser));
            localStorage.setItem('cc_impersonation', JSON.stringify(impersonationState));

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            waitFor(() => {
                expect(result.current.impersonation.isImpersonating).toBe(true);
                expect(result.current.impersonation.targetUser?.email).toBe('target@test.com');
                expect(result.current.user?.email).toBe('target@test.com');
            });
        });
    });
});
