import React from 'react';
import { AlertTriangle, ServerCrash, X } from 'lucide-react';

interface BackendHealthDialogProps {
    isOpen: boolean;
    status: 'incomplete' | 'error';
    missingVariables?: string[];
    message?: string;
    onClose: () => void;
}

export const BackendHealthDialog: React.FC<BackendHealthDialogProps> = ({
    isOpen,
    status,
    missingVariables,
    message,
    onClose
}) => {
    if (!isOpen) return null;

    const isSystemError = status === 'error';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200 dark:border-slate-800">
                <div className={`flex items-center justify-between p-5 border-b ${isSystemError ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'}`}>
                    <h3 className="font-bold text-xl text-foreground flex items-center gap-3">
                        {isSystemError ? (
                            <ServerCrash className="w-6 h-6 text-red-500" />
                        ) : (
                            <AlertTriangle className="w-6 h-6 text-amber-500" />
                        )}
                        {isSystemError ? 'Backend Connection Error' : 'Backend Setup Incomplete'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-8 space-y-4">
                    <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                        {message || (isSystemError
                            ? "We couldn't reach the backend server. Please make sure it's running."
                            : "Some required configuration is missing on the server.")}
                    </p>

                    {missingVariables && missingVariables.length > 0 && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                Missing Environment Variables:
                            </h4>
                            <ul className="grid grid-cols-1 gap-2">
                                {missingVariables.map(v => (
                                    <li key={v} className="font-mono text-sm bg-white dark:bg-slate-900 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400">
                                        {v}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="pt-4 text-sm text-slate-500 dark:text-slate-400 italic">
                        Check your <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">.env</code> file in the backend directory.
                    </div>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                        I understand
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className={`px-6 py-2.5 text-white font-medium rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/20 ${isSystemError ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        </div>
    );
};
