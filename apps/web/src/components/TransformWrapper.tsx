import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCw, Trash2 } from 'lucide-react';

interface TransformValues {
    x: number;
    y: number;
    width: number;
    height?: number;
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
    useScaleForResize?: boolean;
    onDelete?: () => void;
    bounds?: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
    disableDrag?: boolean;
    hideControls?: boolean;
    parentScale?: number;
}

export const TransformWrapper = ({
    isActive,
    isSelected,
    values,
    onUpdate,
    onSelect,
    minWidth = 20,
    minHeight = 20,
    children,
    className,
    style,
    useScaleForResize = false,
    onDelete,
    bounds,
    disableDrag = false,
    hideControls = false,
    parentScale = 1
}: TransformWrapperProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [interactionTransform, setInteractionTransform] = useState<TransformValues | null>(null);

    const elementRef = useRef<HTMLDivElement>(null);

    // Store all values in refs to avoid stale closures
    const boundsRef = useRef(bounds);
    const parentScaleRef = useRef(parentScale);
    const minWidthRef = useRef(minWidth);
    const minHeightRef = useRef(minHeight);
    const useScaleForResizeRef = useRef(useScaleForResize);
    const onUpdateRef = useRef(onUpdate);
    const valuesRef = useRef(values);

    useEffect(() => { boundsRef.current = bounds; }, [bounds]);
    useEffect(() => { parentScaleRef.current = parentScale; }, [parentScale]);
    useEffect(() => { minWidthRef.current = minWidth; minHeightRef.current = minHeight; }, [minWidth, minHeight]);
    useEffect(() => { useScaleForResizeRef.current = useScaleForResize; }, [useScaleForResize]);
    useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
    useEffect(() => { valuesRef.current = values; }, [values]);

    // Drag state stored in ref
    const dragStateRef = useRef<{
        startX: number;
        startY: number;
        initialValues: TransformValues;
        center: { x: number, y: number };
        action: string;
    } | null>(null);

    const getConstrainedPosition = useCallback((x: number, y: number): { x: number, y: number } => {
        const b = boundsRef.current;
        if (!b) return { x, y };
        return {
            x: Math.max(b.minX, Math.min(b.maxX, x)),
            y: Math.max(b.minY, Math.min(b.maxY, y))
        };
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const state = dragStateRef.current;
        if (!state) return;

        const { startX, startY, initialValues, center, action } = state;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const scale = parentScaleRef.current;

        let newValues: TransformValues;

        if (action === 'drag') {
            const newPos = getConstrainedPosition(
                initialValues.x + deltaX / scale,
                initialValues.y + deltaY / scale
            );
            newValues = { ...initialValues, x: newPos.x, y: newPos.y };
        } else if (action === 'rotate') {
            const startAngle = Math.atan2(startY - center.y, startX - center.x);
            const currentAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
            const deltaDeg = (currentAngle - startAngle) * (180 / Math.PI);
            newValues = { ...initialValues, rotate: initialValues.rotate + deltaDeg };
        } else if (action.startsWith('resize')) {
            const rad = -initialValues.rotate * (Math.PI / 180);
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const lDx = (deltaX * cos - deltaY * sin) / scale;
            const lDy = (deltaX * sin + deltaY * cos) / scale;

            if (useScaleForResizeRef.current) {
                const changes = Math.max(lDx, lDy);
                const newScale = Math.max(0.1, initialValues.scale! + (changes / 100));
                newValues = { ...initialValues, scale: newScale };
            } else {
                const w0 = initialValues.width;
                const h0 = initialValues.height || w0;
                const x0 = initialValues.x;
                const y0 = initialValues.y;
                const angle = initialValues.rotate * (Math.PI / 180);
                const cAngle = Math.cos(angle);
                const sAngle = Math.sin(angle);

                let anchorLocalX = 0;
                let anchorLocalY = 0;

                if (action.includes('w')) anchorLocalX = w0 / 2;
                else if (action.includes('e')) anchorLocalX = -w0 / 2;

                if (action.includes('n')) anchorLocalY = h0 / 2;
                else if (action.includes('s')) anchorLocalY = -h0 / 2;

                const anchorWorldX = x0 + anchorLocalX * cAngle - anchorLocalY * sAngle;
                const anchorWorldY = y0 + anchorLocalX * sAngle + anchorLocalY * cAngle;

                let newW = w0;
                let newH = h0;

                if (action.includes('e')) newW = w0 + lDx;
                else if (action.includes('w')) newW = w0 - lDx;

                if (action.includes('s')) newH = h0 + lDy;
                else if (action.includes('n')) newH = h0 - lDy;

                newW = Math.max(minWidthRef.current, newW);
                newH = Math.max(minHeightRef.current, newH);

                let newAnchorLocalX = 0;
                let newAnchorLocalY = 0;

                if (action.includes('w')) newAnchorLocalX = newW / 2;
                else if (action.includes('e')) newAnchorLocalX = -newW / 2;

                if (action.includes('n')) newAnchorLocalY = newH / 2;
                else if (action.includes('s')) newAnchorLocalY = -newH / 2;

                const newX = anchorWorldX - (newAnchorLocalX * cAngle - newAnchorLocalY * sAngle);
                const newY = anchorWorldY - (newAnchorLocalX * sAngle + newAnchorLocalY * cAngle);

                newValues = {
                    ...initialValues,
                    x: newX,
                    y: newY,
                    width: newW,
                    height: initialValues.height !== undefined ? newH : undefined
                };
            }
        } else {
            return;
        }

        setInteractionTransform(newValues);
    }, [getConstrainedPosition]);

    const handleMouseUp = useCallback(() => {
        if (interactionTransform) {
            onUpdateRef.current(interactionTransform);
        }
        setInteractionTransform(null);
        dragStateRef.current = null;
        setIsDragging(false);
        setActiveAction(null);
        document.body.style.cursor = '';
    }, [interactionTransform]);

    const handleMouseDown = useCallback((e: React.MouseEvent, action: string) => {
        if (!isActive) return;
        if (action === 'drag' && disableDrag) {
            e.stopPropagation();
            return;
        }

        e.stopPropagation();
        e.preventDefault();

        if (!isSelected && action === 'drag') {
            onSelect();
        }
        if (action === 'drag' && !isSelected) return;

        let cx = 0, cy = 0;
        if (elementRef.current) {
            const rect = elementRef.current.getBoundingClientRect();
            cx = rect.left + rect.width / 2;
            cy = rect.top + rect.height / 2;
        }

        const currentValues = valuesRef.current;
        dragStateRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialValues: { ...currentValues },
            center: { x: cx, y: cy },
            action
        };

        setInteractionTransform({ ...currentValues });
        if (action === 'drag') setIsDragging(true);
        setActiveAction(action);
    }, [isActive, isSelected, disableDrag, onSelect]);

    useEffect(() => {
        if (!activeAction) return;

        const onMouseMove = (e: MouseEvent) => handleMouseMove(e);
        const onMouseUp = () => handleMouseUp();

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [activeAction, handleMouseMove, handleMouseUp]);

    const displayValues = interactionTransform || values;
    const { zIndex, ...restStyle } = style || {};

    return (
        <div
            className={`absolute ${className || ''}`}
            style={{
                top: '50%',
                left: '50%',
                width: 0,
                height: 0,
                overflow: 'visible',
                zIndex: zIndex ?? 'auto'
            }}
        >
            <div
                ref={elementRef}
                onMouseDown={(e) => handleMouseDown(e, 'drag')}
                onClick={(e) => e.stopPropagation()}
                className="relative"
                style={{
                    ...restStyle,
                    width: displayValues.width,
                    height: displayValues.height ?? 'auto',
                    cursor: isActive ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    transform: `translate(calc(-50% + ${displayValues.x}px), calc(-50% + ${displayValues.y}px)) rotate(${displayValues.rotate}deg) scale(${displayValues.scale || 1})`,
                    boxShadow: isSelected ? '0 0 0 2px #3b82f6' : 'none',
                    userSelect: 'none',
                    touchAction: 'none',
                    willChange: interactionTransform ? 'transform' : 'auto',
                }}
            >
                {children}

                {isSelected && isActive && !hideControls && (
                    <>
                        <div
                            className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center bg-white border border-[#3b82f6] rounded-full shadow cursor-grab active:cursor-grabbing hover:bg-blue-50 z-[9999] text-[#3b82f6]"
                            onMouseDown={(e) => handleMouseDown(e, 'rotate')}
                        >
                            <div style={{ transform: `rotate(${-displayValues.rotate}deg)` }}>
                                <RotateCw size={16} />
                            </div>
                            <div className="absolute top-full left-1/2 w-px h-4 bg-[#3b82f6] -translate-x-1/2 pointer-events-none" />
                        </div>

                        {!useScaleForResize && (
                            <>
                                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#3b82f6] cursor-nwse-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-nw')} />
                                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#3b82f6] cursor-nesw-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-ne')} />
                                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#3b82f6] cursor-nesw-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-sw')} />
                                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#3b82f6] cursor-nwse-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-se')} />
                                <div className="absolute top-1/2 -left-1.5 w-3 h-3 -mt-1.5 bg-white border-2 border-[#3b82f6] cursor-ew-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-w')} />
                                <div className="absolute top-1/2 -right-1.5 w-3 h-3 -mt-1.5 bg-white border-2 border-[#3b82f6] cursor-ew-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-e')} />
                                <div className="absolute -top-1.5 left-1/2 w-3 h-3 -ml-1.5 bg-white border-2 border-[#3b82f6] cursor-ns-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-n')} />
                                <div className="absolute -bottom-1.5 left-1/2 w-3 h-3 -ml-1.5 bg-white border-2 border-[#3b82f6] cursor-ns-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-s')} />
                            </>
                        )}

                        {useScaleForResize && (
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#3b82f6] cursor-nwse-resize z-[9999]" onMouseDown={(e) => handleMouseDown(e, 'resize-scale')} />
                        )}

                        {onDelete && (
                            <button
                                className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center bg-white border border-red-500 rounded-full shadow hover:bg-red-50 z-[9999] text-red-500 transition-colors"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                title="Delete element"
                            >
                                <div style={{ transform: `rotate(${-displayValues.rotate}deg)` }}>
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
