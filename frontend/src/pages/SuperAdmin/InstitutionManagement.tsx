import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const InstitutionManagement: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'SuperAdmin') {
      window.location.href = '/login';
      return;
    }

    fetch(`${BACKEND}/superadmin/institutions`).then((r) => r.json()).then((b) => {
      if (b.success) setItems(b.data || []);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-red-700 mb-4">Institution Management</h2>
        <div className="grid gap-4">
          {items.map((it) => (
            <div key={it.id} className="p-4 bg-white rounded shadow flex justify-between">
              <div>
                <div className="font-semibold">{it.name}</div>
                <div className="text-sm text-gray-600">Status: {it.status}</div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 bg-red-600 text-white rounded">Approve</button>
                <button className="px-3 py-1 border rounded">Edit</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button onClick={() => (window.location.href = '/superadmin/dashboard')} className="px-4 py-2 bg-white border rounded">Back</button>
        </div>
      </div>
    </div>
  );
};

export default InstitutionManagement;
