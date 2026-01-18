import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import makeHeaders from '../../lib/makeHeaders';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Admin/Sidebar';

type Contributor = { id: string; username: string; fname: string; lname: string; contact?: string; email?: string; questionCount?: number };

const ContributorManagement: React.FC = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<Contributor[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const token = (typeof window !== 'undefined') ? (localStorage.getItem('admin_token') || localStorage.getItem('superadmin_token')) : '';

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
    if (!confirm('Delete this contributor?')) return;
    try {
      const res = await apiFetch(`/admin/contributors/${id}`, { method: 'DELETE', headers: makeHeaders('admin_token','application/json') });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body.message || 'Failed to delete contributor');
        return;
      }
      setList((prev) => prev.filter((c) => c.id !== id));
      setMsg('Contributor deleted');
    } catch (err: any) {
      setMsg(err.message || 'Network error');
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#0d0d0d] rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Contributor Management</h1>
          </div>
          <p className="text-gray-600">Manage content contributors and track their question contributions.</p>
        </div>

        {/* Success/Error Message */}
        {msg && (
          <div className={`mb-6 text-sm p-4 rounded-2xl shadow-lg ${
            msg.includes('error') || msg.includes('Failed') || msg.includes('failed') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {msg}
          </div>
        )}

        {/* Table Section */}
        {list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Contributors Yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first contributor</p>
            <button
              onClick={() => navigate('/admin/contributors/create')}
              className="bg-[#0d0d0d] hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-xl transition-colors shadow-lg"
            >
              Create First Contributor
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-visible">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-6 py-4 bg-[#0d0d0d] text-white">
              <div className="col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wider">Contributor</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider">Contact</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider">Username</p>
              </div>
              <div className="col-span-2 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider">Questions</p>
              </div>
              <div className="col-span-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-wider">Actions</p>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {list.map((c) => (
                <div key={c.id} className="grid grid-cols-12 gap-3 px-6 py-5 hover:bg-gray-50 transition-colors relative">
                  {/* Contributor Info */}
                  <div className="col-span-3">
                    <h3 className="font-semibold text-gray-900 mb-0.5">{c.fname} {c.lname}</h3>
                    <p className="text-sm text-gray-500">{c.email || 'No email provided'}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="col-span-2 flex items-center">
                    <p className="text-sm text-gray-700">{c.contact || 'Not available'}</p>
                  </div>

                  {/* Username */}
                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                      @{c.username}
                    </span>
                  </div>

                  {/* Questions Count */}
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{c.questionCount ?? 0}</p>
                      <p className="text-xs text-gray-500">questions</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/admin/contributors/edit/${c.id}`)}
                      className="px-4 py-2 bg-[#0d0d0d] hover:bg-gray-800 text-white rounded-lg transition-colors font-medium text-sm shadow-md"
                      title="Edit"
                    >
                      Edit
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${c.fname} ${c.lname}"?`)) {
                          onDelete(c.id);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm shadow-md"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        {list.length > 0 && (
          <button
            onClick={() => navigate('/admin/contributors/create')}
            className="fixed bottom-8 right-8 bg-[#0d0d0d] hover:bg-gray-800 text-white font-semibold px-6 py-4 rounded-2xl shadow-2xl transition-all flex items-center gap-2 hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Contributor</span>
          </button>
        )}
        </div>
      </div>
    </div>
  );
};

export default ContributorManagement;
