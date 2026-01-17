import { useState, useRef } from 'react';
import { Card } from './Card';
import type { CardConfig } from './CardStudio';
import { Plus, Trash2, Edit, Copy, Settings, X, Download, Loader2, Upload, Archive, Palette } from 'lucide-react';
import { DeckPrintLayout } from './DeckPrintLayout';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import type { DeckStyle } from '../App';

interface DeckStudioProps {
    deck: CardConfig[];
    projectName: string;
    deckStyle: DeckStyle;
    onAddCard: () => void;
    onEditCard: (index: number) => void;
    onDeleteCard: (index: number) => void;
    onUpdateProjectName: (name: string) => void;
    onUpdateCard: (index: number, updates: Partial<CardConfig>) => void;
    onDuplicateCard: (index: number) => void;
    onOpenStyleEditor: () => void;
}

export const DeckStudio = ({ deck, projectName, deckStyle, onAddCard, onEditCard, onDeleteCard, onUpdateProjectName, onUpdateCard, onDuplicateCard, onOpenStyleEditor }: DeckStudioProps) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempName, setTempName] = useState(projectName);
    const [isGenerating, setIsGenerating] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveSettings = () => {
        onUpdateProjectName(tempName);
        setIsSettingsOpen(false);
    };

    const handleExportDeck = async () => {
        try {
            const zip = new JSZip();

            // Prepare deck data with image references
            const deckData = {
                deckName: projectName,
                version: '1.0',
                cards: [] as any[]
            };

            // Process each card
            for (let i = 0; i < deck.length; i++) {
                const card = deck[i];
                const cardData = { ...card };

                // If card has an image, extract it
                if (card.centerImage) {
                    const imageFileName = `card-${card.id}.${card.centerImage.startsWith('data:image/png') ? 'png' : 'jpg'}`;

                    // Convert data URL to blob
                    const response = await fetch(card.centerImage);
                    const blob = await response.blob();

                    // Add image to ZIP
                    zip.folder('images')!.file(imageFileName, blob);

                    // Update card reference to relative path
                    cardData.centerImage = `images/${imageFileName}`;
                }

                deckData.cards.push(cardData);
            }

            // Add deck.json to ZIP
            zip.file('deck.json', JSON.stringify(deckData, null, 2));

            // Generate and download ZIP
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export deck');
        }
    };

    const handleImportDeck = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const zip = new JSZip();
            const zipData = await zip.loadAsync(file);

            // Read deck.json
            const deckJsonFile = zipData.file('deck.json');
            if (!deckJsonFile) {
                alert('Invalid deck file: missing deck.json');
                return;
            }

            const deckJsonText = await deckJsonFile.async('text');
            const deckData = JSON.parse(deckJsonText);

            // Restore images
            const restoredCards: CardConfig[] = [];
            for (const cardData of deckData.cards) {
                const card = { ...cardData };

                // If card references an image, restore it
                if (card.centerImage && card.centerImage.startsWith('images/')) {
                    const imageFile = zipData.file(card.centerImage);
                    if (imageFile) {
                        const blob = await imageFile.async('blob');
                        const dataUrl = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                        card.centerImage = dataUrl;
                    }
                }

                restoredCards.push(card);
            }

            // Update deck name
            onUpdateProjectName(deckData.deckName);
            setTempName(deckData.deckName);

            // Clear existing deck and add imported cards
            // We need to delete all existing cards first
            for (let i = deck.length - 1; i >= 0; i--) {
                onDeleteCard(i);
            }

            // Add imported cards
            restoredCards.forEach(() => onAddCard());

            // Update each card with imported data
            // We need to wait a bit for the cards to be added
            setTimeout(() => {
                restoredCards.forEach((card, index) => {
                    onUpdateCard(index, card);
                });
            }, 100);

            alert(`Successfully imported "${deckData.deckName}" with ${restoredCards.length} cards`);
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import deck. Please ensure the file is a valid deck export.');
        } finally {
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleGenerateDeckPdf = async () => {
        if (!printRef.current || deck.length === 0) return;

        try {
            setIsGenerating(true);
            // No need for artificial delay with toJpeg as it's already async and robust

            // 1. Flatten deck based on counts
            const flatDeck: CardConfig[] = [];
            deck.forEach(card => {
                const count = card.count || 1;
                for (let i = 0; i < count; i++) {
                    flatDeck.push(card);
                }
            });

            if (flatDeck.length === 0) {
                alert("No cards to print. Check card quantities.");
                setIsGenerating(false);
                return;
            }

            // 2. Paginate (9 cards per page)
            const pages: CardConfig[][] = [];
            for (let i = 0; i < flatDeck.length; i += 9) {
                pages.push(flatDeck.slice(i, i + 9));
            }

            // Force Render of Print Layout (it's hidden but needs to be in DOM with content)
            // The PrintLayout component handles the mapping of pages.
            // We need to wait for it to update with the new 'pages' if we were passing it down,
            // but we can pass 'flatDeck' logic to it, or compute pages here and pass to it.
            // Actually, we need to capture specific DOM elements.

            // Actually, let's look at how DeckPrintLayout is implemented.
            // It maps 'pages'. We need to construct 'pages' in the render body so it's passed to DeckPrintLayout.

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            // We need to capture each page individually.
            const pageElements = printRef.current.querySelectorAll('.print-page');

            for (let i = 0; i < pageElements.length; i++) {
                const pageEl = pageElements[i] as HTMLElement;

                // Use html-to-image instead of html2canvas
                const imgData = await toJpeg(pageEl, {
                    quality: 0.95,
                    backgroundColor: '#ffffff',
                    pixelRatio: 3 // High resolution
                });

                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
            }

            pdf.save(`${projectName.replace(/\s+/g, '-').toLowerCase()}.pdf`);

        } catch (error) {
            console.error('PDF Generation failed', error);
            alert('Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    // Calculate pages for print layout
    const flatDeck: CardConfig[] = [];
    deck.forEach(card => {
        const count = card.count !== undefined ? card.count : 1;
        for (let i = 0; i < count; i++) {
            flatDeck.push(card);
        }
    });

    const pages: CardConfig[][] = [];
    for (let i = 0; i < flatDeck.length; i += 9) {
        pages.push(flatDeck.slice(i, i + 9));
    }

    return (
        <div className="min-h-screen bg-background p-8 pb-24 font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="sticky top-16 z-40 -mx-8 px-8 py-4 mb-8 bg-background/95 backdrop-blur-md border-b border-border transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
                                <h1 className="text-3xl font-bold text-foreground group-hover:text-indigo-600 transition-colors">{projectName}</h1>
                                <Settings className="w-5 h-5 text-muted-foreground group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                            <p className="text-muted-foreground mt-1">{flatDeck.length} Cards to Print ({deck.length} unique)</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onOpenStyleEditor}
                                className="flex items-center px-4 py-2 bg-card border border-border text-foreground font-medium rounded-lg hover:bg-accent transition-colors shadow-sm"
                                title="Global Deck Styles"
                            >
                                <Palette className="w-5 h-5 mr-2 text-indigo-500" />
                                Deck Styles
                            </button>
                            <button
                                onClick={handleExportDeck}
                                disabled={deck.length === 0}
                                className="flex items-center px-4 py-2 bg-card border border-border text-foreground font-medium rounded-lg hover:bg-accent transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Export deck as ZIP"
                            >
                                <Archive className="w-5 h-5 mr-2" />
                                Export Deck
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center px-4 py-2 bg-card border border-border text-foreground font-medium rounded-lg hover:bg-accent transition-colors shadow-sm"
                                title="Import deck from ZIP"
                            >
                                <Upload className="w-5 h-5 mr-2" />
                                Import Deck
                            </button>
                            <button
                                onClick={handleGenerateDeckPdf}
                                disabled={isGenerating || flatDeck.length === 0}
                                className="flex items-center px-4 py-2 bg-card border border-border text-foreground font-medium rounded-lg hover:bg-accent transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Settings Modal */}
                {isSettingsOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                                <h3 className="font-bold text-lg text-slate-900">Deck Settings</h3>
                                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Deck Name</label>
                                    <input
                                        type="text"
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 flex justify-end gap-2 text-sm font-medium">
                                <button
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {deck.length === 0 ? (
                    <div className="px-4 py-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            <div
                                onClick={onAddCard}
                                className="flex flex-col items-center justify-center aspect-[2.5/3.5] border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-accent/50 transition-colors group"
                            >
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                    <Plus className="w-8 h-8 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                                </div>
                                <h3 className="font-medium text-foreground">Create New Card</h3>
                                <p className="text-sm text-muted-foreground mt-1">Click to add your first card</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-4 py-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {/* Create New Card Placeholder */}
                            <div
                                onClick={onAddCard}
                                className="flex flex-col items-center justify-center aspect-[2.5/3.5] border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-accent/50 transition-colors group"
                            >
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                    <Plus className="w-8 h-8 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                                </div>
                                <h3 className="font-medium text-foreground">Create New Card</h3>
                            </div>
                            {deck.map((card, index) => (
                                <div key={card.id || index} className="group relative bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="aspect-[2.5/3.5] bg-muted relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center transform scale-[0.8] origin-center pointer-events-none">
                                            <Card {...card} deckStyle={deckStyle} />
                                        </div>
                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                                            <button
                                                onClick={() => onEditCard(index)}
                                                className="p-2 bg-background border border-border text-foreground rounded-full shadow-lg hover:text-indigo-600 transition-colors"
                                                title="Edit Card"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => onDuplicateCard(index)}
                                                className="p-2 bg-background border border-border text-foreground rounded-full shadow-lg hover:text-green-600 transition-colors"
                                                title="Duplicate Card"
                                            >
                                                <Copy className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteCard(index)}
                                                className="p-2 bg-background border border-border text-foreground rounded-full shadow-lg hover:text-red-600 transition-colors"
                                                title="Delete Card"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-3 border-t border-border flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-medium text-foreground truncate">{card.title || 'Untitled Card'}</h3>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">{card.description ? 'Has description' : 'No description'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-muted-foreground font-medium">Qty</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={card.count !== undefined ? card.count : 1}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    onUpdateCard(index, { count: val });
                                                }}
                                                className="w-12 h-7 text-sm text-center bg-muted border border-border text-foreground rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden Print Layout */}
            <DeckPrintLayout pages={pages} deckStyle={deckStyle} ref={printRef} />

            {/* Hidden File Input for Import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleImportDeck}
                style={{ display: 'none' }}
            />

            {isGenerating && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center flex-col gap-4 text-white">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="font-medium">Generating PDF...</p>
                </div>
            )}
        </div>
    );
};
