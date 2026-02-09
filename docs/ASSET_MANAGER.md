# Asset Manager Feature

## Overview

The Asset Manager allows users to save, organize, and reuse AI-generated images and uploaded assets across their card decks. It provides a centralized library for managing visual assets with features like deduplication, search, filtering, and usage tracking.

## Features

- ✨ **Save AI-Generated Images**: One-click save from image generation
- 📁 **Asset Library**: Organize all your images in one place
- 🔍 **Search & Filter**: Find assets quickly by name, tags, or type
- 🎯 **Smart Deduplication**: Automatic detection of duplicate images
- 📊 **Usage Tracking**: See how often each asset is used
- 🗑️ **Global Delete**: Delete from both storage and visualized list
- ➕ **Card Integration**: Seamlessly add assets to cards while editing
- 📱 **Responsive UI**: Works seamlessly on desktop, tablet, and mobile

## Quick Start

### For Users

#### Saving an Image
1. Generate an image using the AI image generator
2. Click the **"Save to Assets"** button (purple)
3. See the success message ✅
4. Your image is now saved!

#### Accessing Your Assets
1. Click your profile button (top right)
2. Select **"Asset Manager"** from the dropdown
3. Browse, search, or filter your saved assets

#### Using an Asset
- Click any asset card to view or use it
- Hover over cards to see additional actions (delete, preview)

### Card Studio Integration

When opened from the Card Editor:
1. **Context Aware**: Shows "Add to Card" button for assets
2. **Direct Application**: Selected image is immediately applied to the card
3. **Visual Confirmation**: The added image is displayed in the card preview

### For Developers

#### Setup

1. **Deploy Firestore Configuration**
```bash
./scripts/deploy-firestore.sh
```

2. **Wait for Indexes** (5-10 minutes)
```bash
firebase firestore:indexes
```

3. **Verify Rules**
```bash
# Check in Firebase Console → Firestore → Rules
```

#### API Endpoints

```typescript
// List assets
GET /api/assets?source=generated&page=1&limit=20

// Get asset metadata
GET /api/assets/:id

// Get asset image data
GET /api/assets/:id/data

// Create asset
POST /api/assets
Body: { imageData, fileName, source, tags, mimeType }

// Update asset
PUT /api/assets/:id
Body: { fileName, tags }

// Delete asset
DELETE /api/assets/:id

// Track usage
POST /api/assets/:id/use

// Generate with auto-save
POST /api/images/generate
Body: { prompt, style, saveToAssets: true }
```

#### Using in Code

```typescript
import { assetService } from '../services/assetService';

// Save a generated image
const asset = await assetService.saveGeneratedImage(
  imageBase64,
  'A fire dragon',
  'fantasy'
);

// List user's assets
const { assets } = await assetService.listAssets({
  source: 'generated',
  search: 'dragon',
  page: 1
});

// Delete an asset
await assetService.deleteAsset(assetId);
```

## Architecture

### Storage Model

The Asset Manager uses a two-collection Firestore architecture:

**`/assets/{assetId}`** - Asset metadata
- User ID, filename, tags
- File hash (for deduplication)
- Source type, timestamps
- Usage statistics

**`/assetData/{storageId}`** - Image data
- Base64-encoded image data
- Separated to avoid document size limits

### Deduplication

Assets are deduplicated using SHA-256 hashing:
1. Calculate hash of image data
2. Check if asset with same hash exists for user
3. If exists, return existing asset
4. If new, create new asset

This prevents storing the same image multiple times.

### Smart Delete

When deleting an asset:
1. Check if other assets use the same image (same hash)
2. If this is the last reference, delete image data
3. If other assets use it, keep image data
4. Always delete the asset metadata

## File Structure

```
apps/backend/src/
├── types/asset.ts              # Type definitions
├── services/assetService.ts    # Business logic
├── middleware/requireAuth.ts   # Authentication
└── routes/
    ├── assets.ts               # Asset endpoints
    └── images.ts               # Enhanced with save support

apps/web/src/
├── types/asset.ts              # Type definitions
├── services/assetService.ts    # API client
└── components/
    ├── AssetCard.tsx           # Individual card
    ├── AssetGrid.tsx           # Grid layout
    ├── AssetManager.tsx        # Main modal
    ├── UserProfile.tsx         # Menu integration
    └── ImageProviderDialog/
        └── GenerateTab.tsx     # Save button

firestore.rules                 # Security rules
firestore.indexes.json          # Composite indexes
```

## Configuration

### Environment Variables

**Backend (.env):**
```bash
GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:3000
```

### Firestore Collections

The following collections are created automatically on first use:
- `assets` - Asset metadata
- `assetData` - Image data

### Required Indexes

Composite indexes are defined in `firestore.indexes.json`:
- `(userId, source, createdAt)`
- `(userId, source, updatedAt)`
- `(userId, source, usageCount)`
- `(userId, fileHash)`

Deploy with: `firebase deploy --only firestore:indexes`

## Security

### Authentication

All asset endpoints require JWT authentication via the `requireAuth` middleware.

### Authorization

- Users can only access their own assets
- All queries filtered by `userId`
- Firestore rules enforce ownership

### Data Validation

- Required fields validated on create
- User ID cannot be changed after creation
- File hash immutable (prevents tampering)

## Performance

### Optimizations

- **Pagination**: 20 assets per page (configurable)
- **Lazy Loading**: Images loaded on demand
- **Separate Collections**: Keeps metadata queries fast
- **Indexed Queries**: All common queries have composite indexes

### Limits

- **Max Image Size**: ~1MB per image (Firestore document limit)
- **Max Assets**: Unlimited (pagination handles scale)
- **Storage**: Firestore pricing applies

For larger images, consider migrating to Cloud Storage (future enhancement).

## Troubleshooting

### Images Not Loading

**Problem**: Asset cards show placeholder instead of images

**Solutions**:
1. Check browser console for errors
2. Verify backend is running
3. Check authentication token in localStorage
4. Verify `/api/assets/:id/data` endpoint works

### "Database Unavailable" Error

**Problem**: Firestore not initialized

**Solutions**:
1. Check `GOOGLE_APPLICATION_CREDENTIALS` is set
2. Verify service account JSON file exists
3. Check Firebase project configuration

### Slow Queries

**Problem**: Asset list takes >5 seconds to load

**Solutions**:
1. Verify Firestore indexes are built
2. Check `firebase firestore:indexes` status
3. Reduce page size if needed
4. Check network latency

### Deduplication Not Working

**Problem**: Same image creates multiple assets

**Root Cause**: Images must be byte-identical

**Notes**:
- Different encoding = different hash
- Different compression = different hash
- This is intentional behavior

## Testing

### Manual Testing

See `plans/asset_manager_deployment_checklist.md` for complete testing checklist.

Quick smoke test:
```bash
1. Generate an image
2. Click "Save to Assets"
3. Open Asset Manager
4. Verify image appears
5. Delete image
6. Verify it's gone
```

### Automated Validation

Run pre-deployment checks:
```bash
./scripts/validate-asset-manager.sh
```

## Deployment

### Step-by-Step

1. **Run Validation**
```bash
./scripts/validate-asset-manager.sh
```

2. **Deploy Firestore**
```bash
./scripts/deploy-firestore.sh
```

3. **Wait for Indexes**
```bash
# Check status
firebase firestore:indexes
```

4. **Deploy Application**
```bash
# Backend
npm run deploy:backend

# Frontend
npm run deploy:frontend
```

5. **Verify**
- Test in production
- Check error logs
- Monitor performance

### Rollback

If issues occur:
```bash
# Revert to previous commit
git checkout <previous-commit>

# Redeploy
npm run deploy
```

## Future Enhancements

### Planned Features

**Short Term:**
- Drag-and-drop upload
- Asset preview modal
- Bulk operations
- Image compression

**Medium Term:**
- Cloud Storage migration
- Asset folders/collections
- User-to-user sharing
- AI auto-tagging

**Long Term:**
- Asset marketplace
- Template library
- Collaborative collections
- Semantic search

## Support

### Documentation

- **Complete Guide**: `plans/asset_manager_final_summary.md`
- **Quick Reference**: `plans/asset_manager_quick_reference.md`
- **Deployment Checklist**: `plans/asset_manager_deployment_checklist.md`

### Getting Help

1. Check documentation above
2. Review error logs
3. Check Firebase Console
4. Contact development team

## License

Same as main project.

## Contributors

- Asset Manager Implementation Team
- Version: 1.0.0
- Last Updated: 2026-02-08

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Deployment**: Ready
