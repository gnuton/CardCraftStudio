import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { Asset, AssetFilters, AssetCategory } from '../../types/asset';
import { assetService } from '../../services/assetService';
import { driveService } from '../../services/googleDrive';
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

    // New state for filters and bulk actions
    const [showUnusedOnly, setShowUnusedOnly] = useState(false);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
                category,
                unused: showUnusedOnly
            };

            if (searchQuery.trim()) {
                filters.search = searchQuery;
            }

            const response = await assetService.listAssets(filters);
            setAssets(response.assets);
            setTotalPages(response.pagination.totalPages);

            // Clear selection if reloaded (safety)
            if (!isBulkMode) {
                setSelectedIds(new Set());
            }
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
    }, [page, category, searchQuery, showUnusedOnly]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [category, searchQuery, showUnusedOnly]);

    const handleAssetClick = (asset: Asset) => {
        if (isBulkMode) {
            handleToggleSelection(asset.id);
        } else if (onAssetSelect) {
            assetService.incrementUsage(asset.id).catch(console.error);
            onAssetSelect(asset);
        }
    };

    const handleToggleSelection = (assetId: string) => {
        // If not in bulk mode, enter it
        if (!isBulkMode) {
            setIsBulkMode(true);
        }

        setSelectedIds(prevSelectedIds => {
            const newSelected = new Set(prevSelectedIds);
            if (newSelected.has(assetId)) {
                newSelected.delete(assetId);
            } else {
                newSelected.add(assetId);
            }
            return newSelected;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === assets.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(assets.map(a => a.id)));
        }
    };

    const handleAssetDelete = async (id: string) => {
        try {
            // 1. Delete from Backend (Firestore)
            await assetService.deleteAsset(id);

            // 2. Try to delete from Google Drive if signed in
            // We need the hash to find the file: img-{hash}
            // But we already deleted the asset, so we might not have the hash?
            // Actually 'assets' state still has it until we reload.
            const assetToDelete = assets.find(a => a.id === id);

            if (assetToDelete && assetToDelete.fileHash && driveService.isSignedIn) {
                try {
                    const fileName = `img-${assetToDelete.fileHash}`;
                    // List files to find ID
                    const files = await driveService.listFiles();
                    // Use loose matching or strict? 
                    // The file name is usually `img-{hash}.{ext}`
                    const driveFile = files.find((f: any) => f.name.startsWith(fileName));

                    if (driveFile) {
                        await driveService.deleteFile(driveFile.id);
                        console.log(`Deleted from Drive: ${driveFile.name}`);
                    }
                } catch (driveErr) {
                    console.error('Failed to delete from Drive:', driveErr);
                    // improve user feedback? or just log it since it's secondary
                }
            }

            // Reload assets
            loadAssets();
        } catch (err) {
            console.error('Failed to delete asset:', err);
            alert('Failed to delete asset');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        if (!confirm(`Delete ${selectedIds.size} assets? This cannot be undone.`)) {
            return;
        }

        try {
            // 1. Delete from Backend
            await assetService.deleteAssets(Array.from(selectedIds));

            // 2. Delete from Drive
            if (driveService.isSignedIn) {
                try {
                    const files = await driveService.listFiles();

                    for (const id of selectedIds) {
                        const asset = assets.find(a => a.id === id);
                        if (asset && asset.fileHash) {
                            const fileName = `img-${asset.fileHash}`;
                            const driveFile = files.find((f: any) => f.name.startsWith(fileName));
                            if (driveFile) {
                                await driveService.deleteFile(driveFile.id);
                            }
                        }
                    }
                } catch (driveErr) {
                    console.error('Failed to bulk delete from Drive:', driveErr);
                }
            }

            setSelectedIds(new Set());
            setIsBulkMode(false);
            loadAssets();
        } catch (err) {
            console.error('Failed to delete assets:', err);
            alert('Failed to delete selected assets');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1d23]">
            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-700">
                <div className="flex flex-col gap-4">
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

                    {/* Toolbar Actions */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={showUnusedOnly}
                                    onChange={(e) => setShowUnusedOnly(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-pink-500 focus:ring-pink-500"
                                />
                                Show unused only
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            {isBulkMode ? (
                                <>
                                    <span className="text-sm text-gray-400 mr-2">
                                        {selectedIds.size} selected
                                    </span>
                                    <button
                                        onClick={handleSelectAll}
                                        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
                                    >
                                        {selectedIds.size === assets.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={selectedIds.size === 0}
                                        className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors border border-red-500/30 disabled:opacity-50"
                                    >
                                        Delete Selected
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsBulkMode(false);
                                            setSelectedIds(new Set());
                                        }}
                                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsBulkMode(true)}
                                    className="px-3 py-1.5 text-sm bg-[#25282e] hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
                                >
                                    Select Multiple
                                </button>
                            )}
                        </div>
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
                        isBulkMode={isBulkMode}
                        isPickingMode={!!onAssetSelect}
                        selectedIds={selectedIds}
                        onToggleSelection={handleToggleSelection}
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
