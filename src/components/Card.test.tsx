import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './Card';
import type { DeckStyle } from '../App';


// Mock dependencies
vi.mock('./ResolvedImage', () => ({
    ResolvedImage: ({ src, className }: any) => <img src={src} className={className} alt="mock" />
}));

vi.mock('./TransformWrapper', () => ({
    TransformWrapper: ({ children, bounds }: any) => (
        <div data-testid="transform-wrapper" data-bounds={JSON.stringify(bounds)}>
            {children}
        </div>
    )
}));

describe('Card Component', () => {
    const mockStyle: DeckStyle = {
        // Basic defaults
        showCorner: true,
        showReversedCorner: true,
        showTitle: true,
        showDescription: true,
        showArt: true,

        // Title Styles
        titleColor: '#000000',
        titleFont: 'sans-serif',
        titleX: 0, titleY: 0, titleWidth: 200, titleRotate: 0, titleScale: 1,
        titleOpacity: 0.5, // 50% opacity
        titleBackgroundColor: '#ff0000', // Red background

        // Description Styles
        descriptionColor: '#000000',
        descriptionFont: 'sans-serif',
        descriptionX: 0, descriptionY: 0, descriptionWidth: 200, descriptionRotate: 0, descriptionScale: 1,

        // Art Styles
        artX: 0, artY: 0, artWidth: 200, artHeight: 200, artRotate: 0,

        // Corner Styles
        cornerColor: '#000000',
        cornerFont: 'serif',
        cornerX: 0, cornerY: 0, cornerWidth: 40, cornerHeight: 40, cornerRotate: 0,
        cornerOpacity: 0.8,

        // Reversed Corner
        reversedCornerX: 0, reversedCornerY: 0, reversedCornerWidth: 40, reversedCornerHeight: 40, reversedCornerRotate: 0,
    } as any;

    it('renders title with separate background and content layers', () => {
        render(
            <Card
                title="Test Title"
                deckStyle={mockStyle}
                isInteractive={true}
            />
        );

        // Find the title content (now wrapped in a span for in-place editing)
        const titleSpan = screen.getByText('Test Title');
        expect(titleSpan).toBeInTheDocument();
        expect(titleSpan).toHaveClass('cursor-text'); // In-place editing class

        // Verify Content Layer (the parent div should be relative, z-10)
        const contentDiv = titleSpan.parentElement;
        expect(contentDiv).toHaveClass('relative');
        expect(contentDiv).toHaveClass('z-10');

        // Verify Parent Wrapper contains the Background Layer
        const wrapper = contentDiv?.parentElement;
        expect(wrapper).toHaveClass('relative');

        // Find Background Layer (absolute, inset-0) in the same wrapper
        // It's a sibling of titleContent, and an empty div usually
        // We can find it by style or class. It should have the background color and opacity.
        // Since we can't easily query by style with standard queries, we iterate children.
        const children = Array.from(wrapper?.children || []);
        const bgLayer = children.find(child =>
            child !== contentDiv &&
            child.tagName === 'DIV' &&
            child.classList.contains('absolute') &&
            child.classList.contains('inset-0')
        );

        expect(bgLayer).toBeDefined();
        // Check styles
        const computedStyle = (bgLayer as HTMLElement).style;
        expect(computedStyle.opacity).toBe('0.5');
        // RGB conversion might happen, but usually literal style prop is preserved in jsdom
        expect(computedStyle.backgroundColor).toBe('#ff0000'); // Hex value preserved in JSDOM style prop
    });

    it('renders corners with correct values', () => {
        render(
            <Card
                topLeftContent="X"
                deckStyle={mockStyle}
                isInteractive={true}
            />
        );

        expect(screen.getByText('X')).toBeInTheDocument();
    });

    it('passes strict boundary constraints to transform wrapper', () => {
        render(
            <Card
                title="Bound Test"
                deckStyle={mockStyle}
                isInteractive={true}
                selectedElement="title"
            />
        );

        const wrappers = screen.getAllByTestId('transform-wrapper');
        const titleWrapper = wrappers.find(w => w.textContent?.includes('Bound Test'));

        expect(titleWrapper).toBeDefined();
        // Check strict bounds: [-150, 150] x [-210, 210]
        const boundsData = JSON.parse(titleWrapper?.getAttribute('data-bounds') || '{}');
        expect(boundsData).toEqual({
            minX: -150,
            maxX: 150,
            minY: -210,
            maxY: 210
        });
    });
});
