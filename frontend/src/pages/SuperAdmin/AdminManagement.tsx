


















import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/SuperAdmin/sidebar'
import { FaSearch, FaFilter, FaTh, FaEllipsisV } from 'react-icons/fa'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001'

type Admin = { id: string; username: string; institutionLimit?: number }

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [institutionLimit, setInstitutionLimit] = useState<number | ''>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('superadmin_token')
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch(`${BACKEND}/superadmin/admins`, { headers })
      const b = await res.json().catch(() => ({}))
      if (res.ok && b && b.data) {
        const normalized = (b.data || []).map((it: any) => ({ id: it.id || it._id || String(it._id ?? it.username), username: it.username, institutionLimit: it.institutionLimit }))
        setAdmins(normalized)
      }
    } catch (err) {
      console.debug('load admins error', err)
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

  const resetForm = () => {
    setUsername('')
    setPassword('')
    setInstitutionLimit('')
    setEditingId(null)
    setShowModal(false)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (a: Admin) => {
    setUsername(a.username)
    setEditingId(a.id)
    setInstitutionLimit(a.institutionLimit ?? '')
    setShowModal(true)
  }

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!username) return alert('username required')

    const token = localStorage.getItem('superadmin_token')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
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
      console.debug('submit error', err)
    }

    resetForm()
    load()
  }

  const edit = (a: Admin) => {
    openEditModal(a)
  }

  const del = async (id: string) => {
    if (!confirm('Delete admin?')) return
    try {
      const token = localStorage.getItem('superadmin_token')
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      await fetch(`${BACKEND}/superadmin/admins/${id}`, { method: 'DELETE', headers })
      load()
    } catch (err) {
      console.debug('delete error', err)
    }
  }

  const filteredAdmins = admins.filter(a => 
    a.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const paginatedAdmins = filteredAdmins.slice(startIdx, endIdx)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ADMIN MANAGEMENT</h1>
          <p className="text-sm text-gray-500 mt-1">MANAGE SYSTEM ADMINISTRATORS</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <FaFilter className="text-gray-600" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <FaTh className="text-gray-600" />
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
                Delete
              </button>
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
              >
                + ADD
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ADMIN USER
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  INSTITUTIONS
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && paginatedAdmins.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No admins found.
                  </td>
                </tr>
              )}
              {!loading && paginatedAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold">
                        {admin.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{admin.username}</div>
                        <div className="text-sm text-gray-500">Administrator</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {admin.institutionLimit ? `${admin.institutionLimit} Allowed` : 'Unlimited'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => edit(admin)}
                      className="text-gray-700 hover:text-red-600 font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIdx + 1}-{Math.min(endIdx, filteredAdmins.length)} of {filteredAdmins.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Admin' : 'Add Admin'}
            </h3>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {!editingId && (
                  <div className="mt-1 text-xs text-gray-500">Password is required for new admin</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institution Limit</label>
                <input
                  type="number"
                  value={institutionLimit}
                  onChange={(e) => setInstitutionLimit(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminManagement
