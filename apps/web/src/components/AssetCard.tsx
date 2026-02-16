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
}

export const AssetCard: React.FC<AssetCardProps> = ({
    asset,
    onClick,
    onDelete,
    isBulkMode = false,
    isPickingMode = false,
    selected = false,
    onToggleSelection
}) => {
    // We don't need imageUrl state anymore as we use the direct URL
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);

    // Use token in query param to allow browser caching of the image
    const token = localStorage.getItem('cc_auth_token');
    const secureImageUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/assets/${asset.id}/image?token=${token}`;

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
            const response = await fetch(secureImageUrl);
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

    const formattedDate = new Date(asset.createdAt).toLocaleDateString();

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
                        src={secureImageUrl}
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
                <div className="absolute bottom-0 left-0 right-0 bg-[#25282e]/95 backdrop-blur-md transition-transform duration-300 ease-out translate-y-[calc(100%-3rem)] group-hover:translate-y-0 p-3 z-10 border-t border-gray-700/50">
                    {/* Title Row (Always Visible) */}
                    <div className="h-9 flex items-center mb-1">
                        <h3 className="font-medium text-white truncate w-full" title={asset.fileName}>
                            {asset.fileName}
                        </h3>
                    </div>

                    {/* Hidden Details (Reveal on Hover) */}
                    <div className="space-y-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">

                        {/* Meta Info Row */}
                        {/* Meta Info Row */}
                        <div className="flex flex-col gap-1.5 text-xs text-gray-400">
                            <span className="shrink-0">{formattedDate}</span>
                            {asset.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5" title={asset.tags.join(', ')}>
                                    {asset.tags.slice(0, 3).map((tag) => (
                                        <span key={tag} className="px-2 py-0.5 bg-gray-700/50 rounded-full text-gray-300 whitespace-nowrap text-[10px] border border-gray-600/50">
                                            {tag}
                                        </span>
                                    ))}
                                    {asset.tags.length > 3 && (
                                        <span className="px-2 py-0.5 bg-gray-700/50 rounded-full text-gray-400 whitespace-nowrap text-[10px] border border-gray-600/50">
                                            +{asset.tags.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons Toolbar */}
                        {!isBulkMode && (
                            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-700/50">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(secureImageUrl, '_blank');
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
