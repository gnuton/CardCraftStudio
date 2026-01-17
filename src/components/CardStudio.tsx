import { useState, useRef, useEffect } from 'react';
import { Card } from './Card';
import { Controls } from './Controls';
import { toSvg } from 'html-to-image';
import { Loader2, Save, Undo, Redo } from 'lucide-react';
import type { DeckStyle } from '../App';
import { cn } from '../utils/cn';

export interface CardConfig {
    id?: string;
    borderColor: string;
    borderWidth: number;
    topLeftContent: string;
    bottomRightContent: string;
    topLeftImage: string | null;  // New: image for top-left corner
    bottomRightImage: string | null;  // New: image for bottom-right corner
    centerImage: string | null;
    title: string;
    description: string;
    typeBarContent?: string;
    flavorTextContent?: string;
    statsBoxContent?: string;
    collectorInfoContent?: string;
    count?: number;
}

interface CardStudioProps {
    initialCard?: CardConfig;
    deckStyle: DeckStyle;
    onSave: (card: CardConfig) => void;
    onCancel: () => void;
}

// @ts-expect-error - onCancel is part of the interface but navigation is now handled by global nav bar
export const CardStudio = ({ initialCard, deckStyle, onSave, onCancel }: CardStudioProps) => {
    const [config, setConfig] = useState<CardConfig>(initialCard || {
        id: crypto.randomUUID(),
        borderColor: '#000000',
        borderWidth: 8,
        topLeftContent: 'A',
        bottomRightContent: 'A',
        topLeftImage: null,
        bottomRightImage: null,
        centerImage: null,
        title: 'Card Title',
        description: 'This is a description of the card ability or effect.',
        typeBarContent: 'Type - Subtype',
        flavorTextContent: 'Flavor text...',
        statsBoxContent: '1 / 1',
        collectorInfoContent: 'Artist | 001/100'
    });

    const [history, setHistory] = useState<{ past: CardConfig[], future: CardConfig[] }>({
        past: [],
        future: []
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const pushToHistory = () => {
        setHistory(prev => ({
            past: [...prev.past.slice(-29), config], // Keep last 30 states
            future: []
        }));
    };

    const handleConfigChange = (key: string, value: any) => {
        const newConfig = { ...config, [key]: value };
        pushToHistory();
        setConfig(newConfig);
    };

    const [status, setStatus] = useState<string | null>(null);

    const showStatus = (msg: string) => {
        setStatus(msg);
        setTimeout(() => setStatus(null), 2000);
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
    }, [config, history]);



    const handleGenerateSvg = async () => {
        if (!cardRef.current) return;

        try {
            setIsGenerating(true);
            const dataUrl = await toSvg(cardRef.current, {
                cacheBust: true,
                backgroundColor: '#ffffff',
            });
            const link = document.createElement('a');
            link.download = `card-${config.title.replace(/\s+/g, '-').toLowerCase()}.svg`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('SVG Generation failed', error);
            alert('Failed to generate SVG');
        } finally {
            setIsGenerating(false);
        }
    };

    const [zoom, setZoom] = useState(2);
    // Pan state
    const [viewPan, setViewPan] = useState({ x: 0, y: 0 });
    const [isDraggingPan, setIsDraggingPan] = useState(false);
    const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        // e.preventDefault(); // React's synthetic event wrapper might warn about this if passive, but let's try.
        // Actually, we usually want to stop propagation/default if we are consuming the scroll.

        // Simple zoom without modifiers
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.min(Math.max(0.5, prev + delta), 3));
    };

    const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
    const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const resetZoom = () => {
        setZoom(1);
        setViewPan({ x: 0, y: 0 });
    };

    const handlePanMouseDown = (e: React.MouseEvent) => {
        // Allow pan on Middle Click (1) or Right Click (2)
        if (e.button !== 1 && e.button !== 2) return;

        e.preventDefault();
        setIsDraggingPan(true);
        setStartPanPoint({ x: e.clientX - viewPan.x, y: e.clientY - viewPan.y });
    };

    const handlePanMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingPan) return;
        e.preventDefault();
        setViewPan({
            x: e.clientX - startPanPoint.x,
            y: e.clientY - startPanPoint.y
        });
    };

    const handlePanMouseUp = () => setIsDraggingPan(false);

    return (
        <div className="flex h-[calc(100vh-7.5rem)] bg-background overflow-hidden font-sans transition-colors duration-300">
            {/* Sidebar Controls */}
            <div className="w-[400px] flex-shrink-0 h-full shadow-xl z-10 flex flex-col bg-card border-r border-border">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold text-foreground">Card Editor</h2>
                        <div className="flex items-center gap-1 mt-1">
                            <button
                                onClick={undo}
                                disabled={history.past.length === 0}
                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Undo (Ctrl+Z)"
                            >
                                <Undo size={16} />
                            </button>
                            <button
                                onClick={redo}
                                disabled={history.future.length === 0}
                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Redo (Ctrl+Shift+Z)"
                            >
                                <Redo size={16} />
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => onSave(config)}
                        className="flex items-center px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Card
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <Controls
                        config={config}
                        onChange={handleConfigChange}
                        onGenerateSvg={handleGenerateSvg}
                        isGenerating={isGenerating}
                        deckStyle={deckStyle}
                        selectedElement={selectedElement}
                        onClearSelection={() => setSelectedElement(null)}
                    />
                </div>
            </div>

            {/* Main Preview Area */}
            <div
                className={cn(
                    "flex-1 h-full flex items-center justify-center p-10 bg-muted/20 relative select-none",
                    isDraggingPan ? "cursor-grabbing" : "cursor-[zoom-in]"
                )}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
                onMouseDown={handlePanMouseDown}
                onMouseMove={handlePanMouseMove}
                onMouseUp={handlePanMouseUp}
                onMouseLeave={handlePanMouseUp}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = () => {
                            handleConfigChange('centerImage', reader.result as string);
                        };
                        reader.readAsDataURL(file);
                    }
                }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground))_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

                {/* Zoom Controls Overlay */}
                <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border p-2 rounded-xl shadow-lg z-20">
                    {status && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce whitespace-nowrap">
                            {status}
                        </div>
                    )}
                    <button
                        onClick={zoomOut}
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        title="Zoom Out"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                    </button>
                    <button
                        onClick={resetZoom}
                        className="px-3 py-1 text-xs font-bold hover:bg-muted rounded-lg transition-colors min-w-[60px] text-center"
                        title="Reset Zoom"
                    >
                        {Math.round(zoom * 100)}%
                    </button>
                    <button
                        onClick={zoomIn}
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        title="Zoom In"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                </div>

                <div className="flex flex-col items-center gap-6 z-0">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Preview (Poker Size)</div>
                    <div
                        className={cn(
                            "transition-transform duration-200 ease-out shadow-2xl rounded-[16px] will-change-transform",
                            isDraggingPan && "pointer-events-none"
                        )}
                        style={{
                            transform: `translate(${viewPan.x}px, ${viewPan.y}px) scale(${zoom})`
                        }}
                    >
                        <Card
                            {...config}
                            deckStyle={deckStyle}
                            ref={cardRef}
                            isInteractive={true}
                            onContentChange={handleConfigChange}
                            selectedElement={selectedElement}
                            onSelectElement={setSelectedElement}
                        />
                    </div>
                    <div className="text-xs text-muted-foreground mt-4 italic">
                        Tip: Scroll to zoom • Right-click to pan
                    </div>
                </div>
            </div>




            {isGenerating && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center flex-col gap-4 text-white">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="font-medium">Generating Export...</p>
                </div>
            )}
        </div>
    );
}
