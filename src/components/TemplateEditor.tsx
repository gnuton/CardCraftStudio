import React, { useState, useRef, useEffect } from 'react';
import type { DeckStyle } from '../App';
import { Card } from './Card';
import { Move, CornerUpLeft, Type, Image as ImageIcon, Crosshair, X, Save } from 'lucide-react';

interface TemplateEditorProps {
    deckStyle: DeckStyle;
    onUpdateStyle: (updates: Partial<DeckStyle>) => void;
    onClose: () => void;
    onSaveTemplate?: () => void;
}

type DraggableElement = 'title' | 'description' | 'art' | 'corner' | 'reversedCorner' | null;

export const TemplateEditor = ({ deckStyle, onUpdateStyle, onClose, onSaveTemplate }: TemplateEditorProps) => {
    const [activeElement, setActiveElement] = useState<DraggableElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialX: 0, initialY: 0 });

    const handleMouseDown = (e: React.MouseEvent, element: DraggableElement) => {
        e.preventDefault();
        e.stopPropagation();

        setActiveElement(element);

        let initialX = 0;
        let initialY = 0;

        switch (element) {
            case 'title':
                initialX = deckStyle.titleX;
                initialY = deckStyle.titleY;
                break;
            case 'description':
                initialX = deckStyle.descriptionX;
                initialY = deckStyle.descriptionY;
                break;
            case 'art':
                initialX = deckStyle.artX;
                initialY = deckStyle.artY;
                break;
            case 'corner':
                initialX = deckStyle.cornerX;
                initialY = deckStyle.cornerY;
                break;
            case 'reversedCorner':
                initialX = deckStyle.reversedCornerX;
                initialY = deckStyle.reversedCornerY;
                break;
        }

        setDragStart({
            x: e.clientX,
            y: e.clientY,
            initialX,
            initialY
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!activeElement) return;

            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;

            // We are using a 1:1 scale for now, but if we scale the card we'd need to adjust here
            const newX = Math.round(dragStart.initialX + dx);
            const newY = Math.round(dragStart.initialY + dy);

            const updates: Partial<DeckStyle> = {};
            switch (activeElement) {
                case 'title':
                    updates.titleX = newX;
                    updates.titleY = newY;
                    break;
                case 'description':
                    updates.descriptionX = newX;
                    updates.descriptionY = newY;
                    break;
                case 'art':
                    updates.artX = newX;
                    updates.artY = newY;
                    break;
                case 'corner':
                    updates.cornerX = newX;
                    updates.cornerY = newY;
                    break;
                case 'reversedCorner':
                    updates.reversedCornerX = newX;
                    updates.reversedCornerY = newY;
                    break;
            }
            onUpdateStyle(updates);
        };

        const handleMouseUp = () => {
            setActiveElement(null);
        };

        if (activeElement) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [activeElement, dragStart, onUpdateStyle]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8">
            <div className="absolute top-4 right-4 flex gap-4">
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="mb-8 text-center text-white space-y-2">
                <h2 className="text-2xl font-bold">Visual Layout Editor</h2>
                <p className="text-white/60 text-sm">Click and drag elements on the card to move them.</p>
            </div>

            <div className="relative group" ref={containerRef}>
                {/* The Actual Card */}
                <div className="pointer-events-none shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <Card
                        title="Sample Element"
                        description="Drag me anywhere to change the global template layout."
                        deckStyle={deckStyle}
                    />
                </div>

                {/* Drag Overlays - These match the elements in Card.tsx */}

                {/* Title Handle */}
                <div
                    onMouseDown={(e) => handleMouseDown(e, 'title')}
                    className={`absolute left-1/2 top-1/2 cursor-move border-2 transition-all z-50 flex items-center justify-center
                        ${activeElement === 'title' ? 'border-yellow-400 bg-yellow-400/20 shadow-lg scale-105' : 'border-transparent hover:border-white/50 hover:bg-white/10'}`}
                    style={{
                        width: `${deckStyle.titleWidth}px`,
                        height: '40px',
                        transform: `translate(calc(-50% + ${deckStyle.titleX}px), calc(-50% + ${deckStyle.titleY}px)) rotate(${deckStyle.titleRotate}deg)`,
                    }}
                >
                    <div className="bg-white/80 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Type className="w-3 h-3 text-black" />
                    </div>
                </div>

                {/* Art Handle */}
                <div
                    onMouseDown={(e) => handleMouseDown(e, 'art')}
                    className={`absolute left-1/2 top-1/2 cursor-move border-2 transition-all z-40 flex items-center justify-center
                        ${activeElement === 'art' ? 'border-yellow-400 bg-yellow-400/20 shadow-lg' : 'border-transparent hover:border-white/50 hover:bg-white/10'}`}
                    style={{
                        width: `${deckStyle.artWidth}px`,
                        height: `${deckStyle.artHeight}px`,
                        transform: `translate(calc(-50% + ${deckStyle.artX}px), calc(-50% + ${deckStyle.artY}px))`,
                    }}
                >
                    <div className="bg-white/80 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="w-4 h-4 text-black" />
                    </div>
                </div>

                {/* Description Handle */}
                <div
                    onMouseDown={(e) => handleMouseDown(e, 'description')}
                    className={`absolute left-1/2 top-1/2 cursor-move border-2 transition-all z-50 flex items-center justify-center
                        ${activeElement === 'description' ? 'border-yellow-400 bg-yellow-400/20 shadow-lg scale-105' : 'border-transparent hover:border-white/50 hover:bg-white/10'}`}
                    style={{
                        width: `${deckStyle.descriptionWidth}px`,
                        height: '100px',
                        transform: `translate(calc(-50% + ${deckStyle.descriptionX}px), calc(-50% + ${deckStyle.descriptionY}px)) rotate(${deckStyle.descriptionRotate}deg)`,
                    }}
                >
                    <div className="bg-white/80 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move className="w-3 h-3 text-black" />
                    </div>
                </div>

                {/* Corner Handle */}
                {deckStyle.showCorner && (
                    <div
                        onMouseDown={(e) => handleMouseDown(e, 'corner')}
                        className={`absolute left-1/2 top-1/2 cursor-move border-2 transition-all z-[60] flex items-center justify-center
                            ${activeElement === 'corner' ? 'border-yellow-400 bg-yellow-400/20 shadow-lg scale-110' : 'border-transparent hover:border-white/50 hover:bg-white/10'}`}
                        style={{
                            width: `${deckStyle.cornerWidth}px`,
                            height: `${deckStyle.cornerHeight}px`,
                            transform: `translate(calc(-50% + ${deckStyle.cornerX}px), calc(-50% + ${deckStyle.cornerY}px)) rotate(${deckStyle.cornerRotate}deg)`,
                        }}
                    >
                        <div className="bg-white/80 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <CornerUpLeft className="w-2 h-2 text-black" />
                        </div>
                    </div>
                )}

                {/* Reversed Corner Handle */}
                {deckStyle.showReversedCorner && (
                    <div
                        onMouseDown={(e) => handleMouseDown(e, 'reversedCorner')}
                        className={`absolute left-1/2 top-1/2 cursor-move border-2 transition-all z-[60] flex items-center justify-center
                            ${activeElement === 'reversedCorner' ? 'border-yellow-400 bg-yellow-400/20 shadow-lg scale-110' : 'border-transparent hover:border-white/50 hover:bg-white/10'}`}
                        style={{
                            width: `${deckStyle.reversedCornerWidth}px`,
                            height: `${deckStyle.reversedCornerHeight}px`,
                            transform: `translate(calc(-50% + ${deckStyle.reversedCornerX}px), calc(-50% + ${deckStyle.reversedCornerY}px)) rotate(${deckStyle.reversedCornerRotate}deg)`,
                        }}
                    >
                        <div className="bg-white/80 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <CornerUpLeft className="w-2 h-2 text-black rotate-180" />
                        </div>
                    </div>
                )}

                {/* Center Crosshair (Guide) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                    <Crosshair className="w-8 h-8 text-white" />
                </div>
            </div>

            {/* Controls panel */}
            <div className="mt-12 bg-white/10 border border-white/20 rounded-2xl p-6 flex items-center gap-8 backdrop-blur-sm">
                <div className="space-y-1">
                    <span className="text-[10px] text-white/40 font-bold uppercase block">Element Selected</span>
                    <span className="text-white font-medium capitalize">{activeElement || 'None'}</span>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="space-y-1 flex-1">
                    <span className="text-[10px] text-white/40 font-bold uppercase block">Current Offsets</span>
                    <span className="text-white font-mono text-sm block">
                        {activeElement ? (
                            activeElement === 'title' ? `X: ${deckStyle.titleX}, Y: ${deckStyle.titleY}` :
                                activeElement === 'description' ? `X: ${deckStyle.descriptionX}, Y: ${deckStyle.descriptionY}` :
                                    activeElement === 'art' ? `X: ${deckStyle.artX}, Y: ${deckStyle.artY}` :
                                        activeElement === 'corner' ? `X: ${deckStyle.cornerX}, Y: ${deckStyle.cornerY}` :
                                            activeElement === 'reversedCorner' ? `X: ${deckStyle.reversedCornerX}, Y: ${deckStyle.reversedCornerY}` :
                                                '--'
                        ) : '--'}
                    </span>
                </div>

                {onSaveTemplate && (
                    <button
                        onClick={onSaveTemplate}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save as Template
                    </button>
                )}
            </div>
        </div>
    );
};
