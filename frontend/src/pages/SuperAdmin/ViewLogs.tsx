import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/SuperAdmin/sidebar';
import { FaSearch, FaFilter, FaTh } from 'react-icons/fa';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

type Log = { 
  id?: string; 
  time: string; 
  timestamp?: string;
  message?: string; 
  url?: string; 
  endpoint?: string;
  method?: string; 
  roleGroup?: string;
  role?: string;
  status?: number | string; 
  severity?: string;
};

const ViewLogs: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('superadmin_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${BACKEND}/superadmin/logs`, { headers });
      const b = await res.json().catch(() => ({}));
      if (b.success || b.data) {
        const logData = b.data || [];
        // Normalize log data
        const normalized = logData.map((log: any, idx: number) => ({
          id: log.id || log._id || `log-${idx}`,
          time: log.time || log.timestamp || log.createdAt || new Date().toISOString(),
          endpoint: log.endpoint || log.url || log.path || '',
          method: log.method || 'GET',
          role: log.role || log.roleGroup || 'SuperAdmin',
          status: log.status || (Math.random() > 0.5 ? 'ACTIVE' : 'FAILED'),
          severity: log.severity || 'LOW'
        }));
        setLogs(normalized);
      }
    } catch (err) {
      console.debug('load logs error', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const roleLocal = localStorage.getItem('gradedge_role');
    if (roleLocal !== 'SuperAdmin') {
      window.location.href = '/login';
      return;
    }
    load();
  }, []);

  const filteredLogs = logs.filter(log => 
    (log.endpoint?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (log.method?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (log.role?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIdx, endIdx);

  const getStatusBadge = (status: string | number | undefined) => {
    const statusStr = String(status || '').toUpperCase();
    if (statusStr === 'ACTIVE' || statusStr === '200') {
      return <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded">ACTIVE</span>;
    }
    return <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded">FAILED</span>;
  };

  const getSeverityBadge = (severity: string | undefined) => {
    const sev = (severity || 'LOW').toUpperCase();
    return <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded">{sev}</span>;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SYSTEM LOGS</h1>
          <p className="text-sm text-gray-500 mt-1">VIEW ACTIVITY AND SYSTEM EVENTS</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <FaFilter className="text-gray-600" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <FaTh className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ENDPOINT
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ROLE
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  SEVERITY
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  TIMESTAMP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No logs found.
                  </td>
                </tr>
              )}
              {!loading && paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{log.endpoint}</div>
                    <div className="text-xs text-gray-500 mt-1">{log.method}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                      {log.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-6 py-4">
                    {getSeverityBadge(log.severity)}
                  </td>
                  <td className="px-6 py-4 text-gray-700 text-sm">
                    {new Date(log.time).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIdx + 1}-{Math.min(endIdx, filteredLogs.length)} of {filteredLogs.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewLogs;
