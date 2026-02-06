import { motion } from 'framer-motion';
import { ArrowRight, Cloud, Shield, Search, Wand2 } from 'lucide-react';
import logo from '../assets/logo.png';

interface LandingPageProps {
    onEnter: () => void;
    onLogin: () => void;
    isAuthenticated: boolean;
}

export const LandingPage = ({ onEnter, onLogin, isAuthenticated }: LandingPageProps) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring" as const,
                stiffness: 100
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[100px]" />
            </div>

            <div className="container max-w-6xl px-6 py-12 relative z-10 flex flex-col items-center">
                {/* Header / Hero */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-center flex flex-col items-center mb-16"
                >
                    <motion.div variants={itemVariants} className="mb-6 relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-30 rounded-full"></div>
                        <img src={logo} alt="CardCraft Studio" className="w-24 h-24 object-contain relative z-10 drop-shadow-xl" />
                    </motion.div>

                    {isAuthenticated && (
                        <motion.div
                            variants={itemVariants}
                            className="mb-4 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium"
                        >
                            Welcome back!
                        </motion.div>
                    )}

                    <motion.h1
                        variants={itemVariants}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                    >
                        CardCraft Studio
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8 leading-relaxed"
                    >
                        The professional tool for designing, managing, and exporting card game assets.
                        <br />
                        <span className="text-foreground font-semibold">Your creativity, owned by you.</span>
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={onEnter}
                            className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all flex items-center gap-2"
                        >
                            {isAuthenticated ? "Enter Studio" : "Continue as Guest"} <ArrowRight className="w-5 h-5" />
                        </button>

                        {!isAuthenticated && (
                            <button
                                onClick={onLogin}
                                className="px-8 py-4 rounded-xl bg-card border border-border text-foreground font-semibold text-lg hover:bg-accent hover:text-accent-foreground transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Cloud className="w-5 h-5" /> Login with Google
                            </button>
                        )}
                    </motion.div>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
                >
                    {/* Guest Tier */}
                    <FeatureCard
                        icon={<Shield className="w-8 h-8 text-green-500" />}
                        title="Guest Access"
                        description="Start creating immediately. Store your decks and data locally on your device. No account required."
                        delay={0.2}
                    />

                    {/* Registered Tier */}
                    <FeatureCard
                        icon={<Cloud className="w-8 h-8 text-blue-500" />}
                        title="Registered Free"
                        description="Log in with Google to enable Drive synchronization. Access your decks from anywhere across devices."
                        delay={0.3}
                    />

                    {/* Premium Tier */}
                    <FeatureCard
                        icon={<Wand2 className="w-8 h-8 text-purple-500" />}
                        title="Premium"
                        description="Unlock exclusive AI tools. Generate illustrations and search for images directly within the studio."
                        delay={0.4}
                    />
                </motion.div>

                {/* Premium Section */}
                <motion.div
                    variants={itemVariants}
                    className="mt-16 w-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-8 backdrop-blur-sm"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent flex items-center gap-2 mb-4">
                                <Wand2 className="w-6 h-6 text-amber-500" /> Unlock Premium Power
                            </h3>
                            <p className="text-muted-foreground text-lg mb-4">
                                Core features and Sync are free forever. Premium users unlock exclusive AI-powered tools.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-foreground/90">
                                    <span className="p-1 rounded-full bg-amber-500/20 text-amber-600"><Search className="w-4 h-4" /></span>
                                    <span>Instant <strong>Web Image Search</strong> integration</span>
                                </li>
                                <li className="flex items-center gap-3 text-foreground/90">
                                    <span className="p-1 rounded-full bg-amber-500/20 text-amber-600"><Palette className="w-4 h-4" /></span>
                                    <span><strong>AI-Assisted Illustration</strong> generation</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex-shrink-0">
                            <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-3xl opacity-20 absolute pointer-events-none"></div>
                            {/* Decorative Element */}
                        </div>
                    </div>
                </motion.div>

                <motion.p variants={itemVariants} className="mt-12 text-sm text-muted-foreground/60">
                    © {new Date().getFullYear()} CardCraft Studio. All rights reserved.
                </motion.p>
            </div>
        </div>
    );
};

// Simple icon placeholder if Palette is missing from import... wait, I added Palette to import below.
import { Palette } from 'lucide-react';

const FeatureCard = ({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) => (
    <motion.div
        variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { delay } }
        }}
        className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/80 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
    >
        <div className="mb-4 p-3 rounded-xl bg-background/50 w-fit group-hover:scale-110 transition-transform duration-300 shadow-sm border border-border/20">
            {icon}
        </div>
        <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-500 transition-colors">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">
            {description}
        </p>
    </motion.div>
);
