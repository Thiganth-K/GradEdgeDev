import React from 'react';

const Card: React.FC<{ title: string; desc: string; onClick: () => void; icon?: React.ReactNode }> = ({ title, desc, onClick, icon }) => (
  <div onClick={onClick} className="cursor-pointer bg-white rounded shadow p-6 hover:shadow-lg transition">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100 text-red-700">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  </div>
);

const DBody: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <Card
        title="Institution Management"
        desc="Create, edit and approve institutions"
        onClick={() => (window.location.href = '/admin/institutions')}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14v-8H5v8z" /></svg>}
      />

      <Card
        title="View Logs"
        desc="Inspect recent admin activity logs"
        onClick={() => (window.location.href = '/admin/logs')}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m2 0h-8"/></svg>}
      />

      <Card
        title="Log out"
        desc="Sign out of the admin console"
        onClick={() => { localStorage.removeItem('gradedge_role'); window.location.href = '/login'; }}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>}
      />
    </div>
  );
};

export default DBody;
