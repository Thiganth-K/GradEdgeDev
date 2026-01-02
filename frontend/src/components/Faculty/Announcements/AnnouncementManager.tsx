import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Megaphone, Plus, X } from 'lucide-react'
import { getJson, postJson } from '../../../lib/api'

type Announcement = {
  id?: string
  title: string
  content: string
  faculty_id: string
  target_batches: string[]
  created_at?: string
  important?: boolean
}

type Batch = {
  batch_code: string
}

const AnnouncementManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  
  const [newAnnouncement, setNewAnnouncement] = useState<Announcement>({
    title: '',
    content: '',
    faculty_id: 'current_user',
    target_batches: [],
    important: false
  })

  useEffect(() => {
    fetchAnnouncements()
    fetchBatches()
  }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
        const { facultyId } = useParams()
        const q = facultyId ? `?faculty_id=${facultyId}` : ''
        const res = await getJson<{ announcements: Announcement[] }>(`/api/faculty/announcements${q}`)
    if (res.ok) setAnnouncements(res.data.announcements)
    setLoading(false)
  }

  const fetchBatches = async () => {
        const { facultyId } = useParams()
        const q = facultyId ? `?faculty_id=${facultyId}` : ''
        const res = await getJson<{ batches: Batch[] }>(`/api/faculty/batches${q}`)
    if (res.ok) setBatches(res.data.batches)
  }

  const handleCreate = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return
        const { facultyId } = useParams()
        const payload = { ...newAnnouncement, faculty_id: facultyId || newAnnouncement.faculty_id }
        const res = await postJson('/api/faculty/announcements', payload)
    if (res.ok) {
        setShowCreate(false)
        fetchAnnouncements()
        setNewAnnouncement({
            title: '',
            content: '',
            faculty_id: 'current_user',
            target_batches: [],
            important: false
        })
    } else {
        alert('Failed to post announcement')
    }
  }

  const toggleBatch = (code: string) => {
    setNewAnnouncement(prev => {
        const current = prev.target_batches
        if (current.includes(code)) return { ...prev, target_batches: current.filter(c => c !== code) }
        return { ...prev, target_batches: [...current, code] }
    })
  }

  return (
    <div className="max-w-5xl mx-auto">
       <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-lg shadow-slate-200/50">
       <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Announcements</h2>
            <p className="text-slate-500 mt-1">Broadcast updates to your batches</p>
        </div>
        <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#800020] hover:bg-[#600018] text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-[#800020]/20 transition-all hover:scale-105"
        >
            <Plus size={20} />
            New Post
        </button>
      </div>

      <div className="grid gap-6">
        {announcements.map((ann, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-900">{ann.title}</h3>
                    {ann.important && <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase">Important</span>}
                </div>
                <p className="text-slate-600 whitespace-pre-line mb-6">{ann.content}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2">
                        <Megaphone size={16} />
                        <span>{ann.target_batches.length > 0 ? ann.target_batches.join(', ') : 'All Batches'}</span>
                    </div>
                    <span>•</span>
                    <span>{ann.created_at ? new Date(ann.created_at).toLocaleDateString() : 'Just now'}</span>
                </div>
            </div>
        ))}
         {announcements.length === 0 && !loading && (
             <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">No announcements posted yet.</p>
             </div>
         )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">New Announcement</h3>
                    <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={newAnnouncement.title}
                            onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                            placeholder="e.g. Mid-term Exam Schedule"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                         <textarea 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[120px]"
                            value={newAnnouncement.content}
                            onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                            placeholder="Write your message here..."
                         />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Target Batches</label>
                        <div className="flex flex-wrap gap-2">
                            {batches.map(b => (
                                <button
                                    key={b.batch_code}
                                    onClick={() => toggleBatch(b.batch_code)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                        newAnnouncement.target_batches.includes(b.batch_code)
                                        ? 'bg-red-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {b.batch_code}
                                </button>
                            ))}
                            {batches.length === 0 && <span className="text-slate-400 text-sm">No batches available</span>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="important"
                            checked={newAnnouncement.important}
                            onChange={e => setNewAnnouncement({...newAnnouncement, important: e.target.checked})}
                            className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                        />
                        <label htmlFor="important" className="text-sm font-medium text-slate-700">Mark as user important</label>
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancel</button>
                    <button onClick={handleCreate} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Post Announcement</button>
                </div>
            </div>
        </div>
      )}
       </div>
    </div>
  )
}

export default AnnouncementManager
