import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const StudentManagement: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('');
  const [regno, setRegno] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const load = async () => {
    const res = await fetch(`${BACKEND}/institution/students`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json().catch(() => ({}));
    if (res.ok) setList(body.data || []);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${BACKEND}/institution/students`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username, password, name, email, dept, regno }),
    });
    setUsername(''); setPassword(''); setName(''); setEmail(''); setDept(''); setRegno('');
    load();
  };

  const remove = async (id: string) => { await fetch(`${BACKEND}/institution/students/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); load(); };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Student Management</h2>
        <form onSubmit={create} className="space-y-2 mb-4">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="border p-2" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" className="border p-2" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" className="border p-2" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" className="border p-2" />
          <input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="dept" className="border p-2" />
          <input value={regno} onChange={(e) => setRegno(e.target.value)} placeholder="regno" className="border p-2" />
          <button className="px-4 py-2 bg-red-600 text-white rounded">Create Student</button>
        </form>

        <div className="bg-white rounded shadow">
          <table className="w-full">
            <thead><tr><th className="p-2">Username</th><th>Name</th><th>RegNo</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s._id}><td className="p-2">{s.username}</td><td>{s.name}</td><td>{s.regno}</td><td className="p-2"><button className="text-red-600" onClick={() => remove(s._id)}>Delete</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
