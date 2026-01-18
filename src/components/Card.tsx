import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';
import type { DeckStyle } from '../App';
import { ResolvedImage } from './ResolvedImage';
import { RichTextEditor } from './RichTextEditor';
import { getGoogleFontUrl } from '../utils/fonts';
import { TransformWrapper } from './TransformWrapper';
import { motion } from 'framer-motion';

interface CardProps {
    topLeftContent?: string;
    bottomRightContent?: string;
    topLeftImage?: string | null;
    bottomRightImage?: string | null;
    centerImage?: string | null;
    title?: string;
    description?: string;
    typeBarContent?: string;
    flavorTextContent?: string;
    statsBoxContent?: string;
    collectorInfoContent?: string;
    className?: string;
    style?: React.CSSProperties;
    id?: string;
    deckStyle?: DeckStyle;
    onElementClick?: (element: string) => void;
    isInteractive?: boolean;
    isFlipped?: boolean;
    selectedElement?: string | null;
    onContentChange?: (key: string, value: string) => void;
    onSelectElement?: (element: string | null) => void;
    onElementUpdate?: (element: string | null, updates: Partial<DeckStyle>) => void;
    allowTextEditing?: boolean;
    parentScale?: number;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        {
            topLeftContent,
            bottomRightContent,
            topLeftImage,
            bottomRightImage,
            centerImage,
            title,
            description,
            typeBarContent,
            flavorTextContent,
            statsBoxContent,
            collectorInfoContent,
            className,
            style,
            id,
            deckStyle,
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

        // Helper to handle simple text inputs
        const renderTextInput = (
            key: string,
            value: string | undefined,
            defaultValue: string,
            placeholder: string,
            styleProps: React.CSSProperties,
            multiline = false
        ) => {
            if (editingElement === key) {
                const CommonProps = {
                    value: value ?? defaultValue ?? '',
                    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onContentChange?.(key, e.target.value),
                    onBlur: () => setEditingElement(null),
                    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
                    autoFocus: true,
                    className: "w-full h-full bg-white/90 dark:bg-black/80 text-black dark:text-white rounded p-1 outline-none ring-2 ring-indigo-500",
                    style: { ...styleProps, backgroundColor: undefined } // Let the input bg handle transparency
                };

                if (multiline) {
                    return <textarea {...CommonProps} style={{ ...CommonProps.style, resize: 'none' }} />;
                }
                return <input type="text" {...CommonProps} />;
            }

            return (
                <div
                    className={cn(
                        "w-full h-full cursor-pointer flex items-center justify-center text-center",
                        !value && isInteractive && "opacity-50 italic"
                    )}
                    style={styleProps}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isInteractive && allowTextEditing) {
                            setEditingElement(key);
                            onSelectElement?.(key);
                        } else if (isInteractive) {
                            onSelectElement?.(key);
                        }
                    }}
                >
                    {value || ((isInteractive && allowTextEditing) ? placeholder : '')}
                </div>
            );
        };

        const renderTransformable = (prefix: string, children: React.ReactNode, options: { useScale?: boolean, lockAspect?: boolean } = {}) => {
            if (!deckStyle || !isInteractive || allowTextEditing) return children;

            const p = prefix as any;
            const values = {
                x: deckStyle[`${p}X` as keyof DeckStyle] as number || 0,
                y: deckStyle[`${p}Y` as keyof DeckStyle] as number || 0,
                width: deckStyle[`${p}Width` as keyof DeckStyle] as number || 100,
                height: deckStyle[`${p}Height` as keyof DeckStyle] as number,
                rotate: deckStyle[`${p}Rotate` as keyof DeckStyle] as number || 0,
                scale: deckStyle[`${p}Scale` as keyof DeckStyle] as number || 1,
            };

            return (
                <TransformWrapper
                    isActive={isInteractive}
                    isSelected={selectedElement === prefix}
                    values={values}
                    useScaleForResize={options.useScale}
                    lockAspectRatio={options.lockAspect}
                    onSelect={() => onSelectElement?.(prefix)}
                    onUpdate={(newVals) => {
                        onElementUpdate?.(prefix, {
                            [`${p}X`]: newVals.x,
                            [`${p}Y`]: newVals.y,
                            [`${p}Width`]: newVals.width,
                            [`${p}Height`]: newVals.height,
                            [`${p}Rotate`]: newVals.rotate,
                            [`${p}Scale`]: newVals.scale,
                        } as any);
                    }}
                    onDelete={() => {
                        const toggleKey = `show${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`;
                        onElementUpdate?.(null, { [toggleKey]: false } as any);
                        onSelectElement?.(null);
                    }}
                    parentScale={parentScale}
                    bounds={{
                        minX: -187.5, maxX: 187.5,
                        minY: -262.5, maxY: 262.5
                    }}
                >
                    <div className="w-full h-full">
                        {children}
                    </div>
                </TransformWrapper>
            );
        };

        // Helper to render an element styling wrapper
        const renderstyledSection = (
            prefix: string,
            children: React.ReactNode,
            className?: string,
            styleOverrides?: React.CSSProperties
        ) => {
            if (!deckStyle || deckStyle[`show${prefix.charAt(0).toUpperCase() + prefix.slice(1)}` as keyof DeckStyle] === false) return null;

            const p = prefix as any;
            const style: React.CSSProperties = {
                backgroundColor: deckStyle[`${p}BackgroundColor` as keyof DeckStyle] as string,
                borderColor: deckStyle[`${p}BorderColor` as keyof DeckStyle] as string,
                borderStyle: (deckStyle[`${p}BorderStyle` as keyof DeckStyle] as any) || 'none',
                borderWidth: `${deckStyle[`${p}BorderWidth` as keyof DeckStyle] || 0}px`,
                opacity: deckStyle[`${p}Opacity` as keyof DeckStyle] as number,
                marginTop: allowTextEditing ? '4px' : '0',
                marginBottom: allowTextEditing ? '4px' : '0',
                ...styleOverrides
            };

            const isSelected = selectedElement === prefix;

            return (
                <div
                    className={cn(
                        "relative transition-all",
                        className,
                        isSelected && isInteractive && allowTextEditing && "ring-2 ring-indigo-500/50 z-10 rounded-sm"
                    )}
                    style={style}
                    onClick={(e) => {
                        if (isInteractive) {
                            e.stopPropagation();
                            onSelectElement?.(prefix);
                        }
                    }}
                >
                    {children}
                </div>
            );
        };

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
                            className="w-full h-full flex flex-col p-3"
                            style={{
                                borderColor: deckStyle?.borderColor || '#000000',
                                borderWidth: `${deckStyle?.borderWidth || 12}px`,
                                borderStyle: 'solid',
                                backgroundColor: deckStyle?.backgroundColor || '#ffffff',
                                backgroundImage: resolveBgImage(deckStyle?.backgroundImage),
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                fontFamily: deckStyle?.globalFont || 'Inter, sans-serif',
                            }}
                        >
                            {/* Background Overlay */}
                            <div className="absolute inset-0 z-0 bg-black/0 pointer-events-none" />

                            {/* --- ABSOLUTE OVERLAYS --- */}

                            {/* Corners */}
                            {deckStyle?.showCorner && renderTransformable('corner', (
                                <div
                                    className={cn(
                                        "z-40 flex flex-col items-center justify-center min-w-[32px]",
                                        !allowTextEditing && !isInteractive && "absolute top-1/2 left-1/2"
                                    )}
                                    style={!allowTextEditing && !isInteractive ? {
                                        transform: `translate(calc(-50% + ${deckStyle?.cornerX || 0}px), calc(-50% + ${deckStyle?.cornerY || 0}px)) rotate(${deckStyle?.cornerRotate || 0}deg)`,
                                        width: deckStyle?.cornerWidth || 40,
                                        height: deckStyle?.cornerHeight || 40,
                                    } : (allowTextEditing ? { position: 'absolute', top: '8px', left: '8px' } : { width: '100%', height: '100%' })}
                                    onClick={(e) => { if (isInteractive) { e.stopPropagation(); onSelectElement?.('corner'); } }}
                                >
                                    {topLeftImage ? (
                                        <img src={topLeftImage} className="w-8 h-8 object-contain mb-1" alt="" />
                                    ) : (
                                        renderTextInput('topLeftContent', topLeftContent, 'A', 'A', {
                                            color: deckStyle?.cornerColor || '#000000',
                                            fontFamily: deckStyle?.cornerFont || 'sans-serif',
                                            fontSize: `${deckStyle?.cornerFontSize || 24}px`,
                                            fontWeight: 'bold',
                                            lineHeight: '1'
                                        })
                                    )}
                                </div>
                            ))}

                            {deckStyle?.showReversedCorner && renderTransformable('reversedCorner', (
                                <div
                                    className={cn(
                                        "z-40 flex flex-col items-center justify-center min-w-[32px] rotate-180",
                                        !allowTextEditing && !isInteractive && "absolute top-1/2 left-1/2"
                                    )}
                                    style={!allowTextEditing && !isInteractive ? {
                                        transform: `translate(calc(-50% + ${deckStyle?.reversedCornerX || 0}px), calc(-50% + ${deckStyle?.reversedCornerY || 0}px)) rotate(${deckStyle?.reversedCornerRotate || 0}deg)`,
                                        width: deckStyle?.reversedCornerWidth || 40,
                                        height: deckStyle?.reversedCornerHeight || 40,
                                    } : (allowTextEditing ? { position: 'absolute', bottom: '8px', right: '8px', transform: 'rotate(180deg)' } : { width: '100%', height: '100%' })}
                                    onClick={(e) => { if (isInteractive) { e.stopPropagation(); onSelectElement?.('reversedCorner'); } }}
                                >
                                    {bottomRightImage ? (
                                        <img src={bottomRightImage} className="w-8 h-8 object-contain mb-1" alt="" />
                                    ) : (
                                        renderTextInput('bottomRightContent', bottomRightContent, 'A', 'A', {
                                            color: deckStyle?.cornerColor || '#000000',
                                            fontFamily: deckStyle?.cornerFont || 'sans-serif',
                                            fontSize: `${deckStyle?.cornerFontSize || 24}px`,
                                            fontWeight: 'bold',
                                            lineHeight: '1'
                                        })
                                    )}
                                </div>
                            ))}

                            {/* Stats Box */}
                            {deckStyle?.showStatsBox && renderTransformable('statsBox', (
                                <div
                                    className={cn(
                                        "z-30 bg-white border-2 border-black px-3 py-1 rounded-lg shadow-lg",
                                        !allowTextEditing && !isInteractive && "absolute top-1/2 left-1/2"
                                    )}
                                    style={!allowTextEditing && !isInteractive ? {
                                        backgroundColor: deckStyle?.statsBoxBackgroundColor || '#ffffff',
                                        borderColor: deckStyle?.statsBoxBorderColor || '#000000',
                                        transform: `translate(calc(-50% + ${deckStyle?.statsBoxX || 0}px), calc(-50% + ${deckStyle?.statsBoxY || 0}px)) rotate(${deckStyle?.statsBoxRotate || 0}deg)`,
                                        width: deckStyle?.statsBoxWidth || 60,
                                        height: deckStyle?.statsBoxHeight || 30,
                                    } : (allowTextEditing ? { position: 'absolute', bottom: '32px', right: '24px' } : { width: '100%', height: '100%', backgroundColor: deckStyle?.statsBoxBackgroundColor || '#ffffff', borderColor: deckStyle?.statsBoxBorderColor || '#000000' })}
                                    onClick={(e) => { if (isInteractive) { e.stopPropagation(); onSelectElement?.('statsBox'); } }}
                                >
                                    {renderTextInput('statsBoxContent', statsBoxContent, '1 / 1', 'Stats', {
                                        color: deckStyle?.statsBoxColor || '#000000',
                                        fontFamily: deckStyle?.statsBoxFont || 'sans-serif',
                                        fontSize: `${deckStyle?.statsBoxFontSize || 16}px`,
                                        fontWeight: 'bold',
                                    })}
                                </div>
                            ))}

                            {/* --- MAIN FLEX LAYOUT --- */}
                            <div className={cn(
                                "flex-1 flex flex-col w-full h-full",
                                !allowTextEditing && "block overflow-visible"
                            )}>

                                {/* Header Row / Title */}
                                {deckStyle?.showTitle !== false && renderTransformable('title', (
                                    <div
                                        className={cn(
                                            "z-20",
                                            !allowTextEditing && !isInteractive && "absolute top-1/2 left-1/2",
                                            allowTextEditing && "mb-2 pl-8 pr-2"
                                        )}
                                        style={!allowTextEditing && !isInteractive ? {
                                            transform: `translate(calc(-50% + ${deckStyle?.titleX || 0}px), calc(-50% + ${deckStyle?.titleY || 0}px)) rotate(${deckStyle?.titleRotate || 0}deg) scale(${deckStyle?.titleScale || 1})`,
                                            width: deckStyle?.titleWidth || 200,
                                        } : (!allowTextEditing ? { width: '100%', height: '100%' } : undefined)}
                                    >
                                        {renderstyledSection('title',
                                            renderTextInput('title', title, 'Card Title', 'Card Title', {
                                                color: deckStyle?.titleColor || '#000000',
                                                fontFamily: deckStyle?.titleFont || 'sans-serif',
                                                fontSize: `${deckStyle?.titleFontSize || 16}px`,
                                                fontWeight: 'bold',
                                                textAlign: 'left',
                                                width: '100%'
                                            }),
                                            allowTextEditing ? "flex-1 border-b border-black/10 pb-1" : ""
                                        )}
                                    </div>
                                ), { useScale: true })}

                                {/* Art Box */}
                                {deckStyle?.showArt !== false && renderTransformable('art', (
                                    <div
                                        className={cn(
                                            "relative bg-slate-100 border border-slate-300 rounded overflow-hidden group mb-2 shadow-inner z-10",
                                            !allowTextEditing && !isInteractive && "absolute top-1/2 left-1/2",
                                            selectedElement === 'art' && isInteractive && allowTextEditing && "ring-2 ring-indigo-500/50"
                                        )}
                                        style={!allowTextEditing && !isInteractive ? {
                                            transform: `translate(calc(-50% + ${deckStyle?.artX || 0}px), calc(-50% + ${deckStyle?.artY || 0}px)) rotate(${deckStyle?.artRotate || 0}deg)`,
                                            width: deckStyle?.artWidth || 264,
                                            height: deckStyle?.artHeight || 164,
                                        } : (!allowTextEditing ? { width: '100%', height: '100%' } : { width: '100%', aspectRatio: '4/3' })}
                                        onClick={(e) => { if (isInteractive) { e.stopPropagation(); onSelectElement?.('art'); } }}
                                    >
                                        {centerImage ? (
                                            <ResolvedImage
                                                src={centerImage}
                                                alt="Card Center"
                                                className="w-full h-full object-cover pointer-events-none"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center p-4">
                                                {(isInteractive && allowTextEditing) ? "Drag image" : "No Image"}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Type Line */}
                                {deckStyle?.showTypeBar && renderTransformable('typeBar', (
                                    <div
                                        className={cn(
                                            "z-20",
                                            !allowTextEditing && !isInteractive && "absolute top-1/2 left-1/2"
                                        )}
                                        style={!allowTextEditing && !isInteractive ? {
                                            transform: `translate(calc(-50% + ${deckStyle?.typeBarX || 0}px), calc(-50% + ${deckStyle?.typeBarY || 0}px)) rotate(${deckStyle?.typeBarRotate || 0}deg)`,
                                            width: deckStyle?.typeBarWidth || 200,
                                        } : (!allowTextEditing ? { width: '100%', height: '100%' } : undefined)}
                                    >
                                        {renderstyledSection('typeBar',
                                            renderTextInput('typeBarContent', typeBarContent, 'Type - Subtype', 'TYPE', {
                                                color: deckStyle?.typeBarColor || '#000000',
                                                fontFamily: deckStyle?.typeBarFont || 'sans-serif',
                                                fontSize: `${deckStyle?.typeBarFontSize || 12}px`,
                                                textTransform: 'uppercase',
                                                fontWeight: 'bold',
                                                textAlign: 'left'
                                            }),
                                            allowTextEditing ? "mb-2 px-1 py-0.5" : ""
                                        )}
                                    </div>
                                ))}

                                {/* Text Box Area */}
                                <div className={cn(
                                    "flex-1 border-2 border-black/5 bg-white/50 rounded-lg p-2 flex flex-col gap-2 relative overflow-hidden",
                                    !allowTextEditing && "overflow-visible bg-transparent border-0"
                                )}>

                                    {/* Description */}
                                    {deckStyle?.showDescription !== false && renderTransformable('description', (
                                        <div
                                            className={cn(
                                                "relative text-left z-10",
                                                allowTextEditing && "flex-1 min-h-[50px]",
                                                !allowTextEditing && !isInteractive && "absolute top-1/2 left-1/2",
                                                selectedElement === 'description' && isInteractive && allowTextEditing && "ring-2 ring-indigo-500/50 rounded"
                                            )}
                                            style={!allowTextEditing && !isInteractive ? {
                                                transform: `translate(calc(-50% + ${deckStyle?.descriptionX || 0}px), calc(-50% + ${deckStyle?.descriptionY || 0}px)) rotate(${deckStyle?.descriptionRotate || 0}deg) scale(${deckStyle?.descriptionScale || 1})`,
                                                width: deckStyle?.descriptionWidth || 250,
                                            } : (!allowTextEditing ? { width: '100%', height: '100%' } : undefined)}
                                            onClick={(e) => {
                                                if (isInteractive) {
                                                    e.stopPropagation();
                                                    if (allowTextEditing) setEditingElement('description');
                                                    onSelectElement?.('description');
                                                }
                                            }}
                                        >
                                            {editingElement === 'description' && allowTextEditing ? (
                                                <div className="absolute inset-0 bg-white/95 z-50 rounded p-1 ring-2 ring-indigo-500 shadow-lg text-left overflow-auto" onKeyDown={(e) => e.stopPropagation()}>
                                                    <RichTextEditor
                                                        value={description ?? ''}
                                                        onChange={(val) => onContentChange?.('description', val)}
                                                    />
                                                    <div className="flex justify-end mt-1 sticky bottom-0 bg-white/90 p-1">
                                                        <button
                                                            onMouseDown={(e) => { e.preventDefault(); setEditingElement(null); }}
                                                            className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                                                        >
                                                            Done
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="h-full overflow-y-auto pr-1"
                                                    style={{
                                                        color: deckStyle?.descriptionColor || '#000000',
                                                        fontFamily: deckStyle?.descriptionFont || 'sans-serif',
                                                        fontSize: `${deckStyle?.descriptionFontSize || 13}px`,
                                                        lineHeight: '1.4'
                                                    }}
                                                >
                                                    <div dangerouslySetInnerHTML={{ __html: description || (isInteractive && allowTextEditing ? '<span class="opacity-50 italic">Description rules...</span>' : '') }} />
                                                </div>
                                            )}
                                        </div>
                                    ), { useScale: true })}

                                    {/* Flavor Text */}
                                    {deckStyle?.showFlavorText && renderTransformable('flavorText', (
                                        <div
                                            className={cn(
                                                "z-20",
                                                !allowTextEditing && !isInteractive && "absolute top-1/2 left-1/2"
                                            )}
                                            style={!allowTextEditing && !isInteractive ? {
                                                transform: `translate(calc(-50% + ${deckStyle?.flavorTextX || 0}px), calc(-50% + ${deckStyle?.flavorTextY || 0}px)) rotate(${deckStyle?.flavorTextRotate || 0}deg)`,
                                                width: deckStyle?.flavorTextWidth || 220,
                                            } : (!allowTextEditing ? { width: '100%', height: '100%' } : undefined)}
                                        >
                                            {renderstyledSection('flavorText',
                                                renderTextInput('flavorTextContent', flavorTextContent, '', 'Flavor text...', {
                                                    color: deckStyle?.flavorTextColor || '#000000',
                                                    fontFamily: deckStyle?.flavorTextFont || 'serif',
                                                    fontSize: `${deckStyle?.flavorTextFontSize || 11}px`,
                                                    fontStyle: 'italic',
                                                    width: '100%',
                                                    textAlign: 'left'
                                                }, true),
                                                allowTextEditing ? "border-t border-black/10 pt-2" : ""
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Collector Info */}
                                {deckStyle?.showCollectorInfo && renderTransformable('collectorInfo', (
                                    <div
                                        className={cn(
                                            "z-20",
                                            !allowTextEditing && !isInteractive && "absolute top-1/2 left-1/2"
                                        )}
                                        style={!allowTextEditing && !isInteractive ? {
                                            transform: `translate(calc(-50% + ${deckStyle?.collectorInfoX || 0}px), calc(-50% + ${deckStyle?.collectorInfoY || 0}px)) rotate(${deckStyle?.collectorInfoRotate || 0}deg)`,
                                            width: deckStyle?.collectorInfoWidth || 250,
                                        } : (!allowTextEditing ? { width: '100%', height: '100%' } : undefined)}
                                    >
                                        {renderstyledSection('collectorInfo',
                                            renderTextInput('collectorInfoContent', collectorInfoContent, 'Artist | 001/100', 'Info', {
                                                color: deckStyle?.collectorInfoColor || '#000000',
                                                fontFamily: deckStyle?.collectorInfoFont || 'sans-serif',
                                                fontSize: `${deckStyle?.collectorInfoFontSize || 9}px`,
                                                textAlign: 'center',
                                                width: '100%'
                                            }),
                                            allowTextEditing ? "mt-1 opacity-70" : ""
                                        )}
                                    </div>
                                ))}
                            </div>
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
                            className={cn(
                                "w-full h-full bg-white rounded-[18px] overflow-hidden shadow-sm flex flex-col font-sans select-none border-solid",
                                className
                            )}
                            style={{
                                backgroundColor: deckStyle?.cardBackBackgroundColor || '#312e81',
                                backgroundImage: deckStyle?.cardBackImage ? resolveBgImage(deckStyle.cardBackImage) : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderColor: deckStyle?.borderColor || '#000000',
                                borderWidth: `${deckStyle?.borderWidth || 12}px`,
                            }}
                        >
                            {/* Back Title */}
                            {deckStyle?.showCardBackTitle && renderTransformable('cardBackTitle', (
                                <div
                                    className={cn(
                                        "z-30",
                                        !allowTextEditing && !isInteractive && "absolute top-1/2 left-1/2"
                                    )}
                                    style={!allowTextEditing && !isInteractive ? {
                                        color: deckStyle?.cardBackTitleColor || '#ffffff',
                                        fontFamily: deckStyle?.cardBackTitleFont || 'serif',
                                        fontSize: `${deckStyle?.cardBackTitleFontSize || 24}px`,
                                        transform: `translate(calc(-50% + ${deckStyle?.cardBackTitleX || 0}px), calc(-50% + ${deckStyle?.cardBackTitleY || 0}px)) rotate(${deckStyle?.cardBackTitleRotate || 0}deg) scale(${deckStyle?.cardBackTitleScale || 1})`,
                                        width: deckStyle?.cardBackTitleWidth || 250,
                                        textAlign: 'center'
                                    } : (!allowTextEditing ? { width: '100%', height: '100%', color: deckStyle?.cardBackTitleColor || '#ffffff', fontFamily: deckStyle?.cardBackTitleFont || 'serif', fontSize: `${deckStyle?.cardBackTitleFontSize || 24}px`, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined)}
                                >
                                    {deckStyle?.cardBackTitleContent || 'GAME TITLE'}
                                </div>
                            ), { useScale: true })}

                            {/* Copyright */}
                            {deckStyle?.showCardBackCopyright && renderTransformable('cardBackCopyright', (
                                <div
                                    className={cn(
                                        "opacity-70 text-[10px]",
                                        !allowTextEditing && !isInteractive && "absolute top-1/2 left-1/2"
                                    )}
                                    style={!allowTextEditing && !isInteractive ? {
                                        color: deckStyle?.cardBackCopyrightColor || '#ffffff',
                                        fontFamily: deckStyle?.cardBackCopyrightFont || 'sans-serif',
                                        transform: `translate(calc(-50% + ${deckStyle?.cardBackCopyrightX || 0}px), calc(-50% + ${deckStyle?.cardBackCopyrightY || 0}px)) rotate(${deckStyle?.cardBackCopyrightRotate || 0}deg) scale(${deckStyle?.cardBackCopyrightScale || 1})`,
                                        width: deckStyle?.cardBackCopyrightWidth || 200,
                                        textAlign: 'center'
                                    } : (!allowTextEditing ? { width: '100%', height: '100%', color: deckStyle?.cardBackCopyrightColor || '#ffffff', fontFamily: deckStyle?.cardBackCopyrightFont || 'sans-serif', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined)}
                                >
                                    {deckStyle?.cardBackCopyrightContent || '© 2024 CardCraft Studio'}
                                </div>
                            ), { useScale: true })}
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }
);

Card.displayName = 'Card';
