import React from 'react';
import { cn } from '../utils/cn';

interface CardProps {
    borderColor?: string;
    borderWidth?: number;
    topLeftContent?: string;
    bottomRightContent?: string;
    centerImage?: string | null;
    title?: string;
    description?: string;
    className?: string;
    style?: React.CSSProperties;
    id?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        {
            borderColor = '#000000',
            borderWidth = 5,
            topLeftContent = 'A',
            bottomRightContent = 'A',
            centerImage,
            title,
            description,
            className,
            style,
            id
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                id={id}
                className={cn(
                    "relative bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none flex flex-col justify-between select-none",
                    className
                )}
                style={{
                    width: '300px',
                    height: '420px', // 2.5 x 3.5 aspect ratio (300/420 = 0.714, 2.5/3.5 = 0.714)
                    border: `${borderWidth}px solid ${borderColor}`,
                    ...style
                }}
            >
                {/* Top Left */}
                <div className="absolute top-2 left-2 flex flex-col items-center">
                    <span className="text-2xl font-bold font-serif leading-none">{topLeftContent}</span>
                </div>

                {/* Center Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden gap-2">
                    {title && (
                        <div className="w-full bg-slate-100 border border-slate-300 p-1 text-center font-bold text-sm rounded shadow-sm">
                            {title}
                        </div>
                    )}

                    <div className="flex-1 w-full flex items-center justify-center overflow-hidden min-h-0">
                        {centerImage ? (
                            <img
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
                            className="w-full bg-slate-50 border border-slate-200 p-1 text-center text-xs rounded prose prose-xs max-w-none"
                            dangerouslySetInnerHTML={{ __html: description }}
                        />
                    )}
                </div>

                {/* Bottom Right */}
                <div className="absolute bottom-2 right-2 flex flex-col items-center rotate-180">
                    <span className="text-2xl font-bold font-serif leading-none">{bottomRightContent}</span>
                </div>
            </div>
        );
    }
);
