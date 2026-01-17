import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, Trash2 } from 'lucide-react';

interface TransformValues {
    x: number;
    y: number;
    width: number;
    height?: number; // Optional for text elements
    rotate: number;
    scale?: number;
}

interface TransformWrapperProps {
    isActive: boolean;
    isSelected: boolean;
    values: TransformValues;
    onUpdate: (values: TransformValues) => void;
    onSelect: () => void;
    lockAspectRatio?: boolean;
    minWidth?: number;
    minHeight?: number;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    // If true, resize handles update 'scale' instead of width/height (for text scaling vs resizing)
    useScaleForResize?: boolean;
    onDelete?: () => void;
    bounds?: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
    disableDrag?: boolean;
}

export const TransformWrapper = ({
    isActive,
    isSelected,
    values,
    onUpdate,
    onSelect,
    lockAspectRatio = false,
    minWidth = 20,
    minHeight = 20,
    children,
    className,
    style,
    useScaleForResize = false,
    onDelete,
    bounds,
    disableDrag = false
}: TransformWrapperProps) => {
    const [isDragging, setIsDragging] = useState(false);

    const elementRef = useRef<HTMLDivElement>(null);
    // Refs to store initial values during interactions to avoid closure staleness issues
    const initialDragState = useRef<{
        startX: number;
        startY: number;
        initialValues: TransformValues;
        center: { x: number, y: number }; // Store center for rotation
        localDimensions: { width: number, height: number };
        action?: string; // 'drag', 'rotate', 'resize-tl', etc.
    } | null>(null);

    const handleMouseDown = (e: React.MouseEvent, action: string) => {
        if (!isActive) return;

        // Allow text selection/editing when drag is disabled
        if (action === 'drag' && disableDrag) {
            e.stopPropagation();
            return;
        }

        e.stopPropagation();
        e.preventDefault();

        // If clicking the body and not selected, select it first
        if (!isSelected && action === 'drag') {
            onSelect();
            // Don't start dragging immediately on select to avoid jumps?
            // Standard UX allows click-drag to select-move.
        }

        if (action === 'drag' && !isSelected) return; // Should be handled by parent click, but just in case

        // Calculate center for rotation
        let cx = 0, cy = 0;
        let lw = 0, lh = 0;
        if (elementRef.current) {
            const rect = elementRef.current.getBoundingClientRect();
            cx = rect.left + rect.width / 2;
            cy = rect.top + rect.height / 2;
            lw = elementRef.current.offsetWidth;
            lh = elementRef.current.offsetHeight;
        }

        initialDragState.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialValues: { ...values },
            center: { x: cx, y: cy },
            localDimensions: { width: lw, height: lh },
            action
        };

        if (action === 'drag') setIsDragging(true);

        // Add global listeners
        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!initialDragState.current) return;

        const { startX, startY, initialValues, center, localDimensions, action } = initialDragState.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Current scale of the canvas/parent - hardcoded for now or detected?
        // Card is typically shown scaled in Global editor.
        // We might need to receive a `parentScale` prop to adjust deltas matching the cursor speed.
        // For now, assuming 1:1 or close enough, or user adjusts.
        // IMPROVEMENT: Add parentScale prop
        const parentScale = 1;

        if (action === 'drag') {
            let newX = initialValues.x + deltaX / parentScale;
            let newY = initialValues.y + deltaY / parentScale;

            if (bounds && localDimensions) {
                // Calculate projected size for strict bonding
                const rad = (initialValues.rotate || 0) * (Math.PI / 180);
                const absCos = Math.abs(Math.cos(rad));
                const absSin = Math.abs(Math.sin(rad));

                const currentW = (localDimensions.width * (initialValues.scale || 1));
                const currentH = (localDimensions.height * (initialValues.scale || 1));

                const projW = currentW * absCos + currentH * absSin;
                const projH = currentW * absSin + currentH * absCos;

                const halfW = projW / 2;
                const halfH = projH / 2;

                const minAllowedX = bounds.minX + halfW;
                const maxAllowedX = bounds.maxX - halfW;
                const minAllowedY = bounds.minY + halfH;
                const maxAllowedY = bounds.maxY - halfH;

                if (minAllowedX > maxAllowedX) {
                    newX = 0; // element wider than bounds, cente
                } else {
                    newX = Math.max(minAllowedX, Math.min(maxAllowedX, newX));
                }

                if (minAllowedY > maxAllowedY) {
                    newY = 0;
                } else {
                    newY = Math.max(minAllowedY, Math.min(maxAllowedY, newY));
                }
            }

            onUpdate({
                ...initialValues,
                x: newX,
                y: newY
            });
        } else if (action === 'rotate') {
            // Calculate angle based on center to mouse vector
            // This ensures rotation follows the mouse naturally at any orientation
            const startAngle = Math.atan2(startY - center.y, startX - center.x);
            const currentAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x);

            const deltaRad = currentAngle - startAngle;
            const deltaDeg = deltaRad * (180 / Math.PI);

            onUpdate({
                ...initialValues,
                rotate: initialValues.rotate + deltaDeg
            });
        } else if (action?.startsWith('resize')) {
            // Resize logic
            // Need to rotate delta vector into local space
            const rad = -initialValues.rotate * (Math.PI / 180);
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            const localDx = (deltaX * cos - deltaY * sin) / parentScale;
            const localDy = (deltaX * sin + deltaY * cos) / parentScale;

            let newWidth = initialValues.width;
            let newHeight = initialValues.height;
            let newScale = initialValues.scale || 1;

            if (useScaleForResize) {
                // Simplified scaling: dragging right/down increases scale
                if (action.includes('right') || action.includes('bottom')) {
                    const changes = Math.max(localDx, localDy);
                    newScale = Math.max(0.1, initialValues.scale! + (changes / 100)); // arbitrary divisor
                } else {
                    const changes = Math.min(localDx, localDy);
                    newScale = Math.max(0.1, initialValues.scale! - (changes / 100));
                }
                onUpdate({
                    ...initialValues,
                    scale: newScale
                });
                return;
            }

            // Standard N/E/S/W resize logic (center anchored? no, opposite corner anchored)
            // But CSS layout is centered: translate(-50%, -50%).
            // So x/y are CENTER coordinates.
            // If width increases by 10, center shifts by 5 (rotated).

            // It's vastly easier to just support symmetrical resize from center for this use case
            // because of the translate(-50%, -50%) CSS commonly used in this project.
            // Otherwise we have to do complex matrix math to shift center to keep opposite edge fixed.

            // Let's implement symmetrical resize (Alt-like behavior) for simplicity + center-origin CSS.
            // "You scale by stretching the squares" -> changing width/height from center.

            if (action.includes('e')) newWidth += localDx * 2; // *2 because center anchored
            if (action.includes('w')) newWidth -= localDx * 2;
            if (action.includes('s') && newHeight !== undefined) newHeight += localDy * 2;
            if (action.includes('n') && newHeight !== undefined) newHeight -= localDy * 2;

            if (lockAspectRatio && newHeight !== undefined) {
                // Adjust based on dominant axis or logic
                // For now, keep it simple
            }

            onUpdate({
                ...initialValues,
                width: Math.max(minWidth, newWidth),
                height: newHeight !== undefined ? Math.max(minHeight, newHeight) : undefined,
                // We're not updating x/y here because we assumed center-anchored resize 
                // which doesn't move the center point.
            });
        }
    };

    const handleGlobalMouseUp = () => {
        setIsDragging(false);
        initialDragState.current = null;
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    // Cleanup
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, []);

    // const cursorStyle = isRotating ? 'cursor-grabbing' : isDragging ? 'cursor-move' : 'cursor-pointer'; // Moved to inline for simplicity or use if needed

    const { zIndex, ...restStyle } = style || {};

    return (
        <div
            className={`absolute ${className || ''}`}
            style={{
                top: '50%',
                left: '50%',
                width: 0, height: 0,
                overflow: 'visible',
                zIndex: isSelected ? 100 : (zIndex ?? 'auto')
            }}
        >
            <div
                ref={elementRef}
                onMouseDown={(e) => handleMouseDown(e, 'drag')}
                onClick={(e) => e.stopPropagation()}
                className="relative"
                style={{
                    ...restStyle,
                    width: values.width,
                    height: values.height ?? 'auto', // Handle undefined height
                    cursor: isActive ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    // The transform is key:
                    transform: `translate(calc(-50% + ${values.x}px), calc(-50% + ${values.y}px)) rotate(${values.rotate}deg) scale(${values.scale || 1})`,
                    // Outline when selected
                    boxShadow: isSelected ? '0 0 0 2px #3b82f6' : 'none',
                    userSelect: 'none',
                    touchAction: 'none'
                }}
            >
                {children}

                {/* Overlays/Controls */}
                {isSelected && isActive && (
                    <>
                        {/* Rotation Handle */}
                        <div
                            className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center bg-white border border-[#3b82f6] rounded-full shadow cursor-grab active:cursor-grabbing hover:bg-blue-50 z-[9999] text-[#3b82f6]"
                            onMouseDown={(e) => handleMouseDown(e, 'rotate')}
                        >
                            <div style={{ transform: `rotate(${-values.rotate}deg)` }}>
                                <RotateCw size={16} />
                            </div>
                            {/* Connector Line */}
                            <div className="absolute top-full left-1/2 w-px h-4 bg-[#3b82f6] -translate-x-1/2 pointer-events-none" />
                        </div>

                        {/* Resize Handles - 4 Corners */}
                        {!useScaleForResize && (
                            <>
                                {/* TL */}
                                <div
                                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#3b82f6] cursor-nwse-resize z-[9999]"
                                    onMouseDown={(e) => handleMouseDown(e, 'resize-nw')}
                                />
                                {/* TR */}
                                <div
                                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#3b82f6] cursor-nesw-resize z-[9999]"
                                    onMouseDown={(e) => handleMouseDown(e, 'resize-ne')}
                                />
                                {/* BL */}
                                <div
                                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#3b82f6] cursor-nesw-resize z-[9999]"
                                    onMouseDown={(e) => handleMouseDown(e, 'resize-sw')}
                                />
                                {/* BR */}
                                <div
                                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#3b82f6] cursor-nwse-resize z-[9999]"
                                    onMouseDown={(e) => handleMouseDown(e, 'resize-se')}
                                />
                                {/* Edges (Optional but standard) */}
                                <div className="absolute top-1/2 -left-1.5 w-3 h-3 -mt-1.5 bg-white border-2 border-[#3b82f6] cursor-ew-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-w')} />
                                <div className="absolute top-1/2 -right-1.5 w-3 h-3 -mt-1.5 bg-white border-2 border-[#3b82f6] cursor-ew-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-e')} />
                                <div className="absolute -top-1.5 left-1/2 w-3 h-3 -ml-1.5 bg-white border-2 border-[#3b82f6] cursor-ns-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-n')} />
                                <div className="absolute -bottom-1.5 left-1/2 w-3 h-3 -ml-1.5 bg-white border-2 border-[#3b82f6] cursor-ns-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-s')} />
                            </>
                        )}

                        {/* Scale Handles (Used if resize is mapped to scale) */}
                        {useScaleForResize && (
                            <>
                                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#3b82f6] cursor-nwse-resize z-[9999]"
                                    onMouseDown={(e) => handleMouseDown(e, 'resize-scale')}
                                />
                            </>
                        )}

                        {/* Delete Button */}
                        {onDelete && (
                            <button
                                className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center bg-white border border-red-500 rounded-full shadow hover:bg-red-50 z-[9999] text-red-500 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                title="Delete element"
                            >
                                <div style={{ transform: `rotate(${-values.rotate}deg)` }}>
                                    <Trash2 size={16} />
                                </div>
                                <div className="absolute bottom-full left-1/2 w-px h-2 bg-red-400 -translate-x-1/2 pointer-events-none" />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
