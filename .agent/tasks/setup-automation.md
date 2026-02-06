---
title: Setup Automation - Simplify Environment Configuration
status: in_progress
created: 2026-02-06
---

# Setup Automation Task

## Objective
Simplify the complex Google Cloud and GitHub Actions setup process by creating automated scripts and comprehensive documentation.

## Current Complexity Analysis

### Environment Variables Required

#### Local Development (.env files)
**Backend (`apps/backend/.env`):**
- `GOOGLE_API_KEY` - Google API Key for Custom Search & AI
- `GOOGLE_CUSTOM_SEARCH_CX` - Custom Search Engine ID
- `GOOGLE_CLOUD_PROJECT` - GCP Project ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account key JSON
- `GOOGLE_CLIENT_ID` - OAuth Client ID for Drive sync
- `GOOGLE_CLIENT_SECRET` - OAuth Client Secret
- `GOOGLE_REDIRECT_URI` - OAuth redirect URL
- `TOKEN_ENCRYPTION_KEY` - 32-char random string for token encryption
- `JWT_SECRET` - Random string for JWT signing
- `PORT` - Backend server port (default: 3001)
- `ALLOWED_ORIGINS` - CORS allowed origins
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `STRIPE_PRICE_ID` - Stripe price ID for premium
- `ADMIN_BOOTSTRAP_EMAIL` - Initial admin email

**Frontend (`apps/web/.env`):**
- `VITE_GOOGLE_CLIENT_ID` - OAuth Client ID (same as backend)
- `VITE_API_BASE_URL` - Backend API URL

#### GitHub Actions Secrets
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `WIF_PROVIDER` - Workload Identity Federation Provider
- `WIF_SERVICE_ACCOUNT` - Service Account for WIF
- `GOOGLE_API_KEY` - Google API Key
- `GOOGLE_CUSTOM_SEARCH_CX` - Custom Search Engine ID
- `GOOGLE_CLIENT_ID` - OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - OAuth Client Secret
- `TOKEN_ENCRYPTION_KEY` - Token encryption key
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `VITE_API_BASE_URL` - Production backend URL

### Google Cloud Resources Required
1. **GCP Project** - Container for all resources
2. **APIs Enabled:**
   - Cloud Run API
   - Artifact Registry API
   - Cloud Build API
   - Custom Search API
   - AI Platform API
   - Cloud Resource Manager API
   - IAM API
   - Drive API
   - Firestore API
   - Firebase API
3. **OAuth 2.0 Client** - For Google Drive authentication
4. **Service Account** - For backend operations
5. **Workload Identity Federation** - For GitHub Actions
6. **Artifact Registry** - Docker image storage
7. **Firestore Database** - User data storage
8. **Custom Search Engine** - For image search

## Tasks Breakdown

### Task 1: Create Setup Scripts ✅
- [x] Create `scripts/setup-local-env.js` - Interactive local environment setup
- [x] Create `scripts/setup-cloud-env.js` - Google Cloud resource provisioning
- [x] Create `scripts/setup-github-secrets.js` - GitHub Actions secrets configuration
- [x] Add npm scripts to root package.json

### Task 2: Create Setup Documentation ✅
- [x] Create `docs/SETUP.md` - Comprehensive setup guide
- [x] Document all environment variables
- [x] Document Google Cloud setup steps
- [x] Document GitHub Actions setup steps
- [x] Add troubleshooting section

### Task 3: Update README.md ✅
- [x] Add link to SETUP.md in the Setup section
- [x] Simplify existing setup instructions
- [x] Reference automated scripts

### Task 4: Testing & Validation
- [ ] Test local environment setup script
- [ ] Test cloud environment setup script
- [ ] Test GitHub secrets setup script
- [ ] Validate documentation accuracy
- [ ] Update based on feedback

## Implementation Notes

### Script Capabilities
1. **Local Environment Setup (`npm run setup:local-env`)**
   - Interactive prompts for all required variables
   - Validates input format
   - Generates random keys where needed
   - Creates both backend and frontend .env files
   - Provides guidance on obtaining credentials

2. **Cloud Environment Setup (`npm run setup:cloud-env`)**
   - Authenticates with Google Cloud
   - Creates/selects GCP project
   - Enables required APIs
   - Creates service account
   - Sets up Workload Identity Federation
   - Creates OAuth 2.0 credentials
   - Provisions Firestore database
   - Outputs configuration for local use

3. **GitHub Secrets Setup (`npm run setup:github-secrets`)**
   - Uses GitHub CLI to set repository secrets
   - Reads from local .env or prompts for values
   - Validates all required secrets are set
   - Provides manual instructions as fallback

### Documentation Structure
- Prerequisites
- Quick Start (automated)
- Manual Setup (detailed)
- Environment Variables Reference
- Troubleshooting
- FAQ

## Success Criteria
- [ ] All scripts run without errors
- [ ] Documentation is clear and comprehensive
- [ ] Setup time reduced from ~2 hours to ~15 minutes
- [ ] No manual Google Cloud Console steps required (when using scripts)
- [ ] GitHub Actions secrets can be configured programmatically
