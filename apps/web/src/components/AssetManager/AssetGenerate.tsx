import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toPng } from 'html-to-image';
import { imageProviderService } from '../../services/imageProviderService';
import type { Asset, AssetCategory } from '../../types/asset';
import { Loader2, Wand2, Check, Layers, Sparkles, Download, Cpu, ChevronDown } from 'lucide-react';
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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ imageBase64: string; prompt: string; asset?: Asset; debugData?: any; model?: string } | null>(null);
    const [sliderValue, setSliderValue] = useState(50); // 0 = Wireframe, 100 = Result

    // Debug state for wireframe capture
    const [capturedWireframe, setCapturedWireframe] = useState<string | null>(null);
    const [suggestedPrompts, setSuggestedPrompts] = useState<{ title: string, prompt: string }[]>([]);

    const wireframeRef = useRef<HTMLDivElement>(null);

    const [isPromptOpen, setIsPromptOpen] = useState(true);

    // Auto-collapse prompt when result generates
    React.useEffect(() => {
        if (result?.imageBase64) {
            setIsPromptOpen(false);
        }
    }, [result]);

    const AVAILABLE_MODELS = [
        { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Experimental' },
        { id: 'gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
        { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image (Nano Banana)' },
        { id: 'imagen-3.0-generate-001', label: 'Imagen 3.0 Generate' },
        { id: 'imagen-3.0-fast-generate-001', label: 'Imagen 3.0 Fast Generate' },
        { id: 'imagen-3.0-capability-001', label: 'Imagen 3.0 Capability (Layout Aware)' },
    ];

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setLoading(true);

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
            <div className="relative w-full h-full bg-[#1a1d23] overflow-hidden flex flex-col">

                {/* --- HEADER (Fixed Top) --- */}
                <div className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-3 pointer-events-auto">
                        <div className="p-2 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md">
                            <Wand2 className="w-5 h-5 text-pink-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white shadow-black drop-shadow-md">
                            AI Image Generator
                        </h2>
                    </div>

                    <div className="flex gap-2 pointer-events-auto">
                        <button
                            onClick={() => setIsPromptOpen(!isPromptOpen)}
                            aria-label="Toggle Controls"
                            className={`p-2 rounded-lg transition-colors backdrop-blur-md border border-white/10 ${isPromptOpen ? 'bg-white/10 text-white' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                        >
                            {isPromptOpen ? <ChevronDown className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            aria-label="Toggle Debug Info"
                            className={`p-2 rounded-lg transition-colors backdrop-blur-md border border-white/10 ${showDebug ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                        >
                            <Cpu className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Hidden Wrapper for Wireframe Capture */}
                <div style={{ position: 'fixed', top: 0, left: '-10000px', zIndex: -1, pointerEvents: 'none', opacity: 0 }}>
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


                {/* --- LAYER 1: PREVIEW / RESULT (Full Screen Background) --- */}
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#15171b]">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                            backgroundSize: '32px 32px'
                        }}
                    />

                    <div
                        className={`transition-all duration-500 ease-out w-full h-full flex items-center justify-center p-8 ${isPromptOpen ? 'pb-[400px] scale-90 opacity-50' : 'pb-0 scale-100 opacity-100'}`}
                        onClick={() => !result?.imageBase64 && setIsPromptOpen(true)}
                    >
                        {isLayoutMode || result?.imageBase64 ? (
                            <div className="relative w-full max-w-2xl aspect-[3/4] bg-[#1e2025] rounded-xl border border-gray-700 overflow-hidden shadow-2xl ring-1 ring-white/5 mx-auto max-h-full">
                                {/* Layout Mode: Comparison View */}
                                {isLayoutMode ? (
                                    <>
                                        {/* Wireframe (Bottom) */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                                            <WireframePreview
                                                elements={cardElements}
                                                width={cardWidth}
                                                height={cardHeight}
                                                targetSide={category === 'front-background' ? 'front' : 'back'}
                                                minimal={false}
                                                forcedAspectRatio={aspectRatio}
                                            />
                                            <div data-testid="comparison-view-badge" className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] text-gray-400 font-mono pointer-events-none z-10">
                                                WIREFRAME
                                            </div>
                                        </div>

                                        {/* Generated Result (Top) with Slider */}
                                        {(result?.imageBase64 || loading) && (
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
                                                            alt="Generated"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] text-pink-400 font-mono pointer-events-none">
                                                            GENERATED
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Slider Handle */}
                                        {result?.imageBase64 && !loading && (
                                            <>
                                                <div
                                                    className="absolute top-0 bottom-0 w-1 bg-white/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-40 pointer-events-none"
                                                    style={{ left: `${sliderValue}%`, transform: 'translateX(-50%)' }}
                                                >
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 bg-white rounded-full shadow-2xl border-2 border-pink-500 flex items-center justify-center pointer-events-none">
                                                        <div className="w-0.5 h-6 bg-pink-500/50 rounded-full mx-0.5" />
                                                        <div className="w-0.5 h-6 bg-pink-500/50 rounded-full mx-0.5" />
                                                    </div>
                                                </div>
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
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    /* Standard Mode: Single Image */
                                    <div className="w-full h-full flex items-center justify-center bg-[#1e2025]">
                                        {result?.imageBase64 && (
                                            <img
                                                src={result.imageBase64.startsWith('data:') ? result.imageBase64 : `data:image/png;base64,${result.imageBase64}`}
                                                alt="Generated"
                                                className="w-full h-full object-contain bg-[url('/transparent-bg.png')] pointer-events-none"
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Loading Overlay */}
                                {(!result?.imageBase64 || loading) && (
                                    <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-8 ${result?.imageBase64 ? 'opacity-0 pointer-events-none' : ''}`}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
                                                <p className="text-xs font-medium text-gray-400 animate-pulse">
                                                    Generating Asset...
                                                </p>
                                            </>
                                        ) : !isLayoutMode && !result?.imageBase64 && (
                                            <div className="flex flex-col items-center opacity-50">
                                                <Sparkles className="w-8 h-8 text-gray-700 mb-2" />
                                                <p className="text-xs text-gray-500">Preview will appear here</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Empty State Init */
                            <div className="text-center space-y-4 opacity-30 animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                                    <Sparkles className="w-16 h-16 text-white/20" />
                                </div>
                                <h3 className="text-xl font-medium text-white/40">Ready to Gen</h3>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- LAYER 2: BOTTOM CONTROL PANEL --- */}
                <div
                    className={`absolute top-0 bottom-0 left-0 right-0 z-30 bg-[#1a1d23]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${isPromptOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3rem)]'}`}
                >
                    {/* Drag Handle / Title Bar */}
                    <div
                        className="w-full h-12 flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
                        onClick={() => setIsPromptOpen(!isPromptOpen)}
                        aria-label="Toggle Controls"
                    >
                        {isPromptOpen ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                            <div className="flex items-center gap-2 text-sm font-bold text-pink-400 uppercase tracking-widest animate-pulse">
                                <Wand2 className="w-4 h-4" />
                                Open Controls
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
                        <div className="max-w-none mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* Actions / Results (Top left in grid) */}
                            {result?.imageBase64 && (
                                <div className="lg:col-span-12 flex justify-center gap-3 mb-4 animate-in fade-in slide-in-from-bottom-4">
                                    <button
                                        onClick={handleUseImage}
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transform hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                                    >
                                        <Check className="w-5 h-5" />
                                        Use This Image
                                    </button>
                                    <a
                                        href={result.imageBase64.startsWith('data:') ? result.imageBase64 : `data:image/png;base64,${result.imageBase64}`}
                                        download={`ai-generated-${Date.now()}.png`}
                                        className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white transition-colors border border-gray-600"
                                        title="Download Image"
                                    >
                                        <Download className="w-5 h-5" />
                                    </a>
                                </div>
                            )}

                            {/* Prompt Input */}
                            <div className="lg:col-span-8 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                                        Prompt
                                        <span className="text-indigo-400 font-normal normal-case">
                                            {isLayoutMode ? 'Layout Aware' : 'Standard'}
                                        </span>
                                    </label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Describe your image... (e.g. 'Dark fantasy castle, moody lighting, highly detailed')"
                                        className="w-full h-[50vh] bg-black/30 border border-gray-700 hover:border-gray-500 focus:border-pink-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50 resize-none transition-all"
                                    />
                                </div>

                                {/* Error / Suggestions */}
                                {suggestedPrompts.length > 0 && (
                                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                        <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-2">
                                            <Sparkles className="w-3 h-3" />
                                            AI Suggestions
                                        </h4>
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {suggestedPrompts.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { setPrompt(s.prompt); setSuggestedPrompts([]); }}
                                                    className="flex-shrink-0 px-3 py-1.5 bg-black/40 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/50 rounded-lg text-xs text-gray-300 transition-all text-left max-w-xs truncate"
                                                >
                                                    {s.title}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center animate-in fade-in">
                                        {error}
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Options */}
                            <div className="lg:col-span-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dimensions</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ASPECT_RATIOS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setAspectRatio(opt.value)}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${aspectRatio === opt.value ? 'bg-pink-500/20 border-pink-500 text-white' : 'bg-black/30 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(isAdmin || showDebug) && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Cpu className="w-3.5 h-3.5" />
                                            Model
                                        </label>
                                        <select
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                            className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                                        >
                                            {AVAILABLE_MODELS.map(model => (
                                                <option key={model.id} value={model.id}>{model.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <button
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim() || loading}
                                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hovered:from-pink-600 hovered:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                                    Generate
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

                {/* --- LAYER 3: RIGHT PANEL - DEBUG --- */}
                <div
                    className={`absolute top-0 right-0 bottom-0 w-[400px] bg-black/90 backdrop-blur-xl border-l border-white/10 z-40 transition-transform duration-300 ease-out flex flex-col ${showDebug ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-pink-400" /> Debug Console
                        </h3>
                        <button onClick={() => setShowDebug(false)} className="text-gray-400 hover:text-white">
                            <ChevronDown className="w-5 h-5 -rotate-90" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-gray-300 custom-scrollbar">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Captured Wireframe</h4>
                                {capturedWireframe ? (
                                    <img src={capturedWireframe} alt="Debug wireframe" className="w-full border border-gray-700 rounded-lg bg-black/50" />
                                ) : (
                                    <div className="p-4 rounded-lg bg-white/5 text-center text-gray-500 italic">No capture yet</div>
                                )}
                                <button
                                    onClick={async () => {
                                        if (wireframeRef.current) {
                                            const img = await toPng(wireframeRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#000000' });
                                            setCapturedWireframe(img);
                                        }
                                    }}
                                    className="mt-2 w-full py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 text-[10px]"
                                >
                                    Force Capture Test
                                </button>
                            </div>

                            <div>
                                <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Generation Params</h4>
                                <pre className="p-3 bg-black/50 rounded-lg overflow-x-auto text-[10px] leading-relaxed border border-white/5">
                                    {JSON.stringify({
                                        prompt,
                                        aspectRatio,
                                        model: selectedModel,
                                        layoutMode: isLayoutMode
                                    }, null, 2)}
                                </pre>
                            </div>

                            {isAdmin && result?.debugData && (
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-wider text-red-400 mb-2">Vertex AI Response</h4>
                                    <pre className="p-3 bg-black/50 rounded-lg overflow-x-auto text-[10px] leading-relaxed border border-red-900/30 text-yellow-500/80">
                                        {JSON.stringify(result.debugData.response, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </PremiumGate>
    );
};
