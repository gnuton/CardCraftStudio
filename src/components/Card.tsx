import React, { useEffect } from 'react';
import { cn } from '../utils/cn';
import type { DeckStyle } from '../App';
import { ResolvedImage } from './ResolvedImage';
import { TransformWrapper } from './TransformWrapper';
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
    onElementClick?: (element: 'background' | 'corner' | 'title' | 'art' | 'description' | 'reversedCorner' | 'typeBar' | 'flavorText' | 'statsBox' | 'watermark' | 'rarityIcon' | 'collectorInfo' | 'cardBackTitle' | 'cardBackCopyright') => void;
    // New interactive props
    isInteractive?: boolean;
    isFlipped?: boolean;
    selectedElement?: string | null;
    onElementUpdate?: (element: 'background' | 'corner' | 'title' | 'art' | 'description' | 'reversedCorner' | 'typeBar' | 'flavorText' | 'statsBox' | 'watermark' | 'rarityIcon' | 'collectorInfo' | 'cardBackTitle' | 'cardBackCopyright', updates: Partial<DeckStyle>) => void;
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
            onElementUpdate,
            onContentChange,
            onSelectElement
        },
        ref
    ) => {
        const [editingElement, setEditingElement] = React.useState<string | null>(null);

        // Load Global Font
        useEffect(() => {
            if (deckStyle?.globalFont) {
                const url = getGoogleFontUrl([deckStyle.globalFont]);
                if (url) {
                    const link = document.createElement('link');
                    link.href = url;
                    link.rel = 'stylesheet';
                    link.id = `font-${deckStyle.globalFont}`;

                    // Check if already exists
                    if (!document.getElementById(link.id)) {
                        document.head.appendChild(link);
                        // Cleanup? Maybe not, keep them loaded for now to avoid flickering if switching back.
                        // Ideally we would manage a font manager but for this scope essentially appending is fine.
                    }
                }
            }
        }, [deckStyle?.globalFont]);

        const resolveBgImage = (url: string | null | undefined) => {
            if (!url) return undefined;
            if (url.startsWith('templates/') || url.startsWith('/templates/')) {
                const cleanPath = url.startsWith('/') ? url.slice(1) : url;
                return `url(${import.meta.env.BASE_URL}${cleanPath})`;
            }
            return `url(${url})`;
        };

        const getElementStyle = (prefix: string): React.CSSProperties => {
            if (!deckStyle) return {};
            const p = prefix as any; // Allow dynamic access
            return {
                backgroundColor: deckStyle[`${p}BackgroundColor` as keyof DeckStyle] as string,
                borderColor: deckStyle[`${p}BorderColor` as keyof DeckStyle] as string,
                borderStyle: (deckStyle[`${p}BorderStyle` as keyof DeckStyle] as any) || 'none',
                borderWidth: `${deckStyle[`${p}BorderWidth` as keyof DeckStyle] as number}px`,

                opacity: deckStyle[`${p}Opacity` as keyof DeckStyle] as number,
            };
        };

        const renderTransformable = (
            elementKey: 'corner' | 'reversedCorner' | 'title' | 'description' | 'art' | 'typeBar' | 'flavorText' | 'statsBox' | 'watermark' | 'rarityIcon' | 'collectorInfo' | 'cardBackTitle' | 'cardBackCopyright',
            content: React.ReactNode,
            config: {
                xKey: keyof DeckStyle,
                yKey: keyof DeckStyle,
                wKey: keyof DeckStyle,
                hKey?: keyof DeckStyle,
                rKey: keyof DeckStyle,
                sKey?: keyof DeckStyle,
                defaultW: number,
                defaultH?: number,
                defaultX: number,
                defaultY: number,
                lockAspect?: boolean,
                useScale?: boolean,
                zIndex?: number
            }
        ) => {
            if (!deckStyle) return content;

            const isSelected = selectedElement === elementKey;

            // Current Values with defaults from config or deckStyle generic defaults
            // We use 'as number' because DeckStyle defines them as numbers usually, but just in case
            const currentX = (deckStyle[config.xKey] as number) ?? config.defaultX;
            const currentY = (deckStyle[config.yKey] as number) ?? config.defaultY;
            const currentW = (deckStyle[config.wKey] as number) ?? config.defaultW;
            const currentH = config.hKey ? ((deckStyle[config.hKey] as number) ?? config.defaultH) : undefined;
            const currentR = (deckStyle[config.rKey] as number) ?? 0;
            const currentS = config.sKey ? (deckStyle[config.sKey] as number) ?? 1 : undefined;

            const zIndexStyle = config.zIndex !== undefined ? { zIndex: config.zIndex } : {};

            if (isInteractive) {
                return (
                    <TransformWrapper
                        isActive={isInteractive}
                        isSelected={isSelected}
                        values={{
                            x: currentX,
                            y: currentY,
                            width: currentW,
                            height: currentH,
                            rotate: currentR,
                            scale: currentS
                        }}
                        style={{ ...zIndexStyle }}
                        bounds={{ minX: -150, maxX: 150, minY: -210, maxY: 210 }}
                        disableDrag={editingElement === elementKey}
                        onSelect={() => {
                            onElementClick?.(elementKey);
                            onSelectElement?.(elementKey);
                        }}
                        onUpdate={(newVals) => {
                            const updates: Partial<DeckStyle> = {};
                            updates[config.xKey] = newVals.x as any;
                            updates[config.yKey] = newVals.y as any;
                            updates[config.wKey] = newVals.width as any;
                            if (config.hKey && newVals.height !== undefined) updates[config.hKey] = newVals.height as any;
                            updates[config.rKey] = newVals.rotate as any;
                            if (config.sKey && newVals.scale !== undefined) updates[config.sKey] = newVals.scale as any;

                            onElementUpdate?.(elementKey, updates);
                        }}
                        onDelete={() => {
                            // Handle show key generation for both simple and compound names
                            let showKey: string;
                            if (elementKey.startsWith('cardBack')) {
                                // For cardBackTitle -> showCardBackTitle
                                // For cardBackCopyright -> showCardBackCopyright
                                showKey = `show${elementKey.charAt(0).toUpperCase()}${elementKey.slice(1)}`;
                            } else {
                                // For simple names like 'title' -> 'showTitle'
                                showKey = `show${elementKey.charAt(0).toUpperCase()}${elementKey.slice(1)}`;
                            }
                            onElementUpdate?.(elementKey, { [showKey]: false } as any);
                        }}
                        lockAspectRatio={config.lockAspect}
                        useScaleForResize={config.useScale}
                    >
                        {content}
                    </TransformWrapper>
                );
            }

            // Non-interactive fallback (simpler rendering matching original layout)
            const transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) rotate(${currentR}deg)${currentS !== undefined ? ` scale(${currentS})` : ''}`;

            return (
                <div
                    onClick={(e) => { e.stopPropagation(); onElementClick?.(elementKey); }}
                    className={cn("absolute left-1/2 top-1/2", isSelected && "ring-2 ring-blue-500")}
                    style={{
                        width: `${currentW}px`,
                        height: currentH ? `${currentH}px` : 'auto',
                        ...zIndexStyle,
                        transform,
                        transformOrigin: '50% 50%', // Ensure consistent origin
                        transition: isInteractive ? 'none' : 'all 0.2s ease-out', // No transition while dragging
                    }}
                >
                    {content}
                </div>
            );
        };

        const backgroundStyle: React.CSSProperties = {
            border: '1px solid #000000',
            backgroundImage: resolveBgImage(deckStyle?.backgroundImage),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: deckStyle?.backgroundImage ? 'transparent' : 'white',
        };

        return (
            <div
                ref={ref}
                id={id}
                className={cn(
                    "relative perspective-1000", // Add perspective for 3D
                    className
                )}
                style={{
                    width: '300px',
                    height: '420px',
                    ...style // Layout styles stay on wrapper
                }}
            >
                <div
                    className={cn(
                        "relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]", // Flipper transform
                        isInteractive ? "" : "rounded-xl shadow-2xl" // specific shadow handling
                    )}
                    style={{
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        borderRadius: `${deckStyle?.cornerRadius ?? 12}px`,
                        boxShadow: isInteractive
                            ? 'none'
                            : `0 ${4 + (deckStyle?.shadowIntensity ?? 0) * 20}px ${10 + (deckStyle?.shadowIntensity ?? 0) * 40}px -${2 + (deckStyle?.shadowIntensity ?? 0) * 5}px rgba(0,0,0,${0.2 + (deckStyle?.shadowIntensity ?? 0) * 0.4})`,
                    }}
                >
                    {/* FRONT FACE */}
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onElementClick?.('background');
                        }}
                        className={cn(
                            "absolute inset-0 flex flex-col justify-between select-none [backface-visibility:hidden] overflow-hidden",
                            isInteractive ? "cursor-default" : "cursor-pointer print:shadow-none"
                        )}
                        style={{
                            borderRadius: `${deckStyle?.cornerRadius ?? 12}px`,
                            fontFamily: deckStyle?.globalFont || 'inherit',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            pointerEvents: isFlipped ? 'none' : 'auto',
                            // Frame Style Application
                            border: deckStyle?.svgStrokeWidth ? `${deckStyle.svgStrokeWidth}px solid ${deckStyle.svgFrameColor || 'transparent'}` : undefined,
                            ...(!isInteractive ? backgroundStyle : {}),
                            backgroundColor: deckStyle?.backgroundImage ? 'transparent' : 'white',
                        }}
                    >
                        {/* Render Texture Overlay here inside front face to not cover back */}
                        {deckStyle?.textureOverlay && deckStyle.textureOverlay !== 'none' && (
                            <div
                                className="absolute inset-0 z-[5] pointer-events-none rounded-[inherit]"
                                style={{
                                    opacity: deckStyle.textureOpacity ?? 0.5,
                                    mixBlendMode: 'overlay',
                                    backgroundImage: deckStyle.textureOverlay === 'noise'
                                        ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`
                                        : deckStyle.textureOverlay === 'paper'
                                            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.4' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
                                            : deckStyle.textureOverlay === 'foil'
                                                ? 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 100%)'
                                                : deckStyle.textureOverlay === 'grunge'
                                                    ? `radial-gradient(circle, transparent 50%, rgba(0,0,0,0.4) 100%)`
                                                    : 'none'
                                }}
                            />
                        )}

                        {/* Print Aids: Bleed & Safe Zone */}
                        {isInteractive && deckStyle?.showBleedLines && (
                            <div className="absolute -inset-[3mm] border border-red-500/50 pointer-events-none z-[50]">
                                <span className="absolute -top-4 left-0 text-[8px] text-red-500 bg-white px-1">Bleed</span>
                            </div>
                        )}
                        {isInteractive && deckStyle?.showSafeZone && (
                            <div className="absolute inset-[3mm] border border-dashed border-green-500/50 pointer-events-none z-[50]">
                                <span className="absolute top-0 left-0 text-[8px] text-green-500 bg-white px-1">Safe</span>
                            </div>
                        )}
                        {/* Interactive Mode: Separate Background Layer to allow handle overflow on parent */}
                        {isInteractive && (
                            <div
                                className="absolute inset-0 z-0 rounded-xl overflow-hidden shadow-2xl pointer-events-none"
                                style={backgroundStyle}
                            />
                        )}



                        {/* Watermark (Behind Content) */}
                        {deckStyle?.showWatermark && renderTransformable('watermark',
                            <div className="w-full h-full relative flex items-center justify-center">
                                {deckStyle?.watermarkUrl ? (
                                    <img
                                        src={deckStyle.watermarkUrl}
                                        className="w-full h-full object-contain pointer-events-none opacity-50" // Base opacity 50% for watermark feel
                                        style={{ opacity: deckStyle.watermarkOpacity ?? 0.3 }}
                                        alt="Watermark"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-300 rounded opacity-50">
                                        <span className="text-[10px] text-slate-400">WM</span>
                                    </div>
                                )}
                            </div>,
                            {
                                xKey: 'watermarkX', yKey: 'watermarkY', wKey: 'watermarkWidth', hKey: 'watermarkHeight', rKey: 'watermarkRotate',
                                defaultX: 0, defaultY: 0, defaultW: 100, defaultH: 100, zIndex: deckStyle?.watermarkZIndex ?? 5
                            }
                        )}

                        {/* Top Left Corner */}
                        {deckStyle?.showCorner !== false && renderTransformable('corner',
                            <div className="w-full h-full relative flex items-center justify-center">
                                <div
                                    className="absolute inset-0 rounded"
                                    style={getElementStyle('corner')}
                                />
                                <div className="relative z-10 w-full h-full flex items-center justify-center">
                                    {topLeftImage ? (
                                        <ResolvedImage src={topLeftImage} alt="Top Left" className="w-full h-full object-cover rounded" />
                                    ) : editingElement === 'corner' ? (
                                        <textarea
                                            value={topLeftContent ?? deckStyle?.cornerContent ?? ''}
                                            onChange={(e) => onContentChange?.('topLeftContent', e.target.value)}
                                            onBlur={() => setEditingElement(null)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onFocus={(e) => {
                                                const len = e.target.value.length;
                                                e.target.setSelectionRange(len, len);
                                            }}
                                            autoFocus
                                            className="w-full h-full bg-white/90 dark:bg-black/50 resize-none outline-none border-none p-1 text-center ring-2 ring-indigo-500 ring-offset-1 rounded"
                                            style={{
                                                color: deckStyle?.cornerColor || deckStyle?.svgCornerColor || '#000000',
                                                fontFamily: deckStyle?.cornerFont || 'serif',
                                                fontSize: `${deckStyle?.cornerFontSize || 24}px`,
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    ) : (
                                        <span
                                            className="font-bold leading-none cursor-text"
                                            style={{
                                                color: deckStyle?.cornerColor || deckStyle?.svgCornerColor || '#000000',
                                                fontFamily: deckStyle?.cornerFont || 'serif',
                                                fontSize: `${deckStyle?.cornerFontSize || 24}px`
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            onDoubleClick={(e) => { e.stopPropagation(); if (isInteractive) setEditingElement('corner'); }}
                                        >
                                            {(topLeftContent ?? deckStyle?.cornerContent) || (isInteractive ? <span className="opacity-50 italic text-sm">Edit</span> : 'A')}
                                        </span>
                                    )}
                                </div>
                            </div>,
                            {
                                xKey: 'cornerX', yKey: 'cornerY', wKey: 'cornerWidth', hKey: 'cornerHeight', rKey: 'cornerRotate',
                                defaultX: -125, defaultY: -185, defaultW: 40, defaultH: 40, zIndex: deckStyle?.cornerZIndex ?? 30
                            }
                        )}

                        {/* Title */}
                        {title !== undefined && deckStyle?.showTitle !== false && renderTransformable('title',
                            <div className="w-full h-full relative">
                                <div
                                    className="absolute inset-0 rounded shadow-sm overflow-hidden"
                                    style={getElementStyle('title')}
                                />
                                <div
                                    className="relative z-10 w-full h-full p-1 text-center font-bold text-sm flex items-center justify-center"
                                    style={{
                                        color: deckStyle?.titleColor || '#000000',
                                        fontFamily: deckStyle?.titleFont || 'sans-serif',
                                        fontSize: `${deckStyle?.titleFontSize || 14}px`
                                    }}
                                >
                                    {editingElement === 'title' ? (
                                        <textarea
                                            value={title ?? ''}
                                            onChange={(e) => onContentChange?.('title', e.target.value)}
                                            onBlur={() => setEditingElement(null)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onFocus={(e) => {
                                                const len = e.target.value.length;
                                                e.target.setSelectionRange(len, len);
                                            }}
                                            autoFocus
                                            className="w-full h-full bg-white/90 dark:bg-black/50 resize-none outline-none border-none p-1 text-center ring-2 ring-indigo-500 ring-offset-1 rounded"
                                            style={{
                                                color: deckStyle?.titleColor || '#000000',
                                                fontFamily: deckStyle?.titleFont || 'sans-serif',
                                                fontSize: `${deckStyle?.titleFontSize || 14}px`,
                                                fontWeight: 'bold',
                                                lineHeight: '1.2'
                                            }}
                                        />
                                    ) : (
                                        <span
                                            onClick={(e) => e.stopPropagation()}
                                            onDoubleClick={(e) => { e.stopPropagation(); if (isInteractive) setEditingElement('title'); }}
                                            className="cursor-text"
                                        >
                                            {title || (isInteractive ? <span className="opacity-50 italic">Double-click to edit</span> : '')}
                                        </span>
                                    )}
                                </div>
                            </div>,
                            {
                                xKey: 'titleX', yKey: 'titleY', wKey: 'titleWidth', rKey: 'titleRotate', sKey: 'titleScale',
                                defaultX: 0, defaultY: 0, defaultW: 200, useScale: false, zIndex: deckStyle?.titleZIndex ?? 20
                            }
                        )}

                        {/* Type Bar */}
                        {deckStyle?.showTypeBar && renderTransformable('typeBar',
                            <div className="w-full h-full relative">
                                <div
                                    className="absolute inset-0 rounded-sm shadow-sm"
                                    style={getElementStyle('typeBar')}
                                />
                                <div
                                    className="relative z-10 w-full h-full px-2 flex items-center justify-center font-bold text-xs uppercase tracking-wide"
                                    style={{
                                        color: deckStyle?.typeBarColor || '#000000',
                                        fontFamily: deckStyle?.typeBarFont || 'sans-serif',
                                        fontSize: `${deckStyle?.typeBarFontSize || 12}px`
                                    }}
                                >
                                    {editingElement === 'typeBar' ? (
                                        <textarea
                                            value={typeBarContent ?? deckStyle?.typeBarContent ?? ''}
                                            onChange={(e) => onContentChange?.('typeBarContent', e.target.value)}
                                            onBlur={() => setEditingElement(null)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onFocus={(e) => {
                                                const len = e.target.value.length;
                                                e.target.setSelectionRange(len, len);
                                            }}
                                            autoFocus
                                            className="w-full h-full bg-white/90 dark:bg-black/50 resize-none outline-none border-none p-1 text-center uppercase tracking-wide ring-2 ring-indigo-500 ring-offset-1 rounded"
                                            style={{
                                                color: deckStyle?.typeBarColor || '#000000',
                                                fontFamily: deckStyle?.typeBarFont || 'sans-serif',
                                                fontSize: `${deckStyle?.typeBarFontSize || 12}px`,
                                                fontWeight: 'bold',
                                                lineHeight: '1.2'
                                            }}
                                        />
                                    ) : (
                                        <span
                                            onClick={(e) => e.stopPropagation()}
                                            onDoubleClick={(e) => { e.stopPropagation(); if (isInteractive) setEditingElement('typeBar'); }}
                                            className="cursor-text"
                                        >
                                            {(typeBarContent ?? deckStyle?.typeBarContent) || (isInteractive ? <span className="opacity-50 italic normal-case">Double-click to edit</span> : 'Type - Subtype')}
                                        </span>
                                    )}
                                </div>
                            </div>,
                            {
                                xKey: 'typeBarX', yKey: 'typeBarY', wKey: 'typeBarWidth', rKey: 'typeBarRotate',
                                defaultX: 0, defaultY: -20, defaultW: 200, zIndex: deckStyle?.typeBarZIndex ?? 25
                            } as any
                        )}

                        {/* Art / Center Image Area */}
                        {deckStyle?.showArt !== false && renderTransformable('art',
                            <div className="w-full h-full relative">
                                <div
                                    className="absolute inset-0 rounded overflow-hidden"
                                    style={getElementStyle('art')}
                                />
                                <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden rounded">
                                    {centerImage ? (
                                        <ResolvedImage
                                            src={centerImage}
                                            alt="Card Center"
                                            className="max-w-full max-h-full object-contain pointer-events-none"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100/50 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400">
                                            <span className="text-sm">No Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>,
                            {
                                xKey: 'artX', yKey: 'artY', wKey: 'artWidth', hKey: 'artHeight', rKey: 'artRotate' as any,
                                defaultX: 0, defaultY: 0, defaultW: 264, defaultH: 164, zIndex: deckStyle?.artZIndex ?? 10
                            } as any
                        )}

                        {/* Description Area */}
                        {description && deckStyle?.showDescription !== false && renderTransformable('description',
                            <div className="w-full relative flex flex-col">
                                <div
                                    className="absolute inset-0 rounded-lg shadow-inner"
                                    style={getElementStyle('description')}
                                />
                                <div
                                    className="relative z-10 w-full rounded-lg p-2 text-xs overflow-hidden flex flex-col"
                                    style={{
                                        color: deckStyle?.descriptionColor || '#000000',
                                        fontFamily: deckStyle?.descriptionFont || 'sans-serif',
                                        fontSize: `${deckStyle?.descriptionFontSize || 12}px`,
                                        minHeight: '60px',
                                    }}
                                >
                                    {editingElement === 'description' ? (
                                        <div className="w-full h-full bg-background/40 backdrop-blur-[2px] rounded p-1 ring-1 ring-indigo-500/50" onKeyDown={(e) => e.stopPropagation()}>
                                            <RichTextEditor
                                                value={description ?? ''}
                                                onChange={(val) => onContentChange?.('description', val)}
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                    onClick={() => setEditingElement(null)}
                                                    className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded hover:bg-indigo-700 transition-colors shadow-sm"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            dangerouslySetInnerHTML={{ __html: description || (isInteractive ? '<span class="opacity-50 italic">Double-click to edit rules...</span>' : '') }}
                                            onDoubleClick={(e) => { e.stopPropagation(); if (isInteractive) setEditingElement('description'); }}
                                            className="cursor-text w-full h-full"
                                        />
                                    )}
                                </div>
                            </div>,
                            {
                                xKey: 'descriptionX', yKey: 'descriptionY', wKey: 'descriptionWidth', rKey: 'descriptionRotate', sKey: 'descriptionScale',
                                defaultX: 0, defaultY: 0, defaultW: 250, zIndex: deckStyle?.descriptionZIndex ?? 20
                            }
                        )}

                        {/* Flavor Text */}
                        {deckStyle?.showFlavorText && renderTransformable('flavorText',
                            <div className="w-full relative flex flex-col items-center justify-center text-center italic">
                                <div
                                    className="absolute inset-0"
                                    style={getElementStyle('flavorText')}
                                />
                                <p
                                    className="relative z-10 p-1 text-xs"
                                    style={{
                                        color: deckStyle?.flavorTextColor || '#000000',
                                        fontFamily: deckStyle?.flavorTextFont || 'serif',
                                        fontSize: `${deckStyle?.flavorTextFontSize || 12}px`
                                    }}
                                >
                                    {editingElement === 'flavorText' ? (
                                        <textarea
                                            value={flavorTextContent ?? deckStyle?.flavorTextContent ?? ''}
                                            onChange={(e) => onContentChange?.('flavorTextContent', e.target.value)}
                                            onBlur={() => setEditingElement(null)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onFocus={(e) => {
                                                const len = e.target.value.length;
                                                e.target.setSelectionRange(len, len);
                                            }}
                                            autoFocus
                                            className="w-full h-full bg-white/90 dark:bg-black/50 resize-none outline-none border-none p-1 text-center italic ring-2 ring-indigo-500 ring-offset-1 rounded"
                                            style={{
                                                color: deckStyle?.flavorTextColor || '#000000',
                                                fontFamily: deckStyle?.flavorTextFont || 'serif',
                                                fontSize: `${deckStyle?.flavorTextFontSize || 12}px`
                                            }}
                                        />
                                    ) : (
                                        <span
                                            onClick={(e) => e.stopPropagation()}
                                            onDoubleClick={(e) => { e.stopPropagation(); if (isInteractive) setEditingElement('flavorText'); }}
                                            className="cursor-text"
                                        >
                                            {(flavorTextContent ?? deckStyle?.flavorTextContent) || (isInteractive ? <span className="opacity-50">Double-click to edit</span> : 'Flavor text...')}
                                        </span>
                                    )}
                                </p>
                            </div>,
                            {
                                xKey: 'flavorTextX', yKey: 'flavorTextY', wKey: 'flavorTextWidth', rKey: 'flavorTextRotate',
                                defaultX: 0, defaultY: 100, defaultW: 220, zIndex: deckStyle?.flavorTextZIndex ?? 25
                            } as any
                        )}

                        {/* Stats Box */}
                        {deckStyle?.showStatsBox && renderTransformable('statsBox',
                            <div className="w-full h-full relative">
                                <div
                                    className="absolute inset-0 rounded border"
                                    style={getElementStyle('statsBox')}
                                />
                                <div
                                    className="relative z-10 w-full h-full flex items-center justify-center font-bold text-sm"
                                    style={{
                                        color: deckStyle?.statsBoxColor || '#000000',
                                        fontFamily: deckStyle?.statsBoxFont || 'sans-serif',
                                        fontSize: `${deckStyle?.statsBoxFontSize || 14}px`
                                    }}
                                >
                                    {editingElement === 'statsBox' ? (
                                        <textarea
                                            value={statsBoxContent ?? deckStyle?.statsBoxContent ?? ''}
                                            onChange={(e) => onContentChange?.('statsBoxContent', e.target.value)}
                                            onBlur={() => setEditingElement(null)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onFocus={(e) => {
                                                const len = e.target.value.length;
                                                e.target.setSelectionRange(len, len);
                                            }}
                                            autoFocus
                                            className="w-full h-full bg-white/90 dark:bg-black/50 resize-none outline-none border-none p-1 text-center ring-2 ring-indigo-500 ring-offset-1 rounded"
                                            style={{
                                                color: deckStyle?.statsBoxColor || '#000000',
                                                fontFamily: deckStyle?.statsBoxFont || 'sans-serif',
                                                fontSize: `${deckStyle?.statsBoxFontSize || 14}px`,
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    ) : (
                                        <span
                                            onClick={(e) => e.stopPropagation()}
                                            onDoubleClick={(e) => { e.stopPropagation(); if (isInteractive) setEditingElement('statsBox'); }}
                                            className="cursor-text"
                                        >
                                            {(statsBoxContent ?? deckStyle?.statsBoxContent) || (isInteractive ? <span className="opacity-50 italic font-normal">Edit</span> : '1 / 1')}
                                        </span>
                                    )}
                                </div>
                            </div>,
                            {
                                xKey: 'statsBoxX', yKey: 'statsBoxY', wKey: 'statsBoxWidth', hKey: 'statsBoxHeight', rKey: 'statsBoxRotate',
                                defaultX: 100, defaultY: 150, defaultW: 60, defaultH: 30, zIndex: deckStyle?.statsBoxZIndex ?? 35
                            }
                        )}

                        {/* Rarity Icon */}
                        {deckStyle?.showRarityIcon && renderTransformable('rarityIcon',
                            <div className="w-full h-full relative rounded-full overflow-hidden border border-black/20" style={{ backgroundColor: 'gold' }}>
                                {/* Placeholder or Image */}
                                <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-600"></div>
                            </div>,
                            {
                                xKey: 'rarityIconX', yKey: 'rarityIconY', wKey: 'rarityIconWidth', hKey: 'rarityIconHeight', rKey: 'rarityIconRotate',
                                defaultX: 110, defaultY: 0, defaultW: 20, defaultH: 20, zIndex: deckStyle?.rarityIconZIndex ?? 35
                            }
                        )}

                        {/* Collector Info */}
                        {deckStyle?.showCollectorInfo && renderTransformable('collectorInfo',
                            <div className="w-full relative text-[8px] flex justify-between px-1 opacity-70">
                                {editingElement === 'collectorInfo' ? (
                                    <textarea
                                        value={collectorInfoContent ?? deckStyle?.collectorInfoContent ?? ''}
                                        onChange={(e) => onContentChange?.('collectorInfoContent', e.target.value)}
                                        onBlur={() => setEditingElement(null)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        onFocus={(e) => {
                                            const len = e.target.value.length;
                                            e.target.setSelectionRange(len, len);
                                        }}
                                        autoFocus
                                        className="w-full h-full bg-white/90 dark:bg-black/50 resize-none outline-none border-none p-1 text-center ring-2 ring-indigo-500 ring-offset-1 rounded"
                                        style={{
                                            color: deckStyle?.collectorInfoColor,
                                            fontFamily: deckStyle?.collectorInfoFont,
                                            fontSize: `${deckStyle?.collectorInfoFontSize || 8}px`
                                        }}
                                    />
                                ) : (
                                    <span
                                        style={{ color: deckStyle?.collectorInfoColor, fontFamily: deckStyle?.collectorInfoFont, fontSize: `${deckStyle?.collectorInfoFontSize || 8}px` }}
                                        onClick={(e) => e.stopPropagation()}
                                        onDoubleClick={(e) => { e.stopPropagation(); if (isInteractive) setEditingElement('collectorInfo'); }}
                                        className="cursor-text"
                                    >
                                        {(collectorInfoContent ?? deckStyle?.collectorInfoContent) || (isInteractive ? <span className="opacity-50 italic">Double-click to edit</span> : 'Artist | 001/100')}
                                    </span>
                                )}
                            </div>,
                            {
                                xKey: 'collectorInfoX', yKey: 'collectorInfoY', wKey: 'collectorInfoWidth', rKey: 'collectorInfoRotate',
                                defaultX: 0, defaultY: 195, defaultW: 250, zIndex: deckStyle?.collectorInfoZIndex ?? 35
                            } as any
                        )}

                        {/* Bottom Right Corner */}
                        {deckStyle?.showReversedCorner !== false && renderTransformable('reversedCorner',
                            <div className="w-full h-full relative flex items-center justify-center">
                                <div
                                    className="absolute inset-0 rounded"
                                    style={getElementStyle('reversedCorner')}
                                />
                                <div className="relative z-10 w-full h-full flex items-center justify-center">
                                    {bottomRightImage ? (
                                        <ResolvedImage src={bottomRightImage} alt="Bottom Right" className="w-full h-full object-cover rounded" />
                                    ) : editingElement === 'reversedCorner' ? (
                                        <textarea
                                            value={bottomRightContent ?? deckStyle?.cornerContent ?? ''}
                                            onChange={(e) => onContentChange?.('bottomRightContent', e.target.value)}
                                            onBlur={() => setEditingElement(null)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onFocus={(e) => {
                                                const len = e.target.value.length;
                                                e.target.setSelectionRange(len, len);
                                            }}
                                            autoFocus
                                            className="w-full h-full bg-white/90 dark:bg-black/50 resize-none outline-none border-none p-1 text-center ring-2 ring-indigo-500 ring-offset-1 rounded"
                                            style={{
                                                color: deckStyle?.cornerColor || deckStyle?.svgCornerColor || '#000000',
                                                fontFamily: deckStyle?.cornerFont || 'serif',
                                                fontSize: `${deckStyle?.reversedCornerFontSize || 24}px`,
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    ) : (
                                        <span
                                            className="font-bold leading-none cursor-text"
                                            style={{
                                                color: deckStyle?.cornerColor || deckStyle?.svgCornerColor || '#000000',
                                                fontFamily: deckStyle?.cornerFont || 'serif',
                                                fontSize: `${deckStyle?.reversedCornerFontSize || 24}px`
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            onDoubleClick={(e) => { e.stopPropagation(); if (isInteractive) setEditingElement('reversedCorner'); }}
                                        >
                                            {(bottomRightContent ?? deckStyle?.cornerContent) || (isInteractive ? <span className="opacity-50 italic text-sm">Edit</span> : 'A')}
                                        </span>
                                    )}
                                </div>
                            </div>,
                            {
                                xKey: 'reversedCornerX', yKey: 'reversedCornerY', wKey: 'reversedCornerWidth', hKey: 'reversedCornerHeight', rKey: 'reversedCornerRotate',
                                defaultX: 125, defaultY: 185, defaultW: 40, defaultH: 40, zIndex: deckStyle?.reversedCornerZIndex ?? 30
                            }
                        )}
                    </div>

                    {/* BACK FACE */}
                    <div
                        className={cn(
                            "absolute inset-0 select-none [backface-visibility:hidden] [transform:rotateY(180deg)]",
                            isInteractive ? "cursor-default" : "cursor-pointer"
                        )}
                        style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            pointerEvents: isFlipped ? 'auto' : 'none',
                        }}
                    >
                        {/* Background Layer (with overflow-hidden for pattern) */}
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onElementClick?.('background');
                            }}
                            className="absolute inset-0 overflow-hidden"
                            style={{
                                borderRadius: `${deckStyle?.cornerRadius ?? 12}px`,
                                backgroundColor: deckStyle?.cardBackBackgroundColor || '#1e293b',
                            }}
                        >
                            {/* Pattern Overlay */}
                            {deckStyle?.cardBackImage && (
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        backgroundImage: resolveBgImage(deckStyle.cardBackImage),
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        mixBlendMode: 'overlay',
                                        opacity: 0.8
                                    }}
                                />
                            )}

                            {/* Safe Areas for Back (Optional, but good for consistency) */}
                            {deckStyle?.showSafeZone && (
                                <div className="absolute inset-[10%] border border-dashed border-white/20 rounded pointer-events-none z-50" />
                            )}
                            {deckStyle?.showBleedLines && (
                                <div className="absolute inset-[5%] border border-red-500/30 rounded pointer-events-none z-50" />
                            )}
                        </div>

                        {/* Elements Layer (overflow-visible so controls aren't clipped) */}
                        <div
                            className="absolute inset-0 overflow-visible pointer-events-none"
                            style={{
                                borderRadius: `${deckStyle?.cornerRadius ?? 12}px`,
                            }}
                        >
                            <div className="relative w-full h-full pointer-events-auto">
                                {/* Card Back Title */}
                                {deckStyle?.showCardBackTitle !== false && deckStyle?.cardBackTitleContent && renderTransformable('cardBackTitle',
                                    <div
                                        className="w-full text-center font-bold tracking-widest uppercase"
                                        style={{
                                            color: deckStyle.cardBackTitleColor || '#ffffff',
                                            fontFamily: deckStyle.cardBackTitleFont || 'serif',
                                            fontSize: `${deckStyle.cardBackTitleFontSize || 24}px`,
                                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                        }}
                                    >
                                        {deckStyle.cardBackTitleContent}
                                    </div>,
                                    {
                                        xKey: 'cardBackTitleX', yKey: 'cardBackTitleY',
                                        wKey: 'cardBackTitleWidth', rKey: 'cardBackTitleRotate',
                                        sKey: 'cardBackTitleScale',
                                        defaultX: 0, defaultY: -60, defaultW: 250,
                                        zIndex: deckStyle?.cardBackTitleZIndex ?? 30,
                                        useScale: true
                                    } as any
                                )}

                                {/* Copyright Element */}
                                {deckStyle?.showCardBackCopyright && renderTransformable('cardBackCopyright',
                                    <div
                                        className="w-full text-center opacity-80"
                                        style={{
                                            color: deckStyle.cardBackCopyrightColor || '#ffffff',
                                            fontFamily: deckStyle.cardBackCopyrightFont || 'sans-serif',
                                            fontSize: `${deckStyle.cardBackCopyrightFontSize || 10}px`
                                        }}
                                    >
                                        {deckStyle.cardBackCopyrightContent || '© 2024'}
                                    </div>,
                                    {
                                        xKey: 'cardBackCopyrightX', yKey: 'cardBackCopyrightY',
                                        wKey: 'cardBackCopyrightWidth', rKey: 'cardBackCopyrightRotate',
                                        sKey: 'cardBackCopyrightScale',
                                        defaultX: 0, defaultY: 60, defaultW: 200,
                                        zIndex: deckStyle?.cardBackCopyrightZIndex ?? 30,
                                        useScale: true
                                    } as any
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        );
    }
);
