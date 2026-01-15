import React, { useEffect } from 'react';
import AdminManagement from './AdminManagement';

const Dashboard: React.FC = () => {
  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'SuperAdmin') {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <header className="max-w-6xl mx-auto mb-6">
        <h2 className="text-3xl font-bold text-red-700">SuperAdmin Dashboard — GradEdgeDev</h2>
      </header>
      <main className="max-w-6xl mx-auto">
        <AdminManagement />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded shadow cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href='/superadmin/logs'}>
                <h3 className="text-xl font-bold text-gray-800 mb-2">System Logs</h3>
                <p className="text-gray-600">View detailed system logs and audit trails.</p>
            </div>
            <div className="bg-white p-6 rounded shadow cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href='/superadmin/system-status'}>
                <h3 className="text-xl font-bold text-gray-800 mb-2">System Vitals</h3>
                <p className="text-gray-600">Monitor MongoDB status, CPU, RAM and uptime.</p>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
