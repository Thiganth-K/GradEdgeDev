import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Student/Sidebar';
import { apiFetch } from '../../lib/api';
import { makeHeaders } from '../../lib/makeHeaders';

const StudentAnnouncements: React.FC = () => {
  const [anns, setAnns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Announcements</h2>
            <button
              onClick={load}
              className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <div className="bg-white p-4 rounded shadow">
            {loading && <p className="text-sm text-gray-600">Loading...</p>}
            {!loading && anns.length === 0 && (
              <p className="text-sm text-gray-600">No announcements</p>
            )}
            {!loading && anns.length > 0 && (
              <ul className="divide-y">
                {anns.map((a: any) => (
                  <li key={a._id} className="py-3">
                    <div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</div>
                    <p className="mt-1 text-sm leading-relaxed">{a.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentAnnouncements;
