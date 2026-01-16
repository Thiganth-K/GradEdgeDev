import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Admin/Sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
      console.log('[AnnouncementManagement] admin_token localStorage:', token);
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Announcement Management</h1>
                <p className="text-red-100 text-sm">Broadcast messages to institutions</p>
              </div>
            </div>
            <button
              onClick={() => (window.location.href = '/admin/dashboard')}
              className="px-6 py-2.5 bg-white text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors shadow-md"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Create Announcement Form */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <h3 className="text-xl font-bold text-white">Send New Announcement</h3>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Announcement Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                rows={5}
                placeholder="Type your announcement message here..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">This message will be visible to selected institutions</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="sendToAll"
                  checked={sendToAll}
                  onChange={(e) => setSendToAll(e.target.checked)}
                  className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div>
                  <label htmlFor="sendToAll" className="text-sm font-semibold text-gray-800 cursor-pointer">
                    Broadcast to all institutions
                  </label>
                  <p className="text-xs text-gray-600 mt-1">Send this announcement to all institutions under your management</p>
                </div>
              </div>
            </div>

            {!sendToAll && (
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Target Institutions
                </label>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                  {institutions.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-gray-500 text-sm mt-2">No institutions available</p>
                    </div>
                  ) : (
                    institutions.map((inst) => (
                      <div key={inst._id} className="flex items-center space-x-3 bg-white p-3 rounded-lg hover:bg-red-50 transition-colors">
                        <input
                          type="checkbox"
                          id={`inst-${inst._id}`}
                          checked={selectedInstitutions.includes(inst._id)}
                          onChange={() => toggleInstitution(inst._id)}
                          className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <label htmlFor={`inst-${inst._id}`} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                          {inst.name}
                          <span className="text-gray-500 ml-2">({inst.institutionId})</span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {!sendToAll && selectedInstitutions.length > 0 && (
                  <p className="text-sm text-red-600 font-medium mt-3">
                    {selectedInstitutions.length} institution{selectedInstitutions.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Announcement
              </button>
            </div>
          </form>
        </div>

        {/* Announcements List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-white">Announcement History</h3>
            </div>
          </div>
          
          <div className="p-6">
            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2">No announcements yet</h3>
                <p className="text-gray-500 text-sm">Your sent announcements will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((announcement) => (
                  <div key={announcement._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-medium">
                          {new Date(announcement.createdAt).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {announcement.readBy.length} / {announcement.targetInstitutions.length} read
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-gray-800 leading-relaxed">{announcement.message}</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Target Institutions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(announcement.targetInstitutions || []).map((instOrId: any) => {
                          // Normalize institution object: backend may return ids or objects
                          const instId = typeof instOrId === 'string' ? instOrId : instOrId?._id || instOrId?.id;
                          const instObj = institutions.find((x) => x._id === instId) || (typeof instOrId === 'object' ? instOrId : null);
                          const name = instObj?.name || instOrId || 'All Institutions';

                          // readBy may be array of ids or objects
                          const isRead = (announcement.readBy || []).some((r: any) => {
                            if (!r) return false;
                            if (typeof r === 'string') return r === instId;
                            return r._id === instId || r.id === instId;
                          });

                          return (
                            <span
                              key={instId || name}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isRead
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-gray-100 text-gray-700 border border-gray-300'
                              }`}
                            >
                              {name}
                              {isRead && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </main>
    </div>
  );
};

export default AnnouncementManagement;
