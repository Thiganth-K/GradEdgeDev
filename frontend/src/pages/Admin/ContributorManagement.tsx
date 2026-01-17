import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Admin/Sidebar';

type Contributor = { id: string; username: string; fname: string; lname: string; contact?: string; email?: string };

const ContributorManagement: React.FC = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<Contributor[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);


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

  const onDelete = async (id: string) => {
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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 h-screen overflow-y-auto bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Contributor Management</h1>
          </div>
          <p className="text-gray-600">Manage content contributors and their access.</p>
        </div>

        {/* Success/Error Message */}
        {msg && (
          <div className={`mb-6 text-sm p-4 rounded-lg ${
            msg.includes('error') || msg.includes('Failed') || msg.includes('failed') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {msg}
          </div>
        )}

        {/* Table Section */}
        {list.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Contributors Yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first contributor</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Create First Contributor
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="col-span-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contributor</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</p>
              </div>
              <div className="col-span-3 text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</p>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {list.map((c) => (
                <div key={c.id} className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 transition-colors relative">
                  {/* Contributor Info */}
                  <div className="col-span-4">
                    <h3 className="font-semibold text-gray-900 mb-0.5">{c.fname} {c.lname}</h3>
                    <p className="text-sm text-gray-500">{c.email || 'No email provided'}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="col-span-3 flex items-center">
                    <p className="text-sm text-gray-700">{c.contact || 'Not available'}</p>
                  </div>

                  {/* Username */}
                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      @{c.username}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingContributor(c)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="More options"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {menuOpen === c.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setMenuOpen(null)}
                          ></div>
                          <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                            <button
                              onClick={() => {
                                setMenuOpen(null);
                                if (window.confirm(`Are you sure you want to delete "${c.fname} ${c.lname}"?`)) {
                                  onDelete(c.id);
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
        {list.length > 0 && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 py-4 rounded-full shadow-2xl transition-all flex items-center gap-2 hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Contributor</span>
          </button>
        )}

        {/* Create Contributor Modal */}
        {showCreateModal && (
          <CreateContributorModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => { setShowCreateModal(false); fetchList(); }}
          />
        )}

        {editingContributor && (
          <CreateContributorModal
            initial={editingContributor}
            onClose={() => setEditingContributor(null)}
            onUpdated={() => { setEditingContributor(null); fetchList(); }}
          />
        )}
        </div>
      </div>
    </div>
  );
};
 
export default ContributorManagement;

// Inline modal component for creating a contributor
const CreateContributorModal: React.FC<{ onClose: () => void; onCreated?: () => void; initial?: Contributor; onUpdated?: () => void }> = ({ onClose, onCreated, initial, onUpdated }) => {
  const [username, setUsername] = useState(initial?.username || '');
  const [password, setPassword] = useState('');
  const [fname, setFname] = useState(initial?.fname || '');
  const [lname, setLname] = useState(initial?.lname || '');
  const [contact, setContact] = useState(initial?.contact || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('admin_token') || '';
  const makeHeadersLocal = (contentType = false) => {
    const h: Record<string, string> = {};
    if (contentType) h['Content-Type'] = 'application/json';
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  const handleCreateOrUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!username || !fname || !lname) {
      setError('Please fill required fields');
      return;
    }
    if (!initial && !password) {
      setError('Password is required for new contributor');
      return;
    }
    setLoading(true);
    try {
      if (initial) {
        // update
        const res = await apiFetch(`/admin/contributors/${initial.id}`, {
          method: 'PUT',
          headers: makeHeadersLocal(true),
          body: JSON.stringify({ username, fname, lname, contact, email, password: password || undefined }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(body.message || 'Failed to update contributor');
          setLoading(false);
          return;
        }
        onUpdated && onUpdated();
      } else {
        // create
        const res = await apiFetch('/admin/contributors', {
          method: 'POST',
          headers: makeHeadersLocal(true),
          body: JSON.stringify({ username, password, fname, lname, contact, email }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(body.message || 'Failed to create contributor');
          setLoading(false);
          return;
        }
        onCreated && onCreated();
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      setLoading(false);
      return;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">{initial ? 'Edit Contributor' : 'Create Contributor'}</h2>
              <p className="text-red-100 text-sm">{initial ? 'Update contributor details' : 'Add a new content contributor'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreateOrUpdate} className="p-6">
          {error && <div className="mb-4 text-sm p-3 rounded bg-red-50 text-red-700 border border-red-100">{error}</div>}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
              <input value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full border px-3 py-2 rounded" required />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Password {initial ? <span className="text-xs text-gray-500">(leave blank to keep)</span> : <span className="text-red-500">*</span>}</label>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" {...(initial ? {} : { required: true })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
              <input value={fname} onChange={(e)=>setFname(e.target.value)} className="w-full border px-3 py-2 rounded" required />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Last Name <span className="text-red-500">*</span></label>
              <input value={lname} onChange={(e)=>setLname(e.target.value)} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact</label>
              <input value={contact} onChange={(e)=>setContact(e.target.value)} className="w-full border px-3 py-2 rounded" />
              <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">Email</label>
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg">
              {loading ? (initial ? 'Updating...' : 'Creating...') : (initial ? 'Update Contributor' : 'Create Contributor')}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 border rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
