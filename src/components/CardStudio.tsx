import { useState, useRef } from 'react';
import { Card } from './Card';
import { Controls } from './Controls';
import { toSvg } from 'html-to-image';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

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
    onSave: (card: CardConfig) => void;
    onCancel: () => void;
}

export const CardStudio = ({ initialCard, onSave, onCancel }: CardStudioProps) => {
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

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar Controls */}
            <div className="w-[400px] flex-shrink-0 h-full shadow-xl z-10 flex flex-col bg-white">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <button
                        onClick={onCancel}
                        className="flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Deck
                    </button>
                    <button
                        onClick={() => onSave(config)}
                        className="flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors shadow-sm"
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
            <div className="flex-1 h-full flex items-center justify-center p-10 bg-slate-100 relative">
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none"></div>

                <div className="flex flex-col items-center gap-6 z-0">
                    <div className="text-sm font-medium text-slate-400">Preview (Poker Size)</div>
                    <div className="transform transition-transform hover:scale-105 duration-300">
                        <Card {...config} ref={cardRef} />
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
