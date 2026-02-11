import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { Asset, AssetFilters, AssetCategory } from '../../types/asset';
import { assetService } from '../../services/assetService';
import { AssetGrid } from '../AssetGrid';

interface AssetLibraryProps {
    onAssetSelect?: (asset: Asset) => void;
    category: AssetCategory;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ onAssetSelect, category }) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // Load assets
    const loadAssets = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const filters: AssetFilters = {
                page,
                limit: 20,
                sortBy: 'createdAt',
                sortOrder: 'desc',
                category
            };

            if (searchQuery.trim()) {
                filters.search = searchQuery;
            }

            const response = await assetService.listAssets(filters);
            setAssets(response.assets);
            setTotalPages(response.pagination.totalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load assets');
            console.error('Failed to load assets:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Load assets when filters change
    useEffect(() => {
        loadAssets();
    }, [page, category, searchQuery]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [category, searchQuery]);

    const handleAssetClick = (asset: Asset) => {
        if (onAssetSelect) {
            assetService.incrementUsage(asset.id).catch(console.error);
            onAssetSelect(asset);
        }
    };

    const handleAssetDelete = async (id: string) => {
        try {
            await assetService.deleteAsset(id);
            // Reload assets
            loadAssets();
        } catch (err) {
            console.error('Failed to delete asset:', err);
            alert('Failed to delete asset');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1d23]">
            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-700">
                <div className="flex gap-4 flex-col sm:flex-row">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search library..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#25282e] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                        />
                    </div>

                </div>
            </div>

            {/* Asset Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {error ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                        <p className="text-red-400">{error}</p>
                        <button
                            onClick={loadAssets}
                            className="mt-2 text-sm text-pink-400 hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <AssetGrid
                        assets={assets}
                        onAssetClick={handleAssetClick}
                        onAssetDelete={handleAssetDelete}
                        isLoading={isLoading}
                        selectionMode={!!onAssetSelect}
                    />
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-6 border-t border-gray-700 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-[#25282e] text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-gray-400 text-sm">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-[#25282e] text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};
