import React, { useEffect, useState } from 'react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-xl flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Create Batch</h3>
            <p className="text-red-100 text-sm">Create a new student batch</p>
          </div>
          <button onClick={onClose} className="text-white p-2">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-700 mb-1">Batch Name</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Assign Faculty (optional)</label>
              <select value={facultyId} onChange={(e)=>setFacultyId(e.target.value)} className="w-full border px-3 py-2 rounded">
                <option value="">-- none --</option>
                {faculties.map(f => <option key={f._id} value={f._id}>{f.username} ({f.role})</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-700 mb-1">Select Students</label>
              <select multiple value={selectedStudents} onChange={(e)=>setSelectedStudents(Array.from(e.target.selectedOptions, o=>o.value))} className="w-full border px-3 py-2 rounded h-44">
                {students.map(s => <option key={s._id} value={s._id}>{s.username}{s.name?` — ${s.name}`:''}</option>)}
              </select>
              <div className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-xl flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Edit Batch</h3>
            <p className="text-red-100 text-sm">Update batch details</p>
          </div>
          <button onClick={onClose} className="text-white p-2">✕</button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-700 mb-1">Batch Name</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Assign Faculty (optional)</label>
              <select value={facultyId} onChange={(e)=>setFacultyId(e.target.value)} className="w-full border px-3 py-2 rounded">
                <option value="">-- none --</option>
                {faculties.map(f => <option key={f._id} value={f._id}>{f.username} ({f.role})</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-700 mb-1">Select Students</label>
              <select multiple value={selectedStudents} onChange={(e)=>setSelectedStudents(Array.from(e.target.selectedOptions, o=>o.value))} className="w-full border px-3 py-2 rounded h-44">
                {students.map(s => <option key={s._id} value={s._id}>{s.username}{s.name?` — ${s.name}`:''}</option>)}
              </select>
              <div className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</div>
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

const BatchManagement: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Batches</h2>
              <p className="text-sm text-gray-500">Organize students into batches and assign faculty.</p>
            </div>
          </div>

          {msg && <div className="mb-4 text-sm text-center text-gray-700">{msg}</div>}

          <div className="bg-white rounded-xl shadow overflow-visible">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">All Batches ({list.length})</div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {list.length === 0 && <div className="text-sm text-gray-600">No batches created yet</div>}
                {list.map((b) => (
                  <div key={b._id} className="border rounded p-4 flex items-start justify-between overflow-visible">
                    <div className="flex-1">
                      <div className="font-medium text-lg">{b.name}</div>
                      <div className="text-sm text-gray-600 mt-2 flex flex-col gap-1">
                        <div><span className="font-semibold">Faculty:</span> {(b.faculty ? 1 : 0)}</div>
                        <div><span className="font-semibold">Students:</span> {(b.students || []).length}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 relative">
                      <button onClick={() => setEditingItem(b)} className="p-2 text-gray-400 hover:text-gray-600" title="Edit">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => setOpenMenuFor(openMenuFor === b._id ? null : b._id)} className="p-2 text-gray-500 hover:text-gray-700" title="Actions">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="6" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="18" r="1.5" />
                        </svg>
                      </button>
                      {openMenuFor === b._id && (
                        <>
                          <div onClick={() => setOpenMenuFor(null)} className="fixed inset-0 z-40" />
                          <div className="absolute right-0 z-50 mt-2 w-44 bg-white border rounded shadow-lg">
                            <button onClick={() => { setDetailsItem(b); setOpenMenuFor(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-100">View details</button>
                            <button onClick={() => { if (confirm('Delete this batch?')) { remove(b._id); } setOpenMenuFor(null); }} className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100">Delete</button>
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
