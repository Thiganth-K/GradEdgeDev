import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/SuperAdmin/sidebar';
import SuperAdminTable, {type  Column, StatusBadge, PriorityBadge } from '../../components/SuperAdmin/SuperAdminTable';
import SuperAdminPageHeader from '../../components/SuperAdmin/SuperAdminPageHeader';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';
<<<<<<< Updated upstream

const ViewLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
=======

interface Log {
    id: string; // Artificial ID for table
    method: string;
    url: string;
    status: number;
    time: string;
    roleGroup?: string;
}

const ViewLogs: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
>>>>>>> Stashed changes

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'SuperAdmin') {
      window.location.href = '/login';
      return;
    }
<<<<<<< Updated upstream

    fetch(`${BACKEND}/superadmin/logs`).then((r) => r.json()).then((b) => {
      if (b.success) setLogs(b.data || []);
    }).catch(() => {});
=======
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND}/superadmin/logs`);
        const b = await res.json().catch(() => ({}));
        if (b.success) {
            setLogs((b.data || []).map((l: any, i: number) => ({...l, id: i.toString()})));
        }
      } catch (_) {}
      setLoading(false);
    };
    load();
>>>>>>> Stashed changes
  }, []);

  const columns: Column<Log>[] = [
    {
        header: 'Endpoint',
        accessor: (row) => (
            <div className="flex flex-col max-w-[200px]">
                <span className="font-mono text-xs text-gray-900 truncate" title={row.url}>{row.url}</span>
                <span className="text-[10px] text-gray-500">{row.method}</span>
            </div>
        )
    },
    {
        header: 'Role',
        accessor: (row) => <span className="text-gray-700 text-xs px-2 py-1 bg-gray-100 rounded border border-gray-200">{row.roleGroup || 'Unknown'}</span>
    },
    {
        header: 'Status',
        accessor: (row) => (
             <StatusBadge status={row.status >= 200 && row.status < 300 ? 'Active' : 'Failed'} />
        )
    },
    {
        header: 'Severity',
        accessor: (row) => <PriorityBadge priority={row.status >= 400 ? 'High' : 'Low'} />
    },
    {
        header: 'Timestamp',
        accessor: (row) => <span className="text-gray-500 text-xs">{new Date(row.time).toLocaleString()}</span>
    }
  ];

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <Sidebar />
<<<<<<< Updated upstream
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
                <div key={l.id} className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">{new Date(l.time).toLocaleString()}</div>
                  <div className="font-medium">{l.message}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
=======
      <div className="flex-1 bg-gray-50 h-full flex flex-col overflow-hidden">
         <SuperAdminPageHeader 
            title="System Logs" 
            subtitle="View activity and system events"
         />
         <div className="flex-1 overflow-hidden p-8">
            <SuperAdminTable 
            title="System Logs"
            data={logs}
            columns={columns}
            isLoading={loading}
            />
         </div>
>>>>>>> Stashed changes
      </div>
    </div>
  );
};

export default ViewLogs;
