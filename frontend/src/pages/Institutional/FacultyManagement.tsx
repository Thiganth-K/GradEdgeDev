import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteJson, getJson, postJson, putJson } from '../../lib/api'

type FacultyRow = {
  username: string
  faculty_id?: string
  full_name?: string
  department?: string
  institutional_id?: string
}

type Props = {
  username?: string
}

export default function FacultyManagement({ username }: Props) {
  const navigate = useNavigate()
  const [institutionId] = useState(username || '')
  const [facultyUsername, setFacultyUsername] = useState('')
  const [facultyPassword, setFacultyPassword] = useState('')
  const [facultyFullName, setFacultyFullName] = useState('')
  const [facultyDepartment, setFacultyDepartment] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdFacultyId, setCreatedFacultyId] = useState<string | null>(null)

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
    if (!institutionId) return
    void loadFaculty()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId])

  async function loadFaculty() {
    if (!institutionId) return
    setLoadingList(true)
    setListError(null)
    const res = await getJson<{ ok: boolean; data: FacultyRow[]; error?: string }>(
      `/api/institutional/${institutionId}/faculty`,
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
    const res = await postJson<{ ok: boolean; data?: { faculty_id?: string; username: string }; error?: string }, { username: string; password: string; full_name: string; department: string }>(
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
                <h1 className="text-3xl font-bold tracking-tight">Faculty Management</h1>
                <p className="mt-1 text-sm text-white opacity-90">Create and manage faculty accounts</p>
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
        {/* Create Faculty Section */}
        <div className="mb-8 rounded-lg border-2 border-red-600 bg-white p-6 shadow-xl animate-scaleIn">
          <h2 className="text-xl font-bold text-black mb-4">Create Faculty Account</h2>
          <p className="text-sm text-gray-600 mb-4">
            Generates a faculty ID prefixed with your institution ID.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Faculty Username</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                value={facultyUsername}
                onChange={(e) => setFacultyUsername(e.target.value)}
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Faculty Password</label>
              <input
                type="password"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                value={facultyPassword}
                onChange={(e) => setFacultyPassword(e.target.value)}
                placeholder="password"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                value={facultyFullName}
                onChange={(e) => setFacultyFullName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                value={facultyDepartment}
                onChange={(e) => setFacultyDepartment(e.target.value)}
                placeholder="Computer Science"
              />
            </div>
          </div>

          {createError && (
            <div className="mt-4 rounded-lg border-2 border-red-600 bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">
              {createError}
            </div>
          )}
          {createdFacultyId && (
            <div className="mt-4 rounded-lg border-2 border-green-600 bg-green-50 text-green-700 px-4 py-3 text-sm font-semibold">
              Created faculty ID: {createdFacultyId}
            </div>
          )}

          <button
            onClick={onCreateFaculty}
            disabled={creating}
            className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-red-700 hover:scale-105 disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create Faculty'}
          </button>
        </div>

        {/* Faculty List Section */}
        <div className="rounded-lg border-2 border-red-600 bg-white shadow-xl animate-scaleIn">
          <div className="flex items-center justify-between border-b-2 border-red-600 bg-white px-6 py-4">
            <h2 className="text-xl font-bold text-black">Faculty Directory</h2>
            <button
              onClick={() => loadFaculty()}
              disabled={loadingList}
              className="rounded-lg border-2 border-red-600 bg-white px-4 py-2 text-sm font-bold text-red-600 transition-all duration-300 hover:bg-red-600 hover:text-white disabled:opacity-60"
            >
              {loadingList ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="p-6">
            {listError && (
              <div className="rounded-lg border-2 border-red-600 bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">
                {listError}
              </div>
            )}
            {!loadingList && facultyList.length === 0 && !listError && (
              <div className="text-center py-8 text-gray-600">No faculty yet.</div>
            )}

            {facultyList.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-red-600 bg-white">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Username</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Faculty ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Full Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {facultyList.map((row) => (
                      <tr key={row.username} className="transition-all duration-200 hover:bg-red-50/50">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full border-2 border-red-600 bg-white px-2.5 py-1 text-xs font-semibold text-black">
                            {row.username}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{row.faculty_id || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{row.full_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{row.department || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEdit(row)}
                              className="rounded-lg border-2 border-red-600 bg-white px-3 py-1 text-xs font-bold text-red-600 transition-all duration-300 hover:bg-red-600 hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDelete(row.username)}
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

        {/* Edit Faculty Modal */}
        {editUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border-2 border-red-600 p-6 max-w-2xl w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-black">Edit {editUser}</h3>
                <button
                  onClick={() => setEditUser(null)}
                  className="text-red-600 hover:text-red-700 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder="Computer Science"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password (optional)</label>
                  <input
                    type="password"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
              </div>

              {editError && (
                <div className="mt-4 rounded-lg border-2 border-red-600 bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">
                  {editError}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={onSaveEdit}
                  disabled={editSaving}
                  className="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-red-700 disabled:opacity-60"
                >
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditUser(null)}
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
