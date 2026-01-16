import React from 'react';
import InstitutionSidebar from '../../components/Institution/Sidebar';
import InstitutionAnnouncements from '../../components/Institution/Announcements';
import { AnnouncementForm } from './AnnouncementCreate';

const AnnouncementsPage: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      <InstitutionSidebar />
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
                  <h1 className="text-2xl font-bold text-white">Announcements</h1>
                  <p className="text-red-100 text-sm">Create and broadcast announcements to your institution</p>
                </div>
              </div>
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
            <div className="p-6">
              <AnnouncementForm />
            </div>
          </div>

          {/* Announcements History */}
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
              <InstitutionAnnouncements />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnnouncementsPage;
