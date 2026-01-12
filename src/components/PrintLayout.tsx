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

// 9 cards on A4
// A4 is 210mm x 297mm
// Poker card is 63.5mm x 88.9mm (2.5 x 3.5 inches)
// 3 columns: 63.5 * 3 = 190.5mm (leaving ~19.5mm width margin, ~9.75mm per side)
// 3 rows: 88.9 * 3 = 266.7mm (leaving ~30.3mm height margin, ~15mm top/bottom)

export const PrintLayout = React.forwardRef<HTMLDivElement, PrintLayoutProps>(({ config }, ref) => {
    return (
        <div
            style={{
                position: 'fixed',
                top: -9999,
                left: -9999,
                width: '210mm',
                minHeight: '297mm',
                backgroundColor: 'white',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignContent: 'center',
                padding: '10mm',
                gap: '2mm'
            }}
        >
            <div ref={ref} className="grid grid-cols-3 gap-2 p-4 bg-white" style={{ width: '210mm', height: '297mm' }}>
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-center">
                        <Card
                            {...config}
                            // Override dimensions for print
                            style={{
                                width: '63.5mm',
                                height: '88.9mm',
                                borderWidth: `${config.borderWidth}px`, // Keep pixel width or scale? pixels usually fine for screen->pdf
                                fontSize: '10px' // scale down text slightly?
                            }}
                            className="shadow-none rounded-lg" // smaller radius for print
                        />
                    </div>
                ))}
            </div>
        </div>
    );
});
