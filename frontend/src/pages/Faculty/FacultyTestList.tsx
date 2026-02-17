import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Faculty/Sidebar';
import API_BASE_URL from '../../lib/api';

const BACKEND = API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';

const FacultyTestList: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('faculty_token') : null;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/faculty/tests`, { headers: { Authorization: `Bearer ${token}` } });
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">My Tests</h2>
              <button onClick={() => (window.location.href = '/faculty/tests/create')} className="px-3 py-2 bg-red-600 text-white rounded">Create Test</button>
            </div>
            <div className="space-y-3">
              {loading && <p className="text-sm text-gray-600">Loading...</p>}
              {!loading && tests.length === 0 && <p className="text-sm text-gray-600">You haven't created any tests yet.</p>}
              {tests.map((t:any) => (
                <div key={t._id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name} ({t.type})</span>
                      {t.isInstitutionGraded && (
                        <span className="inline-block text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium">
                          Institution Graded Test
                        </span>
                      )}
                      {t.isFacultyGraded && (
                        <span className="inline-block text-xs bg-green-600 text-white px-2 py-0.5 rounded font-medium">
                          Faculty Graded Test
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Questions: {(t.libraryQuestionIds?.length || 0) + (t.customQuestions?.length || 0)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => (window.location.href = `/faculty/tests/${t._id}/edit`)} className="px-3 py-2 border rounded">Edit</button>
                    <button onClick={async () => {
                      if (!confirm('Delete this test?')) return;
                      const token = localStorage.getItem('faculty_token');
                      await fetch(`${BACKEND}/faculty/tests/${t._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                      load();
                    }} className="px-3 py-2 border rounded text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FacultyTestList;
