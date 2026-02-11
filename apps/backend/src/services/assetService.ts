import { db } from './firestore';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { Asset, CreateAssetInput, AssetFilters, AssetListResponse, AssetCategory } from '../types/asset';
import { ApiError } from '../utils/ApiError';

class AssetService {
    private readonly COLLECTION_NAME = 'assets';
    private readonly DRIVE_FOLDER = 'CardCraft/Assets';

    /**
     * Get Firestore collection with safety check
     */
    private get collection() {
        const database = db();
        if (!database) {
            throw new ApiError(500, 'Database unavailable', 'Firestore is not configured');
        }
        return database.collection(this.COLLECTION_NAME);
    }

    /**
     * Calculate SHA-256 hash of image data
     */
    private calculateHash(imageData: string): string {
        // Remove data URL prefix if present
        const base64Data = imageData.includes(',')
            ? imageData.split(',')[1]
            : imageData;

        return crypto
            .createHash('sha256')
            .update(base64Data)
            .digest('hex');
    }

    /**
     * Check if asset with same hash already exists for user
     */
    private async findDuplicateAsset(
        userId: string,
        fileHash: string
    ): Promise<Asset | null> {
        const snapshot = await this.collection
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
    * Upload file data to Firestore (stores base64 in document)
    * For MVP, we store images directly in Firestore
    * If file is large (>900KB), we chunk it into subcollections
    * Future: Move to Cloud Storage or Drive
    */
    private async uploadToStorage(
        fileName: string,
        buffer: Buffer,
        mimeType: string,
        userId: string
    ): Promise<{ storageId: string; dataUrl: string }> {
        const database = db();
        if (!database) {
            throw new ApiError(500, 'Database unavailable', 'Firestore is not configured');
        }

        const storageId = this.collection.doc().id;
        const base64Full = buffer.toString('base64');
        const MAX_SIZE = 900 * 1024; // 900KB safety limit for document size

        // If simple base64 is small enough, store directly
        if (base64Full.length < MAX_SIZE) {
            const dataUrl = `data:${mimeType};base64,${base64Full}`;
            await database.collection('assetData').doc(storageId).set({
                userId,
                dataUrl,
                mimeType,
                size: buffer.length,
                createdAt: Date.now(),
            });
            console.log(`[AssetService] Stored image data: ${storageId} (${buffer.length} bytes)`);
            return { storageId, dataUrl };
        }

        // Function to chunk large files
        const CHUNK_SIZE = 900 * 1024;
        const totalChunks = Math.ceil(base64Full.length / CHUNK_SIZE);
        const batch = database.batch();

        // Create main document
        const mainDocRef = database.collection('assetData').doc(storageId);
        batch.set(mainDocRef, {
            userId,
            isChunked: true,
            chunkCount: totalChunks,
            mimeType,
            size: buffer.length,
            createdAt: Date.now(),
        });

        // Create chunks
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = start + CHUNK_SIZE;
            const chunkData = base64Full.substring(start, end);

            const chunkRef = mainDocRef.collection('chunks').doc(i.toString());
            batch.set(chunkRef, {
                data: chunkData,
                index: i
            });
        }

        await batch.commit();
        console.log(`[AssetService] Stored chunked image data: ${storageId} (${buffer.length} bytes, ${totalChunks} chunks)`);

        // Return constructed data URL (though unused by createAsset, maintains interface)
        return { storageId, dataUrl: `data:${mimeType};base64,${base64Full}` };
    }

    /**
     * Delete file data from Firestore
     */
    private async deleteFromStorage(storageId: string, userId: string): Promise<void> {
        const database = db();
        if (!database) {
            throw new ApiError(500, 'Database unavailable', 'Firestore is not configured');
        }

        // Verify ownership before deleting
        const docRef = database.collection('assetData').doc(storageId);
        const doc = await docRef.get();

        if (doc.exists && doc.data()?.userId === userId) {
            const data = doc.data();

            // If chunked, delete all chunks first
            if (data?.isChunked) {
                const chunksSnapshot = await docRef.collection('chunks').get();
                const batch = database.batch();
                chunksSnapshot.docs.forEach(chunkDoc => {
                    batch.delete(chunkDoc.ref);
                });
                await batch.commit();
            }

            // Delete main document
            await docRef.delete();
            console.log(`[AssetService] Deleted image data: ${storageId}`);
        }
    }

    /**
     * Get image data URL from Firestore
     */
    async getAssetDataUrl(storageId: string, userId: string): Promise<string> {
        const database = db();
        if (!database) {
            throw new ApiError(500, 'Database unavailable', 'Firestore is not configured');
        }

        const docRef = database.collection('assetData').doc(storageId);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new ApiError(404, 'Asset data not found', 'The asset image data does not exist');
        }

        const data = doc.data();
        if (data?.userId !== userId) {
            throw new ApiError(403, 'Forbidden', 'You do not have permission to access this asset');
        }

        // Handle chunked data
        if (data?.isChunked) {
            const chunksSnapshot = await docRef.collection('chunks').orderBy('index').get();
            const base64Full = chunksSnapshot.docs.map(d => d.data().data).join('');
            return `data:${data.mimeType};base64,${base64Full}`;
        }

        return data.dataUrl;
    }

    /**
     * Import asset from URL
     */
    async importFromUrl(
        url: string,
        userId: string,
        metadata: {
            source: 'searched' | 'generated';
            category?: AssetCategory;
            tags?: string[];
            prompt?: string;
            style?: string;
        }
    ): Promise<Asset> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new ApiError(400, 'Failed to fetch image', `Could not download image from URL: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const mimeType = response.headers.get('content-type') || 'image/jpeg';

            // Validate mime type
            if (!mimeType.startsWith('image/')) {
                throw new ApiError(400, 'Invalid file type', 'The URL did not return an image');
            }

            const base64Data = buffer.toString('base64');
            const imageData = `data:${mimeType};base64,${base64Data}`;

            // Extract filename from URL or generate one
            let fileName = url.split('/').pop()?.split('?')[0] || `imported-${Date.now()}`;
            if (!fileName.includes('.')) {
                const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
                fileName = `${fileName}.${ext}`;
            }

            return this.createAsset({
                userId,
                imageData,
                fileName,
                source: metadata.source,
                category: metadata.category,
                tags: metadata.tags,
                prompt: metadata.prompt,
                style: metadata.style,
                mimeType,
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Import Failed', error instanceof Error ? error.message : 'Unknown error importing image');
        }
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
            // Apply runtime migration to returned duplicate
            if (!existingAsset.category) {
                existingAsset.category = 'main-illustration';
            }
            console.log(`[AssetService] Duplicate detected, returning existing asset: ${existingAsset.id}`);
            return existingAsset;
        }

        // Decode base64 to get file size
        const base64Data = input.imageData.includes(',')
            ? input.imageData.split(',')[1]
            : input.imageData;
        const buffer = Buffer.from(base64Data, 'base64');
        const fileSize = buffer.length;

        // Determine file extension from mimeType
        const mimeType = input.mimeType || 'image/png';
        let extension = mimeType.split('/')[1] || 'png';

        // Handle special cases like svg+xml
        if (extension.includes('svg')) {
            extension = 'svg';
        }

        // Clean filename if it doesn't have extension or has a different one
        let fileName = input.fileName;
        if (!fileName.toLowerCase().endsWith(`.${extension}`)) {
            if (fileName.indexOf('.') === -1) {
                fileName = `${fileName}.${extension}`;
            }
        }

        // Fallback if fileName is still just the hash
        if (!fileName) {
            fileName = `${fileHash}.${extension}`;
        }

        // Upload to Firestore storage
        const { storageId } = await this.uploadToStorage(
            fileName,
            buffer,
            mimeType,
            input.userId
        );

        // Create Firestore document
        const assetId = this.collection.doc().id;
        const now = Date.now();

        const asset: Asset = {
            id: assetId,
            userId: input.userId,
            fileName: fileName,
            driveFileId: storageId, // Store storageId as driveFileId for now
            fileHash,
            mimeType,
            fileSize,
            source: input.source,
            category: input.category || 'main-illustration',
            ...(input.prompt ? { prompt: input.prompt } : {}),
            ...(input.style ? { style: input.style } : {}),
            tags: input.tags || [],
            createdAt: now,
            updatedAt: now,
            usageCount: 0,
        };

        await this.collection.doc(assetId).set(asset);

        console.log(`[AssetService] Created asset: ${assetId} for user: ${input.userId}`);
        return asset;
    }

    /**
     * List assets for a user with filters and pagination
     */
    async listAssets(
        userId: string,
        filters: AssetFilters = {}
    ): Promise<AssetListResponse> {
        const {
            source,
            category,
            search,
            tags,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 50,
        } = filters;

        // Build query
        let query: any = this.collection.where('userId', '==', userId);

        // Apply source filter
        if (source) {
            query = query.where('source', '==', source);
        }

        // Apply category filter
        // Note: Legacy assets won't have a category field, so they won't match any filter except no-filter
        // To handle "main-illustration" catching legacy assets, we have to do it client-side (in memory)
        // or update all assets. For MVP we'll fetch and filter in memory if category is 'main-illustration'.
        if (category && category !== 'main-illustration') {
            query = query.where('category', '==', category);
        }

        // Apply sorting
        query = query.orderBy(sortBy, sortOrder);

        // Get total count (before pagination)
        // Note: count() might be inaccurate if we do memory filtering later
        const countSnapshot = await query.count().get();
        let total = countSnapshot.data().count;

        // Execute Query
        // If we need to capture legacy assets for 'main-illustration', we can't use limit here if we filtered by it
        // But since we didn't filter by 'main-illustration' in query (see above), we satisfy "All" or "Main".

        let snapshot;
        if (category === 'main-illustration') {
            // Fetch more to ensure we have enough after filtering/migrating
            // This is imperfect for pagination but acceptable for MVP without migration script
            snapshot = await query.limit(limit * 2).get();
        } else {
            const offset = (page - 1) * limit;
            snapshot = await query.offset(offset).limit(limit).get();
        }

        let assets = snapshot.docs.map((doc: any) => {
            const data = doc.data() as Asset;
            // Runtime migration
            if (!data.category) {
                data.category = 'main-illustration';
            }
            return data;
        });

        // Filter by category for 'main-illustration' (to include legacy)
        if (category) {
            assets = assets.filter((asset: Asset) => asset.category === category);
        }

        // Client-side filtering for search and tags
        if (search) {
            const searchLower = search.toLowerCase();
            assets = assets.filter((asset: Asset) =>
                asset.fileName.toLowerCase().includes(searchLower) ||
                asset.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
                (asset.prompt && asset.prompt.toLowerCase().includes(searchLower))
            );
        }

        if (tags && tags.length > 0) {
            assets = assets.filter((asset: Asset) =>
                tags.some((tag: string) => asset.tags.includes(tag))
            );
        }

        // Manual Pagination if we messed with it (e.g. main-illustration)
        if (category === 'main-illustration') {
            // Recalculate total roughly? Or just return what we have? 
            // Correct pagination with in-memory filtering is hard without fetching all.
            // For now, we'll just slice the current page.
            total = assets.length; // Approximate for this batch
            // Apply offset/limit purely on the fetched set ( which was 2x limit)
            // This effectively resets pagination to page 1 logic for this special case if we don't fetch all
        }

        return {
            assets,
            pagination: {
                page,
                limit,
                total, // This might be approximate when mixing filters
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get single asset by ID
     */
    async getAsset(assetId: string, userId: string): Promise<Asset> {
        const doc = await this.collection.doc(assetId).get();

        if (!doc.exists) {
            throw new ApiError(404, 'Asset not found', 'The requested asset does not exist');
        }

        const asset = doc.data() as Asset;

        if (asset.userId !== userId) {
            throw new ApiError(403, 'Forbidden', 'You do not have permission to access this asset');
        }

        // Runtime migration
        if (!asset.category) {
            asset.category = 'main-illustration';
        }

        return asset;
    }

    /**
     * Update asset metadata
     */
    async updateAsset(
        assetId: string,
        userId: string,
        updates: Partial<Pick<Asset, 'fileName' | 'tags' | 'category'>>
    ): Promise<Asset> {
        // Verify ownership
        await this.getAsset(assetId, userId);

        const updateData: any = {
            ...updates,
            updatedAt: Date.now(),
        };

        await this.collection.doc(assetId).update(updateData);

        return this.getAsset(assetId, userId);
    }

    /**
     * Delete asset
     */
    async deleteAsset(assetId: string, userId: string): Promise<void> {
        const asset = await this.getAsset(assetId, userId);

        // Check if other assets use the same storage file (same hash)
        const snapshot = await this.collection
            .where('userId', '==', userId)
            .where('fileHash', '==', asset.fileHash)
            .get();

        // Only delete from storage if this is the last reference
        if (snapshot.size <= 1) {
            try {
                await this.deleteFromStorage(asset.driveFileId, userId);
            } catch (error) {
                console.error('[AssetService] Failed to delete from storage:', error);
                // Continue with Firestore deletion even if storage fails
            }
        }

        // Delete Firestore document
        await this.collection.doc(assetId).delete();
        console.log(`[AssetService] Deleted asset: ${assetId}`);
    }

    /**
     * Increment usage count
     */
    async incrementUsage(assetId: string, userId: string): Promise<void> {
        // Verify ownership
        await this.getAsset(assetId, userId);

        const database = db();
        if (!database) {
            throw new ApiError(500, 'Database unavailable', 'Firestore is not configured');
        }

        await this.collection.doc(assetId).update({
            // @ts-ignore
            usageCount: FieldValue.increment(1) as any,
            lastUsedAt: Date.now(),
        });
    }
}

export const assetService = new AssetService();
