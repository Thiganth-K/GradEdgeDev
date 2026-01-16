import React, { useEffect, useState } from 'react';
import makeHeaders from '../../lib/makeHeaders';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ViewLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  const fetchLogs = async () => {
    try {
      const headers = makeHeaders('admin_token');
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (usernameFilter) params.set('actorUsername', usernameFilter);
      if (roleFilter) params.set('role', roleFilter);
      if (actionFilter) params.set('actionType', actionFilter);
      if (startDate) params.set('startTime', new Date(startDate).toISOString());
      if (endDate) params.set('endTime', new Date(endDate).toISOString());
      const res = await fetch(`${BACKEND}/admin/logs?${params.toString()}`, { headers });
      const body = await res.json();
      if (body.success) setLogs(body.data || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'admin') {
      window.location.href = '/login';
      return;
    }
    fetchLogs();
  }, []);

  const clearLogs = async () => {
    try {
      const headers = { ...makeHeaders('admin_token'), 'Content-Type': 'application/json' };
      const res = await fetch(`${BACKEND}/admin/logs/clear`, { method: 'POST', headers, body: JSON.stringify({}) });
      if (!res.ok) {
        alert('Failed to clear logs');
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      const filenameMatch = /filename="?(.*)"?/.exec(disposition);
      const filename = (filenameMatch && filenameMatch[1]) ? filenameMatch[1] : `adminLogs_${Date.now()}.json`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      // Refresh logs (should be empty)
      setLogs([]);
    } catch (e) {
      alert('Failed to clear logs');
    }
  };

  function formatDate(d: any) {
    if (!d) return '-';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '-';

    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();

    let hours = dt.getHours();
    const minutes = String(dt.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hrs = String(hours).padStart(2, '0');

    return `${dd}/${mm}/${yyyy} ${hrs}:${minutes} ${ampm}`;
  }

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-red-700 mb-4">Admin Logs</h2>

        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <input value={usernameFilter} onChange={(e) => setUsernameFilter(e.target.value)} placeholder="Username" className="px-3 py-2 border rounded" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Message contains" className="px-3 py-2 border rounded" />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border rounded">
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="institution">Institution</option>
            <option value="faculty">Faculty</option>
            <option value="student">Student</option>
            <option value="contributor">Contributor</option>
          </select>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2 border rounded">
            <option value="">All actions</option>
            <option value="login">login</option>
            <option value="logout">logout</option>
            <option value="create">create</option>
            <option value="edit">edit</option>
            <option value="delete">delete</option>
            <option value="view">view</option>
            <option value="approve">approve</option>
            <option value="reject">reject</option>
            <option value="submit">submit</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm">From</label>
            <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1 border rounded" />
            <label className="text-sm">To</label>
            <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1 border rounded" />
          </div>
          <button onClick={fetchLogs} className="px-4 py-2 bg-white border rounded">Filter</button>
          <button onClick={clearLogs} className="px-4 py-2 bg-red-600 text-white rounded">Archive & Clear</button>
        </div>

        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 cursor-pointer" onClick={() => { setSortBy('actorUsername'); setSortDir(sortBy === 'actorUsername' && sortDir === 'asc' ? 'desc' : 'asc'); }}>Username</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 cursor-pointer" onClick={() => { setSortBy('role'); setSortDir(sortBy === 'role' && sortDir === 'asc' ? 'desc' : 'asc'); }}>Role</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 cursor-pointer" onClick={() => { setSortBy('actionType'); setSortDir(sortBy === 'actionType' && sortDir === 'asc' ? 'desc' : 'asc'); }}>Action</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Message</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 cursor-pointer" onClick={() => { setSortBy('timestamp'); setSortDir(sortBy === 'timestamp' && sortDir === 'asc' ? 'desc' : 'asc'); }}>Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Refs</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.slice().sort((a: any, b: any) => {
                const dir = sortDir === 'asc' ? 1 : -1;
                const av = a[sortBy] ?? '';
                const bv = b[sortBy] ?? '';
                if (sortBy === 'timestamp') return (new Date(av).getTime() - new Date(bv).getTime()) * dir;
                return String(av).localeCompare(String(bv)) * dir;
              }).map((l: any) => (
                <tr key={l._id || l.id}>
                  <td className="px-4 py-2 text-sm text-gray-800">{l.actorUsername || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{l.role}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{l.actionType}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{l.message}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{formatDate(l.timestamp || l.time || l.createdAt)}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{l.refs ? JSON.stringify(l.refs) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <button onClick={() => (window.location.href = '/admin/dashboard')} className="px-4 py-2 bg-white border rounded">Back</button>
        </div>
      </div>
    </div>
  );
};

export default ViewLogs;
