import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Check } from 'lucide-react'

interface LogoutAnimationProps {
    username: string
    onComplete: () => void
}

const LogoutAnimation: React.FC<LogoutAnimationProps> = ({ username, onComplete }) => {
    const [step, setStep] = useState(0)

    useEffect(() => {
        // Step 1: Initial load
        const t1 = setTimeout(() => setStep(1), 500)
        // Step 2: Transition to check
        const t2 = setTimeout(() => setStep(2), 2000)
        // Step 3: Complete
        const t3 = setTimeout(onComplete, 3500)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
        }
    }, [onComplete])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md"
        >
            <div className="relative">
                {/* Background Glow */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-red-600/20 blur-[60px] rounded-full"
                />

                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white/95 backdrop-blur-xl border border-white/20 p-12 rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden min-w-[320px]"
                >
                    {/* Decorative Top Line */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

                    <div className="flex justify-center mb-8 relative">
                        <AnimatePresence mode="wait">
                            {step < 2 ? (
                                <motion.div
                                    key="logout"
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{
                                        scale: 1,
                                        rotate: 0,
                                        transition: { type: "spring", stiffness: 200 }
                                    }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-inner"
                                >
                                    <LogOut size={40} className={step === 1 ? "animate-pulse" : ""} />
                                    {/* Spinner Ring */}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 border-4 border-red-500/20 border-t-red-600 rounded-2xl"
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ scale: 0, rotate: 180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-xl shadow-green-200/50"
                                >
                                    <Check size={40} strokeWidth={3} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-2">
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-bold text-slate-900"
                        >
                            {step < 2 ? "Logging Out..." : "See you soon!"}
                        </motion.h2>

                        <motion.p
                            className="text-slate-500 font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={step < 2 ? "desc1" : "desc2"}
                        >
                            {step < 2
                                ? "Securely clearing your session data"
                                : `Have a great day, ${username.split(' ')[0]}!`
                            }
                        </motion.p>
                    </div>

                    {step < 2 && (
                        <motion.div
                            className="h-1 bg-slate-100 mt-8 rounded-full overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <motion.div
                                className="h-full bg-red-600"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                            />
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    )
}

export default LogoutAnimation
