import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Student/Sidebar';
import { apiFetch } from '../../lib/api';
import { makeHeaders } from '../../lib/makeHeaders';
import { useNavigate } from 'react-router-dom';

const StudentTests: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/institution/student/tests', { headers: makeHeaders('student_token') });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body && body.success) setTests(body.data || []);
    } catch (_) { /* noop */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Available Tests</h1>
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
            >{loading ? 'Refreshing…' : 'Refresh'}</button>
          </div>
          <div className="bg-white p-4 rounded shadow">
            {loading && <p className="text-sm text-gray-600">Loading…</p>}
            {!loading && tests.length === 0 && (
              <p className="text-sm text-gray-600">No tests assigned currently.</p>
            )}
            {!loading && tests.length > 0 && (
              <ul className="divide-y">
                {tests.map((t: any) => (
                  <li key={t._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t.name} <span className="text-gray-500">({t.type})</span></div>
                      <div className="text-xs text-gray-600">Questions: {t.questions?.length || 0} • Duration: {t.durationMinutes} min</div>
                    </div>
                    <button
                      onClick={() => navigate(`/student/test/${t._id}`)}
                      className="px-3 py-2 border rounded hover:bg-gray-50"
                    >Take Test</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentTests;
