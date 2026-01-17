import React, { useEffect } from 'react';
import Sidebar from '../../components/SuperAdmin/sidebar';

const Dashboard: React.FC = () => {
  const [stats, setStats] = React.useState({
    admins: 0,
    institutions: 0,
    logs: 0
  });

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'SuperAdmin') {
      window.location.href = '/login';
      return;
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('superadmin_token');
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        
        const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const res = await fetch(`${BACKEND}/superadmin/dashboard-stats`, { headers });
        const data = await res.json();
        
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">SUPERADMIN DASHBOARD</h1>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-wider">Overview — quick links and system summary</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Admins Card - Brown/Orange Gradient with Wave */}
          <div className="relative overflow-hidden rounded-2xl p-8 text-white h-48" style={{ background: 'linear-gradient(135deg, #3d2817 0%, #6b4423 50%, #8b5a3c 100%)' }}>
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-3">ADMINS</p>
              <p className="text-6xl font-bold mb-4">{stats.admins}</p>
              <p className="text-sm opacity-80">Active administrators managing the platform</p>
            </div>
            {/* Wave decoration */}
            <svg className="absolute bottom-0 right-0 w-64 h-32 opacity-30" viewBox="0 0 200 100" preserveAspectRatio="none">
              <path d="M0,50 Q50,20 100,50 T200,50 L200,100 L0,100 Z" fill="rgba(255,255,255,0.2)"/>
            </svg>
          </div>

          {/* Institutions Card - Purple Gradient with Bars */}
          <div className="relative overflow-hidden rounded-2xl p-8 text-white h-48" style={{ background: 'linear-gradient(135deg, #2d1b3d 0%, #4a2d5c 50%, #6b4280 100%)' }}>
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-3">INSTITUTIONS</p>
              <p className="text-6xl font-bold mb-4">{stats.institutions}</p>
              <p className="text-sm opacity-80">Registered universities and colleges</p>
            </div>
            {/* Bar chart decoration */}
            <div className="absolute bottom-8 right-8 flex items-end gap-2 opacity-40">
              <div className="w-6 h-16 bg-pink-400 rounded-t"></div>
              <div className="w-6 h-24 bg-pink-300 rounded-t"></div>
              <div className="w-6 h-20 bg-purple-400 rounded-t"></div>
              <div className="w-6 h-12 bg-purple-300 rounded-full"></div>
            </div>
          </div>

          {/* System Logs Card - Blue/Teal Gradient with Line Chart */}
          <div className="relative overflow-hidden rounded-2xl p-8 text-white h-48" style={{ background: 'linear-gradient(135deg, #1a2332 0%, #243447 50%, #2d4a5e 100%)' }}>
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-3">SYSTEM LOGS</p>
              <p className="text-6xl font-bold mb-4">{stats.logs}</p>
              <p className="text-sm opacity-80">Events recorded in the last 24 hours</p>
            </div>
            {/* Line chart decoration */}
            <svg className="absolute bottom-0 right-0 w-96 h-32 opacity-40" viewBox="0 0 300 100" preserveAspectRatio="none">
              <path d="M0,80 L30,70 L60,75 L90,60 L120,65 L150,50 L180,55 L210,35 L240,40 L270,20 L300,25" 
                    fill="none" 
                    stroke="#4dd0e1" 
                    strokeWidth="4" 
                    strokeLinecap="round"/>
              <circle cx="300" cy="25" r="6" fill="#4dd0e1"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
