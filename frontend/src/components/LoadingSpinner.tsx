import { motion } from 'framer-motion'

type Props = {
    size?: 'sm' | 'md' | 'lg'
    className?: string
    fullScreen?: boolean
    label?: string
}

export default function LoadingSpinner({ size = 'md', className = '', fullScreen = false, label }: Props) {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-[3px]',
        lg: 'w-12 h-12 border-4',
    }

    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <motion.div
                className={`rounded-full border-slate-200 border-t-red-500 ${sizeClasses[size]} ${className}`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            {label && <p className="text-sm font-medium text-slate-500 animate-pulse">{label}</p>}
        </div>
    )

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                {spinner}
            </div>
        )
    }

    return spinner
}
