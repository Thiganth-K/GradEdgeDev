import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const InstitutionManagement: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'admin') {
      window.location.href = '/login';
      return;
    }

    const token = localStorage.getItem('admin_token');
    fetch(`${BACKEND}/admin/institutions`, { headers: { Authorization: token ? `Bearer ${token}` : '' } }).then((r) => r.json()).then((b) => {
      if (b.success) setItems((b.data || []).map((x: any) => ({ id: x._id || x.id || x._id, ...x })));
    }).catch(() => {});
  }, []);

  const [form, setForm] = React.useState({ name: '', institutionId: '', password: '', location: '', contactNo: '', email: '' });

  const create = async () => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${BACKEND}/admin/institutions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify(form),
    });
    const b = await res.json().catch(() => ({}));
    if (res.ok && b.success) {
      setItems((s) => [ ...(s || []), { id: b.data.id, name: b.data.name, institutionId: b.data.institutionId } ]);
      setForm({ name: '', institutionId: '', password: '', location: '', contactNo: '', email: '' });
    } else {
      alert(b.message || 'Could not create');
    }
  };

  const remove = async (id: string) => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${BACKEND}/admin/institutions/${id}`, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' } });
    const b = await res.json().catch(() => ({}));
    if (res.ok && b.success) setItems((s) => s.filter((it) => it.id !== id));
    else alert(b.message || 'Could not delete');
  };

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-red-700 mb-4">Institution Management</h2>
        <div className="bg-white p-4 rounded shadow mb-4">
          <h3 className="font-semibold mb-2">Create Institution</h3>
          <div className="grid grid-cols-1 gap-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="border px-2 py-1" />
            <input value={form.institutionId} onChange={(e) => setForm({ ...form, institutionId: e.target.value })} placeholder="Institution ID" className="border px-2 py-1" />
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" className="border px-2 py-1" />
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="border px-2 py-1" />
            <input value={form.contactNo} onChange={(e) => setForm({ ...form, contactNo: e.target.value })} placeholder="Contact No" className="border px-2 py-1" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border px-2 py-1" />
            <div>
              <button onClick={create} className="px-3 py-1 bg-red-600 text-white rounded">Create</button>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {items.map((it) => (
            <div key={it.id} className="p-4 bg-white rounded shadow flex justify-between">
              <div>
                <div className="font-semibold">{it.name}</div>
                <div className="text-sm text-gray-600">ID: {it.institutionId}</div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => remove(it.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button onClick={() => (window.location.href = '/admin/dashboard')} className="px-4 py-2 bg-white border rounded">Back</button>
        </div>
      </div>
    </div>
  );
};

export default InstitutionManagement;
