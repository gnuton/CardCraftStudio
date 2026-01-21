import React, { useState, useEffect } from 'react';
import { imageProviderService, type ImageResult } from '../../services/imageProviderService';
import { imageService } from '../../services/imageService';
import { Loader2 } from 'lucide-react';

interface SearchTabProps {
    onImageSelect: (ref: string) => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({ onImageSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ImageResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
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

    const handleImageClick = async (imageUrl: string) => {
        setSelectedImage(imageUrl);
        try {
            // Fetch the image and convert to data URL
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onloadend = async () => {
                const dataUrl = reader.result as string;
                const ref = await imageService.processImage(dataUrl);
                if (ref) {
                    onImageSelect(ref);
                }
            };

            reader.readAsDataURL(blob);
        } catch {
            setError('Failed to load image. Please try another.');
            setSelectedImage(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search Input */}
            <div className="mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for images..."
                    className="w-full px-4 py-2 bg-[#25282e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto">
                {loading && (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {!loading && !error && results.length === 0 && query && (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>No results found</p>
                    </div>
                )}

                {!loading && !error && results.length === 0 && !query && (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-400">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-sm">Start typing to search images</p>
                    </div>
                )}

                {!loading && !error && results.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                onClick={() => handleImageClick(result.url)}
                                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:border-blue-500 ${selectedImage === result.url ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-700'
                                    }`}
                            >
                                <img
                                    src={result.thumbnail}
                                    alt={result.title}
                                    className="w-full h-full object-cover"
                                />
                                {selectedImage === result.url && (
                                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
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
