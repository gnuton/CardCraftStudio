import React, { useState } from 'react';
import { imageProviderService } from '../../services/imageProviderService';
import { imageService } from '../../services/imageService';
import { Loader2 } from 'lucide-react';
import { PremiumGate } from './PremiumGate';

interface GenerateTabProps {
    onImageSelect: (ref: string) => void;
}

const STYLE_OPTIONS = [
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'realistic', label: 'Realistic' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'anime', label: 'Anime' },
    { value: 'watercolor', label: 'Watercolor' },
    { value: 'oil-painting', label: 'Oil Painting' },
];

export const GenerateTab: React.FC<GenerateTabProps> = ({ onImageSelect }) => {
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState('fantasy');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const imageBase64 = await imageProviderService.generateImage(prompt, style);
            setGeneratedImage(imageBase64);
        } catch (err) {
            setError('Failed to generate image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUseImage = async () => {
        if (!generatedImage) return;

        try {
            const ref = await imageService.processImage(generatedImage);
            if (ref) {
                onImageSelect(ref);
            }
        } catch (err) {
            setError('Failed to process image');
        }
    };

    return (
        <PremiumGate feature="generate">
            <div className="flex flex-col h-full space-y-4">
                {/* Prompt Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Describe your image
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A majestic dragon breathing fire, fantasy card art"
                        rows={3}
                        className="w-full px-4 py-2 bg-[#25282e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                    />
                </div>

                {/* Style Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Art Style
                    </label>
                    <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full px-4 py-2 bg-[#25282e] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                        {STYLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        'Generate Image'
                    )}
                </button>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Preview Area */}
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
                            <button
                                onClick={handleUseImage}
                                className="w-full px-4 py-2 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors"
                            >
                                Use This Image
                            </button>
                        </div>
                    ) : !loading && (
                        <div className="text-center text-gray-400">
                            <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <p className="text-sm">Your generated image will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </PremiumGate>
    );
};
