import React from 'react';
import type { Asset } from '../types/asset';
import { AssetCard } from './AssetCard';

interface AssetGridProps {
    assets: Asset[];
    onAssetClick: (asset: Asset) => void;
    onAssetDelete: (id: string) => void;
    isLoading?: boolean;
    isBulkMode?: boolean;
    isPickingMode?: boolean;
    selectedIds?: Set<string>;
    onToggleSelection?: (id: string) => void;
    onAssetPreview?: (asset: Asset) => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
    assets,
    onAssetClick,
    onAssetDelete,
    isLoading = false,
    isBulkMode = false,
    isPickingMode = false,
    selectedIds,
    onToggleSelection,
    onAssetPreview
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="aspect-square bg-gray-800 rounded-xl animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                    No assets found
                </h3>
                <p className="text-gray-400 max-w-md">
                    Upload or generate images to get started with your asset library
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {assets.map((asset) => (
                <AssetCard
                    key={asset.id}
                    asset={asset}
                    onClick={() => onAssetClick(asset)}
                    onDelete={onAssetDelete}
                    isBulkMode={isBulkMode}
                    isPickingMode={isPickingMode}
                    selected={selectedIds?.has(asset.id)}
                    onToggleSelection={onToggleSelection}
                    onPreview={onAssetPreview}
                />
            ))}
        </div>
    );
};
