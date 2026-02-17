import React, { useEffect, useState, useRef } from 'react';
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
  const [showAnns, setShowAnns] = useState(false);
  const annRef = useRef<HTMLDivElement | null>(null);

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
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (annRef.current && !annRef.current.contains(e.target as Node)) setShowAnns(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded shadow relative">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <div className="relative" ref={annRef}>
                <button
                  onClick={() => setShowAnns((s) => !s)}
                  className="relative inline-flex items-center p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                  aria-label="Announcements"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                  {anns.length > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{anns.length}</span>
                  )}
                </button>

                {showAnns && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border rounded shadow-lg z-50">
                    <div className="p-3 border-b flex items-center justify-between">
                      <div className="font-medium">Announcements</div>
                      <a href="/student/announcements" className="text-sm text-red-600">See all</a>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto">
                      {anns.length === 0 && <div className="text-sm text-gray-500 p-3">No announcements</div>}
                      {anns.slice(0, 6).map((a:any) => (
                        <div key={a._id} className="p-2 border-b last:border-b-0">
                          <div className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</div>
                          <div className="mt-1 text-sm text-gray-800">{a.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                { name: 'Coding Playground', slug: 'sandbox' },
              ].map((it) => (
                <button
                  key={it.slug}
                  onClick={() => navigate(
                    it.slug === 'announcements' ? '/student/announcements' :
                    it.slug === 'tests' ? '/student/tests' :
                    it.slug === 'results' ? '/student/results' :
                    it.slug === 'sandbox' ? '/student/sandbox' :
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

            <div className="mt-6">
              <h2 className="text-xl font-semibold">Assigned Tests</h2>
              <div className="space-y-2 mt-2">
                {tests.map((t:any) => (
                  <div key={t._id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.name} ({t.type})</span>
                        {t.isFRITest && (
                          <span className="inline-block text-xs bg-purple-600 text-white px-2 py-0.5 rounded font-medium shadow-sm">
                            🏆 FRI
                          </span>
                        )}
                      </div>
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
