import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSidebar } from '../../components/Faculty/Layout'
import { getJson, postJson } from '../../lib/api'
import { Menu, Users, Layers, CheckSquare, Square, RefreshCw } from 'lucide-react'
import { Skeleton } from '../../components/Skeleton'


// Types that match backend payloads
interface Batch {
  batch_code: string
  name?: string
  department?: string
  year?: string
  section?: string
  faculty_id?: string
  students?: string[]
  faculty_name?: string
  students_count?: number
}

interface Student {
  full_name: string
  enrollment_id: string
  email?: string
  department?: string
  batch_id?: string
}

export default function FacultyBatches() {
  const { facultyId } = useParams()

  const [batches, setBatches] = useState<Batch[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedBatch, setSelectedBatch] = useState<string>('')
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const { setIsMobileOpen } = useSidebar()

  useEffect(() => {
    void loadData()
  }, [facultyId])

  const loadData = async () => {
    if (!facultyId) return
    setLoading(true)
    try {
      const [batchRes, studRes] = await Promise.all([
        getJson<{ ok: boolean; data: Batch[] }>(`/api/faculty/${facultyId}/batches`),
        getJson<{ ok: boolean; data: Student[] }>(`/api/faculty/${facultyId}/students`),
      ])
      if (batchRes.ok && batchRes.data) setBatches(batchRes.data.data || [])
      if (studRes.ok && studRes.data) setStudents(studRes.data.data || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const availableStudents = useMemo(
    () => students.filter((s) => !s.batch_id),
    [students]
  )

  const toggleStudent = (enrollmentId: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev)
      if (next.has(enrollmentId)) next.delete(enrollmentId)
      else next.add(enrollmentId)
      return next
    })
  }

  const handleAssign = async () => {
    if (!facultyId) return
    if (!selectedBatch) {
      alert('Select a batch first')
      return
    }
    if (selectedStudents.size === 0) {
      alert('Select at least one student')
      return
    }
    setAssigning(true)
    try {
      const url = `/api/faculty/${encodeURIComponent(facultyId)}/batches/${encodeURIComponent(selectedBatch)}/assign`;
      const res = await postJson(url, {
        faculty_id: facultyId,
        student_ids: Array.from(selectedStudents),
      })
      if (!res.ok) {
        alert(res.error || 'Assign failed')
      } else {
        setSelectedStudents(new Set())
        await loadData()
      }
    } catch (err) {
      alert('Assign failed')
    } finally {
      setAssigning(false)
    }
  }

  return (
      /* Content wrapper from Layout takes care of flex-1 etc */
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 relative">
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-lg">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-slate-900">Batches</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200" />
        </div>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#EA0029] tracking-widest">FACULTY</p>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Batches & Assignment</h1>
              <p className="text-slate-500 text-sm mt-1">View your batches and assign your available students.</p>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm shadow-sm"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Layers size={18} />
                <span>Your Batches</span>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-full h-20 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm animate-pulse flex items-center justify-between">
                       <div className="space-y-2">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-24" />
                       </div>
                       <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              ) : batches.length === 0 ? (
                <p className="text-slate-400 text-sm">No batches yet.</p>
              ) : (
                <div className="space-y-3">
                  {batches.map((b) => (
                    <button
                      key={b.batch_code}
                      onClick={() => {
                        setSelectedBatch(b.batch_code)
                        setSelectedStudents(new Set())
                      }}
                      className={`w-full text-left rounded-2xl border transition-all px-4 py-3 shadow-sm hover:shadow-md ${
                        selectedBatch === b.batch_code ? 'border-[#EA0029] ring-2 ring-[#EA0029]/10 bg-rose-50/40' : 'border-slate-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{b.name || b.batch_code}</p>
                          <p className="text-xs text-slate-500">
                            {b.department || 'Dept'} • {b.year || 'Year'} {b.section || ''}
                          </p>
                          {b.faculty_name && (
                             <p className="text-xs text-slate-400 mt-0.5">
                               Faculty: <span className="font-medium text-slate-600">{b.faculty_name}</span>
                             </p>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">
                          {(b.students?.length ?? b.students_count ?? 0)} students
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <Users size={18} />
                  <span>Available Students</span>
                </div>
                <button
                  disabled={assigning}
                  onClick={handleAssign}
                  className="bg-[#EA0029] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign to batch'}
                </button>
              </div>

              {!selectedBatch && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">Select a batch to start assigning students.</p>
              )}

              {loading ? (
                 <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 border border-slate-100 rounded-2xl px-4 py-3 bg-white animate-pulse">
                            <Skeleton className="w-4 h-4 rounded" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                    ))}
                 </div>
              ) : availableStudents.length === 0 ? (
                <p className="text-slate-400 text-sm">No unassigned students available.</p>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {availableStudents.map((s) => {
                    const checked = selectedStudents.has(s.enrollment_id)
                    return (
                      <label
                        key={s.enrollment_id}
                        className={`flex items-center gap-3 border border-slate-100 rounded-2xl px-4 py-3 cursor-pointer hover:border-slate-200 transition ${checked ? 'bg-rose-50/40 border-[#EA0029]/40' : 'bg-white'}`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={checked}
                          onChange={() => toggleStudent(s.enrollment_id)}
                        />
                        {checked ? <CheckSquare size={18} className="text-[#EA0029]" /> : <Square size={18} className="text-slate-300" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{s.full_name || s.enrollment_id}</p>
                          <p className="text-xs text-slate-500 truncate">{s.enrollment_id}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 rounded-full px-2 py-1">{s.department || 'Dept'}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  )
}
