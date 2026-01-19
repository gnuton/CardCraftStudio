import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';
import type { DeckStyle } from '../App';
import type { CardElement } from '../types/element';
import { ResolvedImage } from './ResolvedImage';

import { getGoogleFontUrl } from '../utils/fonts';
import { TransformWrapper } from './TransformWrapper';
import { motion } from 'framer-motion';

interface CardProps {
    data?: Record<string, string>;
    deckStyle?: DeckStyle;

    // Global overrides
    borderColor?: string;
    borderWidth?: number;

    className?: string;
    style?: React.CSSProperties;
    id?: string;

    // Interaction
    isInteractive?: boolean;
    isFlipped?: boolean;
    selectedElement?: string | null;
    onContentChange?: (key: string, value: string) => void;
    onSelectElement?: (element: string | null) => void;
    onElementUpdate?: (element: string | null, updates: any) => void;
    allowTextEditing?: boolean;
    parentScale?: number;

    // Legacy props support (optional, can be ignored if we fully migrate)
    // But maintaining signature prevents immediate breaks in parent, though we ignore them
    [key: string]: any;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        {
            data = {},
            deckStyle,
            borderColor,
            borderWidth,
            className,
            style,
            id,
            isInteractive = false,
            isFlipped = false,
            selectedElement,
            onContentChange,
            onSelectElement,
            onElementUpdate,
            allowTextEditing = true,
            parentScale = 1,
        },
        ref
    ) => {
        const [editingElement, setEditingElement] = useState<string | null>(null);

        // Load Global Font
        useEffect(() => {
            if (deckStyle?.globalFont) {
                const url = getGoogleFontUrl([deckStyle.globalFont]);
                if (url) {
                    const link = document.createElement('link');
                    link.href = url;
                    link.rel = 'stylesheet';
                    link.id = `font-${deckStyle.globalFont}`;
                    if (!document.getElementById(link.id)) {
                        document.head.appendChild(link);
                    }
                }
            }
        }, [deckStyle?.globalFont]);

        // Escape to cancel editing
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    setEditingElement(null);
                    onSelectElement?.(null);
                }
            };
            if (isInteractive) {
                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
            }
        }, [isInteractive, onSelectElement]);

        const resolveBgImage = (url: string | null | undefined) => {
            if (!url) return undefined;
            if (url.startsWith('templates/') || url.startsWith('/templates/')) {
                const cleanPath = url.startsWith('/') ? url.slice(1) : url;
                return `url(${import.meta.env.BASE_URL}${cleanPath})`;
            }
            return `url(${url})`;
        };

        const renderElementContent = (element: CardElement) => {
            const content = data[element.id] || element.defaultContent || '';

            const isEditing = editingElement === element.id;

            // Styles
            const styleProps: React.CSSProperties = {
                fontFamily: element.fontFamily,
                fontSize: `${element.fontSize}px`,
                color: element.color,
                textAlign: element.textAlign || 'left',
                backgroundColor: element.backgroundColor,
                borderColor: element.borderColor,
                borderWidth: element.borderWidth ? `${element.borderWidth}px` : undefined,
                borderStyle: element.borderWidth ? 'solid' : undefined,
                opacity: element.opacity,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: element.type === 'text' ? 'center' : 'flex-start',
                justifyContent: element.textAlign === 'center' ? 'center' : (element.textAlign === 'right' ? 'flex-end' : 'flex-start'),
                padding: '4px', // Basic padding
            };

            if (element.type === 'image') {
                const imgSrc = content || element.url;
                return (
                    <div
                        className={cn(
                            "w-full h-full relative overflow-hidden",
                            !imgSrc && "bg-slate-100 flex items-center justify-center border border-dashed border-slate-300"
                        )}
                        style={{ ...styleProps, padding: 0 }}
                        onClick={(e) => {
                            if (isInteractive) {
                                e.stopPropagation();
                                onSelectElement?.(element.id);
                            }
                        }}
                    >
                        {imgSrc ? (
                            <ResolvedImage
                                src={imgSrc}
                                alt={element.name}
                                className="w-full h-full object-cover pointer-events-none"
                            />
                        ) : (
                            <div className="text-xs text-slate-400">
                                {isInteractive ? "Drag image" : "No Content"}
                            </div>
                        )}
                    </div>
                );
            }

            if (isEditing && allowTextEditing) {
                const CommonProps = {
                    value: content,
                    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onContentChange?.(element.id, e.target.value),
                    onBlur: () => setEditingElement(null),
                    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
                    autoFocus: true,
                    className: "w-full h-full bg-white/90 p-1 outline-none ring-2 ring-indigo-500 rounded text-black",
                    style: { ...styleProps, backgroundColor: undefined } // Reset bg for input
                };

                if (element.type === 'multiline') {
                    // For multiline, we might want RichText if we have it, or just textarea
                    // Using basic textarea for now to ensure stability
                    return <textarea {...CommonProps} style={{ ...CommonProps.style, resize: 'none' }} />;
                }
                return <input type="text" {...CommonProps} />;
            }

            // View Mode
            return (
                <div
                    className={cn(
                        "w-full h-full cursor-pointer overflow-hidden",
                        !content && isInteractive && "opacity-50 italic outline-dashed outline-1 outline-gray-300"
                    )}
                    style={styleProps}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isInteractive && allowTextEditing) {
                            setEditingElement(element.id);
                            onSelectElement?.(element.id);
                        } else if (isInteractive) {
                            onSelectElement?.(element.id);
                        }
                    }}
                >
                    {element.type === 'multiline' ? (
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                    ) : (
                        content
                    )}
                </div>
            );
        };

        const renderTransformableElement = (element: CardElement) => {
            const isSelected = selectedElement === element.id;

            // Wrapper needs to be positioned absolutely
            const wrapperStyle: React.CSSProperties = {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${element.x}px), calc(-50% + ${element.y}px)) rotate(${element.rotate}deg) scale(${element.scale})`,
                width: `${element.width}px`,
                height: `${element.height}px`,
                zIndex: element.zIndex,
            };

            if (!isInteractive) { // Render static when not interactive (e.g., in deck preview)
                return (
                    <div key={element.id} style={wrapperStyle}>
                        {renderElementContent(element)}
                    </div>
                );
            }

            // Interactive Editor Mode
            // Note: TransformWrapper expects "values" object matching the state
            return (
                <div key={element.id} style={wrapperStyle}> {/* Parent wrapper handles initial position for React logic, but TransformWrapper handles updates */}
                    {/* Actually TransformWrapper in this codebase seems to handle the transform internally?
                       Let's check TransformWrapper implementation via memory or previous View. 
                       It renders children. It takes 'values'. It calls 'onUpdate'.
                       It renders a container.
                   */}
                    <div className="w-full h-full"> {/* Inner content */}
                        <TransformWrapper
                            isActive={isInteractive && isSelected}
                            isSelected={isSelected}
                            values={{
                                x: element.x,
                                y: element.y,
                                width: element.width,
                                height: element.height,
                                rotate: element.rotate,
                                scale: element.scale
                            }}
                            useScaleForResize={true} // Defaulting to scale for simplicity
                            onSelect={() => onSelectElement?.(element.id)}
                            onUpdate={(newVals) => {
                                onElementUpdate?.(element.id, {
                                    x: newVals.x,
                                    y: newVals.y,
                                    width: newVals.width,
                                    height: newVals.height,
                                    rotate: newVals.rotate,
                                    scale: newVals.scale,
                                });
                            }}
                            onDelete={() => {
                                // Delete element? Or just hide?
                                // User said "remove predefined types". User can delete elements in Style Editor.
                                // In Card Editor, we usually don't delete elements from the structure.
                                // But maybe we can hide content?
                                // For now, no delete in Card Editor unless it's content deletion.
                            }}
                            parentScale={parentScale}
                            // Bounds need to match the card size relative to center
                            bounds={{
                                minX: -187.5, maxX: 187.5,
                                minY: -262.5, maxY: 262.5
                            }}
                        >
                            {renderElementContent(element)}
                        </TransformWrapper>
                    </div>
                </div>
            );
        };

        const elements = deckStyle?.elements || [];

        return (
            <div
                ref={ref}
                id={id}
                className={cn("relative", className)}
                style={{
                    width: '375px',
                    height: '525px',
                    perspective: '1000px',
                    ...style
                }}
            >
                <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                    style={{
                        transformStyle: 'preserve-3d',
                        width: '100%',
                        height: '100%',
                        position: 'relative'
                    }}
                >
                    {/* Front Side */}
                    <div
                        style={{
                            backfaceVisibility: 'hidden',
                            position: 'absolute',
                            inset: 0,
                            zIndex: isFlipped ? 0 : 1,
                            pointerEvents: isFlipped ? 'none' : 'auto'
                        }}
                        className="w-full h-full bg-white rounded-[18px] overflow-hidden shadow-sm flex flex-col font-sans select-none"
                    >
                        <div
                            className="w-full h-full relative"
                            style={{
                                borderColor: borderColor || deckStyle?.borderColor || '#000000',
                                borderWidth: `${borderWidth ?? deckStyle?.borderWidth ?? 12}px`,
                                borderStyle: 'solid',
                                backgroundColor: deckStyle?.backgroundColor || '#ffffff',
                                backgroundImage: resolveBgImage(deckStyle?.backgroundImage),
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                fontFamily: deckStyle?.globalFont || 'Inter, sans-serif',
                            }}
                        >
                            {/* Render FRONT elements */}
                            {elements.filter((e: CardElement) => e.side === 'front').map(renderTransformableElement)}

                            {/* Card Back fallback for when flipped? No, this is Front div. */}
                        </div>
                    </div>

                    {/* Back Side */}
                    <div
                        style={{
                            backfaceVisibility: 'hidden',
                            position: 'absolute',
                            inset: 0,
                            transform: 'rotateY(180deg)',
                            zIndex: isFlipped ? 1 : 0,
                            pointerEvents: isFlipped ? 'auto' : 'none'
                        }}
                    >
                        <div
                            className="w-full h-full bg-white rounded-[18px] overflow-hidden shadow-sm relative"
                            style={{
                                backgroundColor: deckStyle?.cardBackBackgroundColor || '#312e81',
                                backgroundImage: deckStyle?.cardBackImage ? resolveBgImage(deckStyle.cardBackImage) : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderColor: borderColor || deckStyle?.borderColor || '#000000',
                                borderWidth: `${borderWidth ?? deckStyle?.borderWidth ?? 12}px`,
                                borderStyle: 'solid'
                            }}
                        >
                            {/* Render BACK elements */}
                            {elements.filter((e: CardElement) => e.side === 'back').map(renderTransformableElement)}
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }
);

Card.displayName = 'Card';
