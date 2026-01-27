import { getAuthToken } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const subscriptionService = {
    async createCheckoutSession() {
        const token = getAuthToken();
        if (!token) {
            throw new Error('User not authenticated');
        }

        const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to start checkout session');
        }

        const data = await response.json();
        return data.url; // Returns the URL to redirect to
    }
};
