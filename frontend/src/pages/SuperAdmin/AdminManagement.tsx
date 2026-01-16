


















// AdminManagement — single clean copy
import React, { useEffect, useState } from 'react'
import Sidebar from '../../components/SuperAdmin/sidebar'
<<<<<<< Updated upstream
=======
import { useLocation, useNavigate } from 'react-router-dom'
import SuperAdminTable, { type Column, StatusBadge, AvatarGroup } from '../../components/SuperAdmin/SuperAdminTable'
import SuperAdminPageHeader from '../../components/SuperAdmin/SuperAdminPageHeader'
import { FaTrash, FaEdit } from 'react-icons/fa'
>>>>>>> Stashed changes

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001'

type Admin = { id: string; username: string; institutionLimit?: number }

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([])
<<<<<<< Updated upstream
=======
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  const edit = (a: any) => { setUsername(a.username); setEditingId(a.id); setInstitutionLimit(a.institutionLimit ?? '') }
  const del = async (id: string) => { if (!confirm('Delete admin?')) return; const token = localStorage.getItem('superadmin_token'); const headers: any = {}; if (token) headers.Authorization = `Bearer ${token}`; await fetch(`${BACKEND}/superadmin/admins/${id}`, { method: 'DELETE', headers }); load(); }
=======
  const del = async (id: string | number) => {
    // Backend call to delete admin
    const token = localStorage.getItem('superadmin_token')
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    await fetch(`${BACKEND}/superadmin/admins/${id}`, { method: 'DELETE', headers })
  }
>>>>>>> Stashed changes

  const handleBulkDelete = async (ids: (string | number)[]) => {
      // Loop through and delete
      for (const id of ids) {
          await del(id);
      }
      load();
  }

  const columns: Column<Admin>[] = [
    {
        header: 'Admin User',
        accessor: (row) => (
            <div className="flex items-center gap-3">
                <AvatarGroup images={[`https://ui-avatars.com/api/?name=${row.username}&background=DC2626&color=000000`]} limit={1} />
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{row.username}</span>
                    <span className="text-xs text-gray-500">Administrator</span>
                </div>
            </div>
        )
    },
    {
        header: 'Institutions',
        accessor: (row) => (
             <div className="text-gray-700 font-medium">
                 {row.institutionLimit ? `${row.institutionLimit} Allowed` : 'Unlimited'}
             </div>
        )
    },

  ];

  return (
<<<<<<< Updated upstream
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
=======
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-gray-50 h-full flex flex-col overflow-hidden">
        <SuperAdminPageHeader 
            title="Admin Management" 
            subtitle="Manage system administrators"
        />
        <div className="flex-1 overflow-hidden p-8">
            <SuperAdminTable 
                title="Admin Management"
                data={admins}
                columns={columns}
                isLoading={loading}
                onAdd={() => navigate('/superadmin/admins/create')}
                onDelete={handleBulkDelete}
                actions={(row) => (
                    <button 
                       onClick={() => navigate(`/superadmin/admins/edit?id=${row.id}`)}
                       className="group inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm active:scale-95"
                    >
                       <span className='uppercasec'>Edit</span>
                    </button>
                )}
            />
        </div>

        {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

              <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Admin' : 'Create New Admin'}</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>

                <form onSubmit={submit} className="px-6 py-6 space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="Enter username" 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm" 
                      />
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Institution Limit</label>
                      <input 
                        type="number"
                        value={institutionLimit} 
                        onChange={(e) => setInstitutionLimit(e.target.value === '' ? '' : Number(e.target.value))} 
                        placeholder="Limit (leave empty for unlimited)" 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm" 
                      />
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder={editingId ? "Leave blank to keep current" : "Enter password"} 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm" 
                      />
                      {!editingId && <div className="mt-1 text-xs text-red-500">* Required for new accounts</div>}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                    <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-red-200">
                        {editingId ? 'Save Changes' : 'Create Admin'}
                    </button>
>>>>>>> Stashed changes
                  </div>
                </form>
              </div>
            </div>
<<<<<<< Updated upstream

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
=======
        )}
>>>>>>> Stashed changes
      </div>
    </div>
  )
}

<<<<<<< Updated upstream
export default AdminManagement
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
import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

type Admin = { id: string; username: string };

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [institutionLimit, setInstitutionLimit] = useState<number | ''>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const token = localStorage.getItem('superadmin_token');
    const res = await fetch(`${BACKEND}/superadmin/admins`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const b = await res.json();
    if (b.success) {
      const normalized = (b.data || []).map((it: any) => ({ id: it.id || it._id || it._id?.toString?.() || String(it.username), username: it.username, institutionLimit: it.institutionLimit || 10 }));
      setAdmins(normalized);
    }
  };

      const [username, setUsername] = useState('');
  useEffect(() => { load(); }, []);

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username || !password) return alert('username and password required');

    const token = localStorage.getItem('superadmin_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const body: any = { username };
    if (password) body.password = password;
    if (institutionLimit !== '') body.institutionLimit = Number(institutionLimit);
    if (editingId) {
      await fetch(`${BACKEND}/superadmin/admins/${editingId}`, { method: 'PUT', headers, body: JSON.stringify(body) });
    } else {
      if (!password) return alert('password required for new admin');
      await fetch(`${BACKEND}/superadmin/admins`, { method: 'POST', headers, body: JSON.stringify(body) });
    }
    setUsername(''); setPassword(''); setEditingId(null);
    setInstitutionLimit('');
    load();
  };

  const edit = (a: any) => { setUsername(a.username); setEditingId(a.id); setInstitutionLimit(a.institutionLimit || 10); };
  const del = async (id: string) => { if (!confirm('Delete admin?')) return; const token = localStorage.getItem('superadmin_token'); const headers: any = {}; if (token) headers.Authorization = `Bearer ${token}`; await fetch(`${BACKEND}/superadmin/admins/${id}`, { method: 'DELETE', headers }); load(); };

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <h2 className="text-2xl font-bold text-red-700 mb-4">Admin Management</h2>

        <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="p-2 border rounded" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="p-2 border rounded" />
            <input value={institutionLimit as any} onChange={(e) => setInstitutionLimit(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Institution Limit" className="p-2 border rounded" />
            <div className="flex items-center">
              <button className="px-4 py-2 bg-red-600 text-white rounded" type="submit">Create</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setUsername(''); setPassword(''); setInstitutionLimit(''); }} className="ml-2 px-3 py-2 border rounded">Cancel</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminManagement;
import Sidebar from '../../../components/SuperAdmin/sidebar';
const AdminManagement: React.FC = () => {
  // ... rest of the code
}
=======


export default AdminManagement
>>>>>>> Stashed changes
