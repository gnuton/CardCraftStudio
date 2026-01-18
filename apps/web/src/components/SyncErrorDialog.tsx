import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

interface SyncErrorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    error: string | null;
    onRetry: () => void;
}

export const SyncErrorDialog = ({ isOpen, onClose, error, onRetry }: SyncErrorDialogProps) => {
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
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">Sync Failed</h2>
                            </div>

                            <div className="mb-6">
                                <p className="text-muted-foreground mb-4">
                                    We couldn't synchronize your decks with Google Drive.
                                </p>

                                <div className="bg-muted/50 p-3 rounded-lg border border-border text-sm font-mono text-foreground break-words mb-4">
                                    {error || "Unknown error occurred"}
                                </div>

                                <div className="space-y-3 text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground">Troubleshooting:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-1">
                                        <li>Check your internet connection</li>
                                        <li>Ensure the "Google Drive API" is enabled in your Google Cloud Console</li>
                                        <li>If testing, verify your email is added to "Test Users"</li>
                                    </ul>

                                    <div className="mt-2">
                                        <a
                                            href="https://console.cloud.google.com/apis/dashboard"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 hover:underline"
                                        >
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            Open Google Cloud Console
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        onClose();
                                        onRetry();
                                    }}
                                    className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    Retry Sync
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
