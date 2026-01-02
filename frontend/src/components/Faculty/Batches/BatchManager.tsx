import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Users, Upload, FileSpreadsheet, X } from 'lucide-react'
import { getJson, postJson } from '../../../lib/api'

type Batch = {
  batch_code: string
  department: string
  faculty_id: string
  students: string[]
  year?: string
  section?: string
}

const BatchManager: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  
  // Create Modal State
  const [showCreate, setShowCreate] = useState(false)
  const [newBatch, setNewBatch] = useState({ batch_code: '', department: 'CSE', year: '2025', section: 'A' })
  
  // Import Modal State
  const [importBatch, setImportBatch] = useState<Batch | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Fetch Batches
  const fetchBatches = async () => {
    setLoading(true)
        const { facultyId } = useParams()
        const query = facultyId ? `?faculty_id=${facultyId}` : ''
        const res = await getJson<{ batches: Batch[] }>(`/api/faculty/batches${query}`)
    if (res.ok) {
      setBatches(res.data.batches)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  // Handle Create
  const handleCreate = async () => {
    if (!newBatch.batch_code) return
    const res = await postJson('/api/faculty/batches', {
        ...newBatch,
        faculty_id: 'current_user' // API typically extracts this, but we send it or backend handles it. 
        // Our controller uses a placeholder if not in DB.
    })
    if (res.ok) {
        setShowCreate(false)
        fetchBatches()
        setNewBatch({ batch_code: '', department: 'CSE', year: '2025', section: 'A' })
    } else {
        alert('Failed to create batch: ' + res.error)
    }
  }

  // Handle Import
  const handleImport = async () => {
    if (!importBatch || !importFile) return
    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', importFile)
    
    try {
        const res = await fetch(`/api/faculty/batches/${importBatch.batch_code}/students/import`, {
            method: 'POST',
            body: formData
        })
        const data = await res.json()
        if (data.ok) {
            alert(`Successfully imported students!`)
            setImportBatch(null)
            setImportFile(null)
            fetchBatches()
        } else {
            alert('Import failed: ' + data.message)
        }
    } catch (e) {
        alert('Upload error')
    } finally {
        setUploading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-lg shadow-slate-200/50">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">BATCH MANAGEMENT</h2>
            <p className="text-slate-500 mt-1">Manage your student batches and enrollments</p>
        </div>
        <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#800020] hover:bg-[#600018] text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-[#800020]/20 transition-all hover:scale-105"
        >
            <Plus size={20} />
            Create
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading batches...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map(batch => (
                <div key={batch.batch_code} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{batch.batch_code}</h3>
                                <p className="text-sm text-slate-500 font-medium">{batch.department} • {batch.year}</p>
                            </div>
                             <div className="bg-[#800020]/10 text-[#800020] px-3 py-1 rounded-full text-xs font-bold">
                                {batch.students.length} Students
                            </div>
                        </div>
                        
                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                             <button className="text-sm text-slate-600 hover:text-red-600 font-medium flex items-center gap-2">
                                <Users size={16} />
                                View List
                             </button>
                             <button 
                                onClick={() => setImportBatch(batch)}
                                className="text-sm text-[#800020] hover:text-[#600018] font-medium flex items-center gap-2"
                             >
                                <Upload size={16} />
                                Import CSV
                             </button>
                        </div>
                    </div>
                </div>
            ))}
            
            {batches.length === 0 && (
                <div className="col-span-full py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-400">
                        <Users size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No batches found</h3>
                    <p className="text-slate-500 mt-1">Get started by creating your first student batch.</p>
                </div>
            )}
        </div>
      )}

      {/* Create Batch Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Create New Batch</h3>
                    <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Batch Code</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="e.g. CSE-2025-A"
                            value={newBatch.batch_code}
                            onChange={e => setNewBatch({...newBatch, batch_code: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                value={newBatch.year}
                                onChange={e => setNewBatch({...newBatch, year: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                value={newBatch.section}
                                onChange={e => setNewBatch({...newBatch, section: e.target.value})}
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={newBatch.department}
                            onChange={e => setNewBatch({...newBatch, department: e.target.value})}
                        />
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancel</button>
                    <button onClick={handleCreate} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Create Batch</button>
                </div>
            </div>
        </div>
      )}

      {/* Import Modal */}
      {importBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Import Students</h3>
                    <button onClick={() => {setImportBatch(null); setImportFile(null)}} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileSpreadsheet size={24} />
                        </div>
                        <p className="text-slate-900 font-medium">Importing to {importBatch.batch_code}</p>
                        <p className="text-sm text-slate-500">Upload a CSV file with 'enrollment_id' column.</p>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                        <input 
                            type="file" 
                            accept=".csv"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={e => setImportFile(e.target.files ? e.target.files[0] : null)}
                        />
                        <div className="pointer-events-none">
                            <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                            <p className="text-sm font-medium text-slate-700">
                                {importFile ? importFile.name : 'Click to browse or drag file'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => {setImportBatch(null); setImportFile(null)}} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancel</button>
                    <button 
                        onClick={handleImport} 
                        disabled={!importFile || uploading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Importing...' : 'Start Import'}
                    </button>
                </div>
            </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default BatchManager
