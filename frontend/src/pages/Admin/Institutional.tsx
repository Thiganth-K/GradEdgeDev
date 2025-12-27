import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJson, postJson, putJson, deleteJson } from '../../lib/api'

export type InstitutionalUser = {
  username: string
  institutional_id?: string
  institution_name?: string
  email?: string
}

export default function InstitutionalPage() {
  const navigate = useNavigate()
  const [list, setList] = useState<InstitutionalUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const [form, setForm] = useState({
    username: '',
    password: '',
    institutional_id: '',
    institution_name: '',
    email: '',
  })
  const [editing, setEditing] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(undefined)
    const res = await getJson<any>('/api/institutional')
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }

    let docs: InstitutionalUser[] = []
    if (Array.isArray(res.data)) {
      docs = res.data
    } else if (res.data && Array.isArray(res.data.data)) {
      docs = res.data.data
    } else {
      setError('Unexpected response shape from /api/institutional')
      return
    }

    setList(docs)
  }

  useEffect(() => {
    load()
  }, [])

  async function createOrUpdate(e?: Event) {
    if (e && e.preventDefault) e.preventDefault()
    setError(undefined)

    try {
      if (editing) {
        const payload: any = {
          institutional_id: form.institutional_id,
          institution_name: form.institution_name,
          email: form.email,
        }
        if (form.password) payload.password = form.password
        const res = await putJson<InstitutionalUser, typeof payload>(
          `/api/institutional/${encodeURIComponent(editing)}`,
          payload,
        )
        if (!res.ok) throw new Error(res.error)
        setEditing(null)
        setForm({ username: '', password: '', institutional_id: '', institution_name: '', email: '' })
        await load()
      } else {
        const payload = {
          username: form.username,
          password: form.password,
          institutional_id: form.institutional_id,
          institution_name: form.institution_name,
          email: form.email,
        }
        const res = await postJson<InstitutionalUser, typeof payload>('/api/institutional', payload)
        if (!res.ok) throw new Error(res.error)
        setForm({ username: '', password: '', institutional_id: '', institution_name: '', email: '' })
        await load()
      }
    } catch (err: any) {
      setError(err?.message || String(err))
    }
  }

  function onEdit(u: InstitutionalUser) {
    setEditing(u.username)
    setForm({
      username: u.username,
      password: '',
      institutional_id: u.institutional_id || '',
      institution_name: u.institution_name || '',
      email: u.email || '',
    })
  }

  async function onDelete(username: string) {
    if (!confirm(`Delete institutional user ${username}?`)) return
    const res = await deleteJson(`/api/institutional/${encodeURIComponent(username)}`)
    if (!res.ok) {
      setError(res.error)
      return
    }
    await load()
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="h-1.5 w-full bg-red-600" />

      <div className="border-b-4 border-red-600 bg-red-600 px-6 py-6 text-white">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/welcome')}
              className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white transition-all duration-300 hover:scale-110"
            >
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Institutional Management</h1>
              <p className="mt-1 text-sm opacity-90">Create and manage institutional login accounts</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="rounded-lg border border-white/20 bg-white px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total institutional users</p>
              <p className="text-2xl font-bold text-black">{list.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-gray-700">{editing ? `Edit ${editing}` : 'Create institutional user'}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createOrUpdate()
              }}
              className="space-y-3"
            >
              {!editing ? (
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  autoComplete="username"
                  required
                />
              ) : (
                <div className="text-sm text-gray-600">Username: <span className="font-mono">{form.username}</span></div>
              )}
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder={editing ? 'new password (optional)' : 'password'}
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="institutional id"
                value={form.institutional_id}
                onChange={(e) => setForm({ ...form, institutional_id: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="institution name"
                value={form.institution_name}
                onChange={(e) => setForm({ ...form, institution_name: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="email (optional)"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              {error ? <div className="text-sm text-red-600">{error}</div> : null}

              <div className="flex gap-2">
                <button className="rounded bg-red-600 px-3 py-1 text-white text-sm" type="submit">
                  {editing ? 'Update' : 'Create'}
                </button>
                {editing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null)
                      setForm({ username: '', password: '', institutional_id: '', institution_name: '', email: '' })
                    }}
                    className="rounded border border-gray-200 px-3 py-1 text-sm"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-medium text-gray-700">Institutional users</h3>
              {loading ? (
                <div>Loading…</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-red-600 bg-white">
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Username</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Institution ID</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Institution name</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50">
                      {list.map((u) => (
                        <tr key={u.username} className="transition-all duration-200 hover:bg-red-50/30">
                          <td className="px-4 py-3 font-mono text-gray-700">{u.username}</td>
                          <td className="px-4 py-3">{u.institutional_id}</td>
                          <td className="px-4 py-3">{u.institution_name}</td>
                          <td className="px-4 py-3">{u.email}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => onEdit(u)}
                              className="mr-2 rounded bg-slate-100 px-2 py-1 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDelete(u.username)}
                              className="rounded bg-red-50 px-2 py-1 text-sm text-red-700"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
