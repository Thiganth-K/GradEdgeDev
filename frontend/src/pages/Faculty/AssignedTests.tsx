import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Faculty/Sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const FacultyAssignedTests: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('faculty_token') : null;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/institution/faculty/tests`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) setTests(body.data || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 h-screen overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          <section className="bg-white rounded shadow p-5">
            <h2 className="text-2xl font-semibold mb-4">Assigned Tests</h2>
            <div className="space-y-3">
              {loading && <p className="text-sm text-gray-600">Loading...</p>}
              {!loading && tests.length === 0 && <p className="text-sm text-gray-600">No tests assigned yet.</p>}
              {tests.map((t:any) => (
                <div key={t._id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{t.name} ({t.type})</div>
                    <div className="text-sm text-gray-600">Questions: {t.questions?.length || 0}</div>
                  </div>
                  <button onClick={() => (window.location.href = `/faculty/test/${t._id}/results`)} className="px-3 py-2 border rounded">View Results</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FacultyAssignedTests;
