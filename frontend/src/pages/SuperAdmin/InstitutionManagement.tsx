import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/SuperAdmin/sidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaTh, FaEllipsisV } from 'react-icons/fa';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
    } catch (err) {
      alert('Failed to save institution');
      return false;
    }
  };
  const filteredItems = items.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIdx, endIdx);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Institution Management</h1>
            <p className="text-sm text-gray-500 mt-1 uppercase tracking-wide">Manage registered universities and colleges</p>
          </div>

          {/* Search and Actions Bar */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 max-w-md relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaFilter size={18} />
                </button>
                <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaTh size={18} />
                </button>
                <button
                  onClick={() => { setShowCreateModal(true); setEditingItem(null); }}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <span className="text-xl leading-none">+</span>
                  <span>ADD</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="col-span-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Institution Name</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Team</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</p>
              </div>
              <div className="col-span-1 text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</p>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {paginatedItems.map((it) => (
                <div key={it._id || it.id} className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 transition-colors">
                  <div className="col-span-3">
                    <h3 className="font-semibold text-gray-900">{it.name}</h3>
                    <p className="text-sm text-gray-500 lowercase">{it.location || 'N/A'}</p>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white">
                        A
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white">
                        B
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{it.email || 'No email'}</p>
                    <p className="text-sm text-gray-500">{it.contactNo || ''}</p>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <span className="px-3 py-1 bg-gray-800 text-white text-xs font-semibold rounded uppercase">
                      PRO
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <p className="text-sm text-gray-600">
                      {it.createdAt ? new Date(it.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '12 Jan 2024'}
                    </p>
                  </div>

                  <div className="col-span-1 flex items-center justify-end">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuFor(openMenuFor === (it._id || it.id) ? null : (it._id || it.id))}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <FaEllipsisV size={16} />
                      </button>

                      {openMenuFor === (it._id || it.id) && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
                          <button
                            onClick={() => { setEditingItem(it); setShowCreateModal(true); setOpenMenuFor(null); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { remove(it._id || it.id); setOpenMenuFor(null); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {startIdx + 1}-{Math.min(endIdx, filteredItems.length)} of {filteredItems.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
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
                  <button onClick={() => { setShowCreateModal(false); setEditingItem(null); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>
                <div className="p-6">
                  <InstitutionForm initial={editingItem} onCancel={() => { setShowCreateModal(false); setEditingItem(null); }} onSaved={() => { setShowCreateModal(false); setEditingItem(null); loadInstitutions(); }} onSave={saveInstitution} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutionManagement;
