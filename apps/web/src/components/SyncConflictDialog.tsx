import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Smartphone, AlertTriangle } from 'lucide-react';
import type { Deck } from './DeckLibrary';

interface SyncConflictDialogProps {
    isOpen: boolean;
    onClose: () => void;
    localDeck: Deck | null;
    remoteDate: Date | null;
    onKeepLocal: () => void;
    onUseCloud: () => void;
}

export const SyncConflictDialog = ({
    isOpen,
    onClose,
    localDeck,
    remoteDate,
    onKeepLocal,
    onUseCloud
}: SyncConflictDialogProps) => {
    if (!localDeck || !remoteDate) return null;

    const localDate = new Date(localDeck.updatedAt);

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
                        className="relative w-full max-w-lg bg-background border border-border rounded-xl shadow-2xl overflow-hidden z-10"
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6 text-amber-600 dark:text-amber-400">
                                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">Sync Conflict Detected</h2>
                            </div>

                            <p className="text-muted-foreground mb-6">
                                The deck <strong>"{localDeck.name}"</strong> has different versions on this device and in the cloud.
                                Which version would you like to keep?
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {/* Local Version Card */}
                                <div
                                    onClick={onKeepLocal}
                                    className="cursor-pointer border-2 border-border hover:border-indigo-500 rounded-lg p-4 transition-all hover:bg-muted/50 group"
                                >
                                    <div className="flex items-center gap-2 mb-2 text-foreground font-semibold">
                                        <Smartphone className="w-5 h-5 text-indigo-500" />
                                        <span>This Device</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <p>modified on</p>
                                        <p className="font-mono text-xs">{localDate.toLocaleString()}</p>
                                        <p className="mt-2 text-xs">{localDeck.cards.length} cards</p>
                                    </div>
                                </div>

                                {/* Cloud Version Card */}
                                <div
                                    onClick={onUseCloud}
                                    className="cursor-pointer border-2 border-border hover:border-indigo-500 rounded-lg p-4 transition-all hover:bg-muted/50 group"
                                >
                                    <div className="flex items-center gap-2 mb-2 text-foreground font-semibold">
                                        <Cloud className="w-5 h-5 text-indigo-500" />
                                        <span>Google Drive</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <p>modified on</p>
                                        <p className="font-mono text-xs">{remoteDate.toLocaleString()}</p>
                                        <p className="mt-2 text-xs italic">Unknown card count</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                <span>Note: Use "This Device" to overwrite the cloud. Use "Google Drive" to overwrite this device.</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
