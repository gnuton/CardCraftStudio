# AI Image Generation 401 Error - Fixed ✅

## Problem Summary
When trying to generate AI images as an admin user in the local environment, you were getting a 401 Unauthorized error.

## Root Causes Identified

### 1. Frontend Not Sending Auth Token (FIXED ✅)
**Issue**: The `imageProviderService.ts` was not including the JWT authentication token in API requests to `/api/images/generate`.

**Fix**: Updated `/apps/web/src/services/imageProviderService.ts` to:
- Import `getAuthToken` from `AuthContext`
- Include `Authorization: Bearer <token>` header in requests

### 2. Backend Using Wrong Authentication Method (FIXED ✅)
**Issue**: The `googleImagen.ts` service was using an API key (`?key=${apiKey}`) instead of proper OAuth2 authentication required by Vertex AI.

**Fix**: Updated `/apps/backend/src/services/googleImagen.ts` to:
- Use `GoogleAuth` from `google-auth-library`
- Obtain OAuth2 access tokens from service account credentials
- Send proper `Authorization: Bearer <access_token>` header to Google Vertex AI

### 3. Missing Vertex AI Permissions (FIXED ✅)
**Issue**: The service account `cardcraft-local-dev@cardcraft-studio-485208.iam.gserviceaccount.com` didn't have permissions to use Vertex AI.

**Fix**: Ran setup script that:
- Enabled Vertex AI API: `aiplatform.googleapis.com`
- Granted `roles/aiplatform.user` role to service account
- Granted `roles/aiplatform.admin` role to service account

### 4. Using Deprecated Model Name (FIXED ✅)
**Issue**: The code was using the old model name `imagegeneration` instead of the new Imagen 3 model.

**Fix**: Updated endpoint to use:
```
imagen-3.0-fast-generate-001:predict
```

## Verification

Run this command to verify Vertex AI access:
```bash
cd apps/backend
node verify-vertex-ai.js
```

Expected output: `🎉 All checks passed! AI image generation should work.`

## Files Modified

1. **Frontend**:
   - `/apps/web/src/services/imageProviderService.ts` - Added JWT token to requests

2. **Backend**:
   - `/apps/backend/src/services/googleImagen.ts` - Implemented proper Google Cloud authentication

3. **Helper Scripts**:
   - `/apps/backend/verify-vertex-ai.js` - Verification script
   - `/apps/backend/setup-vertex-ai.sh` - Setup script for permissions

## Environment Variables Required

The following environment variables are needed (already configured in `.env`):

```bash
GOOGLE_CLOUD_PROJECT=cardcraft-studio-485208
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
JWT_SECRET=<your-jwt-secret>
```

## Service Account Roles

The `cardcraft-local-dev@cardcraft-studio-485208.iam.gserviceaccount.com` service account now has:
- ✅ `roles/aiplatform.user`
- ✅ `roles/aiplatform.admin`
- ✅ `roles/datastore.user` (existing)

## Testing

1. Ensure you're logged in as admin
2. Try to generate an AI image from the card editor
3. It should now work without 401 errors! 🎉

## Additional Notes

- Imagen 3 is generally available as of December 2024
- Using `imagen-3.0-fast-generate-001` for lower latency
- Supports aspect ratios like "3:4" (card-friendly)
- The service automatically uses Application Default Credentials from `GOOGLE_APPLICATION_CREDENTIALS`
