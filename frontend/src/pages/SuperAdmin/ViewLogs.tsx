import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/SuperAdmin/sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const roles = ['All', 'SuperAdmin', 'Admin', 'Institution', 'Faculty', 'Student', 'Contributor'] as const;

type Log = { id?: string; time: string; message?: string; url?: string; method?: string; roleGroup?: string; status?: number };

const ViewLogs: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
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
    const roleLocal = localStorage.getItem('gradedge_role');
    if (roleLocal !== 'SuperAdmin') {
      window.location.href = '/login';
      return;
    }
    load('All');
  }, []);

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-gray-50 p-8">
        <main className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">View Logs</h2>
            <p className="text-gray-600">This section provides recent system logs.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-sm text-gray-600 mb-4">Under development — log viewer coming soon.</div>
            <div className="space-y-3">
              {logs.map((l) => (
                <div key={l.id || l.time} className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">{new Date(l.time).toLocaleString()}</div>
                  <div className="font-medium">{l.message}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ViewLogs;
