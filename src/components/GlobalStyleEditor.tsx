import { useState, useEffect } from 'react';
import { templateService } from '../services/templateService';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import type { CardConfig } from './CardStudio';
import type { DeckStyle } from '../App';
import { ArrowLeft, Save, Upload, Type, Palette, Layout, Check, Hash, AlertCircle, X, Settings, Shield, Heart, Zap, Box, PenTool } from 'lucide-react';
import { cn } from '../utils/cn';
import { driveService } from '../services/googleDrive';
import { Download, Cloud, Loader2 } from 'lucide-react';
import { StyleControls } from './StyleControls';

interface Template {
    id: string;
    name: string;
    style: DeckStyle;
    isCustom?: boolean;
}

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

const TEMPLATES: Template[] = [
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
            artHeight: 164,
            showCorner: true,
            cornerX: -125,
            cornerY: -185,
            cornerRotate: 0,
            cornerWidth: 40,
            cornerHeight: 40,
            showReversedCorner: true,
            reversedCornerX: 125,
            reversedCornerY: 185,
            reversedCornerRotate: 180,
            reversedCornerWidth: 40,
            reversedCornerHeight: 40,
            gameHp: '20',
            gameMana: '10',
            gameSuit: '♥',
            svgFrameColor: '#0f172a',
            svgCornerColor: '#0f172a',
            svgStrokeWidth: 2
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
            artHeight: 164,
            showCorner: true,
            cornerX: -125,
            cornerY: -185,
            cornerRotate: 0,
            cornerWidth: 40,
            cornerHeight: 40,
            showReversedCorner: true,
            reversedCornerX: 125,
            reversedCornerY: 185,
            reversedCornerRotate: 180,
            reversedCornerWidth: 40,
            reversedCornerHeight: 40,
            gameHp: '30',
            gameMana: '5',
            gameSuit: '♠',
            svgFrameColor: '#1e1b4b',
            svgCornerColor: '#1e1b4b',
            svgStrokeWidth: 2
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
            artHeight: 164,
            showCorner: true,
            cornerX: -130,
            cornerY: -190,
            cornerRotate: 0,
            cornerWidth: 30,
            cornerHeight: 30,
            showReversedCorner: true,
            reversedCornerX: 130,
            reversedCornerY: 190,
            reversedCornerRotate: 180,
            reversedCornerWidth: 30,
            reversedCornerHeight: 30,
            gameHp: '12',
            gameMana: '8',
            gameSuit: '♦',
            svgFrameColor: '#78350f',
            svgCornerColor: '#b45309',
            svgStrokeWidth: 3
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
            artHeight: 164,
            showCorner: true,
            cornerX: -125,
            cornerY: -185,
            cornerRotate: 0,
            cornerWidth: 40,
            cornerHeight: 40,
            showReversedCorner: true,
            reversedCornerX: 125,
            reversedCornerY: 185,
            reversedCornerRotate: 180,
            reversedCornerWidth: 40,
            reversedCornerHeight: 40,
            gameHp: '99',
            gameMana: '99',
            gameSuit: '★',
            svgFrameColor: '#7c3aed',
            svgCornerColor: '#5b21b6',
            svgStrokeWidth: 2
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
            artHeight: 164,
            showCorner: true,
            cornerX: 118,
            cornerY: -184,
            cornerRotate: 0,
            cornerWidth: 35,
            cornerHeight: 28,
            showReversedCorner: true,
            reversedCornerX: -100,
            reversedCornerY: 195,
            reversedCornerRotate: 0,
            reversedCornerWidth: 60,
            reversedCornerHeight: 10,
            gameHp: '180',
            gameMana: '100',
            gameSuit: '●',
            svgFrameColor: '#1a1a1a',
            svgCornerColor: '#eab308',
            svgStrokeWidth: 4
        }
    }
];

export const GlobalStyleEditor = ({ deckStyle, sampleCard, onUpdateStyle, onUpdateStyleAndSync, onBack }: GlobalStyleEditorProps) => {
    const [currentStyle, setCurrentStyle] = useState<DeckStyle>(deckStyle);
    const [selectedElement, setSelectedElement] = useState<'background' | 'corner' | 'title' | 'art' | 'description' | 'reversedCorner' | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [customTemplates, setCustomTemplates] = useState<Template[]>([]);

    const hasChanges = JSON.stringify(deckStyle) !== JSON.stringify(currentStyle);

    const fetchCustomTemplates = async () => {
        if (!driveService.isSignedIn) return;

        try {
            const files = await driveService.listFiles();
            // Filter for SVGs that are not deck JSONs
            const svgFiles = files.filter(f => f.name.endsWith('.svg'));

            const templates = await Promise.all(svgFiles.map(async (file) => {
                const blob = await driveService.getFileBlob(file.id);
                const url = URL.createObjectURL(blob);

                return {
                    id: file.id,
                    name: file.name.replace('.svg', '').replace(/_/g, ' '),
                    style: {
                        ...TEMPLATES[0].style, // Use default style as base
                        backgroundImage: url,
                    },
                    isCustom: true
                };
            }));

            setCustomTemplates(templates);
        } catch (error) {
            console.error("Failed to fetch custom templates:", error);
        }
    };

    // Fetch custom templates from Drive
    useEffect(() => {
        fetchCustomTemplates();
    }, []);

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

    const handleDownloadSVG = async () => {
        if (!newTemplateName.trim()) return;
        const svgContent = await templateService.generateSvgWithLayout(
            currentStyle.backgroundImage,
            currentStyle
        );
        const fileName = `${newTemplateName.trim().replace(/\s+/g, '_').toLowerCase()}.svg`;

        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSave = () => {
        if (hasChanges) {
            setShowSaveTemplateModal(true);
        } else {
            onUpdateStyle(currentStyle);
            onBack();
        }
    };

    const handleSaveNewTemplate = async () => {
        if (!newTemplateName.trim()) return;

        setIsSaving(true);
        try {
            // 1. Generate the SVG content with markers
            const svgContent = await templateService.generateSvgWithLayout(
                currentStyle.backgroundImage,
                currentStyle
            );

            const fileName = `${newTemplateName.trim().replace(/\s+/g, '_').toLowerCase()}.svg`;

            // 2. Sync to GDrive if signed in
            if (driveService.isSignedIn) {
                const fileId = await driveService.saveBlob(fileName, new Blob([svgContent], { type: 'image/svg+xml' }));

                // Fetch the new file for immediate use
                const blob = await driveService.getFileBlob(fileId);
                const url = URL.createObjectURL(blob);

                // Update current style to use the NEWLY CREATED GDrive SVG!
                const updatedStyle = { ...currentStyle, backgroundImage: url };
                setCurrentStyle(updatedStyle);
                onUpdateStyle(updatedStyle);

                // Refresh list
                await fetchCustomTemplates();
            } else {
                console.warn("Drive not signed in. Template saved locally in state but not synced to GDrive.");
                onUpdateStyle(currentStyle);
            }

            setShowSaveTemplateModal(false);
            onBack();
        } catch (error) {
            console.error("Failed to save template:", error);
            alert("Failed to save template. See console for details.");
        } finally {
            setIsSaving(false);
        }
    };

    const applyTemplate = async (templateStyle: DeckStyle) => {
        const finalStyle = { ...templateStyle };

        // If the template has an SVG background, try to extract layout markers
        if (templateStyle.backgroundImage?.toLowerCase().includes('.svg')) {
            let svgUrl = templateStyle.backgroundImage;

            // If it's a relative path, prefix with base URL
            if (!svgUrl.startsWith('http') && !svgUrl.startsWith('blob:') && !svgUrl.startsWith('data:')) {
                const baseUrl = import.meta.env.BASE_URL;
                const cleanPath = svgUrl.startsWith('/') ? svgUrl.slice(1) : svgUrl;
                svgUrl = `${baseUrl}${cleanPath}`;
            }

            const layout = await templateService.parseSvgLayout(svgUrl);
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
                    finalStyle.cornerX = Math.round(layout.topLeft.offsetX);
                    finalStyle.cornerY = Math.round(layout.topLeft.offsetY);
                    finalStyle.cornerWidth = Math.round(layout.topLeft.width);
                    finalStyle.cornerHeight = Math.round(layout.topLeft.height);
                    finalStyle.cornerRotate = layout.topLeft.rotation;
                }
                if (layout.bottomRight) {
                    finalStyle.reversedCornerX = Math.round(layout.bottomRight.offsetX);
                    finalStyle.reversedCornerY = Math.round(layout.bottomRight.offsetY);
                    finalStyle.reversedCornerWidth = Math.round(layout.bottomRight.width);
                    finalStyle.reversedCornerHeight = Math.round(layout.bottomRight.height);
                    finalStyle.reversedCornerRotate = layout.bottomRight.rotation;
                }
                finalStyle.showCorner = layout.showCorner;
                finalStyle.showReversedCorner = layout.showReversedCorner;
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



    // ... existing imports

    // ... inside GlobalStyleEditor ...

    const renderInspectorContent = () => {
        // Title Inspector
        if (selectedElement === 'title') {
            return (
                <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Palette className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Title Style</h3>
                    </div>

                    <div className="space-y-4">
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
                            <label className="text-xs font-semibold text-foreground/70">Text Color</label>
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

                    <StyleControls
                        prefix="title"
                        currentStyle={currentStyle}
                        onUpdate={handleStyleChange}
                    />


                </div>
            );
        }

        // Description Inspector
        if (selectedElement === 'description') {
            return (
                <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Type className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Description Style</h3>
                    </div>

                    <div className="space-y-4">
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
                            <label className="text-xs font-semibold text-foreground/70">Text Color</label>
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

                    <StyleControls
                        prefix="description"
                        currentStyle={currentStyle}
                        onUpdate={handleStyleChange}
                    />


                </div>
            );
        }

        // Corner Inspector
        if (selectedElement === 'corner' || selectedElement === 'reversedCorner') {
            const isReversed = selectedElement === 'reversedCorner';
            const prefix = isReversed ? 'reversedCorner' : 'corner';
            const icon = isReversed ? <Shield className="w-4 h-4 text-indigo-500" /> : <Hash className="w-4 h-4 text-indigo-500" />;
            const title = isReversed ? 'Reversed Corner Style' : 'Corner Style';

            return (
                <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        {icon}
                        <h3 className="font-bold text-sm uppercase tracking-wider">{title}</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/70">Content</label>
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
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/70">Text Color</label>
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
                    </div>

                    <StyleControls
                        prefix={prefix}
                        currentStyle={currentStyle}
                        onUpdate={handleStyleChange}
                    />

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase">Visibility</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="text-xs font-semibold text-foreground/70 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={currentStyle.showCorner}
                                    onChange={(e) => handleStyleChange({ showCorner: e.target.checked })}
                                    className="rounded border-border text-indigo-600 focus:ring-indigo-500"
                                />
                                Show Corner
                            </label>
                            <label className="text-xs font-semibold text-foreground/70 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={currentStyle.showReversedCorner}
                                    onChange={(e) => handleStyleChange({ showReversedCorner: e.target.checked })}
                                    className="rounded border-border text-indigo-600 focus:ring-indigo-500"
                                />
                                Show Reversed
                            </label>
                        </div>
                    </div>


                </div>
            );
        }

        // Art Inspector
        if (selectedElement === 'art') {
            return (
                <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Box className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Art Position</h3>
                    </div>

                    <StyleControls
                        prefix="art"
                        currentStyle={currentStyle}
                        onUpdate={handleStyleChange}
                    />


                </div>
            );
        }

        // Global Inspector (Default)
        return (
            <div className="space-y-8 animate-in slide-in-from-right-5 duration-300">
                {/* Global / Game Logic */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Settings className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Game Logic</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Define global constants for SVG text nodes.</p>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-foreground/70 flex items-center gap-1">
                                <Heart className="w-3 h-3 text-red-500" /> HP
                            </label>
                            <input
                                type="text"
                                value={currentStyle.gameHp || '20'}
                                onChange={(e) => handleStyleChange({ gameHp: e.target.value })}
                                className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-center"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-foreground/70 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-blue-500" /> Mana
                            </label>
                            <input
                                type="text"
                                value={currentStyle.gameMana || '10'}
                                onChange={(e) => handleStyleChange({ gameMana: e.target.value })}
                                className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-center"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-foreground/70 flex items-center gap-1">
                                <Box className="w-3 h-3 text-amber-500" /> Suit
                            </label>
                            <input
                                type="text"
                                value={currentStyle.gameSuit || '♥'}
                                onChange={(e) => handleStyleChange({ gameSuit: e.target.value })}
                                className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-center"
                            />
                        </div>
                    </div>
                </section>

                {/* SVG Styling (Corner/Frame) */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <PenTool className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">SVG Styles</h3>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground/70">Frame Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={currentStyle.svgFrameColor || '#000000'}
                                        onChange={(e) => handleStyleChange({ svgFrameColor: e.target.value })}
                                        className="w-8 h-8 rounded border-0 p-0 cursor-pointer overflow-hidden"
                                    />
                                    <span className="text-xs font-mono self-center text-muted-foreground">{currentStyle.svgFrameColor || '-'}</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground/70">Accent Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={currentStyle.svgCornerColor || '#000000'}
                                        onChange={(e) => handleStyleChange({ svgCornerColor: e.target.value })}
                                        className="w-8 h-8 rounded border-0 p-0 cursor-pointer overflow-hidden"
                                    />
                                    <span className="text-xs font-mono self-center text-muted-foreground">{currentStyle.svgCornerColor || '-'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground/70 flex justify-between">
                                <span>Stroke Width</span>
                                <span className="text-muted-foreground">{currentStyle.svgStrokeWidth || 2}px</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.5"
                                value={currentStyle.svgStrokeWidth || 2}
                                onChange={(e) => handleStyleChange({ svgStrokeWidth: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
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
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                                <Upload className="w-5 h-5 text-muted-foreground mb-2" />
                                <span className="text-[10px] font-semibold text-muted-foreground">Upload Image</span>
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
        );
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden animate-in fade-in duration-300">
            {/* Left Panel: Templates Only */}
            <div className="w-[300px] flex-shrink-0 h-full border-r border-border bg-card overflow-y-auto custom-scrollbar flex flex-col">
                <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border p-4">
                    <button
                        onClick={handleBackClick}
                        className="w-full p-2 mb-4 hover:bg-muted rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-muted-foreground"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Deck
                    </button>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                            <Layout className="w-4 h-4" />
                            Templates
                        </h3>
                        <div className="flex gap-1">
                            <button
                                onClick={handleSave}
                                className="p-1.5 hover:bg-muted rounded-md text-green-500 transition-colors"
                                title="Save Template"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    {[...TEMPLATES, ...customTemplates].map(template => (
                        <button
                            key={template.id}
                            onClick={() => applyTemplate(template.style)}
                            className={cn(
                                "w-full p-3 rounded-xl border text-left transition-all hover:shadow-md group relative h-20 flex flex-col justify-between overflow-hidden",
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
                            <div className="flex items-center gap-1.5 relative z-10">
                                <span className="text-xs font-bold block truncate">{template.name}</span>
                                {template.isCustom && (
                                    <Cloud className="w-2.5 h-2.5 text-indigo-500 flex-shrink-0" />
                                )}
                            </div>
                            <div className="flex gap-1 relative z-10">
                                <div className="w-2.5 h-2.5 rounded-full border border-border" style={{ backgroundColor: template.style.cornerColor }}></div>
                                <div className="w-2.5 h-2.5 rounded-full border border-border" style={{ backgroundColor: template.style.titleColor }}></div>
                                <div className="w-2.5 h-2.5 rounded-full border border-border" style={{ backgroundColor: template.style.descriptionColor }}></div>
                            </div>
                            {currentStyle.backgroundImage === template.style.backgroundImage && currentStyle.cornerColor === template.style.cornerColor && (
                                <Check className="absolute top-2 right-2 w-4 h-4 text-indigo-500 z-10" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Center Panel: Preview */}
            <div className="flex-1 h-full bg-muted/20 relative flex items-center justify-center p-8 overflow-visible">
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground))_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="transform scale-[1.1] shadow-2xl rounded-xl">
                        <Card
                            {...previewCard}
                            deckStyle={currentStyle}
                            onElementClick={(el) => setSelectedElement(el)}
                            isInteractive={true}
                            selectedElement={selectedElement}
                            onElementUpdate={(_, updates) => handleStyleChange(updates)}
                        />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground animate-pulse">Click elements on the card to edit styles</p>
                        {selectedElement && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                Editing: {selectedElement}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel: Inspector */}
            <div className="w-[350px] flex-shrink-0 h-full border-l border-border bg-card overflow-y-auto custom-scrollbar p-6">
                {renderInspectorContent()}
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

            {/* Save Template Modal */}
            <AnimatePresence>
                {showSaveTemplateModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isSaving && setShowSaveTemplateModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl"
                        >
                            <h2 className="text-xl font-bold mb-2">Save Custom Template</h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                Enter a name for your new template. This will generate an SVG file with your layout markers and sync it to your Google Drive.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Template Name</label>
                                    <input
                                        type="text"
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        placeholder="e.g. My Awesome Layout"
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex flex-col gap-3 pt-4">
                                    {driveService.isSignedIn ? (
                                        <button
                                            onClick={handleSaveNewTemplate}
                                            disabled={!newTemplateName.trim() || isSaving}
                                            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                        >
                                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
                                            Save & Sync to GDrive
                                        </button>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase text-center">
                                                Google Drive not connected
                                            </p>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await driveService.signIn();
                                                        // Force re-render to show sync button
                                                        setNewTemplateName(prev => prev + ' ');
                                                        setNewTemplateName(prev => prev.trim());
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }}
                                                className="w-full bg-white border border-border text-foreground rounded-xl py-3 font-bold hover:bg-muted transition-all flex items-center justify-center gap-2"
                                            >
                                                <Cloud className="w-5 h-5 text-indigo-500" />
                                                Connect Google Drive to Sync
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleDownloadSVG}
                                            disabled={!newTemplateName.trim() || isSaving}
                                            className="bg-muted text-foreground rounded-xl py-3 font-bold hover:bg-muted/80 transition-all text-sm flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download SVG
                                        </button>
                                        <button
                                            onClick={() => {
                                                onUpdateStyle(currentStyle);
                                                onBack();
                                            }}
                                            disabled={isSaving}
                                            className="bg-muted text-muted-foreground hover:text-foreground rounded-xl py-3 font-bold transition-all text-sm"
                                        >
                                            Apply Locally
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setShowSaveTemplateModal(false)}
                                        disabled={isSaving}
                                        className="w-full py-2 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
