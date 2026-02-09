# Asset Manager - Backend Technical Specification

## Overview
This document provides detailed technical specifications for backend developers implementing the Asset Manager feature.

## API Endpoints

### 1. List Assets
**Endpoint:** `GET /api/assets`

**Authentication:** Required (JWT)

**Query Parameters:**
```typescript
{
  page?: number;          // Default: 1
  limit?: number;         // Default: 50, Max: 100
  source?: 'generated' | 'uploaded' | 'searched';
  sortBy?: 'createdAt' | 'updatedAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';  // Default: 'desc'
  search?: string;        // Search in fileName and tags
  tags?: string;          // Comma-separated tags
}
```

**Response:**
```typescript
{
  assets: Asset[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### 2. Get Asset by ID
**Endpoint:** `GET /api/assets/:id`

**Authentication:** Required (JWT)

**URL Parameters:**
- `id` - Asset ID

**Response:**
```typescript
{
  asset: Asset;
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Asset belongs to another user
- `404 Not Found` - Asset not found
- `500 Internal Server Error` - Server error

---

### 3. Create Asset (Upload)
**Endpoint:** `POST /api/assets`

**Authentication:** Required (JWT)

**Request Body:**
```typescript
{
  imageData: string;      // Base64 encoded image
  fileName: string;       // Display name
  source: 'uploaded' | 'searched';
  tags?: string[];        // Optional tags
  mimeType?: string;      // Default: 'image/png'
}
```

**Response:**
```typescript
{
  asset: Asset;
  message: string;
}
```

**Status Codes:**
- `201 Created` - Asset created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Not authenticated
- `409 Conflict` - Duplicate asset (returns existing asset)
- `413 Payload Too Large` - File too large
- `500 Internal Server Error` - Server error

---

### 4. Update Asset Metadata
**Endpoint:** `PUT /api/assets/:id`

**Authentication:** Required (JWT)

**URL Parameters:**
- `id` - Asset ID

**Request Body:**
```typescript
{
  fileName?: string;
  tags?: string[];
}
```

**Response:**
```typescript
{
  asset: Asset;
  message: string;
}
```

**Status Codes:**
- `200 OK` - Updated successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Asset belongs to another user
- `404 Not Found` - Asset not found
- `500 Internal Server Error` - Server error

---

### 5. Delete Asset
**Endpoint:** `DELETE /api/assets/:id`

**Authentication:** Required (JWT)

**URL Parameters:**
- `id` - Asset ID

**Response:**
```typescript
{
  message: string;
}
```

**Status Codes:**
- `200 OK` - Deleted successfully
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Asset belongs to another user
- `404 Not Found` - Asset not found
- `500 Internal Server Error` - Server error

---

### 6. Enhanced Image Generation
**Endpoint:** `POST /api/images/generate`

**Authentication:** Required (JWT + Premium)

**Request Body (Enhanced):**
```typescript
{
  prompt: string;
  style?: string;
  saveToAssets?: boolean;     // NEW - Auto-save to Asset Manager
  assetMetadata?: {           // NEW - Metadata if saving
    fileName?: string;
    tags?: string[];
  }
}
```

**Response:**
```typescript
{
  imageBase64: string;
  prompt: string;
  asset?: Asset;              // NEW - Included if saveToAssets=true
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not premium user
- `500 Internal Server Error` - Server error

---

## Database Schema

### Firestore Collection: `assets`

**Document Structure:**
```typescript
{
  id: string;                    // Auto-generated
  userId: string;                // Owner's auth UID
  fileName: string;              // Display name
  driveFileId: string;           // Google Drive file ID
  fileHash: string;              // SHA-256 hash
  mimeType: string;              // e.g., 'image/png'
  fileSize: number;              // Bytes
  source: 'generated' | 'uploaded' | 'searched';
  
  // For AI-generated images
  prompt?: string;
  style?: string;
  
  // Metadata
  tags: string[];
  createdAt: number;             // Timestamp (ms)
  updatedAt: number;             // Timestamp (ms)
  
  // Usage tracking
  usageCount: number;            // Default: 0
  lastUsedAt?: number;           // Timestamp (ms)
}
```

**Indexes Required:**
```javascript
// Composite indexes (create via Firebase Console or CLI)
[
  { fields: ['userId', 'createdAt'], order: 'DESC' },
  { fields: ['userId', 'source', 'createdAt'], order: 'DESC' },
  { fields: ['userId', 'updatedAt'], order: 'DESC' },
  { fields: ['userId', 'usageCount'], order: 'DESC' },
]
```

**Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /assets/{assetId} {
      // Allow read if owner
      allow read: if request.auth != null 
                  && request.auth.uid == resource.data.userId;
      
      // Allow create if authenticated and userId matches
      allow create: if request.auth != null 
                    && request.auth.uid == request.resource.data.userId;
      
      // Allow update if owner and not changing userId
      allow update: if request.auth != null 
                    && request.auth.uid == resource.data.userId
                    && request.resource.data.userId == resource.data.userId;
      
      // Allow delete if owner
      allow delete: if request.auth != null 
                    && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## Service Implementation

### File: `apps/backend/src/services/assetService.ts`

```typescript
import { db } from '../config/firebase';
import { driveService } from './driveService';
import crypto from 'crypto';

export interface Asset {
  id: string;
  userId: string;
  fileName: string;
  driveFileId: string;
  fileHash: string;
  mimeType: string;
  fileSize: number;
  source: 'generated' | 'uploaded' | 'searched';
  prompt?: string;
  style?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  lastUsedAt?: number;
}

export interface CreateAssetInput {
  userId: string;
  imageData: string;  // Base64
  fileName: string;
  source: 'generated' | 'uploaded' | 'searched';
  mimeType?: string;
  prompt?: string;
  style?: string;
  tags?: string[];
}

export interface AssetFilters {
  source?: 'generated' | 'uploaded' | 'searched';
  search?: string;
  tags?: string[];
  sortBy?: 'createdAt' | 'updatedAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

class AssetService {
  private readonly COLLECTION = 'assets';
  private readonly DRIVE_FOLDER = 'CardCraft/Assets';

  /**
   * Calculate SHA-256 hash of image data
   */
  private calculateHash(imageData: string): string {
    return crypto
      .createHash('sha256')
      .update(imageData)
      .digest('hex');
  }

  /**
   * Check if asset with same hash already exists
   */
  private async findDuplicateAsset(
    userId: string, 
    fileHash: string
  ): Promise<Asset | null> {
    const snapshot = await db
      .collection(this.COLLECTION)
      .where('userId', '==', userId)
      .where('fileHash', '==', fileHash)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as Asset;
  }

  /**
   * Create new asset
   * Handles deduplication - if same image exists, returns existing asset
   */
  async createAsset(input: CreateAssetInput): Promise<Asset> {
    const fileHash = this.calculateHash(input.imageData);

    // Check for duplicate
    const existingAsset = await this.findDuplicateAsset(
      input.userId, 
      fileHash
    );

    if (existingAsset) {
      // Return existing asset instead of creating duplicate
      return existingAsset;
    }

    // Upload to Google Drive
    const buffer = Buffer.from(input.imageData.split(',')[1], 'base64');
    const fileSize = buffer.length;
    const mimeType = input.mimeType || 'image/png';
    const extension = mimeType.split('/')[1];
    const driveFileName = `${fileHash}.${extension}`;

    const driveFileId = await driveService.uploadFile(
      this.DRIVE_FOLDER,
      driveFileName,
      buffer,
      mimeType,
      input.userId
    );

    // Create Firestore document
    const assetId = db.collection(this.COLLECTION).doc().id;
    const now = Date.now();

    const asset: Asset = {
      id: assetId,
      userId: input.userId,
      fileName: input.fileName,
      driveFileId,
      fileHash,
      mimeType,
      fileSize,
      source: input.source,
      prompt: input.prompt,
      style: input.style,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    };

    await db.collection(this.COLLECTION).doc(assetId).set(asset);

    return asset;
  }

  /**
   * List assets for a user with filters and pagination
   */
  async listAssets(
    userId: string, 
    filters: AssetFilters = {}
  ): Promise<{ assets: Asset[]; pagination: any }> {
    const {
      source,
      search,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = filters;

    let query = db
      .collection(this.COLLECTION)
      .where('userId', '==', userId);

    // Apply source filter
    if (source) {
      query = query.where('source', '==', source);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Get total count (before pagination)
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);

    const snapshot = await query.get();
    let assets = snapshot.docs.map(doc => doc.data() as Asset);

    // Client-side filtering for search and tags (Firestore limitation)
    if (search) {
      const searchLower = search.toLowerCase();
      assets = assets.filter(asset =>
        asset.fileName.toLowerCase().includes(searchLower) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (tags && tags.length > 0) {
      assets = assets.filter(asset =>
        tags.some(tag => asset.tags.includes(tag))
      );
    }

    return {
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single asset by ID
   */
  async getAsset(assetId: string, userId: string): Promise<Asset> {
    const doc = await db.collection(this.COLLECTION).doc(assetId).get();

    if (!doc.exists) {
      throw new Error('Asset not found');
    }

    const asset = doc.data() as Asset;

    if (asset.userId !== userId) {
      throw new Error('Forbidden: Asset belongs to another user');
    }

    return asset;
  }

  /**
   * Update asset metadata
   */
  async updateAsset(
    assetId: string,
    userId: string,
    updates: Partial<Pick<Asset, 'fileName' | 'tags'>>
  ): Promise<Asset> {
    // Verify ownership
    await this.getAsset(assetId, userId);

    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    };

    await db.collection(this.COLLECTION).doc(assetId).update(updateData);

    return this.getAsset(assetId, userId);
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string, userId: string): Promise<void> {
    const asset = await this.getAsset(assetId, userId);

    // Check if other assets use the same Drive file (same hash)
    const snapshot = await db
      .collection(this.COLLECTION)
      .where('userId', '==', userId)
      .where('fileHash', '==', asset.fileHash)
      .get();

    // Only delete from Drive if this is the last reference
    if (snapshot.size <= 1) {
      try {
        await driveService.deleteFile(asset.driveFileId, userId);
      } catch (error) {
        console.error('Failed to delete from Drive:', error);
        // Continue with Firestore deletion even if Drive fails
      }
    }

    // Delete Firestore document
    await db.collection(this.COLLECTION).doc(assetId).delete();
  }

  /**
   * Increment usage count
   */
  async incrementUsage(assetId: string, userId: string): Promise<void> {
    // Verify ownership
    await this.getAsset(assetId, userId);

    await db.collection(this.COLLECTION).doc(assetId).update({
      usageCount: db.FieldValue.increment(1) as any,
      lastUsedAt: Date.now(),
    });
  }
}

export const assetService = new AssetService();
```

---

## Router Implementation

### File: `apps/backend/src/routes/assets.ts`

```typescript
import express from 'express';
import { assetService } from '../services/assetService';
import { requireAuth } from '../middleware/requireAuth';
import { ApiError } from '../utils/ApiError';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/assets - List all assets for user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.uid;
    const filters = {
      source: req.query.source as any,
      search: req.query.search as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      sortBy: (req.query.sortBy as any) || 'createdAt',
      sortOrder: (req.query.sortOrder as any) || 'desc',
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 50, 100),
    };

    const result = await assetService.listAssets(userId, filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/assets/:id - Get specific asset
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.uid;
    const asset = await assetService.getAsset(req.params.id, userId);
    res.json({ asset });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Asset not found') {
        return next(new ApiError(404, 'Not Found', 'Asset not found'));
      }
      if (error.message.includes('Forbidden')) {
        return next(new ApiError(403, 'Forbidden', error.message));
      }
    }
    next(error);
  }
});

/**
 * POST /api/assets - Create new asset
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user!.uid;
    const { imageData, fileName, source, mimeType, tags } = req.body;

    if (!imageData || !fileName || !source) {
      throw new ApiError(
        400,
        'Bad Request',
        'imageData, fileName, and source are required'
      );
    }

    if (!['uploaded', 'searched'].includes(source)) {
      throw new ApiError(
        400,
        'Bad Request',
        'source must be "uploaded" or "searched"'
      );
    }

    const asset = await assetService.createAsset({
      userId,
      imageData,
      fileName,
      source,
      mimeType,
      tags,
    });

    res.status(201).json({
      asset,
      message: 'Asset created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/assets/:id - Update asset metadata
 */
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.uid;
    const { fileName, tags } = req.body;

    const updates: any = {};
    if (fileName !== undefined) updates.fileName = fileName;
    if (tags !== undefined) updates.tags = tags;

    const asset = await assetService.updateAsset(
      req.params.id,
      userId,
      updates
    );

    res.json({
      asset,
      message: 'Asset updated successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return next(new ApiError(403, 'Forbidden', error.message));
    }
    next(error);
  }
});

/**
 * DELETE /api/assets/:id - Delete asset
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.uid;
    await assetService.deleteAsset(req.params.id, userId);

    res.json({
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Asset not found') {
        return next(new ApiError(404, 'Not Found', 'Asset not found'));
      }
      if (error.message.includes('Forbidden')) {
        return next(new ApiError(403, 'Forbidden', error.message));
      }
    }
    next(error);
  }
});

export const assetRouter = router;
```

---

## App Integration

### File: `apps/backend/src/app.ts`

Add the asset router:

```typescript
import { assetRouter } from './routes/assets';

// ... existing code ...

app.use('/api/assets', assetRouter);
```

---

## Enhanced Image Generation

### File: `apps/backend/src/routes/images.ts`

Update the generate endpoint:

```typescript
router.post('/generate', requirePremium, async (req, res, next) => {
  try {
    const { prompt, style, saveToAssets, assetMetadata } = req.body;

    if (!prompt) {
      throw new ApiError(400, 'Prompt is required', 'The "prompt" field is missing.');
    }

    const imageBase64 = await googleImagenService.generateImage(prompt, style);

    let asset;
    if (saveToAssets) {
      asset = await assetService.createAsset({
        userId: req.user!.uid,
        imageData: imageBase64,
        fileName: assetMetadata?.fileName || `Generated: ${prompt.substring(0, 50)}`,
        source: 'generated',
        prompt,
        style,
        tags: assetMetadata?.tags || [],
        mimeType: 'image/png',
      });
    }

    res.json({ 
      imageBase64, 
      prompt,
      asset 
    });
  } catch (error) {
    next(error);
  }
});
```

---

## Testing

### Test File: `apps/backend/tests/routes/assets.test.ts`

```typescript
import request from 'supertest';
import { app } from '../../src/app';
import { assetService } from '../../src/services/assetService';

describe('Asset Routes', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup test auth token
    authToken = 'test-token';
  });

  describe('GET /api/assets', () => {
    it('should list assets for authenticated user', async () => {
      const response = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('assets');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .get('/api/assets')
        .expect(401);
    });
  });

  describe('POST /api/assets', () => {
    it('should create new asset', async () => {
      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageData: 'data:image/png;base64,iVBORw0KGgo...',
          fileName: 'Test Image',
          source: 'uploaded',
        })
        .expect(201);

      expect(response.body.asset).toHaveProperty('id');
      expect(response.body.asset.fileName).toBe('Test Image');
    });

    it('should return 400 for missing fields', async () => {
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ fileName: 'Test' })
        .expect(400);
    });
  });

  // Add more tests...
});
```

---

## Deployment Checklist

- [ ] Create Firestore indexes
- [ ] Update Firestore security rules
- [ ] Deploy backend code
- [ ] Test endpoints in staging
- [ ] Monitor error logs
- [ ] Set up Google Drive folder structure
- [ ] Document API for frontend team

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-07
