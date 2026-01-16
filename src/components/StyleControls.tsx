import type { DeckStyle } from '../App';
import { Palette, Box, Layers, Eye } from 'lucide-react';

interface StyleControlsProps {
    prefix: 'title' | 'description' | 'art' | 'corner' | 'reversedCorner';
    currentStyle: DeckStyle;
    onUpdate: (updates: Partial<DeckStyle>) => void;
}

export const StyleControls = ({ prefix, currentStyle, onUpdate }: StyleControlsProps) => {
    // Helper to genericize access
    const get = (key: string) => (currentStyle as any)[`${prefix}${key}`];
    const update = (key: string, val: any) => onUpdate({ [`${prefix}${key}`]: val });

    return (
        <div className="space-y-6">
            {/* Background & Opacity */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                    <Palette className="w-3 h-3 text-indigo-500" />
                    <h4 className="text-xs font-bold text-muted-foreground uppercase">Appearance</h4>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground/70">Background Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={get('BackgroundColor') || '#ffffff'}
                            onChange={(e) => update('BackgroundColor', e.target.value)}
                            className="w-8 h-8 rounded border-0 p-0 cursor-pointer overflow-hidden flex-shrink-0"
                        />
                        <input
                            type="text"
                            placeholder="transparent"
                            value={get('BackgroundColor') || ''}
                            onChange={(e) => update('BackgroundColor', e.target.value)}
                            className="flex-1 bg-muted border border-border rounded px-2 py-1 text-xs"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground/70 flex items-center justify-between">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Opacity</span>
                        <span className="text-[10px] text-muted-foreground">{Math.round((get('Opacity') ?? 1) * 100)}%</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={get('Opacity') ?? 1}
                        onChange={(e) => update('Opacity', parseFloat(e.target.value))}
                        className="w-full accent-indigo-600"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground/70 flex items-center justify-between">
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Z-Index (Layer)</span>
                        <span className="text-[10px] text-muted-foreground">{get('ZIndex') ?? 0}</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={get('ZIndex') ?? 0}
                        onChange={(e) => update('ZIndex', parseInt(e.target.value))}
                        className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Back</span>
                        <span>Front</span>
                    </div>
                </div>
            </div>

            {/* Border */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                    <Box className="w-3 h-3 text-indigo-500" />
                    <h4 className="text-xs font-bold text-muted-foreground uppercase">Border</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] text-foreground/60">Color</label>
                        <div className="flex gap-1">
                            <input
                                type="color"
                                value={get('BorderColor') || '#000000'}
                                onChange={(e) => update('BorderColor', e.target.value)}
                                className="w-6 h-6 rounded border-0 p-0 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={get('BorderColor') || ''}
                                onChange={(e) => update('BorderColor', e.target.value)}
                                className="w-full bg-muted border border-border rounded px-1 py-1 text-[10px]"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-foreground/60">Width (px)</label>
                        <input
                            type="number"
                            min="0"
                            value={get('BorderWidth') ?? 0}
                            onChange={(e) => update('BorderWidth', parseFloat(e.target.value))}
                            className="w-full bg-muted border border-border rounded px-2 py-1 text-xs"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] text-foreground/60">Style</label>
                    <select
                        value={get('BorderStyle') || 'solid'}
                        onChange={(e) => update('BorderStyle', e.target.value)}
                        className="w-full bg-muted border border-border rounded px-2 py-1 text-xs"
                    >
                        <option value="none">None</option>
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="double">Double</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
