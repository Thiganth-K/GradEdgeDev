import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface Announcement {
  _id: string;
  message: string;
  createdBy?: { username?: string } | null;
  createdAt?: string;
  isRead?: boolean;
}

const InstitutionAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  useEffect(() => {
    loadAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAnnouncements = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/institution/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setAnnouncements(data.data || []);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('Error loading announcements:', err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND}/institution/announcements/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setAnnouncements((cur) => cur.map((a) => (a._id === id ? { ...a, isRead: true } : a)));
      }
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    }
  };

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  const fmtDate = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString();
    } catch (e) {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-40 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-red-700">
        <div className="flex items-center gap-3">
          <h3 className="text-white text-lg font-bold">Announcements</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 text-sm font-semibold bg-white/20 text-white rounded">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAnnouncements}
            className="text-white text-sm bg-white/10 px-3 py-1 rounded hover:bg-white/20"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6 max-h-[42rem] overflow-y-auto space-y-3">
        {announcements.length === 0 ? (
          <div className="text-sm text-gray-600">No announcements yet</div>
        ) : (
          announcements.map((a) => (
            <div key={a._id} className={`flex items-start gap-4 p-4 rounded-lg border ${a.isRead ? 'bg-gray-50' : 'bg-white'} shadow-sm`}>
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-sm ${a.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>{a.message}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      <span>{a.createdBy?.username || 'System'}</span>
                      <span className="mx-2">•</span>
                      <span>{fmtDate(a.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {!a.isRead ? (
                      <button
                        onClick={() => markAsRead(a._id)}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Mark read
                      </button>
                    ) : (
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">Read</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InstitutionAnnouncements;
