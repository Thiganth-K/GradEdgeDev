import React, { useEffect, useState } from 'react';
import InstitutionAnnouncements from '../../components/Institution/Announcements';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

type Faculty = { _id: string; username: string; role: string };
type Student = { _id: string; username: string; name?: string; dept?: string };
type Batch = { _id: string; name: string; faculty?: { username: string }; students?: any[] };
type Test = { _id: string; name: string; type: string; assignedFaculty?: { username: string } };

const InstitutionDashboard: React.FC = () => {
  const data = typeof window !== 'undefined' ? localStorage.getItem('institution_data') : null;
  const inst = data ? JSON.parse(data) : null;

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('gradedge_role') : null;
    if (role !== 'institution') {
      window.location.href = '/login';
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;
    if (!token) {
      setError('Missing institution token, please login again.');
      return;
    }
    setLoading(true);
    setError(null);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [fRes, sRes, bRes, tRes] = await Promise.all([
        fetch(`${BACKEND}/institution/faculties`, { headers }),
        fetch(`${BACKEND}/institution/students`, { headers }),
        fetch(`${BACKEND}/institution/batches`, { headers }),
        fetch(`${BACKEND}/institution/tests`, { headers }),
      ]);
      const [f, s, b, t] = await Promise.all([
        fRes.json().catch(() => ({})),
        sRes.json().catch(() => ({})),
        bRes.json().catch(() => ({})),
        tRes.json().catch(() => ({})),
      ]);
      if (!fRes.ok || !f.success) throw new Error(f.message || 'Failed to load faculties');
      if (!sRes.ok || !s.success) throw new Error(s.message || 'Failed to load students');
      if (!bRes.ok || !b.success) throw new Error(b.message || 'Failed to load batches');
      if (!tRes.ok || !t.success) throw new Error(t.message || 'Failed to load tests');
      setFaculties(Array.isArray(f.data) ? f.data : []);
      setStudents(Array.isArray(s.data) ? s.data : []);
      setBatches(Array.isArray(b.data) ? b.data : []);
      setTests(Array.isArray(t.data) ? t.data : []);
    } catch (err: any) {
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const StatCard = ({ title, value, action }: { title: string; value: number; action: { label: string; href: string } }) => (
    <div className="bg-white rounded shadow p-4 flex flex-col justify-between">
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-3xl font-bold text-red-700 mt-1">{value}</div>
      </div>
      <a href={action.href} className="mt-3 inline-flex items-center text-sm text-red-700 font-semibold">
        {action.label}
        <span className="ml-1">→</span>
      </a>
    </div>
  );

  const ListCard = ({ title, items, empty, href }: { title: string; items: React.ReactNode; empty: string; href: string }) => (
    <section className="bg-white rounded shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <a href={href} className="text-sm text-red-700 font-semibold">Manage</a>
      </div>
      {items || <p className="text-sm text-gray-600">{empty}</p>}
    </section>
  );

  const take = <T,>(arr: T[], n: number) => arr.slice(0, n);

  const recentFaculties = faculties.length ? (
    <ul className="space-y-2 text-sm text-gray-800">
      {take(faculties, 4).map((f) => (
        <li key={f._id} className="flex items-center justify-between border-b last:border-b-0 pb-1">
          <span>{f.username}</span>
          <span className="text-xs text-gray-500">{f.role}</span>
        </li>
      ))}
    </ul>
  ) : null;

  const recentStudents = students.length ? (
    <ul className="space-y-2 text-sm text-gray-800">
      {take(students, 4).map((s) => (
        <li key={s._id} className="flex items-center justify-between border-b last:border-b-0 pb-1">
          <span>{s.name || s.username}</span>
          <span className="text-xs text-gray-500">{s.dept || s.username}</span>
        </li>
      ))}
    </ul>
  ) : null;

  const recentBatches = batches.length ? (
    <ul className="space-y-2 text-sm text-gray-800">
      {take(batches, 4).map((b) => (
        <li key={b._id} className="flex items-center justify-between border-b last:border-b-0 pb-1">
          <span>{b.name}</span>
          <span className="text-xs text-gray-500">Faculty: {b.faculty?.username || '—'}</span>
        </li>
      ))}
    </ul>
  ) : null;

  const recentTests = tests.length ? (
    <ul className="space-y-2 text-sm text-gray-800">
      {take(tests, 4).map((t) => (
        <li key={t._id} className="flex items-center justify-between border-b last:border-b-0 pb-1">
          <span>{t.name}</span>
          <span className="text-xs text-gray-500">{t.type}{t.assignedFaculty ? ` • ${t.assignedFaculty.username}` : ''}</span>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Institution Dashboard</h1>
              <p className="text-red-100">Welcome{inst?.name ? `, ${inst.name}` : ''}</p>
              <p className="text-sm text-red-200">ID: {inst?.institutionId || 'N/A'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={loadData} 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg text-white transition-colors flex items-center gap-2" 
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <a 
                href="/institution/chat" 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                Faculty Chat
              </a>
              <a 
                href="/institution/admin-chat" 
                className="px-4 py-2 bg-white text-red-600 hover:bg-white/90 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Admin Chat
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-gray-900">{faculties.length}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Faculties</h3>
            <p className="text-xs text-gray-400 mb-3">
              Limit: {inst?.facultyLimit ?? '∞'} • Remaining: {inst?.facultyLimit != null ? Math.max(0, (inst.facultyLimit as number) - faculties.length) : '∞'}
            </p>
            <a href="/institution/faculties" className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium">
              Manage 
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-gray-900">{students.length}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Students</h3>
            <p className="text-xs text-gray-400 mb-3">
              Limit: {inst?.studentLimit ?? '∞'} • Remaining: {inst?.studentLimit != null ? Math.max(0, (inst.studentLimit as number) - students.length) : '∞'}
            </p>
            <a href="/institution/students" className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium">
              Manage
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-gray-900">{batches.length}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Batches</h3>
            <p className="text-xs text-gray-400 mb-3">
              Limit: {inst?.batchLimit ?? '∞'} • Remaining: {inst?.batchLimit != null ? Math.max(0, (inst.batchLimit as number) - batches.length) : '∞'}
            </p>
            <a href="/institution/batches" className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium">
              Manage
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-gray-900">{tests.length}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Tests</h3>
            <p className="text-xs text-gray-400 mb-3">
              Limit: {inst?.testLimit ?? '∞'} • Remaining: {inst?.testLimit != null ? Math.max(0, (inst.testLimit as number) - tests.length) : '∞'}
            </p>
            <a href="/institution/tests" className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium">
              Manage
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Recent Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Faculties</h3>
              <a href="/institution/faculties" className="text-sm text-red-600 hover:text-red-700 font-medium">View all</a>
            </div>
            {faculties.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No faculties yet.</p>
            ) : (
              <ul className="space-y-3">
                {take(faculties, 4).map((f) => (
                  <li key={f._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-sm font-medium text-gray-900">{f.username}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{f.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Students</h3>
              <a href="/institution/students" className="text-sm text-red-600 hover:text-red-700 font-medium">View all</a>
            </div>
            {students.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No students yet.</p>
            ) : (
              <ul className="space-y-3">
                {take(students, 4).map((s) => (
                  <li key={s._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-sm font-medium text-gray-900">{s.name || s.username}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{s.dept || s.username}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Batches</h3>
              <a href="/institution/batches" className="text-sm text-red-600 hover:text-red-700 font-medium">View all</a>
            </div>
            {batches.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No batches yet.</p>
            ) : (
              <ul className="space-y-3">
                {take(batches, 4).map((b) => (
                  <li key={b._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-sm font-medium text-gray-900">{b.name}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">Faculty: {b.faculty?.username || '—'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Tests</h3>
              <a href="/institution/tests" className="text-sm text-red-600 hover:text-red-700 font-medium">View all</a>
            </div>
            {tests.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No tests yet.</p>
            ) : (
              <ul className="space-y-3">
                {take(tests, 4).map((t) => (
                  <li key={t._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-sm font-medium text-gray-900">{t.name}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{t.type}{t.assignedFaculty ? ` • ${t.assignedFaculty.username}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Announcements Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
            <div className="flex gap-2">
              <a href="/institution/announcements/create" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
                Create New
              </a>
              <a href="/institution/announcements" className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700 rounded-lg transition-colors">
                View All
              </a>
            </div>
          </div>
          <InstitutionAnnouncements />
        </div>
      </div>
    </div>
  );
};

export default InstitutionDashboard;
