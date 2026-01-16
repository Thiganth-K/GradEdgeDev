import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Student/Sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const data = typeof window !== 'undefined' ? localStorage.getItem('student_data') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('student_token') : null;
  const s = data ? JSON.parse(data) : null;
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` } as any;
    fetch(`${BACKEND}/institution/student/tests`, { headers }).then((r)=>r.json()).then((b)=>{
      if (b.success) setTests(b.data || []);
    }).catch(()=>{});
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
