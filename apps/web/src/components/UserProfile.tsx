import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, Crown, Loader2, Folder } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { ENABLE_PAYMENTS } from '../config/features';
import { AssetManager } from './AssetManager';

export const UserProfile: React.FC = () => {
    const { user, isAuthenticated, login, logout, isLoading } = useAuth();
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            // Use the shared driveService logic to get the auth code manually via popup
            // This avoids the Cross-Origin-Opener-Policy warning from the GSI library hook
            const code = await import('../services/googleDrive').then(m => m.driveService.getAuthCode());

            await login({
                code: code,
                redirectUri: window.location.origin + '/CardCraftStudio/oauth-callback.html' // Pass expected redirect URI
            });
        } catch (err) {
            console.error('Unified Login Failed', err);
        }
    };

    const handleUpgrade = async () => {
        try {
            setIsUpgrading(true);
            const url = await subscriptionService.createCheckoutSession();
            window.location.href = url;
        } catch (error) {
            console.error('Upgrade failed:', error);
            alert('Failed to start upgrade.');
            setIsUpgrading(false);
        }
    };

    if (isLoading) return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;

    if (!isAuthenticated) {
        return (
            <div className="flex items-center">
                <button
                    onClick={handleGoogleLogin}
                    className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-full font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                    <UserIcon className="w-4 h-4" />
                    <span>Sign In with Google</span>
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-medium">{user?.email.split('@')[0]}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${user?.plan === 'premium'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : user?.plan === 'admin'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                    {user?.plan === 'premium' ? (
                        <span className="flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" /> PRO
                        </span>
                    ) : user?.plan === 'admin' ? (
                        <span className="flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" /> ADMIN
                        </span>
                    ) : 'Free'}
                </span>
            </div>

            <div className="relative group">
                <button className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-sm hover:shadow-md transition-all">
                    <UserIcon className="w-5 h-5" />
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-background border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                    <div className="p-3 border-b">
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <div className="p-1">
                        <button
                            onClick={() => setIsAssetManagerOpen(true)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Folder className="w-4 h-4" />
                            Asset Manager
                        </button>
                        {user?.plan !== 'premium' && user?.plan !== 'admin' && ENABLE_PAYMENTS && (
                            <button
                                onClick={handleUpgrade}
                                disabled={isUpgrading}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors flex items-center gap-2 text-amber-600 font-medium"
                            >
                                {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                                Upgrade to Pro
                            </button>
                        )}
                        <button
                            onClick={logout}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Asset Manager Modal */}
            <AssetManager
                isOpen={isAssetManagerOpen}
                onClose={() => setIsAssetManagerOpen(false)}
            />
        </div>
    );
};
