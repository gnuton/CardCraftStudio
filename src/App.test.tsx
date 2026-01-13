
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

        // Navigate to Editor
        const addCardBtn = screen.getByText('Add New Card');
        fireEvent.click(addCardBtn);

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
