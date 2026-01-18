import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, Loader2, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastProps {
    id: string;
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

export const Toast = ({ id, message, type = 'success', duration = 3000, onClose }: ToastProps) => {
    useEffect(() => {
        if (type !== 'loading' && duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [id, type, duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        loading: <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg min-w-[300px] max-w-md pointer-events-auto"
        >
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                {message}
            </p>
            {type !== 'loading' && (
                <button
                    onClick={() => onClose(id)}
                    className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </motion.div>
    );
};

export const ToastContainer = ({ toasts, onClose }: { toasts: any[], onClose: (id: string) => void }) => {
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} onClose={onClose} />
                ))}
            </AnimatePresence>
        </div>
    );
};
