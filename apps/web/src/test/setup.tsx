import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Global mocks
vi.mock('@react-oauth/google', () => ({
    GoogleOAuthProvider: ({ children }: any) => children,
    GoogleLogin: () => React.createElement('div', { 'data-testid': 'google-login' }),
    googleLogout: vi.fn(),
    useGoogleLogin: () => vi.fn(),
}));

// Use a factory that returns the mock, ensuring it's applied correctly across all files
vi.mock('../contexts/AuthContext', () => {
    return {
        useAuth: () => ({
            user: { uid: 'test-uid', email: 'test@example.com', plan: 'free' },
            token: 'test-token',
            isAuthenticated: true,
            login: vi.fn(),
            logout: vi.fn(),
            isLoading: false,
        }),
        AuthProvider: ({ children }: any) => children,
    };
});
