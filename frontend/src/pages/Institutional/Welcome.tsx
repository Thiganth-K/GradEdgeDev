import React, { useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { deleteJson, getJson, postJson, putJson } from '../../lib/api'

type Props = {
  username?: string
  onLogout?: () => void
}

export default function InstitutionalWelcome({ username, onLogout }: Props) {
  const navigate = useNavigate()
  const [institutionId, setInstitutionId] = useState(username || '')
  const [facultyUsername, setFacultyUsername] = useState('')
  const [facultyPassword, setFacultyPassword] = useState('')
  const [facultyFullName, setFacultyFullName] = useState('')
  const [facultyDepartment, setFacultyDepartment] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdFacultyId, setCreatedFacultyId] = useState<string | null>(null)

  type FacultyRow = {
    username: string
    faculty_id?: string
    full_name?: string
    department?: string
    institutional_id?: string
  }

  const [facultyList, setFacultyList] = useState<FacultyRow[]>([])
  const [listError, setListError] = useState<string | null>(null)
  const [loadingList, setLoadingList] = useState(false)

  const [editUser, setEditUser] = useState<string | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

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

  type StudentRow = {
    name: string
    regno: string
    dept: string
    email: string
    mobile: string
  }

  const blankStudentRow: StudentRow = { name: '', regno: '', dept: '', email: '', mobile: '' }
  const [studentCsv, setStudentCsv] = useState('')
  const [studentRows, setStudentRows] = useState<StudentRow[]>([blankStudentRow])
  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedFacultyUsername, setSelectedFacultyUsername] = useState('')
  const [studentSubmitError, setStudentSubmitError] = useState<string | null>(null)
  const [studentSubmitSuccess, setStudentSubmitSuccess] = useState<string | null>(null)
  const [studentSubmitting, setStudentSubmitting] = useState(false)

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

  useEffect(() => {
    const id = username || ''
    setInstitutionId(id)
    if (!id) return
    void loadFaculty(id)
    void loadStudents(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  async function loadFaculty(id: string = institutionId) {
    if (!id) return
    setLoadingList(true)
    setListError(null)
    const res = await getJson<{ ok: boolean; data: FacultyRow[]; error?: string }>(
      `/api/institutional/${id}/faculty`,
    )
    setLoadingList(false)
    if (!res.ok || !res.data.ok) {
      setListError(res.ok ? res.data.error || 'Unable to load faculty' : res.error || 'Network error')
      return
    }
    setFacultyList(res.data.data)
  }

  async function loadStudents(id: string = institutionId) {
    if (!id) return
    setStudentsLoading(true)
    setStudentsError(null)
    const res = await getJson<{ ok: boolean; data: StudentDoc[]; error?: string }>(
      `/api/institutional/${id}/students`,
    )
    setStudentsLoading(false)
    if (!res.ok || !res.data.ok) {
      setStudentsError(res.ok ? res.data.error || 'Unable to load students' : res.error || 'Network error')
      return
    }
    setStudents(res.data.data)
  }

  async function onCreateFaculty() {
    if (!institutionId) {
      setCreateError('Institution ID is required')
      return
    }
    if (!facultyUsername || !facultyPassword) {
      setCreateError('Faculty username and password are required')
      return
    }

    setCreating(true)
    setCreateError(null)
    setCreatedFacultyId(null)
    const res = await postJson<{ ok: boolean; data?: { faculty_id?: string; username: string }; error?: string }>(
      `/api/institutional/${institutionId}/faculty`,
      {
        username: facultyUsername,
        password: facultyPassword,
        full_name: facultyFullName,
        department: facultyDepartment,
      },
    )
    setCreating(false)

    if (!res.ok || !res.data.ok) {
      setCreateError(res.ok ? res.data.error || 'Unable to create faculty' : res.error || 'Network error')
      return
    }

    setCreatedFacultyId(res.data.data?.faculty_id || null)
    setFacultyUsername('')
    setFacultyPassword('')
    setFacultyFullName('')
    setFacultyDepartment('')

    await loadFaculty()
  }

  function startEdit(row: FacultyRow) {
    setEditUser(row.username)
    setEditFullName(row.full_name || '')
    setEditDepartment(row.department || '')
    setEditPassword('')
    setEditError(null)
  }

  async function onSaveEdit() {
    if (!institutionId || !editUser) return
    setEditSaving(true)
    setEditError(null)
    const res = await putJson<{ ok: boolean; data?: FacultyRow; error?: string }, Record<string, string | undefined>>(
      `/api/institutional/${institutionId}/faculty/${editUser}`,
      {
        full_name: editFullName || undefined,
        department: editDepartment || undefined,
        password: editPassword || undefined,
      },
    )
    setEditSaving(false)
    if (!res.ok || !res.data.ok) {
      setEditError(res.ok ? res.data.error || 'Unable to update faculty' : res.error || 'Network error')
      return
    }
    setEditUser(null)
    await loadFaculty()
  }

  async function onDelete(usernameToDelete: string) {
    if (!institutionId) return
    const res = await deleteJson<{ ok: boolean; error?: string }>(
      `/api/institutional/${institutionId}/faculty/${usernameToDelete}`,
    )
    if (!res.ok || !res.data.ok) {
      setListError(res.ok ? res.data.error || 'Unable to delete faculty' : res.error || 'Network error')
      return
    }
    await loadFaculty()
  }

  function setFacultyAssignment(facultyId: string) {
    setSelectedFacultyId(facultyId)
    const found = facultyList.find((f) => f.faculty_id === facultyId)
    setSelectedFacultyUsername(found?.username || '')
  }

  function setEditFacultyAssignment(facultyId: string) {
    setEditStudentFacultyId(facultyId)
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
    const res = await postJson<{ ok: boolean; data?: StudentDoc[]; error?: string }>(
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
    await loadStudents()
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-semibold">Welcome, {username || 'Institution'}</h1>
        <p className="mt-2 text-sm text-slate-600">This is the institutional dashboard area.</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate('/login')}
            className="rounded bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700"
          >
            Back to Login
          </button>
          <button
            onClick={onLogout}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold">Create Faculty Account</h2>
          <p className="text-sm text-slate-600 mt-1">
            Generates a faculty ID prefixed with your institution ID.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm mb-1">Institution ID (prefix)</label>
              <input
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
                value={institutionId}
                readOnly
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Faculty Username</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={facultyUsername}
                  onChange={(e) => setFacultyUsername(e.target.value)}
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Faculty Password</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={facultyPassword}
                  onChange={(e) => setFacultyPassword(e.target.value)}
                  placeholder="password"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Full Name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={facultyFullName}
                  onChange={(e) => setFacultyFullName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Department (optional)</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={facultyDepartment}
                  onChange={(e) => setFacultyDepartment(e.target.value)}
                  placeholder="Computer Science"
                />
              </div>
            </div>

            {createError && (
              <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                {createError}
              </div>
            )}
            {createdFacultyId && (
              <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">
                Created faculty ID: {createdFacultyId}
              </div>
            )}

            <button
              onClick={onCreateFaculty}
              disabled={creating}
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create Faculty'}
            </button>
          </div>
        </div>

        <div className="mt-10 border-t pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Faculty Directory</h2>
            <button
              onClick={() => loadFaculty()}
              disabled={loadingList}
              className="text-sm rounded border px-3 py-1 hover:bg-gray-50 disabled:opacity-60"
            >
              {loadingList ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          {listError && (
            <div className="mt-3 rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {listError}
            </div>
          )}
          {!loadingList && facultyList.length === 0 && !listError && (
            <div className="mt-3 text-sm text-slate-600">No faculty yet.</div>
          )}

          {facultyList.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-600">
                    <th className="py-2 pr-3">Username</th>
                    <th className="py-2 pr-3">Faculty ID</th>
                    <th className="py-2 pr-3">Full Name</th>
                    <th className="py-2 pr-3">Department</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyList.map((row) => (
                    <tr key={row.username} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{row.username}</td>
                      <td className="py-2 pr-3">{row.faculty_id || '—'}</td>
                      <td className="py-2 pr-3">{row.full_name || '—'}</td>
                      <td className="py-2 pr-3">{row.department || '—'}</td>
                      <td className="py-2 pr-3 flex gap-2">
                        <button
                          onClick={() => startEdit(row)}
                          className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(row.username)}
                          className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {editUser && (
            <div className="mt-6 rounded border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Edit {editUser}</h3>
                <button className="text-sm text-blue-700" onClick={() => setEditUser(null)}>
                  Close
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Full Name</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Department</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">New Password (optional)</label>
                  <input
                    type="password"
                    className="w-full border rounded px-3 py-2"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
              </div>

              {editError && (
                <div className="mt-3 rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                  {editError}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={onSaveEdit}
                  disabled={editSaving}
                  className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditUser(null)}
                  className="rounded border px-4 py-2 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 border-t pt-6">
          <h2 className="text-lg font-semibold">Batch Create Students</h2>
          <p className="text-sm text-slate-600 mt-1">
            Paste CSV or fill rows (name, regno, department, email, mobile). Optionally assign all to a faculty.
          </p>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Assign to faculty (optional)</label>
                <select
                  className="w-full border rounded px-3 py-2"
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
              <div className="flex flex-col justify-end text-xs text-slate-600">
                <div>CSV order: name,regno,dept,email,mobile</div>
                <div>CSV takes priority if provided.</div>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Paste CSV lines</label>
              <textarea
                className="w-full border rounded px-3 py-2 h-28"
                value={studentCsv}
                onChange={(e) => setStudentCsv(e.target.value)}
                placeholder="Jane Doe,REG123,Computer Science,jane@example.com,9876543210"
              />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Or enter rows manually</h3>
              <button
                type="button"
                onClick={addStudentRow}
                className="text-sm rounded bg-slate-800 px-3 py-1 text-white hover:bg-slate-900"
              >
                Add Row
              </button>
            </div>

            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-slate-600">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Reg No</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">Mobile</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((row, idx) => (
                    <tr key={idx} className="border-t last:border-b-0">
                      <td className="py-2 px-3">
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={row.name}
                          onChange={(e) => updateStudentRow(idx, 'name', e.target.value)}
                          placeholder="Jane Doe"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={row.regno}
                          onChange={(e) => updateStudentRow(idx, 'regno', e.target.value)}
                          placeholder="REG123"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={row.dept}
                          onChange={(e) => updateStudentRow(idx, 'dept', e.target.value)}
                          placeholder="Computer Science"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={row.email}
                          onChange={(e) => updateStudentRow(idx, 'email', e.target.value)}
                          placeholder="jane@example.com"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={row.mobile}
                          onChange={(e) => updateStudentRow(idx, 'mobile', e.target.value)}
                          placeholder="9876543210"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <button
                          type="button"
                          onClick={() => removeStudentRow(idx)}
                          className="text-sm rounded border px-2 py-1 hover:bg-gray-50"
                          disabled={studentRows.length === 1}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {studentSubmitError && (
              <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                {studentSubmitError}
              </div>
            )}
            {studentSubmitSuccess && (
              <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">
                {studentSubmitSuccess}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onSubmitStudents}
                disabled={studentSubmitting}
                className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
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
                className="rounded border px-4 py-2 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Student Directory</h2>
            <button
              onClick={() => loadStudents()}
              disabled={studentsLoading}
              className="text-sm rounded border px-3 py-1 hover:bg-gray-50 disabled:opacity-60"
            >
              {studentsLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          {studentsError && (
            <div className="mt-3 rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {studentsError}
            </div>
          )}
          {!studentsLoading && students.length === 0 && !studentsError && (
            <div className="mt-3 text-sm text-slate-600">No students yet.</div>
          )}

          {students.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-600">
                    <th className="py-2 pr-3">Enrollment ID</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Department</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Mobile</th>
                    <th className="py-2 pr-3">Faculty</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id || s.enrollment_id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{s.enrollment_id || '—'}</td>
                      <td className="py-2 pr-3">{s.full_name || '—'}</td>
                      <td className="py-2 pr-3">{s.department || '—'}</td>
                      <td className="py-2 pr-3">{s.email || '—'}</td>
                      <td className="py-2 pr-3">{s.mobile || '—'}</td>
                      <td className="py-2 pr-3">
                        {s.faculty_id || s.faculty_username ? `${s.faculty_id || ''} ${s.faculty_username || ''}`.trim() : '—'}
                      </td>
                      <td className="py-2 pr-3 flex gap-2">
                        <button
                          onClick={() => startStudentEdit(s)}
                          className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteStudent(s.enrollment_id || '')}
                          className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {editStudentId && (
            <div className="mt-6 rounded border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Edit Student {editStudentId}</h3>
                <button className="text-sm text-blue-700" onClick={() => setEditStudentId(null)}>
                  Close
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Enrollment ID</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={editStudentEnrollment}
                    onChange={(e) => setEditStudentEnrollment(e.target.value)}
                    placeholder="REG123"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Full Name</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Department</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={editStudentDept}
                    onChange={(e) => setEditStudentDept(e.target.value)}
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={editStudentEmail}
                    onChange={(e) => setEditStudentEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Mobile</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={editStudentMobile}
                    onChange={(e) => setEditStudentMobile(e.target.value)}
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Faculty Assignment (optional)</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={editStudentFacultyId}
                    onChange={(e) => setEditFacultyAssignment(e.target.value)}
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
                <div className="mt-3 rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                  {editStudentError}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={onSaveStudentEdit}
                  disabled={editStudentSaving}
                  className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {editStudentSaving ? 'Saving…' : 'Save Student'}
                </button>
                <button
                  onClick={() => setEditStudentId(null)}
                  className="rounded border px-4 py-2 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
