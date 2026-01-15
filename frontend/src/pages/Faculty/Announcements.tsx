import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const FacultyAnnouncements: React.FC = () => {
  const [anns, setAnns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('faculty_token') : null;

  useEffect(() => { load(); }, []);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/institution/faculty/announcements/list`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) setAnns(body.data || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Faculty Announcements</h2>
      <div className="bg-white p-4 rounded shadow">
        {loading && <p className="text-sm text-gray-600">Loading...</p>}
        {!loading && anns.length === 0 && <p className="text-sm text-gray-600">No announcements</p>}
        <div className="space-y-3">
          {anns.map((a:any) => (
            <div key={a._id} className="border rounded p-3">
              <div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</div>
              <p className="mt-2 text-sm">{a.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacultyAnnouncements;
