import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toPng } from 'html-to-image';
import { imageProviderService } from '../../services/imageProviderService';
import type { Asset, AssetCategory } from '../../types/asset';
import { Loader2, Wand2, Check, Layers, Sparkles, Download, Info, ChevronDown, ChevronRight, Cpu } from 'lucide-react';
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
    forcedAspectRatio?: string;
    containerPixelWidth?: number; // When set, uses explicit pixel dimensions instead of CSS aspect-ratio (needed for html-to-image capture)
}>(({ elements, width, height, targetSide, minimal, forcedAspectRatio, containerPixelWidth }, ref) => {
    const relevantElements = elements.filter(el => el.side === targetSide && el.isVisible !== false);

    // Verify elements are reaching the preview component
    if (minimal) {
        console.log(`[WireframePreview] Rendering minimal preview for ${targetSide}. Elements:`, relevantElements.length);
    }

    const InnerContent = () => {
        // Calculate aspect ratio
        let containerAspectRatio: number;
        if (forcedAspectRatio) {
            const [w, h] = forcedAspectRatio.split(':').map(Number);
            containerAspectRatio = w / h;
        } else {
            containerAspectRatio = width / height;
        }

        // When containerPixelWidth is set, compute explicit pixel dimensions
        // html-to-image does NOT support CSS aspect-ratio, so we must use px values for capture
        const useExplicitPx = !!containerPixelWidth;
        const outerWidth = useExplicitPx ? containerPixelWidth : undefined;
        const outerHeight = useExplicitPx ? containerPixelWidth / containerAspectRatio : undefined;

        const innerWidthFraction = minimal ? (width / height < containerAspectRatio ? (width / height) / containerAspectRatio : 1) : 1;
        const innerWidthPx = useExplicitPx ? outerWidth! * innerWidthFraction : undefined;
        const innerHeightPx = useExplicitPx && innerWidthPx ? innerWidthPx / (width / height) : undefined;

        return (
            <div
                ref={ref}
                className={`relative overflow-hidden selection-none flex items-center justify-center ${minimal ? 'm-0 bg-white border-4 border-black rounded-none' : 'mx-auto bg-white border border-gray-200 rounded-lg shadow-sm'
                    }`}
                style={useExplicitPx ? {
                    width: `${outerWidth}px`,
                    height: `${outerHeight}px`,
                } : {
                    aspectRatio: `${containerAspectRatio}`,
                    width: '100%',
                    height: 'auto'
                }}>

                {/* Internal relative container to maintain element positions relative to card proportions */}
                <div className="relative" style={useExplicitPx ? {
                    width: `${innerWidthPx}px`,
                    height: `${innerHeightPx}px`,
                } : {
                    width: minimal ? `${innerWidthFraction * 100}%` : '100%',
                    aspectRatio: `${width / height}`,
                }}>
                    {relevantElements.map(el => (
                        <div
                            key={el.id}
                            className={`absolute flex items-center justify-center overflow-hidden ${minimal ? 'border-[3px] border-black' : 'border-2 border-black opacity-50'
                                }`} // Reduced border width slightly for better precision, explicit border-black
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
    const [prompt, setPrompt] = useState(`I am uploading a white background wireframe of a UI card. The outer boundary represents the card edges, and the inner boxes represent where functional elements (text, buttons, icons) will live.

Your task: Create a high-quality background image for this card that frames the internal elements without obscuring them. The design should feel integrated, using the inner boxes as a guide for where to place visual flourishes, borders, or negative space.

Style Requirements:
Core Aesthetic:  Dark Fantasy
Visual Elements: Neon circuitry
Color Palette: Deep obsidians and electric blues
Composition: Ensure the center of the inner boxes remains relatively clean/legible so I can overlay text later.
No text nor numbers must be present in the final image.
Color the areas inside the inner boxes in pink with 70% transparency`);
    const [aspectRatio, setAspectRatio] = useState('3:4');
    const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash-exp');
    const [showDebug, setShowDebug] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const AVAILABLE_MODELS = [
        { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Experimental' },
        { id: 'gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
        { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image (Nano Banana)' },
        { id: 'imagen-3.0-generate-001', label: 'Imagen 3.0 Generate' },
        { id: 'imagen-3.0-fast-generate-001', label: 'Imagen 3.0 Fast Generate' },
        { id: 'imagen-3.0-capability-001', label: 'Imagen 3.0 Capability (Layout Aware)' },
    ];

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ imageBase64: string; prompt: string; asset?: Asset; debugData?: any; model?: string } | null>(null);
    const [sliderValue, setSliderValue] = useState(50); // 0 = Wireframe, 100 = Result

    // Debug state for wireframe capture
    const [capturedWireframe, setCapturedWireframe] = useState<string | null>(null);

    const [suggestedPrompts, setSuggestedPrompts] = useState<{ title: string, prompt: string }[]>([]);

    const wireframeRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setShowPreview(true);
        setError(null);
        setResult(null);
        setCapturedWireframe(null);
        setSuggestedPrompts([]);
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
                            console.log('[AssetGenerate] Capturing wireframe...');
                            // Wait for paint
                            await new Promise(resolve => setTimeout(resolve, 100));
                            layoutImage = await toPng(wireframeRef.current, {
                                cacheBust: true,
                                pixelRatio: 2, // Increased for sharper edge detection
                                backgroundColor: '#ffffff', // Ensure white background
                            });
                            console.log('[AssetGenerate] Wireframe captured, length:', layoutImage.length);
                            setCapturedWireframe(layoutImage);
                        } catch (captureErr) {
                            console.error('Failed to capture wireframe:', captureErr);
                            // Proceed without image if capture fails? or maybe warn user.
                            // For now we just log it and proceed with coordinates only if image fails.
                        }
                    } else {
                        console.warn('[AssetGenerate] Ref is null, cannot capture wireframe');
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
                layoutImage, // Pass the captured image
                model: selectedModel
            });
            setResult(response);
            if (response?.imageBase64) {
                setSliderValue(50); // Start split
            }
        } catch (err) {
            console.error('Generation failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate image. Please try again.';
            setError(errorMessage);

            // Parse suggestions if present
            if (errorMessage.includes('Gemini refused to generate image')) {
                const suggestions: { title: string, prompt: string }[] = [];
                // Regex to find "Option X (Title):" followed by > "Prompt"
                // Dealing with potential markdown formatting variations
                const regex = /\*\*Option \d+ \((.*?)\):\*\*\s*>\s*"(.*?)"/g;
                let match;
                while ((match = regex.exec(errorMessage)) !== null) {
                    suggestions.push({
                        title: match[1],
                        prompt: match[2]
                    });
                }
                setSuggestedPrompts(suggestions);
            }
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
            <div className="relative flex flex-col h-full bg-[#1a1d23] overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">

                    {/* Hidden wrapper for capture - keeps element in DOM for html-to-image but hides it from UI */}
                    <div style={{ height: 0, overflow: 'hidden' }}>
                        {isLayoutMode && (
                            <WireframePreview
                                ref={wireframeRef}
                                elements={cardElements}
                                width={cardWidth}
                                height={cardHeight}
                                targetSide={category === 'front-background' ? 'front' : 'back'}
                                minimal={true}
                                forcedAspectRatio={aspectRatio}
                                containerPixelWidth={cardWidth}
                            />
                        )}
                    </div>

                    {/* Main Content Container - Ensure z-index is higher than capture target */}
                    <div className="relative z-10 flex flex-col min-h-full bg-[#1a1d23]"> {/* Added z-10 and background */}

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
                            <div className="flex gap-2">
                                {showDebug && (
                                    <button
                                        onClick={async () => {
                                            if (wireframeRef.current) {
                                                try {
                                                    const img = await toPng(wireframeRef.current, {
                                                        cacheBust: true,
                                                        pixelRatio: 2,
                                                        backgroundColor: '#000000',
                                                    });
                                                    setCapturedWireframe(img);
                                                } catch (e) {
                                                    console.error(e);
                                                }
                                            }
                                        }}
                                        className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300 hover:text-white"
                                    >
                                        Test Capture
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDebug(!showDebug)}
                                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showDebug ? 'Hide Debug' : 'Show Debug'}
                                </button>
                            </div>
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
                                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                                                <WireframePreview
                                                    elements={cardElements}
                                                    width={cardWidth}
                                                    height={cardHeight}
                                                    targetSide={category === 'front-background' ? 'front' : 'back'}
                                                    minimal={false}
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
                                    className="w-full h-24 bg-[#1a1d23] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-y transition-all"
                                />
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

                                {/* Model Selection - Admin Only or Debug Mode */}
                                {(isAdmin || showDebug) && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Cpu className="w-3.5 h-3.5" />
                                            AI Model
                                        </label>
                                        <select
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                            className="w-full bg-[#1a1d23] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 appearance-none"
                                        >
                                            {AVAILABLE_MODELS.map(model => (
                                                <option key={model.id} value={model.id}>{model.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Error and Suggestions */}
                            {suggestedPrompts.length > 0 ? (
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="bg-[#1e2025] rounded-xl border border-indigo-500/30 p-4 shadow-lg shadow-indigo-500/10">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-400 mb-3">
                                            <Sparkles className="w-4 h-4" />
                                            AI Refined Prompts (Select one)
                                        </h4>
                                        <p className="text-xs text-gray-400 mb-4">
                                            The AI couldn't generate an image with the current prompt, but suggested these optimized alternatives:
                                        </p>
                                        <div className="space-y-3">
                                            {suggestedPrompts.map((suggestion, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        setPrompt(suggestion.prompt);
                                                        setSuggestedPrompts([]);
                                                        setError(null);
                                                    }}
                                                    className="group p-3 bg-black/30 hover:bg-black/50 border border-gray-700 hover:border-indigo-500/50 rounded-lg cursor-pointer transition-all"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-gray-300 group-hover:text-white">
                                                            {suggestion.title}
                                                        </span>
                                                        <span className="text-[10px] uppercase tracking-wider text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Use This
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 group-hover:text-gray-400 line-clamp-2">
                                                        "{suggestion.prompt}"
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : error && (
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
                                        {prompt.toLowerCase().includes('generate a prompt') || prompt.toLowerCase().includes('suggest a prompt') ? 'Generate a Prompt' : 'Generate Image'}
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
                                        <p className="text-[10px] text-gray-500 mb-2 broke-all">{capturedWireframe.substring(0, 100)}...</p>
                                        <img src={capturedWireframe} alt="Captured Wireframe" className="max-w-full border border-pink-500/30 rounded-lg" />
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
            </div>
        </PremiumGate>
    );
};
