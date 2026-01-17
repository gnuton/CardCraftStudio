import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn';
import type { DeckStyle } from '../App';
import { ResolvedImage } from './ResolvedImage';
import { RichTextEditor } from './RichTextEditor';
import { getGoogleFontUrl } from '../utils/fonts';

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
            onElementClick,
            isInteractive = false,
            isFlipped = false,
            selectedElement,
            onContentChange,
            onSelectElement
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
                        if (isInteractive) {
                            setEditingElement(key);
                            onSelectElement?.(key);
                        }
                    }}
                >
                    {value || (isInteractive ? placeholder : '')}
                </div>
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
                // borderRadius: `${deckStyle[`${p}BorderRadius` as keyof DeckStyle] || 0}px`, // Basic rounding
                opacity: deckStyle[`${p}Opacity` as keyof DeckStyle] as number,
                marginTop: '4px',
                marginBottom: '4px',
                ...styleOverrides
            };

            const isSelected = selectedElement === prefix;

            return (
                <div
                    className={cn(
                        "relative transition-all",
                        className,
                        isSelected && isInteractive && "ring-2 ring-indigo-500/50 z-10 rounded-sm"
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
                className={cn(
                    "relative w-[63mm] h-[88mm] bg-white rounded-[18px] overflow-hidden shadow-sm transition-all duration-300 flex flex-col font-sans select-none",
                    className
                )}
                style={{
                    width: '375px',
                    height: '525px',
                    borderColor: deckStyle?.borderColor || '#000000',
                    borderWidth: `${deckStyle?.borderWidth || 12}px`,
                    borderStyle: 'solid',
                    backgroundColor: deckStyle?.backgroundColor || '#ffffff',
                    backgroundImage: resolveBgImage(deckStyle?.backgroundImage),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    fontFamily: deckStyle?.globalFont || 'Inter, sans-serif',
                    ...style,
                }}
            >
                {/* Background Overlay */}
                <div className="absolute inset-0 z-0 bg-black/0 pointer-events-none" />

                {/* --- ABSOLUTE OVERLAYS --- */}

                {/* Corners */}
                {deckStyle?.showCorner && (
                    <div
                        className="absolute top-2 left-2 z-40 flex flex-col items-center justify-center min-w-[32px]"
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
                )}

                {deckStyle?.showReversedCorner && (
                    <div
                        className="absolute bottom-2 right-2 z-40 flex flex-col items-center justify-center min-w-[32px] rotate-180"
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
                )}

                {/* Stats Box (Floating Bottom Right, roughly) */}
                {deckStyle?.showStatsBox && (
                    <div
                        className="absolute bottom-8 right-6 z-30 bg-white border-2 border-black px-3 py-1 rounded-lg shadow-lg"
                        style={{
                            backgroundColor: deckStyle.statsBoxBackgroundColor || '#ffffff',
                            borderColor: deckStyle.statsBoxBorderColor || '#000000',
                        }}
                        onClick={(e) => { if (isInteractive) { e.stopPropagation(); onSelectElement?.('statsBox'); } }}
                    >
                        {renderTextInput('statsBoxContent', statsBoxContent, '1 / 1', 'Stats', {
                            color: deckStyle?.statsBoxColor || '#000000',
                            fontFamily: deckStyle?.statsBoxFont || 'sans-serif',
                            fontSize: `${deckStyle?.statsBoxFontSize || 16}px`,
                            fontWeight: 'bold',
                        })}
                    </div>
                )}

                {/* --- MAIN FLEX LAYOUT --- */}
                <div className="flex-1 flex flex-col p-3 z-10 w-full h-full">

                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-2 pl-8 pr-2"> {/* Padding left for Corner */}
                        {renderstyledSection('title',
                            renderTextInput('title', title, 'Card Title', 'Card Title', {
                                color: deckStyle?.titleColor || '#000000',
                                fontFamily: deckStyle?.titleFont || 'sans-serif',
                                fontSize: `${deckStyle?.titleFontSize || 16}px`,
                                fontWeight: 'bold',
                                textAlign: 'left',
                                width: '100%'
                            }),
                            "flex-1 border-b border-black/10 pb-1"
                        )}
                    </div>

                    {/* Art Box */}
                    {deckStyle?.showArt !== false && (
                        <div
                            className={cn(
                                "relative w-full aspect-[4/3] bg-slate-100 border border-slate-300 rounded overflow-hidden group mb-2 shadow-inner",
                                selectedElement === 'art' && isInteractive && "ring-2 ring-indigo-500/50"
                            )}
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
                                    {isInteractive ? "Drag image" : "No Image"}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Type Line */}
                    {renderstyledSection('typeBar',
                        renderTextInput('typeBarContent', typeBarContent, 'Type - Subtype', 'TYPE', {
                            color: deckStyle?.typeBarColor || '#000000',
                            fontFamily: deckStyle?.typeBarFont || 'sans-serif',
                            fontSize: `${deckStyle?.typeBarFontSize || 12}px`,
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            textAlign: 'left'
                        }),
                        "mb-2 px-1 py-0.5"
                    )}

                    {/* Text Box Area (Flex Grow) */}
                    <div className="flex-1 border-2 border-black/5 bg-white/50 rounded-lg p-2 flex flex-col gap-2 relative overflow-hidden">

                        {/* Flavor Text (Optional Top or Bottom? Let's put top for now, or mix) */}
                        {/* Actually normally Flavor is at bottom. Let's put Description first */}

                        {deckStyle?.showDescription !== false && (
                            <div
                                className={cn(
                                    "flex-1 relative min-h-[50px] text-left",
                                    selectedElement === 'description' && isInteractive && "ring-2 ring-indigo-500/50 rounded"
                                )}
                                onClick={(e) => {
                                    if (isInteractive) {
                                        e.stopPropagation();
                                        setEditingElement('description');
                                        onSelectElement?.('description');
                                    }
                                }}
                            >
                                {editingElement === 'description' ? (
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
                                        <div dangerouslySetInnerHTML={{ __html: description || (isInteractive ? '<span class="opacity-50 italic">Description rules...</span>' : '') }} />
                                    </div>
                                )}
                            </div>
                        )}

                        {renderstyledSection('flavorText',
                            renderTextInput('flavorTextContent', flavorTextContent, '', 'Flavor text...', {
                                color: deckStyle?.flavorTextColor || '#000000',
                                fontFamily: deckStyle?.flavorTextFont || 'serif',
                                fontSize: `${deckStyle?.flavorTextFontSize || 11}px`,
                                fontStyle: 'italic',
                                width: '100%',
                                textAlign: 'left'
                            }, true),
                            "border-t border-black/10 pt-2"
                        )}

                    </div>

                    {/* Footer / Collector Info */}
                    {renderstyledSection('collectorInfo',
                        renderTextInput('collectorInfoContent', collectorInfoContent, 'Artist | 001/100', 'Info', {
                            color: deckStyle?.collectorInfoColor || '#000000',
                            fontFamily: deckStyle?.collectorInfoFont || 'sans-serif',
                            fontSize: `${deckStyle?.collectorInfoFontSize || 9}px`,
                            textAlign: 'center',
                            width: '100%'
                        }),
                        "mt-1 opacity-70"
                    )}

                </div>
            </div>
        );
    }
);

Card.displayName = 'Card';
