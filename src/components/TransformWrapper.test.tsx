import { render, fireEvent } from '@testing-library/react';
import { TransformWrapper } from './TransformWrapper';
import { describe, it, expect, vi } from 'vitest';

describe('TransformWrapper', () => {
    const defaultValues = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotate: 0,
        scale: 1,
    };

    it('updates coordinates when dragged', () => {
        const onUpdate = vi.fn();
        const { getByText } = render(
            <TransformWrapper
                isActive={true}
                isSelected={true}
                values={defaultValues}
                onUpdate={onUpdate}
                onSelect={() => { }}
            >
                <div>Test Element</div>
            </TransformWrapper>
        );

        const element = getByText('Test Element');

        // Mock getBoundingClientRect for rotation center calculation
        // TransformWrapper uses elementRef.current.getBoundingClientRect()
        // and elementRef.current.offsetWidth/offsetHeight
        Object.defineProperty(element.parentElement, 'offsetWidth', { value: 100 });
        Object.defineProperty(element.parentElement, 'offsetHeight', { value: 100 });
        element.parentElement!.getBoundingClientRect = vi.fn(() => ({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            bottom: 100,
            right: 100,
            x: 0,
            y: 0,
            toJSON: () => { },
        }));

        fireEvent.mouseDown(element, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(document, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(document);

        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
            x: 50,
            y: 50
        }));
    });

    it('respects bounds when dragged', () => {
        const onUpdate = vi.fn();
        const bounds = { minX: -50, maxX: 50, minY: -50, maxY: 50 };
        const { getByText } = render(
            <TransformWrapper
                isActive={true}
                isSelected={true}
                values={defaultValues}
                onUpdate={onUpdate}
                onSelect={() => { }}
                bounds={bounds}
            >
                <div>Bound Element</div>
            </TransformWrapper>
        );

        const element = getByText('Bound Element');

        Object.defineProperty(element.parentElement, 'offsetWidth', { value: 100 });
        Object.defineProperty(element.parentElement, 'offsetHeight', { value: 100 });
        element.parentElement!.getBoundingClientRect = vi.fn(() => ({
            left: -50,
            top: -50,
            width: 100,
            height: 100,
            bottom: 50,
            right: 50,
            x: -50,
            y: -50,
            toJSON: () => { },
        }));

        // Drag way outside bounds
        fireEvent.mouseDown(element, { clientX: 0, clientY: 0 });
        fireEvent.mouseMove(document, { clientX: 500, clientY: 500 });
        fireEvent.mouseUp(document);

        // Bounds are minX: -50, maxX: 50. Width is 100.
        // projected width is 100. half projected width is 50.
        // maxAllowedX = maxX - halfW = 50 - 50 = 0.
        // minAllowedX = minX + halfW = -50 + 50 = 0.
        // So element of size 100 in bounds of -50 to 50 can only be at 0.

        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
            x: 0,
            y: 0
        }));
    });

    it('updates rotation when rotate handle is dragged', () => {
        const onUpdate = vi.fn();
        const { container } = render(
            <TransformWrapper
                isActive={true}
                isSelected={true}
                values={defaultValues}
                onUpdate={onUpdate}
                onSelect={() => { }}
            >
                <div>Rotate Element</div>
            </TransformWrapper>
        );

        const rotateHandle = container.querySelector('.lucide-rotate-cw')?.parentElement;
        expect(rotateHandle).toBeTruthy();

        // mock center at 0,0
        // mouseDown at startX, startY
        // mouseMove to currentX, currentY

        // TransformWrapper calculates center using getBoundingClientRect
        const wrapper = container.firstChild?.firstChild as HTMLElement;
        wrapper.getBoundingClientRect = vi.fn(() => ({
            left: -50,
            top: -50,
            width: 100,
            height: 100,
            bottom: 50,
            right: 50,
            x: -50,
            y: -50,
            toJSON: () => { },
        }));

        // Start dragging rotate handle
        // Center is (0,0)
        // startX: 0, startY: -100
        fireEvent.mouseDown(rotateHandle!, { clientX: 0, clientY: -100 });
        // Move to 100, 0 (90 degrees clockwise)
        fireEvent.mouseMove(document, { clientX: 100, clientY: 0 });
        fireEvent.mouseUp(document);

        // atan2(0-0, 100-0) = 0
        // atan2(-100-0, 0-0) = -PI/2
        // deltaRad = 0 - (-PI/2) = PI/2 = 90 deg

        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
            rotate: 90
        }));
    });
});
