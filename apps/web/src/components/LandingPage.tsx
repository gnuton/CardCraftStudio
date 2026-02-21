import { motion } from 'framer-motion';

import {
    ArrowRight,
    CheckCircle2,
    Layers,
    Zap,
    Layout,
    Github,
    Twitter,
    Menu,
    X,
    ChevronRight,
    Box,
    Cpu,
    Moon,
    Sun,
    Shield,
    Cloud,
    Heart,
    FolderPlus,
    Palette,
    Wand2,
    Download
} from 'lucide-react';
import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';

import featureAssetManagement from '../assets/feature-asset-management.png';
import featureCardEditor from '../assets/feature-card-editor.png';
import featureAiTools from '../assets/feature-ai-tools.png';

import { PricingSection } from './PricingSection';

interface LandingPageProps {
    onEnter: () => void;
    onLogin: () => void;
    isAuthenticated: boolean;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}



export const LandingPage = ({ onEnter, onLogin, isAuthenticated, theme, toggleTheme }: LandingPageProps) => {
    return (
        <div className="min-h-screen bg-transparent text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">

            <div className="relative z-10 w-full overflow-x-hidden">
                <Navbar
                    onEnter={onEnter}
                    onLogin={onLogin}
                    isAuthenticated={isAuthenticated}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />
                <main className="flex flex-col">
                    <HeroSection onEnter={onEnter} onLogin={onLogin} isAuthenticated={isAuthenticated} />
                    <FeatureSection />
                    <PricingSection isAuthenticated={isAuthenticated} />
                    <PrivacySection />
                    <WorkflowSection />
                    <Footer />
                </main>
            </div>
        </div>
    );
};

const Navbar = ({ onEnter, onLogin, isAuthenticated, theme, toggleTheme }: LandingPageProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const navbarHeight = 80; // Approximate height including padding
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setIsMenuOpen(false);
        }
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800'
                : 'bg-transparent border-transparent'
                }`}
        >
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${scrolled ? 'py-0' : 'py-2'}`}>
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img
                            src={logo}
                            alt="CardCraft Studio Logo"
                            className={`object-contain transition-all duration-300 drop-shadow-md ${scrolled ? 'w-10 h-10' : 'w-14 h-14'}`}
                        />
                        <span className={`font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent transition-all duration-300 ${scrolled ? 'text-xl' : 'text-3xl'}`}>
                            CardCraft Studio
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
                        <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</a>
                        <a href="#workflow" onClick={(e) => scrollToSection(e, 'workflow')} className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Workflow</a>

                        <div className="flex items-center gap-3 ml-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            {!isAuthenticated && (
                                <button onClick={onLogin} className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors">Log in</button>
                            )}
                            <button onClick={onEnter} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all active:scale-95">
                                {isAuthenticated ? 'Dashboard' : 'Get Started'}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-neutral-600 dark:text-neutral-400">
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                    <div className="px-4 py-6 space-y-4">
                        <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="block text-base font-medium text-neutral-600 dark:text-neutral-400">Features</a>
                        <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="block text-base font-medium text-neutral-600 dark:text-neutral-400">Pricing</a>
                        <a href="#workflow" onClick={(e) => scrollToSection(e, 'workflow')} className="block text-base font-medium text-neutral-600 dark:text-neutral-400">Workflow</a>
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
                            {!isAuthenticated && (
                                <button onClick={() => { onLogin(); setIsMenuOpen(false); }} className="w-full px-4 py-2 text-center text-sm font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 rounded-lg">Log in</button>
                            )}
                            <button onClick={() => { onEnter(); setIsMenuOpen(false); }} className="w-full px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg">{isAuthenticated ? 'Go to Dashboard' : 'Get Started'}</button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

const HeroSection = ({ onEnter, onLogin, isAuthenticated }: Pick<LandingPageProps, 'onEnter' | 'onLogin' | 'isAuthenticated'>) => {
    return (
        <section className="relative pt-32 pb-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 text-center lg:text-left">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-neutral-900 dark:text-white mb-6"
                        >
                            Build Card Games <br />
                            <span className="text-blue-600">Like a Pro.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-lg md:text-xl text-neutral-700 dark:text-neutral-300 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
                        >
                            The most advanced open-source studio for designing, managing, and exporting tabletop game assets. Zero lock-in, infinite creativity.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                        >
                            <button
                                onClick={onEnter}
                                className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-2"
                            >
                                Start Building Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>

                            {!isAuthenticated && (
                                <button
                                    onClick={onLogin}
                                    className="px-8 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl font-semibold text-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center gap-2"
                                >
                                    Login via Google
                                </button>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-neutral-500 dark:text-neutral-500"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-500" /> Open Source
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-500" /> Offline Capable
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-500" /> Cloud Sync
                            </div>
                        </motion.div>
                    </div>

                    <div className="flex-1 relative w-full max-w-xl lg:max-w-none">
                        <motion.div
                            initial={{ opacity: 0, x: 50, rotateY: -10 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            transition={{ duration: 0.8, type: "spring" }}
                            className="relative z-10"
                        >
                            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden aspect-[4/3] group">
                                <img
                                    src={featureCardEditor}
                                    alt="CardCraft Studio Interface"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 dark:from-neutral-900/50 to-transparent pointer-events-none"></div>
                            </div>

                            {/* Floating Badge 1 */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="absolute -top-6 -right-6 p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 flex items-center gap-3"
                            >
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                                    <Layers size={20} />
                                </div>
                                <div>
                                    <div className="text-xs text-neutral-500">Assets</div>
                                    <div className="text-sm font-bold">Auto-Synced</div>
                                </div>
                            </motion.div>

                            {/* Floating Badge 2 */}
                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                                className="absolute -bottom-8 -left-8 p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 flex items-center gap-3"
                            >
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <div className="text-xs text-neutral-500">Generation</div>
                                    <div className="text-sm font-bold">AI Powered</div>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Background blobs */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-200/30 dark:bg-blue-500/20 blur-[100px] -z-10 rounded-full"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FeatureSection = () => {
    const features = [
        {
            title: "Asset Management",
            description: "Organize your game assets with a powerful tagging system. Drag and drop uploads, auto-optimization, and cloud synchronization keep your library pristine.",
            icon: <Box className="w-6 h-6 text-white" />,
            color: "bg-blue-600",
            image: featureAssetManagement
        },
        {
            title: "Visual Card Editor",
            description: "What you see is what you get. Our real-time editor supports rich text, layers, masking, and dynamic templates that adapt to your content.",
            icon: <Layout className="w-6 h-6 text-white" />,
            color: "bg-purple-600",
            image: featureCardEditor
        },
        {
            title: "AI Generation",
            description: "Stuck on art? Use our integrated AI tools to generate illustrations, icons, and flavor text directly within the studio context.",
            icon: <Cpu className="w-6 h-6 text-white" />,
            color: "bg-orange-600",
            image: featureAiTools
        }
    ];

    return (
        <section id="features" className="py-24 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-3xl mx-auto mb-20"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Designed for Modern Game Makers</h2>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400">
                        Stop fighting with generic design tools. CardCraft is built from the ground up to handle the specific complexities of tabletop game design.
                    </p>
                </motion.div>

                <div className="space-y-24">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7, delay: idx * 0.1 }}
                            className={`flex flex-col lg:flex-row items-center gap-16 ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                        >
                            <div className="flex-1">
                                <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-6 shadow-lg shadow-blue-900/20`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
                                    {feature.description}
                                </p>
                                <div className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 cursor-pointer group">
                                    Learn more <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                            <div className="flex-1 w-full">
                                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-2 shadow-xl hover:shadow-2xl transition-shadow duration-500">
                                    <div className="rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 aspect-video relative group">
                                        <img
                                            src={feature.image}
                                            alt={feature.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-xl pointer-events-none"></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const PrivacySection = () => {
    return (
        <section className="py-24 bg-white dark:bg-neutral-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 order-2 lg:order-1">
                        <div className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-xl dark:shadow-2xl">
                            <div className="aspect-square rounded-xl overflow-hidden relative bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <Shield className="w-32 h-32 text-blue-600 dark:text-blue-400" strokeWidth={1} />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 order-1 lg:order-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 text-green-600 dark:text-green-400 text-xs font-semibold uppercase tracking-wide mb-6">
                                <Shield className="w-3 h-3" /> Privacy First
                            </div>

                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white">
                                Your Data Stays <span className="text-green-600 dark:text-green-500">Yours.</span>
                            </h2>

                            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                                We believe in zero lock-in and total privacy. CardCraft Studio runs entirely in your browser, and your assets are stored directly in your own Google Drive.
                            </p>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <Cloud className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Google Drive Storage</h4>
                                        <p className="text-neutral-600 dark:text-neutral-400">
                                            All your projects, images, and templates are saved to your personal Google Drive. We never see your data.
                                        </p>
                                    </div>
                                </div>


                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                        <Heart className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">100% Ownership</h4>
                                        <p className="text-neutral-600 dark:text-neutral-400">
                                            You own every pixel you create. Export your cards as PNG, PDF, or JSON at any time.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const WorkflowSection = () => {
    const steps = [
        {
            icon: <FolderPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
            title: "1. Create & Organize",
            description: "Start by creating a deck and importing your flavor text, stats, and image assets."
        },
        {
            icon: <Palette className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
            title: "2. Design Templates",
            description: "Use the visual editor to build intelligent layouts using rich text, shapes, and image placeholders."
        },
        {
            icon: <Wand2 className="w-8 h-8 text-orange-600 dark:text-orange-400" />,
            title: "3. Apply & Generate",
            description: "Apply your dynamic templates to your cards. Use integrated AI tools to generate artwork instantly."
        },
        {
            icon: <Download className="w-8 h-8 text-green-600 dark:text-green-400" />,
            title: "4. Export & Print",
            description: "Export your finished cards as high-resolution PDFs for print-and-play or images for digital tabletop."
        }
    ];

    return (
        <section id="workflow" className="py-24 relative bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-3xl mx-auto mb-20"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white">How it Works</h2>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400">
                        From raw idea to print-ready assets in four simple steps.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 hover:shadow-xl transition-all hover:-translate-y-1 shadow-sm"
                        >
                            <div className="mb-6 inline-flex p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{step.title}</h3>
                            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative rounded-3xl p-12 md:p-20 text-center overflow-hidden group"
                >
                    {/* Fancy Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 z-0"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 mix-blend-overlay"></div>

                    {/* Animated Shapes */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-sm">Ready to bring your game to life?</h2>
                        <p className="text-blue-100/90 text-xl mb-10 font-medium max-w-2xl mx-auto">
                            Join thousands of designers creating their prototypes and final assets with CardCraft.
                        </p>
                        <button className="px-10 py-5 bg-white text-blue-700 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 duration-200 ring-4 ring-white/20">
                            Start Creating Now
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="bg-neutral-50 dark:bg-neutral-950 pt-16 pb-8 border-t border-neutral-200 dark:border-neutral-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <img src={logo} alt="CardCraft" className="w-6 h-6 grayscale opacity-70" />
                            <span className="font-bold text-lg text-neutral-800 dark:text-neutral-200">CardCraft</span>
                        </div>
                        <p className="text-sm text-neutral-500 mb-4">
                            Open source card game design studio. Built by gamers, for gamers.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"><Github size={20} /></a>
                            <a href="#" className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"><Twitter size={20} /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-neutral-900 dark:text-white mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Templates</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Roadmap</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-neutral-900 dark:text-white mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">API</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Community</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Blog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-neutral-900 dark:text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Terms</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Security</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-neutral-200 dark:border-neutral-900 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-neutral-500">
                        © {new Date().getFullYear()} CardCraft Studio. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
