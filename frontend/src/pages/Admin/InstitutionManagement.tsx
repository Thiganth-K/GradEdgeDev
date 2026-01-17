import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Admin/Sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface Institution {
  id: string;
  name: string;
  institutionId: string;
  location?: string;
  contactNo?: string;
  email?: string;
  facultyLimit: number | null;
  studentLimit: number | null;
  batchLimit: number | null;
  testLimit: number | null;
}

interface EditModalProps {
  item: Institution;
  onClose: () => void;
  onSave: (updated: Institution) => void;
}

const EditModal: React.FC<EditModalProps> = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: item.name || '',
    location: item.location || '',
    contactNo: item.contactNo || '',
    email: item.email || '',
    password: '',
    facultyLimit: item.facultyLimit?.toString() || '',
    studentLimit: item.studentLimit?.toString() || '',
    batchLimit: item.batchLimit?.toString() || '',
    testLimit: item.testLimit?.toString() || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('admin_token');
    const payload: any = { 
      name: form.name,
      location: form.location,
      contactNo: form.contactNo,
      email: form.email,
    };
    if ((form as any).password && (form as any).password.trim() !== '') {
      payload.password = (form as any).password;
    }
    
    ['facultyLimit', 'studentLimit', 'batchLimit', 'testLimit'].forEach((k) => {
      const v = (form as any)[k];
      payload[k] = (v !== '' && v !== null && v !== undefined) ? Number(v) : null;
    });

    const putHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) putHeaders.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${BACKEND}/admin/institutions/${item.id}`, {
        method: 'PUT',
        headers: putHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        onSave({ ...item, ...payload });
        onClose();
      } else {
        alert(data.message || 'Failed to update');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Edit Institution</h2>
              <p className="text-red-100 text-sm">Update institution details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="p-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Institution Name</label>
              <input value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full border px-3 py-2 rounded" required />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Institution ID</label>
              <input value={item.institutionId} disabled className="w-full border px-3 py-2 rounded bg-gray-50 text-gray-700 cursor-not-allowed" />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Password</label>
              <input type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input value={form.location} onChange={(e)=>setForm({...form, location: e.target.value})} className="w-full border px-3 py-2 rounded" />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Contact Number</label>
              <input value={form.contactNo} onChange={(e)=>setForm({...form, contactNo: e.target.value})} className="w-full border px-3 py-2 rounded" />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Email Address</label>
              <input type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Faculty Limit</label>
              <input type="number" value={form.facultyLimit} onChange={(e)=>setForm({...form, facultyLimit: e.target.value})} className="w-full border px-3 py-2 rounded" />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Student Limit</label>
              <input type="number" value={form.studentLimit} onChange={(e)=>setForm({...form, studentLimit: e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg">{saving ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" onClick={onClose} className="px-6 py-3 border rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InstitutionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Institution | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const remove = async (id: string) => {
    const token = localStorage.getItem('admin_token');
    const delHeaders: Record<string, string> = {};
    if (token) delHeaders.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BACKEND}/admin/institutions/${id}`, { method: 'DELETE', headers: delHeaders });
    const b = await res.json().catch(() => ({}));
    if (res.ok && b.success) setItems((s) => s.filter((it) => it.id !== id));
    else alert(b.message || 'Could not delete');
  };

  console.log('[InstitutionManagement] RENDERING - items:', items.length, 'loading:', loading, 'error:', error);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Institutional Management</h1>
          </div>
          <p className="text-gray-600 mb-8">Loading institutions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Institutional Management</h1>
          </div>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {editingItem && (
        <EditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(updated) => {
            setItems((s) => s.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
            setEditingItem(null);
          }}
        />
      )}
      {showCreateModal && (
        <CreateInstitutionModal onClose={() => setShowCreateModal(false)} onCreated={(newItem) => { setItems((s) => [newItem, ...s]); setShowCreateModal(false); }} />
      )}
      
      <div className="flex-1 h-screen overflow-y-auto bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Institutional Management</h1>
          </div>
          <p className="text-gray-600">Oversee the operational integrity of regional universities.</p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Institutions Yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first institution</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Create First Institution
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            {/* Table Header */}
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

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {items.map((it) => (
                <div key={it.id} className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 transition-colors relative">
                  {/* Institution Info */}
                  <div className="col-span-3">
                    <h3 className="font-semibold text-gray-900 mb-0.5">{it.name}</h3>
                    <p className="text-sm text-gray-500 uppercase">{it.location || 'N/A'}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="col-span-3">
                    <p className="font-medium text-gray-900 mb-0.5">{it.contactNo || 'Not available'}</p>
                    <p className="text-sm text-gray-500">{it.email || 'No email'}</p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ACTIVE
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-4 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingItem(it)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === it.id ? null : it.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="More options"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {menuOpen === it.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setMenuOpen(null)}
                          ></div>
                          <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                            <Link
                              to={`/admin/institution/${it.id}/chat`}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                              onClick={() => setMenuOpen(null)}
                            >
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span>Chat</span>
                            </Link>
                            <button
                              onClick={() => {
                                setMenuOpen(null);
                                if (window.confirm(`Are you sure you want to delete "${it.name}"? This action cannot be undone.`)) {
                                  remove(it.id);
                                }
                              }}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                            >
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        {items.length > 0 && (
          <button
            onClick={() => setShowCreateModal(true)}
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

const CreateInstitutionModal: React.FC<{ onClose: () => void; onCreated: (newItem: any) => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '',
    institutionId: '',
    password: '',
    location: '',
    contactNo: '',
    email: '',
    facultyLimit: '',
    studentLimit: '',
    batchLimit: '',
    testLimit: '',
  });
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('admin_token');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { ...form };
      ['facultyLimit', 'studentLimit', 'batchLimit', 'testLimit'].forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${BACKEND}/admin/institutions`, { method: 'POST', headers, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(body.message || 'Failed to create institution');
        setLoading(false);
        return;
      }
      onCreated({ id: body.data?.id || body.data?._id || (Math.random()+''), ...body.data });
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Create Institution</h2>
              <p className="text-red-100 text-sm">Add a new institution</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Institution Name</label>
              <input value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full border px-3 py-2 rounded" required />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Institution ID</label>
              <input value={form.institutionId} onChange={(e)=>setForm({...form, institutionId: e.target.value})} className="w-full border px-3 py-2 rounded" required />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Password</label>
              <input type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input value={form.location} onChange={(e)=>setForm({...form, location: e.target.value})} className="w-full border px-3 py-2 rounded" />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Contact Number</label>
              <input value={form.contactNo} onChange={(e)=>setForm({...form, contactNo: e.target.value})} className="w-full border px-3 py-2 rounded" />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Email</label>
              <input type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Faculty Limit</label>
              <input type="number" value={form.facultyLimit} onChange={(e)=>setForm({...form, facultyLimit: e.target.value})} className="w-full border px-3 py-2 rounded" />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Student Limit</label>
              <input type="number" value={form.studentLimit} onChange={(e)=>setForm({...form, studentLimit: e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg">{loading ? 'Creating...' : 'Create Institution'}</button>
            <button type="button" onClick={onClose} className="px-6 py-3 border rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
