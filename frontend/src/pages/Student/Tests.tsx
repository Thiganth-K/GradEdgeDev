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
              <div className="grid grid-cols-1 gap-4">
                {tests.map((t: any) => {
                  const completed = !!t.completed;
                  const score = t.score ?? null;
                  const attempts = typeof t.attempts === 'number' ? t.attempts : (t.attemptedCount || 0);
                  const maxAttempts = t.maxAttempts || t.allowedAttempts || null;
                  const due = t.dueDate ? new Date(t.dueDate) : null;
                  const dueLabel = due ? due.toLocaleString() : '—';

                  const actionLabel = completed ? (t.resultAvailable ? 'View Result' : 'Completed') : (attempts > 0 ? 'Continue' : 'Start');

                  return (
                    <div key={t._id} className="p-4 border rounded-lg flex items-center justify-between bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-800">{t.name}</h3>
                          <span className="text-sm text-gray-500">{t.type ? t.type.charAt(0).toUpperCase() + t.type.slice(1) : ''}</span>
                          {/* Creator role badge */}
                          {t.creatorRole === 'faculty'
                            ? <span className="inline-block text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded">Faculty Graded</span>
                            : <span className="inline-block text-xs bg-teal-100 text-teal-700 font-semibold px-2 py-0.5 rounded">Institution</span>
                          }
                          {t.priority && <span className="ml-1 inline-block text-xs bg-red-600 text-white px-2 py-0.5 rounded">{t.priority}</span>}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Questions: <strong className="text-gray-800">{t.questions?.length || t.questionCount || '—'}</strong>
                          <span className="mx-2">•</span>
                          Duration: <strong className="text-gray-800">{t.durationMinutes ?? t.duration ?? '—'} min</strong>
                          <span className="mx-2">•</span>
                          Due: <strong className="text-gray-800">{dueLabel}</strong>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-sm">
                          <div className="text-gray-600">Attempts: <span className="text-gray-800">{attempts}{maxAttempts ? ` / ${maxAttempts}` : ''}</span></div>
                          {score !== null && (
                            <div className="text-gray-600">Score: <span className="font-medium text-red-600">{score}%</span></div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col items-end">
                        <div className="mb-2">
                          {!completed && (
                            <button
                              onClick={() => navigate(`/student/test/${t._id}`)}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >{actionLabel}</button>
                          )}
                          {completed && t.resultAvailable && (
                            <button
                              onClick={() => navigate(`/student/test/${t._id}/result`)}
                              className="px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50"
                            >View Result</button>
                          )}
                          {completed && !t.resultAvailable && (
                            <div className="text-sm text-gray-500">Completed</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">Assigned on: {t.assignedAt ? new Date(t.assignedAt).toLocaleDateString() : '—'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentTests;
