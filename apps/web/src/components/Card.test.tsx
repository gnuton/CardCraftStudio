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
        borderColor: '#000000',
        borderWidth: 12,
        backgroundColor: '#ffffff',
        backgroundImage: null,
        globalFont: 'Inter',
        cardBackBackgroundColor: '#312e81',
        svgFrameColor: '#000000',
        svgCornerColor: '#000000',
        svgStrokeWidth: 2,
        elements: [
            {
                id: 'title',
                type: 'text',
                side: 'front',
                name: 'Title',
                x: 0, y: -180,
                width: 200, height: 40,
                rotate: 0, scale: 1,
                zIndex: 10, opacity: 1,
                color: '#000',
                fontFamily: 'Inter',
                fontSize: 16,
                textAlign: 'center',
                defaultContent: 'Default Title'
            },
            {
                id: 'description',
                type: 'multiline',
                side: 'front',
                name: 'Description',
                x: 0, y: 100,
                width: 250, height: 100,
                rotate: 0, scale: 1,
                zIndex: 5, opacity: 1,
                color: '#333',
                fontFamily: 'Inter',
                fontSize: 12,
                textAlign: 'left',
                defaultContent: 'Default Description'
            }
        ]
    } as any;

    it('renders static content correctly', () => {
        render(
            <Card
                data={{
                    title: 'Test Title',
                    description: 'Test Desc'
                }}
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
                data={{
                    title: 'Test Title'
                }}
                deckStyle={mockStyle}
                isInteractive={true}
                onSelectElement={handleSelect}
            />
        );

        const titleEl = screen.getByText('Test Title');
        fireEvent.click(titleEl);
        expect(handleSelect).toHaveBeenCalledWith('title');
    });

    it('renders default content when data is not provided', () => {
        render(
            <Card
                data={{}}
                deckStyle={mockStyle}
            />
        );

        expect(screen.getByText('Default Title')).toBeInTheDocument();
        expect(screen.getByText('Default Description')).toBeInTheDocument();
    });
});
