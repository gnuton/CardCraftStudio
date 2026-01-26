import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import { createApp } from '../src/app';
import { stripe } from '../src/services/stripe';
import { generateTestToken, JWT_SECRET } from './testUtils';
import { userService } from '../src/services/userService';

// Mock stripe
vi.mock('../src/services/stripe', async (importOriginal) => {
    return {
        stripe: {
            checkout: {
                sessions: {
                    create: vi.fn(),
                },
            },
            webhooks: {
                constructEvent: vi.fn(),
            },
        },
        createCheckoutSession: vi.fn(),
    };
});

vi.mock('../src/services/userService', () => ({
    userService: {
        updatePlan: vi.fn(),
        getOrCreateUser: vi.fn(),
    },
}));

describe('Stripe Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        process.env.JWT_SECRET = JWT_SECRET;
        app = createApp();
        vi.clearAllMocks();
    });

    it('should return 401 for checkout without token', async () => {
        const response = await request(app)
            .post('/api/stripe/create-checkout-session');

        expect(response.status).toBe(401);
    });

    it('should create checkout session for authenticated user', async () => {
        const { createCheckoutSession } = await import('../src/services/stripe');
        (createCheckoutSession as any).mockResolvedValue({ url: 'http://stripe.checkout.url' });

        const response = await request(app)
            .post('/api/stripe/create-checkout-session')
            .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ url: 'http://stripe.checkout.url' });
        expect(createCheckoutSession).toHaveBeenCalled();
    });

    it('should handle webhook success', async () => {
        const mockEvent = {
            type: 'checkout.session.completed',
            data: {
                object: {
                    metadata: {
                        userId: 'test-user-id',
                    },
                },
            },
        };

        // We bypass signature check for non-production in our code, so we can send raw
        // Or we mock constructEvent
        (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);

        const response = await request(app)
            .post('/api/stripe/webhook')
            .set('stripe-signature', 'fake_sig')
            .send(mockEvent);

        expect(response.status).toBe(200);
        expect(userService.updatePlan).toHaveBeenCalledWith('test-user-id', 'premium');
    });
});
