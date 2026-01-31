import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';

export type UserPlan = 'free' | 'premium';

export interface User {
    uid: string;
    email: string;
    plan: UserPlan;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (payload: string | { idToken?: string; code?: string; redirectUri?: string }) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const getAuthToken = () => localStorage.getItem('cc_auth_token');

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Restore session from localStorage
        const storedToken = localStorage.getItem('cc_auth_token');
        const storedUser = localStorage.getItem('cc_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
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
        localStorage.removeItem('cc_auth_token');
        localStorage.removeItem('cc_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            login,
            logout,
            isLoading
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
