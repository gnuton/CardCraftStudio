import { useState, useRef } from 'react';
import { Card } from './Card';
import { Controls } from './Controls';
import { toSvg } from 'html-to-image';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import type { DeckStyle } from '../App';

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
    count?: number;
}

interface CardStudioProps {
    initialCard?: CardConfig;
    deckStyle: DeckStyle;
    onSave: (card: CardConfig) => void;
    onCancel: () => void;
}

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
        description: 'This is a description of the card ability or effect.'
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleConfigChange = (key: string, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };



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

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(prev => Math.min(Math.max(0.5, prev + delta), 3));
        }
    };

    const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
    const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const resetZoom = () => setZoom(1);

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden font-sans transition-colors duration-300">
            {/* Sidebar Controls */}
            <div className="w-[400px] flex-shrink-0 h-full shadow-xl z-10 flex flex-col bg-card border-r border-border">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <button
                        onClick={() => {
                            if (window.confirm('Do you want to save changes before leaving?')) {
                                onSave(config);
                            } else {
                                onCancel();
                            }
                        }}
                        className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Deck
                    </button>
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
                    />
                </div>
            </div>

            {/* Main Preview Area */}
            <div
                className="flex-1 h-full flex items-center justify-center p-10 bg-muted/20 relative cursor-zoom-in"
                onWheel={handleWheel}
            >
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground))_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

                {/* Zoom Controls Overlay */}
                <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border p-2 rounded-xl shadow-lg z-20">
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
                        className="transition-transform duration-200 ease-out shadow-2xl rounded-[16px]"
                        style={{ transform: `scale(${zoom})` }}
                    >
                        <Card {...config} deckStyle={deckStyle} ref={cardRef} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-4 italic">
                        Tip: Hold Ctrl + Mouse Wheel to zoom
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
