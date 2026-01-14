import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/SuperAdmin/sidebar'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ViewLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'SuperAdmin') {
      window.location.href = '/login';
      return;
    }

    fetch(`${BACKEND}/superadmin/logs`).then((r) => r.json()).then((b) => {
      if (b.success) setLogs(b.data || []);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-6xl mx-auto flex">
        <Sidebar />
        <main className="flex-1">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-red-700">View Logs</h2>
            <div className="mt-2 text-sm text-gray-600">This section provides recent system logs.</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-sm text-gray-600 mb-4">Under development — log viewer coming soon.</div>
            <div className="space-y-3">
              {logs.map((l) => (
                <div key={l.id} className="p-3 bg-gray-50 rounded">
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
