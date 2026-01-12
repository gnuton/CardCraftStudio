import React from 'react';
import { Upload } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface ControlsProps {
    config: {
        borderColor: string;
        borderWidth: number;
        topLeftContent: string;
        bottomRightContent: string;
        centerImage: string | null;
        title: string;
        description: string;
    };
    onChange: (key: string, value: any) => void;
    onGeneratePdf: () => void;
    onGenerateSvg: () => void;
    isGenerating: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ config, onChange, onGeneratePdf, onGenerateSvg, isGenerating }) => {

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange('centerImage', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="w-full h-full bg-white p-6 border-r border-border overflow-y-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Card Studio</h1>

            <div className="space-y-6">
                {/* Border Settings */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">Border Settings</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Color</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={config.borderColor}
                                    onChange={(e) => onChange('borderColor', e.target.value)}
                                    className="h-9 w-full cursor-pointer rounded border border-input p-1"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Width ({config.borderWidth}px)</label>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                value={config.borderWidth}
                                onChange={(e) => onChange('borderWidth', parseInt(e.target.value))}
                                className="w-full mt-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Settings */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">Corner Content</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Top Left</label>
                            <input
                                type="text"
                                value={config.topLeftContent}
                                onChange={(e) => onChange('topLeftContent', e.target.value)}
                                className="w-full px-3 py-2 rounded border border-input focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                maxLength={3}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Bottom Right</label>
                            <input
                                type="text"
                                value={config.bottomRightContent}
                                onChange={(e) => onChange('bottomRightContent', e.target.value)}
                                className="w-full px-3 py-2 rounded border border-input focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                maxLength={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Text Features */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">Card Text</label>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Title</label>
                        <input
                            type="text"
                            value={config.title}
                            onChange={(e) => onChange('title', e.target.value)}
                            className="w-full px-3 py-2 rounded border border-input focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            placeholder="Card Title"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Description</label>
                        <RichTextEditor
                            value={config.description}
                            onChange={(value) => onChange('description', value)}
                        />
                    </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">Center Image</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-xs text-slate-500">Click to upload image</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    {config.centerImage && (
                        <button
                            onClick={() => onChange('centerImage', null)}
                            className="text-xs text-red-500 hover:text-red-600 font-medium"
                        >
                            Remove Image
                        </button>
                    )}
                </div>

                <div className="pt-6 border-t border-border">
                    <div className="flex gap-2">
                        <button
                            onClick={onGeneratePdf}
                            disabled={isGenerating}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? 'Generating...' : 'Download PDF'}
                        </button>
                        <button
                            onClick={onGenerateSvg}
                            disabled={isGenerating}
                            className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Export SVG
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">PDF: 9 cards on A4 | SVG: Single card</p>
                </div>

            </div>
        </div>
    );
};
