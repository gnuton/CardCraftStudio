import { Router } from 'express';
import { createCheckoutSession, stripe } from '../services/stripe';
import { userService } from '../services/userService';
import bodyParser from 'body-parser';
import { ApiError } from '../utils/ApiError';
import { requirePremium } from '../middleware/requirePremium';
import jwt from 'jsonwebtoken';

const router = Router();

// Initialize checkout session
router.post('/create-checkout-session', async (req, res, next) => {
    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new ApiError(401, 'Authentication required', 'Please sign in to upgrade.'));
        }

        const token = authHeader.split(' ')[1];
        let userId: string;
        let userEmail: string;

        try {
            const decoded: any = jwt.verify(token, JWT_SECRET);
            userId = decoded.uid;
            userEmail = decoded.email;
        } catch (err) {
            return next(new ApiError(401, 'Invalid session', 'Please sign in again.'));
        }

        const session = await createCheckoutSession(userId, userEmail);
        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        next(new ApiError(500, 'Checkout failed', 'Could not initiate checkout session.'));
    }
});

// Webhook handler (needs raw body)
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (!sig || !webhookSecret) {
            // For development/mocking without actual Stripe webhook
            if (process.env.NODE_ENV !== 'production') {
                const body = req.body instanceof Buffer ? JSON.parse(req.body.toString()) : req.body;
                if (body.type) {
                    event = body;
                } else {
                    return res.status(400).send('Webhook Error: Missing signature or secret');
                }
            } else {
                return res.status(400).send('Webhook Error: Missing signature or secret');
            }
        } else {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        }
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;

        if (userId) {
            console.log(`Upgrading user ${userId} to premium via webhook`);
            await userService.updatePlan(userId, 'premium');
        }
    }

    res.json({ received: true });
});

export default router;
