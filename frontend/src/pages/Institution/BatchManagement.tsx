import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const BatchManagement: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      let res;
      if (editingId) {
        res = await fetch(`${BACKEND}/institution/batches/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, facultyId: facultyId || null, studentIds: selectedStudents }),
        });
      } else {
        res = await fetch(`${BACKEND}/institution/batches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, facultyId: facultyId || null, studentIds: selectedStudents }),
        });
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body.message || (editingId ? 'Failed to update batch' : 'Failed to create batch'));
        return;
      }
      setMsg(editingId ? 'Batch updated successfully' : 'Batch created successfully');
      setName('');
      setFacultyId('');
      setSelectedStudents([]);
      setEditingId(null);
      load();
    } catch (err: any) {
      setMsg(err.message || 'Network error');
    }
  };

  const onEdit = (b: any) => {
    setEditingId(b._id);
    setName(b.name || '');
    setFacultyId(b.faculty?._id || '');
    setSelectedStudents((b.students || []).map((s: any) => s._id));
    setMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setName('');
    setFacultyId('');
    setSelectedStudents([]);
    setMsg(null);
  };

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
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Batch Management</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-3 text-lg">
              {editingId ? '✏️ Edit Batch' : '➕ Create Batch'}
            </h3>
            {msg && (
              <div className={`text-sm mb-3 p-2 rounded ${
                msg.includes('error') || msg.includes('Failed') || msg.includes('failed')
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {msg}
              </div>
            )}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Batch Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter batch name"
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Assign Faculty</label>
                <select
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="">-- Select Faculty (Optional) --</option>
                  {faculties.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.username} ({f.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Select Students</label>
                <select
                  multiple
                  value={selectedStudents}
                  onChange={(e) => setSelectedStudents(Array.from(e.target.selectedOptions, (o) => o.value))}
                  className="w-full border p-2 rounded h-40"
                >
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.username}{s.name ? ` — ${s.name}` : ''}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-600 mt-1">
                  Hold Ctrl/Cmd to select multiple students
                </div>
              </div>
              
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  {editingId ? 'Update Batch' : 'Create Batch'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Section */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-3">Existing Batches</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {list.length === 0 && (
                <div className="text-sm text-gray-600">No batches created yet</div>
              )}
              {list.map((b) => (
                <div key={b._id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-lg">{b.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-semibold">Faculty:</span>{' '}
                        {b.faculty?.username || 'Not assigned'}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-semibold">Students ({(b.students || []).length}):</span>{' '}
                        {(b.students || []).length > 0
                          ? (b.students || []).slice(0, 3).map((s: any) => s.username).join(', ') +
                            ((b.students || []).length > 3 ? `, +${(b.students || []).length - 3} more` : '')
                          : 'No students assigned'}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => onEdit(b)}
                        className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(b._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchManagement;
