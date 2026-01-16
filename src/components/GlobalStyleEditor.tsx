import { useState, useEffect } from 'react';
import { templateService } from '../services/templateService';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import type { CardConfig } from './CardStudio';
import type { DeckStyle } from '../App';
import { ArrowLeft, Save, Upload, Type, Palette, Layout, Check, Hash, AlertCircle, X, Settings, Shield, Zap, Box, PenTool, ChevronRight, ChevronDown, Plus, ZoomIn, ZoomOut, RotateCcw, Hand, MousePointer2 } from 'lucide-react';
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
    },
    {
        id: 'eldritch_archive',
        name: 'Eldritch Archive',
        style: {
            cornerColor: '#ffffff',
            titleColor: '#000000',
            descriptionColor: '#000000',
            cornerFont: 'serif',
            titleFont: 'serif',
            descriptionFont: 'serif',
            backgroundImage: 'templates/eldritch_archive.svg',
            cornerContent: '?',
            showTitle: true,
            titleX: -5,
            titleY: -160,
            titleWidth: 240,
            titleBackgroundColor: 'transparent',
            showArt: true,
            artX: 0,
            artY: -30,
            artWidth: 250,
            artHeight: 180,
            showTypeBar: true,
            typeBarX: 0,
            typeBarY: 78, // Adjusted based on SVG layout (approx 210px from top is center 0 + 78?) No wait, center is 210. 245 + 14 = 259. 259 - 210 = 49.
            typeBarWidth: 240,
            typeBarBackgroundColor: 'transparent',
            typeBarContent: 'Creature - Horror',
            showDescription: true,
            descriptionY: 130,
            descriptionWidth: 240,
            descriptionBackgroundColor: 'transparent',
            showFlavorText: true,
            flavorTextY: 180,
            flavorTextContent: '"That is not dead which can eternal lie..."',
            showStatsBox: true,
            statsBoxX: 105,
            statsBoxY: 185,
            statsBoxContent: '6 / 6',
            statsBoxBackgroundColor: 'transparent',
            showCorner: false, // Hidden for this style usually, or top left
            showReversedCorner: false,
            showCollectorInfo: true,
            collectorInfoY: 200,

            // Unused but required by TS if not fully partial
            titleRotate: 0, titleScale: 1, descriptionRotate: 0, descriptionScale: 1,
            cornerX: 0, cornerY: 0, cornerRotate: 0, cornerWidth: 0, cornerHeight: 0,
            reversedCornerX: 0, reversedCornerY: 0, reversedCornerRotate: 0, reversedCornerWidth: 0, reversedCornerHeight: 0,
            gameHp: '20', gameMana: '10', gameSuit: 'A', svgFrameColor: '#000', svgCornerColor: '#000', svgStrokeWidth: 1
        } as unknown as DeckStyle
    },
    {
        id: 'neon_data',
        name: 'Neon Data',
        style: {
            cornerColor: '#00ffff',
            titleColor: '#00ffff',
            descriptionColor: '#e0e0e0',
            cornerFont: 'monospace',
            titleFont: 'monospace',
            descriptionFont: 'monospace',
            backgroundImage: 'templates/neon_data.svg',
            cornerContent: 'NET',

            // Layout
            showTitle: true,
            titleX: 0,
            titleY: -180,
            titleWidth: 260,
            titleBackgroundColor: 'transparent',

            showArt: true,
            artX: 0,
            artY: -45,
            artWidth: 270,
            artHeight: 170,

            showTypeBar: true,
            typeBarX: 0,
            typeBarY: 60,
            typeBarWidth: 220,
            typeBarBackgroundColor: 'transparent',
            typeBarColor: '#ff00ff',
            typeBarContent: 'PROGRAM // VIRUS',

            showDescription: true,
            descriptionY: 120,
            descriptionWidth: 260,
            descriptionBackgroundColor: 'transparent',

            showStatsBox: true,
            statsBoxX: 125,
            statsBoxY: 175,
            statsBoxContent: 'mem:4',
            statsBoxColor: '#ff00ff',
            statsBoxBackgroundColor: 'transparent',

            showWatermark: true,
            watermarkOpacity: 0.1,

            showCorner: false,
            showReversedCorner: false,
            showCollectorInfo: true,
            collectorInfoContent: 'SYSDAT-2026 // ROOT ACCESS',
            collectorInfoColor: '#00ffff',

            // TS Defaults
            titleRotate: 0, titleScale: 1, descriptionRotate: 0, descriptionScale: 1,
            cornerX: 0, cornerY: 0, cornerRotate: 0, cornerWidth: 0, cornerHeight: 0,
            reversedCornerX: 0, reversedCornerY: 0, reversedCornerRotate: 0, reversedCornerWidth: 0, reversedCornerHeight: 0,
            gameHp: 'N/A', gameMana: 'N/A', gameSuit: '#', svgFrameColor: '#00ffff', svgCornerColor: '#00ffff', svgStrokeWidth: 1
        } as unknown as DeckStyle
    }
];

export const GlobalStyleEditor = ({ deckStyle, sampleCard, onUpdateStyle, onUpdateStyleAndSync, onBack }: GlobalStyleEditorProps) => {
    const [currentStyle, setCurrentStyle] = useState<DeckStyle>(deckStyle);
    const [selectedElement, setSelectedElement] = useState<'background' | 'corner' | 'title' | 'art' | 'description' | 'reversedCorner' | 'typeBar' | 'flavorText' | 'statsBox' | 'watermark' | 'rarityIcon' | 'collectorInfo' | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [customTemplates, setCustomTemplates] = useState<Template[]>([]);

    // Viewport Controls
    const [viewScale, setViewScale] = useState(1.1);
    const [viewPan, setViewPan] = useState({ x: 0, y: 0 });
    const [isPanMode, setIsPanMode] = useState(false);
    const [isDraggingPan, setIsDraggingPan] = useState(false);
    const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });

    const handleZoomIn = () => setViewScale(s => Math.min(s + 0.1, 3));
    const handleZoomOut = () => setViewScale(s => Math.max(s - 0.1, 0.5));
    const handleResetView = () => {
        setViewScale(1.1);
        setViewPan({ x: 0, y: 0 });
    };

    const handlePanMouseDown = (e: React.MouseEvent) => {
        if (!isPanMode) return;
        setIsDraggingPan(true);
        setStartPanPoint({ x: e.clientX - viewPan.x, y: e.clientY - viewPan.y });
    };

    const handlePanMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingPan) return;
        e.preventDefault();
        setViewPan({
            x: e.clientX - startPanPoint.x,
            y: e.clientY - startPanPoint.y
        });
    };

    const handlePanMouseUp = () => setIsDraggingPan(false);

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

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        templates: true,
        elements: true
    });

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
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
        // Generic Element Inspector Logic
        const getElementConfig = (element: string) => {
            const configs: Record<string, { label: string, icon: any, desc: string, hasContent?: boolean, hasFont?: boolean, hasColor?: boolean, hasUrl?: boolean }> = {
                title: { label: 'Title', icon: Type, desc: 'The main name of the card.', hasFont: true, hasColor: true },
                description: { label: 'Description', icon: Layout, desc: 'The main rules text of the card.', hasFont: true, hasColor: true },
                corner: { label: 'Corner', icon: Hash, desc: 'Top-left value indicator.', hasContent: true, hasFont: true, hasColor: true },
                reversedCorner: { label: 'Inverted Corner', icon: Shield, desc: 'Bottom-right inverted value.', hasFont: true, hasColor: true }, // No explicit content edit for reversed usually? Or mirrors corner? Let's assume style only for now or same logic as corner
                art: { label: 'Illustration', icon: Palette, desc: 'The main card artwork.', },
                typeBar: { label: 'Type Bar', icon: Type, desc: 'Component for card type and subtype.', hasContent: true, hasFont: true, hasColor: true },
                flavorText: { label: 'Flavor Text', icon: Type, desc: 'Lore text section.', hasContent: true, hasFont: true, hasColor: true },
                statsBox: { label: 'Stats Box', icon: Hash, desc: 'Combat statistics display.', hasContent: true, hasFont: true, hasColor: true },
                watermark: { label: 'Watermark', icon: Shield, desc: 'Faction symbol background.', hasUrl: true },
                rarityIcon: { label: 'Rarity Icon', icon: Zap, desc: 'Set and rarity indicator.', hasUrl: true },
                collectorInfo: { label: 'Collector Info', icon: Hash, desc: 'Artist and copyright details.', hasContent: true, hasFont: true, hasColor: true },
            };
            return configs[element];
        };

        const config = selectedElement ? getElementConfig(selectedElement) : null;

        if (selectedElement && config) {
            // Collapsible State (Local to this render cycle effectively, or need state? 
            // Ideally state, but for simplicity let's use the requested structure which implies headers imply sections.
            // We can use Details/Summary or just sections.

            // Mapping properties dynamically
            const prefix = selectedElement;
            const contentKey = `${prefix}Content` as keyof DeckStyle;
            const fontKey = `${prefix}Font` as keyof DeckStyle;
            const colorKey = `${prefix}Color` as keyof DeckStyle;
            const urlKey = `${prefix}Url` as keyof DeckStyle;

            return (
                <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Settings className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Properties</h3>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <config.icon className="w-4 h-4 text-muted-foreground" />
                            <h4 className="font-bold text-base">{config.label}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">{config.desc}</p>
                    </div>

                    {/* Content Section (if applicable) */}
                    {(config.hasContent || config.hasUrl) && (
                        <div className="space-y-4 pt-4 border-t border-border">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase">Content</h4>
                            {config.hasContent && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground/70">Text</label>
                                    <input
                                        type="text"
                                        value={currentStyle[contentKey] as string || ''}
                                        onChange={(e) => handleStyleChange({ [contentKey]: e.target.value })}
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            )}
                            {config.hasUrl && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground/70">Image URL</label>
                                    <input
                                        type="text"
                                        value={currentStyle[urlKey] as string || ''}
                                        onChange={(e) => handleStyleChange({ [urlKey]: e.target.value })}
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="https://..."
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Appearance Group (Collapsible) */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => {/* Toggle logic typically, assuming always open for now or add state if critical */ }}>
                            <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                <Palette className="w-3 h-3" /> Appearance
                            </h4>
                        </div>

                        <div className="space-y-4 pl-2 border-l-2 border-border/50 ml-1">
                            {/* Font & Color Standard Controls */}
                            {(config.hasFont || config.hasColor) && (
                                <div className="space-y-4 mb-4">
                                    {config.hasFont && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-foreground/70">Font Family</label>
                                            <select
                                                value={currentStyle[fontKey] as string || 'sans-serif'}
                                                onChange={(e) => handleStyleChange({ [fontKey]: e.target.value })}
                                                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            >
                                                {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {config.hasColor && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-foreground/70">Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={currentStyle[colorKey] as string || '#000000'}
                                                    onChange={(e) => handleStyleChange({ [colorKey]: e.target.value })}
                                                    className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer overflow-hidden"
                                                />
                                                <input
                                                    type="text"
                                                    value={currentStyle[colorKey] as string || '#000000'}
                                                    onChange={(e) => handleStyleChange({ [colorKey]: e.target.value })}
                                                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono uppercase"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Shared Style Controls (Opacity, Z-Index, Border, etc.) */}
                            <StyleControls
                                prefix={prefix}
                                currentStyle={currentStyle}
                                onUpdate={handleStyleChange}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // Global Inspector (Default)
        return (
            <div className="space-y-8 animate-in slide-in-from-right-5 duration-300">
                {/* Global / Card Base Settings */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Settings className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Card Base Settings</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Configure the base appearance of the card frame and background.</p>

                    <div className="space-y-4 pt-2">
                        {/* Global Font & Corner Radius */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground/70">Global Font</label>
                                <select
                                    value={currentStyle.globalFont || ''}
                                    onChange={(e) => handleStyleChange({ globalFont: e.target.value })}
                                    className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs"
                                >
                                    <option value="">Inherit / Default</option>
                                    {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground/70 flex justify-between">
                                    <span>Corner Radius</span>
                                    <span className="text-muted-foreground">{currentStyle.cornerRadius ?? 12}px</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="30"
                                    value={currentStyle.cornerRadius ?? 12}
                                    onChange={(e) => handleStyleChange({ cornerRadius: parseInt(e.target.value) })}
                                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Shadow Intensity */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground/70 flex justify-between">
                                <span>Shadow Intensity</span>
                                <span className="text-muted-foreground">{Math.round((currentStyle.shadowIntensity ?? 0) * 100)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={currentStyle.shadowIntensity ?? 0}
                                onChange={(e) => handleStyleChange({ shadowIntensity: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        {/* Texture Overlay */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground/70">Texture</label>
                                <select
                                    value={currentStyle.textureOverlay || 'none'}
                                    onChange={(e) => handleStyleChange({ textureOverlay: e.target.value as any })}
                                    className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs"
                                >
                                    <option value="none">None</option>
                                    <option value="paper">Paper Grain</option>
                                    <option value="noise">Static Noise</option>
                                    <option value="foil">Holo Foil</option>
                                    <option value="grunge">Grunge Vignette</option>
                                </select>
                            </div>
                            {currentStyle.textureOverlay && currentStyle.textureOverlay !== 'none' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground/70 flex justify-between">
                                        <span>Opacity</span>
                                        <span className="text-muted-foreground">{Math.round((currentStyle.textureOpacity ?? 0.5) * 100)}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={currentStyle.textureOpacity ?? 0.5}
                                        onChange={(e) => handleStyleChange({ textureOpacity: parseFloat(e.target.value) })}
                                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Print Aids */}
                        <div className="flex gap-4 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentStyle.showBleedLines || false}
                                    onChange={(e) => handleStyleChange({ showBleedLines: e.target.checked })}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs font-medium text-foreground/80">Show Bleed</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentStyle.showSafeZone || false}
                                    onChange={(e) => handleStyleChange({ showSafeZone: e.target.checked })}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs font-medium text-foreground/80">Show Safe Zone</span>
                            </label>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                            Use <strong>Bleed</strong> for printing margins (cut area) and <strong>Safe Zone</strong> to ensure vital content isn't chopped.
                        </p>
                    </div>


                    {/* SVG/Frame Colors */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-2">
                            <PenTool className="w-3 h-3" /> Frame Styles
                        </label>

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
                    </div>

                    {/* Background Settings */}
                    <div className="space-y-3 pt-4 border-t border-border">
                        <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-2">
                            <Upload className="w-3 h-3" /> Background
                        </label>
                        <div className="space-y-3">
                            {currentStyle.backgroundImage ? (
                                <div className="relative group rounded-xl overflow-hidden border border-border aspect-video">
                                    <img src={currentStyle.backgroundImage} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                        <button
                                            onClick={() => handleStyleChange({ backgroundImage: null })}
                                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                                        >
                                            Remove
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
                    </div>
                </section>

            </div >
        );
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden animate-in fade-in duration-300">
            {/* Left Panel: Assets */}
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
                            <Box className="w-4 h-4" />
                            Assets
                        </h3>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Templates Group */}
                    <div className="space-y-2">
                        <button
                            onClick={() => toggleGroup('templates')}
                            className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors w-full"
                        >
                            {expandedGroups.templates ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            Styles
                        </button>

                        {expandedGroups.templates && (
                            <div className="space-y-4 pl-0">
                                {/* Current Editing Style - Always visible at top when expanded */}
                                <div className="mb-4 p-3 rounded-xl border-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <div className="flex flex-col gap-2 pl-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <PenTool className="w-3 h-3" />
                                                Current Style
                                            </span>
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-200/50 text-indigo-700 dark:bg-indigo-800/50 dark:text-indigo-300">
                                                Editing
                                            </span>
                                        </div>

                                        <div className="flex gap-1 mt-1">
                                            <div className="w-3 h-3 rounded-full border border-border/50 shadow-sm" style={{ backgroundColor: currentStyle.cornerColor }}></div>
                                            <div className="w-3 h-3 rounded-full border border-border/50 shadow-sm" style={{ backgroundColor: currentStyle.titleColor }}></div>
                                            <div className="w-3 h-3 rounded-full border border-border/50 shadow-sm" style={{ backgroundColor: currentStyle.descriptionColor }}></div>
                                        </div>

                                        <button
                                            onClick={handleSave}
                                            className="mt-2 w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow"
                                        >
                                            <Save className="w-3 h-3" />
                                            Save to Styles
                                        </button>
                                    </div>
                                </div>

                                <div className="h-px bg-border/50 my-2 mx-2" />

                                <div className="space-y-3 pl-2">
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
                        )}
                    </div>

                    {/* Card Elements Group */}
                    <div className="space-y-2">
                        <button
                            onClick={() => toggleGroup('elements')}
                            className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors w-full"
                        >
                            {expandedGroups.elements ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            Card Elements
                        </button>

                        {expandedGroups.elements && (
                            <div className="space-y-2 pl-2">
                                {currentStyle.showTitle === false && (
                                    <button
                                        onClick={() => handleStyleChange({ showTitle: true })}
                                        className="w-full p-2 rounded-lg border border-dashed border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-muted-foreground hover:text-indigo-600 transition-all flex items-center gap-2 group"
                                    >
                                        <div className="w-6 h-6 rounded bg-muted group-hover:bg-white flex items-center justify-center">
                                            <Type className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium">Title</span>
                                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                    </button>
                                )}

                                {currentStyle.showDescription === false && (
                                    <button
                                        onClick={() => handleStyleChange({ showDescription: true })}
                                        className="w-full p-2 rounded-lg border border-dashed border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-muted-foreground hover:text-indigo-600 transition-all flex items-center gap-2 group"
                                    >
                                        <div className="w-6 h-6 rounded bg-muted group-hover:bg-white flex items-center justify-center">
                                            <Layout className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium">Description</span>
                                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                    </button>
                                )}

                                {currentStyle.showArt === false && (
                                    <button
                                        onClick={() => handleStyleChange({ showArt: true })}
                                        className="w-full p-2 rounded-lg border border-dashed border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-muted-foreground hover:text-indigo-600 transition-all flex items-center gap-2 group"
                                    >
                                        <div className="w-6 h-6 rounded bg-muted group-hover:bg-white flex items-center justify-center">
                                            <Palette className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium">Illustration</span>
                                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                    </button>
                                )}

                                {currentStyle.showCorner === false && (
                                    <button
                                        onClick={() => handleStyleChange({ showCorner: true })}
                                        className="w-full p-2 rounded-lg border border-dashed border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-muted-foreground hover:text-indigo-600 transition-all flex items-center gap-2 group"
                                    >
                                        <div className="w-6 h-6 rounded bg-muted group-hover:bg-white flex items-center justify-center">
                                            <Box className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium">Corner</span>
                                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                    </button>
                                )}

                                {currentStyle.showReversedCorner === false && (
                                    <button
                                        onClick={() => handleStyleChange({ showReversedCorner: true })}
                                        className="w-full p-2 rounded-lg border border-dashed border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-muted-foreground hover:text-indigo-600 transition-all flex items-center gap-2 group"
                                    >
                                        <div className="w-6 h-6 rounded bg-muted group-hover:bg-white flex items-center justify-center">
                                            <Box className="w-3 h-3 rotate-180" />
                                        </div>
                                        <span className="text-sm font-medium">Inverted Corner</span>
                                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                    </button>
                                )}

                                {!currentStyle.showTypeBar && (
                                    <button
                                        onClick={() => handleStyleChange({ showTypeBar: true })}
                                        className="w-full p-2 rounded-lg border border-dashed border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-muted-foreground hover:text-indigo-600 transition-all flex items-center gap-2 group"
                                    >
                                        <div className="w-6 h-6 rounded bg-muted group-hover:bg-white flex items-center justify-center">
                                            <Type className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium">Type Bar</span>
                                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                    </button>
                                )}

                                {!currentStyle.showFlavorText && (
                                    <button
                                        onClick={() => handleStyleChange({ showFlavorText: true })}
                                        className="w-full p-2 rounded-lg border border-dashed border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-muted-foreground hover:text-indigo-600 transition-all flex items-center gap-2 group"
                                    >
                                        <div className="w-6 h-6 rounded bg-muted group-hover:bg-white flex items-center justify-center">
                                            <Type className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium">Flavor Text</span>
                                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                    </button>
                                )}

                                {!currentStyle.showStatsBox && (
                                    <button
                                        onClick={() => handleStyleChange({ showStatsBox: true })}
                                        className="w-full p-2 rounded-lg border border-dashed border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-muted-foreground hover:text-indigo-600 transition-all flex items-center gap-2 group"
                                    >
                                        <div className="w-6 h-6 rounded bg-muted group-hover:bg-white flex items-center justify-center">
                                            <Hash className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium">Stats Box</span>
                                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                    </button>
                                )}

                                {!currentStyle.showWatermark && (
                                    <button
                                        onClick={() => handleStyleChange({ showWatermark: true })}
                                        className="w-full p-2 rounded-lg border border-dashed border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-muted-foreground hover:text-indigo-600 transition-all flex items-center gap-2 group"
                                    >
                                        <div className="w-6 h-6 rounded bg-muted group-hover:bg-white flex items-center justify-center">
                                            <Shield className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium">Watermark</span>
                                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                    </button>
                                )}

                                {!currentStyle.showRarityIcon && (
                                    <button
                                        onClick={() => handleStyleChange({ showRarityIcon: true })}
                                        className="w-full p-2 rounded-lg border border-dashed border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-muted-foreground hover:text-indigo-600 transition-all flex items-center gap-2 group"
                                    >
                                        <div className="w-6 h-6 rounded bg-muted group-hover:bg-white flex items-center justify-center">
                                            <Zap className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium">Rarity Icon</span>
                                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                    </button>
                                )}

                                {!currentStyle.showCollectorInfo && (
                                    <button
                                        onClick={() => handleStyleChange({ showCollectorInfo: true })}
                                        className="w-full p-2 rounded-lg border border-dashed border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-muted-foreground hover:text-indigo-600 transition-all flex items-center gap-2 group"
                                    >
                                        <div className="w-6 h-6 rounded bg-muted group-hover:bg-white flex items-center justify-center">
                                            <Type className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium">Collector Info</span>
                                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                    </button>
                                )}

                                {(currentStyle.showTitle !== false &&
                                    currentStyle.showDescription !== false &&
                                    currentStyle.showArt !== false &&
                                    currentStyle.showCorner !== false &&
                                    currentStyle.showReversedCorner !== false &&
                                    currentStyle.showTypeBar &&
                                    currentStyle.showFlavorText &&
                                    currentStyle.showStatsBox &&
                                    currentStyle.showWatermark &&
                                    currentStyle.showRarityIcon &&
                                    currentStyle.showCollectorInfo) && (
                                        <div className="text-center py-4 text-xs text-muted-foreground italic">
                                            All elements added to layout
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Center Panel: Preview */}
            {/* Center Panel: Preview */}
            <div
                className={cn(
                    "flex-1 h-full bg-muted/20 relative flex items-center justify-center overflow-hidden select-none",
                    isPanMode ? (isDraggingPan ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
                )}
                onClick={() => {
                    if (!isPanMode && !isDraggingPan) {
                        setSelectedElement(null);
                    }
                }}
                onMouseDown={handlePanMouseDown}
                onMouseMove={handlePanMouseMove}
                onMouseUp={handlePanMouseUp}
                onMouseLeave={handlePanMouseUp}
            >
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground))_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>

                {/* Transformable Canvas Container */}
                <div
                    className="relative z-10 transition-transform duration-75 ease-linear will-change-transform"
                    style={{
                        transform: `translate(${viewPan.x}px, ${viewPan.y}px) scale(${viewScale})`
                    }}
                >
                    <div className={cn("shadow-2xl rounded-xl", isPanMode && "pointer-events-none")}>
                        <Card
                            {...previewCard}
                            deckStyle={currentStyle}
                            onElementClick={(el) => {
                                if (!isPanMode) setSelectedElement(el);
                            }}
                            isInteractive={!isPanMode} // Disable internal interactivity when in pan mode
                            selectedElement={selectedElement}
                            onElementUpdate={(_, updates) => handleStyleChange(updates)}
                        />
                    </div>
                </div>

                {/* Viewport Controls Toolbar */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2 py-1.5 bg-background/80 backdrop-blur-md border border-border rounded-full shadow-lg z-50">
                    <div className="flex items-center border-r border-border pr-2 mr-1">
                        <button
                            onClick={() => setIsPanMode(false)}
                            className={cn(
                                "p-2 rounded-full transition-all",
                                !isPanMode ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                            title="Select Mode"
                        >
                            <MousePointer2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsPanMode(true)}
                            className={cn(
                                "p-2 rounded-full transition-all",
                                isPanMode ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                            title="Pan Mode"
                        >
                            <Hand className="w-4 h-4" />
                        </button>
                    </div>

                    <button onClick={handleZoomOut} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-medium min-w-[3ch] text-center">
                        {Math.round(viewScale * 100)}%
                    </span>
                    <button onClick={handleZoomIn} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
                        <ZoomIn className="w-4 h-4" />
                    </button>

                    <div className="w-px h-4 bg-border mx-1" />

                    <button onClick={handleResetView} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors" title="Reset View">
                        <RotateCcw className="w-3 h-3" />
                    </button>
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
