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
                    backgroundImage: deckStyle?.backgroundImage ? `url(${deckStyle.backgroundImage})` : undefined,
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

                {/* Center Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden gap-2">
                    {title && (
                        <div
                            className="bg-slate-100 border border-slate-300 p-1 text-center font-bold text-sm rounded shadow-sm relative z-10"
                            style={{
                                color: deckStyle?.titleColor || '#000000',
                                fontFamily: deckStyle?.titleFont || 'sans-serif',
                                width: deckStyle?.titleWidth ? `${deckStyle.titleWidth}px` : '100%',
                                transform: `translate(${deckStyle?.titleX || 0}px, ${deckStyle?.titleY || 0}px) rotate(${deckStyle?.titleRotate || 0}deg) scale(${deckStyle?.titleScale || 1})`,
                                transition: 'all 0.2s ease-out'
                            }}
                        >
                            {title}
                        </div>
                    )}

                    <div className="flex-1 w-full flex items-center justify-center overflow-hidden min-h-0">
                        {centerImage ? (
                            <ResolvedImage
                                src={centerImage}
                                alt="Card Center"
                                className="max-w-full max-h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-100 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400">
                                <span className="text-sm">No Image</span>
                            </div>
                        )}
                    </div>

                    {description && (
                        <div
                            className="bg-slate-50 border border-slate-200 p-1 text-center text-xs rounded prose prose-xs max-w-none relative z-10"
                            style={{
                                color: deckStyle?.descriptionColor || '#000000',
                                fontFamily: deckStyle?.descriptionFont || 'sans-serif',
                                width: deckStyle?.descriptionWidth ? `${deckStyle.descriptionWidth}px` : '100%',
                                transform: `translate(${deckStyle?.descriptionX || 0}px, ${deckStyle?.descriptionY || 0}px) rotate(${deckStyle?.descriptionRotate || 0}deg) scale(${deckStyle?.descriptionScale || 1})`,
                                transition: 'all 0.2s ease-out'
                            }}
                            dangerouslySetInnerHTML={{ __html: description }}
                        />
                    )}
                </div>

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
