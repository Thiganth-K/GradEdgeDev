import React, { useEffect, useState } from 'react';
import InstitutionSidebar from '../../components/Institution/Sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const FacultyManagement: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('aptitude');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
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

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) { setMsg('Username and password required'); return; }
    setLoading(true); setMsg(null);
    try {
      const res = await fetch(`${BACKEND}/institution/faculties`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: username.trim(), password, role }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg('Faculty created');
        setUsername(''); setPassword(''); setRole('aptitude');
        load();
      } else {
        setMsg(body.message || 'Failed to create');
      }
    } catch (err) {
      console.error(err); setMsg('Network error');
    } finally { setLoading(false); }
  };

  const remove = async (id: string) => {
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
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
                            <button onClick={() => { /* placeholder for edit */ }} className="text-gray-600 hover:text-gray-800">Edit</button>
                            <div className="relative">
                              <button onClick={() => setMenuOpen(menuOpen === f._id ? null : f._id)} className="p-2 rounded hover:bg-gray-50 text-gray-500">
                                •••
                              </button>
                              {menuOpen === f._id && (
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                  <button onClick={() => { setMenuOpen(null); remove(f._id); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                                </div>
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

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Create Faculty</h3>
                <form onSubmit={create} className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Username</label>
                    <input ref={usernameRef} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Password</label>
                    <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option value="aptitude">Aptitude</option>
                      <option value="technical">Technical</option>
                      <option value="psychometric">Psychometric</option>
                    </select>
                  </div>
                  <div>
                    <button type="submit" className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-semibold">{loading ? 'Saving...' : 'Create Faculty'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      {list.length > 0 && (
        <button
          onClick={() => { usernameRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform"
        >
          + Add Faculty
        </button>
      )}
    </div>
  );
};

export default FacultyManagement;
