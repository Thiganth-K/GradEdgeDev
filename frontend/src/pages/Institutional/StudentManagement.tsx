import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteJson, getJson, putJson, postJson } from '../../lib/api'

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
  institutionId?: string
}

export default function StudentManagement({ username, institutionId: propInstitutionId }: Props) {
  const navigate = useNavigate()
  const [institutionId] = useState(propInstitutionId || username || '')
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

  // Bulk student creation state (moved from BatchManagement)
  type StudentRow = { name: string; regno: string; dept: string; email: string; mobile: string }
  const blankStudentRow: StudentRow = { name: '', regno: '', dept: '', email: '', mobile: '' }
  const [studentCsv, setStudentCsv] = useState('')
  const [studentRows, setStudentRows] = useState<StudentRow[]>([blankStudentRow])
  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedFacultyUsername, setSelectedFacultyUsername] = useState('')
  const [studentSubmitError, setStudentSubmitError] = useState<string | null>(null)
  const [studentSubmitSuccess, setStudentSubmitSuccess] = useState<string | null>(null)
  const [studentSubmitting, setStudentSubmitting] = useState(false)

  function setFacultyAssignment(facultyId: string) {
    setSelectedFacultyId(facultyId)
    const found = facultyList.find((f) => f.faculty_id === facultyId)
    setSelectedFacultyUsername(found?.username || '')
  }

  function updateStudentRow(index: number, field: keyof StudentRow, value: string) {
    setStudentRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addStudentRow() {
    setStudentRows((prev) => [...prev, { ...blankStudentRow }])
  }

  function removeStudentRow(index: number) {
    setStudentRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  async function onSubmitStudents() {
    if (!institutionId) {
      setStudentSubmitError('Institution ID is required')
      return
    }

    const payload: Record<string, unknown> = {}
    const trimmedCsv = studentCsv.trim()

    if (trimmedCsv) {
      payload.csv = trimmedCsv
    } else {
      const compactRows = studentRows
        .map((r) => ({
          name: r.name.trim(),
          regno: r.regno.trim(),
          dept: r.dept.trim(),
          email: r.email.trim(),
          mobile: r.mobile.trim(),
        }))
        .filter((r) => r.name || r.regno || r.dept || r.email || r.mobile)

      if (compactRows.length === 0) {
        setStudentSubmitError('Add at least one student row or paste CSV')
        return
      }

      const missing = compactRows.find((r) => !r.name || !r.regno)
      if (missing) {
        setStudentSubmitError('Each row needs name and regno')
        return
      }

      payload.rows = compactRows
    }

    if (selectedFacultyId) {
      payload.faculty_id = selectedFacultyId
      if (selectedFacultyUsername) {
        payload.faculty_username = selectedFacultyUsername
      }
    }

    setStudentSubmitting(true)
    setStudentSubmitError(null)
    setStudentSubmitSuccess(null)
    const res = await postJson<{ ok: boolean; data?: StudentDoc[]; error?: string }, Record<string, unknown>>(
      `/api/institutional/${institutionId}/students/batch`,
      payload,
      { headers: { 'x-requested-by': 'institutional' } },
    )
    setStudentSubmitting(false)

    if (!res.ok || !res.data.ok) {
      setStudentSubmitError(res.ok ? res.data.error || 'Unable to create students' : res.error || 'Network error')
      return
    }

    const createdCount = res.data.data?.length ?? 0
    setStudentSubmitSuccess(createdCount ? `Created ${createdCount} students` : 'Students created')
    setStudentCsv('')
    setStudentRows([blankStudentRow])
  }

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
      `/api/institutional/${institutionId}/students/${encodeURIComponent(editStudentId)}`,
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
      `/api/institutional/${institutionId}/students/${encodeURIComponent(enrollmentId)}`,
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
                {institutionId && (
                  <p className="mt-1 text-xs text-white/80">Institution ID: {institutionId}</p>
                )}
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
        {/* Bulk Create Students - Standalone Card */}
        <div className="rounded-lg border-2 border-red-600 bg-white p-6 shadow-xl mb-8 animate-scaleIn">
            <h2 className="text-xl font-bold text-black mb-4">Create Students</h2>
            <p className="text-sm text-gray-600 mb-6">Paste CSV or fill rows (name, regno, department, email, mobile). Optionally assign all to a faculty.</p>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assign to faculty (optional)</label>
                  <select className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none" value={selectedFacultyId} onChange={(e) => setFacultyAssignment(e.target.value)}>
                    <option value="">No faculty assignment</option>
                    {facultyList.map((f) => (
                      <option key={f.username} value={f.faculty_id || ''}>
                        {(f.faculty_id || f.username) + (f.full_name ? ` — ${f.full_name}` : '')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col justify-end text-xs text-gray-600 bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="font-semibold">CSV format:</div>
                  <div>name,regno,dept,email,mobile</div>
                  <div className="mt-1 text-red-600">CSV takes priority if provided</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Paste CSV lines</label>
                <textarea className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 h-32 focus:border-red-600 focus:outline-none font-mono text-sm" value={studentCsv} onChange={(e) => setStudentCsv(e.target.value)} placeholder="Jane Doe,REG123,Computer Science,jane@example.com,9876543210\nJohn Smith,REG124,Mathematics,john@example.com,9876543211" />
              </div>

              <div className="border-t-2 border-red-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-black">Or enter rows manually</h3>
                  <button type="button" onClick={addStudentRow} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-red-700 hover:scale-105">+ Add Row</button>
                </div>

                <div className="overflow-x-auto border-2 border-red-200 rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-red-50 border-b-2 border-red-200">
                      <tr className="text-left">
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-red-700">Name</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-red-700">Reg No</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-red-700">Department</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-red-700">Email</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-red-700">Mobile</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-red-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100">
                      {studentRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-red-50/50">
                          <td className="py-2 px-3"><input className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-red-600 focus:outline-none" value={row.name} onChange={(e) => updateStudentRow(idx, 'name', e.target.value)} placeholder="Jane Doe" /></td>
                          <td className="py-2 px-3"><input className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-red-600 focus:outline-none" value={row.regno} onChange={(e) => updateStudentRow(idx, 'regno', e.target.value)} placeholder="REG123" /></td>
                          <td className="py-2 px-3"><input className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-red-600 focus:outline-none" value={row.dept} onChange={(e) => updateStudentRow(idx, 'dept', e.target.value)} placeholder="CS" /></td>
                          <td className="py-2 px-3"><input className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-red-600 focus:outline-none" value={row.email} onChange={(e) => updateStudentRow(idx, 'email', e.target.value)} placeholder="jane@example.com" /></td>
                          <td className="py-2 px-3"><input className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-red-600 focus:outline-none" value={row.mobile} onChange={(e) => updateStudentRow(idx, 'mobile', e.target.value)} placeholder="9876543210" /></td>
                          <td className="py-2 px-3"><button type="button" onClick={() => removeStudentRow(idx)} className="rounded-lg border-2 border-red-600 bg-red-600 px-3 py-1 text-xs font-bold text-white transition-all duration-300 hover:bg-red-700">Remove</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {studentSubmitError && (<div className="rounded-lg border-2 border-red-600 bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">{studentSubmitError}</div>)}
              {studentSubmitSuccess && (<div className="rounded-lg border-2 border-green-600 bg-green-50 text-green-700 px-4 py-3 text-sm font-semibold">{studentSubmitSuccess}</div>)}

              <div className="flex gap-3 pt-4">
                <button onClick={onSubmitStudents} disabled={studentSubmitting} className="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-red-700 hover:scale-105 disabled:opacity-60">{studentSubmitting ? 'Creating…' : 'Create Students'}</button>
                <button type="button" onClick={() => { setStudentCsv(''); setStudentRows([blankStudentRow]); setStudentSubmitError(null); setStudentSubmitSuccess(null); }} className="rounded-lg border-2 border-red-600 bg-white px-6 py-2 text-sm font-bold text-red-600 transition-all duration-300 hover:bg-red-600 hover:text-white">Clear</button>
              </div>
            </div>
        </div>

        {/* Student Directory - Standalone Card */}
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
