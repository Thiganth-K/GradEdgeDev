import { Info, TrendingUp, TrendingDown } from 'lucide-react';

interface ModernStatsCardProps {
  title: string;
  value: number | string;
  subValue: string;
  trend: string;
  trendDirection?: 'up' | 'down';
  isActive?: boolean;
}

export function ModernStatsCard({ 
  title, 
  value, 
  subValue, 
  trend, 
  trendDirection = 'up', 
  isActive = false 
}: ModernStatsCardProps) {
  
  // Generate dummy bar heights for the visual
  const bars = [40, 60, 55, 70, 65, 80, 75, 85, 80, 90, 85, 95, 20, 30, 25];

  return (
    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[32px] border border-white/40 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
           <h3 className="text-lg font-bold text-slate-700 tracking-tight">{title}</h3>
           {isActive && <span className="w-2.5 h-2.5 bg-lime-400 rounded-full shadow-[0_0_8px_rgba(163,230,53,0.6)]"></span>}
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <Info size={18} />
        </button>
      </div>

      {/* Main Value */}
      <div className="flex items-baseline gap-2 mb-6 relative z-10">
         <span className="text-4xl font-extrabold text-slate-800">{value}</span>
         <span className="text-lg font-bold text-slate-400">{subValue}</span>
      </div>

      {/* Bar Chart Visual */}
      <div className="flex items-end gap-1.5 h-12 mb-6 opacity-90">
          {bars.map((h, i) => (
             <div 
               key={i} 
               className={`w-2.5 rounded-sm transition-all duration-500 group-hover:bg-orange-500 ${i > 11 ? 'bg-slate-200' : 'bg-orange-400'}`}
               style={{ height: `${h}%` }}
             ></div>
          ))}
      </div>

      {/* Footer Trend */}
      <div className="flex items-center gap-2 relative z-10">
         {trendDirection === 'up' ? (
             <TrendingUp size={16} className="text-emerald-500" />
         ) : (
             <TrendingDown size={16} className="text-rose-500" />
         )}
         <span className="text-sm font-bold text-slate-500">{trend}</span>
      </div>
    </div>
  );
}
