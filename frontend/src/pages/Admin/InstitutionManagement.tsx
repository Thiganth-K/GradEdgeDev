import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const InstitutionManagement: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[InstitutionManagement] COMPONENT MOUNTED');
    const role = localStorage.getItem('gradedge_role');
    console.log('[InstitutionManagement] role from localStorage:', role);
    
    if (role !== 'admin') {
      console.log('[InstitutionManagement] role is not admin, redirecting to login');
      window.location.href = '/login';
      return;
    }

    console.log('[InstitutionManagement] role check passed, fetching institutions...');
    const token = localStorage.getItem('admin_token');
    console.log('[InstitutionManagement] admin_token localStorage:', token);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${BACKEND}/admin/institutions`, { headers })
      .then((r) => {
        console.log('[InstitutionManagement] fetch response status:', r.status);
        return r.json();
      })
      .then((b) => {
        console.log('[InstitutionManagement] fetch response body:', b);
        if (b.success) {
          setItems((b.data || []).map((x: any) => ({ id: x._id || x.id || x._id, ...x })));
          setLoading(false);
        } else {
          setError(b.message || 'Failed to load institutions');
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[InstitutionManagement] fetch error:', err);
        setError(err.message || 'Network error');
        setLoading(false);
      });
  }, []);

  const [form, setForm] = React.useState({ name: '', institutionId: '', password: '', location: '', contactNo: '', email: '', facultyLimit: '', studentLimit: '', batchLimit: '', testLimit: '' });

  const create = async () => {
    const token = localStorage.getItem('admin_token');
    // prepare payload; empty limit inputs will be omitted (backend treats missing as unlimited/null)
    const payload: any = { ...form };
    ['facultyLimit','studentLimit','batchLimit','testLimit'].forEach((k) => { if (payload[k] === '') delete payload[k]; });

    const postHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) postHeaders.Authorization = `Bearer ${token}`;

    const res = await fetch(`${BACKEND}/admin/institutions`, {
      method: 'POST',
      headers: postHeaders,
      body: JSON.stringify(payload),
    });
    const b = await res.json().catch(() => ({}));
    if (res.ok && b.success) {
      setItems((s) => [ ...(s || []), { id: b.data.id, name: b.data.name, institutionId: b.data.institutionId, facultyLimit: b.data.facultyLimit ?? null, studentLimit: b.data.studentLimit ?? null, batchLimit: b.data.batchLimit ?? null, testLimit: b.data.testLimit ?? null } ]);
      setForm({ name: '', institutionId: '', password: '', location: '', contactNo: '', email: '', facultyLimit: '', studentLimit: '', batchLimit: '', testLimit: '' });
    } else {
      alert(b.message || 'Could not create');
    }
  };

  const remove = async (id: string) => {
    const token = localStorage.getItem('admin_token');
  console.log('[InstitutionManagement] RENDERING - items:', items.length, 'loading:', loading, 'error:', error);

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Institution Management</h2>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Institution Management</h2>
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

    const delHeaders: Record<string, string> = {};
    if (token) delHeaders.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BACKEND}/admin/institutions/${id}`, { method: 'DELETE', headers: delHeaders });
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
            <div className="grid grid-cols-2 gap-2">
              <input value={form.facultyLimit} onChange={(e) => setForm({ ...form, facultyLimit: e.target.value })} placeholder="Faculty limit (empty = unlimited)" className="border px-2 py-1" />
              <input value={form.studentLimit} onChange={(e) => setForm({ ...form, studentLimit: e.target.value })} placeholder="Student limit (empty = unlimited)" className="border px-2 py-1" />
              <input value={form.batchLimit} onChange={(e) => setForm({ ...form, batchLimit: e.target.value })} placeholder="Batch limit (empty = unlimited)" className="border px-2 py-1" />
              <input value={form.testLimit} onChange={(e) => setForm({ ...form, testLimit: e.target.value })} placeholder="Test limit (empty = unlimited)" className="border px-2 py-1" />
            </div>
            <div>
              <button onClick={create} className="px-3 py-1 bg-red-600 text-white rounded">Create</button>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {items.map((it) => (
            <InstitutionItem key={it.id} item={it} onDelete={remove} onUpdated={(u) => setItems((s) => s.map((x) => x.id === u.id ? { ...x, ...u } : x))} />
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

const InstitutionItem: React.FC<{ item: any; onDelete: (id: string) => void; onUpdated: (u: any) => void }> = ({ item, onDelete, onUpdated }) => {
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({ name: item.name || '', facultyLimit: item.facultyLimit ?? '', studentLimit: item.studentLimit ?? '', batchLimit: item.batchLimit ?? '', testLimit: item.testLimit ?? '' });

  const save = async () => {
    const token = localStorage.getItem('admin_token');
    const payload: any = { name: form.name };
    const f: any = form;
    ['facultyLimit','studentLimit','batchLimit','testLimit'].forEach((k) => {
      const v = f[k];
      payload[k] = (v !== '' && v !== null && v !== undefined) ? v : null;
    });
    const putHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) putHeaders.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BACKEND}/admin/institutions/${item.id}`, { method: 'PUT', headers: putHeaders, body: JSON.stringify(payload) });
    const b = await res.json().catch(() => ({}));
    if (res.ok && b.success) {
      onUpdated(b.data || {});
      setEditing(false);
    } else {
      alert(b.message || 'Failed to update');
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow flex justify-between">
      <div style={{ flex: 1 }}>
        {editing ? (
          <div className="space-y-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border px-2 py-1 w-full" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.facultyLimit ?? ''} onChange={(e) => setForm({ ...form, facultyLimit: e.target.value })} placeholder="Faculty limit" className="border px-2 py-1" />
              <input value={form.studentLimit ?? ''} onChange={(e) => setForm({ ...form, studentLimit: e.target.value })} placeholder="Student limit" className="border px-2 py-1" />
              <input value={form.batchLimit ?? ''} onChange={(e) => setForm({ ...form, batchLimit: e.target.value })} placeholder="Batch limit" className="border px-2 py-1" />
              <input value={form.testLimit ?? ''} onChange={(e) => setForm({ ...form, testLimit: e.target.value })} placeholder="Test limit" className="border px-2 py-1" />
            </div>
          </div>
        ) : (
          <div>
            <div className="font-semibold">{item.name}</div>
            <div className="text-sm text-gray-600">ID: {item.institutionId}</div>
            <div className="text-sm text-gray-600 mt-1">Limits: Faculty: {item.facultyLimit ?? 'Unlimited'}, Students: {item.studentLimit ?? 'Unlimited'}, Batches: {item.batchLimit ?? 'Unlimited'}, Tests: {item.testLimit ?? 'Unlimited'}</div>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2 ml-4">
        {editing ? (
          <>
            <button onClick={save} className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
            <button onClick={() => { setEditing(false); setForm({ name: item.name || '', facultyLimit: item.facultyLimit ?? '', studentLimit: item.studentLimit ?? '', batchLimit: item.batchLimit ?? '', testLimit: item.testLimit ?? '' }); }} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
          </>
        ) : (
          <>
            <Link to={`/admin/institution/${item.id}/chat`} className="px-3 py-1 bg-indigo-600 text-white rounded">Chat</Link>
            <button onClick={() => setEditing(true)} className="px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
            <button onClick={() => onDelete(item.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
          </>
        )}
      </div>
    </div>
  );
};
