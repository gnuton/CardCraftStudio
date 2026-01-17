import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransformWrapper } from './TransformWrapper';

describe('TransformWrapper Boundary Constraints', () => {
    // Mock onUpdate
    const handleUpdate = vi.fn();
    const handleSelect = vi.fn();

    const initialValues = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotate: 0,
        scale: 1,
    };

    const bounds = {
        minX: -150,
        maxX: 150,
        minY: -200,
        maxY: 200,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('clamps dragging within bounds', () => {
        const { getByTestId } = render(
            <TransformWrapper
                isActive={true}
                isSelected={true}
                values={initialValues}
                onUpdate={handleUpdate}
                onSelect={handleSelect}
                bounds={bounds}
            // render a simple div that we can find
            >
                <div data-testid="target" style={{ width: 100, height: 100 }}>Content</div>
            </TransformWrapper>
        );

        const element = getByTestId('target').parentElement!; // The inner wrapper has the ref

        // Mock offsetWidth/offsetHeight on the elementRef
        // In JSDOM, these are 0 by default. TransformWrapper needs them for projected size calc.
        Object.defineProperty(element, 'offsetWidth', { configurable: true, value: 100 });
        Object.defineProperty(element, 'offsetHeight', { configurable: true, value: 100 });

        // Mock getBoundingClientRect for center calculation
        element.getBoundingClientRect = vi.fn(() => ({
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            right: 200,
            bottom: 200,
            x: 100,
            y: 100,
            toJSON: () => { }
        }));

        // 1. Mouse Down to start drag
        fireEvent.mouseDown(element, { clientX: 100, clientY: 100 });

        // 2. Mouse Move (Drag Right largely)
        // Drag 300px right. Limit is 150. Initial X is 0.
        // Bounds: MaxX 150. Element Width 100. HalfW = 50.
        // Max Allowed Center = 150 - 50 = 100.
        // Delta = 300. NewX would be 300. Clamped should be 100.
        fireEvent.mouseMove(document, { clientX: 400, clientY: 100 });

        // 3. Check calls
        // The dragging triggers onUpdate on every move.
        // The last call should be clamped.
        // We expect x to be clamped to 100.
        expect(handleUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            x: 100, // Clamped value
            y: 0
        }));
    });

    it('clamps with rotation (projected bounds)', () => {
        // Rotate 45 degrees.
        // Width 100, Height 100.
        // Projected Width = 100*cos(45) + 100*sin(45) ~= 70.7 + 70.7 = 141.4
        // Half Proj Width ~= 70.7
        // Max Allowed X = 150 - 70.7 = 79.3

        const rotatedValues = { ...initialValues, rotate: 45 };

        const { getByTestId } = render(
            <TransformWrapper
                isActive={true}
                isSelected={true}
                values={rotatedValues}
                onUpdate={handleUpdate}
                onSelect={handleSelect}
                bounds={bounds}
            >
                <div data-testid="target-rotated" style={{ width: 100, height: 100 }}>Rotated</div>
            </TransformWrapper>
        );

        const element = getByTestId('target-rotated').parentElement!;
        Object.defineProperty(element, 'offsetWidth', { configurable: true, value: 100 });
        Object.defineProperty(element, 'offsetHeight', { configurable: true, value: 100 });

        element.getBoundingClientRect = vi.fn(() => ({
            left: 100, top: 100, width: 141.4, height: 141.4, right: 241, bottom: 241, x: 100, y: 100, toJSON: () => { }
        }));


        // Start drag
        fireEvent.mouseDown(element, { clientX: 100, clientY: 100 });

        // Move far right again (300px)
        fireEvent.mouseMove(document, { clientX: 400, clientY: 100 });

        // Assert
        // We expect X to be clamped to ~79.3
        const lastCall = handleUpdate.mock.calls[handleUpdate.mock.calls.length - 1][0];
        // Allow some float precision error
        expect(lastCall.x).toBeCloseTo(79.3, 0);
    });
});
