import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSidebar } from '../../components/Faculty/Layout'
import { ModernStatsCard } from '../../components/Faculty/ModernStatsCard'
import { 
  Bell, 
  Search, 
  Menu, 
  ChevronLeft,
  Filter,
  Download,
  Edit2,
  Trash2,
  Clock,
} from 'lucide-react'
import { Skeleton } from '../../components/Skeleton'


// --- Types ---
type StudentSubmission = {
  id: string;
  name: string;
  rollNo: string;
  score: number;
  totalMarks: number;
  submittedAt: string;
  status: 'Evaluated' | 'Pending' | 'Auto-Graded';
  avatarColor: string;
}

type PendingStudent = {
  id: string;
  name: string;
  rollNo: string;
  status: 'Not Started' | 'In Progress';
  avatarColor: string;
}



// --- Dummy Data ---
const DUMMY_SUBMITTED: StudentSubmission[] = [
  { id: '1', name: 'Alice Williams', rollNo: 'CS2024001', score: 85, totalMarks: 100, submittedAt: '2024-12-28T10:30:00', status: 'Auto-Graded', avatarColor: 'bg-blue-500' },
  { id: '2', name: 'Bob Smith', rollNo: 'CS2024002', score: 92, totalMarks: 100, submittedAt: '2024-12-28T11:15:00', status: 'Evaluated', avatarColor: 'bg-emerald-500' },
  { id: '3', name: 'Charlie Brown', rollNo: 'CS2024003', score: 78, totalMarks: 100, submittedAt: '2024-12-28T09:45:00', status: 'Auto-Graded', avatarColor: 'bg-orange-500' },
  { id: '4', name: 'Diana Prince', rollNo: 'CS2024004', score: 95, totalMarks: 100, submittedAt: '2024-12-28T12:00:00', status: 'Evaluated', avatarColor: 'bg-purple-500' },
  { id: '5', name: 'Ethan Hunt', rollNo: 'CS2024005', score: 60, totalMarks: 100, submittedAt: '2024-12-28T10:00:00', status: 'Pending', avatarColor: 'bg-rose-500' },
];

const DUMMY_NOT_SUBMITTED: PendingStudent[] = [
  { id: '6', name: 'Fiona Gallagher', rollNo: 'CS2024006', status: 'Not Started', avatarColor: 'bg-slate-500' },
  { id: '7', name: 'George Martin', rollNo: 'CS2024007', status: 'In Progress', avatarColor: 'bg-indigo-500' },
  { id: '8', name: 'Hannah Baker', rollNo: 'CS2024008', status: 'Not Started', avatarColor: 'bg-pink-500' },
];

export default function FacultyTests() {
  // facultyId removed as it was unused
  // Mock username/logout if not passed via props (since this page component might be used directly in router)
  // In a real app, these might come from context or props. mirroring Dashboard pattern.
  const username = localStorage.getItem('username') || 'Faculty'
  const navigate = useNavigate()

  // Sidebar Controls
  const { setIsMobileOpen } = useSidebar();

  // Tab State
  const [activeTab, setActiveTab] = useState<'submitted' | 'pending'>('submitted');

  // Load Data Mock
  const [submittedStudents, setSubmittedStudents] = useState<StudentSubmission[]>([]);
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setSubmittedStudents(DUMMY_SUBMITTED);
      setPendingStudents(DUMMY_NOT_SUBMITTED);
      setLoading(false);
    }, 1000);
  }, []);



  return (
    <>
       <div className={`flex-1 flex flex-col h-full transition-all duration-300 relative overflow-hidden`}>
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
                    placeholder="Search test, student..." 
                    className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-full placeholder:text-slate-400"
                 />
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

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar w-full max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
               <div className="flex items-center gap-3">
                   <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:shadow-md transition-all">
                       <ChevronLeft size={20} />
                   </button>
                   <div>
                       <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Test Management</h1>
                       <div className="flex items-center gap-2 mt-1">
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">MID-SEM-01</span>
                            <span className="text-slate-400 font-medium text-sm">Introduction to Computer Science</span>
                       </div>
                   </div>
               </div>

               <div className="flex gap-3">
                  <button className="bg-white text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                     <Filter size={16} />
                     Filter
                  </button>
                  <button className="bg-[#EA0029] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2">
                     <Download size={16} />
                     Export Report
                  </button>
               </div>
            </div>

            {/* Test Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <ModernStatsCard 
                    title="Total Students" 
                    value={45} 
                    subValue="Enrolled"
                    trend="+5 from last week"
                    trendDirection="up"
                    isActive={true}
                />
                <ModernStatsCard 
                    title="Submitted" 
                    value={submittedStudents.length} 
                    subValue="Responses"
                    trend="+12% completion rate"
                    trendDirection="up"
                    isActive={true}
                />
                <ModernStatsCard 
                    title="Pending" 
                    value={pendingStudents.length} 
                    subValue="Remaining"
                    trend="-2 from yesterday"
                    trendDirection="down"
                    isActive={false} 
                />
                <ModernStatsCard 
                    title="Avg Score" 
                    value="76%" 
                    subValue="Class Avg"
                    trend="+4% from last test"
                    trendDirection="up"
                    isActive={true}
                />
            </div>


            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
                <button 
                  onClick={() => setActiveTab('submitted')}
                  className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'submitted' ? 'text-[#EA0029]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Submitted Responses ({submittedStudents.length})
                    {activeTab === 'submitted' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#EA0029] rounded-t-full"></span>}
                </button>
                <button 
                   onClick={() => setActiveTab('pending')}
                   className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'pending' ? 'text-[#EA0029]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Not Submitted ({pendingStudents.length})
                     {activeTab === 'pending' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#EA0029] rounded-t-full"></span>}
                </button>
            </div>

            {/* Table Content */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md shadow-slate-100 overflow-hidden">
                {activeTab === 'submitted' ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted At</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-slate-50 last:border-none">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="w-9 h-9 rounded-full" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 px-2.5 rounded-full" /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : submittedStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl bg-slate-900 text-[#EA0029] flex items-center justify-center text-xs font-bold shadow-sm`}>
                                                {student.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm group-hover:text-[#EA0029] transition-colors">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{student.rollNo}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                        {new Date(student.submittedAt).toLocaleDateString()} <span className="text-slate-300">|</span> {new Date(student.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-800">{student.score}</span>
                                            <span className="text-xs text-slate-400">/ {student.totalMarks}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${stateColor(student.status)}`}>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-slate-50 last:border-none">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="w-9 h-9 rounded-full" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 px-2.5 rounded-full" /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : pendingStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                     <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl bg-slate-900 text-[#EA0029] flex items-center justify-center text-xs font-bold shadow-sm`}>
                                                {student.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{student.rollNo}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-900 border border-slate-200">
                                            <Clock size={12} />
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="text-xs font-bold text-[#EA0029] bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                                            Send Reminder
                                        </button>
                                    </td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                </div>
                )}
            </div>

        </main>
       </div>
    </>
  )
}

function stateColor(status: string) {
    return 'bg-slate-100 text-slate-900 border-slate-200';
}
