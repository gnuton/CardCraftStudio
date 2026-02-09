import React from 'react';
import {
    X,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Move,
    Pipette,
    ImagePlus,
    Trash2,
    Maximize
} from 'lucide-react';
import type { ImageTransform } from '../types/element';

interface ImageControlsProps {
    transform: ImageTransform;
    hasContent?: boolean;
    content?: string;
    onChange: (transform: ImageTransform) => void;
    onReset: () => void;
    onSelectAsset: () => void;
    onRemove: () => void;
    onPickColor?: () => void;
    isPickingColor?: boolean;
    onClose: () => void;
}

export const ImageControls: React.FC<ImageControlsProps> = ({ transform, content, hasContent, onChange, onReset, onSelectAsset, onRemove, onPickColor, isPickingColor, onClose }) => {
    const hasImage = hasContent !== undefined ? hasContent : !!content;
    const handleChange = (key: keyof ImageTransform, value: number) => {
        onChange({
            ...transform,
            [key]: value
        });
    };

    return (
        <div className="w-80 h-full border-l border-border bg-card flex flex-col shadow-xl z-20 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Move className="w-4 h-4" /> Image Controls
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                {!hasImage ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center space-y-4">
                        <div className="p-3 bg-muted rounded-full">
                            <ImagePlus className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">No Image Selected</p>
                            <p className="text-xs text-muted-foreground px-4">
                                Double-click the component on the card or use the button below to choose an image.
                            </p>
                        </div>
                        <button
                            onClick={onSelectAsset}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
                        >
                            Choose Image
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Actions */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={onSelectAsset}
                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors border border-indigo-200"
                                >
                                    <ImagePlus className="w-4 h-4" /> Replace
                                </button>
                                <button
                                    onClick={onRemove}
                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-md text-sm font-medium transition-colors border border-red-200"
                                >
                                    <Trash2 className="w-4 h-4" /> Remove
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-border my-2" />

                        {/* Transforms */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transform</label>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onChange({ ...transform, scale: 1, x: 0, y: 0 })}
                                        className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 hover:bg-muted rounded"
                                        title="Fit image to border"
                                    >
                                        <Maximize className="w-3 h-3" /> Fit
                                    </button>
                                    <button
                                        onClick={onReset}
                                        className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 hover:bg-muted rounded"
                                    >
                                        <RotateCcw className="w-3 h-3" /> Reset
                                    </button>
                                </div>
                            </div>

                            {/* Zoom Control */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Zoom</span>
                                    <span className="font-mono text-muted-foreground">{Math.round(transform.scale * 100)}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ZoomOut className="w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="5"
                                        step="0.1"
                                        value={transform.scale}
                                        onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
                                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <ZoomIn className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>

                            {/* Pan Controls */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span>Position X</span>
                                    <span className="font-mono text-muted-foreground">{Math.round(transform.x)}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="-500"
                                    max="500"
                                    step="5"
                                    value={transform.x}
                                    onChange={(e) => handleChange('x', parseInt(e.target.value))}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />

                                <div className="flex justify-between text-sm mt-2">
                                    <span>Position Y</span>
                                    <span className="font-mono text-muted-foreground">{Math.round(transform.y)}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="-500"
                                    max="500"
                                    step="5"
                                    value={transform.y}
                                    onChange={(e) => handleChange('y', parseInt(e.target.value))}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="h-px bg-border my-2" />

                            {/* Background Color */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Background</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border shadow-sm">
                                        <input
                                            type="color"
                                            value={transform.backgroundColor || '#ffffff'}
                                            onChange={(e) => {
                                                onChange({
                                                    ...transform,
                                                    backgroundColor: e.target.value
                                                });
                                            }}
                                            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 cursor-pointer border-0"
                                        />
                                    </div>

                                    <button
                                        onClick={async () => {
                                            if (!window.EyeDropper) {
                                                if (onPickColor) {
                                                    onPickColor();
                                                } else {
                                                    console.warn('EyeDropper API not supported and no fallback provided');
                                                }
                                                return;
                                            }
                                            try {
                                                const eyeDropper = new window.EyeDropper();
                                                const result = await eyeDropper.open();
                                                onChange({
                                                    ...transform,
                                                    backgroundColor: result.sRGBHex
                                                });
                                            } catch (e) {
                                                console.log('EyeDropper canceled', e);
                                            }
                                        }}
                                        className={`p-1.5 rounded-md transition-colors ${isPickingColor
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                            }`}
                                        title="Pick color"
                                    >
                                        <Pipette className="w-4 h-4" />
                                    </button>

                                    <div className="text-xs font-mono text-muted-foreground">
                                        {transform.backgroundColor || 'Transparent'}
                                    </div>
                                    <button
                                        onClick={() => onChange({ ...transform, backgroundColor: '' })}
                                        className="text-xs ml-auto text-muted-foreground hover:text-red-500"
                                        title="Clear Color"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
