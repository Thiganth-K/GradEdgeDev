import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteJson, getJson, putJson } from '../../lib/api'

type StudentDoc = {
  _id?: string
  full_name?: string
  enrollment_id?: string
  department?: string
  email?: string
  mobile?: string
  faculty_id?: string
  faculty_username?: string
}

type FacultyRow = {
  username: string
  faculty_id?: string
  full_name?: string
  department?: string
}

type Props = {
  username?: string
}

export default function StudentManagement({ username }: Props) {
  const navigate = useNavigate()
  const [institutionId] = useState(username || '')
  const [students, setStudents] = useState<StudentDoc[]>([])
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [editStudentId, setEditStudentId] = useState<string | null>(null)
  const [editStudentEnrollment, setEditStudentEnrollment] = useState('')
  const [editStudentName, setEditStudentName] = useState('')
  const [editStudentDept, setEditStudentDept] = useState('')
  const [editStudentEmail, setEditStudentEmail] = useState('')
  const [editStudentMobile, setEditStudentMobile] = useState('')
  const [editStudentFacultyId, setEditStudentFacultyId] = useState('')
  const [editStudentError, setEditStudentError] = useState<string | null>(null)
  const [editStudentSaving, setEditStudentSaving] = useState(false)
  const [facultyList, setFacultyList] = useState<FacultyRow[]>([])

  useEffect(() => {
    if (!institutionId) return
    void loadStudents()
    void loadFaculty()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId])

  async function loadStudents() {
    if (!institutionId) return
    setStudentsLoading(true)
    setStudentsError(null)
    const res = await getJson<{ ok: boolean; data: StudentDoc[]; error?: string }>(
      `/api/institutional/${institutionId}/students`,
    )
    setStudentsLoading(false)
    if (!res.ok || !res.data.ok) {
      setStudentsError(res.ok ? res.data.error || 'Unable to load students' : res.error || 'Network error')
      return
    }
    setStudents(res.data.data)
  }

  async function loadFaculty() {
    if (!institutionId) return
    const res = await getJson<{ ok: boolean; data: FacultyRow[]; error?: string }>(
      `/api/institutional/${institutionId}/faculty`,
    )
    if (res.ok && res.data.ok) {
      setFacultyList(res.data.data)
    }
  }

  function startStudentEdit(student: StudentDoc) {
    setEditStudentId(student.enrollment_id || '')
    setEditStudentEnrollment(student.enrollment_id || '')
    setEditStudentName(student.full_name || '')
    setEditStudentDept(student.department || '')
    setEditStudentEmail(student.email || '')
    setEditStudentMobile(student.mobile || '')
    setEditStudentFacultyId(student.faculty_id || '')
    setEditStudentError(null)
  }

  async function onSaveStudentEdit() {
    if (!institutionId || !editStudentId) return
    if (!editStudentName || !editStudentEnrollment) {
      setEditStudentError('Name and enrollment ID are required')
      return
    }

    const payload: Record<string, unknown> = {
      full_name: editStudentName.trim(),
      department: editStudentDept.trim(),
      email: editStudentEmail.trim(),
      mobile: editStudentMobile.trim(),
      enrollment_id: editStudentEnrollment.trim(),
    }

    if (editStudentFacultyId) {
      const found = facultyList.find((f) => f.faculty_id === editStudentFacultyId)
      payload.faculty_id = editStudentFacultyId
      payload.faculty_username = found?.username
    } else {
      payload.faculty_id = null
      payload.faculty_username = null
    }

    setEditStudentSaving(true)
    setEditStudentError(null)
    const res = await putJson<{ ok: boolean; data?: StudentDoc; error?: string }, Record<string, unknown>>(
      `/api/institutional/${institutionId}/students/${editStudentId}`,
      payload,
    )
    setEditStudentSaving(false)

    if (!res.ok || !res.data.ok) {
      setEditStudentError(res.ok ? res.data.error || 'Unable to update student' : res.error || 'Network error')
      return
    }

    setEditStudentId(null)
    await loadStudents()
  }

  async function onDeleteStudent(enrollmentId: string) {
    if (!institutionId || !enrollmentId) return
    const res = await deleteJson<{ ok: boolean; error?: string }>(
      `/api/institutional/${institutionId}/students/${enrollmentId}`,
    )
    if (!res.ok || !res.data.ok) {
      setStudentsError(res.ok ? res.data.error || 'Unable to delete student' : res.error || 'Network error')
      return
    }
    await loadStudents()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="h-1.5 w-full bg-red-600 animate-pulse" />
      
      {/* Header */}
      <div className="border-b-4 border-red-600 bg-red-600 px-6 py-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 animate-slideUp">
              <button
                onClick={() => navigate('/institutional/welcome')}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white transition-all duration-300 hover:scale-110"
              >
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
                <p className="mt-1 text-sm text-white opacity-90">View and manage student records</p>
              </div>
            </div>
            
            <div className="animate-slideInRight delay-200">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white ring-2 ring-white/20">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-lg border-2 border-red-600 bg-white shadow-xl animate-scaleIn">
          <div className="flex items-center justify-between border-b-2 border-red-600 bg-white px-6 py-4">
            <h2 className="text-xl font-bold text-black">Student Directory</h2>
            <button
              onClick={() => loadStudents()}
              disabled={studentsLoading}
              className="rounded-lg border-2 border-red-600 bg-white px-4 py-2 text-sm font-bold text-red-600 transition-all duration-300 hover:bg-red-600 hover:text-white disabled:opacity-60"
            >
              {studentsLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="p-6">
            {studentsError && (
              <div className="rounded-lg border-2 border-red-600 bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">
                {studentsError}
              </div>
            )}
            {!studentsLoading && students.length === 0 && !studentsError && (
              <div className="text-center py-8 text-gray-600">No students yet.</div>
            )}

            {students.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-red-600 bg-white">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Enrollment ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Mobile</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Faculty</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {students.map((s) => (
                      <tr key={s._id || s.enrollment_id} className="transition-all duration-200 hover:bg-red-50/50">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full border-2 border-red-600 bg-white px-2.5 py-1 text-xs font-semibold text-black">
                            {s.enrollment_id}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{s.full_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{s.department || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{s.email || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{s.mobile || '—'}</td>
                        <td className="px-4 py-3">
                          {s.faculty_id ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              {s.faculty_id}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startStudentEdit(s)}
                              className="rounded-lg border-2 border-red-600 bg-white px-3 py-1 text-xs font-bold text-red-600 transition-all duration-300 hover:bg-red-600 hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDeleteStudent(s.enrollment_id || '')}
                              className="rounded-lg border-2 border-red-600 bg-red-600 px-3 py-1 text-xs font-bold text-white transition-all duration-300 hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Edit Student Modal */}
        {editStudentId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border-2 border-red-600 p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-black">Edit Student {editStudentId}</h3>
                <button
                  onClick={() => setEditStudentId(null)}
                  className="text-red-600 hover:text-red-700 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enrollment ID</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                    value={editStudentEnrollment}
                    onChange={(e) => setEditStudentEnrollment(e.target.value)}
                    placeholder="REG123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                    value={editStudentDept}
                    onChange={(e) => setEditStudentDept(e.target.value)}
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                    value={editStudentEmail}
                    onChange={(e) => setEditStudentEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                    value={editStudentMobile}
                    onChange={(e) => setEditStudentMobile(e.target.value)}
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Faculty Assignment</label>
                  <select
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                    value={editStudentFacultyId}
                    onChange={(e) => setEditStudentFacultyId(e.target.value)}
                  >
                    <option value="">No faculty assignment</option>
                    {facultyList.map((f) => (
                      <option key={f.username} value={f.faculty_id || ''}>
                        {(f.faculty_id || f.username) + (f.full_name ? ` — ${f.full_name}` : '')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editStudentError && (
                <div className="mt-4 rounded-lg border-2 border-red-600 bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">
                  {editStudentError}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={onSaveStudentEdit}
                  disabled={editStudentSaving}
                  className="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-red-700 disabled:opacity-60"
                >
                  {editStudentSaving ? 'Saving…' : 'Save Student'}
                </button>
                <button
                  onClick={() => setEditStudentId(null)}
                  className="rounded-lg border-2 border-red-600 bg-white px-6 py-2 text-sm font-bold text-red-600 transition-all duration-300 hover:bg-red-600 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
