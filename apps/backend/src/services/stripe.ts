import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
    // apiVersion: '2025-01-27.acacia', // Removed to avoid type mismatch, default will be used
});

export const createCheckoutSession = async (userId: string, userEmail: string) => {
    return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'CardCraft Premium',
                        description: 'Unlimited AI generations and premium features',
                    },
                    unit_amount: 999, // $9.99
                    recurring: {
                        interval: 'month',
                    },
                },
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?payment=cancelled`,
        customer_email: userEmail,
        metadata: {
            userId,
        },
    });
};
