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
    onElementClick?: (element: 'background' | 'corner' | 'title' | 'art' | 'description' | 'reversedCorner') => void;
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
            elementKey: 'corner' | 'reversedCorner' | 'title' | 'description' | 'art',
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
                {title && renderTransformable('title',
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

                {/* Art / Center Image Area */}
                {renderTransformable('art',
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
                {description && renderTransformable('description',
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
