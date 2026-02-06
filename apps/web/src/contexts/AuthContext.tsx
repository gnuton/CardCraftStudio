import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';

export type UserPlan = 'free' | 'premium' | 'admin';

export interface User {
    uid: string;
    email: string;
    plan: UserPlan;
    isAdmin?: boolean;
}

export interface ImpersonationState {
    isImpersonating: boolean;
    targetUser: User | null;
    adminUser: User | null;
    sessionId: string | null;
    expiresAt: Date | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (payload: string | { idToken?: string; code?: string; redirectUri?: string }) => Promise<void>;
    logout: () => void;
    isLoading: boolean;

    // Admin features
    isAdmin: boolean;

    // Impersonation features
    impersonation: ImpersonationState;
    startImpersonation: (userId: string) => Promise<void>;
    exitImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const getAuthToken = () => localStorage.getItem('cc_auth_token');

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [impersonation, setImpersonation] = useState<ImpersonationState>({
        isImpersonating: false,
        targetUser: null,
        adminUser: null,
        sessionId: null,
        expiresAt: null,
    });

    useEffect(() => {
        // Restore session from localStorage
        const storedToken = localStorage.getItem('cc_auth_token');
        const storedUser = localStorage.getItem('cc_user');
        const storedImpersonation = localStorage.getItem('cc_impersonation');

        if (storedToken && storedUser) {
            setToken(storedToken);
            const userData = JSON.parse(storedUser);
            setUser(userData);

            // Restore impersonation state if exists
            if (storedImpersonation) {
                const impData = JSON.parse(storedImpersonation);
                setImpersonation({
                    ...impData,
                    expiresAt: impData.expiresAt ? new Date(impData.expiresAt) : null,
                });
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (payload: string | { idToken?: string; code?: string; redirectUri?: string }) => {
        try {
            let body = {};
            if (typeof payload === 'string') {
                body = { idToken: payload };
            } else {
                body = payload;
            }

            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Login failed: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            setToken(data.token);
            setUser(data.user);

            localStorage.setItem('cc_auth_token', data.token);
            localStorage.setItem('cc_user', JSON.stringify(data.user));

            // Save Drive Credentials if present (Unified Auth Flow)
            if (data.driveCredentials) {
                localStorage.setItem('gdrive_access_token', data.driveCredentials.accessToken);
                localStorage.setItem('gdrive_refresh_token', data.driveCredentials.refreshToken);

                const expiry = data.driveCredentials.expiryDate || (Date.now() + 3599 * 1000);
                localStorage.setItem('gdrive_token_expires_at', expiry.toString());
            }
        } catch (error) {
            console.error('Auth Login Error:', error);
            throw error;
        }
    };

    const logout = () => {
        googleLogout();
        setToken(null);
        setUser(null);
        setImpersonation({
            isImpersonating: false,
            targetUser: null,
            adminUser: null,
            sessionId: null,
            expiresAt: null,
        });
        localStorage.removeItem('cc_auth_token');
        localStorage.removeItem('cc_user');
        localStorage.removeItem('cc_impersonation');
    };

    const startImpersonation = async (userId: string) => {
        if (!user?.isAdmin) {
            throw new Error('Only admins can impersonate users');
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/impersonate/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.userMessage || 'Failed to start impersonation');
            }

            const data = await response.json();

            // Save current admin state
            const adminUser = { ...user };
            const adminToken = token;

            // Set impersonation state
            const impersonationState: ImpersonationState = {
                isImpersonating: true,
                targetUser: data.session.targetUser,
                adminUser,
                sessionId: data.session.sessionId,
                expiresAt: new Date(data.session.expiresAt),
            };

            setImpersonation(impersonationState);
            setUser(data.session.targetUser);
            setToken(data.impersonationToken);

            // Store in localStorage
            localStorage.setItem('cc_auth_token', data.impersonationToken);
            localStorage.setItem('cc_user', JSON.stringify(data.session.targetUser));
            localStorage.setItem('cc_impersonation', JSON.stringify({
                ...impersonationState,
                adminToken, // Store original admin token
            }));

            console.log(`🎭 Now impersonating: ${data.session.targetUser.email}`);
        } catch (error) {
            console.error('Impersonation Error:', error);
            throw error;
        }
    };

    const exitImpersonation = async () => {
        if (!impersonation.isImpersonating) {
            throw new Error('Not currently impersonating');
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/impersonate/exit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.userMessage || 'Failed to exit impersonation');
            }

            const data = await response.json();

            // Restore admin session
            setUser(data.user);
            setToken(data.token);
            setImpersonation({
                isImpersonating: false,
                targetUser: null,
                adminUser: null,
                sessionId: null,
                expiresAt: null,
            });

            // Update localStorage
            localStorage.setItem('cc_auth_token', data.token);
            localStorage.setItem('cc_user', JSON.stringify(data.user));
            localStorage.removeItem('cc_impersonation');

            console.log(`✅ Exited impersonation. Back to admin: ${data.user.email}`);
        } catch (error) {
            console.error('Exit Impersonation Error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            login,
            logout,
            isLoading,
            isAdmin: user?.isAdmin === true && !impersonation.isImpersonating,
            impersonation,
            startImpersonation,
            exitImpersonation,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
