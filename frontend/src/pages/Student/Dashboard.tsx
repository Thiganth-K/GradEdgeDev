import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Student/Sidebar';
import { apiFetch } from '../../lib/api';
import { makeHeaders } from '../../lib/makeHeaders';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const data = typeof window !== 'undefined' ? localStorage.getItem('student_data') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('student_token') : null;
  const s = data ? JSON.parse(data) : null;
  const [tests, setTests] = useState<any[]>([]);
  const [anns, setAnns] = useState<any[]>([]);

  useEffect(() => {
    const headers = makeHeaders('student_token');
    apiFetch('/institution/student/tests', { headers })
      .then((r) => r.json().catch(() => ({})))
      .then((b) => { if (b && b.success) setTests(b.data || []); })
      .catch(() => {});

    apiFetch('/institution/student/announcements', { headers })
      .then((r) => r.json().catch(() => ({})))
      .then((b) => { if (b && b.success) setAnns(b.data || []); })
      .catch(() => {});
  }, []);
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded shadow">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
            </div>
            {/* Announcements preview */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Announcements</h2>
                <a href="/student/announcements" className="text-sm text-red-700 hover:underline">View all</a>
              </div>
              {anns.length === 0 ? (
                <p className="text-sm text-gray-600">No announcements</p>
              ) : (
                <div className="space-y-2">
                  {anns.slice(0, 5).map((a:any) => (
                    <div key={a._id} className="border rounded p-3">
                      <div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</div>
                      <p className="mt-1 text-sm">{a.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Quick actions matching sidebar components */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Announcements', slug: 'announcements' },
                { name: 'Tests', slug: 'tests' },
                { name: 'Results', slug: 'results' },
                { name: 'Library', slug: 'library' },
                { name: 'Chat', slug: 'chat' },
                { name: 'Profile', slug: 'profile' },
                { name: 'Settings', slug: 'settings' },
                { name: 'Support', slug: 'support' },
              ].map((it) => (
                <button
                  key={it.slug}
                  onClick={() => navigate(
                    it.slug === 'announcements' ? '/student/announcements' :
                    it.slug === 'tests' ? '/student/tests' :
                    it.slug === 'results' ? '/student/results' :
                    `/student/wip/${it.slug}`
                  )}
                  className="text-left p-4 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-gray-600">Work in progress</div>
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded p-4 border">
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-medium">{s?.username}</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border">
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{s?.name}</p>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => navigate('/student/announcements')}
                className="text-sm text-red-700 font-semibold hover:underline"
              >
                View announcements
              </button>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold">Assigned Tests</h2>
              <div className="space-y-2 mt-2">
                {tests.map((t:any) => (
                  <div key={t._id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="font-medium">{t.name} ({t.type})</div>
                      <div className="text-sm text-gray-600">Questions: {t.questions?.length || 0} • Duration: {t.durationMinutes} min</div>
                    </div>
                    <button onClick={() => navigate(`/student/test/${t._id}`)} className="px-3 py-2 border rounded hover:bg-gray-50">Take Test</button>
                  </div>
                ))}
                {tests.length === 0 && <p className="text-sm text-gray-600">No tests assigned currently.</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
