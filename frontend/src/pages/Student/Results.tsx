import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Student/Sidebar';
import { apiFetch } from '../../lib/api';
import { makeHeaders } from '../../lib/makeHeaders';

type Result = {
  _id: string;
  testId: string;
  testName?: string;
  testType?: string;
  durationMinutes?: number;
  startedAt: string;
  completedAt?: string | null;
  timeTakenSeconds?: number | null;
  correctCount: number;
  total: number;
  score: number;
  status: 'completed' | 'in-progress';
  isInstitutionGraded?: boolean;
  isFacultyGraded?: boolean;
};

const StudentResults: React.FC = () => {
  const [items, setItems] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/institution/student/results', { headers: makeHeaders('student_token') });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body && body.success) setItems(body.data || []);
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
            <h1 className="text-2xl font-bold">My Results</h1>
            <button onClick={load} disabled={loading} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <div className="bg-white p-4 rounded shadow">
            {loading && <p className="text-sm text-gray-600">Loading…</p>}
            {!loading && items.length === 0 && (
              <p className="text-sm text-gray-600">No results yet.</p>
            )}
            {!loading && items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-4">Test</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Grading</th>
                      <th className="py-2 pr-4">Score</th>
                      <th className="py-2 pr-4">Correct/Total</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((r) => (
                      <tr key={r._id}>
                        <td className="py-2 pr-4 font-medium">{r.testName || 'Test'}</td>
                        <td className="py-2 pr-4">{r.testType}</td>
                        <td className="py-2 pr-4">
                          {r.isInstitutionGraded && (
                            <span className="inline-block text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium">
                              Institution
                            </span>
                          )}
                          {r.isFacultyGraded && (
                            <span className="inline-block text-xs bg-green-600 text-white px-2 py-0.5 rounded font-medium">
                              Faculty
                            </span>
                          )}
                          {!r.isInstitutionGraded && !r.isFacultyGraded && (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">{Math.round(r.score)}</td>
                        <td className="py-2 pr-4">{r.correctCount}/{r.total}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded text-xs ${r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4">{r.completedAt ? new Date(r.completedAt).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentResults;
