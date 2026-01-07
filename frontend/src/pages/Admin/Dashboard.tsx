import React, { useEffect } from 'react';
import DBody from '../../components/Admin/DBody';

const Dashboard: React.FC = () => {
  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'admin') {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <header className="max-w-6xl mx-auto mb-6">
        <h2 className="text-3xl font-bold text-red-700">Admin Dashboard — GradEdgeDev</h2>
      </header>
      <main className="max-w-6xl mx-auto">
        <DBody />
      </main>
    </div>
  );
};

export default Dashboard;
