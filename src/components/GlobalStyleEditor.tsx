import { useState } from 'react';
import { templateService } from '../services/templateService';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import type { CardConfig } from './CardStudio';
import type { DeckStyle } from '../App';
import { ArrowLeft, Save, Upload, Type, Palette, Layout, Check, Hash, AlertCircle, X, Move, RotateCw, Maximize } from 'lucide-react';
import { cn } from '../utils/cn';

interface GlobalStyleEditorProps {
    deckStyle: DeckStyle;
    sampleCard?: CardConfig;
    onUpdateStyle: (style: DeckStyle) => void;
    onUpdateStyleAndSync?: (style: DeckStyle) => Promise<void>;
    onBack: () => void;
}

const FONTS = [
    { name: 'Serif', value: 'serif' },
    { name: 'Sans Serif', value: 'sans-serif' },
    { name: 'Monospace', value: 'monospace' },
    { name: 'Cursive', value: 'cursive' },
    { name: 'Outfit', value: 'Outfit, sans-serif' },
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto Slab', value: 'Roboto Slab, serif' }
];

const TEMPLATES = [
    {
        id: 'default',
        name: 'Default Clean',
        style: {
            cornerColor: '#0f172a',
            titleColor: '#1e293b',
            descriptionColor: '#334155',
            cornerFont: 'serif',
            titleFont: 'sans-serif',
            descriptionFont: 'sans-serif',
            backgroundImage: null,
            cornerContent: 'A',
            titleX: 0,
            titleY: 0,
            titleRotate: 0,
            titleScale: 1,
            titleWidth: 200,
            descriptionX: 0,
            descriptionY: 0,
            descriptionRotate: 0,
            descriptionScale: 1,
            descriptionWidth: 240,
            artX: 0,
            artY: 0,
            artWidth: 264,
            artHeight: 164
        }
    },
    {
        id: 'modern_blue',
        name: 'Modern Blue',
        style: {
            cornerColor: '#ffffff',
            titleColor: '#1e1b4b',
            descriptionColor: '#312e81',
            cornerFont: 'sans-serif',
            titleFont: 'Outfit, sans-serif',
            descriptionFont: 'Inter, sans-serif',
            backgroundImage: 'templates/modern_blue.svg',
            cornerContent: '10',
            titleX: 0,
            titleY: -5,
            titleRotate: 0,
            titleScale: 1,
            titleWidth: 220,
            descriptionX: 0,
            descriptionY: 0,
            descriptionRotate: 0,
            descriptionScale: 1,
            descriptionWidth: 260,
            artX: 0,
            artY: 0,
            artWidth: 264,
            artHeight: 164
        }
    },
    {
        id: 'golden_era',
        name: 'Golden Era',
        style: {
            cornerColor: '#ffffff',
            titleColor: '#78350f',
            descriptionColor: '#92400e',
            cornerFont: 'serif',
            titleFont: 'Roboto Slab, serif',
            descriptionFont: 'serif',
            backgroundImage: 'templates/golden_era.svg',
            cornerContent: 'K',
            titleX: 0,
            titleY: 5,
            titleRotate: 2,
            titleScale: 1.05,
            titleWidth: 180,
            descriptionX: 0,
            descriptionY: 10,
            descriptionRotate: 0,
            descriptionScale: 0.95,
            descriptionWidth: 240,
            artX: 0,
            artY: 0,
            artWidth: 264,
            artHeight: 164
        }
    },
    {
        id: 'mystic',
        name: 'Mystic Purple',
        style: {
            cornerColor: '#7c3aed',
            titleColor: '#5b21b6',
            descriptionColor: '#4c1d95',
            cornerFont: 'cursive',
            titleFont: 'serif',
            descriptionFont: 'serif',
            backgroundImage: null,
            cornerContent: '★',
            titleX: 0,
            titleY: 0,
            titleRotate: -3,
            titleScale: 1.1,
            titleWidth: 210,
            descriptionX: 0,
            descriptionY: 0,
            descriptionRotate: 0,
            descriptionScale: 1,
            descriptionWidth: 250,
            artX: 0,
            artY: 0,
            artWidth: 264,
            artHeight: 164
        }
    },
    {
        id: 'pocket_monster',
        name: 'Pocket Monster',
        style: {
            cornerColor: '#1a1a1a',
            titleColor: '#1a1a1a',
            descriptionColor: '#333333',
            cornerFont: 'Inter, sans-serif',
            titleFont: 'Outfit, sans-serif',
            descriptionFont: 'Inter, sans-serif',
            backgroundImage: 'templates/pocket_monster.svg',
            cornerContent: '180',
            titleX: 20,
            titleY: -110,
            titleRotate: 0,
            titleScale: 0.9,
            titleWidth: 160,
            descriptionX: 0,
            descriptionY: 45,
            descriptionRotate: 0,
            descriptionScale: 1,
            descriptionWidth: 250,
            artX: 0,
            artY: 0,
            artWidth: 264,
            artHeight: 164
        }
    }
];

export const GlobalStyleEditor = ({ deckStyle, sampleCard, onUpdateStyle, onUpdateStyleAndSync, onBack }: GlobalStyleEditorProps) => {
    const [currentStyle, setCurrentStyle] = useState<DeckStyle>(deckStyle);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const hasChanges = JSON.stringify(deckStyle) !== JSON.stringify(currentStyle);

    const previewCard: CardConfig = sampleCard || {
        id: 'preview',
        title: 'Hero of the Realm',
        description: 'When this card is played, all <b>friendly units</b> gain +1/+1 and <i>Vigilance</i> until the end of turn.',
        centerImage: null,
        topLeftContent: '', // Empty to show global fallback
        bottomRightContent: '',
        topLeftImage: null,
        bottomRightImage: null,
        borderColor: '#000000',
        borderWidth: 1
    };

    const handleStyleChange = (updates: Partial<DeckStyle>) => {
        const newStyle = { ...currentStyle, ...updates };
        setCurrentStyle(newStyle);
    };

    const handleSave = () => {
        onUpdateStyle(currentStyle);
        onBack();
    };

    const applyTemplate = async (templateStyle: DeckStyle) => {
        let finalStyle = { ...templateStyle };

        // If the template has an SVG background, try to extract layout markers
        if (templateStyle.backgroundImage?.endsWith('.svg')) {
            const baseUrl = import.meta.env.BASE_URL;
            const cleanPath = templateStyle.backgroundImage.startsWith('/')
                ? templateStyle.backgroundImage.slice(1)
                : templateStyle.backgroundImage;
            const fullUrl = `${baseUrl}${cleanPath}`;

            const layout = await templateService.parseSvgLayout(fullUrl);
            if (layout) {
                if (layout.title) {
                    finalStyle.titleX = Math.round(layout.title.offsetX);
                    finalStyle.titleY = Math.round(layout.title.offsetY);
                    finalStyle.titleWidth = Math.round(layout.title.width);
                    finalStyle.titleRotate = layout.title.rotation;
                }
                if (layout.description) {
                    finalStyle.descriptionX = Math.round(layout.description.offsetX);
                    finalStyle.descriptionY = Math.round(layout.description.offsetY);
                    finalStyle.descriptionWidth = Math.round(layout.description.width);
                    finalStyle.descriptionRotate = layout.description.rotation;
                }
                if (layout.centerImage) {
                    finalStyle.artX = Math.round(layout.centerImage.offsetX);
                    finalStyle.artY = Math.round(layout.centerImage.offsetY);
                    finalStyle.artWidth = Math.round(layout.centerImage.width);
                    finalStyle.artHeight = Math.round(layout.centerImage.height);
                }
                if (layout.topLeft) {
                    // Corner content is harder to move via translate as it's corner-anchored
                    // but we can at least ensure the style matches.
                }
            }
        }

        setCurrentStyle(finalStyle);
    };

    const handleBackClick = () => {
        if (hasChanges) {
            setShowConfirmDialog(true);
        } else {
            onBack();
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden animate-in fade-in duration-300">
            {/* Left Panel: Controls */}
            <div className="w-[450px] flex-shrink-0 h-full border-r border-border bg-card overflow-y-auto custom-scrollbar">
                <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
                    <button
                        onClick={handleBackClick}
                        className="p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Deck
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-bold shadow-lg shadow-indigo-500/20"
                    >
                        <Save className="w-4 h-4" />
                        Save Style
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Templates Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Layout className="w-4 h-4" />
                                Templates
                            </h3>
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">New</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => applyTemplate(template.style)}
                                    className={cn(
                                        "p-3 rounded-xl border text-left transition-all hover:shadow-md group relative h-24 flex flex-col justify-between overflow-hidden",
                                        currentStyle.backgroundImage === template.style.backgroundImage && currentStyle.cornerColor === template.style.cornerColor
                                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                                            : "border-border bg-muted/30"
                                    )}
                                >
                                    {template.style.backgroundImage && (
                                        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <img src={template.style.backgroundImage} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <span className="text-xs font-bold block relative z-10">{template.name}</span>
                                    <div className="flex gap-1 relative z-10">
                                        <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: template.style.cornerColor }}></div>
                                        <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: template.style.titleColor }}></div>
                                        <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: template.style.descriptionColor }}></div>
                                    </div>
                                    {currentStyle.backgroundImage === template.style.backgroundImage && currentStyle.cornerColor === template.style.cornerColor && (
                                        <Check className="absolute top-2 right-2 w-4 h-4 text-indigo-500 z-10" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    <hr className="border-border" />

                    {/* Corner Style */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            Corner Content
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/70">Global Text</label>
                                <input
                                    type="text"
                                    value={currentStyle.cornerContent}
                                    onChange={(e) => handleStyleChange({ cornerContent: e.target.value })}
                                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="e.g. A, 10, ★"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/70">Font Family</label>
                                <select
                                    value={currentStyle.cornerFont}
                                    onChange={(e) => handleStyleChange({ cornerFont: e.target.value })}
                                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/70">Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={currentStyle.cornerColor}
                                    onChange={(e) => handleStyleChange({ cornerColor: e.target.value })}
                                    className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer overflow-hidden"
                                />
                                <input
                                    type="text"
                                    value={currentStyle.cornerColor}
                                    onChange={(e) => handleStyleChange({ cornerColor: e.target.value })}
                                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono uppercase"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Title Style */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Title
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/70">Font Family</label>
                                <select
                                    value={currentStyle.titleFont}
                                    onChange={(e) => handleStyleChange({ titleFont: e.target.value })}
                                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/70">Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={currentStyle.titleColor}
                                        onChange={(e) => handleStyleChange({ titleColor: e.target.value })}
                                        className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer overflow-hidden"
                                    />
                                    <input
                                        type="text"
                                        value={currentStyle.titleColor}
                                        onChange={(e) => handleStyleChange({ titleColor: e.target.value })}
                                        className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Title Layout */}
                        <div className="bg-muted/30 rounded-xl p-3 space-y-3">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-1">
                                <Move className="w-3 h-3" /> Position & Size
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-foreground/60">Offset X/Y</label>
                                    <div className="flex gap-1">
                                        <input
                                            type="number"
                                            value={currentStyle.titleX}
                                            onChange={(e) => handleStyleChange({ titleX: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                                        />
                                        <input
                                            type="number"
                                            value={currentStyle.titleY}
                                            onChange={(e) => handleStyleChange({ titleY: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-foreground/60">Width</label>
                                    <input
                                        type="number"
                                        value={currentStyle.titleWidth}
                                        onChange={(e) => handleStyleChange({ titleWidth: parseInt(e.target.value) || 200 })}
                                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-foreground/60 flex items-center gap-1">
                                        <RotateCw className="w-3 h-3" /> Rotate
                                    </label>
                                    <input
                                        type="range"
                                        min="-180"
                                        max="180"
                                        value={currentStyle.titleRotate}
                                        onChange={(e) => handleStyleChange({ titleRotate: parseInt(e.target.value) || 0 })}
                                        className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-foreground/60 flex items-center gap-1">
                                        <Maximize className="w-3 h-3" /> Scale
                                    </label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2"
                                        step="0.05"
                                        value={currentStyle.titleScale}
                                        onChange={(e) => handleStyleChange({ titleScale: parseFloat(e.target.value) || 1 })}
                                        className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Description Style */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Type className="w-4 h-4" />
                            Description
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/70">Font Family</label>
                                <select
                                    value={currentStyle.descriptionFont}
                                    onChange={(e) => handleStyleChange({ descriptionFont: e.target.value })}
                                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/70">Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={currentStyle.descriptionColor}
                                        onChange={(e) => handleStyleChange({ descriptionColor: e.target.value })}
                                        className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer overflow-hidden"
                                    />
                                    <input
                                        type="text"
                                        value={currentStyle.descriptionColor}
                                        onChange={(e) => handleStyleChange({ descriptionColor: e.target.value })}
                                        className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description Layout */}
                        <div className="bg-muted/30 rounded-xl p-3 space-y-3">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-1">
                                <Move className="w-3 h-3" /> Position & Size
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-foreground/60">Offset X/Y</label>
                                    <div className="flex gap-1">
                                        <input
                                            type="number"
                                            value={currentStyle.descriptionX}
                                            onChange={(e) => handleStyleChange({ descriptionX: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                                        />
                                        <input
                                            type="number"
                                            value={currentStyle.descriptionY}
                                            onChange={(e) => handleStyleChange({ descriptionY: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-foreground/60">Width</label>
                                    <input
                                        type="number"
                                        value={currentStyle.descriptionWidth}
                                        onChange={(e) => handleStyleChange({ descriptionWidth: parseInt(e.target.value) || 250 })}
                                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-foreground/60 flex items-center gap-1">
                                        <RotateCw className="w-3 h-3" /> Rotate
                                    </label>
                                    <input
                                        type="range"
                                        min="-180"
                                        max="180"
                                        value={currentStyle.descriptionRotate}
                                        onChange={(e) => handleStyleChange({ descriptionRotate: parseInt(e.target.value) || 0 })}
                                        className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-foreground/60 flex items-center gap-1">
                                        <Maximize className="w-3 h-3" /> Scale
                                    </label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2"
                                        step="0.05"
                                        value={currentStyle.descriptionScale}
                                        onChange={(e) => handleStyleChange({ descriptionScale: parseFloat(e.target.value) || 1 })}
                                        className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Background Section */}
                    <section className="space-y-4 pb-10">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Card Background
                        </h3>
                        <div className="space-y-3">
                            {currentStyle.backgroundImage ? (
                                <div className="relative group rounded-xl overflow-hidden border border-border aspect-video">
                                    <img src={currentStyle.backgroundImage} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                        <button
                                            onClick={() => handleStyleChange({ backgroundImage: null })}
                                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                                        >
                                            Remove Background
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                                    <span className="text-xs font-semibold text-muted-foreground">Upload Image</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => handleStyleChange({ backgroundImage: reader.result as string });
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Right Panel: Live Preview */}
            <div className="flex-1 h-full bg-muted/20 relative flex items-center justify-center p-10 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground))_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="transform scale-[1.25] shadow-[0_0_50px_rgba(0,0,0,0.15)] rounded-xl transition-all duration-500 hover:scale-[1.28]">
                        <Card {...previewCard} deckStyle={currentStyle} />
                    </div>

                    <div className="bg-card/80 backdrop-blur border border-border px-8 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-1">
                        <p className="text-sm font-bold text-foreground">Global Deck Style Preview</p>
                        <p className="text-xs text-muted-foreground font-medium">Any changes here will apply to all cards in this deck.</p>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AnimatePresence>
                {showConfirmDialog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConfirmDialog(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden z-10"
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">Unsaved Changes</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            You've modified the global deck style. Would you like to save these changes before leaving?
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={async () => {
                                            if (onUpdateStyleAndSync) {
                                                await onUpdateStyleAndSync(currentStyle);
                                            } else {
                                                onUpdateStyle(currentStyle);
                                            }
                                            setShowConfirmDialog(false);
                                            onBack();
                                        }}
                                        className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save & Sync Changes
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowConfirmDialog(false);
                                            onBack();
                                        }}
                                        className="w-full px-4 py-3 bg-muted text-foreground rounded-xl font-bold hover:bg-muted/80 transition-colors"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmDialog(false)}
                                        className="w-full px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                                    >
                                        Keep Editing
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
