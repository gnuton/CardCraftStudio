# User Tiers & Interaction Design

## 1. Overview
The goal is to transition CardCraft Studio from a single-tier locally-focused app to a tiered SaaS model with **Guest**, **Free**, and **Premium** levels. The primary authentication mechanism will be **Google Sign-In**.

## 2. User Tiers & Feature Matrix

| Feature             | Guest (Anonymous) | Free (Logged In) | Premium (Subscriber) |
| :------------------ | :---------------- | :--------------- | :------------------- |
| **Card Editing**    | ✅ Full access     | ✅ Full access    | ✅ Full access        |
| **Local Storage**   | ✅ Enabled        | ✅ Enabled       | ✅ Enabled           |
| **Google Drive Sync**| ❌ Disabled       | ✅ Enabled       | ✅ Enabled           |
| **AI Image Search** | ❌ Disabled       | ⚠️ Limited (3/day)| ✅ Unlimited         |
| **AI Generation**   | ❌ Disabled       | ❌ Disabled      | ✅ Unlimited         |
| **Premium Templates**| ❌ Disabled       | ❌ Disabled      | ✅ Exclusive access  |

## 3. Interaction Design (UX)

### A. The Onboarding Flow
1.  **Welcome Experience**: Users can immediately start creating cards. No barrier to entry.
2.  **The "Sync" Hook**: When a user clicks "Sync" or tries to save a deck, they are prompted: *"Sign in with Google to keep your decks safe in the cloud."*
3.  **Google Sign-In**: A single, prominent "Sign in with Google" button. 

### B. Visual Cues for Tiers
*   **Navigation Bar**:
    *   *Guest*: "Sign In" button + "Upgrade" (subtle).
    *   *Free*: User Avatar + "Get Premium" badge (gold/animated).
    *   *Premium*: User Avatar + "PRO" badge + special accent colors in the UI.
*   **Feature Gating**:
    *   Locked features (e.g., AI Generation) will show a "Lock" or "Sparkle" icon.
    *   Clicking a locked feature opens the **Premium Modal** instead of the feature itself.

### C. The Premium Modal
*   **Design**: A high-end, glassmorphic modal.
*   **Content**:
    *   Comparison table (Free vs Pro).
    *   "Upgrade Now" button (Stripe checkout).
    *   "Restore Purchase" link.

## 4. Technical Architecture

### A. Authentication Handling
*   **Session Management**: Use `Firebase Auth` or a custom JWT-based system utilizing the existing Google OAuth flow.
*   **Identity**: The Google `sub` (Subject ID) serves as the primary key for users.

### B. Backend Gating
1.  **Middleware**: A `requirePremium` middleware on the backend will:
    *   Verify the JWT from the request.
    *   Check the user's plan in the database.
2.  **Rate Limiting**: Free users will have a Redis-backed rate limiter for AI Search.

### C. Subscription Management
*   **Stripe Integration**:
    *   Frontend redirects to Stripe Checkout.
    *   Backend listens to Webhooks to update the `user_plan` in the database.
    *   "Manage Subscription" button redirects to Stripe Customer Portal.

### D. Data Persistence
*   **User Registry**: A Firestore or PostgreSQL table:
    ```sql
    CREATE TABLE users (
      google_id VARCHAR PRIMARY KEY,
      email VARCHAR,
      plan_type VARCHAR DEFAULT 'free', -- 'free', 'premium'
      subscription_id VARCHAR,
      last_login TIMESTAMP
    );
    ```

## 5. Sequence Diagram: Sign-In & Privilege Check

1.  **User** clicks "Sign In with Google".
2.  **Frontend** obtains ID Token from Google.
3.  **Frontend** sends Token to **Backend** `/auth/login`.
4.  **Backend** verifies Token with Google.
5.  **Backend** checks `users` table for plan status.
6.  **Backend** returns a Custom JWT containing `{ uid, plan: 'premium' }`.
7.  **Frontend** stores JWT and updates UI state.
8.  **User** attempts "AI Generate".
9.  **Frontend** sends request with JWT.
10. **Backend** `requirePremium` middleware allows/denies based on JWT payload.
