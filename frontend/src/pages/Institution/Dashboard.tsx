import React from 'react';

const InstitutionDashboard: React.FC = () => {
  const data = typeof window !== 'undefined' ? localStorage.getItem('institution_data') : null;
  const inst = data ? JSON.parse(data) : null;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-bold">Welcome{inst && inst.name ? `, ${inst.name}` : ''}</h1>
          <p className="mt-4 text-gray-700">This is your institution dashboard. Institution ID: {inst?.institutionId || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default InstitutionDashboard;
