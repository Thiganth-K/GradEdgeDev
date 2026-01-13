import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

type Contributor = { id: string; username: string; fname: string; lname: string; contact?: string; email?: string };

const ContributorManagement: React.FC = () => {
  const [list, setList] = useState<Contributor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const token = localStorage.getItem('admin_token') || '';

  const makeHeaders = (contentType = false) => {
    const h: Record<string, string> = {};
    if (contentType) h['Content-Type'] = 'application/json';
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  const fetchList = async () => {
    setMsg(null);
    try {
      const res = await apiFetch('/admin/contributors', {
        headers: makeHeaders(),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body.message || 'Failed to fetch contributors');
        return;
      }
      // Map _id to id for consistency
      const mapped = (body.data || []).map((c: any) => ({ ...c, id: c._id || c.id }));
      setList(mapped);
    } catch (err: any) {
      setMsg(err.message || 'Network error');
    }
  };

  useEffect(() => { fetchList(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      let res;
      if (editingId) {
        res = await apiFetch(`/admin/contributors/${editingId}`, {
          method: 'PUT',
          headers: makeHeaders(true),
          body: JSON.stringify({ username, fname, lname, contact, email, password: password || undefined }),
        });
      } else {
        res = await apiFetch('/admin/contributors', {
          method: 'POST',
          headers: makeHeaders(true),
          body: JSON.stringify({ username, password, fname, lname, contact, email }),
        });
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body.message || (editingId ? 'Failed to update contributor' : 'Failed to create contributor'));
        return;
      }
      setMsg(editingId ? 'Contributor updated' : 'Contributor created');
      setUsername(''); setPassword(''); setFname(''); setLname(''); setContact(''); setEmail('');
      setEditingId(null);
      fetchList();
    } catch (err: any) {
      setMsg(err.message || 'Network error');
    }
  };

  const onEdit = (c: Contributor) => {
    setEditingId(c.id);
    setUsername(c.username);
    setFname(c.fname || '');
    setLname(c.lname || '');
    setContact(c.contact || '');
    setEmail(c.email || '');
    setPassword('');
    setMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setUsername('');
    setPassword('');
    setFname('');
    setLname('');
    setContact('');
    setEmail('');
    setMsg(null);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this contributor?')) return;
    setMsg(null);
    try {
      const res = await apiFetch(`/admin/contributors/${id}`, { method: 'DELETE', headers: makeHeaders() });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(body.message || 'Delete failed'); return; }
      setMsg('Contributor deleted successfully');
      fetchList();
    } catch (err: any) {
      setMsg(err.message || 'Network error');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Contributor Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2 text-lg">
            {editingId ? '✏️ Edit Contributor' : '➕ Create Contributor'}
          </h3>
          {msg && (
            <div className={`text-sm mb-2 p-2 rounded ${
              msg.includes('error') || msg.includes('Failed') || msg.includes('failed') 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {msg}
            </div>
          )}
          <form onSubmit={submit} className="space-y-2">
            <input 
              placeholder="Username" 
              value={username} 
              onChange={(e)=>setUsername(e.target.value)} 
              className="w-full border p-2 rounded" 
              required
            />
            <input 
              placeholder={editingId ? "Password (leave blank to keep unchanged)" : "Password"} 
              type="password" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              className="w-full border p-2 rounded"
              required={!editingId}
            />
            <div className="flex gap-2">
              <input 
                placeholder="First name" 
                value={fname} 
                onChange={(e)=>setFname(e.target.value)} 
                className="flex-1 border p-2 rounded" 
                required 
              />
              <input 
                placeholder="Last name" 
                value={lname} 
                onChange={(e)=>setLname(e.target.value)} 
                className="flex-1 border p-2 rounded" 
                required 
              />
            </div>
            <input 
              placeholder="Contact" 
              value={contact} 
              onChange={(e)=>setContact(e.target.value)} 
              className="w-full border p-2 rounded" 
            />
            <input 
              placeholder="Email" 
              value={email} 
              onChange={(e)=>setEmail(e.target.value)} 
              className="w-full border p-2 rounded" 
              type="email" 
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                {editingId ? 'Update' : 'Create'}
              </button>
              {editingId && (
                <button type="button" onClick={onCancelEdit} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Existing Contributors</h3>
          <div className="space-y-2">
            {list.length === 0 && <div className="text-sm text-gray-600">No contributors found</div>}
            {list.map(c => (
              <div key={c.id} className="border rounded p-2 flex justify-between items-center">
                <div>
                  <div className="font-medium">{c.fname} {c.lname} ({c.username})</div>
                  <div className="text-xs text-gray-600">{c.email || 'no email'} • {c.contact || 'no contact'}</div>
                </div>
                <div className="space-x-2">
                  <button onClick={() => onEdit(c)} className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500">Edit</button>
                  <button onClick={() => onDelete(c.id)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributorManagement;
