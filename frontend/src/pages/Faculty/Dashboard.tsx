import React, { useEffect, useState } from 'react';
import Noticeboard from '../../components/Faculty/Noticeboard';
import BatchList from '../../components/Faculty/BatchList';
import Sidebar from '../../components/Faculty/Sidebar';
import type { Announcement, Batch } from '../../components/Faculty/types';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const FacultyDashboard: React.FC = () => {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('faculty_data') : null;
  const faculty = stored ? JSON.parse(stored) : null;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [testsCount, setTestsCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('gradedge_role') : null;
    if (role !== 'faculty') {
      window.location.href = '/login';
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('faculty_token') : null;
    if (!token) {
      setError('Missing faculty token, please login again.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [aRes, bRes] = await Promise.all([
        fetch(`${BACKEND}/institution/faculty/announcements`, { headers }),
        fetch(`${BACKEND}/institution/faculty/batches`, { headers }),
      ]);

      const aBody = await aRes.json().catch(() => ({}));
      const bBody = await bRes.json().catch(() => ({}));

      if (!aRes.ok || !aBody.success) throw new Error(aBody.message || 'Failed to load announcements');
      if (!bRes.ok || !bBody.success) throw new Error(bBody.message || 'Failed to load batches');

      setAnnouncements(Array.isArray(aBody.data) ? aBody.data : []);
      setBatches(Array.isArray(bBody.data) ? bBody.data : []);

      // Fetch tests count (lightweight) for dashboard stat
      try {
        const tRes = await fetch(`${BACKEND}/institution/faculty/tests`, { headers });
        const tBody = await tRes.json().catch(() => ({}));
        if (tRes.ok && tBody.success && Array.isArray(tBody.data)) setTestsCount(tBody.data.length);
        else setTestsCount(0);
      } catch (_) {
        setTestsCount(0);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 h-screen overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto space-y-6">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-red-700">Faculty Dashboard</h1>
              <p className="text-gray-700 mt-1">Welcome back{faculty?.username ? `, ${faculty.username}` : ''}</p>
            </div>
            <div className="text-sm text-gray-600 text-right">
              <div>Role: <span className="font-medium">{faculty?.role || 'faculty'}</span></div>
              {faculty?.username && <div>User: <span className="font-medium">{faculty.username}</span></div>}
            </div>
          </header>

          {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">{error}</div>}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-5 border">
              <div className="text-sm text-gray-500">Announcements</div>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-800">{announcements.length}</div>
                  <div className="text-sm text-gray-500">Recent messages</div>
                </div>
                <div className="text-red-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5 border">
              <div className="text-sm text-gray-500">Batches</div>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-800">{batches.length}</div>
                  <div className="text-sm text-gray-500">Active batches</div>
                </div>
                <div className="text-red-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4M3 11h18"/></svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5 border">
              <div className="text-sm text-gray-500">Assigned Tests</div>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-800">{testsCount === null ? '—' : testsCount}</div>
                  <div className="text-sm text-gray-500">Assigned to you</div>
                </div>
                <div className="text-red-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
              </div>
              <div className="mt-4">
                <a href="/faculty/assignedtests" className="inline-block px-3 py-2 bg-red-600 text-white rounded shadow">View Assigned Tests</a>
              </div>
            </div>
          </div>

          {/* Content columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Announcements</h3>
                <a href="/faculty/announcements" className="text-sm text-red-600">See all</a>
              </div>
              <div className="space-y-3">
                {loading && <p className="text-sm text-gray-500">Loading...</p>}
                {!loading && announcements.slice(0,3).map((a:any) => (
                  <div key={(a as any)._id || Math.random()} className="border rounded p-3">
                    <div className="text-xs text-gray-500">{new Date((a as any).createdAt).toLocaleString()}</div>
                    <p className="mt-2 text-sm text-gray-800">{(a as any).message}</p>
                  </div>
                ))}
                {!loading && announcements.length === 0 && <p className="text-sm text-gray-500">No recent announcements</p>}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Your Batches</h3>
                <a href="/faculty/batches" className="text-sm text-red-600">Manage</a>
              </div>
              <div className="space-y-3">
                {batches.slice(0,4).map((b:any) => (
                  <div key={(b as any)._id || Math.random()} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="font-medium text-sm">{(b as any).name || (b as any).batchName || 'Unnamed'}</div>
                      <div className="text-xs text-gray-500">Students: {(b as any).studentCount || (b as any).students?.length || '—'}</div>
                    </div>
                    <button onClick={() => (window.location.href = `/faculty/batch/${(b as any)._id}`)} className="px-3 py-1 border rounded text-sm">View</button>
                  </div>
                ))}
                {batches.length === 0 && <p className="text-sm text-gray-500">No batches found</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
