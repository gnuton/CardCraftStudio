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
        <div className="w-full h-full bg-white p-6 border-r border-border overflow-y-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Card Studio</h1>

            <div className="space-y-6">
                {/* Border Settings Removed - enforced to 1px Black */
                }

                {/* Content Settings */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">Corner Content (Top-Left & Bottom-Right)</label>
                    <div>
                        {config.topLeftImage ? (
                            <div className="relative">
                                <img src={config.topLeftImage} alt="Corner" className="w-full h-24 object-cover rounded border" />
                                <button
                                    onClick={() => onChange('topLeftImage', null)}
                                    className="absolute top-1 right-1 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="text"
                                    value={config.topLeftContent}
                                    onChange={(e) => {
                                        onChange('topLeftContent', e.target.value);
                                        onChange('bottomRightContent', e.target.value);
                                    }}
                                    className="w-full px-3 py-2 rounded border border-input focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm mb-2"
                                    maxLength={3}
                                    placeholder="Text (e.g., A, K, Q)"
                                />
                                <label className="flex items-center justify-center w-full h-12 border border-dashed border-input rounded cursor-pointer hover:bg-slate-50 text-xs text-slate-500">
                                    <Upload className="w-4 h-4 mr-1" /> Upload Image for Corners
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
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload('centerImage')} />
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
                            onClick={onGenerateSvg}
                            disabled={isGenerating}
                            className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Export SVG
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
