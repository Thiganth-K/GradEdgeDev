import React from 'react'
import PerformanceOverview from '../../components/Student/PerformanceOverview.tsx'
import AnnouncementPanel from '../../components/Student/AnnouncementPanel.tsx'
import NoticeBoard from '../../components/Student/NoticeBoard.tsx'
import Notifications from '../../components/Student/Notifications.tsx'

const Dashboard: React.FC = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Student Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PerformanceOverview />
          <NoticeBoard />
        </div>

        <aside className="space-y-6">
          <AnnouncementPanel />
          <Notifications />
        </aside>
      </div>
    </div>
  )
}

export default Dashboard