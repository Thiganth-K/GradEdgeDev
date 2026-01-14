import React, { useEffect } from 'react';
import Sidebar from '../../components/SuperAdmin/sidebar'

const Dashboard: React.FC = () => {
  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'SuperAdmin') {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-6xl mx-auto flex">
        <Sidebar />

        <main className="flex-1">
          <header className="mb-6">
            <h2 className="text-3xl font-bold text-red-700">SuperAdmin Dashboard — GradEdgeDev</h2>
            <p className="mt-2 text-sm text-gray-600">Overview — quick links and system summary</p>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="text-sm text-gray-500">Admins</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">—</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="text-sm text-gray-500">Institutions</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">—</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="text-sm text-gray-500">Recent Logs</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">—</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
