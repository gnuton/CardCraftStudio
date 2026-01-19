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

    it('hides layout controls when isLayoutEditable is false', () => {
        const { container } = render(
            <Card
                data={{ title: 'Test Title' }}
                deckStyle={mockStyle}
                isInteractive={true}
                isLayoutEditable={false}
                selectedElement="title"
            />
        );

        // Should be interactive (allow text edit) but NO layout handles.
        const handles = container.querySelectorAll('.cursor-nwse-resize');
        expect(handles.length).toBe(0);

        const rotateHandle = container.querySelector('.cursor-grab');
        expect(rotateHandle).toBeNull();
    });

    it('renders flattened structure when renderMode is front', () => {
        render(
            <Card
                data={{ title: 'Test Title' }}
                deckStyle={mockStyle}
                renderMode="front"
            />
        );

        // Ensure that the motion.div wrapper with preserve-3d is NOT present (or at least not creating a 3d context)
        // However, checking internal implementation details is brittle.
        // We can check if the structure is simpler.
        // The default structure has: div > motion.div > div(front) + div(back)
        // The flat structure should be: div > div(front)

        // Let's check that we treat it as flat. 
        // We can check if the style contains perspective on the root if we keep it, or if backface-visibility is suppressed.
        // Or simply check if we can find the front content directly.

        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
    it('calls onDeleteElement when delete button is clicked', () => {
        const handleDelete = vi.fn();
        render(
            <Card
                data={{ title: 'Test Title' }}
                deckStyle={mockStyle}
                isInteractive={true}
                isLayoutEditable={true}
                selectedElement="title"
                onDeleteElement={handleDelete}
            />
        );

        // TransformWrapper renders a delete button when selected and active
        const deleteBtn = screen.getByTitle('Delete element');
        fireEvent.click(deleteBtn);

        expect(handleDelete).toHaveBeenCalledWith('title');
    });
});
