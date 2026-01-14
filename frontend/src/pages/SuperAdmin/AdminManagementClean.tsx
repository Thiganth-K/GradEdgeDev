import React, { useEffect, useState } from 'react'
import Sidebar from '../../components/SuperAdmin/sidebar'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001'

type Admin = { id: string; username: string; institutionLimit?: number }

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [institutionLimit, setInstitutionLimit] = useState<number | ''>('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = async () => {
    try {
      const token = localStorage.getItem('superadmin_token')
      const res = await fetch(`${BACKEND}/superadmin/admins`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const b = await res.json()
      if (b.success) {
        const normalized = (b.data || []).map((it: any) => ({ id: it.id || it._id || String(it._id ?? it.username), username: it.username, institutionLimit: it.institutionLimit }))
        setAdmins(normalized)
      }
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => { const role = localStorage.getItem('gradedge_role'); if (role !== 'SuperAdmin') { window.location.href = '/login'; return } ; load() }, [])

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!username) return alert('username required')

    const token = localStorage.getItem('superadmin_token')
    const headers: any = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    const body: any = { username }
    if (password) body.password = password
    if (institutionLimit !== '') body.institutionLimit = Number(institutionLimit)

    try {
      if (editingId) {
        await fetch(`${BACKEND}/superadmin/admins/${editingId}`, { method: 'PUT', headers, body: JSON.stringify(body) })
      } else {
        if (!password) return alert('password required for new admin')
        await fetch(`${BACKEND}/superadmin/admins`, { method: 'POST', headers, body: JSON.stringify(body) })
      }
    } catch (err) {
      // ignore
    }

    setUsername(''); setPassword(''); setEditingId(null); setInstitutionLimit('')
    load()
  }

  const edit = (a: any) => { setUsername(a.username); setEditingId(a.id); setInstitutionLimit(a.institutionLimit ?? '') }
  const del = async (id: string) => { if (!confirm('Delete admin?')) return; const token = localStorage.getItem('superadmin_token'); const headers: any = {}; if (token) headers.Authorization = `Bearer ${token}`; await fetch(`${BACKEND}/superadmin/admins/${id}`, { method: 'DELETE', headers }); load(); }

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-6xl mx-auto flex">
        <Sidebar />

        <main className="flex-1">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-red-700">Admin Management</h2>
            <div className="mt-2 text-sm text-gray-600">Create and manage admin accounts for institutions</div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-lg font-medium mb-4">Create / Edit Admin</h3>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="enterprise-input w-full mt-2" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="enterprise-input w-full mt-2" />
                    <div className="mt-1 text-xs text-gray-500">Password required for new admin</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Institution Limit</label>
                    <input value={institutionLimit as any} onChange={(e) => setInstitutionLimit(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Institution Limit" className="enterprise-input w-full mt-2" />
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded">{editingId ? 'Update' : 'Create'}</button>
                    {editingId && (<button type="button" onClick={() => { setEditingId(null); setUsername(''); setPassword(''); setInstitutionLimit('') }} className="px-4 py-2 border rounded">Cancel</button>)}
                  </div>
                </form>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-lg font-medium mb-4">Existing Admins</h3>
                <div className="space-y-3">
                  {admins.length === 0 && <div className="text-sm text-gray-500">No admins created yet.</div>}
                  {admins.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{a.username}</div>
                        <div className="text-xs text-gray-500">Institution limit: {a.institutionLimit ?? '10'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => edit(a)} className="px-3 py-1 bg-red-50 text-red-700 rounded">Edit</button>
                        <button onClick={() => del(a.id)} className="px-3 py-1 border rounded">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminManagement
