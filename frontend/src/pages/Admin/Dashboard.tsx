import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Admin/Sidebar';
import makeHeaders from '../../lib/makeHeaders';

interface Stats {
  institutions: number;
  contributors: number;
  pendingRequests: number;
  activeChats: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    institutions: 0,
    contributors: 0,
    pendingRequests: 0,
    activeChats: 0
  });
  const [loading, setLoading] = useState(true);

  const adminData = localStorage.getItem('admin_data');
  const admin = adminData ? JSON.parse(adminData) : null;
  const adminName = admin?.username || 'Admin';

  useEffect(() => {
    const role = (localStorage.getItem('gradedge_role') || '').toLowerCase();
    if (role !== 'admin' && role !== 'superadmin') {
      window.location.href = '/login';
      return;
    }
    fetchDashboardStats();
    fetchAnnouncements();
  }, []);

  // Placeholder: fetch recent announcements for the header/bell (keeps current UI behavior)
  const fetchAnnouncements = async () => {
    try {
      const headers = makeHeaders('admin_token');
      const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      await fetch(`${BACKEND}/admin/announcements`, { headers });
    } catch (err) {
      // swallow - non-critical for dashboard stats
      console.debug('fetchAnnouncements error', err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const headers = makeHeaders('admin_token');
      const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

      // Fetch all stats in parallel from configured backend
      const [institutionsRes, contributorsRes, requestsRes, chatsRes] = await Promise.all([
        fetch(`${BACKEND}/admin/institutions`, { headers }),
        fetch(`${BACKEND}/admin/contributors`, { headers }),
        fetch(`${BACKEND}/admin/contributor-requests`, { headers }),
        fetch(`${BACKEND}/admin/contributor-chats`, { headers })
      ]);

      const institutionsJson = institutionsRes.ok ? await institutionsRes.json().catch(() => null) : null;
      const contributorsJson = contributorsRes.ok ? await contributorsRes.json().catch(() => null) : null;
      const requestsJson = requestsRes.ok ? await requestsRes.json().catch(() => null) : null;
      const chatsJson = chatsRes.ok ? await chatsRes.json().catch(() => null) : null;

      const institutionsArr = institutionsJson && institutionsJson.success && Array.isArray(institutionsJson.data) ? institutionsJson.data : [];
      const contributorsArr = contributorsJson && contributorsJson.success && Array.isArray(contributorsJson.data) ? contributorsJson.data : [];
      const requestsArr = requestsJson && requestsJson.success && Array.isArray(requestsJson.data) ? requestsJson.data : [];
      const chatsArr = chatsJson && chatsJson.success && Array.isArray(chatsJson.data) ? chatsJson.data : [];

      setStats({
        institutions: institutionsArr.length,
        contributors: contributorsArr.length,
        pendingRequests: requestsArr.filter((r: any) => r.status === 'pending').length,
        activeChats: chatsArr.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Institutions',
      value: stats.institutions,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'red',
      bgGradient: 'from-red-500 to-red-600',
      onClick: () => navigate('/admin/institutions')
    },
    {
      title: 'Total Contributors',
      value: stats.contributors,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      color: 'white',
      bgGradient: 'from-gray-50 to-gray-100',
      textColor: 'text-red-800',
      onClick: () => navigate('/admin/contributors')
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'red',
      bgGradient: 'from-red-600 to-red-700',
      onClick: () => navigate('/admin/contributor-requests')
    },
    {
      title: 'Active Chats',
      value: stats.activeChats,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      color: 'white',
      bgGradient: 'from-white to-gray-50',
      textColor: 'text-red-900',
      onClick: () => navigate('/admin/contributor-chats')
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">ADMIN DASHBOARD</h1>
            <p className="text-gray-500 text-sm mt-1 uppercase tracking-wider">Overview — system analytics and management</p>
          </div>

          {/* Welcome Card (syncs visually with sidebar) */}
          <div className="mb-6">
            <div className="relative rounded-2xl overflow-hidden bg-[#0d0d0d] text-white shadow-lg p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold">G</div>
                <div>
                  <p className="text-sm text-gray-300 uppercase opacity-80">Welcome back</p>
                  <p className="text-2xl font-semibold">{adminName}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-300">Good to see you — here's the system at a glance</p>
                <p className="text-xs text-gray-400 mt-1">Manage institutions, contributors, and system settings</p>
              </div>
            </div>
          </div>

          {/* Welcome Header with Bell Icon */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">System Analytics</h2>
              <p className="text-gray-600 mt-1">Monitor platform activity and performance</p>
            </div>
            <button className="relative p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-110">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {(stats.pendingRequests > 0 || stats.activeChats > 0) && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none transform translate-x-1/2 -translate-y-1/2 bg-white text-red-600 rounded-full">
                  {stats.pendingRequests + stats.activeChats}
                </span>
              )}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card, index) => (
              <div
                key={index}
                onClick={card.onClick}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden border-2 border-red-100"
              >
                <div className={`bg-gradient-to-r ${card.bgGradient} p-6`}>
                  <div className="flex items-center justify-between">
                    <div className={card.textColor || 'text-white'}>
                      {card.icon}
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${card.textColor || 'text-white'}`}>
                        {loading ? '...' : card.value}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <p className="text-gray-700 font-semibold text-sm">{card.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/admin/institutions')}
                  className="w-full text-left p-4 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-lg transition-all duration-300 flex items-center justify-between group"
                >
                  <span className="text-gray-700 font-medium">Manage Institutions</span>
                  <svg className="w-5 h-5 text-red-600 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigate('/admin/contributors')}
                  className="w-full text-left p-4 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-lg transition-all duration-300 flex items-center justify-between group"
                >
                  <span className="text-gray-700 font-medium">Manage Contributors</span>
                  <svg className="w-5 h-5 text-red-600 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigate('/admin/announcements')}
                  className="w-full text-left p-4 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-lg transition-all duration-300 flex items-center justify-between group"
                >
                  <span className="text-gray-700 font-medium">View Announcements</span>
                  <svg className="w-5 h-5 text-red-600 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Activity
              </h3>
              <div className="space-y-3">
                {stats.pendingRequests > 0 && (
                  <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                    <p className="text-sm font-medium text-orange-800">
                      {stats.pendingRequests} pending contributor request{stats.pendingRequests !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">Action required</p>
                  </div>
                )}
                {stats.activeChats > 0 && (
                  <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <p className="text-sm font-medium text-purple-800">
                      {stats.activeChats} active chat{stats.activeChats !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Check messages</p>
                  </div>
                )}
                {stats.pendingRequests === 0 && stats.activeChats === 0 && (
                  <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="text-sm font-medium text-green-800">All caught up!</p>
                    <p className="text-xs text-green-600 mt-1">No pending actions</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Overview */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-red-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              System Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium mb-2">Institutions</p>
                <p className="text-2xl font-bold text-red-900">{stats.institutions}</p>
                <p className="text-xs text-red-600 mt-1">Active organizations</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium mb-2">Contributors</p>
                <p className="text-2xl font-bold text-red-900">{stats.contributors}</p>
                <p className="text-xs text-red-600 mt-1">Content creators</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-lg border border-red-300">
                <p className="text-sm text-red-800 font-medium mb-2">Communications</p>
                <p className="text-2xl font-bold text-red-900">{stats.activeChats}</p>
                <p className="text-xs text-red-700 mt-1">Active conversations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
