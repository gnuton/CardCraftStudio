---
description: Plan for introducing User Accounts and Premium Subscription model
---

# User Accounts & Premium Plan Implementation Plan

## Objective
Introduce a structured User Identity system to distinguish between "Guest/Free" users and "Premium" users. 
- **Free Plan**: Unlimited local use, GDrive Sync (requires Google Auth), no AI.
- **Premium Plan**: Requires Login, includes GDrive Sync + **AI Assistance**.

## Current Architecture
- **Auth**: Currently ad-hoc. `App.tsx` has `isAuthenticated` boolean solely for Google Drive access via `gapi`.
- **Storage**: `localStorage` (default) and Google Drive (optional sync).
- **Identity**: No persistent User ID or Profile beyond the ephemeral Google Drive session.

## Proposed Architecture

### 1. Identity Management (Auth)
We need a robust Authentication Provider. We recommend **Firebase Authentication** or **Supabase Auth**. 
*Decision*: **Firebase Auth** is recommended due to the existing reliance on Google Ecosystem (Drive) and ease of integration.

**New Components:**
- `AuthProvider`: A React Context provider wrapping the app.
- `useAuth()`: Hook to access `user`, `isPremium`, `login`, `logout`.

**User States:**
1. **Guest**: Not logged in. Uses `localStorage`.
2. **Free User**: Logged in (Google). Can use GDrive. `isPremium = false`.
3. **Premium User**: Logged in. `isPremium = true`. Unlocks AI.

### 2. User Profile & Premium Status
We need a place to store the "Premium" status.
- **Database**: Firestore (if using Firebase) or Supabase DB.
- **Schema**: `users` collection.
  ```typescript
  interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    plan: 'free' | 'premium' | 'admin';
    subscriptionStatus?: 'active' | 'canceled';
    createdAt: number;
  }
  ```

### 3. Feature Gating (RBAC)
We will introduce a `FeatureGate` component or hook.
- **AI Features**: Locked behind `plan === 'premium'` or `plan === 'admin'`.
- **GDrive**: Available to `plan === 'free' || 'premium'`.

### 4. AI Service Architecture
Since AI keys (OpenAI/Gemini) cannot be exposed on the client:
- **Middleware**: A simple Cloud Function (Firebase Functions) or Next.js API route (if we migrate).
- **Flow**: Client -> Auth Token -> Cloud Function (Verify Token & Premium Status) -> AI Provider.

## Implementation Steps

### Phase 1: Authentication Infrastructure
1.  **Setup Firebase/Supabase**: Create project, enable Google Auth.
2.  **Install SDK**: `npm install firebase`.
3.  **Create `src/services/auth.ts`**: Initialize Auth service.
4.  **Create `src/contexts/AuthContext.tsx`**: Implement `UserProvider`.
5.  **Update `App.tsx`**: Wrap with `UserProvider`.

### Phase 2: User UI Integration
1.  **Top Bar Update**:
    - Replace the current generic Sync Button with a proper **User Menu**.
    - Show Avatar/Initials.
    - Dropdown: "Profile", "Upgrade to Premium", "Logout".
2.  **Login Modal**: A clean component to prompt login (for GDrive or Premium).
3.  **Pricing Modal**: Display Free vs Premium feature comparison.

### Phase 3: Premium Logic & AI Placeholder
1.  **Mock Premium**: Initially, we can allow users to "Toggle Premium" in a dev-mode or allow based on a hardcoded list (for testing).
2.  **AI Assistant UI**: Add a "Magic Wand" icon in `CardStudio`.
    - If Free: Opens Pricing Modal.
    - If Premium: Opens AI Prompt dialog.

## Technical Details

### Dependencies to Add
- `firebase` (or `@supabase/supabase-js`)
- `zustand` (optional, for easier state management than Context)

### Directory Structure Changes
```
src/
  auth/
    AuthContext.tsx
    useAuth.ts
    firebase.ts
  components/
    auth/
      LoginDialog.tsx
      UserMenu.tsx
      PricingDialog.tsx
    ai/
      AiAssistantDialog.tsx
```
