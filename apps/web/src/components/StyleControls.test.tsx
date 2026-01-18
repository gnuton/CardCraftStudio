import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StyleControls } from './StyleControls';
import type { DeckStyle } from '../App';

describe('StyleControls', () => {
    const mockStyle: DeckStyle = {
        titleColor: '#000000',
        titleOpacity: 1,
        titleZIndex: 10,
        titleBorderColor: '#ff0000',
        titleBorderWidth: 2,
        titleBorderStyle: 'solid',
        // partial mock of other properties as they shouldn't be accessed if we stick to prefix='title'
    } as any;

    const mockOnUpdate = vi.fn();

    it('renders color inputs correctly', () => {
        render(
            <StyleControls
                prefix="title"
                currentStyle={mockStyle}
                onUpdate={mockOnUpdate}
            />
        );

        // Find by label text or structure
        expect(screen.getByText('Background Color')).toBeInTheDocument();
        // Since we don't have a label for the color input itself, we can find by type or value
        const colorInputs = screen.getAllByRole('textbox'); // The text input for color
        expect(colorInputs.some(input => (input as HTMLInputElement).value === '')).toBe(true); // BackgroundColor is undefined in mock, so fallback ''
    });

    it('calls onUpdate when Z-Index slider changes', () => {
        render(
            <StyleControls
                prefix="title"
                currentStyle={mockStyle}
                onUpdate={mockOnUpdate}
            />
        );

        const sliders = screen.getAllByRole('slider');
        const zIndexSlider = sliders[1]; // Z-Index is the second slider
        fireEvent.change(zIndexSlider, { target: { value: '50' } });

        expect(mockOnUpdate).toHaveBeenCalledWith({ titleZIndex: 50 });
    });

    it('calls onUpdate when Opacity slider changes', () => {
        render(
            <StyleControls
                prefix="title"
                currentStyle={mockStyle}
                onUpdate={mockOnUpdate}
            />
        );

        // There are two sliders now. We need to distinguish them.
        // One is Z-Index, the other is Opacity.
        // Best to check generic rendering or use specific selectors.
        // Actually, let's just find by label text proximity if possible.
        // Or getting all sliders.
        const sliders = screen.getAllByRole('slider');
        const opacitySlider = sliders[0]; // Assuming order: Opacity, then Z-Index

        fireEvent.change(opacitySlider, { target: { value: '0.5' } });
        expect(mockOnUpdate).toHaveBeenCalledWith({ titleOpacity: 0.5 });
    });
});
