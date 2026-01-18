
import { useState, useMemo, useEffect } from 'react';
import { Search, X, Type } from 'lucide-react';
import { GOOGLE_FONTS, getGoogleFontUrl } from '../utils/fonts';
import { cn } from '../utils/cn';

interface FontPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (font: string) => void;
    currentFont?: string;
}

export const FontPicker = ({ isOpen, onClose, onSelect, currentFont }: FontPickerProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Load preview fonts
    useEffect(() => {
        if (!isOpen) return;

        // Load top 10 fonts or filtered list to avoid massive request
        // For now, let's just load them all in one go or batches? 
        // 50 fonts is okay for a single request if we just want previews.
        const url = getGoogleFontUrl(GOOGLE_FONTS.map(f => f.value));
        if (url) {
            const link = document.createElement('link');
            link.href = url;
            link.rel = 'stylesheet';
            document.head.appendChild(link);

            return () => {
                document.head.removeChild(link);
            };
        }
    }, [isOpen]);

    const filteredFonts = useMemo(() => {
        return GOOGLE_FONTS.filter(font => {
            const matchesSearch = font.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || font.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col border border-border overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Type className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-lg font-bold">Select Font</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-border space-y-4 bg-muted/30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search fonts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {['all', 'serif', 'sans-serif', 'display', 'handwriting', 'monospace'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors border",
                                    selectedCategory === cat
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-background text-muted-foreground border-border hover:border-indigo-300"
                                )}
                            >
                                {cat.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredFonts.map(font => (
                            <button
                                key={font.value}
                                onClick={() => onSelect(font.value)}
                                className={cn(
                                    "text-left p-4 rounded-xl border transition-all hover:shadow-md group",
                                    currentFont === font.value
                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500"
                                        : "border-border bg-card hover:border-indigo-300"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-indigo-500 transition-colors uppercase tracking-wider">
                                        {font.name}
                                    </span>
                                    {currentFont === font.value && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    )}
                                </div>
                                <div
                                    className="text-2xl truncate leading-normal"
                                    style={{ fontFamily: font.value }}
                                >
                                    The quick brown fox
                                </div>
                                <div
                                    className="text-sm truncate opacity-70 mt-1"
                                    style={{ fontFamily: font.value }}
                                >
                                    1234567890
                                </div>
                            </button>
                        ))}
                    </div>
                    {filteredFonts.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <p>No fonts found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
