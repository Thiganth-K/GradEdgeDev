import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BatchManagement: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const load = async () => {
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
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${BACKEND}/institution/batches`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, facultyId: facultyId || null, studentIds: selectedStudents }),
    });
    setName(''); setFacultyId(''); setSelectedStudents([]);
    load();
  };

  const remove = async (id: string) => { await fetch(`${BACKEND}/institution/batches/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); load(); };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Batch Management</h2>
        <form onSubmit={create} className="space-y-2 mb-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="batch name" className="border p-2" />
          <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} className="border p-2">
            <option value="">-- assign faculty --</option>
            {faculties.map((f) => <option key={f._id} value={f._id}>{f.username} ({f.role})</option>)}
          </select>
          <div className="border p-2 rounded">
            <div className="text-sm font-semibold mb-1">Students (multi-select)</div>
            <select multiple value={selectedStudents} onChange={(e) => setSelectedStudents(Array.from(e.target.selectedOptions, (o) => o.value))} className="w-full border p-2 h-32">
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.username}{s.name ? ` — ${s.name}` : ''}</option>
              ))}
            </select>
            <div className="text-xs text-gray-600 mt-1">Hold Ctrl/Cmd to choose multiple students.</div>
          </div>
          <button className="px-4 py-2 bg-red-600 text-white rounded">Create Batch</button>
        </form>

        <div className="bg-white rounded shadow">
          <table className="w-full">
            <thead><tr><th className="p-2">Name</th><th>Faculty</th><th>Students</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b._id}><td className="p-2">{b.name}</td><td>{b.faculty?.username || '-'}</td><td>{(b.students || []).map((s:any)=>s.username).join(', ')}</td><td className="p-2"><button className="text-red-600" onClick={() => remove(b._id)}>Delete</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BatchManagement;
