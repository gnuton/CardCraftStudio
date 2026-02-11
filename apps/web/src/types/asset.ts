export type AssetCategory = 'front-background' | 'back-background' | 'main-illustration' | 'icon' | 'other';

export interface Asset {
    id: string;
    userId: string;
    fileName: string;
    driveFileId: string;
    fileHash: string;
    mimeType: string;
    fileSize: number;
    source: 'generated' | 'uploaded' | 'searched';
    category: AssetCategory;

    // For AI-generated images
    prompt?: string;
    style?: string;

    // Metadata
    tags: string[];
    createdAt: number;
    updatedAt: number;

    // Usage tracking
    usageCount: number;
    lastUsedAt?: number;
}

export interface AssetFilters {
    source?: 'generated' | 'uploaded' | 'searched';
    category?: AssetCategory;
    search?: string;
    tags?: string[];
    sortBy?: 'createdAt' | 'updatedAt' | 'usageCount';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface AssetListResponse {
    assets: Asset[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CreateAssetInput {
    imageData: string;
    fileName: string;
    source: 'uploaded' | 'searched';
    category?: AssetCategory;
    tags?: string[];
    mimeType?: string;
}

export interface UpdateAssetInput {
    fileName?: string;
    tags?: string[];
    category?: AssetCategory;
}
