// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
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

vi.mock('html-to-image', () => ({
    toPng: vi.fn().mockResolvedValue('data:image/png;base64,mock-wireframe'),
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

    it('starts with a non-empty default prompt for backgrounds', () => {
        render(<AssetGenerate {...defaultProps} />);

        const textarea = screen.getByPlaceholderText(/Describe your image/i) as HTMLTextAreaElement;
        expect(textarea.value).toContain('wireframe');
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

        // Show preview to see the layout preview
        const toggle = screen.getByText(/Comparison Preview/i);
        fireEvent.click(toggle);

        expect(screen.getByText(/Wireframe will be sent to AI/i)).toBeDefined();

        // Should not show for icon
        rerender(
            <AssetGenerate
                {...defaultProps}
                category="icon"
                cardElements={elements}
            />
        );
        expect(screen.queryByText(/Wireframe will be sent to AI/i)).toBeNull();
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

        await waitFor(() => {
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
        }, { timeout: 2000 });
    });
});
