import React, { useState } from 'react';
import { imageProviderService } from '../../services/imageProviderService';
import type { Asset } from '../../types/asset';
import { Loader2, Wand2, Check } from 'lucide-react';
import { PremiumGate } from '../common/PremiumGate';

interface AssetGenerateProps {
    onAssetGenerated: (asset: Asset) => void;
}

const STYLE_OPTIONS = [
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'realistic', label: 'Realistic' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'anime', label: 'Anime' },
    { value: 'watercolor', label: 'Watercolor' },
    { value: 'oil-painting', label: 'Oil Painting' },
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'steampunk', label: 'Steampunk' },
];

export const AssetGenerate: React.FC<AssetGenerateProps> = ({ onAssetGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState('fantasy');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ imageBase64: string; asset?: Asset } | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await imageProviderService.generateImage(prompt, style, {
                saveToAssets: true,
                assetMetadata: {
                    tags: ['ai-generated', style]
                }
            });
            setResult(response);
        } catch (err) {
            console.error('Generation failed:', err);
            setError('Failed to generate image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUseImage = () => {
        if (result?.asset) {
            onAssetGenerated(result.asset);
        } else if (result?.imageBase64) {
            // Fallback if asset wasn't returned for some reason (shouldn't happen with new backend)
            // We would need to create it manually here, but let's assume backend works.
            setError('Asset creation failed on server.');
        }
    };

    return (
        <PremiumGate feature="generate">
            <div className="flex flex-col h-full bg-[#1a1d23] p-6 overflow-y-auto">
                <div className="max-w-3xl mx-auto w-full space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 mb-2">
                            <Wand2 className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">AI Image Generator</h3>
                        <p className="text-gray-400 text-sm">Describe what you want to see, and AI will create it for you.</p>
                    </div>

                    {/* Controls */}
                    <div className="space-y-4 bg-[#25282e] p-6 rounded-2xl border border-gray-700">
                        {/* Prompt */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                Prompt
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="A futuristic city in the clouds, golden hour lighting, highly detailed..."
                                rows={3}
                                className="w-full px-4 py-3 bg-[#1a1d23] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none transition-colors"
                            />
                        </div>

                        {/* Style */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                Style
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {STYLE_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setStyle(option.value)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${style === option.value
                                            ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-pink-400 border border-pink-500/50'
                                            : 'bg-[#1a1d23] text-gray-400 border border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Masterpiece...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    Generate Image
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="relative rounded-2xl overflow-hidden border border-gray-700 bg-black aspect-square max-w-md mx-auto group">
                                <img
                                    src={result.imageBase64.startsWith('data:') ? result.imageBase64 : `data:image/png;base64,${result.imageBase64}`}
                                    alt="Generated"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6">
                                    <button
                                        onClick={handleUseImage}
                                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-5 h-5" />
                                        Use This Image
                                    </button>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-green-400 text-sm font-medium">✨ Image generated and saved to your library!</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PremiumGate>
    );
};
