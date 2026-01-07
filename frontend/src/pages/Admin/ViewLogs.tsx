import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ViewLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'admin') {
      window.location.href = '/login';
      return;
    }

    fetch(`${BACKEND}/admin/logs`).then((r) => r.json()).then((b) => {
      if (b.success) setLogs(b.data || []);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-red-700 mb-4">View Logs</h2>
        <div className="space-y-3">
          {logs.map((l) => (
            <div key={l.id} className="p-3 bg-white rounded shadow">
              <div className="text-sm text-gray-500">{new Date(l.time).toLocaleString()}</div>
              <div className="font-medium">{l.message}</div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button onClick={() => (window.location.href = '/admin/dashboard')} className="px-4 py-2 bg-white border rounded">Back</button>
        </div>
      </div>
    </div>
  );
};

export default ViewLogs;
