# Asset Manager Implementation Plan

## Overview
This document outlines the architecture and implementation plan for the **Asset Manager** feature in CardCraft Studio. The Asset Manager will provide centralized storage and management for all generated and uploaded images, making them accessible across all decks for a user.

## Problem Statement
Currently, when users generate images using Vertex AI:
- ✅ The image is successfully generated
- ❌ There's no way to save the image for later use
- ❌ Users must immediately use the image or lose it
- ❌ No library of previously generated assets exists
- ❌ Images cannot be reused across different decks

## Solution: Asset Manager

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│  • Profile Dropdown → Asset Manager Menu Item                │
│  • Asset Manager Modal/Page                                  │
│  • Image Generation Dialog (Enhanced)                        │
│  • Card Editor (Enhanced with Asset Picker)                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Application Services Layer                 │
├─────────────────────────────────────────────────────────────┤
│  • AssetService (New)                                        │
│  • ImageProviderService (Enhanced)                           │
│  • DriveService (Enhanced)                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend API Layer                       │
├─────────────────────────────────────────────────────────────┤
│  • /api/assets - CRUD operations                             │
│  • /api/assets/upload - Upload new asset                     │
│  • /api/assets/:id - Get specific asset                      │
│  • /api/images/generate - Enhanced to auto-save             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Storage Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Google Drive: /CardCraft/Assets/<hash>.png                  │
│  Firestore: assets collection (metadata)                     │
│    - userId, assetId, fileName, type, createdAt,            │
│      driveFileId, tags, prompt (for AI generated)           │
└─────────────────────────────────────────────────────────────┘
```

## UI/UX Design

### 1. Profile Dropdown Enhancement

**Location:** Top-right corner of the app (User Profile component)

**Current Menu:**
```
┌─────────────────────┐
│ Email               │
├─────────────────────┤
│ 👑 Upgrade to Pro   │
│ 🚪 Sign Out         │
└─────────────────────┘
```

**Enhanced Menu:**
```
┌─────────────────────┐
│ Email               │
├─────────────────────┤
│ 📁 Asset Manager    │  ← NEW
│ 👑 Upgrade to Pro   │
│ 🚪 Sign Out         │
└─────────────────────┘
```

### 2. Asset Manager Interface

**Modal/Full Page View** (based on the generated sketch)

#### Header Section:
- **Title:** "Asset Manager"
- **Search Bar:** Real-time search by name/tags
- **Filter Tabs:** 
  - All Assets
  - Generated (AI)
  - Uploaded
  - Recent

#### Asset Grid:
- **Card Layout** with the following info per asset:
  - Thumbnail preview (150x150px)
  - Asset name/description
  - Creation date
  - Source indicator (AI Generated / Uploaded)
  - Tags (if any)
  - **Actions:**
    - "Add to Card" - Quick add to current card
    - Preview (full size)
    - Delete
    - Download
    - Copy link

#### Footer/Actions:
- Upload new asset button
- Bulk operations (select multiple for delete)
- Storage usage indicator (optional)

### 3. Image Generation Dialog Enhancement

**Current Flow:**
```
Generate Image → Preview → "Use This Image"
```

**Enhanced Flow:**
```
Generate Image → Preview → [ "Save to Assets" | "Use This Image" ]
                             ↓
                    Automatically saved to Asset Manager
```

**New UI Elements:**
- **"Save to Asset Manager"** button (prominent, next to "Use This Image")
- **Success Toast:** "Image saved to Asset Manager!"
- **Optional:** Auto-save checkbox for automatic saving of all generated images

### 4. Card Image Selection Enhancement

**Current:** User selects from Upload, Search, or Generate tabs

**Enhanced:** Add **"My Assets"** tab to ImageProviderDialog

```
┢━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Upload │ Search │ Generate │ My Assets ┃  ← NEW TAB
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│                                     │
│   [Asset grid similar to Asset     │
│    Manager but optimized for       │
│    quick selection]                │
│                                     │
└─────────────────────────────────────┘
```

## Data Model

### Firestore Schema

**Collection:** `assets`

```typescript
interface Asset {
  id: string;                    // Auto-generated UUID
  userId: string;                // Owner of the asset
  fileName: string;              // Original/display name
  driveFileId: string;           // Google Drive file ID
  fileHash: string;              // SHA-256 hash for deduplication
  mimeType: string;              // e.g., "image/png"
  fileSize: number;              // In bytes
  source: 'generated' | 'uploaded' | 'searched';
  
  // For AI-generated images
  prompt?: string;               // Original prompt
  style?: string;                // Art style used
  
  // Metadata
  tags: string[];                // User-defined tags
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp
  
  // Usage tracking (optional)
  usageCount?: number;           // How many times used
  lastUsedAt?: number;           // Last usage timestamp
}
```

### Google Drive Structure

```
Google Drive Root
└── CardCraft/
    ├── Assets/
    │   ├── <hash1>.png
    │   ├── <hash2>.png
    │   └── ...
    └── Decks/
        ├── deck-<id1>.json
        └── deck-<id2>.json
```

**Benefits:**
- Centralized asset storage
- Deduplication via hash
- Easy backup and restore
- Cross-device sync via Google Drive

## Implementation Phases

### Phase 1: Backend Infrastructure (Backend Dev)

**Priority:** High  
**Estimated Time:** 2-3 days

#### Tasks:

1. **Create Asset Service** (`apps/backend/src/services/assetService.ts`)
   - CRUD operations for assets
   - Integration with Firestore
   - Integration with Google Drive
   - Deduplication logic (check hash before upload)

2. **Create Asset Router** (`apps/backend/src/routes/assets.ts`)
   ```typescript
   GET    /api/assets          - List all assets for user
   GET    /api/assets/:id      - Get specific asset
   POST   /api/assets          - Upload new asset
   DELETE /api/assets/:id      - Delete asset
   PUT    /api/assets/:id      - Update asset metadata (tags, name)
   ```

3. **Enhance Image Generation Endpoint** (`apps/backend/src/routes/images.ts`)
   - Add optional `saveToAssets` parameter
   - Auto-save generated images to Asset Manager when flag is true
   - Return asset metadata along with image

4. **Add Firestore Security Rules**
   ```javascript
   match /assets/{assetId} {
     allow read, write: if request.auth != null 
                        && request.auth.uid == resource.data.userId;
   }
   ```

5. **Tests**
   - Unit tests for assetService
   - Integration tests for asset routes
   - Test deduplication logic

### Phase 2: Frontend Services (Frontend Dev)

**Priority:** High  
**Estimated Time:** 1-2 days

#### Tasks:

1. **Create Asset Service** (`apps/web/src/services/assetService.ts`)
   ```typescript
   class AssetService {
     async listAssets(filters?: AssetFilters): Promise<Asset[]>
     async getAsset(id: string): Promise<Asset>
     async uploadAsset(file: File, metadata: AssetMetadata): Promise<Asset>
     async deleteAsset(id: string): Promise<void>
     async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset>
     async saveGeneratedImage(imageData: string, prompt: string, style: string): Promise<Asset>
   }
   ```

2. **Enhance Image Provider Service** (`apps/web/src/services/imageProviderService.ts`)
   - Add `saveToAssets` option to `generateImage()` method
   - Handle automatic asset saving

3. **Add Asset Types** (`apps/web/src/types/asset.ts`)
   - TypeScript interfaces for Asset model
   - Filter and metadata types

### Phase 3: UI Components (Frontend Dev)

**Priority:** High  
**Estimated Time:** 3-4 days

#### Tasks:

1. **Create AssetManager Component** (`apps/web/src/components/AssetManager.tsx`)
   - Full modal/page interface
   - Asset grid with thumbnails
   - Search and filter functionality
   - CRUD operations UI
   - Responsive design (mobile-friendly)

2. **Create AssetCard Component** (`apps/web/src/components/AssetCard.tsx`)
   - Individual asset display
   - Thumbnail preview
   - Action buttons (use, delete, preview)
   - Hover effects and animations

3. **Create AssetPicker Component** (`apps/web/src/components/AssetPicker.tsx`)
   - Simplified version for quick selection
   - Used in ImageProviderDialog
   - Grid or list view toggle

4. **Enhance UserProfile Component** (`apps/web/src/components/UserProfile.tsx`)
   - Add "Asset Manager" menu item
   - Handle click to open AssetManager

5. **Enhance ImageProviderDialog** (`apps/web/src/components/ImageProviderDialog/`)
   - Add "My Assets" tab
   - Integrate AssetPicker component
   - Add "Save to Assets" button in GenerateTab

6. **Create AssetPreviewDialog** (`apps/web/src/components/AssetPreviewDialog.tsx`)
   - Full-size image preview
   - Asset details display
   - Quick actions

### Phase 4: Integration & Polish (Frontend Dev)

**Priority:** Medium  
**Estimated Time:** 1-2 days

#### Tasks:

1. **App.tsx Integration**
   - Add AssetManager state management
   - Handle modal opening/closing
   - Sync assets on login

2. **Enhanced Card Editor**
   - Quick access to Asset Manager from image elements
   - "Browse Assets" button in image selection

3. **Success Flows & Toasts**
   - "Image saved to Asset Manager"
   - "Asset added to card"
   - "Asset deleted"
   - Error handling and user feedback

4. **Loading States**
   - Skeleton loaders for asset grid
   - Upload progress indicators
   - Generation + save combined loading

### Phase 5: DevOps & Deployment (DevOps)

**Priority:** Medium  
**Estimated Time:** 1 day

#### Tasks:

1. **Environment Configuration**
   - No new env variables needed (uses existing Google Drive + Firestore)
   - Verify permissions for Drive API

2. **Firestore Index Creation**
   - Create composite indexes for asset queries:
     - `(userId, createdAt)`
     - `(userId, source, createdAt)`

3. **Storage Quotas**
   - Monitor Google Drive usage
   - Set up alerts for approaching limits
   - Document user storage limits (if any)

4. **Deployment**
   - Deploy backend changes
   - Deploy frontend changes
   - Smoke test in production

### Phase 6: Testing & QA (All Teams)

**Priority:** High  
**Estimated Time:** 1-2 days

#### Tasks:

1. **Unit Tests**
   - Backend services and routes
   - Frontend services
   - Component unit tests

2. **Integration Tests**
   - End-to-end asset creation flow
   - Asset usage in card creation
   - Sync across devices

3. **User Acceptance Testing**
   - Generate image → Save → Use in card
   - Upload image → Save → Use in multiple cards
   - Delete asset workflow
   - Search and filter functionality

4. **Performance Testing**
   - Large asset libraries (100+ assets)
   - Image loading performance
   - Search performance

## Technical Considerations

### 1. Deduplication Strategy
- Calculate SHA-256 hash of image data
- Check if hash exists in Firestore before uploading to Drive
- If exists, create new asset record pointing to existing Drive file
- Saves storage and bandwidth

### 2. Permissions & Security
- **Per-user isolation:** Assets are private to each user
- **Firestore rules:** Enforce userId matching
- **Drive permissions:** Assets stored in user's own Drive
- **API authentication:** All endpoints require valid auth token

### 3. Performance Optimization
- **Lazy loading:** Load asset thumbnails as user scrolls
- **Caching:** Cache asset list in memory with expiration
- **Pagination:** Load assets in batches of 20-50
- **Thumbnail generation:** Store thumbnails separately for faster loading (future enhancement)

### 4. Migration Strategy
- No migration needed - this is a new feature
- Existing images continue to work as-is
- Users can optionally save existing card images to Asset Manager

### 5. Sync Behavior
- Assets sync to Google Drive immediately on save
- Asset metadata syncs to Firestore
- Cross-device: Assets available on all devices once synced
- Offline: View cached assets, save queued for next sync

## User Stories

### Story 1: Save Generated Image
```gherkin
Given I am a premium user
When I generate an image using AI
Then I should see a "Save to Asset Manager" button
When I click "Save to Asset Manager"
Then the image should be saved to my assets
And I should see a success toast notification
And the image should appear in my Asset Manager
```

### Story 2: Browse Asset Manager
```gherkin
Given I am logged in
When I click on my profile icon
Then I should see "Asset Manager" in the dropdown menu
When I click "Asset Manager"
Then I should see a modal/page with all my saved assets
And I should be able to search and filter assets
And I should see thumbnails, names, and creation dates
```

### Story 3: Use Asset in Card
```gherkin
Given I am editing a card
And I am adding an image to the card
When I click on an image element
Then I should see a "My Assets" tab
When I click "My Assets"
Then I should see all my saved assets
When I click on an asset
Then the asset should be added to my card
And I should see a success notification
```

### Story 4: Upload Custom Asset
```gherkin
Given I am in the Asset Manager
When I click "Upload Asset"
Then I should see an upload dialog
When I select an image file
Then the file should upload to my Asset Manager
And it should appear in my asset grid
And it should be available across all my decks
```

### Story 5: Delete Asset
```gherkin
Given I am viewing my assets
When I click delete on an asset
Then I should see a confirmation dialog
When I confirm deletion
Then the asset should be removed from my Asset Manager
And the file should be deleted from Google Drive
And I should see a success notification
```

## Success Metrics

### User Engagement
- % of premium users using Asset Manager
- Average assets saved per user
- Asset reuse rate (asset used in multiple cards)

### Technical Performance
- Asset load time < 2 seconds
- Search response time < 500ms
- Upload success rate > 99%

### User Satisfaction
- Feature usage after 1 week
- Support tickets related to asset management
- User feedback/ratings

## Future Enhancements

### v2 Features (Nice to Have)
1. **Asset Collections/Folders**
   - Organize assets into custom collections
   - "Fire Dragons", "Landscapes", "Characters", etc.

2. **Advanced Tagging**
   - Auto-tagging using AI image recognition
   - Tag suggestions based on content

3. **Asset Sharing**
   - Share assets with other users
   - Public asset marketplace

4. **Batch Operations**
   - Multi-select and bulk delete
   - Bulk tag editing
   - Export multiple assets

5. **Asset Variations**
   - Generate variations of existing assets
   - Style transfer on saved assets

6. **Analytics Dashboard**
   - Most used assets
   - Storage usage breakdown
   - Asset usage trends

7. **Asset Templates**
   - Pre-made asset packs
   - Template categories

8. **Enhanced Metadata**
   - Custom metadata fields
   - Color palette extraction
   - Dimension tracking

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Google Drive storage limits | High | Implement quotas, notify users, compress images |
| Large asset libraries slow performance | Medium | Pagination, lazy loading, thumbnail caching |
| Duplicate assets wasting storage | Medium | Hash-based deduplication |
| Complex sync logic causes bugs | High | Comprehensive testing, incremental rollout |
| Users confused by new UI | Medium | Clear onboarding, tooltips, documentation |

## Dependencies

### External Services
- ✅ Google Drive API (already integrated)
- ✅ Firestore (already integrated)
- ✅ Vertex AI / Imagen (already integrated)

### Internal Dependencies
- User authentication system
- Existing image service
- Drive sync service

### No New Dependencies Required! 🎉

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Deploy to staging environment
- Internal team testing
- Fix critical bugs

### Phase 2: Beta Release (Week 2)
- Enable for 10% of premium users
- Collect feedback
- Monitor performance metrics

### Phase 3: General Availability (Week 3)
- Full rollout to all users
- Announce feature via email/blog
- Create tutorial video

## Estimation Summary

| Team | Tasks | Time Estimate |
|------|-------|---------------|
| **Backend Dev** | Asset API, Firestore integration, Enhanced image endpoint | 2-3 days |
| **Frontend Dev** | Asset Manager UI, Services, Integration | 5-6 days |
| **DevOps** | Deployment, Monitoring, Indexes | 1 day |
| **QA** | Testing, Bug fixing | 1-2 days |
| **Total** | | **9-12 days** |

## Questions for Discussion

1. **Storage Limits:** Should we impose per-user asset limits? (e.g., 100 assets or 500MB)
2. **Default Behavior:** Should generated images auto-save to Asset Manager by default?
3. **UI Preference:** Modal overlay vs. full-page view for Asset Manager?
4. **Asset Organization:** Start with flat list or implement folders from the beginning?
5. **Thumbnail Size:** What dimensions for thumbnails? (150x150, 200x200, or auto-aspect?)
6. **Free vs Premium:** Should free users have limited asset storage?

---

**Document Version:** 1.0  
**Date:** 2026-02-07  
**Author:** CardCraft Studio Architecture Team  
**Status:** Draft - Pending Approval
