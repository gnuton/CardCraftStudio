import { render, fireEvent, act } from '@testing-library/react';
import { TransformWrapper } from './TransformWrapper';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('TransformWrapper', () => {
    const defaultValues = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotate: 0,
        scale: 1,
    };

    // Mock requestAnimationFrame for synchronous testing
    beforeEach(() => {
        vi.useFakeTimers();
        // Mock RAF to execute callback immediately
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            cb(0);
            return 0;
        });
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('updates coordinates when dragged', async () => {
        const onUpdate = vi.fn();
        const onSelect = vi.fn();
        const { getByText } = render(
            <TransformWrapper
                isActive={true}
                isSelected={true}
                values={defaultValues}
                onUpdate={onUpdate}
                onSelect={onSelect}
            >
                <div>Test Element</div>
            </TransformWrapper>
        );

        const element = getByText('Test Element');

        // Mock getBoundingClientRect for rotation center calculation
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

        await act(async () => {
            fireEvent.mouseDown(element, { clientX: 100, clientY: 100, bubbles: true });
        });

        await act(async () => {
            fireEvent.mouseMove(document, { clientX: 150, clientY: 150, bubbles: true });
        });

        await act(async () => {
            fireEvent.mouseUp(document, { bubbles: true });
        });

        // Verify onUpdate was called with the expected transformation
        expect(onUpdate).toHaveBeenCalled();
        const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
        expect(lastCall.x).toBe(50);
        expect(lastCall.y).toBe(50);
    });

    it('respects bounds when dragged', async () => {
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

        await act(async () => {
            fireEvent.mouseDown(element, { clientX: 0, clientY: 0, bubbles: true });
        });

        await act(async () => {
            fireEvent.mouseMove(document, { clientX: 500, clientY: 500, bubbles: true });
        });

        await act(async () => {
            fireEvent.mouseUp(document, { bubbles: true });
        });

        // Bounds are minX: -50, maxX: 50, minY: -50, maxY: 50.
        // Dragging from (0,0) by 500px should try to move to (500, 500) but:
        // - x is clamped to maxX (50)
        // - y is clamped to maxY (50)

        expect(onUpdate).toHaveBeenCalled();
        const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
        expect(lastCall.x).toBe(50);
        expect(lastCall.y).toBe(50);
    });

    it('updates rotation when rotate handle is dragged', async () => {
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
        await act(async () => {
            fireEvent.mouseDown(rotateHandle!, { clientX: 0, clientY: -100, bubbles: true });
        });

        await act(async () => {
            // Move to 100, 0 (90 degrees clockwise)
            fireEvent.mouseMove(document, { clientX: 100, clientY: 0, bubbles: true });
        });

        await act(async () => {
            fireEvent.mouseUp(document, { bubbles: true });
        });

        // atan2(0-0, 100-0) = 0
        // atan2(-100-0, 0-0) = -PI/2
        // deltaRad = 0 - (-PI/2) = PI/2 = 90 deg

        expect(onUpdate).toHaveBeenCalled();
        const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
        expect(lastCall.rotate).toBe(90);
    });
});
