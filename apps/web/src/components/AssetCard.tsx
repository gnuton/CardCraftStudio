import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Download, Plus, Check, Image as ImageIcon } from 'lucide-react';
import type { Asset } from '../types/asset';


// Rethinking: I will use a larger block replacement to update Interface and Component implementation.

interface AssetCardProps {
    asset: Asset;
    onClick: () => void;
    onDelete: (id: string) => void;
    isBulkMode?: boolean;
    isPickingMode?: boolean;
    selected?: boolean;
    onToggleSelection?: (id: string) => void;
    onPreview?: (asset: Asset) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({
    asset,
    onClick,
    onDelete,
    isBulkMode = false,
    isPickingMode = false,
    selected = false,
    onToggleSelection,
    onPreview
}) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;

        const loadAsset = async () => {
            if (isVisible) {
                try {
                    // Import assetService dynamically to avoid circular dependencies if any, 
                    // or just use the global import if available (it is available as import at top?)
                    // We need to import it. Let's assume it is imported or we add it.
                    // Wait, we need to add the import first. 
                    // But in this replace block helper, we can't easily add import if it's not there.
                    // Let's check imports. assetService is NOT imported.
                    // We will need to do a multi-step replacement or use the existing imports if possible.
                    // Actually, we should add the import.

                    // For now, let's implement the logic assuming assetService will be imported.
                    const url = await import('../services/assetService').then(m => m.assetService.fetchAssetData(asset));
                    if (isMounted) setImageUrl(url);
                } catch (err) {
                    console.error("Failed to load asset image", err);
                }
            }
        };

        loadAsset();

        return () => { isMounted = false; };
    }, [asset, isVisible]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(asset.id);
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            // For download we might need to fetch blob to force download behavior
            // or just open in new tab? Fetching blob allows true download attribute.
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = asset.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download failed', err);
        }
    };

    const handleUse = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
    };

    const handleToggleSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleSelection) {
            onToggleSelection(asset.id);
        }
    };



    return (
        <div
            ref={cardRef}
            className={`group relative bg-[#25282e] rounded-xl border overflow-hidden transition-all cursor-pointer aspect-square ${selected
                ? 'border-pink-500 shadow-lg shadow-pink-500/20'
                : 'border-gray-700 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/20'
                }`}
            onClick={isBulkMode ? handleToggleSelection : onClick}
        >
            {/* Image Preview */}
            <div className="w-full h-full relative bg-gray-900">
                {isVisible ? (
                    <img
                        src={imageUrl}
                        alt={asset.fileName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent" />
                    </div>
                )}

                {/* Fallback Icon */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-600 -z-10">
                    <ImageIcon className="w-12 h-12" />
                </div>

                {/* Selection Circle - Top Right */}
                <div
                    className="absolute top-2 right-2 z-20 p-1 rounded-full cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    onClick={handleToggleSelection}
                    title={selected ? "Deselect" : "Select"}
                >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selected
                        ? 'bg-pink-500 border-pink-500 shadow-md'
                        : 'bg-black/40 border-gray-400 hover:border-white hover:bg-black/60'
                        }`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                </div>

                {/* Source Badge */}
                <div className="absolute top-2 left-2 pointer-events-none z-20">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm ${asset.source === 'generated'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                        {asset.source === 'generated' ? '✨ AI' : '📁 Uploaded'}
                    </span>
                </div>

                {/* Slide-Up Info Box */}
                <div className="absolute bottom-0 left-0 right-0 bg-[#25282e]/95 backdrop-blur-md transition-transform duration-300 ease-out translate-y-[calc(100%-4rem)] group-hover:translate-y-0 p-3 z-10 border-t border-gray-700/50">
                    {/* Title Row (Always Visible) */}
                    <div className="flex items-center mb-1 max-h-[3.5rem] overflow-hidden">
                        <h3 className="font-medium text-white line-clamp-2 w-full text-sm leading-tight" title={asset.fileName}>
                            {asset.fileName}
                        </h3>
                    </div>

                    {/* Hidden Details (Reveal on Hover) */}
                    <div className="space-y-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">

                        {/* Meta Info Row */}


                        {/* Action Buttons Toolbar */}
                        {!isBulkMode && (
                            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-700/50">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onPreview) {
                                            onPreview(asset);
                                        } else {
                                            window.open(imageUrl, '_blank');
                                        }
                                    }}
                                    className="flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="View"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>

                                {isPickingMode ? (
                                    <button
                                        onClick={handleUse}
                                        className="flex items-center justify-center p-2 text-white bg-pink-500 hover:bg-pink-600 rounded-lg transition-colors shadow-lg shadow-pink-500/20"
                                        title="Use"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-center p-2 text-gray-600 cursor-not-allowed">
                                        <div className="w-4 h-4" /> {/* Spacer */}
                                    </div>
                                )}

                                <button
                                    onClick={handleDownload}
                                    className="flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={handleDelete}
                                    className="flex items-center justify-center p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
