# Implementation Plan: User Authentication & Premium Tiers

This plan tracks the implementation of the tiered access model (Guest, Free, Premium) using Google Sign-In and Stripe.

## Phase 1: Authentication & User Registry (Core)
- [ ] **Backend: User Database Schema**
    - Setup Firestore or Cloud SQL (PostgreSQL) for user data.
    - Fields: `google_id`, `email`, `tier`, `stripe_customer_id`, `created_at`.
- [ ] **Backend: Authentication Middleware**
    - Implement Google ID Token validation using `google-auth-library`.
    - Create an `/auth/login` endpoint to upsert users and return a session token (JWT).
- [ ] **Frontend: Google Identity Integration**
    - Add `@react-oauth/google` or similar.
    - Implement a `useAuth` hook and `AuthContext`.
    - Create a "Sign In" button in the Navbar.

## Phase 2: Feature Gating (Frontend & Backend)
- [ ] **Backend: Premium Middleware**
    - Create `requirePremium` middleware to check JWT `tier` claim.
    - Apply middleware to `AI Generate` route.
- [ ] **Frontend: UI Gating**
    - Disable Premium features for Guest/Free users.
    - Implement the **Premium Modal** with "Upgrade" prompt.
- [ ] **Frontend: Plan-specific UI Cues**
    - Add "PRO" badges and user avatars to the Navbar.

## Phase 3: Payment Integration (Stripe)
- [ ] **Backend: Stripe Setup**
    - Integrate Stripe Node SDK.
    - Create `/api/payments/create-checkout-session` endpoint.
- [ ] **Backend: Webhooks**
    - Implement Stripe Webhook handler for `checkout.session.completed`.
    - Update user tier upon successful payment.
- [ ] **Frontend: Checkout Flow**
    - Redirect users to Stripe Checkout from the Premium Modal.
    - Handle success/cancel return URLs.

## Phase 4: Polish & Performance
- [ ] **Backend: Rate Limiting**
    - Implement basic rate limiting for Free users (AI Search).
- [ ] **UX: Seamless Transition**
    - Ensure local decks are still accessible after sign-in.
    - Add "Manage Subscription" link (Stripe Customer Portal).
