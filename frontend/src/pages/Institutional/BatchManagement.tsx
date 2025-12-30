import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJson, postJson } from '../../lib/api'

type FacultyRow = {
  username: string
  faculty_id?: string
  full_name?: string
  department?: string
}

type StudentRow = {
  name: string
  regno: string
  dept: string
  email: string
  mobile: string
}

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

type BatchRow = {
  batch_code: string
  name?: string
  department?: string
  year?: string
  section?: string
  faculty_id?: string
}

type Props = {
  username?: string
  institutionId?: string
}

export default function BatchManagement({ username, institutionId: propInstitutionId }: Props) {
  const navigate = useNavigate()
  const [institutionId] = useState(propInstitutionId || username || '')
  const blankStudentRow: StudentRow = { name: '', regno: '', dept: '', email: '', mobile: '' }
  const [studentCsv, setStudentCsv] = useState('')
  const [studentRows, setStudentRows] = useState<StudentRow[]>([blankStudentRow])
  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedFacultyUsername, setSelectedFacultyUsername] = useState('')
  const [studentSubmitError, setStudentSubmitError] = useState<string | null>(null)
  const [studentSubmitSuccess, setStudentSubmitSuccess] = useState<string | null>(null)
  const [studentSubmitting, setStudentSubmitting] = useState(false)
  const [facultyList, setFacultyList] = useState<FacultyRow[]>([])
  const [batches, setBatches] = useState<BatchRow[]>([])
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [batchForm, setBatchForm] = useState<BatchRow>({ batch_code: '', name: '', department: '', year: '', section: '', faculty_id: '' })
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchSubmitError, setBatchSubmitError] = useState<string | null>(null)
  const [batchSubmitSuccess, setBatchSubmitSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!institutionId) return
    void loadFaculty()
    void loadBatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId])

  async function loadFaculty() {
    if (!institutionId) return
    const res = await getJson<{ ok: boolean; data: FacultyRow[]; error?: string }>(
      `/api/institutional/${institutionId}/faculty`,
    )
    if (res.ok && res.data.ok) {
      setFacultyList(res.data.data)
    }
  }

  async function loadBatches() {
    if (!institutionId) return
    setBatchesLoading(true)
    const res = await getJson<{ ok: boolean; data: BatchRow[]; error?: string }>(
      `/api/institutional/${institutionId}/batches`,
    )
    if (res.ok && res.data.ok) {
      setBatches(res.data.data || [])
    }
    setBatchesLoading(false)
  }

  function setFacultyAssignment(facultyId: string) {
    setSelectedFacultyId(facultyId)
    const found = facultyList.find((f) => f.faculty_id === facultyId)
    setSelectedFacultyUsername(found?.username || '')
  }

  function updateBatchField(field: keyof BatchRow, value: string) {
    setBatchForm((prev) => ({ ...prev, [field]: value }))
  }

  async function onSubmitBatch() {
    setBatchSubmitError(null)
    setBatchSubmitSuccess(null)
    if (!institutionId) {
      setBatchSubmitError('Institution ID is required')
      return
    }
    if (!batchForm.batch_code) {
      setBatchSubmitError('Batch code is required')
      return
    }
    if (!batchForm.faculty_id) {
      setBatchSubmitError('Assign a faculty to make it visible in their dashboard')
      return
    }

    setBatchSubmitting(true)
    const payload = {
      batch_code: batchForm.batch_code.trim(),
      name: batchForm.name?.trim() || undefined,
      department: batchForm.department?.trim() || undefined,
      year: batchForm.year?.trim() || undefined,
      section: batchForm.section?.trim() || undefined,
      faculty_id: batchForm.faculty_id,
    }

    const res = await postJson<{ ok: boolean; data?: BatchRow; error?: string }, typeof payload>(
      `/api/institutional/${institutionId}/batches`,
      payload,
    )
    setBatchSubmitting(false)

    if (!res.ok || !res.data.ok) {
      setBatchSubmitError(res.ok ? res.data.error || 'Unable to create batch' : res.error || 'Network error')
      return
    }

    setBatchSubmitSuccess('Batch created')
    setBatchForm({ batch_code: '', name: '', department: '', year: '', section: '', faculty_id: '' })
    void loadBatches()
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
                <h1 className="text-3xl font-bold tracking-tight">Batch Management</h1>
                <p className="mt-1 text-sm text-white opacity-90">Create multiple students at once</p>
                {institutionId && (
                  <p className="mt-1 text-xs text-white/80">Institution ID: {institutionId}</p>
                )}
              </div>
            </div>
            
            <div className="animate-slideInRight delay-200">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white ring-2 ring-white/20">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-lg border-2 border-red-600 bg-white p-6 shadow-xl mb-8 animate-scaleIn">
          <h2 className="text-xl font-bold text-black mb-4">Create Batch</h2>
          <p className="text-sm text-gray-600 mb-6">Create a batch and assign it to a faculty. It will appear on that faculty dashboard.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Batch code *</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                value={batchForm.batch_code}
                onChange={(e) => updateBatchField('batch_code', e.target.value)}
                placeholder="CSE-2026-A"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Batch name</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                value={batchForm.name || ''}
                onChange={(e) => updateBatchField('name', e.target.value)}
                placeholder="Computer Science 2026 A"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                value={batchForm.department || ''}
                onChange={(e) => updateBatchField('department', e.target.value)}
                placeholder="CSE"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <input
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                  value={batchForm.year || ''}
                  onChange={(e) => updateBatchField('year', e.target.value)}
                  placeholder="2026"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                <input
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                  value={batchForm.section || ''}
                  onChange={(e) => updateBatchField('section', e.target.value)}
                  placeholder="A"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Assign to faculty *</label>
              <select
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                value={batchForm.faculty_id || ''}
                onChange={(e) => updateBatchField('faculty_id', e.target.value)}
              >
                <option value="">Select faculty</option>
                {facultyList.map((f) => (
                  <option key={f.username} value={f.faculty_id || ''}>
                    {(f.faculty_id || f.username) + (f.full_name ? ` — ${f.full_name}` : '')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {batchSubmitError && <div className="mt-4 text-sm text-red-600 font-semibold">{batchSubmitError}</div>}
          {batchSubmitSuccess && <div className="mt-4 text-sm text-green-600 font-semibold">{batchSubmitSuccess}</div>}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onSubmitBatch}
              disabled={batchSubmitting}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {batchSubmitting ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-black">Existing Batches</h3>
            <button
              type="button"
              onClick={() => void loadBatches()}
              className="text-sm text-red-600 font-semibold hover:underline"
            >
              Refresh
            </button>
          </div>
          {batchesLoading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : batches.length === 0 ? (
            <div className="text-sm text-gray-600">No batches yet. Create one above.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-xs uppercase text-gray-500">
                    <th className="py-2 px-3">Batch Code</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3">Year</th>
                    <th className="py-2 px-3">Section</th>
                    <th className="py-2 px-3">Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {batches.map((b) => (
                    <tr key={b.batch_code}>
                      <td className="py-2 px-3 font-semibold text-gray-900">{b.batch_code}</td>
                      <td className="py-2 px-3 text-gray-800">{b.name || '-'}</td>
                      <td className="py-2 px-3 text-gray-800">{b.department || '-'}</td>
                      <td className="py-2 px-3 text-gray-800">{b.year || '-'}</td>
                      <td className="py-2 px-3 text-gray-800">{b.section || '-'}</td>
                      <td className="py-2 px-3 text-gray-800">{b.faculty_id || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-lg border-2 border-red-600 bg-white p-6 shadow-xl animate-scaleIn">
          <h2 className="text-xl font-bold text-black mb-4">Batch Create Students</h2>
          <p className="text-sm text-gray-600 mb-6">
            Paste CSV or fill rows (name, regno, department, email, mobile). Optionally assign all to a faculty.
          </p>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assign to faculty (optional)</label>
                <select
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                  value={selectedFacultyId}
                  onChange={(e) => setFacultyAssignment(e.target.value)}
                >
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
              <textarea
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 h-32 focus:border-red-600 focus:outline-none font-mono text-sm"
                value={studentCsv}
                onChange={(e) => setStudentCsv(e.target.value)}
                placeholder="Jane Doe,REG123,Computer Science,jane@example.com,9876543210&#10;John Smith,REG124,Mathematics,john@example.com,9876543211"
              />
            </div>

            <div className="border-t-2 border-red-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-black">Or enter rows manually</h3>
                <button
                  type="button"
                  onClick={addStudentRow}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-red-700 hover:scale-105"
                >
                  + Add Row
                </button>
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
                        <td className="py-2 px-3">
                          <input
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-red-600 focus:outline-none"
                            value={row.name}
                            onChange={(e) => updateStudentRow(idx, 'name', e.target.value)}
                            placeholder="Jane Doe"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-red-600 focus:outline-none"
                            value={row.regno}
                            onChange={(e) => updateStudentRow(idx, 'regno', e.target.value)}
                            placeholder="REG123"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-red-600 focus:outline-none"
                            value={row.dept}
                            onChange={(e) => updateStudentRow(idx, 'dept', e.target.value)}
                            placeholder="CS"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-red-600 focus:outline-none"
                            value={row.email}
                            onChange={(e) => updateStudentRow(idx, 'email', e.target.value)}
                            placeholder="jane@example.com"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-red-600 focus:outline-none"
                            value={row.mobile}
                            onChange={(e) => updateStudentRow(idx, 'mobile', e.target.value)}
                            placeholder="9876543210"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <button
                            type="button"
                            onClick={() => removeStudentRow(idx)}
                            className="rounded-lg border-2 border-red-600 bg-red-600 px-3 py-1 text-xs font-bold text-white transition-all duration-300 hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {studentSubmitError && (
              <div className="rounded-lg border-2 border-red-600 bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">
                {studentSubmitError}
              </div>
            )}
            {studentSubmitSuccess && (
              <div className="rounded-lg border-2 border-green-600 bg-green-50 text-green-700 px-4 py-3 text-sm font-semibold">
                {studentSubmitSuccess}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={onSubmitStudents}
                disabled={studentSubmitting}
                className="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-red-700 hover:scale-105 disabled:opacity-60"
              >
                {studentSubmitting ? 'Creating…' : 'Create Students'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudentCsv('')
                  setStudentRows([blankStudentRow])
                  setStudentSubmitError(null)
                  setStudentSubmitSuccess(null)
                }}
                className="rounded-lg border-2 border-red-600 bg-white px-6 py-2 text-sm font-bold text-red-600 transition-all duration-300 hover:bg-red-600 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
