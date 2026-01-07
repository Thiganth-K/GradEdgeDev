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
      </main>
    </div>
  );
};

export default Dashboard;
