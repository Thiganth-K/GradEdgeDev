import React, { useEffect, useState } from 'react'
import Sidebar from '../../components/SuperAdmin/sidebar'
import { useLocation, useNavigate } from 'react-router-dom'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001'

type Admin = { id: string; username: string; institutionLimit?: number; createdAt?: string }

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [institutionLimit, setInstitutionLimit] = useState<number | ''>('')
  const navigate = useNavigate()
  const location = useLocation()

  const load = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('superadmin_token')
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch(`${BACKEND}/superadmin/admins`, { headers })
      const b = await res.json().catch(() => ({}))
      if (res.ok && b.success) {
        const normalized = (b.data || []).map((it: any) => ({ id: it.id || it._id || String(it._id ?? it.username), username: it.username, institutionLimit: it.institutionLimit, createdAt: it.createdAt }))
        setAdmins(normalized)
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role')
    if (role !== 'SuperAdmin') {
      window.location.href = '/login'
      return
    }
    load()
  }, [])

  // Route-driven modal: open on /create and /edit, close otherwise
  useEffect(() => {
    const path = location.pathname
    const params = new URLSearchParams(location.search)

    if (path.endsWith('/superadmin/admins/create')) {
      setEditingId(null)
      setUsername('')
      setPassword('')
      setInstitutionLimit('')
      setModalOpen(true)
      return
    }

    if (path.endsWith('/superadmin/admins/edit')) {
      const id = params.get('id')
      setEditingId(id)
      const a = admins.find((x) => x.id === id) || null
      setUsername(a?.username || '')
      setPassword('')
      setInstitutionLimit(a?.institutionLimit ?? '')
      setModalOpen(true)
      return
    }

    setModalOpen(false)
  }, [location.pathname, location.search, admins])

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setUsername('')
    setPassword('')
    setInstitutionLimit('')
    navigate('/superadmin/admins')
  }

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

    closeModal()
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete admin?')) return
    const token = localStorage.getItem('superadmin_token')
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    await fetch(`${BACKEND}/superadmin/admins/${id}`, { method: 'DELETE', headers })
    load()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 bg-red-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-red-700">Admin Management</h2>
              <div className="mt-1 text-sm text-gray-600">Create and manage admin accounts for institutions</div>
            </div>
            <div>
              <button onClick={() => navigate('/superadmin/dashboard')} className="px-4 py-2 bg-white border rounded">Back</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="col-span-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Institution Limit</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
              </div>
              <div className="col-span-4 text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</p>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {loading && (
                <div className="p-6 text-sm text-gray-500">Loading admins...</div>
              )}

              {!loading && admins.length === 0 && (
                <div className="p-6 text-sm text-gray-500">No admins created yet.</div>
              )}

              {admins.map((a) => (
                <div key={a.id} className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 transition-colors relative">
                  <div className="col-span-3">
                    <h3 className="font-semibold text-gray-900 mb-0.5">{a.username}</h3>
                    <p className="text-sm text-gray-500">Admin account</p>
                  </div>

                  <div className="col-span-3">
                    <p className="font-medium text-gray-900 mb-0.5">{a.institutionLimit ?? '—'}</p>
                    <p className="text-sm text-gray-500">Institutions allowed</p>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">ACTIVE</span>
                  </div>

                  <div className="col-span-4 flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/superadmin/admins/edit?id=${a.id}`)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === a.id ? null : a.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="More options"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {menuOpen === a.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)}></div>
                          <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                            <button
                              onClick={() => {
                                setMenuOpen(null);
                                if (confirm('Delete admin?')) del(a.id);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                            >
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Action Button */}
          <button
            onClick={() => navigate('/superadmin/admins/create')}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 py-4 rounded-full shadow-2xl transition-all flex items-center gap-2 hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Admin</span>
          </button>

          {/* Modal */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black opacity-30" onClick={closeModal} />

              <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">{editingId ? 'Edit Admin' : 'Create Admin'}</h3>
                </div>

                <form onSubmit={submit} className="px-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="enterprise-input w-full mt-2" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Institution Limit</label>
                      <input value={institutionLimit as any} onChange={(e) => setInstitutionLimit(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Institution Limit" className="enterprise-input w-full mt-2" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="enterprise-input w-full mt-2" />
                      {!editingId && <div className="mt-1 text-xs text-gray-500">Password required for new admin</div>}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-4">
                    <button type="button" onClick={closeModal} className="px-4 py-2 border rounded">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">{editingId ? 'Update' : 'Create'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminManagement

