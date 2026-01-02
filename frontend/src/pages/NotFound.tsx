import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

const NotFound = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px]"
            />
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-slate-500/5 rounded-full blur-[100px]"
            />

            <div className="max-w-md w-full text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Icon */}
                    <div className="mx-auto w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mb-8 shadow-sm border border-red-100">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>

                    {/* Text */}
                    <h1 className="text-8xl font-black text-slate-900 mb-2 tracking-tighter">404</h1>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Page Not Found</h2>
                    <p className="text-slate-500 mb-10 leading-relaxed">
                        Oops! The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                    </p>

                    {/* Action */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2 mx-auto"
                    >
                        <Home className="w-4 h-4" />
                        Return to Home
                    </motion.button>
                </motion.div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 text-center w-full">
                <p className="text-slate-300 text-xs font-medium">© GradEdge Inc.</p>
            </div>
        </div>
    )
}

export default NotFound
