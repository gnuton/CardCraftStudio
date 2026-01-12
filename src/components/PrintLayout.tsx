import React from 'react';
import { Card } from './Card';

interface PrintLayoutProps {
    config: {
        borderColor: string;
        borderWidth: number;
        topLeftContent: string;
        bottomRightContent: string;
        centerImage: string | null;
        title: string;
        description: string;
    };
}

export const PrintLayout = React.forwardRef<HTMLDivElement, PrintLayoutProps>(({ config }, ref) => {
    return (
        <div
            style={{
                position: 'fixed',
                top: -9999,
                left: -9999,
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                pointerEvents: 'none'
            }}
        >
            <div
                ref={ref}
                style={{
                    width: '210mm',
                    height: '297mm',
                    backgroundColor: 'white',
                    padding: '8mm', // 210 - 190.5 = 19.5mm total margin available. 8mm * 2 = 16mm. Leaves 3.5mm slack.
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center', // Center nicely in the width
                    alignContent: 'start',
                    boxSizing: 'border-box'
                }}
            >
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 63.5mm)',
                    gridTemplateRows: 'repeat(3, 88.9mm)',
                    gap: '1mm', // Very small gap to fit. 1mm * 2 = 2mm total width gap. 190.5 + 2 = 192.5. 16mm padding + 192.5 = 208.5 < 210. Fits.
                }}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-center bg-white">
                            <Card
                                {...config}
                                style={{
                                    width: '63.5mm',
                                    height: '88.9mm',
                                    borderWidth: `${config.borderWidth}px`,
                                    fontSize: '10px'
                                }}
                                className="shadow-none rounded-md"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});
