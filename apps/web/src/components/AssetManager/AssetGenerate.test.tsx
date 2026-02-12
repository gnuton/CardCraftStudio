// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AssetGenerate } from './AssetGenerate';
import { vi, describe, it, expect, afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock dependencies
vi.mock('../../services/imageProviderService', () => ({
    imageProviderService: {
        generateImage: vi.fn().mockResolvedValue({ imageBase64: 'test-image', prompt: 'test-final-prompt' }),
    },
}));

vi.mock('../common/PremiumGate', () => ({
    PremiumGate: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('AssetGenerate', () => {
    const defaultProps = {
        onAssetGenerated: vi.fn(),
        category: 'front-background' as const,
    };

    it('renders correctly', () => {
        render(<AssetGenerate {...defaultProps} />);
        expect(screen.getByText('AI Image Generator')).toBeDefined();
    });

    it('starts with empty prompt', () => {
        render(<AssetGenerate {...defaultProps} />);

        const textarea = screen.getByPlaceholderText(/Describe your image/i) as HTMLTextAreaElement;
        expect(textarea.value).toBe('');
    });

    it('preserves user input when switching categories', () => {
        const { rerender } = render(<AssetGenerate {...defaultProps} />);

        const textarea = screen.getByPlaceholderText(/Describe your image/i) as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: 'My custom prompt' } });

        rerender(<AssetGenerate {...defaultProps} category="icon" />);

        expect(textarea.value).toBe('My custom prompt');
    });

    it('renders wireframe preview for background categories', () => {
        const elements = [
            { id: '1', type: 'text', side: 'front', x: 10, y: 10, width: 100, height: 50, isVisible: true }
        ] as any[];

        const { rerender } = render(
            <AssetGenerate
                {...defaultProps}
                category="front-background"
                cardElements={elements}
                cardWidth={375}
                cardHeight={525}
            />
        );

        expect(screen.getByText('Layout Preview (Coordinates will be sent to AI)')).toBeDefined();
        expect(screen.getByText('text')).toBeDefined();

        // Should not show for icon
        rerender(
            <AssetGenerate
                {...defaultProps}
                category="icon"
                cardElements={elements}
            />
        );
        expect(screen.queryByText('Layout Preview (Coordinates will be sent to AI)')).toBeNull();
    });

    it('sends layout data to API for background categories', async () => {
        const { imageProviderService } = await import('../../services/imageProviderService');
        const elements = [
            { id: '1', type: 'text', side: 'front', x: 10, y: 10, width: 100, height: 50, isVisible: true }
        ] as any[];

        render(
            <AssetGenerate
                {...defaultProps}
                category="front-background"
                cardElements={elements}
                cardWidth={375}
                cardHeight={525}
            />
        );

        const textarea = screen.getByPlaceholderText(/Describe your image/i) as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: 'test prompt' } });

        const button = screen.getByText(/Generate Image/i);
        fireEvent.click(button);

        expect(imageProviderService.generateImage).toHaveBeenCalledWith(
            expect.stringContaining('test prompt'),
            undefined,
            expect.objectContaining({
                layout: {
                    elements: elements,
                    dimensions: { width: 375, height: 525 }
                }
            })
        );
    });
});
