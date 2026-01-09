import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Institution {
  _id: string;
  name: string;
  institutionId: string;
}

interface Announcement {
  _id: string;
  message: string;
  targetInstitutions: Institution[];
  readBy: Institution[];
  createdAt: string;
}

const AnnouncementManagement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [message, setMessage] = useState('');
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role');
    if (role !== 'admin') {
      window.location.href = '/login';
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const [announcementsRes, institutionsRes] = await Promise.all([
        fetch(`${BACKEND}/admin/announcements`, { headers }),
        fetch(`${BACKEND}/admin/institutions`, { headers }),
      ]);

      const announcementsData = await announcementsRes.json();
      const institutionsData = await institutionsRes.json();

      if (announcementsData.success) setAnnouncements(announcementsData.data || []);
      if (institutionsData.success) setInstitutions(institutionsData.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      const payload: any = { message: message.trim() };
      if (!sendToAll && selectedInstitutions.length > 0) {
        payload.targetInstitutionIds = selectedInstitutions;
      }

      const res = await fetch(`${BACKEND}/admin/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('');
        setSelectedInstitutions([]);
        setSendToAll(true);
        loadData();
        alert('Announcement sent successfully!');
      } else {
        alert(data.message || 'Failed to send announcement');
      }
    } catch (err) {
      console.error('Error sending announcement:', err);
      alert('Failed to send announcement');
    }
  };

  const toggleInstitution = (id: string) => {
    if (selectedInstitutions.includes(id)) {
      setSelectedInstitutions(selectedInstitutions.filter((i) => i !== id));
    } else {
      setSelectedInstitutions([...selectedInstitutions, id]);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-red-700">Announcement Management</h2>
          <button
            onClick={() => (window.location.href = '/admin/dashboard')}
            className="px-4 py-2 bg-white border rounded hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Create Announcement Form */}
        <div className="bg-white rounded shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Send New Announcement</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                rows={4}
                placeholder="Enter announcement message..."
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendToAll"
                checked={sendToAll}
                onChange={(e) => setSendToAll(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="sendToAll" className="text-sm font-medium">
                Send to all my institutions
              </label>
            </div>

            {!sendToAll && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Institutions</label>
                <div className="border rounded p-3 max-h-48 overflow-y-auto space-y-2">
                  {institutions.length === 0 && (
                    <p className="text-gray-500 text-sm">No institutions found</p>
                  )}
                  {institutions.map((inst) => (
                    <div key={inst._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`inst-${inst._id}`}
                        checked={selectedInstitutions.includes(inst._id)}
                        onChange={() => toggleInstitution(inst._id)}
                        className="rounded"
                      />
                      <label htmlFor={`inst-${inst._id}`} className="text-sm">
                        {inst.name} ({inst.institutionId})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Send Announcement
            </button>
          </form>
        </div>

        {/* Announcements List */}
        <div className="bg-white rounded shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Previous Announcements</h3>
          {announcements.length === 0 && (
            <p className="text-gray-500">No announcements yet</p>
          )}
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement._id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-gray-600">
                    {new Date(announcement.createdAt).toLocaleString()}
                  </p>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {announcement.readBy.length} / {announcement.targetInstitutions.length} read
                  </span>
                </div>
                <p className="mb-3">{announcement.message}</p>
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Target Institutions:</p>
                  <div className="flex flex-wrap gap-2">
                    {announcement.targetInstitutions.map((inst) => {
                      const isRead = announcement.readBy.some((r) => r._id === inst._id);
                      return (
                        <span
                          key={inst._id}
                          className={`px-2 py-1 rounded text-xs ${
                            isRead
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {inst.name} {isRead ? '✓' : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementManagement;
