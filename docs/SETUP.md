# CardCraft Studio - Setup Guide

This guide will help you set up CardCraft Studio for local development and cloud deployment.

## Table of Contents

- [Quick Start (Automated)](#quick-start-automated)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Google Cloud Setup](#google-cloud-setup)
- [GitHub Actions Setup](#github-actions-setup)
- [Manual Setup (Detailed)](#manual-setup-detailed)
- [Environment Variables Reference](#environment-variables-reference)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Quick Start (Automated)

The fastest way to get started is using our automated setup scripts:

```bash
# 1. Install dependencies
npm install

# 2. Set up local environment (interactive)
npm run setup:local-env

# 3. Set up Google Cloud resources (requires gcloud CLI)
npm run setup:cloud-env

# 4. Configure GitHub Actions secrets (requires gh CLI)
npm run setup:github-secrets

# 5. Start development server
npm run dev
```

That's it! Your local environment and cloud infrastructure are ready.

### Safety Features

All setup scripts include built-in safety checks to prevent accidental overwrites:

- **`setup:local-env`**: Checks if `.env` files already exist and prompts for confirmation before overwriting
- **`setup:cloud-env`**: Automatically detects existing resources (service accounts, databases, etc.) and skips creation
- **`setup:github-secrets`**: Warns that existing secrets will be overwritten and requires confirmation to proceed

You can safely re-run these scripts without losing your existing configuration.

---

## Prerequisites

### Required Tools

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

### For Cloud Deployment (Optional)

- **Google Cloud CLI (gcloud)** - [Install Guide](https://cloud.google.com/sdk/docs/install)
- **GitHub CLI (gh)** - [Install Guide](https://cli.github.com/)
- **Google Cloud Account** - [Sign Up](https://cloud.google.com/)
- **GitHub Account** - [Sign Up](https://github.com/)

### For Premium Features (Optional)

- **Stripe Account** - [Sign Up](https://stripe.com/)

---

## Local Development Setup

### Option 1: Automated Setup (Recommended)

Run the interactive setup script:

```bash
npm run setup:local-env
```

This script will:
- Check if `.env` files exist and ask for confirmation before overwriting
- Prompt you for all required credentials
- Generate random encryption keys automatically
- Create `.env` files for both backend and frontend
- Provide guidance on obtaining credentials

### Option 2: Manual Setup

1. **Copy example environment files:**

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
```

2. **Edit `apps/backend/.env`** with your credentials (see [Environment Variables Reference](#environment-variables-reference))

3. **Edit `apps/web/.env`** with your credentials

### Getting Required Credentials

#### Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "CardCraft Studio")
3. Note your **Project ID**

#### Google OAuth Credentials (for Drive Sync)

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Add **Authorized JavaScript origins:**
   - `http://localhost:5173`
   - `https://yourusername.github.io` (for production)
5. Add **Authorized redirect URIs:**
   - `http://localhost:5173/oauth-callback.html`
   - `https://yourusername.github.io/CardCraftStudio/oauth-callback.html`
6. Click **Create** and copy:
   - **Client ID**
   - **Client Secret**

#### Google API Key (for Custom Search & AI)

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API key**
3. Copy the **API Key**
4. (Recommended) Click **Restrict Key** and limit to:
   - Custom Search API
   - AI Platform API

#### Google Custom Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click **Add** to create a new search engine
3. Configure:
   - **Sites to search:** Select "Search the entire web"
   - **Name:** CardCraft Image Search
4. Click **Create**
5. In settings, enable **Image search**
6. Copy your **Search engine ID (cx)**

#### Service Account (for Backend Operations)

1. In Google Cloud Console, go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name: `cardcraft-backend`
4. Grant roles:
   - Datastore User
   - AI Platform User
   - Storage Object Admin
5. Click **Create Key** > **JSON**
6. Save as `apps/backend/serviceAccountKey.json`
7. **Important:** Add this file to `.gitignore` (already done)

#### Stripe Credentials (Optional)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** > **API keys**
3. Copy:
   - **Secret key** (starts with `sk_`)
   - **Publishable key** (starts with `pk_`)
4. For webhooks:
   - Go to **Developers** > **Webhooks**
   - Add endpoint: `https://your-backend-url/api/stripe/webhook`
   - Copy **Signing secret**

### Running Locally

```bash
# Start both frontend and backend
npm run dev

# Or run separately
npm run dev:backend  # Backend only (port 3001)
npm run dev:web      # Frontend only (port 5173)
```

Visit `http://localhost:5173` to see your application!

---

## Google Cloud Setup

### Option 1: Automated Setup (Recommended)

Run the cloud provisioning script:

```bash
npm run setup:cloud-env
```

This script will:
- Authenticate with Google Cloud
- Create or select a GCP project
- Enable all required APIs
- Create service accounts (skips if already exist)
- Set up Workload Identity Federation for GitHub Actions
- Create Firestore database (skips if already exists)
- Download service account credentials (skips if file exists)

**Note:** This script is idempotent and safe to re-run. It will detect existing resources and skip their creation.

### Option 2: Manual Setup

#### 1. Create GCP Project

```bash
gcloud projects create YOUR_PROJECT_ID
gcloud config set project YOUR_PROJECT_ID
```

#### 2. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  customsearch.googleapis.com \
  aiplatform.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  drive.googleapis.com \
  firestore.googleapis.com \
  firebase.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com
```

#### 3. Create Service Account

```bash
gcloud iam service-accounts create cardcraft-backend \
  --display-name="CardCraft Backend Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:cardcraft-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:cardcraft-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Download key
gcloud iam service-accounts keys create apps/backend/serviceAccountKey.json \
  --iam-account=cardcraft-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### 4. Set Up Workload Identity Federation (for GitHub Actions)

```bash
# Create workload identity pool
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Create service account for GitHub Actions
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account"

# Grant roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Allow GitHub to impersonate service account
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

gcloud iam service-accounts add-iam-policy-binding \
  github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"
```

#### 5. Create Firestore Database

```bash
gcloud firestore databases create \
  --database="(default)" \
  --location=us-central1 \
  --type=firestore-native
```

#### 6. Note Your Configuration

You'll need these values for GitHub secrets:

```bash
# Get project number
gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)'

# WIF Provider format:
# projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider

# WIF Service Account:
# github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

---

## GitHub Actions Setup

### Option 1: Automated Setup (Recommended)

Run the GitHub secrets configuration script:

```bash
npm run setup:github-secrets
```

This script will:
- Authenticate with GitHub CLI
- Detect your repository
- Read values from your local `.env` files
- Warn you that existing secrets will be overwritten
- Prompt for confirmation before proceeding
- Set all required secrets in your GitHub repository

**Warning:** This script will overwrite existing secrets with the same name. Make sure you have the correct values before running.

### Option 2: Manual Setup

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each of the following secrets:

| Secret Name | Description | Where to Get |
|------------|-------------|--------------|
| `GCP_PROJECT_ID` | Google Cloud Project ID | Google Cloud Console |
| `WIF_PROVIDER` | Workload Identity Provider | Output from cloud setup |
| `WIF_SERVICE_ACCOUNT` | Service Account Email | Output from cloud setup |
| `GOOGLE_API_KEY` | Google API Key | Google Cloud Console > Credentials |
| `GOOGLE_CUSTOM_SEARCH_CX` | Custom Search Engine ID | Programmable Search Engine |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | Google Cloud Console > Credentials |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | Google Cloud Console > Credentials |
| `TOKEN_ENCRYPTION_KEY` | 32-char random string | From your `.env` file |
| `JWT_SECRET` | Random string | From your `.env` file |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret | Stripe Dashboard > Webhooks |
| `VITE_API_BASE_URL` | Production backend URL | Cloud Run service URL |

---

## Manual Setup (Detailed)

### Backend Environment Variables

Create `apps/backend/.env`:

```env
# Google API Credentials (for Image Search & Generation)
GOOGLE_API_KEY=your_api_key_here
GOOGLE_CUSTOM_SEARCH_CX=your_search_engine_id_here
GOOGLE_CLOUD_PROJECT=your_project_id_here
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json

# Google OAuth Credentials (for GDrive Sync)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5173/oauth-callback.html

# Security
TOKEN_ENCRYPTION_KEY=some_random_32_char_string_here_!!!
JWT_SECRET=another_random_string_for_jwt_signing

# Server Configuration
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173

# Stripe (for Premium Subscriptions)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
STRIPE_PRICE_ID=your_stripe_price_id_here

# Admin Configuration
ADMIN_BOOTSTRAP_EMAIL=your.email@example.com
```

### Frontend Environment Variables

Create `apps/web/.env`:

```env
# Google Client ID (from Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=your_client_id_here

# Backend API URL
VITE_API_BASE_URL=http://localhost:3001
```

---

## Environment Variables Reference

### Backend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GOOGLE_API_KEY` | Yes | Google API key for Custom Search and AI | `AIza...` |
| `GOOGLE_CUSTOM_SEARCH_CX` | Yes | Custom Search Engine ID | `a1b2c3...` |
| `GOOGLE_CLOUD_PROJECT` | Yes | GCP Project ID | `cardcraft-studio-123456` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes | Path to service account JSON | `./serviceAccountKey.json` |
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 Client ID | `123456-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | Yes | OAuth redirect URL | `http://localhost:5173/oauth-callback.html` |
| `TOKEN_ENCRYPTION_KEY` | Yes | 32-character encryption key | Auto-generated by setup script |
| `JWT_SECRET` | Yes | JWT signing secret | Auto-generated by setup script |
| `PORT` | No | Backend server port | `3001` (default) |
| `ALLOWED_ORIGINS` | Yes | CORS allowed origins | `http://localhost:5173` |
| `STRIPE_SECRET_KEY` | No* | Stripe secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | No* | Stripe webhook secret | `whsec_...` |
| `STRIPE_PRICE_ID` | No* | Stripe price ID | `price_...` |
| `ADMIN_BOOTSTRAP_EMAIL` | Yes | Initial admin email | `admin@example.com` |

*Required only if using premium features

### Frontend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 Client ID (same as backend) | `123456-abc.apps.googleusercontent.com` |
| `VITE_API_BASE_URL` | Yes | Backend API URL | `http://localhost:3001` |

### GitHub Actions Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `GCP_PROJECT_ID` | Yes | Google Cloud Project ID |
| `WIF_PROVIDER` | Yes | Workload Identity Federation Provider |
| `WIF_SERVICE_ACCOUNT` | Yes | Service Account for GitHub Actions |
| `GOOGLE_API_KEY` | Yes | Google API Key |
| `GOOGLE_CUSTOM_SEARCH_CX` | Yes | Custom Search Engine ID |
| `GOOGLE_CLIENT_ID` | Yes | OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth Client Secret |
| `TOKEN_ENCRYPTION_KEY` | Yes | Token encryption key |
| `JWT_SECRET` | Yes | JWT signing secret |
| `STRIPE_SECRET_KEY` | No* | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No* | Stripe webhook secret |
| `VITE_API_BASE_URL` | Yes | Production backend URL |

---

## Troubleshooting

### Common Issues

#### "gcloud: command not found"

**Solution:** Install Google Cloud CLI from https://cloud.google.com/sdk/docs/install

#### "gh: command not found"

**Solution:** Install GitHub CLI from https://cli.github.com/

#### "Firestore is not initialized"

**Solution:** 
1. Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account JSON
2. Verify the service account has Firestore permissions
3. Check that Firestore database is created in your GCP project

#### "Cross-Origin-Opener-Policy" errors

**Solution:**
1. Ensure `ALLOWED_ORIGINS` in backend includes your frontend URL
2. Check OAuth redirect URI matches exactly in both Google Console and `.env`

#### "API key not valid"

**Solution:**
1. Verify API key is correct in `.env`
2. Check that required APIs are enabled in Google Cloud Console
3. Ensure API key restrictions allow your APIs

#### GitHub Actions deployment fails

**Solution:**
1. Verify all GitHub secrets are set correctly
2. Check Workload Identity Federation is configured
3. Ensure service account has necessary permissions
4. Review GitHub Actions logs for specific errors

### Getting Help

- **Documentation:** Check this guide and the main README.md
- **Logs:** Check browser console and backend logs for errors
- **GitHub Issues:** Report bugs or ask questions
- **Google Cloud Console:** Check API quotas and service health

---

## FAQ

### Do I need a Google Cloud account for local development?

Yes, you need Google Cloud credentials for:
- OAuth (Google Drive sync)
- Custom Search API (image search)
- AI Platform (AI features)
- Firestore (user data storage)

However, you can develop without these features by mocking the services.

### How much does Google Cloud cost?

CardCraft Studio uses:
- **Cloud Run:** Pay per request (generous free tier)
- **Firestore:** Free tier covers most development usage
- **Custom Search API:** 100 queries/day free
- **AI Platform:** Pay per request

Estimated cost for low-traffic apps: **$0-5/month**

### Can I use a different cloud provider?

The application is designed for Google Cloud, but you could adapt it:
- Replace Firestore with another database
- Replace Cloud Run with any container platform
- Replace Google AI with OpenAI or other providers

### How do I update my production environment?

Just push to the `main` branch! GitHub Actions will:
1. Run tests
2. Build Docker image
3. Deploy to Cloud Run
4. Update environment variables

### How do I add a new admin user?

1. Set `ADMIN_BOOTSTRAP_EMAIL` to the user's email
2. Have the user log in with Google
3. They will automatically receive admin privileges

### Can I self-host without GitHub Actions?

Yes! You can:
1. Build locally: `npm run build`
2. Deploy manually using `gcloud run deploy`
3. Or use any container platform that supports Docker

---

## Next Steps

After completing setup:

1. **Test locally:** `npm run dev`
2. **Run tests:** `npm test`
3. **Deploy to production:** Push to `main` branch
4. **Configure Stripe:** Set up products and pricing
5. **Customize:** Modify the application to your needs

For more information, see the main [README.md](../README.md).
