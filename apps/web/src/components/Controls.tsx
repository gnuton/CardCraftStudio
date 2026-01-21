import React, { useState } from 'react';
import { ResolvedImage } from './ResolvedImage';
import { Upload, X, Type, Image as ImageIcon, FileText } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { ImageProviderDialog } from './ImageProviderDialog/ImageProviderDialog';
import type { DeckStyle } from '../types/deck';
import type { CardConfig } from './CardStudio';

interface ControlsProps {
    config: CardConfig;
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
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [activeImageField, setActiveImageField] = useState<string | null>(null);

    // Scroll to selected element
    React.useEffect(() => {
        if (selectedElement) {
            const element = document.getElementById(`control-section-${selectedElement}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [selectedElement]);

    const handleOpenImageDialog = (elementId: string) => {
        setActiveImageField(elementId);
        setIsImageDialogOpen(true);
    };

    const handleImageSelect = (ref: string) => {
        if (activeImageField) {
            onChange(activeImageField, ref);
            setIsImageDialogOpen(false);
            setActiveImageField(null);
        }
    };

    return (
        <div className="w-full h-full bg-card p-6 border-r border-border overflow-y-auto overflow-x-hidden custom-scrollbar">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Card Editor</h1>

            <div className="space-y-6">
                {/* Element Selection Indicator */}
                {selectedElement && (
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 capitalize">
                                    Editing: {deckStyle.elements.find(e => e.id === selectedElement)?.name || selectedElement}
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

                {/* Dynamic Controls List */}
                <div className="space-y-6">
                    {deckStyle.elements.map(element => {
                        const isSelected = selectedElement === element.id;
                        const wrapperClass = isSelected
                            ? 'ring-2 ring-indigo-500 bg-indigo-500/10 rounded-lg p-3 -m-3 transition-all'
                            : 'transition-all';

                        return (
                            <div
                                key={element.id}
                                id={`control-section-${element.id}`}
                                className={wrapperClass}
                            >
                                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                    {element.type === 'text' && <Type className="w-3 h-3" />}
                                    {element.type === 'multiline' && <FileText className="w-3 h-3" />}
                                    {element.type === 'image' && <ImageIcon className="w-3 h-3" />}
                                    {element.name}
                                </label>

                                {element.type === 'image' ? (
                                    <div className="space-y-3">
                                        {config.data[element.id] ? (
                                            <div className="relative group">
                                                <ResolvedImage
                                                    src={config.data[element.id]}
                                                    alt={element.name}
                                                    className="w-full h-32 object-contain rounded-lg border border-border bg-muted/50"
                                                />
                                                <button
                                                    onClick={() => onChange(element.id, '')}
                                                    className="absolute top-2 right-2 text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded shadow-lg hover:bg-destructive/90 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => handleOpenImageDialog(element.id)}
                                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-xl cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-6 h-6 text-muted-foreground/50 mb-2" />
                                                    <span className="text-xs text-muted-foreground">Add Image</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : element.type === 'multiline' ? (
                                    <RichTextEditor
                                        value={config.data[element.id] || ''}
                                        onChange={(value) => onChange(element.id, value)}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={config.data[element.id] || ''}
                                        onChange={(e) => onChange(element.id, e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                                        placeholder={`Enter ${element.name}...`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="pt-6 border-t border-border mt-8">
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

            <ImageProviderDialog
                isOpen={isImageDialogOpen}
                onClose={() => setIsImageDialogOpen(false)}
                onImageSelect={handleImageSelect}
            />
        </div>
    );
};
