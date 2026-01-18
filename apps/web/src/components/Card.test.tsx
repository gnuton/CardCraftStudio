import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './Card';
import type { DeckStyle } from '../App';

// Mock RichTextEditor
vi.mock('./RichTextEditor', () => ({
    RichTextEditor: ({ value, onChange }: any) => (
        <textarea
            data-testid="rich-text-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}));

describe('Card Component (Fixed Layout)', () => {
    const mockStyle: DeckStyle = {
        showTitle: true,
        showDescription: true,
        showCorner: true,

        titleX: 10, titleY: 10, titleWidth: 100,
        descriptionX: 10, descriptionY: 50, descriptionWidth: 100,
        cornerX: 5, cornerY: 5, cornerWidth: 20, cornerHeight: 20,

        // Fonts
        globalFont: 'Inter',
        titleFont: 'Inter',
        descriptionFont: 'Inter',
        cornerFont: 'Inter'
    } as any;

    it('renders static content correctly', () => {
        render(
            <Card
                title="Test Title"
                description="Test Desc"
                deckStyle={mockStyle}
            />
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Desc')).toBeInTheDocument();
    });

    it('enters edit mode when clicked in interactive mode', () => {
        const handleSelect = vi.fn();
        render(
            <Card
                title="Test Title"
                deckStyle={mockStyle}
                isInteractive={true}
                onSelectElement={handleSelect}
            />
        );

        const titleParams = screen.getByText('Test Title');
        fireEvent.click(titleParams);
        expect(handleSelect).toHaveBeenCalledWith('title');
    });
});
