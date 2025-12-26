import { useEffect, useState } from 'react'
import { getJson, postJson, putJson, deleteJson } from '../../lib/api'

export type InstitutionalUser = {
  username: string
  institutional_id?: string
  institution_name?: string
  email?: string
}

export default function InstitutionalPage() {
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
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Institutional Management</h2>
        <div className="text-sm text-slate-600">Create and manage institutional login accounts</div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-medium">{editing ? `Edit ${editing}` : 'Create institutional user'}</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createOrUpdate()
            }}
            className="space-y-3"
          >
            {!editing ? (
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
                required
              />
            ) : (
              <div className="text-sm text-slate-600">Username: {form.username}</div>
            )}
            <input
              className="w-full rounded border px-3 py-2"
              placeholder={editing ? 'new password (optional)' : 'password'}
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="institutional id"
              value={form.institutional_id}
              onChange={(e) => setForm({ ...form, institutional_id: e.target.value })}
            />
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="institution name"
              value={form.institution_name}
              onChange={(e) => setForm({ ...form, institution_name: e.target.value })}
            />
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="email (optional)"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            {error ? <div className="text-sm text-red-600">{error}</div> : null}

            <div className="flex gap-2">
              <button className="rounded bg-slate-900 px-3 py-1 text-white" type="submit">
                {editing ? 'Update' : 'Create'}
              </button>
              {editing ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null)
                    setForm({ username: '', password: '', institutional_id: '', institution_name: '', email: '' })
                  }}
                  className="rounded border px-3 py-1"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-medium">Institutional users</h3>
            {loading ? (
              <div>Loading…</div>
            ) : (
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="p-2">Username</th>
                    <th className="p-2">Institution ID</th>
                    <th className="p-2">Institution name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.username} className="border-t">
                      <td className="p-2 font-mono">{u.username}</td>
                      <td className="p-2">{u.institutional_id}</td>
                      <td className="p-2">{u.institution_name}</td>
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">
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
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
