import React, { useEffect, useState } from 'react';
import Noticeboard from '../../components/Faculty/Noticeboard';
import BatchList from '../../components/Faculty/BatchList';
import type { Announcement, Batch } from '../../components/Faculty/types';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FacultyDashboard: React.FC = () => {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('faculty_data') : null;
  const faculty = stored ? JSON.parse(stored) : null;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [tests, setTests] = useState<any[]>([]);
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
      const [aRes, bRes, tRes] = await Promise.all([
        fetch(`${BACKEND}/institution/faculty/announcements`, { headers }),
        fetch(`${BACKEND}/institution/faculty/batches`, { headers }),
        fetch(`${BACKEND}/institution/faculty/tests`, { headers }),
      ]);

      const aBody = await aRes.json().catch(() => ({}));
      const bBody = await bRes.json().catch(() => ({}));
      const tBody = await tRes.json().catch(() => ({}));

      if (!aRes.ok || !aBody.success) throw new Error(aBody.message || 'Failed to load announcements');
      if (!bRes.ok || !bBody.success) throw new Error(bBody.message || 'Failed to load batches');

      setAnnouncements(Array.isArray(aBody.data) ? aBody.data : []);
      setBatches(Array.isArray(bBody.data) ? bBody.data : []);
      setTests(Array.isArray(tBody.data) ? tBody.data : []);
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
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-red-700">Faculty Dashboard</h1>
            <p className="text-gray-700">Welcome back{faculty?.username ? `, ${faculty.username}` : ''}</p>
          </div>
          <div className="text-sm text-gray-600">
            <div>Role: {faculty?.role || 'faculty'}</div>
            {faculty?.username && <div>User: {faculty.username}</div>}
          </div>
        </header>

        {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">{error}</div>}

        <div className="grid md:grid-cols-2 gap-6">
          <Noticeboard announcements={announcements} loading={loading} onRefresh={loadData} />
          <BatchList batches={batches} />
        </div>

        <section className="bg-white rounded shadow p-5">
          <h2 className="text-xl font-semibold mb-2">Assigned Tests</h2>
          <div className="space-y-2">
            {tests.map((t:any) => (
              <div key={t._id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{t.name} ({t.type})</div>
                  <div className="text-sm text-gray-600">Questions: {t.questions?.length || 0}</div>
                </div>
                <button onClick={() => (window.location.href = `/faculty/test/${t._id}/results`)} className="px-3 py-2 border rounded">View Results</button>
              </div>
            ))}
            {tests.length === 0 && <p className="text-sm text-gray-600">No tests assigned yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default FacultyDashboard;
