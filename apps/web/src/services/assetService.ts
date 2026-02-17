import type { Asset, AssetFilters, AssetListResponse, CreateAssetInput, UpdateAssetInput } from '../types/asset';
import { db } from './db';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class AssetService {
    private readonly BASE_URL = `${API_BASE_URL}/api/assets`;

    /**
     * Get authentication token from localStorage
     * Returns null if not authenticated instead of throwing
     */
    private getAuthToken(): string | null {
        return localStorage.getItem('cc_auth_token');
    }

    /**
     * Build query string from filters
     */
    private buildQueryString(filters: AssetFilters): string {
        const params = new URLSearchParams();

        if (filters.source) params.append('source', filters.source);
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        if (filters.tags?.length) params.append('tags', filters.tags.join(','));
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.unused) params.append('unused', 'true');

        const queryString = params.toString();
        return queryString ? `?${queryString}` : '';
    }

    // --- Local Storage Helpers ---

    private async getLocalAssets(filters: AssetFilters): Promise<AssetListResponse> {
        let collection = db.localAssets.toCollection();

        // Basic Filtering (Dexie is limited compared to SQL/Mongo)
        if (filters.category) {
            collection = db.localAssets.where('category').equals(filters.category);
        }

        let assets = await collection.toArray();

        // In-memory filtering for other fields
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            assets = assets.filter(a => a.fileName.toLowerCase().includes(searchLower) || a.tags.some(t => t.toLowerCase().includes(searchLower)));
        }

        if (filters.tags && filters.tags.length > 0) {
            assets = assets.filter(a => filters.tags!.every(t => a.tags.includes(t)));
        }

        // Sorting
        assets.sort((a, b) => {
            const field = filters.sortBy || 'createdAt';
            const order = filters.sortOrder || 'desc';
            const valA = a[field] || 0;
            const valB = b[field] || 0;

            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });

        // Pagination
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const total = assets.length;
        const totalPages = Math.ceil(total / limit);
        const paginatedAssets = assets.slice((page - 1) * limit, page * limit);

        return {
            assets: paginatedAssets,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }

    /**
     * List assets with optional filters
     */
    async listAssets(filters: AssetFilters = {}): Promise<AssetListResponse> {
        const token = this.getAuthToken();

        if (!token) {
            return this.getLocalAssets(filters);
        }

        const queryString = this.buildQueryString(filters);

        const response = await fetch(`${this.BASE_URL}${queryString}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to fetch assets' }));
            throw new Error(error.userMessage || error.error || 'Failed to fetch assets');
        }

        return response.json();
    }

    /**
     * Get a specific asset by ID
     */
    async getAsset(id: string): Promise<Asset> {
        const token = this.getAuthToken();

        if (!token) {
            const asset = await db.localAssets.get(id);
            if (!asset) throw new Error('Asset not found locally');
            return asset;
        }

        const response = await fetch(`${this.BASE_URL}/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to fetch asset' }));
            throw new Error(error.userMessage || error.error || 'Failed to fetch asset');
        }

        const data = await response.json();
        return data.asset;
    }

    /**
     * Create a new asset (upload)
     */
    async createAsset(input: CreateAssetInput): Promise<Asset> {
        const token = this.getAuthToken();

        if (!token) {
            // Local Creation
            const id = crypto.randomUUID();
            // Simple hash... not real content addressing but ok for local
            const fileHash = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // 1. Save Image Blob
            if (input.imageData.startsWith('data:')) {
                // Convert base64 to blob? Or just store string? 
                // Dexie can store Blobs. Let's try to convert for better performance if possible, 
                // but for now, input.imageData is base64 string.
                // We will store it as a "CardImage" but we need to convert it.
                // Actually, our db.images table expects a Blob.
                const response = await fetch(input.imageData);
                const blob = await response.blob();

                await db.images.put({
                    id: fileHash,
                    blob: blob,
                    mimeType: input.mimeType || blob.type
                });
            }

            // 2. Create Asset Metadata
            const newAsset: Asset = {
                id,
                userId: 'guest',
                fileName: input.fileName,
                driveFileId: '', // No drive ID
                fileHash,
                mimeType: input.mimeType || 'image/png', // fallback
                fileSize: 0, // We could calculate from blob
                source: input.source,
                category: input.category || 'other',
                tags: input.tags || [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                usageCount: 0
            };

            await db.localAssets.add(newAsset);
            return newAsset;
        }

        const response = await fetch(this.BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to create asset' }));
            throw new Error(error.userMessage || error.error || 'Failed to create asset');
        }

        const data = await response.json();
        return data.asset;
    }

    /**
     * Import an asset from a URL (e.g. from search)
     */
    async importAsset(url: string, source: 'searched' | 'generated', metadata?: any): Promise<Asset> {
        const token = this.getAuthToken();

        if (!token) {
            // For guest, "importing" a URL typically means downloading it and saving it as a local blob
            // to avoid CORS issues later when displaying in canvas.
            // However, if it's a generated image (base64/blob url), we might be able to read it.
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();

                return new Promise((resolve, reject) => {
                    reader.onloadend = async () => {
                        const base64data = reader.result as string;
                        const asset = await this.createAsset({
                            imageData: base64data,
                            fileName: metadata?.title || `imported-${Date.now()}`,
                            source: source === 'generated' ? 'uploaded' : source,
                            category: metadata?.category || 'other',
                            mimeType: blob.type
                        });
                        resolve(asset);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.error("Failed to import asset locally", e);
                throw new Error("Failed to import asset locally");
            }
        }

        const response = await fetch(`${this.BASE_URL}/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, source, ...metadata }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to import asset' }));
            throw new Error(error.userMessage || error.error || 'Failed to import asset');
        }

        const data = await response.json();
        return data.asset;
    }

    /**
     * Update asset metadata
     */
    async updateAsset(id: string, updates: UpdateAssetInput): Promise<Asset> {
        const token = this.getAuthToken();

        if (!token) {
            const asset = await db.localAssets.get(id);
            if (!asset) throw new Error('Asset not found');

            const updatedAsset = { ...asset, ...updates, updatedAt: Date.now() };
            await db.localAssets.put(updatedAsset);
            return updatedAsset;
        }

        const response = await fetch(`${this.BASE_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to update asset' }));
            throw new Error(error.userMessage || error.error || 'Failed to update asset');
        }

        const data = await response.json();
        return data.asset;
    }

    /**
     * Delete an asset
     */
    async deleteAsset(id: string): Promise<void> {
        const token = this.getAuthToken();

        if (!token) {
            const asset = await db.localAssets.get(id);
            if (asset) {
                // Delete image blob if it exists
                if (asset.fileHash) {
                    await db.images.delete(asset.fileHash);
                }
                await db.localAssets.delete(id);
            }
            return;
        }

        const response = await fetch(`${this.BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to delete asset' }));
            throw new Error(error.userMessage || error.error || 'Failed to delete asset');
        }
    }

    /**
     * Delete multiple assets
     */
    async deleteAssets(ids: string[]): Promise<void> {
        const token = this.getAuthToken();

        if (!token) {
            for (const id of ids) {
                await this.deleteAsset(id);
            }
            return;
        }

        const response = await fetch(`${this.BASE_URL}/batch`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to delete assets' }));
            throw new Error(error.userMessage || error.error || 'Failed to delete assets');
        }
    }

    /**
     * Increment usage count for an asset
     */
    async incrementUsage(id: string): Promise<void> {
        const token = this.getAuthToken();

        if (!token) {
            const asset = await db.localAssets.get(id);
            if (asset) {
                await db.localAssets.update(id, {
                    usageCount: (asset.usageCount || 0) + 1,
                    lastUsedAt: Date.now()
                });
            }
            return;
        }

        const response = await fetch(`${this.BASE_URL}/${id}/use`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to update usage' }));
            throw new Error(error.userMessage || error.error || 'Failed to update usage');
        }
    }

    /**
     * Get asset image URL
     * Returns the base64 data URL for display
     */
    async fetchAssetData(asset: Asset): Promise<string> {
        const token = this.getAuthToken();

        if (!token) {
            // Local fetch
            if (!asset.fileHash) return '';
            const imageRecord = await db.images.get(asset.fileHash);
            if (imageRecord && imageRecord.blob) {
                // Convert blob to base64 for compatibility with current consumers which expect dataURI
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageRecord.blob);
                });
            }
            return '';
        }

        const response = await fetch(`${this.BASE_URL}/${asset.id}/data`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch asset data');
        }

        const data = await response.json();
        return data.dataUrl;
    }

    /**
     * Get asset image URL
     * Returns the base64 data URL for display
     * @deprecated Use fetchAssetData instead for async loading
     */
    getAssetImageUrl(asset: Asset): string {
        // For backwards compatibility or provisional URL construction
        // If driveFileId happens to be base64 (legacy), use it
        if (asset.driveFileId && asset.driveFileId.length > 100) {
            return `data:${asset.mimeType};base64,${asset.driveFileId}`;
        }
        return '';
    }

    /**
     * Save generated image to assets
     */
    async saveGeneratedImage(
        imageData: string,
        prompt: string,
        style: string,
        fileName?: string,
        tags?: string[],
        category: import('../types/asset').AssetCategory = 'main-illustration'
    ): Promise<Asset> {
        return this.createAsset({
            imageData,
            fileName: fileName || `${prompt.substring(0, 50)}`,
            source: 'uploaded', // We use 'uploaded' since it's from memory
            tags: tags || ['ai-generated', style],
            mimeType: 'image/png',
            category,
        });
    }
    /**
     * Sync local assets to cloud
     * Should be called after successful login
     */
    async syncLocalAssets(): Promise<number> {
        const token = this.getAuthToken();
        if (!token) return 0;

        const localAssets = await db.localAssets.toArray();
        if (localAssets.length === 0) return 0;

        console.log(`Found ${localAssets.length} local assets to sync...`);
        let syncedCount = 0;

        for (const localAsset of localAssets) {
            try {
                // 1. Get image data
                const imageRecord = await db.images.get(localAsset.fileHash);
                if (!imageRecord || !imageRecord.blob) {
                    // Corrupted local asset, delete it
                    await db.localAssets.delete(localAsset.id);
                    continue;
                }

                // 2. Convert blob to base64 for upload
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageRecord.blob);
                });

                // 3. Create cloud asset
                // We don't preserve the ID as the backend generates one
                await this.createAsset({
                    imageData: base64Data,
                    fileName: localAsset.fileName,
                    source: localAsset.source === 'generated' ? 'uploaded' : localAsset.source,
                    category: localAsset.category,
                    tags: localAsset.tags,
                    mimeType: localAsset.mimeType
                });

                // 4. Delete local copy
                await db.localAssets.delete(localAsset.id);
                if (localAsset.fileHash) {
                    await db.images.delete(localAsset.fileHash);
                }

                syncedCount++;
            } catch (err) {
                console.error(`Failed to sync asset ${localAsset.id}:`, err);
                // Continue with next asset
            }
        }

        return syncedCount;
    }
}

export const assetService = new AssetService();
