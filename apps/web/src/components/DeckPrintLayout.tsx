import React from 'react';
import { Card } from './Card';
import type { CardConfig } from './CardStudio';
import type { DeckStyle } from '../types/deck';

interface DeckPrintLayoutProps {
    pages: CardConfig[][];
    deckStyle: DeckStyle;
}

export const DeckPrintLayout = React.forwardRef<HTMLDivElement, DeckPrintLayoutProps>(({ pages, deckStyle }, ref) => {
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
            <div ref={ref}>
                {pages.map((pageCards, pageIndex) => (
                    <React.Fragment key={pageIndex}>
                        {/* Front Page */}
                        <div
                            className="print-page"
                            style={{
                                width: '210mm',
                                height: '297mm',
                                backgroundColor: 'white',
                                position: 'relative',
                                pageBreakAfter: 'always',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 63.5mm)',
                                gridTemplateRows: 'repeat(3, 88.9mm)',
                                position: 'absolute',
                                top: '15mm',
                                left: '9.75mm',
                            }}>
                                {/* Cut Lines Layer - Behind Cards */}
                                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                                    {/* Horizontal Cut Lines */}
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={`h-${i}`} style={{
                                            position: 'absolute',
                                            top: `${i * 88.9}mm`,
                                            left: '-5mm',
                                            right: '-5mm',
                                            height: '1px',
                                            borderTop: '1px dashed #ccc'
                                        }} />
                                    ))}
                                    {/* Vertical Cut Lines */}
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={`v-${i}`} style={{
                                            position: 'absolute',
                                            left: `${i * 63.5}mm`,
                                            top: '-5mm',
                                            bottom: '-5mm',
                                            width: '1px',
                                            borderLeft: '1px dashed #ccc'
                                        }} />
                                    ))}
                                </div>

                                {/* Cards Layer */}
                                {pageCards.map((card, i) => (
                                    <div key={i} className="relative z-10 overflow-hidden" style={{ width: '63.5mm', height: '88.9mm' }}>
                                        <div style={{
                                            transform: 'scale(0.64)',
                                            transformOrigin: 'top left',
                                            width: '375px',
                                            height: '525px'
                                        }}>
                                            <Card
                                                {...card}
                                                deckStyle={deckStyle}
                                                renderMode="front"
                                                className="shadow-none rounded-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Back Page */}
                        <div
                            className="print-page"
                            style={{
                                width: '210mm',
                                height: '297mm',
                                backgroundColor: 'white',
                                position: 'relative',
                                pageBreakAfter: 'always',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 63.5mm)',
                                gridTemplateRows: 'repeat(3, 88.9mm)',
                                position: 'absolute',
                                top: '15mm',
                                left: '9.75mm',
                            }}>
                                {/* Cut Lines Layer - Behind Cards */}
                                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                                    {/* Horizontal Cut Lines */}
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={`h-${i}`} style={{
                                            position: 'absolute',
                                            top: `${i * 88.9}mm`,
                                            left: '-5mm',
                                            right: '-5mm',
                                            height: '1px',
                                            borderTop: '1px dashed #ccc'
                                        }} />
                                    ))}
                                    {/* Vertical Cut Lines */}
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={`v-${i}`} style={{
                                            position: 'absolute',
                                            left: `${i * 63.5}mm`,
                                            top: '-5mm',
                                            bottom: '-5mm',
                                            width: '1px',
                                            borderLeft: '1px dashed #ccc'
                                        }} />
                                    ))}
                                </div>

                                {/* Cards Layer - Backs */}
                                {pageCards.map((card, i) => (
                                    <div key={i} className="relative z-10 overflow-hidden" style={{ width: '63.5mm', height: '88.9mm' }}>
                                        <div style={{
                                            transform: 'scale(0.64)',
                                            transformOrigin: 'top left',
                                            width: '375px',
                                            height: '525px'
                                        }}>
                                            <Card
                                                {...card}
                                                deckStyle={deckStyle}
                                                renderMode="back"
                                                className="shadow-none rounded-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
});
