import React from 'react';

interface StatsCardProps {
  label: string;
  value: number | string;
  variant: 'black' | 'white' | 'red' | 'gray' | 'emerald' | 'rose' | 'purple' | string;
  icon: React.ElementType;
  isRadial?: boolean;
}

export function StatsCard({ label, value, variant, icon: Icon, isRadial = false }: StatsCardProps) {
   // Codename Aesthetic: 
   // - Black Card: Deep Black (#000) or Very Dark Slate. Rounded-3xl.
   // - White Card: Clean white, soft shadow.
   // - Typography: Inter-like, tight tracking.
   
   const styles: any = {
      // The "Best Deal" card style
      black: 'bg-[#111] text-white shadow-xl shadow-slate-300 ring-4 ring-slate-50',
      
      // The "Top Sales" card style
      white: 'bg-white text-slate-900 border border-slate-100 shadow-lg shadow-slate-100',
      
      // Primary Red
      red: 'bg-[#EA0029] text-white shadow-xl shadow-rose-200 ring-4 ring-rose-50',

      // Additional variants for Tests page
      emerald: 'bg-emerald-500 text-white shadow-xl shadow-emerald-200 ring-4 ring-emerald-50',
      rose: 'bg-rose-500 text-white shadow-xl shadow-rose-200 ring-4 ring-rose-50',
      purple: 'bg-purple-500 text-white shadow-xl shadow-purple-200 ring-4 ring-purple-50',
      
      gray: 'bg-slate-50 text-slate-700'
   };
   
   const currentStyle = styles[variant] || styles.white;
   // Dark text for white/gray cards, White text for colored/black cards
   const isDark = ['black', 'red', 'emerald', 'rose', 'purple'].includes(variant);

   // Icon background logic
   const getIconBg = () => {
       if (variant === 'red') return 'bg-white/20 text-white';
       if (variant === 'black') return 'bg-white/10 text-white';
       if (variant === 'emerald') return 'bg-white/20 text-white';
       if (variant === 'rose') return 'bg-white/20 text-white';
       if (variant === 'purple') return 'bg-white/20 text-white';
       return 'bg-slate-50 text-slate-900';
   };

   return (
      <div className={`p-6 rounded-[32px] relative overflow-hidden transition-all hover:scale-[1.02] duration-300 h-44 flex flex-col justify-between ${currentStyle}`}>
         
         <div className="flex justify-between items-start relative z-10">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getIconBg()}`}>
                <Icon />
             </div>
             
             {/* Radial Mockup for Black Card (optional visual from original design) */}
             {isRadial && (
                <div className="absolute -right-4 -top-4 w-28 h-28 flex items-center justify-center opacity-80 pointer-events-none">
                     <svg className="w-full h-full transform -rotate-90">
                           <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                           <circle cx="50%" cy="50%" r="40%" stroke={isDark ? '#FFF' : '#EA0029'} strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - 0.78)} strokeLinecap="round" />
                     </svg>
                </div>
             )}
         </div>

         <div className="relative z-10">
             {/* Large Number Style like Image 2 */}
            <h4 className={`text-4xl font-extrabold tracking-tight mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</h4>
            <p className={`text-xs font-bold uppercase tracking-widest opacity-80 ${isDark ? 'text-white/70' : 'text-slate-400'}`}>{label}</p>
         </div>
      </div>
   )
}
