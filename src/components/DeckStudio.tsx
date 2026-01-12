import { useState, useRef } from 'react';
import { Card } from './Card';
import type { CardConfig } from './CardStudio';
import { Plus, Trash2, Edit, Settings, X, Download, Loader2 } from 'lucide-react';
import { DeckPrintLayout } from './DeckPrintLayout';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface DeckStudioProps {
    deck: CardConfig[];
    projectName: string;
    onAddCard: () => void;
    onEditCard: (index: number) => void;
    onDeleteCard: (index: number) => void;
    onUpdateProjectName: (name: string) => void;
    onUpdateCard: (index: number, updates: Partial<CardConfig>) => void;
}

export const DeckStudio = ({ deck, projectName, onAddCard, onEditCard, onDeleteCard, onUpdateProjectName, onUpdateCard }: DeckStudioProps) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempName, setTempName] = useState(projectName);
    const [isGenerating, setIsGenerating] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handleSaveSettings = () => {
        onUpdateProjectName(tempName);
        setIsSettingsOpen(false);
    };

    const handleGenerateDeckPdf = async () => {
        if (!printRef.current || deck.length === 0) return;

        try {
            setIsGenerating(true);
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render

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
            // Actually, we need to pass the *paginated* structure to DeckPrintLayout.
            // But state updates are async.
            // Better approach: Calculate pages derived from deck and pass to DeckPrintLayout.
            // Then wait for html2canvas.

            // Since 'pages' is derived from 'deck' which is prop, it's already available if we compute it in render.
            // But we need to capture specific DOM elements.

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
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
                            <h1 className="text-3xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{projectName}</h1>
                            <Settings className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                        <p className="text-slate-500 mt-1">{flatDeck.length} Cards to Print ({deck.length} unique)</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleGenerateDeckPdf}
                            disabled={isGenerating || flatDeck.length === 0}
                            className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                            Download PDF
                        </button>
                        <button
                            onClick={() => {
                                setTempName(projectName);
                                setIsSettingsOpen(true);
                            }}
                            className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Deck Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onAddCard}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add New Card
                        </button>
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

                {/* Grid */}
                {deck.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Plus className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Your deck is empty</h3>
                        <p className="text-slate-500 mt-1 mb-6">Create your first card to get started.</p>
                        <button
                            onClick={onAddCard}
                            className="text-indigo-600 font-medium hover:text-indigo-700"
                        >
                            Create Card
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {deck.map((card, index) => (
                            <div key={card.id || index} className="group relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="aspect-[2.5/3.5] bg-slate-100 relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center transform scale-[0.4] origin-top-left w-[250%] h-[250%] pointer-events-none">
                                        <Card {...card} />
                                    </div>
                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                                        <button
                                            onClick={() => onEditCard(index)}
                                            className="p-2 bg-white text-slate-700 rounded-full shadow-lg hover:text-indigo-600 transition-colors"
                                            title="Edit Card"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => onDeleteCard(index)}
                                            className="p-2 bg-white text-slate-700 rounded-full shadow-lg hover:text-red-600 transition-colors"
                                            title="Delete Card"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-medium text-slate-900 truncate">{card.title || 'Untitled Card'}</h3>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{card.description ? 'Has description' : 'No description'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-slate-400 font-medium">Qty</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={card.count !== undefined ? card.count : 1}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                onUpdateCard(index, { count: val });
                                            }}
                                            className="w-12 h-7 text-sm text-center border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Hidden Print Layout */}
            <DeckPrintLayout pages={pages} ref={printRef} />

            {isGenerating && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center flex-col gap-4 text-white">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="font-medium">Generating PDF...</p>
                </div>
            )}
        </div>
    );
};
