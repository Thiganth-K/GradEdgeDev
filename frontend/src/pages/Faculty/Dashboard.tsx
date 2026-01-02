import { useState, useEffect } from 'react'
import { useSidebar } from '../../components/Faculty/Layout'
import { StatsCard } from '../../components/Faculty/StatsCard'
import { useParams, useNavigate } from 'react-router-dom'
import { getJson } from '../../lib/api'
import { 
  Bell, 
  Plus, 
  Search,
  Menu
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

// --- Types ---
type Batch = {
  batch_code: string;
  name: string;
  course: string;
  students_count?: number; 
  students?: string[];
}
type Session = {
  id: string; 
  topic: string;
  start_time: string;
  batch_code: string;
}

type Props = {
  username: string
  onLogout: () => void
}

const FacultyDashboard: React.FC<Props> = ({ username }) => {
  const { facultyId } = useParams()
  const navigate = useNavigate()
  
  const [batches, setBatches] = useState<Batch[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    placementEligible: 0, 
    avgAttendance: 0 
  })
   const [, setLoading] = useState(true)

  const { setIsMobileOpen } = useSidebar()

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!facultyId) return
      setLoading(true)
      try {
           const [batchRes, sessionRes] = await Promise.all([
              getJson<{ ok: boolean; data: Batch[] }>(`/api/faculty/${facultyId}/batches`),
              getJson<{ ok: boolean; sessions: Session[] }>(`/api/faculty/sessions?faculty_id=${facultyId}`)
           ])

           const fetchedBatches = batchRes.ok && batchRes.data ? batchRes.data.data : []
           const fetchedSessions = sessionRes.ok && sessionRes.data ? sessionRes.data.sessions || [] : []
        
        setBatches(fetchedBatches)
        setSessions(fetchedSessions)

        // Use the actual length of the students array if available
        const totalStuds = fetchedBatches.reduce((acc, b) => acc + (b.students ? b.students.length : (b.students_count || 0)), 0)
        
        setStats({
          totalStudents: totalStuds,
          placementEligible: Math.floor(totalStuds * 0.75), 
          avgAttendance: 88 
        })

      } catch (e) {
        console.error("Dashboard load failed", e)
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboardData()
  }, [facultyId])

  // --- Mock Chart Data ---
  const CHART_DATA = batches.length > 0 ? batches.slice(0, 5).map(b => ({
    name: b.batch_code,
    students: b.students ? b.students.length : (b.students_count || 0),
  })) : [
    { name: 'B1', students: 0 }, { name: 'B2', students: 0 }, { name: 'B3', students: 0 }, { name: 'B4', students: 0 }
  ];
  
  const CHART_COLORS = ['#EA0029', '#E6A532', '#0F172A', '#475569', '#94A3B8'];

  return (
    <>
      {/* Top Navbar */}
      <header className="flex-shrink-0 bg-[#F4F7FE]/80 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/50 z-20">

           {/* Mobile Menu & Search */}
           <div className="flex items-center gap-4 flex-1">
               <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-white rounded-xl transition-colors">
                 <Menu size={24} />
              </button>
              
              <div className="hidden sm:flex items-center bg-white px-4 py-2.5 rounded-full border border-slate-200/60 shadow-sm w-full max-w-md focus-within:ring-2 focus-within:ring-[#EA0029]/10 transition-shadow">
                 <Search size={18} className="text-slate-400 mr-3" />
                 <input 
                    type="text" 
                    placeholder="Search task, student, or batch..." 
                    className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-full placeholder:text-slate-400"
                 />
                 <span className="hidden lg:flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    ⌘ F
                 </span>
              </div>
           </div>

           {/* User Actions */}
           <div className="flex items-center gap-3 sm:gap-6 ml-4">
              <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
                 <Bell size={22} />
                 <span className="absolute top-0 right-0 w-2 h-2 bg-[#EA0029] rounded-full border-2 border-[#F4F7FE]"></span>
              </button>
              
              <div className="flex items-center gap-3 pl-6 border-l border-slate-200/60">
                 <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-800">{username}</p>
                    <p className="text-xs text-slate-400 font-medium tracking-wide">FACULTY</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center font-bold shadow-lg shadow-slate-200 ring-2 ring-white">
                    {username.charAt(0).toUpperCase()}
                 </div>
              </div>
           </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar w-full max-w-[1600px] mx-auto">
           
           {/* Welcome & Global Actions */}
           <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                 <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">DASHBOARD</h1>
       
              </div>
              <div className="flex gap-3">
                 <button className="bg-white text-slate-700 px-5 py-3 rounded-2xl border border-slate-200 font-bold text-sm shadow-sm hover:bg-slate-50 transition-all">
                    Import Data
                 </button>
                 <button onClick={() => navigate('schedule')} className="bg-[#EA0029] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2">
                    <Plus size={18} strokeWidth={3} />
                    Add Session
                 </button>
              </div>
           </div>

           {/* Stats Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatsCard 
                 label="Total Students" 
                 value={stats.totalStudents} 
                 variant="red" 
                 icon={StudentIcon} 
              />
              <StatsCard 
                 label="Allocated Batches" 
                 value={batches.length} 
                 variant="black" 
                 icon={BatchIcon} 
                 isRadial={true}
              />
              <StatsCard 
                 label="Placement Eligible" 
                 value={stats.placementEligible} 
                 variant="white" 
                 icon={PlacementIcon} 
              />
               <StatsCard 
                 label="Running Sessions" 
                 value={sessions.length} 
                 variant="white" 
                 icon={SessionIcon} 
              />
           </div>

           {/* Middle Section: Analytics & Schedule */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100/60">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-900">Student Distribution</h3>
                    <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">+12% vs last sem</div>
                 </div>
                 
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={CHART_DATA} barSize={40}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                             dataKey="name" 
                             axisLine={false} 
                             tickLine={false} 
                             tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                             dy={10} 
                          />
                          <Tooltip 
                             contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontWeight: 600}}
                             cursor={{fill: '#f8fafc', radius: 8}}
                          />
                          {/* Use different colors for bars like in the design */}
                          <Bar dataKey="students" radius={[12, 12, 12, 12]}>
                             {CHART_DATA.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
                 
                 <div className="flex justify-center gap-8 mt-6">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <span key={i} className="text-xs font-bold text-slate-300">{d}</span>
                    ))}
                 </div>
              </div>

              {/* Reminders / Next Session */}
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100/60 flex flex-col justify-between">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Up Next</h3>
                    <p className="text-slate-400 font-medium text-sm">Today's Schedule</p>
                 </div>
                 
                 <div className="space-y-6 mt-8">
                    {sessions.length === 0 ? (
                        <div className="text-center py-4 text-slate-400">No classes remaining today.</div>
                    ) : (
                        sessions.slice(0, 2).map((sess, i) => (
                            <div key={i}>
                                <h4 className="text-xl font-bold text-slate-800 leading-tight mb-1">{sess.topic}</h4>
                                <p className="text-slate-400 font-medium text-sm">Batch {sess.batch_code} • {new Date(sess.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        ))
                    )}
                 </div>

                 <button className="w-full bg-[#111827] text-white py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-8 shadow-lg shadow-slate-200">
                    <SessionIcon />
                    View Full Schedule
                 </button>
              </div>
           </div>

           {/* Bottom Section: Batches & Collaboration */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
              {/* Batch/Project List (Using Right column style from image) */}
              <div className="lg:col-span-1 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100/60 h-full">
                  <div className="flex items-center justify-between mb-6">
                      <h3 onClick={() => navigate(`/faculty/${facultyId}/batches`)} className="text-xl font-bold text-slate-900 cursor-pointer hover:text-[#EA0029] transition-colors">BATCHES</h3>
                      <button onClick={() => navigate(`/faculty/${facultyId}/batches`)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><Plus size={20} className="text-slate-400" /></button>
                  </div>

                  <div className="space-y-6">
                     {batches.slice(0, 4).map((b, i) => (
                         <div key={i} onClick={() => navigate(`/faculty/${facultyId}/batches`)} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors">
                             <div className="w-12 h-12 rounded-xl bg-slate-900 text-[#EA0029] flex items-center justify-center font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
                                 {b.batch_code.substring(0, 2)}
                             </div>
                             <div className="flex-1">
                                 <h4 className="font-bold text-slate-800 text-sm">{b.name}</h4>
                                 <p className="text-xs text-slate-400 font-semibold mt-0.5">Due date: Dec 30, 2024</p>
                             </div>
                             <div className="text-xs font-bold text-slate-400">
                                {b.students?.length || b.students_count || 0}
                             </div>
                         </div>
                     ))}
                  </div>
              </div>
              
              {/* Progress / Team (Mapping to Announcements here) */}
              <div className="lg:col-span-2 bg-[#111827] rounded-[32px] p-8 shadow-2xl shadow-slate-300 relative overflow-hidden flex flex-col sm:flex-row items-center gap-8">
                   {/* Decorative background */}
                   <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#EA0029] rounded-full blur-[120px] opacity-10 pointer-events-none -mr-20 -mt-20"></div>

                   <div className="flex-1 relative z-10">
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">ANNOUNCEMENTS</p>
                       <h3 className="text-3xl font-bold text-white mb-4">EXAM SCHEDULE RELEASED</h3>
                       <p className="text-slate-400 font-medium leading-relaxed mb-8">
                           The semester end examinations for all batches have been scheduled. Please review the dates and inform your students accordingly.
                       </p>
                       <div className="flex gap-4">
                           <button className="bg-[#EA0029] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-rose-600 transition-colors">View Details</button>
                           <button className="text-white font-bold text-sm px-4 py-3 hover:bg-white/10 rounded-xl transition-colors">Dismiss</button>
                       </div>
                   </div>

                   {/* Radial Progress Mockup */}
                   <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
                       <svg className="w-full h-full transform -rotate-90">
                           <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                           <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - 0.75)} className="text-[#EA0029]" strokeLinecap="round" />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                           <span className="text-4xl font-bold">75%</span>
                           <span className="text-xs font-bold text-slate-400 uppercase mt-1">Syllabus</span>
                       </div>
                   </div>
              </div>
           </div>

        </main>
    </>
  )
}

// --- Custom Premium Icons ---
const StudentIcon = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor" fillOpacity="0.2"/>
      <path d="M12 14C7.58172 14 4 15.7909 4 18V20H20V18C20 15.7909 16.4183 14 12 14Z" fill="currentColor"/>
   </svg>
);

const BatchIcon = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" fillOpacity="0.2"/>
      <path d="M7 8H17M7 12H13M7 16H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
   </svg>
);

const PlacementIcon = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
   </svg>
);

const SessionIcon = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
   </svg>
);


// StatCard moved to component

export default FacultyDashboard
