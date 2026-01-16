import React from 'react';
import { cn } from '../utils/cn';
import type { DeckStyle } from '../App';
import { ResolvedImage } from './ResolvedImage';
import { TransformWrapper } from './TransformWrapper';

interface CardProps {
    topLeftContent?: string;
    bottomRightContent?: string;
    topLeftImage?: string | null;
    bottomRightImage?: string | null;
    centerImage?: string | null;
    title?: string;
    description?: string;
    className?: string;
    style?: React.CSSProperties;
    id?: string;
    deckStyle?: DeckStyle;
    onElementClick?: (element: 'background' | 'corner' | 'title' | 'art' | 'description' | 'reversedCorner' | 'typeBar' | 'flavorText' | 'statsBox' | 'watermark' | 'rarityIcon' | 'collectorInfo') => void;
    // New interactive props
    isInteractive?: boolean;
    selectedElement?: string | null;
    onElementUpdate?: (element: string, updates: Partial<DeckStyle>) => void;
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
            className,
            style,
            id,
            deckStyle,
            onElementClick,
            isInteractive = false,
            selectedElement,
            onElementUpdate
        },
        ref
    ) => {
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
            elementKey: 'corner' | 'reversedCorner' | 'title' | 'description' | 'art' | 'typeBar' | 'flavorText' | 'statsBox' | 'watermark' | 'rarityIcon' | 'collectorInfo',
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
                        onSelect={() => onElementClick?.(elementKey)}
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
                            const showKey = `show${elementKey.charAt(0).toUpperCase()}${elementKey.slice(1)}`;
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
                onClick={() => onElementClick?.('background')}
                className={cn(
                    "relative flex flex-col justify-between select-none",
                    isInteractive ? "cursor-default overflow-visible" : "cursor-pointer overflow-hidden rounded-xl shadow-2xl print:shadow-none",
                    className
                )}
                style={{
                    width: '300px',
                    height: '420px',
                    ...(!isInteractive ? backgroundStyle : {}),
                    ...style
                }}
            >
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
                            ) : (
                                <span
                                    className="text-2xl font-bold leading-none pointer-events-none"
                                    style={{
                                        color: deckStyle?.cornerColor || '#000000',
                                        fontFamily: deckStyle?.cornerFont || 'serif'
                                    }}
                                >
                                    {topLeftContent || deckStyle?.cornerContent || 'A'}
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
                {title && deckStyle?.showTitle !== false && renderTransformable('title',
                    <div className="w-full h-full relative">
                        <div
                            className="absolute inset-0 rounded shadow-sm overflow-hidden"
                            style={getElementStyle('title')}
                        />
                        <div
                            className="relative z-10 w-full h-full p-1 text-center font-bold text-sm flex items-center justify-center"
                            style={{
                                color: deckStyle?.titleColor || '#000000',
                                fontFamily: deckStyle?.titleFont || 'sans-serif'
                            }}
                        >
                            {title}
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
                                fontFamily: deckStyle?.typeBarFont || 'sans-serif'
                            }}
                        >
                            {deckStyle?.typeBarContent || 'Type - Subtype'}
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
                                minHeight: '60px',
                            }}
                            dangerouslySetInnerHTML={{ __html: description }}
                        />
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
                                fontFamily: deckStyle?.flavorTextFont || 'serif'
                            }}
                        >
                            {deckStyle?.flavorTextContent || 'Flavor text...'}
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
                                fontFamily: deckStyle?.statsBoxFont || 'sans-serif'
                            }}
                        >
                            {deckStyle?.statsBoxContent || '1 / 1'}
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
                        <span style={{ color: deckStyle?.collectorInfoColor, fontFamily: deckStyle?.collectorInfoFont }}>
                            {deckStyle?.collectorInfoContent || 'Artist | 001/100'}
                        </span>
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
                            ) : (
                                <div className="text-2xl font-bold leading-none pointer-events-none"
                                    style={{
                                        color: deckStyle?.cornerColor || '#000000',
                                        fontFamily: deckStyle?.cornerFont || 'serif'
                                    }}
                                >
                                    {bottomRightContent || deckStyle?.cornerContent || 'A'}
                                </div>
                            )}
                        </div>
                    </div>,
                    {
                        xKey: 'reversedCornerX', yKey: 'reversedCornerY', wKey: 'reversedCornerWidth', hKey: 'reversedCornerHeight', rKey: 'reversedCornerRotate',
                        defaultX: 125, defaultY: 185, defaultW: 40, defaultH: 40, zIndex: deckStyle?.reversedCornerZIndex ?? 30
                    }
                )}
            </div>
        );
    }
);
