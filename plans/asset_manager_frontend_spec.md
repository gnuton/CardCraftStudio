# Asset Manager - Frontend Technical Specification

## Overview
This document provides detailed technical specifications for frontend developers implementing the Asset Manager UI and services.

## Component Architecture

```
App.tsx
├── UserProfile.tsx (Enhanced)
│   └── AssetManager.tsx (NEW - Modal)
│       ├── AssetGrid.tsx (NEW)
│       │   └── AssetCard.tsx (NEW)
│       ├── AssetPreviewDialog.tsx (NEW)
│       └── AssetUploadDialog.tsx (NEW)
│
├── CardStudio.tsx
│   └── ImageProviderDialog (Enhanced)
│       ├── UploadTab.tsx
│       ├── SearchTab.tsx
│       ├── GenerateTab.tsx (Enhanced)
│       └── AssetsTab.tsx (NEW)
│           └── AssetPicker.tsx (NEW)
```

---

## Type Definitions

### File: `apps/web/src/types/asset.ts`

```typescript
export interface Asset {
  id: string;
  userId: string;
  fileName: string;
  driveFileId: string;
  fileHash: string;
  mimeType: string;
  fileSize: number;
  source: 'generated' | 'uploaded' | 'searched';
  
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
  tags?: string[];
  mimeType?: string;
}

export interface UpdateAssetInput {
  fileName?: string;
  tags?: string[];
}
```

---

## Service Layer

### File: `apps/web/src/services/assetService.ts`

```typescript
import { Asset, AssetFilters, AssetListResponse, CreateAssetInput, UpdateAssetInput } from '../types/asset';

class AssetService {
  private readonly BASE_URL = '/api/assets';

  /**
   * Get authentication token from localStorage or auth context
   */
  private async getAuthToken(): Promise<string> {
    const token = localStorage.getItem('authToken');
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
    if (filters.search) params.append('search', filters.search);
    if (filters.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * List assets with optional filters
   */
  async listAssets(filters: AssetFilters = {}): Promise<AssetListResponse> {
    const token = await this.getAuthToken();
    const queryString = this.buildQueryString(filters);

    const response = await fetch(`${this.BASE_URL}${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.userMessage || error.error || 'Failed to fetch assets');
    }

    return response.json();
  }

  /**
   * Get a specific asset by ID
   */
  async getAsset(id: string): Promise<Asset> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.userMessage || error.error || 'Failed to fetch asset');
    }

    const data = await response.json();
    return data.asset;
  }

  /**
   * Create a new asset (upload)
   */
  async createAsset(input: CreateAssetInput): Promise<Asset> {
    const token = await this.getAuthToken();

    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.userMessage || error.error || 'Failed to create asset');
    }

    const data = await response.json();
    return data.asset;
  }

  /**
   * Update asset metadata
   */
  async updateAsset(id: string, updates: UpdateAssetInput): Promise<Asset> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.userMessage || error.error || 'Failed to update asset');
    }

    const data = await response.json();
    return data.asset;
  }

  /**
   * Delete an asset
   */
  async deleteAsset(id: string): Promise<void> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.userMessage || error.error || 'Failed to delete asset');
    }
  }

  /**
   * Get asset image URL (from Drive)
   */
  async getAssetImageUrl(asset: Asset): Promise<string> {
    // Use the existing imageService to get the image from Drive
    // This assumes the imageService can handle Drive file IDs
    // For now, construct a URL or return base64
    
    // Option 1: Return a Drive download URL
    return `https://www.googleapis.com/drive/v3/files/${asset.driveFileId}?alt=media`;
    
    // Option 2: Use existing imageService to get base64
    // return imageService.getImageByHash(asset.fileHash);
  }

  /**
   * Save generated image to assets
   */
  async saveGeneratedImage(
    imageData: string,
    prompt: string,
    style: string,
    fileName?: string,
    tags?: string[]
  ): Promise<Asset> {
    return this.createAsset({
      imageData,
      fileName: fileName || `Generated: ${prompt.substring(0, 50)}`,
      source: 'uploaded', // We use 'uploaded' since it's from memory
      tags: tags || ['ai-generated', style],
      mimeType: 'image/png',
    });
  }
}

export const assetService = new AssetService();
```

---

## Component Implementations

### 1. AssetManager Component

**File:** `apps/web/src/components/AssetManager.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { X, Search, Upload, Filter } from 'lucide-react';
import { assetService } from '../services/assetService';
import { Asset, AssetFilters } from '../types/asset';
import { AssetGrid } from './AssetGrid';
import { AssetPreviewDialog } from './AssetPreviewDialog';

interface AssetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetSelect?: (asset: Asset) => void;
}

export const AssetManager: React.FC<AssetManagerProps> = ({
  isOpen,
  onClose,
  onAssetSelect,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [filters, setFilters] = useState<AssetFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 50,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'generated' | 'uploaded'>('all');

  // Load assets
  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen, filters]);

  const loadAssets = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await assetService.listAssets(filters);
      setAssets(response.assets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, search: query, page: 1 }));
  };

  const handleFilterChange = (filter: 'all' | 'generated' | 'uploaded') => {
    setActiveFilter(filter);
    setFilters(prev => ({
      ...prev,
      source: filter === 'all' ? undefined : filter,
      page: 1,
    }));
  };

  const handleAssetClick = (asset: Asset) => {
    if (onAssetSelect) {
      onAssetSelect(asset);
      onClose();
    } else {
      setSelectedAsset(asset);
    }
  };

  const handleDelete = async (assetId: string) => {
    try {
      await assetService.deleteAsset(assetId);
      setAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#1a1d23] rounded-2xl shadow-2xl border border-gray-800 w-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Asset Manager
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Controls */}
          <div className="p-6 border-b border-gray-800 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#25282e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'generated', 'uploaded'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeFilter === filter
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                      : 'bg-[#25282e] text-gray-400 hover:text-white'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-red-400">
                {error}
              </div>
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Upload className="w-16 h-16 mb-4 opacity-50" />
                <p>No assets found</p>
                <p className="text-sm">Upload or generate images to get started</p>
              </div>
            ) : (
              <AssetGrid
                assets={assets}
                onAssetClick={handleAssetClick}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      {selectedAsset && (
        <AssetPreviewDialog
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};
```

### 2. AssetCard Component

**File:** `apps/web/src/components/AssetCard.tsx`

```typescript
import React, { useState } from 'react';
import { Trash2, Eye, Download, Image as ImageIcon } from 'lucide-react';
import { Asset } from '../types/asset';
import { assetService } from '../services/assetService';

interface AssetCardProps {
  asset: Asset;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick, onDelete }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);

  React.useEffect(() => {
    loadImage();
  }, [asset]);

  const loadImage = async () => {
    try {
      const url = await assetService.getAssetImageUrl(asset);
      setImageUrl(url);
    } catch (err) {
      console.error('Failed to load image:', err);
    } finally {
      setImageLoading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${asset.fileName}"?`)) {
      onDelete(asset.id);
    }
  };

  const formattedDate = new Date(asset.createdAt).toLocaleDateString();

  return (
    <div
      className="group relative bg-[#25282e] rounded-xl border border-gray-700 overflow-hidden transition-all hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/20 cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Image Preview */}
      <div className="aspect-square relative bg-gray-900">
        {imageLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent" />
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={asset.fileName}
            className="w-full h-full object-cover"
            onError={() => setImageUrl(null)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}

        {/* Overlay Actions */}
        {showActions && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Preview"
            >
              <Eye className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleDelete}
              className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
          </div>
        )}

        {/* Source Badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            asset.source === 'generated'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}>
            {asset.source === 'generated' ? '✨ AI' : '📁 Uploaded'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-white truncate mb-1">
          {asset.fileName}
        </h3>
        <p className="text-xs text-gray-400">
          {formattedDate}
        </p>
        {asset.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
      >
        Add to Card
      </button>
    </div>
  );
};
```

### 3. AssetGrid Component

**File:** `apps/web/src/components/AssetGrid.tsx`

```typescript
import React from 'react';
import { Asset } from '../types/asset';
import { AssetCard } from './AssetCard';

interface AssetGridProps {
  assets: Asset[];
  onAssetClick: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  onAssetClick,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onClick={() => onAssetClick(asset)}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
```

### 4. Enhanced UserProfile Component

**File:** `apps/web/src/components/UserProfile.tsx` (Update)

Add the Asset Manager menu item:

```typescript
// ... existing imports ...
import { Folder } from 'lucide-react';
import { AssetManager } from './AssetManager';

export const UserProfile: React.FC = () => {
  // ... existing code ...
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        {/* ... existing profile code ... */}
        
        <div className="absolute right-0 mt-2 w-48 bg-background border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
          <div className="p-3 border-b">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <div className="p-1">
            {/* NEW: Asset Manager */}
            <button
              onClick={() => setIsAssetManagerOpen(true)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
            >
              <Folder className="w-4 h-4" />
              Asset Manager
            </button>

            {/* ... existing menu items ... */}
          </div>
        </div>
      </div>

      {/* Asset Manager Modal */}
      <AssetManager
        isOpen={isAssetManagerOpen}
        onClose={() => setIsAssetManagerOpen(false)}
      />
    </>
  );
};
```

### 5. Enhanced GenerateTab Component

**File:** `apps/web/src/components/ImageProviderDialog/GenerateTab.tsx` (Update)

Add "Save to Assets" button:

```typescript
// ... existing imports ...
import { Save } from 'lucide-react';
import { assetService } from '../../services/assetService';

export const GenerateTab: React.FC<GenerateTabProps> = ({ onImageSelect }) => {
  // ... existing state ...
  const [saving, setSaving] = useState(false);

  // ... existing handleGenerate ...

  const handleSaveToAssets = async () => {
    if (!generatedImage || !prompt) return;

    setSaving(true);
    try {
      await assetService.saveGeneratedImage(
        generatedImage,
        prompt,
        style
      );
      // Show success toast (implement via context)
      alert('Image saved to Asset Manager!');
    } catch (err) {
      setError('Failed to save to Asset Manager');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PremiumGate feature="generate">
      <div className="flex flex-col h-full space-y-4">
        {/* ... existing code ... */}

        {/* Enhanced Preview Area */}
        <div className="flex-1 flex items-center justify-center">
          {generatedImage ? (
            <div className="space-y-4 w-full">
              <div className="relative rounded-lg overflow-hidden border-2 border-pink-500">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-auto"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSaveToAssets}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save to Assets
                </button>
                <button
                  onClick={handleUseImage}
                  className="px-4 py-2 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Use This Image
                </button>
              </div>
            </div>
          ) : !loading && (
            {/* ... existing empty state ... */}
          )}
        </div>
      </div>
    </PremiumGate>
  );
};
```

---

## Testing

### Test File: `apps/web/src/components/AssetManager.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssetManager } from './AssetManager';
import { assetService } from '../services/assetService';

jest.mock('../services/assetService');

describe('AssetManager', () => {
  const mockAssets = [
    {
      id: '1',
      fileName: 'Test Asset',
      source: 'generated',
      createdAt: Date.now(),
      // ... other fields
    },
  ];

  beforeEach(() => {
    (assetService.listAssets as jest.Mock).mockResolvedValue({
      assets: mockAssets,
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
  });

  it('should render when open', () => {
    render(<AssetManager isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Asset Manager')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<AssetManager isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('Asset Manager')).not.toBeInTheDocument();
  });

  it('should load and display assets', async () => {
    render(<AssetManager isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Test Asset')).toBeInTheDocument();
    });
  });

  // Add more tests...
});
```

---

## Styling Guidelines

### Color Palette
- **Primary Background:** `#1a1d23`
- **Secondary Background:** `#25282e`
- **Border:** `#374151` (gray-700)
- **Accent Gradient:** `from-pink-500 to-purple-600`
- **Text Primary:** `#ffffff`
- **Text Secondary:** `#9ca3af` (gray-400)

### Component Patterns
- **Cards:** Rounded corners (`rounded-xl`), subtle borders, hover effects
- **Buttons:** Gradient backgrounds for primary actions, solid for secondary
- **Inputs:** Dark background with focus rings
- **Modals:** Backdrop blur with dark overlay

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-07
