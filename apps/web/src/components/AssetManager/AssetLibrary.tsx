import React, { useState, useEffect } from 'react';
import { Search, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { Asset, AssetFilters, AssetCategory } from '../../types/asset';
import { assetService } from '../../services/assetService';
import { driveService } from '../../services/googleDrive';
import { AssetGrid } from '../AssetGrid';
import { ConfirmationDialog } from '../ConfirmationDialog';

interface AssetLibraryProps {
    onAssetSelect?: (asset: Asset) => void;
    category: AssetCategory;
    onShowToast?: (message: string, type?: 'success' | 'error' | 'info' | 'loading') => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ onAssetSelect, category, onShowToast }) => {
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
    const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

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

    const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<string | 'bulk' | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleAssetDeleteRequest = (id: string) => {
        setDeleteConfirmTarget(id);
    };

    const handleBulkDeleteRequest = () => {
        if (selectedIds.size > 0) {
            setDeleteConfirmTarget('bulk');
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirmTarget) return;

        setIsDeleting(true);
        try {
            if (deleteConfirmTarget === 'bulk') {
                // Bulk Delete
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
                        // Non-blocking error
                    }
                }

                onShowToast?.(`Deleted ${selectedIds.size} assets`, 'success');
                setSelectedIds(new Set());
                setIsBulkMode(false);
            } else {
                // Single Delete
                const id = deleteConfirmTarget;
                // 1. Delete from Backend
                await assetService.deleteAsset(id);

                // 2. Try to delete from Google Drive if signed in
                const assetToDelete = assets.find(a => a.id === id);

                if (assetToDelete && assetToDelete.fileHash && driveService.isSignedIn) {
                    try {
                        const fileName = `img-${assetToDelete.fileHash}`;
                        const files = await driveService.listFiles();
                        const driveFile = files.find((f: any) => f.name.startsWith(fileName));

                        if (driveFile) {
                            await driveService.deleteFile(driveFile.id);
                        }
                    } catch (driveErr) {
                        console.error('Failed to delete from Drive:', driveErr);
                    }
                }
                onShowToast?.('Asset deleted', 'success');
            }

            // Reload assets
            loadAssets();
        } catch (err) {
            console.error('Failed to delete asset(s):', err);
            onShowToast?.('Failed to delete asset(s)', 'error');
        } finally {
            setIsDeleting(false);
            setDeleteConfirmTarget(null);
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
                                        onClick={handleBulkDeleteRequest}
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
                        onAssetDelete={handleAssetDeleteRequest}
                        isLoading={isLoading}
                        isBulkMode={isBulkMode}
                        isPickingMode={!!onAssetSelect}
                        selectedIds={selectedIds}
                        onToggleSelection={handleToggleSelection}
                        onAssetPreview={setPreviewAsset}
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

            <ConfirmationDialog
                isOpen={!!deleteConfirmTarget}
                title={deleteConfirmTarget === 'bulk' ? 'Delete Assets' : 'Delete Asset'}
                message={deleteConfirmTarget === 'bulk'
                    ? `Are you sure you want to delete ${selectedIds.size} assets? This action cannot be undone.`
                    : "Are you sure you want to delete this asset? This action cannot be undone."
                }
                confirmLabel={isDeleting ? "Deleting..." : "Delete"}
                cancelLabel="Cancel"
                isDestructive={true}
                onConfirm={confirmDelete}
                onCancel={() => !isDeleting && setDeleteConfirmTarget(null)}
                isLoading={isDeleting}
            />


            {/* Asset Preview Dialog */}
            {previewAsset && (
                <AssetPreviewDialog
                    asset={previewAsset}
                    onClose={() => setPreviewAsset(null)}
                />
            )}
        </div>
    );
};

interface AssetPreviewDialogProps {
    asset: Asset;
    onClose: () => void;
}

const AssetPreviewDialog: React.FC<AssetPreviewDialogProps> = ({ asset, onClose }) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                const url = await assetService.fetchAssetData(asset);
                if (isMounted) {
                    setImageUrl(url);
                    setLoading(false);
                }
            } catch (e) {
                console.error("Failed to load preview", e);
                if (isMounted) setLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [asset]);

    // Close on backdrop click (if not dragging)
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isDragging) {
            onClose();
        }
    };

    // Pan/Zoom handlers
    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setTransform(prev => ({
            ...prev,
            scale: Math.min(Math.max(0.1, prev.scale + delta), 5)
        }));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setTransform(prev => ({
            ...prev,
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleReset = () => setTransform({ scale: 1, x: 0, y: 0 });
    const handleZoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 5) }));
    const handleZoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.1) }));

    const formattedDate = new Date(asset.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="relative max-w-6xl w-full h-[85vh] bg-[#1a1d23] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-700">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#25282e] z-10 shrink-0">
                    <h3 className="font-medium text-white pr-4 text-lg break-words line-clamp-2">{asset.fileName}</h3>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 mr-4 border border-gray-700">
                            <button onClick={handleZoomOut} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Zoom Out">
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-mono font-medium min-w-[3ch] text-center text-gray-400">
                                {Math.round(transform.scale * 100)}%
                            </span>
                            <button onClick={handleZoomIn} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Zoom In">
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-gray-700 mx-1" />
                            <button onClick={handleReset} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Reset View">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div
                    className={`flex-1 overflow-hidden relative bg-[url('/checkerboard.png')] bg-repeat flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent" />
                    ) : imageUrl ? (
                        <div
                            style={{
                                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                            }}
                            className="will-change-transform"
                        >
                            <img
                                src={imageUrl}
                                alt={asset.fileName}
                                className="max-w-none shadow-2xl rounded-sm object-contain"
                                style={{ maxHeight: 'none', maxWidth: 'none' }}
                                draggable={false}
                            />
                        </div>
                    ) : (
                        <div className="text-gray-400">Failed to load image</div>
                    )}
                </div>

                {/* Footer / Metadata */}
                <div className="bg-[#25282e] border-t border-gray-700 p-4 z-10">
                    <div className="flex flex-col gap-3">
                        {/* Tags */}
                        {asset.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {asset.tags.map(tag => (
                                    <span key={tag} className="px-2.5 py-1 bg-gray-700/50 rounded-full text-xs text-gray-300 border border-gray-600/50">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400 pt-2 border-t border-gray-700/50">
                            <div>
                                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Created</span>
                                {formattedDate}
                            </div>
                            <div>
                                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Type</span>
                                <span className="uppercase">{asset.mimeType.split('/')[1] || 'Unknown'}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Source</span>
                                <span className={asset.source === 'generated' ? 'text-purple-400' : 'text-blue-400'}>
                                    {asset.source === 'generated' ? '✨ AI Generated' : '📁 Uploaded'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">File Size</span>
                                {/* We assume size might be available in future, for now placeholder or nothing */}
                                --
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
