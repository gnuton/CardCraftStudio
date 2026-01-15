import React from 'react';
import { cn } from '../utils/cn';
import type { DeckStyle } from '../App';
import { ResolvedImage } from './ResolvedImage';

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
            deckStyle
        },
        ref
    ) => {
        const resolveBgImage = (url: string | null | undefined) => {
            if (!url) return undefined;
            // If it's a relative path to a template, ensure it uses the base URL
            if (url.startsWith('templates/') || url.startsWith('/templates/')) {
                const cleanPath = url.startsWith('/') ? url.slice(1) : url;
                return `url(${import.meta.env.BASE_URL}${cleanPath})`;
            }
            return `url(${url})`;
        };

        return (
            <div
                ref={ref}
                id={id}
                className={cn(
                    "relative rounded-xl shadow-2xl overflow-hidden print:shadow-none flex flex-col justify-between select-none",
                    className
                )}
                style={{
                    width: '300px',
                    height: '420px',
                    border: '1px solid #000000',
                    backgroundImage: resolveBgImage(deckStyle?.backgroundImage),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: deckStyle?.backgroundImage ? 'transparent' : 'white',
                    ...style
                }}
            >
                {/* Top Left */}
                <div className="absolute top-2 left-2 flex flex-col items-center">
                    {topLeftImage ? (
                        <ResolvedImage src={topLeftImage} alt="Top Left" className="w-12 h-12 object-cover rounded" />
                    ) : (
                        <span
                            className="text-2xl font-bold leading-none"
                            style={{
                                color: deckStyle?.cornerColor || '#000000',
                                fontFamily: deckStyle?.cornerFont || 'serif'
                            }}
                        >
                            {topLeftContent || deckStyle?.cornerContent || 'A'}
                        </span>
                    )}
                </div>

                {/* Title */}
                {title && (
                    <div
                        className="absolute left-1/2 top-1/2 bg-slate-100/90 backdrop-blur-sm border border-slate-300 p-1 text-center font-bold text-sm rounded shadow-sm z-20 overflow-hidden"
                        style={{
                            color: deckStyle?.titleColor || '#000000',
                            fontFamily: deckStyle?.titleFont || 'sans-serif',
                            width: deckStyle?.titleWidth ? `${deckStyle.titleWidth}px` : '200px',
                            transform: `translate(calc(-50% + ${deckStyle?.titleX || 0}px), calc(-50% + ${deckStyle?.titleY || 0}px)) rotate(${deckStyle?.titleRotate || 0}deg) scale(${deckStyle?.titleScale || 1})`,
                            transition: 'all 0.2s ease-out'
                        }}
                    >
                        {title}
                    </div>
                )}

                {/* Art / Center Image Area */}
                <div
                    className="absolute left-1/2 top-1/2 flex items-center justify-center overflow-hidden z-10"
                    style={{
                        width: deckStyle?.artWidth ? `${deckStyle.artWidth}px` : '264px',
                        height: deckStyle?.artHeight ? `${deckStyle.artHeight}px` : '164px',
                        transform: `translate(calc(-50% + ${deckStyle?.artX || 0}px), calc(-50% + ${deckStyle?.artY || 0}px))`,
                        transition: 'all 0.2s ease-out'
                    }}
                >
                    {centerImage ? (
                        <ResolvedImage
                            src={centerImage}
                            alt="Card Center"
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-100/50 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400">
                            <span className="text-sm">No Image</span>
                        </div>
                    )}
                </div>

                {/* Description Area */}
                {description && (
                    <div
                        className="absolute left-1/2 top-1/2 bg-white/10 backdrop-blur-[2px] rounded-lg p-2 text-xs overflow-hidden z-20 shadow-inner border border-white/20"
                        style={{
                            color: deckStyle?.descriptionColor || '#000000',
                            fontFamily: deckStyle?.descriptionFont || 'sans-serif',
                            width: deckStyle?.descriptionWidth ? `${deckStyle.descriptionWidth}px` : '250px',
                            transform: `translate(calc(-50% + ${deckStyle?.descriptionX || 0}px), calc(-50% + ${deckStyle?.descriptionY || 0}px)) rotate(${deckStyle?.descriptionRotate || 0}deg) scale(${deckStyle?.descriptionScale || 1})`,
                            transition: 'all 0.2s ease-out',
                            minHeight: '60px'
                        }}
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                )}

                {/* Bottom Right */}
                <div className="absolute bottom-2 right-2 flex flex-col items-center rotate-180">
                    {bottomRightImage ? (
                        <ResolvedImage src={bottomRightImage} alt="Bottom Right" className="w-12 h-12 object-cover rounded" />
                    ) : (
                        <span
                            className="text-2xl font-bold leading-none"
                            style={{
                                color: deckStyle?.cornerColor || '#000000',
                                fontFamily: deckStyle?.cornerFont || 'serif'
                            }}
                        >
                            {bottomRightContent || deckStyle?.cornerContent || 'A'}
                        </span>
                    )}
                </div>
            </div>
        );
    }
);
