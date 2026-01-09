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
        title="Announcements"
        desc="Send announcements to institutions"
        onClick={() => (window.location.href = '/admin/announcements')}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
      />

      <Card
        title="Contributors"
        desc="Create and manage contributor accounts"
        onClick={() => (window.location.href = '/admin/contributors')}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.6 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0zM19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /></svg>}
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
