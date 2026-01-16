import React, { useEffect, useState } from 'react';
import InstitutionSidebar from '../../components/Institution/Sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const EditModal: React.FC<{ item: any; onClose: () => void; onSave: (updated: any) => void }> = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({ username: item.username || '', role: item.role || '', password: '' });
  const [saving, setSaving] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const handleSave = async () => {
    setSaving(true);
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
        alert(body.message || 'Failed to update');
      }
    } catch (err) {
      console.error(err); alert('Network error');
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
          <div className="flex gap-3 mt-6 justify-end">
            <button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded">{saving ? 'Saving...' : 'Save Changes'}</button>
            <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateFacultyModal: React.FC<{ onClose: () => void; onCreated: (newItem: any) => void }> = ({ onClose, onCreated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('aptitude');
  const [loading, setLoading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) { alert('Username and password required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/institution/faculties`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ username: username.trim(), password, role }) });
      const body = await res.json().catch(()=>({}));
      if (res.ok) {
        onCreated(body.data || { _id: body.data?._id || Math.random()+'', username: username.trim(), role });
        onClose();
      } else {
        alert(body.message || 'Failed to create');
      }
    } catch (err) { console.error(err); alert('Network error'); }
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
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
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
        <EditModal item={editingItem} onClose={() => setEditingItem(null)} onSave={(updated) => { setList((s)=>s.map(x => x._id === updated._id ? {...x, ...updated} : x)); setEditingItem(null); }} />
      )}
      {showCreateModal && (
        <CreateFacultyModal onClose={() => setShowCreateModal(false)} onCreated={(n) => { setList((s)=>[n, ...s]); setShowCreateModal(false); }} />
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
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => setEditingItem(f)} className="text-gray-600 hover:text-gray-800">Edit</button>
                        <div className="relative">
                          <button onClick={() => setMenuOpen(menuOpen === f._id ? null : f._id)} className="p-2 rounded hover:bg-gray-50 text-gray-500">
                            •••
                          </button>
                          {menuOpen === f._id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)}></div>
                              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                <button onClick={() => { setMenuOpen(null); handleRemove(f._id); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                              </div>
                            </>
                          )}
                        </div>
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
