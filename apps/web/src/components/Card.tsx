import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import type { DeckStyle } from '../types/deck';
import type { CardElement, ImageTransform } from '../types/element';
import { ResolvedImage } from './ResolvedImage';

import { getGoogleFontUrl } from '../utils/fonts';
import { TransformWrapper } from './TransformWrapper';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    data?: Record<string, string>;
    transforms?: Record<string, ImageTransform>;
    deckStyle?: DeckStyle;

    // Global overrides
    borderColor?: string;
    borderWidth?: number;

    // Interaction
    isInteractive?: boolean;
    isLayoutEditable?: boolean; // New prop to control layout handles
    isFlipped?: boolean;
    selectedElement?: string | null;
    onContentChange?: (key: string, value: string) => void;
    onSelectElement?: (element: string | null) => void;
    onElementUpdate?: (element: string | null, updates: Record<string, unknown>) => void;
    onDeleteElement?: (elementId: string) => void;
    onTransformChange?: (elementId: string, transform: ImageTransform) => void;
    onDoubleClickElement?: (elementId: string) => void;
    loadingElementIds?: string[];
    allowTextEditing?: boolean;
    parentScale?: number;

    // But maintaining signature prevents immediate breaks in parent, though we ignore them
    renderMode?: '3d' | 'front' | 'back';

    isPickingColor?: boolean;
    onColorPick?: (elementId: string, x: number, y: number, width: number, height: number) => void;
}

// SVG Data URI for a Pipette Cursor (Hotspot at bottom left tip: x=0, y=32 approx)
// Simple pipette icon with white fill and black stroke for visibility
// Using Base64 encoded SVG to avoid URL encoding issues
const PIPETTE_CURSOR = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yIDIybDUtNSIvPjxwYXRoIGQ9Ik0xMSAxMWw0IDQiLz48cGF0aCBkPSJNOCAxN2w5LTkgMiAyLTkgOS01IDN6Ii8+PC9zdmc+') 0 32, crosshair`;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        {
            data = {},
            transforms,
            deckStyle,
            borderColor,
            borderWidth,
            className,
            style,
            id,
            isInteractive = false,
            isLayoutEditable = true,
            isFlipped = false,
            selectedElement,
            onContentChange,
            onSelectElement,
            onElementUpdate,
            onDeleteElement,
            onTransformChange,
            allowTextEditing = true,
            parentScale = 1,
            renderMode = '3d',
            loadingElementIds,
            isPickingColor,
            onColorPick,
            onDoubleClickElement,
            ...props
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

        const getBgImageSrc = (url: string | null | undefined) => {
            if (!url) return null;
            if (url.startsWith('templates/') || url.startsWith('/templates/')) {
                const cleanPath = url.startsWith('/') ? url.slice(1) : url;
                return `${import.meta.env.BASE_URL}${cleanPath}`;
            }
            return url;
        };

        const renderElementContent = (element: CardElement) => {
            // detailed comment: when removing an image, we set data[element.id] to ''.
            // The previous logic `data[element.id] || element.defaultContent` would treat '' as falsey
            // and fall back to defaultContent, preventing removal. We must check for undefined.
            const content = data[element.id] !== undefined ? data[element.id] : (element.defaultContent || '');

            const isEditing = editingElement === element.id;

            // Styles
            const styleProps: React.CSSProperties = {
                fontFamily: element.fontFamily,
                fontSize: `${element.fontSize}px`,
                color: element.color,
                textAlign: (element.textAlign || 'left') as 'left' | 'center' | 'right' | 'justify',
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
                // Fix for Remove bug: If content is an empty string, we should respect it and NOT fall back to element.url
                // Only fall back if content is undefined
                const imgSrc = content !== undefined ? content : element.url;

                const transform = transforms?.[element.id] || { x: 0, y: 0, scale: 1 };
                const isLoading = loadingElementIds?.includes(element.id);

                // Interaction Handlers
                const handleWheel = (e: React.WheelEvent) => {
                    if (!isInteractive || !onTransformChange) return;
                    e.stopPropagation();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    const newScale = Math.min(Math.max(0.1, transform.scale + delta), 5);
                    onTransformChange(element.id, { ...transform, scale: newScale });
                };

                const handleMouseDown = (e: React.MouseEvent) => {
                    if (!isInteractive || !onTransformChange) return;
                    e.preventDefault();
                    e.stopPropagation();

                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startTransformX = transform.x;
                    const startTransformY = transform.y;

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                        const deltaX = (moveEvent.clientX - startX) / parentScale; // Adjust for parent scale if needed
                        const deltaY = (moveEvent.clientY - startY) / parentScale;

                        onTransformChange(element.id, {
                            ...transform,
                            x: startTransformX + deltaX,
                            y: startTransformY + deltaY
                        });
                    };

                    const handleMouseUp = () => {
                        window.removeEventListener('mousemove', handleMouseMove);
                        window.removeEventListener('mouseup', handleMouseUp);
                    };

                    window.addEventListener('mousemove', handleMouseMove);
                    window.addEventListener('mouseup', handleMouseUp);

                    onSelectElement?.(element.id); // Select on drag start
                };

                return (
                    <div
                        className={cn(
                            "w-full h-full relative overflow-hidden",
                            !imgSrc && "bg-slate-100 flex items-center justify-center border border-dashed border-slate-300",
                            isPickingColor && "cursor-crosshair ring-2 ring-primary ring-offset-2"
                        )}
                        style={{
                            ...styleProps,
                            padding: 0,
                            backgroundColor: transform.backgroundColor || 'transparent',
                            cursor: isPickingColor ? PIPETTE_CURSOR : undefined
                        }}
                        onClick={(e) => {
                            // Click handler for direct image interaction if needed
                            if (isInteractive) {
                                e.stopPropagation();
                                onSelectElement?.(element.id);
                            }
                        }}
                        onDoubleClick={(e) => {
                            if (isInteractive) {
                                e.stopPropagation();
                                onDoubleClickElement?.(element.id);
                            }
                        }}
                        onWheel={handleWheel}
                    >
                        {isLoading && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                                <Loader2 className="w-8 h-8 animate-spin text-white drop-shadow-md" />
                            </div>
                        )}

                        {imgSrc ? (
                            <div
                                className={cn(
                                    "w-full h-full flex items-center justify-center pointer-events-auto",
                                    isPickingColor ? "cursor-none" : "cursor-move"
                                )}
                                onMouseDown={handleMouseDown}
                                onClick={(e) => {
                                    if (isPickingColor && onColorPick) {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const y = e.clientY - rect.top;
                                        onColorPick(element.id, x, y, rect.width, rect.height);
                                    }
                                }}
                                style={{
                                    cursor: isPickingColor ? PIPETTE_CURSOR : undefined
                                }}
                            >
                                <div
                                    style={{
                                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                                        transformOrigin: 'center',
                                        transition: 'transform 0.05s linear', // Faster transition for drag
                                        maxWidth: 'none', // Allow image to be larger than container
                                        maxHeight: 'none',
                                    }}
                                >
                                    <ResolvedImage
                                        src={imgSrc}
                                        alt={element.name}
                                        className="max-w-none max-h-none pointer-events-none select-none"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            display: 'block'
                                        }}
                                        draggable={false}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 text-center px-2 select-none">
                                {isInteractive ? "Double-click to add image" : "No Content"}
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

            // Interactive Editor Mode - TransformWrapper handles all positioning
            // We use a simple container here since TransformWrapper manages its own transforms
            const interactiveWrapperStyle: React.CSSProperties = {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none', // Allow clicks to pass through except on elements
                zIndex: isSelected ? 100 : element.zIndex, // Bring selected elements to front
            };

            // Calculate bounds to prevent elements from escaping the card
            const cardWidth = deckStyle?.cardWidth || 375;
            const cardHeight = deckStyle?.cardHeight || 525;
            const cardHalfWidth = cardWidth / 2;
            const cardHalfHeight = cardHeight / 2;

            // Bounds should keep the element center within the card
            // Allow some margin so elements can be partially outside
            const margin = 20; // pixels of element that must stay inside
            const effectiveBounds = {
                minX: -cardHalfWidth + margin,
                maxX: cardHalfWidth - margin,
                minY: -cardHalfHeight + margin,
                maxY: cardHalfHeight - margin,
            };

            return (
                <div key={element.id} style={interactiveWrapperStyle}>
                    <TransformWrapper
                        isActive={isInteractive && isSelected && !isPickingColor}
                        isSelected={isSelected}
                        values={{
                            x: element.x,
                            y: element.y,
                            width: element.width,
                            height: element.height,
                            rotate: element.rotate,
                            scale: element.scale
                        }}
                        useScaleForResize={false} // Use width/height handles for X/Y resizing
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
                            onDeleteElement?.(element.id);
                        }}
                        parentScale={parentScale}
                        bounds={effectiveBounds}
                        disableDrag={!isLayoutEditable}
                        hideControls={!isLayoutEditable}
                        style={{ pointerEvents: 'auto' }} // Enable pointer events on the actual element
                    >
                        <div
                            className="w-full h-full"
                            style={{
                                cursor: isPickingColor ? PIPETTE_CURSOR : undefined
                            }}
                            onClick={(e) => {
                                if (isPickingColor) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;
                                    onColorPick?.(element.id, x, y, rect.width, rect.height);
                                }
                            }}
                        >
                            {renderElementContent(element)}
                        </div>
                    </TransformWrapper>
                </div>
            );
        };

        const elements = deckStyle?.elements || [];

        const frontFaceContent = (
            <div
                className="w-full h-full relative"
                style={{
                    borderColor: borderColor || deckStyle?.borderColor || '#000000',
                    borderWidth: `${borderWidth ?? deckStyle?.borderWidth ?? 12}px`,
                    borderStyle: 'solid',
                    backgroundColor: deckStyle?.backgroundColor || '#ffffff',
                    fontFamily: deckStyle?.globalFont || 'Inter, sans-serif',
                    borderRadius: '18px',
                    overflow: 'hidden',
                }}
            >
                {/* Background Image Layer */}
                {deckStyle?.backgroundImage && (
                    <ResolvedImage
                        src={getBgImageSrc(deckStyle.backgroundImage)}
                        alt="Background"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                )}
                {/* Render FRONT elements */}
                {elements.filter((e: CardElement) => e.side === 'front').map(renderTransformableElement)}
            </div>
        );

        if (renderMode === 'front') {
            const cardWidth = deckStyle?.cardWidth || 375;
            const cardHeight = deckStyle?.cardHeight || 525;
            return (
                <div
                    ref={ref}
                    id={id}
                    className={cn("relative", className)}
                    style={{
                        width: `${cardWidth}px`,
                        height: `${cardHeight}px`,
                        ...style
                    }}
                    {...props}
                >
                    <div className={cn("w-full h-full bg-white rounded-[18px] shadow-sm flex flex-col font-sans select-none", isInteractive ? "overflow-visible" : "overflow-hidden")}>
                        {frontFaceContent}
                    </div>
                </div>
            );
        }

        const backFaceContent = (
            <div
                className={cn("w-full h-full bg-white rounded-[18px] shadow-sm relative overflow-hidden", isInteractive ? "overflow-visible" : "overflow-hidden")}
                style={{
                    backgroundColor: deckStyle?.cardBackBackgroundColor || '#312e81',
                    borderColor: borderColor || deckStyle?.borderColor || '#000000',
                    borderWidth: `${borderWidth ?? deckStyle?.borderWidth ?? 12}px`,
                    borderStyle: 'solid',
                    borderRadius: '18px'
                }}
            >
                {/* Background Image Layer */}
                {deckStyle?.cardBackImage && (
                    <ResolvedImage
                        src={getBgImageSrc(deckStyle.cardBackImage)}
                        alt="Background"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                )}
                {/* Render BACK elements */}
                {elements.filter((e: CardElement) => e.side === 'back').map(renderTransformableElement)}
            </div>
        );

        if (renderMode === 'back') {
            const cardWidth = deckStyle?.cardWidth || 375;
            const cardHeight = deckStyle?.cardHeight || 525;
            return (
                <div
                    ref={ref}
                    id={id}
                    className={cn("relative", className)}
                    style={{
                        width: `${cardWidth}px`,
                        height: `${cardHeight}px`,
                        ...style
                    }}
                    {...props}
                >
                    <div className={cn("w-full h-full bg-white rounded-[18px] shadow-sm flex flex-col font-sans select-none", isInteractive ? "overflow-visible" : "overflow-hidden")}>
                        {backFaceContent}
                    </div>
                </div>
            );
        }

        const cardWidth = deckStyle?.cardWidth || 375;
        const cardHeight = deckStyle?.cardHeight || 525;
        return (
            <div
                ref={ref}
                id={id}
                className={cn("relative", className)}
                style={{
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    perspective: '1000px',
                    ...style
                }}
                {...props}
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
                        className={cn("w-full h-full bg-white rounded-[18px] shadow-sm flex flex-col font-sans select-none", isInteractive ? "overflow-visible" : "overflow-hidden")}
                    >
                        {frontFaceContent}
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
                        {backFaceContent}
                    </div>
                </motion.div>
            </div>
        );

    }
);

Card.displayName = 'Card';
