import React from 'react';
import { Upload, X } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import type { DeckStyle } from '../App';

interface ControlsProps {
    config: {
        borderColor: string;
        borderWidth: number;
        topLeftContent: string;
        bottomRightContent: string;
        topLeftImage: string | null;
        bottomRightImage: string | null;
        centerImage: string | null;
        title: string;
        description: string;
        typeBarContent?: string;
        flavorTextContent?: string;
        statsBoxContent?: string;
        collectorInfoContent?: string;
    };
    onChange: (key: string, value: any) => void;
    onGenerateSvg: () => void;
    isGenerating: boolean;
    deckStyle: DeckStyle;
    selectedElement?: string | null;
    onClearSelection?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
    config,
    onChange,
    onGenerateSvg,
    isGenerating,
    deckStyle,
    selectedElement,
    onClearSelection
}) => {

    const handleImageUpload = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange(key, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Map card element names to control section names
    const elementSectionMap: Record<string, string> = {
        corner: 'corner',
        reversedCorner: 'corner',
        title: 'title',
        description: 'description',
        typeBar: 'typeBar',
        flavorText: 'flavorText',
        statsBox: 'statsBox',
        collectorInfo: 'collectorInfo',
        art: 'art',
    };

    // Check if a section should be highlighted
    const isHighlighted = (sectionName: string) => {
        if (!selectedElement) return false;
        return elementSectionMap[selectedElement] === sectionName;
    };

    // Get highlight classes for a section
    const getHighlightClasses = (sectionName: string) => {
        return isHighlighted(sectionName)
            ? 'ring-2 ring-indigo-500 bg-indigo-500/10 rounded-lg p-3 -m-3 transition-all'
            : 'transition-all';
    };

    return (
        <div className="w-full h-full bg-card p-6 border-r border-border overflow-y-auto overflow-x-hidden">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Card Editor</h1>

            <div className="space-y-6">
                {/* Element Selection Indicator - shown when an element is selected */}
                {selectedElement && (
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 capitalize">
                                    {selectedElement.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                            </div>
                            <button
                                onClick={onClearSelection}
                                className="p-1.5 hover:bg-indigo-500/20 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                title="Clear selection"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Edit the content below or double-click on the card to edit inline.
                        </p>
                    </div>
                )}

                {/* Border Settings Removed - enforced to 1px Black */
                }

                {/* Content Settings */}
                {deckStyle.showCorner && (
                    <div className={`space-y-3 ${getHighlightClasses('corner')}`}>
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Corner Content</label>
                        <div className="space-y-4">
                            {config.topLeftImage ? (
                                <div className="relative group">
                                    <img src={config.topLeftImage} alt="Corner" className="w-full h-24 object-cover rounded-lg border border-border shadow-sm" />
                                    <button
                                        onClick={() => onChange('topLeftImage', null)}
                                        className="absolute top-2 right-2 text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded shadow-lg hover:bg-destructive/90 transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={config.topLeftContent}
                                        onChange={(e) => {
                                            onChange('topLeftContent', e.target.value);
                                            onChange('bottomRightContent', e.target.value);
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                                        maxLength={3}
                                        placeholder="Corner Text (e.g., A, 10, 心)"
                                    />
                                    <label className="flex flex-col items-center justify-center w-full h-16 border border-dashed border-input rounded-lg cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Upload className="w-4 h-4" />
                                            <span>Upload Corner Image</span>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    const result = reader.result as string;
                                                    onChange('topLeftImage', result);
                                                    onChange('bottomRightImage', result);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Text Features */}
                {(deckStyle.showTitle || deckStyle.showDescription || deckStyle.showTypeBar || deckStyle.showFlavorText || deckStyle.showStatsBox || deckStyle.showCollectorInfo) && (
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Card Content</label>
                        <div className="space-y-4">
                            {deckStyle.showTitle && (
                                <div className={getHighlightClasses('title')}>
                                    <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                                    <input
                                        type="text"
                                        value={config.title}
                                        onChange={(e) => onChange('title', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                                        placeholder="Enter card title..."
                                    />
                                </div>
                            )}
                            {deckStyle.showDescription && (
                                <div className={getHighlightClasses('description')}>
                                    <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                                    <RichTextEditor
                                        value={config.description}
                                        onChange={(value) => onChange('description', value)}
                                    />
                                </div>
                            )}
                            {deckStyle.showTypeBar && (
                                <div className={getHighlightClasses('typeBar')}>
                                    <label className="text-xs text-muted-foreground mb-1 block">Type Bar</label>
                                    <input
                                        type="text"
                                        value={config['typeBarContent'] || ''}
                                        onChange={(e) => onChange('typeBarContent', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                                        placeholder="Type - Subtype"
                                    />
                                </div>
                            )}
                            {deckStyle.showFlavorText && (
                                <div className={getHighlightClasses('flavorText')}>
                                    <label className="text-xs text-muted-foreground mb-1 block">Flavor Text</label>
                                    <textarea
                                        value={config['flavorTextContent'] || ''}
                                        onChange={(e) => onChange('flavorTextContent', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all min-h-[60px]"
                                        placeholder="Card flavor text..."
                                    />
                                </div>
                            )}
                            {(deckStyle.showStatsBox || deckStyle.showCollectorInfo) && (
                                <div className="grid grid-cols-2 gap-4">
                                    {deckStyle.showStatsBox && (
                                        <div className={getHighlightClasses('statsBox')}>
                                            <label className="text-xs text-muted-foreground mb-1 block">Stats</label>
                                            <input
                                                type="text"
                                                value={config['statsBoxContent'] || ''}
                                                onChange={(e) => onChange('statsBoxContent', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                                                placeholder="1 / 1"
                                            />
                                        </div>
                                    )}
                                    {deckStyle.showCollectorInfo && (
                                        <div className={getHighlightClasses('collectorInfo')}>
                                            <label className="text-xs text-muted-foreground mb-1 block">Collector Info</label>
                                            <input
                                                type="text"
                                                value={config['collectorInfoContent'] || ''}
                                                onChange={(e) => onChange('collectorInfoContent', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                                                placeholder="Artist | 001/100"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Image Upload */}
                {deckStyle.showArt && (
                    <div className={`space-y-3 ${getHighlightClasses('art')}`}>
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Illustration</label>
                        <div className="space-y-3">
                            {config.centerImage ? (
                                <div className="relative group">
                                    <img src={config.centerImage} alt="Center" className="w-full h-40 object-cover rounded-lg border border-border shadow-md" />
                                    <button
                                        onClick={() => onChange('centerImage', null)}
                                        className="absolute top-2 right-2 text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded shadow-lg hover:bg-destructive/90 transition-colors"
                                    >
                                        Remove Photo
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-input rounded-xl cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all border-spacing-4">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-muted-foreground/50 mb-2" />
                                        <p className="text-sm font-medium text-muted-foreground">Drop illustration here</p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG or SVG</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload('centerImage')} />
                                </label>
                            )}
                        </div>
                    </div>
                )}

                <div className="pt-6 border-t border-border">
                    <button
                        onClick={onGenerateSvg}
                        disabled={isGenerating}
                        className="w-full bg-card border border-border hover:bg-accent text-foreground font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <Upload className="w-4 h-4 rotate-180" />
                        Export SVG Layout
                    </button>
                </div>
            </div>
        </div>
    );
};
