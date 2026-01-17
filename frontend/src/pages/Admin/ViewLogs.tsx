import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Admin/Sidebar';
import { apiFetch } from '../../lib/api';
import makeHeaders from '../../lib/makeHeaders';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface LogEntry {
  id: string;
  roleGroup?: string;
  method?: string;
  url?: string;
  actor?: string;
  status?: number;
  durationMs?: number;
  time?: string | number;
}

const ViewLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'admin') {
      window.location.href = '/login';
      return;
    }
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filterRole, filterMethod, searchTerm]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/logs', { headers: makeHeaders('admin_token') });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (filterRole !== 'all') {
      filtered = filtered.filter(l => l.roleGroup?.toLowerCase() === filterRole.toLowerCase());
    }

    if (filterMethod !== 'all') {
      filtered = filtered.filter(l => l.method === filterMethod);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(l => 
        l.url?.toLowerCase().includes(term) ||
        l.actor?.toLowerCase().includes(term) ||
        l.roleGroup?.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'institution':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'faculty':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'student':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'contributor':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
      case 'admin':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'superadmin':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-yellow-100 text-yellow-700',
      DELETE: 'bg-red-100 text-red-700',
      PATCH: 'bg-purple-100 text-purple-700',
    };
    return colors[method] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-blue-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'institution': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'faculty': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'student': return 'bg-green-100 text-green-700 border-green-300';
      case 'contributor': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'admin': return 'bg-red-100 text-red-700 border-red-300';
      case 'superadmin': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const uniqueRoles = Array.from(new Set(logs.map(l => l.roleGroup || '').filter((r) => !!r))) as string[];
  const uniqueMethods = Array.from(new Set(logs.map(l => l.method || '').filter((m) => !!m))) as string[];

  // Calculate pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-8 py-6">
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
          </div>
        </div>

          <div className="max-w-7xl mx-auto px-8 py-2">
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Filter by Role</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0d0d0d] focus:border-transparent transition-colors"
                >
                  <option value="all">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role.toLowerCase()}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Filter by Method</label>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0d0d0d] focus:border-transparent transition-colors"
                >
                  <option value="all">All Methods</option>
                  {uniqueMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search URL, actor, or role..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0d0d0d] focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-bold text-gray-900">{startIndex + 1}-{Math.min(endIndex, filteredLogs.length)}</span> of <span className="font-bold text-gray-900">{filteredLogs.length}</span> logs
                {filteredLogs.length !== logs.length && (
                  <span className="text-gray-500"> (filtered from {logs.length})</span>
                )}
              </p>
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="px-5 py-2.5 bg-[#0d0d0d] text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {loading && filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#0d0d0d]"></div>
                <p className="text-gray-600 mt-4 font-medium">Loading logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="mx-auto h-20 w-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-700 mt-4 mb-2">No logs found</h3>
                <p className="text-gray-500 text-sm">No activity logs match your current filters</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {currentLogs.map((log) => (
                  <div key={log.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Role Icon */}
                      <div className={`mt-1 p-2.5 rounded-xl border shadow-sm ${getRoleBadgeColor(log.roleGroup ?? '')}`}>
                        {getRoleIcon(log.roleGroup ?? '')}
                      </div>

                      {/* Log Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${getMethodBadge(log.method ?? '')}`}>
                            {log.method || 'N/A'}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border shadow-sm ${getRoleBadgeColor(log.roleGroup ?? '')}`}>
                            {log.roleGroup || 'Unknown'}
                          </span>
                          <span className={`text-sm font-bold ${getStatusColor(log.status ?? 0)}`}>
                            {log.status ?? '-'}
                          </span>
                          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-lg">
                            {log.durationMs}ms
                          </span>
                        </div>

                        <div className="mb-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                          <code className="text-sm text-gray-800 font-mono break-all">{log.url}</code>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1.5 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {log.time ? new Date(log.time as any).toLocaleString() : '-'}
                          </span>
                          {log.actor && (
                            <span className="flex items-center gap-1.5 font-medium">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {log.actor}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Pagination */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {Math.min(page * PAGE_SIZE + 1, filteredLogs.length === 0 ? 0 : filteredLogs.length)} - {Math.min((page + 1) * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
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
                  disabled={(page + 1) * PAGE_SIZE >= filteredLogs.length}
                  className={`px-3 py-1 rounded ${(page + 1) * PAGE_SIZE >= filteredLogs.length ? 'bg-gray-100 text-gray-400' : 'bg-white border'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {filteredLogs.length > 0 && totalPages > 1 && (
            <div className="bg-white rounded-2xl shadow-lg p-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-[#0d0d0d] text-white shadow-md'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default ViewLogs;
