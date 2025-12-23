import { useEffect, useState } from 'react'
import { getJson, postJson, putJson, deleteJson } from '../../lib/api'

type Faculty = {
  username: string
  full_name?: string
  faculty_id?: string
  department?: string
}

export default function FacultyPage() {
  const [list, setList] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const [form, setForm] = useState({ username: '', password: '', full_name: '', faculty_id: '', department: '' })
  const [editing, setEditing] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(undefined)
    const res = await getJson<any>('/api/faculty')
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }

    // Normalize response: some backends return { ok: true, data: [...] },
    // others return the raw array. Accept both.
    let docs: Faculty[] = []
    if (Array.isArray(res.data)) {
      docs = res.data
    } else if (res.data && Array.isArray(res.data.data)) {
      docs = res.data.data
    } else {
      setError('Unexpected response shape from /api/faculty')
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
        const payload: any = { full_name: form.full_name, faculty_id: form.faculty_id, department: form.department }
        if (form.password) payload.password = form.password
        const res = await putJson<Faculty, typeof payload>(`/api/faculty/${encodeURIComponent(editing)}`, payload)
        if (!res.ok) throw new Error(res.error)
        setEditing(null)
        setForm({ username: '', password: '', full_name: '', faculty_id: '', department: '' })
        await load()
      } else {
        const payload = { username: form.username, password: form.password, full_name: form.full_name, faculty_id: form.faculty_id, department: form.department }
        const res = await postJson<Faculty, typeof payload>('/api/faculty', payload)
        if (!res.ok) throw new Error(res.error)
        setForm({ username: '', password: '', full_name: '', faculty_id: '', department: '' })
        await load()
      }
    } catch (err: any) {
      setError(err?.message || String(err))
    }
  }

  async function onEdit(u: Faculty) {
    setEditing(u.username)
    setForm({ username: u.username, password: '', full_name: u.full_name || '', faculty_id: u.faculty_id || '', department: u.department || '' })
  }

  async function onDelete(username: string) {
    if (!confirm(`Delete faculty ${username}?`)) return
    const res = await deleteJson(`/api/faculty/${encodeURIComponent(username)}`)
    if (!res.ok) {
      setError(res.error)
      return
    }
    await load()
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Faculty Management</h2>
        <div className="text-sm text-slate-600">Manage faculty accounts (create, edit, delete)</div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-medium">{editing ? `Edit ${editing}` : 'Create faculty'}</h3>
          <form onSubmit={(e) => { e.preventDefault(); createOrUpdate() }} className="space-y-3">
            {!editing ? (
              <input className="w-full rounded border px-3 py-2" placeholder="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" required />
            ) : (
              <div className="text-sm text-slate-600">Username: {form.username}</div>
            )}
            <input className="w-full rounded border px-3 py-2" placeholder="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <input className="w-full rounded border px-3 py-2" placeholder="full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input className="w-full rounded border px-3 py-2" placeholder="faculty id" value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })} />
            <input className="w-full rounded border px-3 py-2" placeholder="department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />

            {error ? <div className="text-sm text-red-600">{error}</div> : null}

            <div className="flex gap-2">
              <button className="rounded bg-slate-900 px-3 py-1 text-white" type="submit">{editing ? 'Update' : 'Create'}</button>
              {editing ? (<button type="button" onClick={() => { setEditing(null); setForm({ username: '', password: '', full_name: '', faculty_id: '', department: '' }) }} className="rounded border px-3 py-1">Cancel</button>) : null}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-medium">Faculty list</h3>
            {loading ? <div>Loading…</div> : (
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="p-2">Username</th>
                    <th className="p-2">Full name</th>
                    <th className="p-2">Faculty ID</th>
                    <th className="p-2">Department</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((f) => (
                    <tr key={f.username} className="border-t">
                      <td className="p-2 font-mono">{f.username}</td>
                      <td className="p-2">{f.full_name}</td>
                      <td className="p-2">{f.faculty_id}</td>
                      <td className="p-2">{f.department}</td>
                      <td className="p-2">
                        <button onClick={() => onEdit(f)} className="mr-2 rounded bg-slate-100 px-2 py-1 text-sm">Edit</button>
                        <button onClick={() => onDelete(f.username)} className="rounded bg-red-50 px-2 py-1 text-sm text-red-700">Delete</button>
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
