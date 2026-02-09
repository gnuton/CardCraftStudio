import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Image as ImageIcon } from 'lucide-react';
import type { Asset } from '../types/asset';

interface AssetCardProps {
    asset: Asset;
    onClick: () => void;
    onDelete: (id: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick, onDelete }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [showActions, setShowActions] = useState(false);

    useEffect(() => {
        // Load image data from backend
        const loadImage = async () => {
            setImageLoading(true);
            try {
                const token = localStorage.getItem('cc_auth_token');
                if (!token) {
                    setImageLoading(false);
                    return;
                }

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/assets/${asset.id}/data`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setImageUrl(data.dataUrl);
                }
            } catch (err) {
                console.error('Failed to load asset image:', err);
            } finally {
                setImageLoading(false);
            }
        };

        loadImage();
    }, [asset.id]);

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
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${asset.source === 'generated'
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
