import { useState, type ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
import { Loader2 } from 'lucide-react';
import { ENABLE_PAYMENTS } from '../../config/features';

interface PremiumGateProps {
    feature: 'search' | 'generate';
    children: ReactNode;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
    feature,
    children
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const isPremium = user?.plan === 'premium' || user?.plan === 'admin';
    // For MVP, we'll allow search for everyone, but gate generate
    const isFeatureAllowed = feature === 'search' || isPremium;

    const handleUpgrade = async () => {
        try {
            setLoading(true);
            const url = await subscriptionService.createCheckoutSession();
            window.location.href = url;
        } catch (error) {
            console.error('Upgrade failed:', error);
            alert('Failed to start upgrades. Please try again.');
            setLoading(false);
        }
    };

    if (isFeatureAllowed) {
        return <>{children}</>;
    }

    // Show premium upgrade prompt
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-6 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>

            <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Premium Feature</h3>
                <p className="text-gray-400 max-w-md">
                    {feature === 'generate'
                        ? 'AI image generation is available exclusively for Premium members.'
                        : 'Image search is available exclusively for Premium members.'
                    }
                </p>
            </div>

            <div className="space-y-3 w-full max-w-sm">
                {ENABLE_PAYMENTS ? (
                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upgrade to Premium'}
                    </button>
                ) : (
                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-gray-400 text-sm">
                        Premium upgrades are currently disabled.
                    </div>
                )}
                <p className="text-xs text-gray-500">
                    Unlock unlimited AI generations, advanced search, and more
                </p>
            </div>

            <div className="pt-4 border-t border-gray-700 w-full max-w-sm">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Cancel anytime • No commitment</span>
                </div>
            </div>
        </div>
    );
};
