import { render, screen, fireEvent } from '@testing-library/react';
import { ImageControls } from './ImageControls';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ImageControls Integration', () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();
    const mockOnSelectAsset = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnPickColor = vi.fn();
    const mockOnClose = vi.fn();

    const defaultTransform = {
        x: 10,
        y: 20,
        scale: 1.5,
        rotate: 0,
        backgroundColor: '#ff0000'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderControls = (props = {}) => {
        return render(
            <ImageControls
                transform={defaultTransform}
                content="some-image-url"
                onChange={mockOnChange}
                onReset={mockOnReset}
                onSelectAsset={mockOnSelectAsset}
                onRemove={mockOnRemove}
                onPickColor={mockOnPickColor}
                onClose={mockOnClose}
                isPickingColor={false}
                {...props}
            />
        );
    };

    it('renders empty state when no content is provided', () => {
        renderControls({ content: undefined, hasContent: false });
        expect(screen.getByText('No Image Selected')).toBeInTheDocument();
        expect(screen.getByText('Choose Image')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Choose Image'));
        expect(mockOnSelectAsset).toHaveBeenCalled();
    });

    it('renders controls when content is provided', () => {
        renderControls();
        expect(screen.getByText('Image Controls')).toBeInTheDocument();
        expect(screen.getByText('Zoom')).toBeInTheDocument();
        expect(screen.getByText('Background')).toBeInTheDocument();
    });

    it('calls onRemove when Remove button is clicked', () => {
        renderControls();
        const removeBtn = screen.getByText('Remove');
        fireEvent.click(removeBtn);
        // window.confirm is no longer called in ImageControls, it just calls onRemove
        expect(mockOnRemove).toHaveBeenCalled();
    });

    it('calls onSelectAsset when Replace button is clicked', () => {
        renderControls();
        const replaceBtn = screen.getByText('Replace');
        fireEvent.click(replaceBtn);
        expect(mockOnSelectAsset).toHaveBeenCalled();
    });

    it('calls onChange when Zoom slider is moved', () => {
        renderControls();
        // Find zoom slider (input type range)
        // There are multiple ranges, we can find by associated text or order
        // Zoom is usually first
        const sliders = screen.getAllByRole('slider');
        const zoomSlider = sliders[0];

        fireEvent.change(zoomSlider, { target: { value: '2' } });
        expect(mockOnChange).toHaveBeenCalledWith({
            ...defaultTransform,
            scale: 2
        });
    });

    it('calls onChange when Pan X slider is moved', () => {
        renderControls();
        const sliders = screen.getAllByRole('slider');
        const panXSlider = sliders[1]; // Assuming order: Zoom, X, Y

        fireEvent.change(panXSlider, { target: { value: '50' } });
        expect(mockOnChange).toHaveBeenCalledWith({
            ...defaultTransform,
            x: 50
        });
    });

    it('buttons for Fit works correctly', () => {
        renderControls();
        const fitBtn = screen.getByText('Fit');
        fireEvent.click(fitBtn);
        expect(mockOnChange).toHaveBeenCalledWith({
            ...defaultTransform,
            scale: 1,
            x: 0,
            y: 0
        });
    });

    it('calls onReset when Reset button is clicked', () => {
        renderControls();
        const resetBtn = screen.getByText('Reset');
        fireEvent.click(resetBtn);
        expect(mockOnReset).toHaveBeenCalled();
    });

    it('updates background color via input', () => {
        renderControls();
        // Color input is harder to find by role sometimes, let's use display value
        const colorInput = screen.getByDisplayValue('#ff0000');
        fireEvent.change(colorInput, { target: { value: '#00ff00' } });
        expect(mockOnChange).toHaveBeenCalledWith({
            ...defaultTransform,
            backgroundColor: '#00ff00'
        });
    });

    it('clears background color', () => {
        renderControls();
        const clearBtn = screen.getByTitle('Clear Color');
        fireEvent.click(clearBtn);
        expect(mockOnChange).toHaveBeenCalledWith({
            ...defaultTransform,
            backgroundColor: ''
        });
    });

    it('activates pipette when clicked', () => {
        // Mock EyeDropper API if needed, or check fallback behavior
        // Since we test the button click calling onPickColor when EyeDropper is missing
        // We'll simulate missing EyeDropper
        const originalEyeDropper = window.EyeDropper;
        window.EyeDropper = undefined;

        renderControls();
        const pipetteBtn = screen.getByTitle('Pick color');
        fireEvent.click(pipetteBtn);
        expect(mockOnPickColor).toHaveBeenCalled();

        window.EyeDropper = originalEyeDropper;
    });
});
