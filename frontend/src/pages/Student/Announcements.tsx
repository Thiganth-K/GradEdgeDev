import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../../components/Student/Sidebar';
import { apiFetch } from '../../lib/api';
import { makeHeaders } from '../../lib/makeHeaders';

const StudentAnnouncements: React.FC = () => {
  const [anns, setAnns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;
  const token = typeof window !== 'undefined' ? localStorage.getItem('student_token') : null;

  useEffect(() => { load(); }, []);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch('/institution/student/announcements', {
        headers: makeHeaders('student_token')
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        // Accept multiple possible payload shapes from backend
        const list = body.data || body.anns || body.announcements || [];
        setAnns(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return anns;
    return anns.filter(a => (a.message || '').toLowerCase().includes(q));
  }, [anns, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const truncate = (s: string, n = 200) => (s && s.length > n ? s.slice(0, n) + '…' : s);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-red-600">Announcements</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                  placeholder="Search announcements..."
                  className="pl-3 pr-10 py-2 border rounded w-72 text-sm"
                />
              </div>
              <button
                onClick={load}
                className="px-3 py-1.5 text-sm border border-red-200 rounded text-red-600 hover:bg-red-50"
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-red-600 font-medium">{filtered.length} announcement{filtered.length !== 1 ? 's' : ''}</div>
              <div className="text-sm text-gray-500">Page {page + 1} of {totalPages}</div>
            </div>

            {loading && <p className="text-sm text-gray-600">Loading...</p>}

            {!loading && filtered.length === 0 && (
              <div className="py-8 text-center text-gray-600">No announcements found.</div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                {pageItems.map((a: any) => (
                  <article key={a._id} className="bg-white border rounded p-4 hover:shadow">
                    <div className="flex items-start justify-between">
                      <div className="text-sm text-gray-500">{new Date(a.createdAt).toLocaleString()}</div>
                      {a.priority && <div className="text-xs text-white bg-red-600 px-2 py-0.5 rounded">{a.priority}</div>}
                    </div>
                    <p className="mt-2 text-gray-800 leading-relaxed">{truncate(a.message || '', 300)}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-gray-400">{a.author || ''}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination controls */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >Prev</button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentAnnouncements;
