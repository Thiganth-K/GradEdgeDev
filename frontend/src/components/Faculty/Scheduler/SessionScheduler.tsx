import { useEffect, useState } from 'react'
import { Plus, MapPin, Clock, X } from 'lucide-react'
import { getJson, postJson } from '../../../lib/api'

type Session = {
  id?: string
  title: string
  batch_code: string
  start_time: string
  end_time: string
  location?: string
  description?: string
}

type Batch = {
  batch_code: string
}

const SessionScheduler: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [showCreate, setShowCreate] = useState(false)
  
  const [newSession, setNewSession] = useState<Session>({
    title: '',
    batch_code: '',
    start_time: '',
    end_time: '',
    location: '',
    description: ''
  })

  useEffect(() => {
    fetchSessions()
    fetchBatches()
  }, [])

  const fetchSessions = async () => {
    const res = await getJson<{ sessions: Session[] }>('/api/faculty/sessions')
    if (res.ok) setSessions(res.data.sessions)
  }

  const fetchBatches = async () => {
    const res = await getJson<{ batches: Batch[] }>('/api/faculty/batches')
    if (res.ok) setBatches(res.data.batches)
  }

  const handleCreate = async () => {
     if (!newSession.title || !newSession.batch_code || !newSession.start_time) return
     const res = await postJson('/api/faculty/sessions', {
         ...newSession,
         faculty_id: 'current_user'
     })
     if (res.ok) {
         setShowCreate(false)
         fetchSessions()
         setNewSession({
            title: '',
            batch_code: '',
            start_time: '',
            end_time: '',
            location: '',
            description: ''
          })
     } else {
         alert('Failed to schedule session')
     }
  }

  return (
    <div className="max-w-6xl mx-auto">
        <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Session Scheduler</h2>
                <p className="text-slate-500 mt-1">Plan and manage your classes</p>
            </div>
            <button 
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-[#800020] hover:bg-[#600018] text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-[#800020]/20 transition-all hover:scale-105"
            >
                <Plus size={20} />
                Schedule Session
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List View */}
            <div className="lg:col-span-2 space-y-4">
                <h3 className="font-semibold text-slate-800 mb-4">Upcoming Sessions</h3>
                {sessions.length === 0 && (
                     <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No sessions scheduled.</p>
                     </div>
                )}
                {sessions.map((session, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-4">
                            <div className="bg-red-100 text-red-600 w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0">
                                <span className="text-xs font-bold uppercase">{new Date(session.start_time).toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-lg font-bold">{new Date(session.start_time).getDate()}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{session.title}</h4>
                                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                    <span className="flex items-center gap-1"><Clock size={14}/> {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    <span className="flex items-center gap-1"><MapPin size={14}/> {session.location || 'Online'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="md:text-right">
                            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                                {session.batch_code}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mini Calendar / Info (Placeholder for premium feel) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                <h3 className="font-semibold text-slate-800 mb-4">Calendar</h3>
                <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-400 text-sm">
                    Calendar Widget Visualization Placeholder
                </div>
            </div>
        </div>

        {showCreate && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Schedule Session</h3>
                    <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Session Title</label>
                        <input 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={newSession.title}
                            onChange={e => setNewSession({...newSession, title: e.target.value})}
                            placeholder="e.g. Data Structures Lecture"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Batch</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={newSession.batch_code}
                            onChange={e => setNewSession({...newSession, batch_code: e.target.value})}
                        >
                            <option value="">Select Batch</option>
                            {batches.map(b => <option key={b.batch_code} value={b.batch_code}>{b.batch_code}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                            <input 
                                type="datetime-local"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                value={newSession.start_time}
                                onChange={e => setNewSession({...newSession, start_time: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                            <input 
                                type="datetime-local"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                value={newSession.end_time}
                                onChange={e => setNewSession({...newSession, end_time: e.target.value})}
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location / Link</label>
                        <input 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={newSession.location}
                            onChange={e => setNewSession({...newSession, location: e.target.value})}
                            placeholder="Room 304 or Zoom Link"
                        />
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancel</button>
                    <button onClick={handleCreate} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Schedule</button>
                </div>
            </div>
        </div>
        )}
        </div>
    </div>
  )
}

export default SessionScheduler
