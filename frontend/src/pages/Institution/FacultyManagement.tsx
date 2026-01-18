import React, { useEffect, useState } from 'react';
import InstitutionSidebar from '../../components/Institution/Sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const EditModal: React.FC<{ item: any; onClose: () => void; onSave: (updated: any) => void; onError?: (m: string)=>void }> = ({ item, onClose, onSave, onError }) => {
  const [form, setForm] = useState({ username: item.username || '', role: item.role || '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const payload: any = { username: form.username, role: form.role };
      if (form.password) payload.password = form.password;
      const res = await fetch(`${BACKEND}/institution/faculties/${item._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        onSave({ ...item, ...payload });
        onClose();
      } else {
        setError(body.message || 'Failed to update');
        if (onError) onError(body.message || 'Failed to update');
      }
    } catch (err) {
      console.error(err); setError('Network error'); if (onError) onError('Network error');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Edit Faculty</h2>
            <p className="text-red-100 text-sm">Modify faculty details</p>
          </div>
          <button onClick={onClose} className="text-white p-2">✕</button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-700 mb-1">Username</label>
              <input value={form.username} onChange={(e)=>setForm({...form, username: e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})} className="w-full border px-3 py-2 rounded">
                <option value="aptitude">Aptitude</option>
                <option value="technical">Technical</option>
                <option value="psychometric">Psychometric</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Password (leave blank to keep)</label>
              <input type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
          </div>
          {error && <div className="text-sm text-red-600 mt-4">{error}</div>}
          <div className="flex gap-3 mt-6 justify-end">
            <button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded">{saving ? 'Saving...' : 'Save Changes'}</button>
            <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateFacultyModal: React.FC<{ onClose: () => void; onCreated: (newItem: any) => void; onError?: (m:string)=>void }> = ({ onClose, onCreated, onError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('aptitude');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!username.trim() || !password) { setError('Username and password required'); if (onError) onError('Username and password required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/institution/faculties`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ username: username.trim(), password, role }) });
      const body = await res.json().catch(()=>({}));
      if (res.ok) {
        const created = body.data || { _id: body.data?._id || Math.random()+'', username: username.trim(), role };
        onCreated(created);
        onClose();
      } else {
        setError(body.message || 'Failed to create'); if (onError) onError(body.message || 'Failed to create');
      }
    } catch (err) { console.error(err); setError('Network error'); if (onError) onError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Create Faculty</h2>
            <p className="text-red-100 text-sm">Add a new faculty</p>
          </div>
          <button onClick={onClose} className="text-white p-2">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-700 mb-1">Username</label>
              <input value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Role</label>
              <select value={role} onChange={(e)=>setRole(e.target.value)} className="w-full border px-3 py-2 rounded">
                <option value="aptitude">Aptitude</option>
                <option value="technical">Technical</option>
                <option value="psychometric">Psychometric</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
          </div>
          {error && <div className="text-sm text-red-600 mt-4">{error}</div>}
          <div className="flex gap-3 mt-6 justify-end">
            <button type="submit" disabled={loading} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded">{loading ? 'Creating...' : 'Create'}</button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FacultyManagement: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const usernameRef = React.useRef<HTMLInputElement | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/institution/faculties`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (res.ok) setList(body.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id: string) => {
    if (!window.confirm('Delete this faculty?')) return;
    setLoading(true); setMsg(null);
    try {
      const res = await fetch(`${BACKEND}/institution/faculties/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setMsg('Faculty removed'); load(); }
      else { setMsg('Failed to delete'); }
    } catch (err) { console.error(err); setMsg('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstitutionSidebar />
      {editingItem && (
        <EditModal item={editingItem} onClose={() => setEditingItem(null)} onSave={(updated) => { setList((s)=>s.map(x => x._id === updated._id ? {...x, ...updated} : x)); setEditingItem(null); setMsg('Faculty updated'); }} onError={(m)=>setMsg(m)} />
      )}
      {showCreateModal && (
        <CreateFacultyModal onClose={() => setShowCreateModal(false)} onCreated={(n) => { setList((s)=>[n, ...s]); setShowCreateModal(false); setMsg('Faculty created'); }} onError={(m)=>setMsg(m)} />
      )}
      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Faculty Management</h2>
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search faculty..."
                className="px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {msg && <div className="mb-4 text-sm text-center text-gray-700">{msg}</div>}

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">Faculties ({list.length})</div>
              <div className="text-xs text-gray-500">{loading ? 'Loading...' : ''}</div>
            </div>
            <div className="p-2">
              <div className="divide-y divide-gray-100">
                {list.filter(f => f.username.toLowerCase().includes(search.toLowerCase())).map((f) => (
                  <div key={f._id} className="grid grid-cols-12 gap-4 px-4 py-4 items-center">
                    <div className="col-span-4">
                      <div className="font-medium text-gray-900">{f.username}</div>
                      <div className="text-xs text-gray-500">ID: {f._id}</div>
                    </div>
                    <div className="col-span-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{f.role}</span>
                    </div>
                    <div className="col-span-5 text-right">
                      <div className="inline-flex items-center gap-3 justify-end">
                        <button onClick={() => setEditingItem(f)} className="text-gray-600 hover:text-gray-800">Edit</button>
                        <button onClick={() => handleRemove(f._id)} className="text-red-600 hover:text-red-700">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {list.filter(f => f.username.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <div className="py-8 px-4 text-center text-sm text-gray-500">No faculties found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {list.length > 0 && (
        <button
          onClick={() => { setShowCreateModal(true); }}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform"
        >
          + Add Faculty
        </button>
      )}
    </div>
  );
};

export default FacultyManagement;
