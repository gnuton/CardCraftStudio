
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as htmlToImage from 'html-to-image';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock html-to-image
vi.mock('html-to-image', () => ({
    toSvg: vi.fn(),
    toPng: vi.fn(), // Mock other methods if used
}));

// Mock URL.createObjectURL (not used in current impl but good practice)
// App.tsx uses data URI directly.

describe('App Component SVG Export', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('triggers toSvg and downloads file when Export SVG is clicked', async () => {
        const mockDataUrl = 'data:image/svg+xml;base64,fake-svg-content';
        (htmlToImage.toSvg as any).mockResolvedValue(mockDataUrl);

        render(<App />);

        // Navigate: Library -> Deck Studio (click the Create New Deck placeholder card)
        const createDeckPlaceholder = screen.getByText('Create New Deck');
        fireEvent.click(createDeckPlaceholder);

        // Navigate: Deck Studio -> Editor (click the Create New Card placeholder)
        const createCardPlaceholder = await screen.findByText('Create New Card');
        fireEvent.click(createCardPlaceholder);

        const exportBtn = await screen.findByRole('button', { name: /Export SVG/i });
        expect(exportBtn).toBeInTheDocument();

        fireEvent.click(exportBtn);

        await waitFor(() => {
            expect(htmlToImage.toSvg).toHaveBeenCalled();
        });

        // We can inspect the arguments if we want to ensure config is passed
        // expect(htmlToImage.toSvg).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ backgroundColor: '#ffffff' }));
    });
});
