import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Layout, Search, Grid } from 'lucide-react';
import { Card } from './Card';
import { TEMPLATES } from '../constants/templates';
import type { DeckTemplate } from '../types/template';
import { cn } from '../utils/cn';


interface TemplatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: DeckTemplate) => void;
    currentTemplateId?: string;
    customTemplates?: DeckTemplate[];
    isFlipped?: boolean; // To filter front/back/both
}

export const TemplatePickerModal = ({
    isOpen,
    onClose,
    onSelect,
    currentTemplateId,
    customTemplates = [],
    isFlipped = false
}: TemplatePickerModalProps) => {
    const [selectedTemplate, setSelectedTemplate] = useState<DeckTemplate | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const allTemplates = [...TEMPLATES, ...customTemplates];
    const filteredTemplates = allTemplates
        .filter(t => !t.side || t.side === 'both' || (isFlipped ? t.side === 'back' : t.side === 'front'))
        .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Set initial selection when opening
    useEffect(() => {
        if (isOpen) {
            const found = allTemplates.find(t => t.id === currentTemplateId);
            if (found) {
                setSelectedTemplate(found);
            } else if (filteredTemplates.length > 0) {
                setSelectedTemplate(filteredTemplates[0]);
            }
        }
    }, [isOpen, currentTemplateId]);

    const handleApply = () => {
        if (selectedTemplate) {
            onSelect(selectedTemplate);
            onClose();
        }
    };

    const previewCardData = {
        id: 'preview',
        name: 'Template Preview',
        data: {
            title: 'Card Title',
            description: 'This is how your cards will look with this template applied.',
            art: '',
            corner: '1',
            back_title: 'GAME TITLE'
        },
        borderColor: '#000000',
        borderWidth: 0
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-5xl h-[80vh] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border bg-card">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Layout className="w-6 h-6 text-indigo-500" />
                                    Choose {isFlipped ? 'Back' : 'Front'} Template
                                </h2>
                                <p className="text-muted-foreground mt-1">Select a visual style for your card deck.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Left: Template List */}
                            <div className="w-80 flex-shrink-0 border-r border-border bg-card/50 flex flex-col">
                                <div className="p-4 border-b border-border">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search templates..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                                    {filteredTemplates.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => setSelectedTemplate(template)}
                                            className={cn(
                                                "w-full p-3 rounded-xl border text-left transition-all group relative flex items-center gap-3",
                                                selectedTemplate?.id === template.id
                                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/20"
                                                    : "border-transparent hover:bg-muted"
                                            )}
                                        >
                                            {/* Mini Thumbnail */}
                                            <div className="w-10 h-10 rounded-lg border border-border overflow-hidden bg-background flex-shrink-0 relative">
                                                {((isFlipped && template.style.cardBackImage) || (!isFlipped && template.style.backgroundImage)) ? (
                                                    <img
                                                        src={(isFlipped ? template.style.cardBackImage : template.style.backgroundImage) || ''}
                                                        className="w-full h-full object-cover"
                                                        alt=""
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                                        <Grid className="w-4 h-4 opacity-50" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className={cn("font-bold text-sm truncate", selectedTemplate?.id === template.id ? "text-indigo-600 dark:text-indigo-400" : "text-foreground")}>
                                                    {template.name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {template.isOfficial ? 'Official' : 'Custom'}
                                                </div>
                                            </div>

                                            {selectedTemplate?.id === template.id && (
                                                <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-sm">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            )}
                                        </button>
                                    ))}

                                    {filteredTemplates.length === 0 && (
                                        <div className="px-4 py-8 text-center text-muted-foreground">
                                            <p className="text-sm">No templates found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Live Preview */}
                            <div className="flex-1 bg-muted/20 relative flex flex-col items-center justify-center p-8 overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground))_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>

                                {selectedTemplate ? (
                                    <div className="relative z-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                                        <div className="shadow-2xl rounded-xl ring-1 ring-black/5">
                                            <Card
                                                {...previewCardData}
                                                deckStyle={selectedTemplate.style}
                                                renderMode={isFlipped ? 'back' : 'front'} // Force render mode for check
                                                isFlipped={isFlipped} // Also pass flipped state
                                                isInteractive={false}
                                                parentScale={1.5}
                                            />
                                        </div>
                                        <div className="text-center max-w-md">
                                            <h3 className="text-lg font-bold text-foreground">{selectedTemplate.name}</h3>
                                            <div className="flex items-center justify-center gap-2 mt-2">
                                                <div className="flex gap-1">
                                                    <div className="w-4 h-4 rounded-full border border-border shadow-sm" style={{ backgroundColor: selectedTemplate.style.backgroundColor }} title="Background"></div>
                                                    <div className="w-4 h-4 rounded-full border border-border shadow-sm" style={{ backgroundColor: selectedTemplate.style.borderColor }} title="Border"></div>
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    Color Palette
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <Layout className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                        <p>Select a template to view preview</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-card border-t border-border flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={!selectedTemplate}
                                className="px-8 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                            >
                                Apply Template
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
