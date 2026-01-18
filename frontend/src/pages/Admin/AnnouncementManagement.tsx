import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Admin/Sidebar';
import makeHeaders from '../../lib/makeHeaders';

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

  const token = typeof window !== 'undefined' ? (localStorage.getItem('admin_token') || localStorage.getItem('superadmin_token')) : null;

  useEffect(() => {
    const role = (localStorage.getItem('gradedge_role') || '').toLowerCase();
    if (role !== 'admin' && role !== 'superadmin') {
      window.location.href = '/login';
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('[AnnouncementManagement] admin_token localStorage:', token);
      const headers = makeHeaders('admin_token');
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
        headers: makeHeaders('admin_token', 'application/json'),
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
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">ANNOUNCEMENT MANAGEMENT</h1>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-wider">Broadcast messages to institutions</p>
        </div>
        {/* Create Announcement Form */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          <div className="bg-[#0d0d0d] px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Send New Announcement</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Announcement Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                rows={5}
                placeholder="Type your announcement message here..."
                required
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                This message will be visible to selected institutions
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-100 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="sendToAll"
                  checked={sendToAll}
                  onChange={(e) => setSendToAll(e.target.checked)}
                  className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="sendToAll" className="text-sm font-bold text-gray-900 cursor-pointer flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                    Broadcast to all institutions
                  </label>
                  <p className="text-xs text-gray-600 mt-1">Send this announcement to all institutions under your management</p>
                </div>
              </div>
            </div>

            {!sendToAll && (
              <div className="border-2 border-gray-200 rounded-xl p-5 bg-gray-50">
                <label className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Select Target Institutions
                </label>
                <div className="bg-white rounded-lg p-4 max-h-72 overflow-y-auto space-y-2 border-2 border-gray-100">
                  {institutions.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-gray-500 text-sm mt-3 font-medium">No institutions available</p>
                    </div>
                  ) : (
                    institutions.map((inst) => (
                      <div key={inst._id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-200">
                        <input
                          type="checkbox"
                          id={`inst-${inst._id}`}
                          checked={selectedInstitutions.includes(inst._id)}
                          onChange={() => toggleInstitution(inst._id)}
                          className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                        />
                        <label htmlFor={`inst-${inst._id}`} className="text-sm font-medium text-gray-800 cursor-pointer flex-1">
                          {inst.name}
                          <span className="text-gray-500 text-xs ml-2">({inst.institutionId})</span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {!sendToAll && selectedInstitutions.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {selectedInstitutions.length} institution{selectedInstitutions.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-[#0d0d0d] hover:bg-black text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3 border-2 border-red-600 hover:border-red-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="text-base">Send Announcement</span>
              </button>
            </div>
          </form>
        </div>

        {/* Announcements List */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-[#0d0d0d] px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Announcement History</h2>
          </div>
          
          <div className="p-6">
            {announcements.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No announcements yet</h3>
                <p className="text-gray-500 text-sm">Your sent announcements will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement._id} className="border-2 border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all hover:border-red-200 bg-gradient-to-br from-white to-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-semibold">
                          {new Date(announcement.createdAt).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 px-4 py-2 rounded-full font-bold text-sm border-2 border-red-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {announcement.readBy.length} / {announcement.targetInstitutions.length} read
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-5 mb-5 border-2 border-gray-100 shadow-sm">
                      <p className="text-gray-800 leading-relaxed font-medium">{announcement.message}</p>
                    </div>
                    
                    <div>
                      <p className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Target Institutions ({announcement.targetInstitutions.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {announcement.targetInstitutions.map((inst) => {
                          const isRead = announcement.readBy.some((r) => r._id === inst._id);
                          return (
                            <span
                              key={inst._id}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                isRead
                                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-300 shadow-sm'
                                  : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
                              }`}
                            >
                              {inst.name}
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
    </div>
  );
};

export default AnnouncementManagement;
