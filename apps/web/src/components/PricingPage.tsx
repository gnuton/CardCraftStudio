import { motion } from 'framer-motion';
import { Check, X, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

interface PricingPageProps {
    onBack: () => void;
    isAuthenticated: boolean;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const PricingPage = ({ onBack, isAuthenticated, theme, toggleTheme }: PricingPageProps) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const tiers = [
        {
            name: 'Hobby',
            price: 'Free',
            description: 'Perfect for prototyping and hobbyist game designers.',
            features: [
                'Unlimited local projects',
                'Google Drive Sync',
                'Basic Card Templates',
                'Export to PNG/PDF',
                'Community Support'
            ],
            notIncluded: [
                'AI Image Generation',
                'Advanced Layout Tools',
                'Team Collaboration'
            ],
            buttonText: isAuthenticated ? 'Current Plan' : 'Get Started',
            buttonAction: onBack,
            popular: false
        },
        {
            name: 'Pro',
            price: billingCycle === 'monthly' ? '$12' : '$10',
            period: '/month',
            description: 'For serious designers who need AI power and advanced tools.',
            features: [
                'Everything in Hobby',
                '500 AI Image Generations/mo',
                'Custom CSS/SVG Templates',
                'High-Res Print Export (300 DPI)',
                'Priority Support'
            ],
            notIncluded: [
                'Team Collaboration'
            ],
            buttonText: 'Coming Soon',
            buttonAction: () => { },
            popular: true
        },
        {
            name: 'Team',
            price: 'Contact',
            description: 'For studios and teams building commmerical games.',
            features: [
                'Everything in Pro',
                'Shared Asset Library',
                'Real-time Collaboration',
                'Version History',
                'Dedicated Account Manager'
            ],
            notIncluded: [],
            buttonText: 'Contact Sales',
            buttonAction: () => { },
            popular: false
        }
    ];

    return (
        <div className="min-h-screen bg-transparent text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="flex justify-between items-center mb-8">
                        <button
                            onClick={onBack}
                            className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                        >
                            ← Back to Home
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
                    <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-10">
                        Start for free, upgrade when you need AI superpowers.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${billingCycle === 'monthly'
                                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${billingCycle === 'yearly'
                                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                                }`}
                        >
                            Yearly <span className="text-green-600 dark:text-green-400 text-xs ml-1">-20%</span>
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {tiers.map((tier, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className={`relative rounded-3xl p-8 border ${tier.popular
                                ? 'border-blue-500 dark:border-blue-500 bg-white dark:bg-neutral-900 shadow-2xl shadow-blue-900/10 z-10 scale-105'
                                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950'
                                }`}
                        >
                            {tier.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-neutral-900 dark:text-white">{tier.price}</span>
                                    {tier.period && <span className="text-neutral-500">{tier.period}</span>}
                                </div>
                                <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    {tier.description}
                                </p>
                            </div>

                            <button
                                onClick={tier.buttonAction}
                                disabled={tier.buttonText === 'Coming Soon'}
                                className={`w-full py-3 px-4 rounded-xl font-bold transition-all mb-8 ${tier.popular
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25 active:scale-95'
                                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white active:scale-95'
                                    } ${tier.buttonText === 'Coming Soon' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {tier.buttonText}
                            </button>

                            <div className="space-y-4">
                                {tier.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm">
                                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        <span className="text-neutral-700 dark:text-neutral-300">{feature}</span>
                                    </div>
                                ))}
                                {tier.notIncluded.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm opacity-50">
                                        <X className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                                        <span className="text-neutral-500 dark:text-neutral-500 line-through">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
