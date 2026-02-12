import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toPng } from 'html-to-image';
import { imageProviderService } from '../../services/imageProviderService';
import type { Asset, AssetCategory } from '../../types/asset';
import { Loader2, Wand2, Check, Layers, Sparkles, Download, Info, ChevronDown, ChevronRight } from 'lucide-react';
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

const ASPECT_RATIOS = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '4:3', label: 'Landscape (4:3)' },
    { value: '16:9', label: 'Wide (16:9)' },
];

// Update WireframePreview signature
const WireframePreview = React.forwardRef<HTMLDivElement, {
    elements: CardElement[];
    width: number;
    height: number;
    targetSide: 'front' | 'back';
    minimal?: boolean;
    forcedAspectRatio?: string; // Add this
}>(({ elements, width, height, targetSide, minimal, forcedAspectRatio }, ref) => {
    const relevantElements = elements.filter(el => el.side === targetSide && el.isVisible !== false);

    const InnerContent = () => {
        // Calculate aspect ratio
        let containerAspectRatio: number;
        if (forcedAspectRatio) {
            const [w, h] = forcedAspectRatio.split(':').map(Number);
            containerAspectRatio = w / h;
        } else {
            containerAspectRatio = width / height;
        }

        return (
            <div
                ref={ref}
                className={`relative mx-auto overflow-hidden selection-none flex items-center justify-center ${minimal ? 'bg-black border-4 border-gray-900 rounded-none' : 'bg-white border border-gray-200 rounded-lg shadow-sm'
                    }`}
                style={{
                    aspectRatio: `${containerAspectRatio}`,
                    width: minimal ? '100%' : '100%',
                    height: 'auto'
                }}>

                {/* Internal relative container to maintain element positions relative to card proportions */}
                <div className="relative" style={{
                    width: minimal ? `${(width / height < containerAspectRatio ? (width / height) / containerAspectRatio : 1) * 100}%` : '100%',
                    aspectRatio: `${width / height}`,
                }}>
                    {relevantElements.map(el => (
                        <div
                            key={el.id}
                            className={`absolute flex items-center justify-center overflow-hidden ${minimal ? 'border-[6px] border-white' : 'border-2 border-black opacity-50'
                                }`}
                            style={{
                                left: `${((width / 2 + el.x - el.width / 2) / width) * 100}%`,
                                top: `${((height / 2 + el.y - el.height / 2) / height) * 100}%`,
                                width: `${(el.width / width) * 100}%`,
                                height: `${(el.height / height) * 100}%`,
                                transform: `rotate(${el.rotate}deg)`,
                                fontSize: minimal ? '1px' : '10px',
                                color: minimal ? 'transparent' : 'inherit'
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    };

    if (minimal) {
        return <InnerContent />;
    }

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

    return (
        <div className="w-full bg-[#1e2025] rounded-xl border border-gray-700 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Layout Preview (Wireframe will be sent to AI)</span>
            </div>
            <InnerContent />
            <p className="text-[10px] text-gray-500 mt-2 text-center">
                AI will try to frame the background around these areas.
            </p>
        </div>
    );
});

WireframePreview.displayName = 'WireframePreview';

export const AssetGenerate: React.FC<AssetGenerateProps> = ({
    onAssetGenerated,
    category,
    cardElements = [],
    cardWidth = 375,
    cardHeight = 525
}) => {
    const { isAdmin } = useAuth();
    const [prompt, setPrompt] = useState(`I am uploading a black-and-white wireframe of a UI card. The outer boundary represents the card edges, and the inner boxes represent where functional elements (text, buttons, icons) will live.

Your task: Create a high-quality background image for this card that frames the internal elements without obscuring them. The design should feel integrated, using the inner boxes as a guide for where to place visual flourishes, borders, or negative space.

Style Requirements:
Core Aesthetic:  Dark Fantasy
Visual Elements: Neon circuitry
Color Palette: Deep obsidians and electric blues
Composition: Ensure the center of the inner boxes remains relatively clean/legible so I can overlay text later.
No text nor numbers must be present in the final image.
Color the areas inside the inner boxes in pink with 70% transparency`);
    const [aspectRatio, setAspectRatio] = useState('3:4');
    const [showDebug, setShowDebug] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ imageBase64: string; prompt: string; asset?: Asset; debugData?: any } | null>(null);
    const [sliderValue, setSliderValue] = useState(50); // 0 = Wireframe, 100 = Result

    // Debug state for wireframe capture
    const [capturedWireframe, setCapturedWireframe] = useState<string | null>(null);

    const wireframeRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setShowPreview(true);
        setError(null);
        setResult(null);
        setCapturedWireframe(null);
        setSliderValue(50); // Reset slider on new generation

        try {
            // Prepare layout data if applicable
            let layoutData = undefined;
            let layoutImage = undefined;

            if (category === 'front-background' || category === 'back-background') {
                const targetSide = category === 'front-background' ? 'front' : 'back';
                const relevantElements = cardElements.filter(el => el.side === targetSide && el.isVisible !== false);
                if (relevantElements.length > 0) {
                    layoutData = {
                        elements: relevantElements,
                        dimensions: { width: cardWidth, height: cardHeight }
                    };

                    // Capture wireframe as image
                    if (wireframeRef.current) {
                        try {
                            layoutImage = await toPng(wireframeRef.current, {
                                cacheBust: true,
                                pixelRatio: 2 // Increased for sharper edge detection
                            });
                            setCapturedWireframe(layoutImage);
                        } catch (captureErr) {
                            console.error('Failed to capture wireframe:', captureErr);
                            // Proceed without image if capture fails? or maybe warn user.
                            // For now we just log it and proceed with coordinates only if image fails.
                        }
                    }
                }
            }

            const response = await imageProviderService.generateImage(prompt, undefined, {
                saveToAssets: true,
                aspectRatio,
                assetMetadata: {
                    tags: ['ai-generated', category],
                    category
                },
                layout: layoutData,
                layoutImage // Pass the captured image
            });
            setResult(response);
            if (response?.imageBase64) {
                setSliderValue(50); // Start split
            }
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
                                    ? 'The AI will reference your card layout to generate a context-aware background.'
                                    : 'Generating a standalone asset based on your prompt.'}
                            </p>
                        </div>
                    </div>

                    {/* Comparison / Result View Toggle */}
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 hover:text-white transition-colors w-full border-b border-gray-700 pb-2"
                    >
                        {showPreview ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {isLayoutMode ? 'Comparison Preview' : 'Generation Result'}
                        {!showPreview && result && <span className="ml-auto text-pink-500 flex items-center gap-1"><Check className="w-3 h-3" /> Ready</span>}
                    </button>

                    {showPreview && (
                        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                            {isLayoutMode ? (
                                <div className="flex flex-col items-center">
                                    {/* Comparison Container */}
                                    <div className="relative w-full max-w-md aspect-[3/4] bg-[#1e2025] rounded-xl border border-gray-700 overflow-hidden shadow-2xl">

                                        {/* Layer 1: Wireframe (Bottom) */}
                                        <div className="absolute inset-0 p-4 flex items-center justify-center bg-black">
                                            <WireframePreview
                                                ref={wireframeRef}
                                                elements={cardElements}
                                                width={cardWidth}
                                                height={cardHeight}
                                                targetSide={category === 'front-background' ? 'front' : 'back'}
                                                minimal={true}
                                                forcedAspectRatio={aspectRatio}
                                            />
                                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] text-gray-400 font-mono pointer-events-none z-10">
                                                WIREFRAME
                                            </div>
                                        </div>

                                        {/* Layer 2: Result (Top) */}
                                        <div
                                            className="absolute inset-0 transition-all duration-75 ease-linear pointer-events-none"
                                            style={{
                                                clipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
                                                zIndex: 15
                                            }}
                                        >
                                            {result?.imageBase64 && (
                                                <div className="w-full h-full relative">
                                                    <img
                                                        src={result.imageBase64.startsWith('data:') ? result.imageBase64 : `data:image/png;base64,${result.imageBase64}`}
                                                        alt="Generated asset"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] text-pink-400 font-mono pointer-events-none">
                                                        GENERATED
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Loading / Empty Overlay */}
                                        {(!result?.imageBase64 || loading) && (
                                            <div className="absolute inset-0 bg-[#1e2025]/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-8">
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
                                                        <p className="text-xs font-medium text-gray-400 animate-pulse">
                                                            Beautifying wireframe...
                                                        </p>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center opacity-50">
                                                        <Sparkles className="w-8 h-8 text-gray-700 mb-2" />
                                                        <p className="text-xs text-gray-500">Press Generate to start</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Full-Height Vertical Separator Line with Handle - Only show when result is ready */}
                                        {result?.imageBase64 && !loading && (
                                            <>
                                                <div
                                                    className="absolute top-0 bottom-0 w-1 bg-white/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-40 pointer-events-none"
                                                    style={{
                                                        left: `${sliderValue}%`,
                                                        transform: 'translateX(-50%)'
                                                    }}
                                                >
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 bg-white rounded-full shadow-2xl border-2 border-pink-500 flex items-center justify-center pointer-events-none transition-transform group-active:scale-95 group-hover:scale-110">
                                                        <div className="w-0.5 h-6 bg-pink-500/50 rounded-full mx-0.5" />
                                                        <div className="w-0.5 h-6 bg-pink-500/50 rounded-full mx-0.5" />
                                                    </div>
                                                </div>

                                                {/* Slider Control Overlay (Invisible touch area) */}
                                                <div className="absolute inset-0 z-50 cursor-col-resize group">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        value={sliderValue}
                                                        onChange={(e) => setSliderValue(Number(e.target.value))}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize z-50"
                                                    />
                                                    {/* Hint when dragging */}
                                                    <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                        <span className="px-3 py-1 bg-black/80 rounded-full text-[10px] text-white/50 border border-white/10">
                                                            Drag to compare
                                                        </span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Action Buttons for Layout Mode */}
                                    {result?.imageBase64 && (
                                        <div className="mt-4 flex gap-3">
                                            <button
                                                onClick={handleUseImage}
                                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold transform hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                                            >
                                                <Check className="w-4 h-4" />
                                                Use This Image
                                            </button>
                                            <a
                                                href={result.imageBase64.startsWith('data:') ? result.imageBase64 : `data:image/png;base64,${result.imageBase64}`}
                                                download={`ai-generated-${Date.now()}.png`}
                                                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                /* Standard View (No comparison needed) */
                                <div className="flex flex-col gap-3">
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
                            )}
                        </div>
                    )}


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
                                {[
                                    {
                                        label: '✨ High Precision', prompt: `I am uploading a black-and-white wireframe of a UI card. The outer boundary represents the card edges, and the inner boxes represent where functional elements (text, buttons, icons) will live.

Your task: Create a high-quality background image for this card that frames the internal elements without obscuring them. The design should feel integrated, using the inner boxes as a guide for where to place visual flourishes, borders, or negative space.

Style Requirements:
Core Aesthetic:  Dark Fantasy
Visual Elements: Neon circuitry
Color Palette: Deep obsidians and electric blues
Composition: Ensure the center of the inner boxes remains relatively clean/legible so I can overlay text later.
No text nor numbers must be present in the final image.
Color the areas inside the inner boxes in pink with 70% transparency` },
                                    { label: 'Epic Fantasy', prompt: 'Epic fantasy landscape, moody lighting, highly detailed' },
                                    { label: 'Cyberpunk', prompt: 'Cyberpunk city street, neon lights, rainy atmosphere' },
                                    { label: 'Abstract', prompt: 'Abstract watercolor pattern, soft colors' }
                                ].map(s => (
                                    <button
                                        key={s.label}
                                        onClick={() => setPrompt(s.prompt)}
                                        className="px-3 py-1.5 bg-[#1a1d23] hover:bg-gray-700 border border-gray-700 rounded-full text-xs text-gray-400 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1.5"
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    options: {
                                        saveToAssets: true,
                                        aspectRatio,
                                        layout: isLayoutMode ? {
                                            dimensions: { width: cardWidth, height: cardHeight },
                                            elementCount: cardElements.length,
                                            // elements: <array> truncated for brevity
                                            hasCapturedImage: !!capturedWireframe
                                        } : 'NONE'
                                    },
                                    capturedWireframeLength: capturedWireframe?.length || 0
                                }, null, 2)}
                            </pre>
                            {capturedWireframe && (
                                <div className="mt-4">
                                    <p className="mb-2 font-bold text-pink-400">Captured Wireframe (Sent to AI):</p>
                                    <img src={capturedWireframe} alt="Captured Wireframe" className="max-w-xs border border-pink-500/30 rounded-lg" />
                                </div>
                            )}

                            {isAdmin && result?.debugData && (
                                <div className="mt-6 pt-4 border-t border-gray-700">
                                    <h4 className="text-sm font-bold text-red-400 mb-2 uppercase tracking-wider">Admin Debug: Vertex AI Call</h4>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="font-bold text-gray-400 mb-1">Endpoint:</p>
                                            <div className="bg-black/30 p-2 rounded text-blue-300 break-all">
                                                {result.debugData.endpoint}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="font-bold text-gray-400 mb-1">Request Body:</p>
                                            <pre className="bg-black/30 p-2 rounded text-green-300 overflow-x-auto max-h-64">
                                                {JSON.stringify(result.debugData.requestBody, null, 2)}
                                            </pre>
                                        </div>

                                        <div>
                                            <p className="font-bold text-gray-400 mb-1">Raw Response:</p>
                                            <pre className="bg-black/30 p-2 rounded text-yellow-300 overflow-x-auto max-h-64">
                                                {JSON.stringify(result.debugData.response, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </PremiumGate>
    );
};
