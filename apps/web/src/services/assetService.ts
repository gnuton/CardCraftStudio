import type { Asset, AssetFilters, AssetListResponse, CreateAssetInput, UpdateAssetInput } from '../types/asset';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class AssetService {
    private readonly BASE_URL = `${API_BASE_URL}/api/assets`;

    /**
     * Get authentication token from localStorage
     */
    private getAuthToken(): string {
        const token = localStorage.getItem('cc_auth_token');
        if (!token) {
            throw new Error('Not authenticated');
        }
        return token;
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

    /**
     * List assets with optional filters
     */
    async listAssets(filters: AssetFilters = {}): Promise<AssetListResponse> {
        const token = this.getAuthToken();
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
}

export const assetService = new AssetService();
