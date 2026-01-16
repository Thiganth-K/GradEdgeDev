import React, { useState } from 'react';
import InstitutionSidebar from '../../components/Institution/Sidebar';
import InstitutionAnnouncements from '../../components/Institution/Announcements';
import { AnnouncementForm } from './AnnouncementCreate';

const AnnouncementsPage: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstitutionSidebar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Announcements</h1>
                <p className="text-sm text-gray-500">Create, view and manage announcements for your institution.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Create Announcement
                </button>
              </div>
            </div>

            <div className="mt-4">
              <InstitutionAnnouncements />
            </div>
          </div>
        </div>
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create Announcement</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>
            <div className="p-4">
              <AnnouncementForm compact onSent={() => setShowCreate(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
