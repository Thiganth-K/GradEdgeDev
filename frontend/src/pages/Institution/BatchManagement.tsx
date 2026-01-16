import React, { useEffect, useMemo, useState } from 'react';
import InstitutionSidebar from '../../components/Institution/Sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const CreateBatchModal: React.FC<{ onClose: () => void; onCreated: () => void; faculties: any[]; students: any[] }> = ({ onClose, onCreated, faculties, students }) => {
  const [name, setName] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/institution/batches`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, facultyId: facultyId || null, studentIds: selectedStudents }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(body.message || 'Failed to create batch');
        return;
      }
      onCreated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl ring-1 ring-gray-100 overflow-hidden">
        <div className="flex items-center gap-4 p-5 border-b">
          <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">B</div>
          <div>
            <h3 className="text-lg font-semibold">Create Batch</h3>
            <p className="text-sm text-gray-500">Create a new batch and assign faculty or students</p>
          </div>
          <div className="ml-auto">
            <button onClick={onClose} aria-label="close" className="text-gray-400 hover:text-gray-700">✕</button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Batch Name</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border border-gray-200 px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-200" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Assign Faculty (optional)</label>
              <select value={facultyId} onChange={(e)=>setFacultyId(e.target.value)} className="w-full border border-gray-200 px-3 py-2 rounded-lg shadow-sm focus:outline-none">
                <option value="">-- none --</option>
                {faculties.map(f => <option key={f._id} value={f._id}>{f.username} ({f.role})</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Select Students</label>
              <select multiple value={selectedStudents} onChange={(e)=>setSelectedStudents(Array.from(e.target.selectedOptions, o=>o.value))} className="w-full border border-gray-200 px-3 py-2 rounded-lg h-44 shadow-sm">
                {students.map(s => <option key={s._id} value={s._id}>{s.username}{s.name?` — ${s.name}`:''}</option>)}
              </select>
              <div className="text-xs text-gray-500 mt-2">Tip: Hold Ctrl/Cmd to select multiple students</div>
            </div>
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow">{loading ? 'Creating...' : 'Create Batch'}</button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditBatchModal: React.FC<{ item: any; onClose: () => void; onSaved: () => void; faculties: any[]; students: any[] }> = ({ item, onClose, onSaved, faculties, students }) => {
  const [name, setName] = useState(item.name || '');
  const [facultyId, setFacultyId] = useState(item.faculty?._id || '');
  const [selectedStudents, setSelectedStudents] = useState<string[]>((item.students || []).map((s: any) => s._id));
  const [saving, setSaving] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND}/institution/batches/${item._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name, facultyId: facultyId || null, studentIds: selectedStudents }) });
      const body = await res.json().catch(()=>({}));
      if (!res.ok) { alert(body.message || 'Failed to update'); return; }
      onSaved(); onClose();
    } catch (err: any) { alert(err.message || 'Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl ring-1 ring-gray-100 overflow-hidden">
        <div className="flex items-center gap-4 p-5 border-b">
          <div className="w-10 h-10 rounded-lg bg-yellow-600 flex items-center justify-center text-white font-bold">E</div>
          <div>
            <h3 className="text-lg font-semibold">Edit Batch</h3>
            <p className="text-sm text-gray-500">Update batch information</p>
          </div>
          <div className="ml-auto">
            <button onClick={onClose} aria-label="close" className="text-gray-400 hover:text-gray-700">✕</button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Batch Name</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border border-gray-200 px-3 py-2 rounded-lg shadow-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Assign Faculty (optional)</label>
              <select value={facultyId} onChange={(e)=>setFacultyId(e.target.value)} className="w-full border border-gray-200 px-3 py-2 rounded-lg shadow-sm">
                <option value="">-- none --</option>
                {faculties.map(f => <option key={f._id} value={f._id}>{f.username} ({f.role})</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Select Students</label>
              <select multiple value={selectedStudents} onChange={(e)=>setSelectedStudents(Array.from(e.target.selectedOptions, o=>o.value))} className="w-full border border-gray-200 px-3 py-2 rounded-lg h-44 shadow-sm">
                {students.map(s => <option key={s._id} value={s._id}>{s.username}{s.name?` — ${s.name}`:''}</option>)}
              </select>
              <div className="text-xs text-gray-500 mt-2">Tip: Hold Ctrl/Cmd to select multiple students</div>
            </div>
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg shadow">{saving ? 'Saving...' : 'Save Changes'}</button>
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BatchManagement: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState<any | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const load = async () => {
    setMsg(null);
    try {
      const [bRes, fRes, sRes] = await Promise.all([
        fetch(`${BACKEND}/institution/batches`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND}/institution/faculties`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND}/institution/students`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const b = await bRes.json().catch(() => ({}));
      const f = await fRes.json().catch(() => ({}));
      const s = await sRes.json().catch(() => ({}));
      if (bRes.ok) setList(b.data || []);
      if (fRes.ok) setFaculties(f.data || []);
      if (sRes.ok) setStudents(s.data || []);
    } catch (err: any) {
      setMsg('Failed to load data: ' + err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm('Delete this batch?')) return;
    setMsg(null);
    try {
      const res = await fetch(`${BACKEND}/institution/batches/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body.message || 'Failed to delete batch');
        return;
      }
      setMsg('Batch deleted successfully');
      load();
    } catch (err: any) {
      setMsg(err.message || 'Network error');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstitutionSidebar />
      {detailsItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-xl flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{detailsItem.name}</h3>
                <p className="text-red-100 text-sm">Batch details</p>
              </div>
              <button onClick={() => setDetailsItem(null)} className="text-white p-2">✕</button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="font-semibold">Faculty</div>
                <div className="text-sm text-gray-700 mt-1">{detailsItem.faculty?.username || 'Not assigned'}</div>
              </div>
              <div>
                <div className="font-semibold">Students ({(detailsItem.students || []).length})</div>
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-700">
                    <thead className="sr-only"><tr><th>Username</th><th>Name</th></tr></thead>
                    <tbody>
                      {(detailsItem.students || []).map((s: any) => (
                        <tr key={s._id || s.username} className="border-b last:border-b-0">
                          <td className="py-2 pr-4">{s.username}</td>
                          <td className="py-2 text-gray-500">{s.name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setDetailsItem(null)} className="px-4 py-2 border rounded">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {editingItem && <EditBatchModal item={editingItem} faculties={faculties} students={students} onClose={() => setEditingItem(null)} onSaved={() => load()} />}
      {showCreateModal && <CreateBatchModal faculties={faculties} students={students} onClose={() => setShowCreateModal(false)} onCreated={() => load()} />}

      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold">Batches</h2>
              <p className="text-sm text-gray-500">Organize students into batches and assign faculty.</p>
            </div>
            <div className="flex-1 max-w-md ml-4">
              <label className="sr-only">Search batches</label>
              <div className="relative">
                <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search batches, faculty or student" className="w-full border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</div>
              </div>
            </div>
            <div className="ml-auto">
              <button onClick={() => setShowCreateModal(true)} className="hidden md:inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow">+ Create Batch</button>
            </div>
          </div>

          {msg && <div className="mb-4 text-sm text-center text-gray-700">{msg}</div>}

          <div className="bg-white rounded-2xl shadow overflow-visible ring-1 ring-gray-50">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">All Batches ({list.length})</div>
              <div className="text-xs text-gray-500">{list.reduce((a,b)=>a + ((b.students||[]).length),0)} students across {list.length} batches</div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-600">
                    <div className="text-lg font-medium">No batches yet</div>
                    <div className="mt-2">Create your first batch to organize students and assign faculty.</div>
                    <div className="mt-4">
                      <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg">Create Batch</button>
                    </div>
                  </div>
                )}
                {useMemo(() => {
                  const q = query.trim().toLowerCase();
                  return list.filter(b => {
                    if (!q) return true;
                    if ((b.name||'').toLowerCase().includes(q)) return true;
                    if (b.faculty && (b.faculty.username||'').toLowerCase().includes(q)) return true;
                    if ((b.students||[]).some((s:any) => (s.username||'').toLowerCase().includes(q) || (s.name||'').toLowerCase().includes(q))) return true;
                    return false;
                  });
                }, [list, query]).map((b) => (
                  <div key={b._id} className="border rounded-xl p-4 flex items-start justify-between hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 font-semibold text-lg">{(b.name||'--').charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="font-medium text-lg">{b.name}</div>
                        <div className="text-sm text-gray-500 mt-2">{b.faculty ? `Faculty: ${b.faculty.username}` : 'No faculty assigned'}</div>
                        <div className="text-sm text-gray-500 mt-1">Students: {(b.students||[]).length}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 relative">
                      <button onClick={() => setEditingItem(b)} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-100 rounded-lg text-gray-600 hover:bg-gray-50">Edit</button>
                      <button onClick={() => setOpenMenuFor(openMenuFor === b._id ? null : b._id)} className="p-2 text-gray-500 hover:text-gray-700" title="Actions">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="6" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="18" r="1.5" /></svg>
                      </button>
                      {openMenuFor === b._id && (
                        <>
                          <div onClick={() => setOpenMenuFor(null)} className="fixed inset-0 z-40" />
                          <div className="absolute right-0 z-50 mt-2 w-44 bg-white border rounded-lg shadow-lg">
                            <button onClick={() => { setDetailsItem(b); setOpenMenuFor(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">View details</button>
                            <button onClick={() => { if (confirm('Delete this batch?')) { remove(b._id); } setOpenMenuFor(null); }} className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50">Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {list.length > 0 && (
        <button onClick={() => setShowCreateModal(true)} className="fixed bottom-8 right-8 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform">+ Create Batch</button>
      )}
    </div>
  );
};

export default BatchManagement;
