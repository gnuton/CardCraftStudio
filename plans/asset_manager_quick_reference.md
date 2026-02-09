# Asset Manager - Quick Reference Card

## 🎯 What It Does
Save, organize, and reuse AI-generated images and uploaded assets across your card decks.

## 🚀 How to Use (End User)

### Save a Generated Image
1. Generate an image with AI in the Image Provider Dialog
2. Click **"Save to Assets"** button (purple)
3. Success! ✅ message appears
4. Image is now in your Asset Manager

### Access Asset Manager
1. Click your **profile button** (top right)
2. Click **"Asset Manager"** menu item
3. Modal opens showing all your saved assets

### Find an Asset
- **Search**: Type in search box (searches names, tags, prompts)
- **Filter**: Click All Assets | ✨ AI Generated | 📁 Uploaded
- **Navigate**: Use Previous/Next buttons for pagination

### Use an Asset
1. Click any asset card
2. Asset details appear / added to card (implementation dependent)
3. Usage count automatically increments

### Delete an Asset
1. Hover over asset card
2. Click **trash icon** 🗑️
3. Confirm deletion
4. Asset removed (if it's a duplicate, storage is kept for other copies)

## 💻 How to Use (Developer)

### Backend API Endpoints

```bash
# List assets
GET /api/assets?source=generated&page=1&limit=20
Headers: Authorization: Bearer {token}

# Get asset metadata
GET /api/assets/:id
Headers: Authorization: Bearer {token}

# Get asset image data
GET /api/assets/:id/data
Headers: Authorization: Bearer {token}

# Create asset
POST /api/assets
Headers: Authorization: Bearer {token}
Body: { imageData, fileName, source, tags, mimeType }

# Update asset
PUT /api/assets/:id
Headers: Authorization: Bearer {token}
Body: { fileName, tags }

# Delete asset
DELETE /api/assets/:id
Headers: Authorization: Bearer {token}

# Track usage
POST /api/assets/:id/use
Headers: Authorization: Bearer {token}

# Generate with auto-save
POST /api/images/generate
Headers: Authorization: Bearer {token}
Body: { prompt, style, saveToAssets: true, assetMetadata: { fileName, tags } }
```

### Frontend Usage

```typescript
import { assetService } from '../services/assetService';

// Save generated image
const asset = await assetService.saveGeneratedImage(
  imageBase64,
  prompt,
  style,
  fileName,
  tags
);

// List assets
const { assets, pagination } = await assetService.listAssets({
  source: 'generated',
  search: 'dragon',
  page: 1,
  limit: 20
});

// Get specific asset
const asset = await assetService.getAsset(assetId);

// Delete asset
await assetService.deleteAsset(assetId);

// Update asset
const updated = await assetService.updateAsset(assetId, {
  fileName: 'New Name',
  tags: ['tag1', 'tag2']
});
```

### Open Asset Manager Modal

```typescript
import { AssetManager } from '../components/AssetManager';

// In your component
const [isOpen, setIsOpen] = useState(false);

<AssetManager
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onAssetSelect={(asset) => {
    // Handle asset selection
    console.log('Selected:', asset);
  }}
/>
```

## 📊 Data Models

### Asset Type
```typescript
interface Asset {
  id: string;                    // Unique ID
  userId: string;                // Owner's user ID  
  fileName: string;              // Display name
  driveFileId: string;           // Storage ID (in assetData collection)
  fileHash: string;              // SHA-256 hash for deduplication
  mimeType: string;              // e.g., 'image/png'
  fileSize: number;              // Bytes
  source: 'generated' | 'uploaded' | 'searched';
  prompt?: string;               // For AI-generated images
  style?: string;                // For AI-generated images
  tags: string[];                // Searchable tags
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp
  usageCount: number;            // Times used
  lastUsedAt?: number;           // Last usage timestamp
}
```

### Firestore Collections
```
/assets/{assetId} - Asset metadata
/assetData/{storageId} - Image data (base64 dataURL)
```

## 🔑 Key Features

### Deduplication
- Automatically detects duplicate images via SHA-256 hash
- Returns existing asset instead of creating duplicate
- Shared storage for identical images

### Smart Delete
- Checks if other assets use same image
- Only deletes storage if last reference
- Always safe to delete without breaking other assets

### Performance
- **Pagination**: 20 assets per page
- **Lazy Loading**: Images load on demand
- **Efficient Storage**: Separate collections for metadata vs data

## 🐛 Troubleshooting

### Images Not Loading
- Check browser console for errors
- Verify `authToken` in localStorage
- Check network tab for failed API calls
- Verify backend is running

### "Database unavailable" Error
- Firestore may not be initialized
- Check `GOOGLE_APPLICATION_CREDENTIALS` env variable
- Verify Firebase project configuration

### Duplicate Detection Not Working
- Images must be **byte-identical** to be detected as duplicates
- Different encoding or compression = different hash = separate assets

### Save to Assets Button Not Working
- Must be logged in (requires authentication)
- Check browser console for errors
- Verify image was successfully generated first

## 📁 File Locations

### Backend
```
apps/backend/src/
├── types/asset.ts              # Type definitions
├── services/assetService.ts    # Business logic
├── middleware/requireAuth.ts   # Authentication
└── routes/
    ├── assets.ts               # Asset endpoints
    └── images.ts               # Enhanced with save support
```

### Frontend
```
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
```

## 🎨 UI Components

### AssetManager Props
```typescript
interface AssetManagerProps {
  isOpen: boolean;              // Show/hide modal
  onClose: () => void;          // Close handler
  onAssetSelect?: (asset: Asset) => void;  // Selection handler (optional)
}
```

### AssetCard Props
```typescript
interface AssetCardProps {
  asset: Asset;                 // Asset to display
  onClick: () => void;          // Click handler
  onDelete: (id: string) => void;  // Delete handler
}
```

### AssetGrid Props
```typescript
interface AssetGridProps {
  assets: Asset[];              // Assets to display
  onAssetClick: (asset: Asset) => void;  // Click handler
  onAssetDelete: (id: string) => void;   // Delete handler
  isLoading?: boolean;          // Show loading state
}
```

## ⚙️ Configuration

### Environment Variables
```bash
# Backend (.env)
GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json

# Frontend (.env)
VITE_API_URL=http://localhost:3000  # or production URL
```

### Firestore Indexes (Required)
Create these in Firebase Console before production:
- `assets`: (userId, source, createdAt)
- `assets`: (userId, updatedAt)  
- `assets`: (userId, usageCount)
- `assets`: (userId, fileHash)

## 📝 Common Tasks

### Add New Asset Source Type
1. Update `source` type in `apps/backend/src/types/asset.ts`
2. Update `source` type in `apps/web/src/types/asset.ts`
3. Add filter button in `AssetManager.tsx`
4. Create save handler for new source

### Change Image Storage
1. Update `uploadToStorage()` in `assetService.ts`
2. Update `deleteFromStorage()` in `assetService.ts`
3. Update `getAssetDataUrl()` in `assetService.ts`
4. Keep `driveFileId` field (just store new storage reference)

### Add New Metadata Field
1. Add to `Asset` interface in both backend and frontend types
2. Add to `CreateAssetInput` if needed for creation
3. Update Firestore document creation in `createAsset()`
4. Update UI to display/edit new field

## 🎯 Quick Wins

### Enable Upload from Computer
```typescript
// In ImageProviderDialog, add new UploadTab.tsx
const handleFileUpload = async (file: File) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const imageData = e.target?.result as string;
    await assetService.createAsset({
      imageData,
      fileName: file.name,
      source: 'uploaded',
      mimeType: file.type,
      tags: []
    });
  };
  reader.readAsDataURL(file);
};
```

### Enable Save from Search Results
```typescript
// In SearchTab.tsx
const handleSaveSearchResult = async (imageUrl: string) => {
  await assetService.createAsset({
    imageData: imageUrl,
    fileName: `Search: ${searchQuery}`,
    source: 'searched',
    tags: [searchQuery],
    mimeType: 'image/jpeg'
  });
};
```

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-07  
**Status:** Production Ready ✅
