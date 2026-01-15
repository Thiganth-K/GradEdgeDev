import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface Announcement {
  _id: string;
  message: string;
  createdBy: { username: string };
  createdAt: string;
  isRead: boolean;
}

const InstitutionAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/institution/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data || []);
      }
    } catch (err) {
      console.error('Error loading announcements:', err);
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
      const data = await res.json();
      if (data.success) {
        // Update local state
        setAnnouncements(announcements.map((a) =>
          a._id === id ? { ...a, isRead: true } : a
        ));
      }
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    }
  };

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  if (loading) {
    return (
      <div className="bg-white rounded shadow p-5">
        <h3 className="text-lg font-semibold mb-3">Announcements</h3>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">
          Announcements
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        <button
          onClick={loadAnnouncements}
          className="text-sm text-red-700 font-semibold hover:underline"
        >
          Refresh
        </button>
      </div>

      {announcements.length === 0 && (
        <p className="text-sm text-gray-600">No announcements yet</p>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {announcements.map((announcement) => (
          <div
            key={announcement._id}
            className={`border rounded p-3 ${
              announcement.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-300'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-500">
                {new Date(announcement.createdAt).toLocaleString()}
                {announcement.createdBy?.username && (
                  <span className="ml-2">• from Admin: {announcement.createdBy.username}</span>
                )}
              </span>
              {!announcement.isRead && (
                <button
                  onClick={() => markAsRead(announcement._id)}
                  className="text-xs text-blue-700 hover:underline font-medium"
                >
                  Mark as read
                </button>
              )}
            </div>
            <p className="text-sm">{announcement.message}</p>
            {announcement.isRead && (
              <span className="inline-block mt-1 text-xs text-green-600">✓ Read</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstitutionAnnouncements;
