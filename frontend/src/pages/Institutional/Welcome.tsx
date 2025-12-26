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

  useEffect(() => {
    const id = username || ''
    setInstitutionId(id)
    if (!id) return
    void loadFaculty(id)
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
      </div>
    </div>
  )
}
