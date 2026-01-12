import React from 'react';
import { Upload } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

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
    };
    onChange: (key: string, value: any) => void;
    onGenerateSvg: () => void;
    isGenerating: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ config, onChange, onGenerateSvg, isGenerating }) => {

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

    return (
        <div className="w-full h-full bg-card p-6 border-r border-border overflow-y-auto overflow-x-hidden">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Card Editor</h1>

            <div className="space-y-6">
                {/* Border Settings Removed - enforced to 1px Black */
                }

                {/* Content Settings */}
                <div className="space-y-3">
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

                {/* Text Features */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Card Content</label>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                            <input
                                type="text"
                                value={config.title}
                                onChange={(e) => onChange('title', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                                placeholder="Enter card title..."
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                            <RichTextEditor
                                value={config.description}
                                onChange={(value) => onChange('description', value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
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
