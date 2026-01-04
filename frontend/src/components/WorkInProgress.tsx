import React, { useState } from 'react'
import { Hammer, HardHat, Construction, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import StudentLayout from './Student/StudentLayout'

interface WorkInProgressProps {
    title: string
    username: string
    onLogout: () => void
}

const WorkInProgress: React.FC<WorkInProgressProps> = ({ title, username, onLogout }) => {
    const navigate = useNavigate()
    // Local sidebar state to satisfy StudentLayout props
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    return (
        <StudentLayout
            username={username}
            onLogout={onLogout}
            isCollapsed={isCollapsed}
            toggleCollapse={() => setIsCollapsed(prev => !prev)}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
        >
            <div className="min-h-screen bg-gray-50 p-8">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-red-600"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        <p className="text-sm text-gray-500">Module Status: In Development</p>
                    </div>
                </div>

                {/* Content Card */}
                <div className="max-w-4xl mx-auto mt-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative"
                    >
                        {/* Top Red Bar */}
                        <div className="h-2 bg-gradient-to-r from-red-500 to-red-700" />

                        <div className="p-16 text-center relative z-10">
                            {/* Background decorative elements */}
                            <div className="absolute top-10 left-10 opacity-5">
                                <Construction size={120} />
                            </div>
                            <div className="absolute bottom-10 right-10 opacity-5">
                                <Hammer size={120} />
                            </div>

                            {/* Animated Icon */}
                            <motion.div
                                className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-lg"
                                animate={{
                                    y: [0, -10, 0],
                                    boxShadow: ["0 10px 15px -3px rgba(0, 0, 0, 0.1)", "0 20px 25px -5px rgba(0, 0, 0, 0.1)", "0 10px 15px -3px rgba(0, 0, 0, 0.1)"]
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <HardHat className="w-12 h-12 text-red-600" />
                            </motion.div>

                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                We're Building Something <span className="text-red-600">Great</span>
                            </h2>

                            <p className="text-lg text-gray-600 max-w-lg mx-auto mb-8 leading-relaxed">
                                The <span className="font-semibold text-gray-900">{title}</span> module is currently under active development.
                                Our team is crafting a premium learning experience tailored just for you.
                            </p>

                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200 text-sm font-medium mb-10">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                </span>
                                Work in Progress
                            </div>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => navigate('/student/dashboard')}
                                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:bg-red-700 hover:shadow-red-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        </div>

                        {/* Bottom pattern */}
                        <div className="h-4 bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')] opacity-10" />
                    </motion.div>
                </div>
            </div>
        </StudentLayout>
    )
}

export default WorkInProgress
