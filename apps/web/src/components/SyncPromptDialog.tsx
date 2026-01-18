import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, X } from 'lucide-react';

interface SyncPromptDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSync: () => void;
}

export const SyncPromptDialog = ({ isOpen, onClose, onSync }: SyncPromptDialogProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                        className="relative w-full max-w-md bg-background border border-border rounded-xl shadow-2xl overflow-hidden z-10"
                    >
                        <div className="p-6 text-center">
                            <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                                <Cloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            </div>

                            <h2 className="text-2xl font-bold text-foreground mb-2">Cloud Sync</h2>
                            <p className="text-muted-foreground mb-6">
                                Would you like to store and sync your decks with Google Drive?
                                This keeps your work safe and accessible across all your devices.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        onSync();
                                        onClose();
                                    }}
                                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
                                >
                                    Yes, Enable Sync
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full px-4 py-3 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                                >
                                    Maybe later
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
