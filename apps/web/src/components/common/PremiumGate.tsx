import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock } from 'lucide-react';

interface PremiumGateProps {
    children: React.ReactNode;
    feature?: string;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ children, feature = 'premium feature' }) => {
    const { user, isLoading } = useAuth(); // Assuming useAuth exposes isPro is safer?
    // AuthContext shows user has 'plan' and 'isAdmin'.

    if (isLoading) return null;

    const isPro = user?.plan === 'premium' || user?.plan === 'admin' || user?.isAdmin;

    if (isPro) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 h-full text-center space-y-4">
            <div className="p-4 bg-gray-800 rounded-full">
                <Lock className="w-8 h-8 text-pink-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Premium Feature</h3>
            <p className="text-gray-400 max-w-sm">
                Upgrade to Pro to access {feature} and other premium features.
            </p>
            <button className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-white font-bold hover:shadow-lg shadow-pink-500/20 transition-all">
                Upgrade Now
            </button>
        </div>
    );
};
