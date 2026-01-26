# Solution Design: User Authentication & Premium Tiers

## 1. High-Level Architecture

The following diagram illustrates the interaction between the CardCraft frontend, the backend services, and external providers (Google & Stripe).

```mermaid
graph TD
    subgraph Client [Browser / Frontend]
        UI[React UI]
        AuthSvc[Auth Service / Context]
        GSDK[Google Identity SDK]
        Storage[LocalStorage / IndexedDB]
    end

    subgraph External [External Services]
        GAuth[Google OAuth 2.0]
        GDrive[Google Drive API]
        Stripe[Stripe API / Checkout]
    end

    subgraph Backend [Server / Cloud Run]
        API[Express API]
        MW[Auth & Premium Middleware]
        UserSvc[User & Subscription Service]
        AISvc[AI Provider Wrapper]
    end

    subgraph Database [Persistence]
        UsersDB[(PostgreSQL / Firestore)]
    end

    %% Authentication Flow
    UI --> AuthSvc
    AuthSvc --> GSDK
    GSDK <--> GAuth
    AuthSvc -- "ID Token" --> API
    API --> MW
    MW -- "Verify Token" --> GAuth
    MW -- "Check Status" --> UserSvc
    UserSvc <--> UsersDB

    %% Subscription Flow
    UI -- "Upgrade" --> Stripe
    Stripe -- "Webhook" --> API
    API --> UserSvc

    %% Feature Access
    UI -- "Sync" --> GDrive
    UI -- "AI Request + JWT" --> API
    API -- "Gated" --> AISvc
```

## 2. Technical Component Breakdown

### 2.1 Authentication (Google Sign-In)
*   **Mechanism**: OpenID Connect (OIDC).
*   **Frontend**: Uses `google-one-tap` or `gapi` to obtain an ID Token.
*   **Backend**: 
    1.  Receives ID Token in `Authorization: Bearer <token>` header.
    2.  Validates via `google-auth-library`.
    3.  Upserts user record in `UsersDB` (Id matches Google `sub`).
    4.  Issues a stateless JWT (or continues using ID Token) containing the `user_tier`.

### 2.2 Access Control Logic (RBAC)
We utilize a multi-layered gating strategy:

1.  **Frontend Gating**: 
    *   UI elements (buttons, menus) are disabled or replaced with "Upgrade" prompts based on the `tier` property in the Auth context.
2.  **Backend Gating (Middleware)**:
    *   Specific routes (e.g., `/api/ai/generate`) are wrapped with `requirePremium` middleware.
    *   Metadata routes (e.g., `/api/user/status`) verify session validity.

### 2.3 Subscription Management (Stripe)
*   **Checkout**: Frontend redirects to a Stripe-hosted checkout page.
*   **Fulfillment**: Stripe sends a `checkout.session.completed` webhook.
*   **Database**: The backend updates the mapping of `google_id` -> `plan: 'premium'`.
*   **Portal**: A "Manage Subscription" link in the UI opens the Stripe Customer Portal for cancellations/billing updates.

## 3. Data Schema

### User Entity
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID / Google Sub | Primary Key |
| `email` | String | User email for communications |
| `tier` | Enum | `free`, `premium` |
| `stripe_customer_id` | String | Link to Stripe Billing |
| `stripe_subscription_id` | String | Current active subscription ID |
| `created_at` | Timestamp | Account creation date |

## 4. Sequence Diagram: Feature Gating

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant S as Stripe

    U->>F: Clicks "AI Generate"
    F->>F: Check local tier status
    alt is Free
        F->>U: Show Premium Modal
        U->>F: Clicks "Upgrade"
        F->>B: Create Checkout Session
        B->>S: Request Session
        S-->>B: Session ID
        B-->>F: Session URL
        F->>S: Redirect to Stripe
        S->>B: Webhook: Payment Success
        B->>B: Update User to Premium
    else is Premium
        F->>B: POST /api/ai/generate (JWT)
        B->>B: Middleware: Verify Premium
        B->>B: Call AI Provider
        B-->>F: Return Image URL
        F-->>U: Show Generated Image
    end
```

## 5. Security Considerations
*   **Token Validation**: Always validate ID Tokens on the backend; never trust the frontend's claim of being "Premium".
*   **CORS**: Strict CORS policies to allow only the official frontend domain.
*   **Secrets**: All API keys (Stripe, Google, AI) are stored in Google Cloud Secret Manager.
