import React, { useEffect, useState } from 'react';
import InstitutionSidebar from '../../components/Institution/Sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const EditStudentModal: React.FC<{ item: any; onClose: () => void; onSave: (updated: any) => void }> = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({ username: item.username || '', name: item.name || '', email: item.email || '', dept: item.dept || '', regno: item.regno || '', password: '' });
  const [saving, setSaving] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { username: form.username, name: form.name, email: form.email, dept: form.dept, regno: form.regno };
      if (form.password) payload.password = form.password;
      const res = await fetch(`${BACKEND}/institution/students/${item._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        onSave({ ...item, ...payload });
        onClose();
      } else alert(body.message || 'Failed to update');
    } catch (err) { console.error(err); alert('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-xl flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Edit Student</h3>
            <p className="text-red-100 text-sm">Modify student details</p>
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
              <label className="block text-xs text-gray-700 mb-1">Name</label>
              <input value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Email</label>
              <input value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Department</label>
              <input value={form.dept} onChange={(e)=>setForm({...form, dept: e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Reg No</label>
              <input value={form.regno} onChange={(e)=>setForm({...form, regno: e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Password (leave blank to keep)</label>
              <input type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateStudentModal: React.FC<{ onClose: () => void; onCreated: (newItem: any) => void }> = ({ onClose, onCreated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('');
  const [regno, setRegno] = useState('');
  const [loading, setLoading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) { alert('Username and password required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/institution/students`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ username: username.trim(), password, name, email, dept, regno }) });
      const body = await res.json().catch(()=>({}));
      if (res.ok) {
        onCreated(body.data || { _id: body.data?._id || Math.random()+'', username: username.trim(), name, email, dept, regno });
        onClose();
      } else alert(body.message || 'Failed to create');
    } catch (err) { console.error(err); alert('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-xl flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Create Student</h3>
            <p className="text-red-100 text-sm">Add a new student account</p>
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
              <label className="block text-xs text-gray-700 mb-1">Name</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Email</label>
              <input value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Department</label>
              <input value={dept} onChange={(e)=>setDept(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Reg No</label>
              <input value={regno} onChange={(e)=>setRegno(e.target.value)} className="w-full border px-3 py-2 rounded" />
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

const StudentManagement: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/institution/students`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (res.ok) setList(body.data || []);
    } catch (err) { console.error(err); setMsg('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id: string) => {
    if (!window.confirm('Delete this student?')) return;
    setLoading(true); setMsg(null);
    try {
      const res = await fetch(`${BACKEND}/institution/students/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setMsg('Student removed'); load(); }
      else setMsg('Failed to delete');
    } catch (err) { console.error(err); setMsg('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen">
      <InstitutionSidebar />
      {editingItem && <EditStudentModal item={editingItem} onClose={() => setEditingItem(null)} onSave={(u) => { setList((s)=>s.map(x=>x._id===u._id?{...x,...u}:x)); setEditingItem(null); }} />}
      {showCreateModal && <CreateStudentModal onClose={() => setShowCreateModal(false)} onCreated={(n)=>{ setList((s)=>[n, ...s]); setShowCreateModal(false); }} />}

      <div className="flex-1 bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
            </div>
            <p className="text-gray-600">Manage student accounts and registrations</p>
          </div>

          {msg && (
            <div className="mb-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              {msg}
            </div>
          )}

          {/* Actions Bar */}
          <div className="mb-6 flex items-center justify-between">
            <input
              type="text"
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              placeholder="Search students..."
              className="border border-gray-300 rounded-lg px-4 py-2 w-80 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Student
            </button>
          </div>

          {list.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Students Yet</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first student</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Add First Student
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 px-6 py-4 bg-[#0d0d0d] border-b border-gray-200">
                <div className="col-span-3">
                  <p className="text-xs font-semibold text-white uppercase tracking-wider">Student Details</p>
                </div>
                <div className="col-span-3">
                  <p className="text-xs font-semibold text-white uppercase tracking-wider">Username/Dept</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-white uppercase tracking-wider">Reg. Number</p>
                </div>
                <div className="col-span-1 text-center">
                  <p className="text-xs font-semibold text-white uppercase tracking-wider">Status</p>
                </div>
                <div className="col-span-3 text-right">
                  <p className="text-xs font-semibold text-white uppercase tracking-wider">Actions</p>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {list.filter(s => s.username.toLowerCase().includes(search.toLowerCase()) || (s.name || '').toLowerCase().includes(search.toLowerCase())).map((s) => (
                  <div key={s._id} className="grid grid-cols-12 gap-3 px-6 py-5 hover:bg-gray-50 transition-colors">
                    {/* Student Details */}
                    <div className="col-span-3">
                      <h3 className="font-semibold text-gray-900 mb-0.5 text-sm">{s.name || s.username}</h3>
                      <p className="text-xs text-gray-500">{s.email || '—'}</p>
                    </div>

                    {/* Username/Dept */}
                    <div className="col-span-3 flex flex-col justify-center">
                      <p className="text-sm text-gray-700">{s.username}</p>
                      <p className="text-xs text-gray-500">Dept: {s.dept || '—'}</p>
                    </div>

                    {/* Reg Number */}
                    <div className="col-span-2 flex items-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {s.regno || 'N/A'}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ACTIVE
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingItem(s)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemove(s._id)}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {list.filter(s => s.username.toLowerCase().includes(search.toLowerCase()) || (s.name || '').toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <div className="py-8 px-6 text-center text-sm text-gray-500">No students match your search</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
