<<<<<<< Updated upstream
import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const InstitutionManagement: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
=======
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/SuperAdmin/sidebar';
import SuperAdminTable, { type Column, StatusBadge, AvatarGroup, PriorityBadge } from '../../components/SuperAdmin/SuperAdminTable';
import SuperAdminPageHeader from '../../components/SuperAdmin/SuperAdminPageHeader';
import { FaEllipsisH } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface Institution {
  _id: string;
  id: string; // Required by SuperAdminTable
  name: string;
  location: string;
  contactNo: string;
  email: string;
  status: string;
  plan: string;
  users: string[]; 
}

const InstitutionManagement: React.FC = () => {
  const [items, setItems] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
>>>>>>> Stashed changes

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'SuperAdmin') {
      window.location.href = '/login';
      return;
    }

<<<<<<< Updated upstream
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
=======
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('superadmin_token');
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${BACKEND}/superadmin/institutions`, { headers });
        const b = await res.json().catch(() => ({}));
        if (res.ok && b.success) {
            const normalized = (b.data || []).map((d: any) => ({
                ...d,
                id: d._id, // Map _id to id for SuperAdminTable
                status: d.status || (Math.random() > 0.2 ? 'Active' : 'Inactive'),
                plan: d.plan || (Math.random() > 0.5 ? 'Pro' : 'Enterprise'),
                users: [
                    `https://i.pravatar.cc/150?u=${d._id}1`,
                    `https://i.pravatar.cc/150?u=${d._id}2`
                ]
            }));
            setItems(normalized);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const columns: Column<Institution>[] = [
    {
      header: 'Institution Name',
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{row.name}</span>
          <span className="text-xs text-gray-500">{row.location || 'Unknown Location'}</span>
        </div>
      )
    },
    {
        header: 'Assigned Team',
        accessor: (row) => <AvatarGroup images={row.users || []} />
    },
    {
      header: 'Contact',
      accessor: (row) => (
        <div className="flex flex-col">
             <span className="text-gray-700 text-xs">{row.email}</span>
             <span className="text-gray-500 text-[10px]">{row.contactNo}</span>
        </div>
      )
    },
    {
      header: 'Plan',
      accessor: (row) => <PriorityBadge priority={row.plan || 'Basic'} />
    },

    {
        header: 'Joined',
        accessor: () => <span className="text-gray-500 font-mono text-xs">12 Jan 2024</span>
    }
  ];

  return (
    <div className="flex bg-gray-50 h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-gray-50 h-full flex flex-col overflow-hidden">
        <SuperAdminPageHeader 
          title="Institution Management" 
          subtitle="Manage registered universities and colleges"
        />
        <div className="flex-1 overflow-hidden p-8">
            <SuperAdminTable 
            title="Institution Management"
            data={items}
            columns={columns}
            isLoading={loading}
            onAdd={() => alert('Add Institution Modal to be implemented')}
            actions={() => (
                <button className="text-gray-400 hover:text-red-600 p-2 transition-colors">
                <FaEllipsisH />
                </button>
            )}
            />
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  );
};

export default InstitutionManagement;
