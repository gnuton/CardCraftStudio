
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './Card';
import { GlobalStyleEditor } from './GlobalStyleEditor';
import type { DeckStyle } from '../types/deck';

// Mock TransformWrapper to verify drag bounds
// We use a different name for the mock to avoid hoisting issues if we were reusing it,
// but for this file it's fine.
vi.mock('./TransformWrapper', () => ({
    TransformWrapper: ({ children, bounds }: any) => (
        <div data-testid="transform-wrapper" data-bounds={JSON.stringify(bounds)}>
            {children}
        </div>
    )
}));

// Mock other components to avoid rendering issues
vi.mock('./ResolvedImage', () => ({
    ResolvedImage: () => <img alt="mock" />
}));

describe('Element Constraints Enforcement', () => {

    // Test 1: Drag Limits
    it('Card enforces strict drag boundaries matching card dimensions (375x525)', () => {
        const mockDeckStyle: DeckStyle = {
            borderColor: '#000000',
            borderWidth: 12,
            backgroundColor: '#ffffff',
            backgroundImage: null,
            elements: [
                {
                    id: 'test-el',
                    type: 'text',
                    side: 'front',
                    name: 'Test Element',
                    x: 0, y: 0, width: 100, height: 100,
                    rotate: 0, scale: 1, zIndex: 1, opacity: 1,
                    defaultContent: 'Test'
                }
            ]
        } as any;

        render(
            <Card
                data={{ 'test-el': 'Content' }}
                deckStyle={mockDeckStyle}
                isInteractive={true}
            />
        );

        const wrappers = screen.getAllByTestId('transform-wrapper');
        const wrapper = wrappers[0];
        const boundsAttr = wrapper.getAttribute('data-bounds');
        const bounds = JSON.parse(boundsAttr || '{}');

        // Card size is 375x525. Center is (0,0).
        // Max bounds are half width/height minus margin (20px) to keep element inside card
        // 375 / 2 = 187.5, minus 20 = 167.5
        // 525 / 2 = 262.5, minus 20 = 242.5
        expect(bounds.minX).toBe(-167.5);
        expect(bounds.maxX).toBe(167.5);
        expect(bounds.minY).toBe(-242.5);
        expect(bounds.maxY).toBe(242.5);
    });

    // Test 2: Removal of Inverted Corner
    it('GlobalStyleEditor does not expose "Inverted Corner" functionality', () => {
        const mockDeckStyle: DeckStyle = {
            elements: [
                { id: 'title', type: 'text', side: 'front', name: 'Title', x: 0, y: 0, width: 100, height: 10, rotate: 0, scale: 1, zIndex: 1, opacity: 1 }
            ]
        } as any;

        render(
            <GlobalStyleEditor
                deckStyle={mockDeckStyle}
                sampleCard={{ data: {} } as any}
                onUpdateStyle={() => { }}
                onBack={() => { }}
            />
        );

        // Check that "Inverted Corner" text (which was the name of the element) is NOT in the document
        // We check queryByText which returns null if not found
        expect(screen.queryByText(/Inverted Corner/i)).not.toBeInTheDocument();

        // Also check that we don't accidentally have the ID lurking in some data attribute or list
        // (Though typically we'd see the Name "Inverted Corner" in the element list)
        expect(screen.queryByText('reversedCorner')).not.toBeInTheDocument();
    });
});
