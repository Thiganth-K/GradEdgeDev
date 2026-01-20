import React, { useEffect, useState } from 'react';
import InstitutionAnnouncements from '../../components/Institution/Announcements';
import InstitutionSidebar from '../../components/Institution/Sidebar';

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
  const [showAnns, setShowAnns] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annsLoading, setAnnsLoading] = useState(false);

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

  const loadAnnouncements = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;
    if (!token) return;
    setAnnsLoading(true);
    try {
      const res = await fetch(`${BACKEND}/institution/announcements`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (body.success) setAnnouncements(body.data || []);
    } catch (err) {
      // ignore
    } finally { setAnnsLoading(false); }
  };

  const markAnnAsRead = async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND}/institution/announcements/${id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (body.success) setAnnouncements(announcements.map(a => a._id === id ? { ...a, isRead: true } : a));
    } catch (err) {
      // ignore
    }
  };

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
    <div className="flex min-h-screen">
      <InstitutionSidebar />
      <div className="flex-1 bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DASHBOARD</h1>
                <p className="text-sm text-gray-500 mt-1">Welcome back{inst?.name ? `, ${inst.name}` : ''}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={loadData} 
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors flex items-center gap-2" 
                  disabled={loading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <a 
                  href="/institution/chat" 
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  Faculty Chat
                </a>
                <a 
                  href="/institution/admin-chat" 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
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

        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-[#0d0d0d] to-gray-800 rounded-xl p-8 text-white shadow-lg">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {inst?.name || 'Institution'}!</h2>
          <p className="text-gray-300 mb-4">Here's an overview of your institution</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>ID: {inst?.institutionId || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <a href="/institution/faculties" className="group">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-4xl font-bold text-white">{faculties.length}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Faculties</h3>
              <p className="text-blue-100 text-sm">
                {inst?.facultyLimit != null 
                  ? `${Math.max(0, (inst.facultyLimit as number) - faculties.length)} spots remaining`
                  : 'Unlimited'}
              </p>
            </div>
          </a>

          <a href="/institution/students" className="group">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-4xl font-bold text-white">{students.length}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Students</h3>
              <p className="text-green-100 text-sm">
                {inst?.studentLimit != null 
                  ? `${Math.max(0, (inst.studentLimit as number) - students.length)} spots remaining`
                  : 'Unlimited'}
              </p>
            </div>
          </a>

          <a href="/institution/batches" className="group">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-4xl font-bold text-white">{batches.length}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Batches</h3>
              <p className="text-purple-100 text-sm">
                {inst?.batchLimit != null 
                  ? `${Math.max(0, (inst.batchLimit as number) - batches.length)} spots remaining`
                  : 'Unlimited'}
              </p>
            </div>
          </a>

          <a href="/institution/tests" className="group">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-4xl font-bold text-white">{tests.length}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Tests</h3>
              <p className="text-orange-100 text-sm">
                {inst?.testLimit != null 
                  ? `${Math.max(0, (inst.testLimit as number) - tests.length)} spots remaining`
                  : 'Unlimited'}
              </p>
            </div>
          </a>
        </div>

        {/* Recent Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Faculties */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Recent Faculties</h3>
              <a href="/institution/faculties" className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                View all
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            {faculties.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm text-gray-500">No faculties yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {take(faculties, 5).map((f) => (
                  <div key={f._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{f.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{f.username}</span>
                    </div>
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">{f.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Students */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Recent Students</h3>
              <a href="/institution/students" className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                View all
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            {students.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-sm text-gray-500">No students yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {take(students, 5).map((s) => (
                  <div key={s._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm">{(s.name || s.username).charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{s.name || s.username}</span>
                    </div>
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">{s.dept || s.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Batches */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Recent Batches</h3>
              <a href="/institution/batches" className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                View all
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            {batches.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-sm text-gray-500">No batches yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {take(batches, 5).map((b) => (
                  <div key={b._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">{b.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{b.name}</span>
                    </div>
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">{b.faculty?.username || 'Unassigned'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Tests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Recent Tests</h3>
              <a href="/institution/tests" className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                View all
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            {tests.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500">No tests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {take(tests, 5).map((t) => (
                  <div key={t._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-semibold text-sm">{t.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.type}</p>
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">{t.assignedFaculty?.username || 'Unassigned'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/institution/announcements/create" className="group">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <svg className="w-8 h-8 text-white mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <p className="text-white font-semibold">Create Announcement</p>
              </div>
            </a>

            <a href="/institution/faculties" className="group">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <svg className="w-8 h-8 text-white mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-white font-semibold">Add Faculty</p>
              </div>
            </a>

            <a href="/institution/batches" className="group">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <svg className="w-8 h-8 text-white mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-white font-semibold">Create Batch</p>
              </div>
            </a>

            <a href="/institution/tests" className="group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <svg className="w-8 h-8 text-white mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-white font-semibold">Create Test</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default InstitutionDashboard;
