import { useState, useEffect } from 'react';
import { ImageProviderDialog } from './ImageProviderDialog/ImageProviderDialog';
import { templateService } from '../services/templateService';
import { driveService } from '../services/googleDrive';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown, ChevronRight, Trash2, Plus, Type, Palette, Layout, Save, Cloud, Download, Loader2, ZoomIn, ZoomOut, RotateCcw, Hand, MousePointer2, AlertCircle, X, Box, Maximize2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { Card } from './Card';
import { ResolvedImage } from './ResolvedImage';
import type { CardConfig } from './CardStudio';
import type { DeckStyle } from '../types/deck';
import { FontPicker } from './FontPicker';
import type { CardElement } from '../types/element';
import { createDefaultElement } from '../types/element';

import { TEMPLATES, type Template } from '../constants/templates';
import { TemplatePickerModal } from './TemplatePickerModal';

interface GlobalStyleEditorProps {
    deckStyle: DeckStyle;
    sampleCard?: CardConfig;
    onUpdateStyle: (style: DeckStyle) => void;
    onUpdateStyleAndSync?: (style: DeckStyle) => Promise<void>;
    onBack: () => void;
}

export const GlobalStyleEditor = ({ deckStyle, sampleCard, onUpdateStyle, onUpdateStyleAndSync, onBack }: GlobalStyleEditorProps) => {
    const [currentStyle, setCurrentStyle] = useState<DeckStyle>(deckStyle);
    const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
    const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
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
    const [isFlipped, setIsFlipped] = useState(false);
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

    const handleZoomIn = () => setViewScale(s => Math.min(s + 0.1, 3));
    const handleZoomOut = () => setViewScale(s => Math.max(s - 0.1, 0.5));
    const handleResetView = () => {
        setViewScale(1.1);
        setViewPan({ x: 0, y: 0 });
    };

    const handleWheel = (e: React.WheelEvent) => {
        // Zoom without modifiers
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setViewScale(prev => Math.min(Math.max(0.5, prev + delta), 3));
    };

    const handlePanMouseDown = (e: React.MouseEvent) => {
        if (!isPanMode && e.button !== 2) return;
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
        if (!driveService.isSignedIn) {
            try {
                await driveService.trySilentSignIn();
            } catch {
                return;
            }
        }

        try {
            const files = await driveService.listFiles();
            // Filter for SVGs that are not deck JSONs
            const svgFiles = files.filter(f => f.name.endsWith('.svg'));

            const templates: Template[] = await Promise.all(svgFiles.map(async (file) => {
                const blob = await driveService.getFileBlob(file.id);
                const url = URL.createObjectURL(blob);

                return {
                    id: file.id,
                    name: file.name.replace('.svg', '').replace(/_/g, ' '),
                    style: {
                        ...TEMPLATES[0].style, // Use default style as base
                        backgroundImage: url,
                    },
                    side: 'front' as const,
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
        name: 'Hero of the Realm',
        data: {
            title: 'Hero of the Realm',
            description: 'When this card is played, all <b>friendly units</b> gain +1/+1 and <i>Vigilance</i> until the end of turn.',
            art: '',
            corner: 'A',
            back_title: 'GAME TITLE'
        }
    };

    const handleStyleChange = (updates: Partial<DeckStyle>) => {
        const newStyle = { ...currentStyle, ...updates };
        setCurrentStyle(newStyle);
        onUpdateStyle(newStyle);
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

            // 2. Sync to GDrive if signed in (or can sign in)
            try {
                await driveService.ensureSignedIn();
            } catch (e) {
                console.warn("Auth failed during save", e);
            }

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

    const applyTemplate = async (template: Template) => {
        const templateStyle = template.style;
        const finalStyle: DeckStyle = JSON.parse(JSON.stringify(currentStyle)); // Start with current
        finalStyle.id = template.id;

        if (template.side === 'back') {
            // Only update back related properties
            finalStyle.cardBackBackgroundColor = templateStyle.cardBackBackgroundColor;
            finalStyle.cardBackImage = templateStyle.cardBackImage;

            // Merge back elements
            const backElements = templateStyle.elements?.filter(e => e.side === 'back') || [];
            const otherElements = finalStyle.elements?.filter(e => e.side !== 'back') || [];
            finalStyle.elements = [...otherElements, ...backElements];
        } else if (template.side === 'front') {
            // Update front related properties
            finalStyle.borderColor = templateStyle.borderColor;
            finalStyle.borderWidth = templateStyle.borderWidth;
            finalStyle.backgroundColor = templateStyle.backgroundColor;
            finalStyle.backgroundImage = templateStyle.backgroundImage;
            finalStyle.globalFont = templateStyle.globalFont;
            finalStyle.gameHp = templateStyle.gameHp;
            finalStyle.gameMana = templateStyle.gameMana;
            finalStyle.gameSuit = templateStyle.gameSuit;
            finalStyle.svgFrameColor = templateStyle.svgFrameColor;
            finalStyle.svgCornerColor = templateStyle.svgCornerColor;
            finalStyle.svgStrokeWidth = templateStyle.svgStrokeWidth;

            // Merge front elements
            const frontElements = templateStyle.elements?.filter(e => e.side === 'front') || [];
            const otherElements = finalStyle.elements?.filter(e => e.side !== 'front') || [];
            finalStyle.elements = [...otherElements, ...frontElements];
        } else {
            // Replace everything (for 'both' or undefined)
            Object.assign(finalStyle, JSON.parse(JSON.stringify(templateStyle)));
        }

        // If the template has an SVG background (only for front/both), try to extract layout markers
        if ((template.side === 'front' || template.side === 'both') && templateStyle.backgroundImage?.toLowerCase().includes('.svg')) {
            let svgUrl = templateStyle.backgroundImage;

            // If it's a relative path, prefix with base URL
            if (!svgUrl.startsWith('http') && !svgUrl.startsWith('blob:') && !svgUrl.startsWith('data:')) {
                const baseUrl = import.meta.env.BASE_URL;
                const cleanPath = svgUrl.startsWith('/') ? svgUrl.slice(1) : svgUrl;
                svgUrl = `${baseUrl}${cleanPath}`;
            }

            try {
                const layout = await templateService.parseSvgLayout(svgUrl);
                if (layout && layout.elements && finalStyle.elements) {
                    // Update elements based on SVG layout matches
                    // Update existing elements based on SVG layout matches
                    finalStyle.elements = finalStyle.elements.map(el => {
                        // Match element by ID (e.g. 'title', 'description', 'art')
                        const layoutEl = layout.elements?.[el.id];

                        if (layoutEl) {
                            return {
                                ...el,
                                x: Math.round(layoutEl.offsetX),
                                y: Math.round(layoutEl.offsetY),
                                width: Math.round(layoutEl.width),
                                height: Math.round(layoutEl.height),
                                rotate: layoutEl.rotation || 0,
                                scale: layoutEl.scale ?? el.scale,
                                opacity: layoutEl.opacity ?? el.opacity,
                                ...(layoutEl.fill ? { color: layoutEl.fill } : {}),
                                ...(layoutEl.fontFamily ? { fontFamily: layoutEl.fontFamily } : {}),
                                ...(layoutEl.fontSize ? { fontSize: layoutEl.fontSize } : {})
                            };
                        }
                        return el;
                    });

                    // Create NEW elements from SVG if they don't exist
                    const matchedIds = new Set(finalStyle.elements.map(e => e.id));
                    Object.entries(layout.elements).forEach(([id, layoutEl]) => {
                        if (!matchedIds.has(id)) {
                            // Use explicit type or fallback to 'text' if undefined
                            const type = layoutEl.elementType || 'text';
                            const newEl = createDefaultElement(type, 'front');

                            // Override defaults with SVG layout
                            const elWithLayout = {
                                ...newEl,
                                id: id,
                                name: id.charAt(0).toUpperCase() + id.slice(1), // Capitalize ID for name
                                x: Math.round(layoutEl.offsetX),
                                y: Math.round(layoutEl.offsetY),
                                width: Math.round(layoutEl.width),
                                height: Math.round(layoutEl.height),
                                rotate: layoutEl.rotation || 0,
                                scale: layoutEl.scale ?? 1,
                                opacity: layoutEl.opacity ?? 1,
                                ...(layoutEl.fill ? { color: layoutEl.fill } : {}),
                                ...(layoutEl.fontFamily ? { fontFamily: layoutEl.fontFamily } : {}),
                                ...(layoutEl.fontSize ? { fontSize: layoutEl.fontSize } : {})
                            };

                            finalStyle.elements!.push(elWithLayout);
                        }
                    });
                }
            } catch (e) {
                console.warn("Failed to parse SVG layout", e);
            }
        }

        setCurrentStyle(finalStyle);
    };

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        templates: true,
        elements: true,
        cardSize: true
    });

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    const handleAddElement = (type: CardElement['type']) => {
        const newEl = createDefaultElement(type, isFlipped ? 'back' : 'front');
        const newElements = [...(currentStyle.elements || []), newEl];
        handleStyleChange({ elements: newElements });
        setSelectedElement(newEl.id);
    };

    const handleDeleteElement = (id: string) => {
        const newElements = currentStyle.elements?.filter(e => e.id !== id) || [];
        handleStyleChange({ elements: newElements });
        if (selectedElement === id) setSelectedElement(null);
    };

    const handleUpdateElement = (id: string, updates: Partial<CardElement>) => {
        const newElements = currentStyle.elements?.map(e => e.id === id ? { ...e, ...updates } : e) || [];
        handleStyleChange({ elements: newElements });
    };

    const renderInspectorContent = () => {
        const element = currentStyle.elements?.find(e => e.id === selectedElement);

        if (element) {
            return (
                <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-indigo-500" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Properties</h3>
                        </div>
                        <button onClick={() => handleDeleteElement(element.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded" title="Delete Element">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Common Setup */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/70">Name</label>
                            <input
                                type="text"
                                value={element.name}
                                onChange={(e) => handleUpdateElement(element.id, { name: e.target.value })}
                                className="w-full bg-muted border border-border rounded px-2 py-1 text-sm"
                            />
                        </div>

                        {/* Font Settings (Text/Multiline) */}
                        {(element.type === 'text' || element.type === 'multiline') && (
                            <div className="space-y-4 pt-2 border-t border-border">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <Type className="w-3 h-3" /> Typography
                                </h4>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground/70">Font Family</label>
                                    <button
                                        onClick={() => setIsFontPickerOpen(true)}
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-muted/80 transition-colors"
                                    >
                                        <span className="truncate">{element.fontFamily || 'sans-serif'}</span>
                                        <ChevronDown className="w-3 h-3 opacity-50 flex-shrink-0" />
                                    </button>
                                    <FontPicker
                                        isOpen={isFontPickerOpen}
                                        onClose={() => setIsFontPickerOpen(false)}
                                        onSelect={(font) => {
                                            handleUpdateElement(element.id, { fontFamily: font });
                                            setIsFontPickerOpen(false);
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground/70">Size</label>
                                        <input
                                            type="number"
                                            value={element.fontSize || 12}
                                            onChange={(e) => handleUpdateElement(element.id, { fontSize: Number(e.target.value) })}
                                            className="w-full bg-muted border border-border rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground/70">Align</label>
                                        <select
                                            value={element.textAlign || 'left'}
                                            onChange={(e) => handleUpdateElement(element.id, { textAlign: e.target.value as 'left' | 'center' | 'right' })}
                                            className="w-full bg-muted border border-border rounded px-2 py-1 text-sm"
                                        >
                                            <option value="left">Left</option>
                                            <option value="center">Center</option>
                                            <option value="right">Right</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground/70">Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={element.color || '#000000'}
                                            onChange={(e) => handleUpdateElement(element.id, { color: e.target.value })}
                                            className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={element.color || ''}
                                            onChange={(e) => handleUpdateElement(element.id, { color: e.target.value })}
                                            className="flex-1 bg-muted border border-border rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Appearance (Background/Border) */}
                        <div className="space-y-4 pt-2 border-t border-border">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                <Palette className="w-3 h-3" /> Style
                            </h4>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/70">Background</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={element.backgroundColor || '#ffffff'}
                                        onChange={(e) => handleUpdateElement(element.id, { backgroundColor: e.target.value })}
                                        className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={element.backgroundColor || ''}
                                        placeholder="transparent"
                                        onChange={(e) => handleUpdateElement(element.id, { backgroundColor: e.target.value })}
                                        className="flex-1 bg-muted border border-border rounded px-2 py-1 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/70">Border</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="Width"
                                        value={element.borderWidth || 0}
                                        onChange={(e) => handleUpdateElement(element.id, { borderWidth: Number(e.target.value) })}
                                        className="w-full bg-muted border border-border rounded px-2 py-1 text-sm"
                                    />
                                    <input
                                        type="color"
                                        value={element.borderColor || '#000000'}
                                        onChange={(e) => handleUpdateElement(element.id, { borderColor: e.target.value })}
                                        className="w-full h-8 rounded border-0 p-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/70">Opacity</label>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.1"
                                    value={element.opacity || 1}
                                    onChange={(e) => handleUpdateElement(element.id, { opacity: Number(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/70">Z-Index</label>
                                <input
                                    type="number"
                                    value={element.zIndex || 10}
                                    onChange={(e) => handleUpdateElement(element.id, { zIndex: Number(e.target.value) })}
                                    className="w-full bg-muted border border-border rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Global Inspector
        return (
            <div className="space-y-8 animate-in slide-in-from-right-5 duration-300">
                {/* Global / Card Base Settings */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Settings className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Card Base Settings</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Configure the base appearance of the card frame and background.
                    </p>

                    <div className="space-y-4 pt-2">
                        {/* Background Settings */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-2">
                                <Palette className="w-3 h-3" /> {isFlipped ? 'Back' : 'Front'} Background Color
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={(isFlipped ? currentStyle.cardBackBackgroundColor : currentStyle.backgroundColor) || '#ffffff'}
                                    onChange={(e) => handleStyleChange(isFlipped ? { cardBackBackgroundColor: e.target.value } : { backgroundColor: e.target.value })}
                                    className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer overflow-hidden"
                                />
                                <input
                                    type="text"
                                    value={(isFlipped ? currentStyle.cardBackBackgroundColor : currentStyle.backgroundColor) || '#ffffff'}
                                    onChange={(e) => handleStyleChange(isFlipped ? { cardBackBackgroundColor: e.target.value } : { backgroundColor: e.target.value })}
                                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono uppercase"
                                />
                            </div>
                        </div>

                        {/* Global Font */}
                        <div className="space-y-1.5 pt-4 border-t border-border">
                            <label className="text-xs font-semibold text-foreground/70">Global Font</label>
                            <button
                                onClick={() => setIsFontPickerOpen(true)}
                                className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs text-left flex items-center justify-between"
                            >
                                <span className="truncate">{currentStyle.globalFont || 'Inherit / Default'}</span>
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>
                            <FontPicker
                                isOpen={isFontPickerOpen}
                                onClose={() => setIsFontPickerOpen(false)}
                                onSelect={(font) => {
                                    handleStyleChange({ globalFont: font });
                                    setIsFontPickerOpen(false);
                                }}
                                currentFont={currentStyle.globalFont}
                            />
                        </div>

                        {/* SVG/Frame Colors */}
                        <div className="space-y-3 pt-4 border-t border-border">
                            <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-2">
                                <Settings className="w-3 h-3" /> Frame Styles
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
                                <Palette className="w-3 h-3" /> {isFlipped ? 'Back' : 'Front'} Background Image
                            </label>
                            <div className="space-y-3">
                                {(isFlipped ? currentStyle.cardBackImage : currentStyle.backgroundImage) ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-border aspect-video">
                                        <ResolvedImage src={(isFlipped ? currentStyle.cardBackImage : currentStyle.backgroundImage) || ''} alt="Background" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                            <button
                                                onClick={() => handleStyleChange(isFlipped ? { cardBackImage: null } : { backgroundImage: null })}
                                                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setIsImageDialogOpen(true)}
                                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                        <span className="text-[10px] font-semibold text-muted-foreground">Add {isFlipped ? 'Back' : 'Front'} Image</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    };

    return (
        <>
            <div className="flex h-[calc(100vh-7.5rem)] bg-background overflow-hidden animate-in fade-in duration-300">
                {/* Left Panel: Assets */}
                <div className="w-[300px] flex-shrink-0 h-full border-r border-border bg-card overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border p-4">
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
                                Templates
                            </button>

                            {expandedGroups.templates && (
                                <div className="space-y-3 pl-0">
                                    <button
                                        onClick={() => setIsTemplatePickerOpen(true)}
                                        className="w-full p-3 rounded-xl border border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm flex items-center justify-between group hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-lg border border-border overflow-hidden bg-background relative flex-shrink-0">
                                                {((isFlipped && currentStyle.cardBackImage) || (!isFlipped && currentStyle.backgroundImage)) ? (
                                                    <ResolvedImage
                                                        src={(isFlipped ? currentStyle.cardBackImage : currentStyle.backgroundImage) || ''}
                                                        className="w-full h-full object-cover"
                                                        alt="Template Preview"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                                        <Layout className="w-4 h-4 opacity-50" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block mb-0.5">
                                                    Current Template
                                                </span>
                                                <span className="text-sm font-bold block text-foreground truncate">
                                                    {[...TEMPLATES, ...customTemplates].find(t => t.id === currentStyle.id)?.name || 'Custom / Unsaved'}
                                                </span>
                                            </div>
                                        </div>
                                        <Settings className="w-4 h-4 text-indigo-500 group-hover:rotate-90 transition-transform flex-shrink-0" />
                                    </button>

                                    <button
                                        onClick={handleSave}
                                        className="w-full py-2 px-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Save Layout as New Template
                                    </button>
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
                                <div className="space-y-4 pl-2">
                                    {/* Add Buttons */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => handleAddElement('text')} className="flex flex-col items-center justify-center p-2 rounded bg-muted/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-border hover:border-indigo-200 transition-colors gap-1 group" title="Add Text">
                                            <Type className="w-4 h-4 text-foreground/70 group-hover:text-indigo-500" />
                                            <span className="text-[10px] text-muted-foreground group-hover:text-indigo-600">Text</span>
                                        </button>
                                        <button onClick={() => handleAddElement('multiline')} className="flex flex-col items-center justify-center p-2 rounded bg-muted/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-border hover:border-indigo-200 transition-colors gap-1 group" title="Add Multiline Text">
                                            <Layout className="w-4 h-4 text-foreground/70 group-hover:text-indigo-500" />
                                            <span className="text-[10px] text-muted-foreground group-hover:text-indigo-600">Multi</span>
                                        </button>
                                        <button onClick={() => handleAddElement('image')} className="flex flex-col items-center justify-center p-2 rounded bg-muted/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-border hover:border-indigo-200 transition-colors gap-1 group" title="Add Image">
                                            <Palette className="w-4 h-4 text-foreground/70 group-hover:text-indigo-500" />
                                            <span className="text-[10px] text-muted-foreground group-hover:text-indigo-600">Image</span>
                                        </button>
                                    </div>

                                    <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                        {currentStyle.elements?.filter(el => isFlipped ? el.side === 'back' : el.side === 'front').map(el => (
                                            <button
                                                key={el.id}
                                                onClick={() => setSelectedElement(el.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-all border",
                                                    selectedElement === el.id
                                                        ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/20"
                                                        : "bg-transparent border-transparent hover:bg-muted"
                                                )}
                                            >
                                                <span className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                                                    {el.type === 'image' ? <Palette className="w-3 h-3" /> : (el.type === 'multiline' ? <Layout className="w-3 h-3" /> : <Type className="w-3 h-3" />)}
                                                </span>
                                                <span className="truncate font-medium flex-1 text-left">{el.name}</span>
                                                {selectedElement === el.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                            </button>
                                        ))}

                                        {(!currentStyle.elements || currentStyle.elements.filter(el => isFlipped ? el.side === 'back' : el.side === 'front').length === 0) && (
                                            <div className="text-xs text-muted-foreground text-center py-4 italic">
                                                No elements on this side.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Card Size Group */}
                        <div className="space-y-2">
                            <button
                                onClick={() => toggleGroup('cardSize')}
                                className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors w-full"
                            >
                                {expandedGroups.cardSize ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                <Maximize2 className="w-3 h-3" />
                                Card Size
                            </button>

                            {expandedGroups.cardSize && (
                                <div className="space-y-4 pl-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-foreground/70">Size Preset</label>
                                        <select
                                            value={currentStyle.cardSizePreset || 'poker'}
                                            onChange={(e) => {
                                                const preset = e.target.value as DeckStyle['cardSizePreset'];
                                                const sizes: Record<string, { width: number; height: number }> = {
                                                    poker: { width: 375, height: 525 },      // 2.5" x 3.5" (standard poker)
                                                    bridge: { width: 338, height: 525 },     // 2.25" x 3.5" (bridge)
                                                    tarot: { width: 413, height: 713 },      // 2.75" x 4.75" (tarot)
                                                    mini: { width: 263, height: 413 },       // 1.75" x 2.75" (mini)
                                                    euro: { width: 433, height: 675 },       // 2.875" x 4.5" (euro)
                                                    square: { width: 450, height: 450 },     // 3" x 3" (square)
                                                    custom: { width: currentStyle.cardWidth || 375, height: currentStyle.cardHeight || 525 }
                                                };
                                                const size = sizes[preset || 'poker'];
                                                handleStyleChange({
                                                    cardSizePreset: preset,
                                                    cardWidth: size.width,
                                                    cardHeight: size.height
                                                });
                                            }}
                                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="poker">Poker (2.5" × 3.5")</option>
                                            <option value="bridge">Bridge (2.25" × 3.5")</option>
                                            <option value="tarot">Tarot (2.75" × 4.75")</option>
                                            <option value="mini">Mini (1.75" × 2.75")</option>
                                            <option value="euro">Euro (2.875" × 4.5")</option>
                                            <option value="square">Square (3" × 3")</option>
                                            <option value="custom">Custom Size</option>
                                        </select>
                                    </div>

                                    {/* Custom Size Inputs - only visible when custom is selected */}
                                    {currentStyle.cardSizePreset === 'custom' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-foreground/70">Width (px)</label>
                                                <input
                                                    type="number"
                                                    min="100"
                                                    max="1000"
                                                    value={currentStyle.cardWidth || 375}
                                                    onChange={(e) => handleStyleChange({ cardWidth: Number(e.target.value) })}
                                                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-foreground/70">Height (px)</label>
                                                <input
                                                    type="number"
                                                    min="100"
                                                    max="1000"
                                                    value={currentStyle.cardHeight || 525}
                                                    onChange={(e) => handleStyleChange({ cardHeight: Number(e.target.value) })}
                                                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Size Preview */}
                                    <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                                        <span className="font-mono bg-muted px-2 py-0.5 rounded">
                                            {currentStyle.cardWidth || 375} × {currentStyle.cardHeight || 525}
                                        </span>
                                        <span>pixels</span>
                                    </div>
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
                        isDraggingPan ? "cursor-grabbing" : (isPanMode ? "cursor-grab" : "cursor-[zoom-in]")
                    )}
                    onClick={() => {
                        if (!isPanMode && !isDraggingPan) {
                            setSelectedElement(null);
                        }
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    onMouseDown={handlePanMouseDown}
                    onMouseMove={handlePanMouseMove}
                    onMouseUp={handlePanMouseUp}
                    onMouseLeave={handlePanMouseUp}
                    onWheel={handleWheel}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground))_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>

                    {/* Transformable Canvas Container */}
                    <div
                        className="relative z-10 transition-transform duration-75 ease-linear will-change-transform"
                        style={{
                            transform: `translate(${viewPan.x}px, ${viewPan.y}px) scale(${viewScale})`
                        }}
                    >
                        <div data-testid="card-preview" className={cn("shadow-2xl rounded-xl", (isPanMode || isDraggingPan) && "pointer-events-none")}>
                            <Card
                                {...previewCard}
                                deckStyle={currentStyle}
                                onSelectElement={(id: string | null) => {
                                    if (!isPanMode) setSelectedElement(id);
                                }}
                                isInteractive={!isPanMode} // Disable internal interactivity when in pan mode
                                selectedElement={selectedElement}
                                onElementUpdate={(id, updates) => id && handleUpdateElement(id, updates as Partial<CardElement>)}
                                onDeleteElement={handleDeleteElement}
                                isFlipped={isFlipped}
                                allowTextEditing={false}
                                parentScale={viewScale}
                            />
                        </div>
                    </div>

                    {/* Viewport Controls Toolbar */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2 py-1.5 bg-background/80 backdrop-blur-md border border-border rounded-full shadow-lg z-50">
                        {/* Front/Back Flip Toggle */}
                        <div className="flex items-center border-r border-border pr-2 mr-1 gap-1">
                            <button
                                onClick={() => {
                                    setIsFlipped(false);
                                    setSelectedElement(null);
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                                    !isFlipped ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Front
                            </button>
                            <button
                                onClick={() => {
                                    setIsFlipped(!isFlipped);
                                    setSelectedElement(null);
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                                    isFlipped ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Back
                            </button>
                        </div>

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
            <TemplatePickerModal
                isOpen={isTemplatePickerOpen}
                onClose={() => setIsTemplatePickerOpen(false)}
                onSelect={applyTemplate}
                currentTemplateId={currentStyle.id}
                customTemplates={customTemplates}
                isFlipped={isFlipped}
            />
            <ImageProviderDialog
                isOpen={isImageDialogOpen}
                onClose={() => setIsImageDialogOpen(false)}
                onImageSelect={(ref) => {
                    handleStyleChange(isFlipped ? { cardBackImage: ref } : { backgroundImage: ref });
                    setIsImageDialogOpen(false);
                }}
            />
        </>
    );
};
