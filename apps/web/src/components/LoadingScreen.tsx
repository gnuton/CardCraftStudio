import { useMemo } from 'react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';
import splash from '../assets/splash.png';

interface LoadingScreenProps {
    version: string;
}

export const LoadingScreen = ({ version }: LoadingScreenProps) => {
    // Pre-compute random values to avoid calling Math.random() during render
    const particles = useMemo(() =>
        [...Array(6)].map(() => ({
            initialX: Math.random() * 100 + '%',
            initialY: Math.random() * 100 + '%',
            width: Math.random() * 300 + 100,
            height: Math.random() * 300 + 100,
            animateX: [null, Math.random() * 100 + '%', Math.random() * 100 + '%'],
            animateY: [null, Math.random() * 100 + '%', Math.random() * 100 + '%'],
            duration: Math.random() * 20 + 10,
        })), []
    );

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden"
        >
            {/* Background Splash Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={splash}
                    alt="Design Background"
                    className="w-full h-full object-cover opacity-30 scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center px-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        duration: 0.8,
                        delay: 0.2,
                        ease: [0, 0.71, 0.2, 1.01]
                    }}
                    className="mb-8 relative"
                >
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                    <img src={logo} alt="Logo" className="w-32 h-32 object-contain relative z-10 drop-shadow-2xl" />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-5xl md:text-6xl font-black tracking-tight mb-2 bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent"
                >
                    CardCraft Studio
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-slate-400 text-lg font-medium tracking-widest uppercase mb-12"
                >
                    Design. Create. Conquer.
                </motion.p>

                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 200 }}
                    transition={{ duration: 1.5, delay: 1, ease: 'easeInOut' }}
                    className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full mb-8"
                />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ duration: 0.6, delay: 2 }}
                    className="absolute bottom-10 text-xs font-mono tracking-tighter text-slate-500"
                >
                    VERSION {version}
                </motion.div>
            </div>

            {/* Subtle animated elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {particles.map((particle, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-indigo-500/10 blur-3xl"
                        initial={{
                            x: particle.initialX,
                            y: particle.initialY,
                            width: particle.width,
                            height: particle.height,
                        }}
                        animate={{
                            x: particle.animateX,
                            y: particle.animateY,
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
};
