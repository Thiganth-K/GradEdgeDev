import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const FacultyManagement: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('aptitude');

  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const load = async () => {
    const res = await fetch(`${BACKEND}/institution/faculties`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json().catch(() => ({}));
    if (res.ok) setList(body.data || []);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${BACKEND}/institution/faculties`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username, password, role }),
    });
    setUsername(''); setPassword(''); setRole('aptitude');
    load();
  };

  const remove = async (id: string) => { await fetch(`${BACKEND}/institution/faculties/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); load(); };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Faculty Management</h2>
        <form onSubmit={create} className="space-y-2 mb-4">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="border p-2" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" className="border p-2" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="border p-2">
            <option value="aptitude">Aptitude</option>
            <option value="technical">Technical</option>
            <option value="psycometric">Psycometric</option>
          </select>
          <button className="px-4 py-2 bg-red-600 text-white rounded">Create Faculty</button>
        </form>

        <div className="bg-white rounded shadow">
          <table className="w-full">
            <thead><tr><th className="p-2">Username</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((f) => (
                <tr key={f._id}><td className="p-2">{f.username}</td><td>{f.role}</td><td className="p-2"><button className="text-red-600" onClick={() => remove(f._id)}>Delete</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FacultyManagement;
