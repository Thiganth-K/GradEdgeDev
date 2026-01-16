import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/SuperAdmin/sidebar';
import { useLocation, useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const InstitutionForm: React.FC<{ initial?: any; onCancel: () => void; onSaved: () => void; onSave: (data: any, id?: string) => Promise<boolean> }> = ({ initial, onCancel, onSaved, onSave }) => {
  const [name, setName] = useState(initial?.name || '');
  const [location, setLocation] = useState(initial?.location || '');
  const [contactNo, setContactNo] = useState(initial?.contactNo || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) { alert('Name is required'); return; }
    setSaving(true);
    const ok = await onSave({ name, location, contactNo, email }, initial?._id || initial?.id);
    setSaving(false);
    if (ok) onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 block w-full border border-gray-200 px-3 py-2 rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input value={location} onChange={(e)=>setLocation(e.target.value)} className="mt-1 block w-full border border-gray-200 px-3 py-2 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact No</label>
          <input value={contactNo} onChange={(e)=>setContactNo(e.target.value)} className="mt-1 block w-full border border-gray-200 px-3 py-2 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 block w-full border border-gray-200 px-3 py-2 rounded-lg" />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded-lg">{saving ? 'Saving...' : (initial ? 'Save Changes' : 'Create Institution')}</button>
      </div>
    </form>
  );
};

const InstitutionManagement: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search);

  const selectedId = query.get('id');

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'SuperAdmin') {
      window.location.href = '/login';
      return;
    }

    fetch(`${BACKEND}/superadmin/institutions`).then((r) => r.json()).then((b) => {
      if (b.success) setItems(b.data || []);
    }).catch(() => {});
  }, []);

  // helper to refresh list from other actions
  const loadInstitutions = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${BACKEND}/superadmin/institutions`, { headers });
      const b = await res.json().catch(() => ({}));
      if (res.ok && b.success) setItems(b.data || []);
    } catch (err) {}
  };

  const selected = items.find((it) => (it._id || it.id) === selectedId) || null;

  const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;

  const remove = async (id: string) => {
    if (!confirm('Delete this institution?')) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${BACKEND}/superadmin/institutions/${id}`, { method: 'DELETE', headers });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) { alert(b.message || 'Failed to delete'); return; }
      setItems((prev) => prev.filter((it) => (it._id || it.id) !== id));
    } catch (err) {
      alert('Network error');
    }
  };

  const saveInstitution = async (data: any, id?: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = id ? `${BACKEND}/superadmin/institutions/${id}` : `${BACKEND}/superadmin/institutions`;
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(data) });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) { alert(b.message || 'Failed to save'); return false; }
      // refresh list
      const updated = await fetch(`${BACKEND}/superadmin/institutions`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const ub = await updated.json().catch(()=>({}));
      if (updated.ok && ub.success) setItems(ub.data || []);
      return true;
    } catch (err) { alert('Network error'); return false; }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 bg-red-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-red-700">Institution Management</h2>
              <div className="mt-1 text-sm text-gray-600">Manage institutions created by admins</div>
            </div>
            <div>
              <button onClick={() => navigate('/superadmin/dashboard')} className="px-4 py-2 bg-white border rounded">Back</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="col-span-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Institution</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
              </div>
              <div className="col-span-4 text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button onClick={() => (window.location.href = '/superadmin/dashboard')} className="px-4 py-2 bg-white border rounded">Back</button>


            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {items.map((it) => (
                <div key={it._id || it.id} className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 transition-colors relative">
                  <div className="col-span-3">
                    <h3 className="font-semibold text-gray-900 mb-0.5">{it.name}</h3>
                    <p className="text-sm text-gray-500 uppercase">{it.location || 'N/A'}</p>
                  </div>

                  <div className="col-span-3">
                    <p className="font-medium text-gray-900 mb-0.5">{it.contactNo || 'Not available'}</p>
                    <p className="text-sm text-gray-500">{it.email || 'No email'}</p>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ACTIVE
                    </span>
                  </div>

                  <div className="col-span-4 flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setEditingItem(it); setShowCreateModal(true); }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuFor(openMenuFor === (it._id || it.id) ? null : (it._id || it.id))}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="More options"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {openMenuFor === (it._id || it.id) && (
                        <div className="absolute right-0 mt-2 w-36 bg-white border rounded shadow-lg z-50">
                          <button onClick={() => { remove(it._id || it.id); setOpenMenuFor(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create / Edit Modal */}
          {(showCreateModal || editingItem) && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl ring-1 ring-gray-100 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b">
                  <div>
                    <h3 className="text-lg font-semibold">{editingItem ? 'Edit Institution' : 'Add Institution'}</h3>
                    <p className="text-sm text-gray-500">{editingItem ? 'Update institution details' : 'Fill the details to add a new institution'}</p>
                  </div>
                  <div>
                    <button onClick={() => { setShowCreateModal(false); setEditingItem(null); }} className="text-gray-500">✕</button>
                  </div>
                </div>
                <div className="p-6">
                  <InstitutionForm initial={editingItem} onCancel={() => { setShowCreateModal(false); setEditingItem(null); }} onSaved={() => { setShowCreateModal(false); setEditingItem(null); loadInstitutions(); }} onSave={saveInstitution} />
                </div>
              </div>
            </div>
          )}

          {/* Floating Action Button */}
          {items.length >= 0 && (
            <button
              onClick={() => { setShowCreateModal(true); setEditingItem(null); }}
              className="fixed bottom-8 right-8 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 py-4 rounded-full shadow-2xl transition-all flex items-center gap-2 hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Institution</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default InstitutionManagement;
