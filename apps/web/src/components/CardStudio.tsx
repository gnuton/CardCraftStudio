import { useState, useRef, useEffect } from 'react';
import { Card } from './Card';
import { toSvg } from 'html-to-image';
import { Undo, Redo, Download, ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Hand, MousePointer2 } from 'lucide-react';
import type { DeckStyle } from '../types/deck';
import type { ImageTransform } from '../types/element';
import { assetService } from '../services/assetService';
import { cn } from '../utils/cn';
import { AssetManager } from './AssetManager';
import { ImageControls } from './ImageControls';

export interface CardConfig {
    id: string;
    name: string; // Internal name for the card in list
    data: Record<string, string>; // Map element ID to content
    transforms?: Record<string, ImageTransform>;

    // Global overrides
    borderColor?: string;
    borderWidth?: number;
    count?: number;
}

interface CardStudioProps {
    initialCard?: any; // Weak type for migration
    deckStyle: DeckStyle;
    onUpdate: (card: CardConfig) => void;
    onDone: () => void;
}

export const CardStudio = ({ initialCard, deckStyle, onUpdate, onDone }: CardStudioProps) => {
    const [config, setConfig] = useState<CardConfig>(() => {
        // Migration Logic
        if (initialCard && typeof initialCard.data === 'object') {
            return initialCard as CardConfig;
        }

        const legacy = initialCard || {};
        const data: Record<string, string> = {};

        // Attempt to migrate legacy fields to default IDs if they exist
        if (legacy.title) data['title'] = legacy.title;
        if (legacy.description) data['description'] = legacy.description;
        if (legacy.centerImage) data['art'] = legacy.centerImage;
        if (legacy.topLeftContent) data['corner'] = legacy.topLeftContent;
        // Add other legacy migrations as needed

        return {
            id: legacy.id || crypto.randomUUID(),
            name: legacy.title || 'New Card',
            data: data,
            borderColor: legacy.borderColor,
            borderWidth: legacy.borderWidth
        };
    });

    const [history, setHistory] = useState<{ past: CardConfig[], future: CardConfig[] }>({
        past: [],
        future: []
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<string | null>(null);

    const showStatus = (msg: string) => {
        setStatus(msg);
        setTimeout(() => setStatus(null), 2000);
    };

    const pushToHistory = () => {
        setHistory(prev => ({
            past: [...prev.past.slice(-29), config], // Keep last 30 states
            future: []
        }));
    };

    const handleConfigChange = (key: string, value: any) => {
        const newConfig = {
            ...config,
            data: {
                ...config.data,
                [key]: value
            }
        };

        // Special case: if title changes, update card name too
        if (key === 'title') {
            newConfig.name = value;
        }

        pushToHistory();
        setConfig(newConfig);
        onUpdate(newConfig);
    };

    const handleTransformChange = (id: string, transform: ImageTransform) => {
        const newConfig = {
            ...config,
            transforms: {
                ...config.transforms,
                [id]: transform
            }
        };
        // We probably don't need to push to history for every micro-movement if it causes performance issues,
        // but for now let's keep it simple. If drag is laggy, we might need a separate local state that commits on mouse up.
        // For sliders/buttons it's fine.
        setConfig(newConfig);
        onUpdate(newConfig);
    };

    const undo = () => {
        if (history.past.length === 0) return;
        const newPast = [...history.past];
        const previous = newPast.pop()!;
        setHistory({
            past: newPast,
            future: [config, ...history.future]
        });
        setConfig(previous);
        onUpdate(previous);
        showStatus('Undo');
    };

    const redo = () => {
        if (history.future.length === 0) return;
        const newFuture = [...history.future];
        const next = newFuture.shift()!;
        setHistory({
            past: [...history.past, config],
            future: newFuture
        });
        setConfig(next);
        onUpdate(next);
        showStatus('Redo');
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) redo();
                else undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                redo();
            } else if (e.key === 'Escape') {
                setSelectedElement(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [config, history, undo, redo]); // Added undo/redo to deps, ensure they are stable or this effect re-binds often. 

    const handleGenerateSvg = async () => {
        if (!cardRef.current) return;
        try {
            setIsGenerating(true);
            const dataUrl = await toSvg(cardRef.current, { cacheBust: true, pixelRatio: 3 });
            const link = document.createElement('a');
            link.download = `${config.name.replace(/\s+/g, '_')}.svg`;
            link.href = dataUrl;
            link.click();
            showStatus('Exported SVG');
            setIsGenerating(false);
        } catch (err) {
            console.error(err);
            setIsGenerating(false);
        }
    };

    // Zoom & Pan Logic
    const [zoom, setZoom] = useState(1.1);
    const [viewPan, setViewPan] = useState({ x: 0, y: 0 });
    const [isPanMode, setIsPanMode] = useState(false);
    const [isDraggingPan, setIsDraggingPan] = useState(false);
    const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        // Zoom on wheel

        // Let's modify to standard wheel zoom
        if (e.ctrlKey || true) { // Always zoom on wheel for now to match StyleEditor behavior pattern generally
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(prev => Math.min(Math.max(0.5, prev + delta), 4));
        }
    };

    const handlePanMouseDown = (e: React.MouseEvent) => {
        if (!isPanMode && e.button !== 1 && !e.altKey && e.buttons !== 4) return;
        e.preventDefault();
        setIsDraggingPan(true);
        setStartPanPoint({ x: e.clientX - viewPan.x, y: e.clientY - viewPan.y });
    };

    const handlePanMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingPan) return;
        setViewPan({
            x: e.clientX - startPanPoint.x,
            y: e.clientY - startPanPoint.y
        });
    };

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 4));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
    const handleResetView = () => {
        setZoom(1.1);
        setViewPan({ x: 0, y: 0 });
    };

    const handleElementSelect = (id: string | null) => {
        if (isPanMode) return;
        setSelectedElement(id);

        if (id) {
            const element = deckStyle.elements.find(e => e.id === id);
            if (element && element.type === 'image') {
                // setIsImageDialogOpen(true); // Don't auto-open, allow selecting to show controls
            }
        }
    };

    const [loadingElementIds, setLoadingElementIds] = useState<string[]>([]);
    const [isPickingColor, setIsPickingColor] = useState(false);

    const handleColorPick = async (elementId: string, x: number, y: number, width: number, _height: number) => {
        setIsPickingColor(false);
        const imageUrl = config.data[elementId];
        if (!imageUrl) return;

        try {
            // Resolve if ref
            let urlToAnalyze = imageUrl;
            if (urlToAnalyze.startsWith('ref:')) {
                const { imageService } = await import('../services/imageService');
                const resolved = await imageService.resolveImage(urlToAnalyze);
                if (resolved) {
                    urlToAnalyze = resolved;
                }
            }

            // Apply inverse transform to coordinates
            // Normalize to logical card coordinates (remove viewport zoom)
            const logicalWidth = deckStyle.cardWidth || 375;
            const logicalHeight = deckStyle.cardHeight || 525;

            const scaleFactor = width / logicalWidth; // Current viewport scale

            const logicalX = x / scaleFactor;
            const logicalY = y / scaleFactor;

            const currentTransform = config.transforms?.[elementId] || { x: 0, y: 0, scale: 1 };

            const centerX = logicalWidth / 2;
            const centerY = logicalHeight / 2;

            const adjustedX = centerX + (logicalX - centerX - currentTransform.x) / currentTransform.scale;
            const adjustedY = centerY + (logicalY - centerY - currentTransform.y) / currentTransform.scale;

            const { getPixelColor } = await import('../utils/color');
            const color = await getPixelColor(urlToAnalyze, adjustedX, adjustedY, logicalWidth, logicalHeight);

            // Update transform
            handleTransformChange(elementId, {
                ...currentTransform,
                backgroundColor: color
            });

            showStatus('Background color updated');
        } catch (e) {
            console.error("Failed to pick color", e);
            showStatus('Failed to pick color');
        }
    };

    // Keep a ref to config for async updates
    const configRef = useRef(config);
    useEffect(() => {
        configRef.current = config;
    }, [config]);

    const handleAssetSelect = async (asset: any) => {
        if (selectedElement) {
            try {
                // Start loading
                setLoadingElementIds(prev => [...prev, selectedElement]);
                showStatus('Loading image...');

                // Fetch URL
                const imageUrl = await assetService.fetchAssetData(asset);

                // Get Color (async)
                let color = '#ffffff';
                try {
                    const { getDominantColor } = await import('../utils/color');
                    let urlToAnalyze = imageUrl;

                    if (urlToAnalyze.startsWith('ref:')) {
                        const { imageService } = await import('../services/imageService');
                        const resolved = await imageService.resolveImage(urlToAnalyze);
                        if (resolved) {
                            urlToAnalyze = resolved;
                        }
                    }

                    color = await getDominantColor(urlToAnalyze);
                } catch (e) {
                    console.error("Color extraction failed", e);
                }

                // Use ref to get latest config without stale closures
                const prevConfig = configRef.current;

                const newTransforms = { ...prevConfig.transforms };
                const currentTransform = newTransforms[selectedElement] || { x: 0, y: 0, scale: 1 };

                newTransforms[selectedElement] = {
                    ...currentTransform,
                    backgroundColor: color
                };

                const newData = {
                    ...prevConfig.data,
                    [selectedElement]: imageUrl
                };

                const newConfig = {
                    ...prevConfig,
                    data: newData,
                    transforms: newTransforms
                };

                setConfig(newConfig);
                onUpdate(newConfig);

                showStatus('Image applied');
            } catch (err) {
                console.error('Failed to load asset image:', err);
                showStatus('Failed to load image');
            } finally {
                // Stop loading
                setLoadingElementIds(prev => prev.filter(id => id !== selectedElement));
            }
        }
        setIsImageDialogOpen(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-background">
            {/* Toolbar Header */}
            <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onDone} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                        <ArrowLeft size={18} />
                        <span className="font-medium">Back</span>
                    </button>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-1">
                        <button onClick={undo} disabled={history.past.length === 0} className="p-2 hover:bg-muted rounded-md disabled:opacity-30 transition-colors" title="Undo">
                            <Undo size={18} />
                        </button>
                        <button onClick={redo} disabled={history.future.length === 0} className="p-2 hover:bg-muted rounded-md disabled:opacity-30 transition-colors" title="Redo">
                            <Redo size={18} />
                        </button>
                    </div>
                </div>

                <div className="font-semibold text-foreground hidden md:block">
                    {config.name || 'Untitled Card'}
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleGenerateSvg} disabled={isGenerating} className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground" title="Download SVG">
                        <Download size={20} />
                    </button>
                    <button onClick={onDone} className="ml-2 px-4 py-1.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors">
                        Done
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Canvas Area */}
                <div
                    className={cn(
                        "flex-1 relative overflow-hidden bg-muted/20 flex items-center justify-center select-none",
                        (isDraggingPan || isPanMode) ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                    )}
                    onWheel={handleWheel}
                    onMouseDown={handlePanMouseDown}
                    onMouseMove={handlePanMouseMove}
                    onMouseUp={() => setIsDraggingPan(false)}
                    onMouseLeave={() => setIsDraggingPan(false)}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                    onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = async () => {
                                try {
                                    showStatus('Uploading image...');
                                    const asset = await assetService.createAsset({
                                        imageData: reader.result as string,
                                        fileName: file.name,
                                        mimeType: file.type,
                                        source: 'uploaded',
                                        tags: ['quick-upload']
                                    });
                                    const url = assetService.getAssetImageUrl(asset);
                                    handleConfigChange('centerImage', url);
                                    showStatus('Image uploaded');
                                } catch (error) {
                                    console.error("Image upload failed", error);
                                    showStatus('Upload failed');
                                }
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                >
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(#88888820_1px,transparent_1px)] [background-size:20px_20px]" />

                    {/* Status Toast */}
                    {status && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-foreground/80 text-background px-4 py-1.5 rounded-full text-sm font-medium animate-in fade-in slide-in-from-top-4">
                            {status}
                        </div>
                    )}

                    {/* Card Container */}
                    <div
                        className={cn("relative transition-transform duration-100 ease-out will-change-transform shadow-2xl rounded-[16px]", (isPanMode || isDraggingPan) && "pointer-events-none")}
                        style={{ transform: `translate(${viewPan.x}px, ${viewPan.y}px) scale(${zoom})` }}
                    >
                        <Card
                            ref={cardRef}
                            {...config}
                            deckStyle={deckStyle}
                            isInteractive={!isPanMode} // Disable editing when panning
                            isLayoutEditable={false} // Disable layout handles in content editor
                            onContentChange={handleConfigChange}
                            onElementUpdate={() => {
                                // If element is image, we might receive transform/content updates here too potentially
                                // But currently we handle it via handleTransformChange or handleConfigChange.
                                // Just a placeholder if we unify update paths.
                            }}
                            selectedElement={selectedElement}
                            onSelectElement={handleElementSelect}
                            loadingElementIds={loadingElementIds}
                            isPickingColor={isPickingColor}
                            onColorPick={handleColorPick}
                            // Pass transform update handler to Card for direct manipulation
                            onTransformChange={handleTransformChange}
                            onDoubleClickElement={(id) => {
                                const element = deckStyle.elements.find(e => e.id === id);
                                if (element?.type === 'image') {
                                    handleElementSelect(id);
                                    setIsImageDialogOpen(true);
                                }
                            }}
                        />
                    </div>

                    {/* Floating Viewport Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2 py-1.5 bg-background/80 backdrop-blur-md border border-border rounded-full shadow-lg z-50">
                        <div className="flex items-center border-r border-border pr-2 mr-1">
                            <button
                                onClick={() => setIsPanMode(false)}
                                className={cn(
                                    "p-2 rounded-full transition-all",
                                    !isPanMode ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                                title="Select Mode"
                            >
                                <MousePointer2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsPanMode(true)}
                                className={cn(
                                    "p-2 rounded-full transition-all",
                                    isPanMode ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                                title="Pan Mode"
                            >
                                <Hand className="w-4 h-4" />
                            </button>
                        </div>

                        <button onClick={handleZoomOut} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono font-medium min-w-[3ch] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button onClick={handleZoomIn} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
                            <ZoomIn className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-border mx-1" />

                        <button onClick={handleResetView} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors" title="Reset View">
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Instructions Hint */}
                    <div className="absolute bottom-6 right-6 text-xs text-muted-foreground bg-background/50 backdrop-blur px-3 py-1.5 rounded text-center pointer-events-none">
                        Double-click text to edit • Drag & drop images
                    </div>
                </div>

                {/* Image Controls */}
                <div className="absolute top-0 right-0 h-full z-40">
                    {selectedElement && deckStyle.elements.find(e => e.id === selectedElement)?.type === 'image' && (
                        <ImageControls
                            transform={config.transforms?.[selectedElement] || { x: 0, y: 0, scale: 1 }}
                            onChange={(t) => handleTransformChange(selectedElement, t)}
                            onReset={() => handleTransformChange(selectedElement, { x: 0, y: 0, scale: 1 })}
                            content={config.data[selectedElement]}
                            onSelectAsset={() => setIsImageDialogOpen(true)}
                            onRemove={() => {
                                if (window.confirm("Remove this image?")) {
                                    handleConfigChange(selectedElement, ''); // Clear content
                                    handleTransformChange(selectedElement, { x: 0, y: 0, scale: 1 }); // Reset transform
                                    // Keep selected to show empty state
                                }
                            }}
                            isPickingColor={isPickingColor}
                            onPickColor={() => setIsPickingColor(true)}
                            onClose={() => handleElementSelect(null)}
                        />
                    )}
                </div>
            </div>

            <AssetManager
                isOpen={isImageDialogOpen}
                onClose={() => setIsImageDialogOpen(false)}
                onAssetSelect={handleAssetSelect}
            />
        </div>
    );
};
