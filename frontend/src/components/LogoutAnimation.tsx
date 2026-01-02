import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ShieldCheck, Sparkles } from 'lucide-react'

interface LogoutAnimationProps {
    username: string
    onComplete: () => void
}

const LogoutAnimation: React.FC<LogoutAnimationProps> = ({ username, onComplete }) => {
    const [step, setStep] = useState<'toss' | 'secure' | 'fade'>('toss')

    useEffect(() => {
        // Timeline
        const t1 = setTimeout(() => setStep('secure'), 2200)
        const t2 = setTimeout(() => setStep('fade'), 3500)
        const t3 = setTimeout(onComplete, 4000)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
        }
    }, [onComplete])

    // Generate random particles for background
    const particles = Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        scale: Math.random() * 0.5 + 0.5,
        delay: Math.random() * 2
    }))

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md overflow-hidden"
        >
            {/* Ambient Background Particles */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0, x: `${p.x}vw`, y: `${p.y}vh` }}
                    animate={{
                        opacity: [0, 0.4, 0],
                        y: [`${p.y}vh`, `${p.y - 20}vh`],
                        rotate: [0, 90, 180]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear"
                    }}
                    className="absolute w-2 h-2 bg-red-500/20 rounded-full blur-[1px]"
                />
            ))}

            <div className="relative text-center w-full max-w-md mx-6">

                {/* Central Icon Stage */}
                <div className="h-40 flex items-center justify-center relative mb-8">
                    <AnimatePresence mode="wait">
                        {step === 'toss' && (
                            <motion.div
                                key="cap"
                                className="relative"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.3 } }}
                            >
                                {/* Glow behind cap */}
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-red-600/30 blur-2xl rounded-full"
                                />

                                <motion.div
                                    initial={{ y: 0, rotate: 0 }}
                                    animate={{
                                        y: [0, -40, 0],
                                        rotate: [0, -15, 15, 0],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{
                                        duration: 2,
                                        times: [0, 0.4, 1],
                                        ease: "easeInOut"
                                    }}
                                    className="relative z-10"
                                >
                                    <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-3xl shadow-2xl shadow-red-900/50">
                                        <GraduationCap className="w-16 h-16 text-white" />
                                    </div>
                                </motion.div>

                                {/* Sparkles appearing around */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute -top-4 -right-4"
                                >
                                    <Sparkles className="w-6 h-6 text-yellow-400 animate-bounce" />
                                </motion.div>
                            </motion.div>
                        )}

                        {step === 'secure' && (
                            <motion.div
                                key="shield"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", damping: 12 }}
                                className="bg-white p-6 rounded-full shadow-2xl shadow-green-500/20 relative z-10"
                            >
                                <ShieldCheck className="w-16 h-16 text-green-600" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Typography */}
                <motion.div
                    layout
                    className="space-y-3"
                >
                    <AnimatePresence mode="wait">
                        <motion.h2
                            key={step === 'toss' ? 'title1' : 'title2'}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="text-3xl font-bold text-white tracking-tight"
                        >
                            {step === 'toss' ? 'Wrapping Up...' : 'Session Secured'}
                        </motion.h2>
                    </AnimatePresence>

                    <motion.p
                        className="text-slate-400 font-medium"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {step === 'toss'
                            ? `Saving progress for ${username}`
                            : 'See you next time!'}
                    </motion.p>
                </motion.div>

                {/* Progress Bar */}
                <div className="mt-12 mx-auto max-w-[200px] h-1 bg-slate-800/50 rounded-full overflow-hidden relative">
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-400"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3.5, ease: "easeInOut" }}
                    />
                    {/* Shimmer effect on bar */}
                    <motion.div
                        className="absolute inset-y-0 width-full bg-white/20 blur-md"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        style={{ width: "50%" }}
                    />
                </div>
            </div>
        </motion.div>
    )
}

export default LogoutAnimation
