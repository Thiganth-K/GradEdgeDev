import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type Admin = { id: string; username: string };

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const token = localStorage.getItem('superadmin_token');
    const res = await fetch(`${BACKEND}/superadmin/admins`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const b = await res.json();
    if (b.success) {
      const normalized = (b.data || []).map((it: any) => ({ id: it.id || it._id || it._id?.toString?.() || String(it.username), username: it.username }));
      setAdmins(normalized);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username || !password) return alert('username and password required');

    const token = localStorage.getItem('superadmin_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (editingId) {
      await fetch(`${BACKEND}/superadmin/admins/${editingId}`, { method: 'PUT', headers, body: JSON.stringify({ username, password }) });
    } else {
      await fetch(`${BACKEND}/superadmin/admins`, { method: 'POST', headers, body: JSON.stringify({ username, password }) });
    }
    setUsername(''); setPassword(''); setEditingId(null);
    load();
  };

  const edit = (a: Admin) => { setUsername(a.username); setEditingId(a.id); };
  const del = async (id: string) => { if (!confirm('Delete admin?')) return; const token = localStorage.getItem('superadmin_token'); const headers: any = {}; if (token) headers.Authorization = `Bearer ${token}`; await fetch(`${BACKEND}/superadmin/admins/${id}`, { method: 'DELETE', headers }); load(); };

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-red-700 mb-4">Admin Management</h2>

        <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="p-2 border rounded" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="p-2 border rounded" />
            <div className="flex items-center">
              <button className="px-4 py-2 bg-red-600 text-white rounded" type="submit">{editingId ? 'Update' : 'Create'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setUsername(''); setPassword(''); }} className="ml-2 px-3 py-2 border rounded">Cancel</button>}
            </div>
          </div>
        </form>

        <div className="space-y-3">
          {admins.map((a) => (
            <div key={a.id} className="p-3 bg-white rounded shadow flex justify-between items-center">
              <div>{a.username}</div>
              <div className="space-x-2">
                <button onClick={() => edit(a)} className="px-3 py-1 border rounded">Edit</button>
                <button onClick={() => del(a.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
