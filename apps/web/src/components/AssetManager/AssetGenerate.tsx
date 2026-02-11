import React, { useState, useEffect } from 'react';
import { imageProviderService } from '../../services/imageProviderService';
import type { Asset, AssetCategory } from '../../types/asset';
import { Loader2, Wand2, Check, Layers, Sparkles, Download, Info } from 'lucide-react';
import { PremiumGate } from '../common/PremiumGate';
import type { CardElement } from '../../types/element';

interface AssetGenerateProps {
    onAssetGenerated: (asset: Asset) => void;
    category: AssetCategory;
    cardElements?: CardElement[];
    selectedElementId?: string | null;
    cardWidth?: number;
    cardHeight?: number;
}

const STYLE_OPTIONS = [
    { value: null, label: 'None' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'realistic', label: 'Realistic' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'anime', label: 'Anime' },
    { value: 'watercolor', label: 'Watercolor' },
    { value: 'oil-painting', label: 'Oil Painting' },
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'steampunk', label: 'Steampunk' },
];

const CATEGORY_PROMPTS: Record<AssetCategory, string> = {
    'front-background': 'background texture, atmospheric, detailed environment, no text',
    'back-background': 'card back design, symmetrical pattern, decorative border',
    'main-illustration': '',
    'icon': 'game icon, simple vector graphic, flat style, high contrast, transparent background',
    'other': ''
};

const ASPECT_RATIOS = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '4:3', label: 'Landscape (4:3)' },
    { value: '16:9', label: 'Wide (16:9)' },
];

const WireframePreview: React.FC<{
    elements: CardElement[];
    width: number;
    height: number;
    targetSide: 'front' | 'back';
}> = ({ elements, width, height, targetSide }) => {
    const relevantElements = elements.filter(el => el.side === targetSide && el.isVisible !== false);

    if (relevantElements.length === 0) {
        return (
            <div className="w-full bg-[#1e2025] rounded-xl border border-gray-700 p-4 h-full flex flex-col items-center justify-center text-center">
                <p className="text-xs text-gray-500">No elements found on {targetSide} side.</p>
                <div className="text-[10px] text-gray-600 mt-1">
                    (Total: {elements.length})
                </div>
            </div>
        );
    }

    // Calculate scaling to fit in container
    const aspectRatio = width / height;
    return (
        <div className="w-full bg-[#1e2025] rounded-xl border border-gray-700 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Layout Preview (Coordinates will be sent to AI)</span>
            </div>
            <div className="relative w-full mx-auto bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-inner"
                style={{
                    aspectRatio: `${aspectRatio}`,
                    width: '100%'
                }}>
                {/* Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:10px_10px]" />

                {relevantElements.map(el => (
                    <div
                        key={el.id}
                        className="absolute border border-pink-500/50 bg-pink-500/10 flex items-center justify-center text-[10px] text-pink-300 font-mono tracking-tighter overflow-hidden"
                        style={{
                            left: `${((width / 2 + el.x - el.width / 2) / width) * 100}%`,
                            top: `${((height / 2 + el.y - el.height / 2) / height) * 100}%`,
                            width: `${(el.width / width) * 100}%`,
                            height: `${(el.height / height) * 100}%`,
                            transform: `rotate(${el.rotate}deg)`,
                        }}
                    >
                        {el.name || el.type}
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-center">
                AI will try to frame the background around these areas.
            </p>
        </div>
    );
};

export const AssetGenerate: React.FC<AssetGenerateProps> = ({
    onAssetGenerated,
    category,
    cardElements = [],
    cardWidth = 375,
    cardHeight = 525
}) => {
    const [prompt, setPrompt] = useState('');
    const [styleKeyword, setStyleKeyword] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState('3:4');
    const [showDebug, setShowDebug] = useState(false);

    // Track previous category to remove its suffix when switching
    const [lastCategory, setLastCategory] = useState<AssetCategory>(category);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ imageBase64: string; prompt: string; asset?: Asset } | null>(null);



    // Update prompt when style changes
    const handleStyleChange = (newStyle: string | null) => {
        const oldStyle = styleKeyword;
        setStyleKeyword(newStyle);

        setPrompt(prev => {
            let updatedPrompt = prev;

            // Try to remove old style if it exists
            if (oldStyle) {
                const oldStylePhrase = `${oldStyle} art style`;
                if (updatedPrompt.includes(oldStylePhrase)) {
                    updatedPrompt = updatedPrompt.replace(oldStylePhrase, newStyle ? `${newStyle} art style` : '');
                }
            }

            // Append new style if not present and not None
            if (newStyle && !updatedPrompt.includes(newStyle)) {
                updatedPrompt = `${updatedPrompt} ${newStyle} art style`.trim();
            }

            return updatedPrompt.replace(/\s+/g, ' ').trim();
        });
    };

    // Initialize/Update prompt with category suffix (Layout logic removed from here)
    useEffect(() => {
        setPrompt(prev => {
            let updatedPrompt = prev;

            // Handle Category Suffix
            const oldSuffix = CATEGORY_PROMPTS[lastCategory];
            const newSuffix = CATEGORY_PROMPTS[category];

            // Remove old suffix if present
            if (oldSuffix && updatedPrompt.includes(oldSuffix)) {
                updatedPrompt = updatedPrompt.replace(`, ${oldSuffix}`, '');
                updatedPrompt = updatedPrompt.replace(` ${oldSuffix}`, '');
                updatedPrompt = updatedPrompt.replace(oldSuffix, '');
            }

            // Append new suffix if not present
            if (newSuffix && !updatedPrompt.includes(newSuffix)) {
                const items = updatedPrompt.trim();
                if (items && !items.endsWith(',') && !items.endsWith('.')) {
                    updatedPrompt = `${items}, ${newSuffix}`;
                } else if (items) {
                    updatedPrompt = `${items} ${newSuffix}`;
                } else {
                    updatedPrompt = newSuffix;
                }
            }

            return updatedPrompt.trim();
        });

        setLastCategory(category);
    }, [category]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Prepare layout data if applicable
            let layoutData = undefined;
            if (category === 'front-background' || category === 'back-background') {
                const targetSide = category === 'front-background' ? 'front' : 'back';
                const relevantElements = cardElements.filter(el => el.side === targetSide && el.isVisible !== false);
                if (relevantElements.length > 0) {
                    layoutData = {
                        elements: relevantElements,
                        dimensions: { width: cardWidth, height: cardHeight }
                    };
                }
            }

            const response = await imageProviderService.generateImage(prompt, styleKeyword || undefined, {
                saveToAssets: true,
                aspectRatio,
                assetMetadata: {
                    tags: ['ai-generated', ...(styleKeyword ? [styleKeyword] : []), category],
                    category
                },
                layout: layoutData
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
            setError('Asset creation failed on server.');
        }
    };

    const isLayoutMode = category === 'front-background' || category === 'back-background';

    console.log('[AssetGenerate] Render', { category, isLayoutMode, elementCount: cardElements.length });
    if (isLayoutMode) {
        console.log('[AssetGenerate] Layout Elements:', cardElements.filter(el => el.side === (category === 'front-background' ? 'front' : 'back')));
    }

    return (
        <PremiumGate feature="generate">
            <div className="flex flex-col h-full bg-[#1a1d23] overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30">
                                <Wand2 className="w-5 h-5 text-pink-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">
                                AI Image Generator
                            </h2>
                        </div>
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            {showDebug ? 'Hide Debug' : 'Show Debug'}
                        </button>
                    </div>

                    {/* Mode Info Banner */}
                    <div className="bg-[#25282e] rounded-lg p-3 mb-6 flex items-start gap-3 border border-gray-700">
                        <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-300">
                            <p className="font-medium text-indigo-300 mb-1">
                                {isLayoutMode ? 'Layout Aware Generation' : 'Standard Generation'}
                            </p>
                            <p className="text-xs text-slate-400">
                                {isLayoutMode
                                    ? 'The AI will attempt to generate a background that respects your card element positions.'
                                    : 'Generating a standalone asset based on your prompt.'}
                            </p>
                        </div>
                    </div>

                    {/* Split View Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* LEFT: Context / Wireframe */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Layers className="w-4 h-4" /> Context
                            </h3>
                            {isLayoutMode ? (
                                <WireframePreview
                                    elements={cardElements}
                                    width={cardWidth}
                                    height={cardHeight}
                                    targetSide={category === 'front-background' ? 'front' : 'back'}
                                />
                            ) : (
                                <div className="aspect-[3/4] bg-[#1e2025] rounded-xl border border-gray-700 border-dashed flex items-center justify-center p-8 text-center h-full min-h-[300px]">
                                    <div className="max-w-[200px]">
                                        <Layers className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500">
                                            No layout context needed for this category.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Result / Placeholder */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Result
                            </h3>
                            <div className="aspect-[3/4] bg-[#1e2025] rounded-xl border border-gray-700 overflow-hidden relative group h-full min-h-[300px]">
                                {result?.imageBase64 ? (
                                    <>
                                        <img
                                            src={result.imageBase64.startsWith('data:') ? result.imageBase64 : `data:image/png;base64,${result.imageBase64}`}
                                            alt="Generated asset"
                                            className="w-full h-full object-contain bg-[url('/transparent-bg.png')]"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                onClick={handleUseImage}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold transform hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                                            >
                                                <Check className="w-4 h-4" />
                                                Use This
                                            </button>
                                            <a
                                                href={result.imageBase64.startsWith('data:') ? result.imageBase64 : `data:image/png;base64,${result.imageBase64}`}
                                                download={`ai-generated-${Date.now()}.png`}
                                                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-8 text-center bg-[#1e2025]">
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
                                                <p className="text-sm font-medium text-gray-400 animate-pulse">
                                                    Dreaming up your image...
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 rounded-2xl bg-gray-800/50 mb-4 flex items-center justify-center transform rotate-3 border border-gray-700/50">
                                                    <Sparkles className="w-8 h-8 text-gray-700" />
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Your generated image will appear here
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Controls Section */}
                    <div className="bg-[#25282e] p-6 rounded-2xl border border-gray-700 space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prompt</label>
                            </div>

                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your image... (e.g. 'Dark fantasy castle, moody lighting, highly detailed')"
                                className="w-full h-24 bg-[#1a1d23] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none transition-all"
                            />

                            {/* Suggestions */}
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {['Epic fantasy landscape', 'Cyberpunk city street', 'Abstract watercolor pattern', 'Dark grim texture'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setPrompt(s)}
                                        className="px-3 py-1.5 bg-[#1a1d23] hover:bg-gray-700 border border-gray-700 rounded-full text-xs text-gray-400 whitespace-nowrap transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Art Style</label>
                                <select
                                    value={styleKeyword || ''}
                                    onChange={(e) => handleStyleChange(e.target.value || null)}
                                    className="w-full bg-[#1a1d23] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 appearance-none"
                                >
                                    {STYLE_OPTIONS.map(opt => (
                                        <option key={opt.value || 'none'} value={opt.value || ''}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dimensions</label>
                                <select
                                    value={aspectRatio}
                                    onChange={(e) => setAspectRatio(e.target.value)}
                                    className="w-full bg-[#1a1d23] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 appearance-none"
                                >
                                    {ASPECT_RATIOS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center animate-in fade-in">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || loading}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 hovered:from-pink-600 hovered:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    Generate Image
                                </>
                            )}
                        </button>
                    </div>


                    {showDebug && (
                        <div className="mt-4 p-4 bg-black/50 rounded-xl border border-gray-700 font-mono text-xs text-gray-300 overflow-x-auto">
                            <pre>
                                {JSON.stringify({
                                    clientPrompt: prompt,
                                    finalAIPrompt: result?.prompt || 'Run generation to see final prompt',
                                    style: styleKeyword,
                                    options: {
                                        saveToAssets: true,
                                        aspectRatio,
                                        layout: isLayoutMode ? {
                                            dimensions: { width: cardWidth, height: cardHeight },
                                            elementCount: cardElements.length,
                                            elements: cardElements
                                                .filter(el => el.side === (category === 'front-background' ? 'front' : 'back'))
                                                .map(el => ({
                                                    name: el.name,
                                                    type: el.type,
                                                    x: el.x,
                                                    y: el.y,
                                                    w: el.width,
                                                    h: el.height
                                                }))
                                        } : 'NONE'
                                    }
                                }, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </PremiumGate>
    );
};
