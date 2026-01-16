import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/SuperAdmin/sidebar'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const roles = ['All', 'SuperAdmin', 'Admin', 'Institution', 'Faculty', 'Student', 'Contributor'] as const;

const ViewLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [role, setRole] = useState<(typeof roles)[number]>('All');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const load = async (r: (typeof roles)[number]) => {
    setLoading(true);
    const q = r === 'All' ? '' : `?role=${encodeURIComponent(r)}`;
    try {
      const res = await fetch(`${BACKEND}/superadmin/logs${q}`);
      const b = await res.json().catch(() => ({}));
      if (b.success) setLogs(b.data || []);
    } catch (_) {}
    setPage(0);
    setLoading(false);
  };

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'SuperAdmin') {
      window.location.href = '/login';
      return;
    }
    load('All');
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-50 p-8">
        <main className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">System Logs</h2>
              <p className="text-gray-600">Controller actions across all roles</p>
            </div>
            <div>
              <select className="border rounded px-3 py-2" value={role} onChange={(e) => { const val = e.target.value as (typeof roles)[number]; setRole(val); load(val); }}>
                {roles.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b">
              <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase">Time</div>
              <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Role</div>
              <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Method</div>
              <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase">URL</div>
              <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase text-right">Status</div>
            </div>

            <div className="divide-y">
              {loading && (<div className="p-6 text-sm text-gray-500">Loading...</div>)}
              {!loading && logs.length === 0 && (<div className="p-6 text-sm text-gray-500">No logs.</div>)}
              {logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((l, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4">
                  <div className="col-span-3 text-sm text-gray-800">{new Date(l.time).toLocaleString()}</div>
                  <div className="col-span-2 text-sm"><span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{l.roleGroup || 'Unknown'}</span></div>
                  <div className="col-span-2 text-sm text-gray-700">{l.method}</div>
                  <div className="col-span-3 text-sm text-gray-700 truncate" title={l.url}>{l.url}</div>
                  <div className="col-span-2 text-sm text-right"><span className={`inline-block px-2 py-1 rounded-full text-xs ${l.status >= 200 && l.status < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{l.status}</span></div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {Math.min(page * PAGE_SIZE + 1, logs.length === 0 ? 0 : logs.length)} - {Math.min((page + 1) * PAGE_SIZE, logs.length)} of {logs.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={`px-3 py-1 rounded ${page === 0 ? 'bg-gray-100 text-gray-400' : 'bg-white border'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * PAGE_SIZE >= logs.length}
                  className={`px-3 py-1 rounded ${(page + 1) * PAGE_SIZE >= logs.length ? 'bg-gray-100 text-gray-400' : 'bg-white border'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ViewLogs;
