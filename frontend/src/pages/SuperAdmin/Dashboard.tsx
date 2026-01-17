import React, { useEffect } from 'react';
import Sidebar from '../../components/SuperAdmin/sidebar';
import StatsCard from '../../components/SuperAdmin/StatsCard';
import SuperAdminPageHeader from '../../components/SuperAdmin/SuperAdminPageHeader';

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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-50 flex flex-col">
        <SuperAdminPageHeader 
          title="SuperAdmin Dashboard" 
          subtitle="Overview — quick links and system summary" 
        />

        <main className="max-w-7xl p-8">
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard 
              title="Admins" 
              value={stats.admins} 
              description="Active administrators managing the platform"
              variant="wave"
            />
            <StatsCard 
              title="Institutions" 
              value={stats.institutions} 
              description="Registered universities and colleges"
              variant="bar"
            />
            <StatsCard 
              title="System Logs" 
              value={stats.logs} 
              description="Events recorded in the last 24 hours"
              variant="line"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
