import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  variant?: 'line' | 'bar' | 'wave';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, description, variant = 'wave' }) => {
  // Color schemes based on variant
  const getColors = () => {
    switch (variant) {
      case 'line': return 'from-blue-600/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'bar': return 'from-purple-600/20 to-pink-500/20 text-pink-400 border-pink-500/30';
      case 'wave': 
      default: return 'from-orange-600/20 to-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const scheme = getColors();

  return (
    <div className={`
      relative overflow-hidden rounded-3xl p-6 h-48
      bg-[#1a1a1a] border border-white/5
      group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50
    `}>
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${scheme} opacity-40`} />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
          <div className="mt-2 text-4xl font-bold text-white tracking-tight">{value}</div>
        </div>
        
        <p className="text-gray-400 text-xs font-light tracking-wide max-w-[80%]">
          {description}
        </p>
      </div>

      {/* Visuals */}
      <div className="absolute right-0 bottom-0 w-1/2 h-full pointer-events-none opacity-80 mix-blend-screen">
        {variant === 'line' && (
          <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            <path d="M0 50 Q 20 40, 40 45 T 80 20 T 100 10" fill="none" stroke="currentColor" strokeWidth="4" className="text-cyan-500" strokeLinecap="round" />
            <path d="M0 60 Q 30 50, 50 55 T 90 30 T 110 20" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-600 opacity-50" strokeLinecap="round" />
            <circle cx="80" cy="20" r="3" className="fill-white" />
            <circle cx="100" cy="10" r="3" className="fill-white" />
          </svg>
        )}

        {variant === 'bar' && (
          <svg viewBox="0 0 100 60" className="w-full h-full p-4 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
            <rect x="10" y="30" width="15" height="40" rx="4" className="fill-pink-600/50" />
            <rect x="35" y="15" width="15" height="55" rx="4" className="fill-pink-500" />
            <rect x="60" y="35" width="15" height="35" rx="4" className="fill-purple-500/80" />
            <circle cx="85" cy="45" r="10" className="fill-purple-400/50" />
          </svg>
        )}

        {variant === 'wave' && (
           <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]">
             <path d="M0 40 C 30 50, 50 30, 70 40 S 100 10, 100 10 V 60 H 0 Z" className="fill-red-500/30" />
             <path d="M0 50 C 20 60, 60 40, 80 50 S 100 40, 100 40 V 60 H 0 Z" className="fill-orange-500/40" />
           </svg>
        )}
      </div>

      {/* Glow Effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-colors" />
    </div>
  );
};

export default StatsCard;
