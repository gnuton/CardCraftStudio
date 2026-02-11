import React, { useState, useEffect } from 'react';
import { imageProviderService, type ImageResult } from '../../services/imageProviderService';
import { assetService } from '../../services/assetService';
import type { Asset, AssetCategory } from '../../types/asset';
import { Loader2, Search } from 'lucide-react';

interface AssetSearchProps {
    onAssetImported: (asset: Asset) => void;
    category: AssetCategory;
}

export const AssetSearch: React.FC<AssetSearchProps> = ({ onAssetImported, category }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ImageResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [importingUrl, setImportingUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                // Determine if we should filter search by category context (optional enhancement)
                // For now just search
                const searchResults = await imageProviderService.searchImages(query, 1);
                setResults(searchResults);
            } catch {
                setError('Failed to search images. Please try again.');
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleImageClick = async (result: ImageResult) => {
        setImportingUrl(result.url);
        try {
            const asset = await assetService.importAsset(result.url, 'searched', {
                category,
                tags: ['searched', query],
                fileName: result.title
            });
            onAssetImported(asset);
        } catch (err) {
            console.error('Import failed:', err);
            setError('Failed to import image. It might be protected or unavailable.');
            setImportingUrl(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1d23]">
            {/* Search Input */}
            <div className="p-6 pb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for images on the web..."
                        className="w-full pl-10 pr-4 py-3 bg-[#25282e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                        autoFocus
                    />
                </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {loading && (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center my-4">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {!loading && !error && results.length === 0 && query && (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                        <p>No results found for "{query}"</p>
                    </div>
                )}

                {!loading && !error && results.length === 0 && !query && (
                    <div className="flex flex-col items-center justify-center h-60 space-y-4 text-gray-500">
                        <Search className="w-16 h-16 opacity-20" />
                        <p className="text-sm">Start typing to search for images</p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="columns-2 md:columns-3 gap-4 space-y-4">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                onClick={() => !importingUrl && handleImageClick(result)}
                                className={`break-inside-avoid relative rounded-xl overflow-hidden cursor-pointer group transition-all ${importingUrl === result.url ? 'ring-2 ring-pink-500 opacity-75' : 'hover:scale-[1.02] hover:ring-2 hover:ring-pink-500/50'
                                    }`}
                            >
                                <img
                                    src={result.thumbnail}
                                    alt={result.title}
                                    className="w-full h-auto object-cover bg-gray-800"
                                    loading="lazy"
                                />

                                {importingUrl === result.url ? (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                        <p className="text-xs text-white line-clamp-2">{result.title}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
