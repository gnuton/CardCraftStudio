import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface NewDeckDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
}

export const NewDeckDialog = ({ isOpen, onClose, onCreate }: NewDeckDialogProps) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name);
            setName('');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-border p-6"
                >
                    <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
                        <Layers className="w-8 h-8" />
                        <h2 className="text-2xl font-bold text-foreground">Create New Deck</h2>
                    </div>

                    <div className="space-y-4 text-muted-foreground mb-6">
                        <p>
                            Welcome to CardCraft! Let's get started by giving your new project a name.
                        </p>
                        <div className="bg-muted/50 p-3 rounded-lg border border-border text-sm">
                            <span className="font-semibold text-foreground">Note:</span> Your deck will be created with the <span className="text-foreground font-medium">Standard Layout</span>. don't worry—you can completely customize the style, fonts, and borders later in the <span className="text-foreground font-medium">Style Editor</span>.
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="deckName" className="block text-sm font-medium text-foreground mb-1">
                                Deck Name
                            </label>
                            <input
                                id="deckName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Mystic Warriors"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                autoFocus
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!name.trim()}
                                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create Deck
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
