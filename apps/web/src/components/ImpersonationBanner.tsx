import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const ImpersonationBanner: React.FC = () => {
    const { impersonation, exitImpersonation } = useAuth();
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (!impersonation.isImpersonating || !impersonation.expiresAt) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const expiry = impersonation.expiresAt!.getTime();
            const remaining = expiry - now;

            if (remaining <= 0) {
                setTimeRemaining('Expired');
                return;
            }

            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            setTimeRemaining(`${minutes}m ${seconds}s`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [impersonation.isImpersonating, impersonation.expiresAt]);

    // Handle ESC key to exit impersonation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && impersonation.isImpersonating) {
                handleExit();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [impersonation.isImpersonating]);

    const handleExit = async () => {
        if (isExiting) return;

        setIsExiting(true);
        try {
            await exitImpersonation();
        } catch (error) {
            console.error('Failed to exit impersonation:', error);
            alert('Failed to exit impersonation. Please try again.');
        } finally {
            setIsExiting(false);
        }
    };

    if (!impersonation.isImpersonating) {
        return null;
    }

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-2xl"
            role="alert"
            aria-live="polite"
        >
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Left Side - Impersonation Info */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm animate-pulse">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm uppercase tracking-wide">
                                    🎭 Impersonating User
                                </span>
                                <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-mono">
                                    {impersonation.targetUser?.plan || 'unknown'}
                                </span>
                            </div>
                            <div className="text-xs opacity-90 flex items-center gap-2">
                                <span className="font-medium">{impersonation.targetUser?.email}</span>
                                <span className="opacity-60">as</span>
                                <span className="font-medium">{impersonation.adminUser?.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Timer & Exit Button */}
                    <div className="flex items-center gap-3">
                        {/* Timer */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-mono font-semibold">{timeRemaining}</span>
                        </div>

                        {/* Exit Button */}
                        <button
                            onClick={handleExit}
                            disabled={isExiting}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                            aria-label="Exit impersonation mode"
                        >
                            {isExiting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Exiting...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span>Exit (ESC)</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Warning Message */}
                <div className="mt-2 text-xs opacity-80 flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>
                        You are viewing the application as this user would see it. Admin features are disabled during impersonation.
                    </span>
                </div>
            </div>
        </div>
    );
};
