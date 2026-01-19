import { motion } from 'framer-motion';
import { Plus, Trash2, Calendar, Layers, Upload } from 'lucide-react';
import type { DeckStyle } from '../App';
import type { CardConfig } from './CardStudio';
import { ResolvedImage } from './ResolvedImage';

export interface Deck {
    id: string;
    name: string;
    cards: CardConfig[];
    style: DeckStyle;
    updatedAt: number;
}

interface DeckLibraryProps {
    decks: Deck[];
    onCreateDeck: () => void;
    onSelectDeck: (id: string) => void;
    onDeleteDeck: (id: string) => void;
    onImportDeck: (file: File) => void;
}

export const DeckLibrary = ({ decks, onCreateDeck, onSelectDeck, onDeleteDeck, onImportDeck }: DeckLibraryProps) => {
    return (
        <div className="min-h-screen bg-background p-8 font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Decks Library</h1>
                        <p className="text-muted-foreground mt-1">Manage your card collections</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className="flex flex-col h-64 border-2 border-dashed border-border rounded-xl bg-card overflow-hidden transition-colors shadow-sm relative group"
                    >
                        {/* Primary Action: Create New Deck - takes up most space */}
                        <div
                            onClick={onCreateDeck}
                            className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors w-full"
                        >
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                <Plus className="w-8 h-8 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                            </div>
                            <h3 className="font-medium text-foreground">Create New Deck</h3>
                        </div>

                        {/* Secondary Action: Import */}
                        <div className="border-t border-border border-dashed">
                            <label className="cursor-pointer flex items-center justify-center gap-2 p-3 w-full hover:bg-accent/80 transition-colors text-sm font-medium text-muted-foreground hover:text-indigo-600">
                                <Upload className="w-4 h-4" />
                                <span>Import from ZIP</span>
                                <input
                                    type="file"
                                    accept=".zip"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            onImportDeck(e.target.files[0]);
                                            e.target.value = ''; // Reset
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </motion.div>

                    {decks.map(deck => (
                        <motion.div
                            key={deck.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -4 }}
                            className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group relative"
                        >
                            <div
                                onClick={() => onSelectDeck(deck.id)}
                                className="h-40 bg-muted relative overflow-hidden cursor-pointer"
                            >
                                {/* Deck Preview Logic */}
                                {deck.cards.length > 0 ? (
                                    <div className="absolute inset-0 p-4 flex items-center justify-center">
                                        <div className="w-20 h-28 bg-background border border-border rounded shadow-sm transform -rotate-6 translate-x-[-15px] translate-y-2"></div>
                                        <div className="w-20 h-28 bg-background border border-border rounded shadow-sm transform rotate-6 translate-x-[15px] translate-y-2 absolute"></div>
                                        <div className="w-20 h-28 bg-background border border-border rounded shadow-md transform rotate-0 z-10 absolute flex flex-col items-center justify-center p-2 text-center">
                                            <span className="text-[10px] font-bold text-foreground truncate w-full">{deck.cards[0]?.name}</span>
                                            {deck.cards[0]?.data?.art && (
                                                <ResolvedImage
                                                    src={deck.cards[0].data.art}
                                                    alt={deck.cards[0]?.name || 'Card preview'}
                                                    className="w-full h-12 object-cover mt-1 rounded-sm opacity-80"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                        <Layers className="w-24 h-24" />
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div onClick={() => onSelectDeck(deck.id)} className="cursor-pointer">
                                        <h3 className="font-bold text-lg text-foreground group-hover:text-indigo-600 transition-colors truncate max-w-[200px]">{deck.name}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Layers className="w-3 h-3" />
                                                {deck.cards.length} Cards
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(deck.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteDeck(deck.id);
                                        }}
                                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors z-20 relative"
                                        title="Delete Deck"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
