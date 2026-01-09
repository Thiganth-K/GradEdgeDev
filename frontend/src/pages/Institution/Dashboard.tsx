import React, { useEffect, useState } from 'react';
import InstitutionAnnouncements from '../../components/Institution/Announcements';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold text-red-700">Institution Dashboard</h1>
            <p className="text-gray-700">Welcome{inst?.name ? `, ${inst.name}` : ''}</p>
            <p className="text-sm text-gray-500">Institution ID: {inst?.institutionId || 'N/A'}</p>
          </div>
          <div className="space-x-2">
            <button onClick={loadData} className="text-sm px-4 py-2 border rounded bg-white hover:bg-gray-50" disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh data'}
            </button>
            <a href="/institution/chat" className="text-sm px-4 py-2 border rounded bg-white hover:bg-gray-50">Faculty Chat</a>
          </div>
        </header>

        {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded shadow p-4">
            <div className="text-sm text-gray-500">Faculties</div>
            <div className="text-3xl font-bold text-red-700 mt-1">{faculties.length}</div>
            <div className="text-sm text-gray-600 mt-2">Limit: {inst?.facultyLimit ?? 'Unlimited'} • Remaining: {inst?.facultyLimit != null ? Math.max(0, (inst.facultyLimit as number) - faculties.length) : 'Unlimited'}</div>
            <a href="/institution/faculties" className="mt-3 inline-flex items-center text-sm text-red-700 font-semibold">Manage <span className="ml-1">→</span></a>
          </div>

          <div className="bg-white rounded shadow p-4">
            <div className="text-sm text-gray-500">Students</div>
            <div className="text-3xl font-bold text-red-700 mt-1">{students.length}</div>
            <div className="text-sm text-gray-600 mt-2">Limit: {inst?.studentLimit ?? 'Unlimited'} • Remaining: {inst?.studentLimit != null ? Math.max(0, (inst.studentLimit as number) - students.length) : 'Unlimited'}</div>
            <a href="/institution/students" className="mt-3 inline-flex items-center text-sm text-red-700 font-semibold">Manage <span className="ml-1">→</span></a>
          </div>

          <div className="bg-white rounded shadow p-4">
            <div className="text-sm text-gray-500">Batches</div>
            <div className="text-3xl font-bold text-red-700 mt-1">{batches.length}</div>
            <div className="text-sm text-gray-600 mt-2">Limit: {inst?.batchLimit ?? 'Unlimited'} • Remaining: {inst?.batchLimit != null ? Math.max(0, (inst.batchLimit as number) - batches.length) : 'Unlimited'}</div>
            <a href="/institution/batches" className="mt-3 inline-flex items-center text-sm text-red-700 font-semibold">Manage <span className="ml-1">→</span></a>
          </div>

          <div className="bg-white rounded shadow p-4">
            <div className="text-sm text-gray-500">Tests</div>
            <div className="text-3xl font-bold text-red-700 mt-1">{tests.length}</div>
            <div className="text-sm text-gray-600 mt-2">Limit: {inst?.testLimit ?? 'Unlimited'} • Remaining: {inst?.testLimit != null ? Math.max(0, (inst.testLimit as number) - tests.length) : 'Unlimited'}</div>
            <a href="/institution/tests" className="mt-3 inline-flex items-center text-sm text-red-700 font-semibold">Manage <span className="ml-1">→</span></a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ListCard title="Recent Faculties" items={recentFaculties} empty="No faculties yet." href="/institution/faculties" />
          <ListCard title="Recent Students" items={recentStudents} empty="No students yet." href="/institution/students" />
          <ListCard title="Recent Batches" items={recentBatches} empty="No batches yet." href="/institution/batches" />
          <ListCard title="Recent Tests" items={recentTests} empty="No tests yet." href="/institution/tests" />
        </div>

        {/* Announcements Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Announcements</h3>
            <div className="space-x-2">
              <a href="/institution/announcements/create" className="text-sm text-red-700 font-semibold">Create</a>
              <a href="/institution/announcements" className="text-sm text-gray-600">View all</a>
            </div>
          </div>
          <InstitutionAnnouncements />
        </div>
      </div>
    </div>
  );
};

export default InstitutionDashboard;
