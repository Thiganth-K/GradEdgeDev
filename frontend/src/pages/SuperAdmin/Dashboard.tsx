import React, { useEffect } from 'react';
import Sidebar from '../../components/SuperAdmin/sidebar';

const Dashboard: React.FC = () => {
  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'SuperAdmin') {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-50 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">SuperAdmin Dashboard</h2>
          <p className="text-gray-600">Overview — quick links and system summary</p>
        </header>

        <main>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 font-medium">Admins</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">—</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 font-medium">Institutions</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">—</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 font-medium">Recent Logs</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">—</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
