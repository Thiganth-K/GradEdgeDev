import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Admin/Sidebar';
import { apiFetch } from '../../lib/api';
import makeHeaders from '../../lib/makeHeaders';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface LogEntry {
  _id: string;
  actorId?: string;
  actorUsername?: string;
  role?: string; // contributor|faculty|student|institution|admin|superadmin
  actionType?: string;
  message?: string;
  refs?: any;
  timestamp?: string;
}

const ViewLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters that map to backend query params
  const [usernameFilter, setUsernameFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // client-side search for message text
  const [searchTerm, setSearchTerm] = useState('');

  // pagination + sorting
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [sortField, setSortField] = useState<'timestamp' | 'actorUsername'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const role = (localStorage.getItem('gradedge_role') || '').toLowerCase();
    if (role !== 'admin' && role !== 'superadmin') {
      window.location.href = '/login';
      return;
    }
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When filters change, fetch from server (server supports role, actionType, actorUsername, startTime, endTime)
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, actionFilter, usernameFilter, startDate, endDate]);

  const buildQuery = (params: Record<string, any>) => {
    const qs: string[] = [];
    Object.keys(params).forEach((k) => {
      const v = params[k];
      if (v === undefined || v === null) return;
      if (v === 'all') return;
      if (v === '') return;
      qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    });
    return qs.length ? `?${qs.join('&')}` : '';
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (roleFilter && roleFilter !== 'all') params.role = roleFilter;
      if (actionFilter && actionFilter !== 'all') params.actionType = actionFilter;
      if (usernameFilter && usernameFilter.trim()) params.actorUsername = usernameFilter.trim();
      if (startDate) params.startTime = new Date(startDate).toISOString();
      if (endDate) {
        // include end of day if only date provided or use exact datetime
        const d = new Date(endDate);
        params.endTime = new Date(d.getTime()).toISOString();
      }

      const qs = buildQuery(params);
      const res = await apiFetch(`/admin/logs${qs}`, { headers: makeHeaders('admin_token') });
      const data = await res.json().catch(() => ({}));
      if (data && data.success) {
        setLogs(data.data || []);
        setCurrentPage(1);
      } else if (Array.isArray(data)) {
        setLogs(data || []);
        setCurrentPage(1);
      }
    } catch (e) {
      console.error('fetchLogs error', e);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Archive and clear the current logs? This will download an archive and remove logs from the DB.')) return;
    try {
      const res = await fetch(`${BACKEND}/admin/logs/clear`, {
        method: 'POST',
        headers: { ...makeHeaders('admin_token'), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to clear logs');
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      let filename = 'adminLogs.json';
      const match = /filename="?(.*?)"?(;|$)/i.exec(disposition);
      if (match && match[1]) filename = match[1];

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Refresh view
      fetchLogs();
    } catch (e) {
      console.error('clearLogs error', e);
      alert('Failed to clear logs');
    }
  };

  // client-side filtering + sorting for display after server fetch
  const applyClientFiltersAndSort = (items: LogEntry[]) => {
    let f = [...items];
    // searchTerm filters message
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      f = f.filter((l) => (l.message || '').toLowerCase().includes(t) || (l.actorUsername || '').toLowerCase().includes(t) || (l.actionType || '').toLowerCase().includes(t));
    }

    // sorting
    f.sort((a, b) => {
      const aVal = sortField === 'timestamp' ? (a.timestamp || '') : (a.actorUsername || '').toLowerCase();
      const bVal = sortField === 'timestamp' ? (b.timestamp || '') : (b.actorUsername || '').toLowerCase();
      if (!aVal && !bVal) return 0;
      if (!aVal) return sortDir === 'asc' ? -1 : 1;
      if (!bVal) return sortDir === 'asc' ? 1 : -1;
      if (sortField === 'timestamp') {
        const av = new Date(aVal).getTime();
        const bv = new Date(bVal).getTime();
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return f;
  };

  const uniqueRoles = Array.from(new Set(logs.map((l) => (l.role || '').toLowerCase()).filter(Boolean))).map(r => r);
  const uniqueActions = Array.from(new Set(logs.map((l) => (l.actionType || '').toLowerCase()).filter(Boolean))).map(a => a);

  const processed = applyClientFiltersAndSort(logs);
  const totalPages = Math.max(1, Math.ceil(processed.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = processed.slice(startIndex, startIndex + itemsPerPage);

  const fmtTime = (ts?: string) => {
    if (!ts) return '-';
    const d = new Date(ts);
    // DD/MM/YYYY HH:MM AM/PM
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hrs = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} ${hrs}:${minutes} ${ampm}`;
  };

  const toggleSort = (field: 'timestamp' | 'actorUsername') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#0d0d0d] rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">System Activity Logs</h1>
                  <p className="text-gray-600 text-sm">Monitor all actions performed across the platform</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={fetchLogs} className="px-4 py-2 rounded bg-gray-800 text-white">Refresh</button>
                <button onClick={clearLogs} className="px-4 py-2 rounded bg-red-600 text-white">Archive & Clear</button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Username</label>
                  <input value={usernameFilter} onChange={(e) => setUsernameFilter(e.target.value)} placeholder="Username" className="w-full px-4 py-2.5 border rounded-xl" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Role</label>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl">
                    <option value="all">All Roles</option>
                    {uniqueRoles.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Action</label>
                  <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl">
                    <option value="all">All Actions</option>
                    {uniqueActions.map((a) => (<option key={a} value={a}>{a}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Date Range</label>
                  <div className="flex gap-2">
                    <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-1/2 px-3 py-2 border rounded" />
                    <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-1/2 px-3 py-2 border rounded" />
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">Showing {processed.length} logs (fetched {logs.length})</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Message</th>
                    <th onClick={() => toggleSort('timestamp')} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  )}
                  {!loading && currentLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No logs found</td>
                    </tr>
                  )}
                  {!loading && currentLogs.map((l) => (
                    <tr key={l._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{l.actorUsername || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{l.role || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{l.actionType || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{l.message || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{fmtTime(l.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">Showing {startIndex + 1}-{Math.min(startIndex + currentLogs.length, processed.length)} of {processed.length}</div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Prev</button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewLogs;