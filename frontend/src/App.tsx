import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/SuperAdmin/Dashboard'
import InstitutionManagement from './pages/SuperAdmin/InstitutionManagement'
import ViewLogs from './pages/SuperAdmin/ViewLogs'
import AdminManagement from './pages/SuperAdmin/AdminManagement'
import SystemVitals from './pages/SuperAdmin/SystemVitals'
import AdminDashboard from './pages/Admin/Dashboard'
import AdminInstitutionManagement from './pages/Admin/InstitutionManagement'
import AdminViewLogs from './pages/Admin/ViewLogs'
import AdminAnnouncementManagement from './pages/Admin/AnnouncementManagement'
import AdminContributorManagement from './pages/Admin/ContributorManagement'
import InstitutionChatAdmin from './pages/Admin/InstitutionChat'
import InstitutionChat from './pages/Institution/Chat'
import ChatWithAdmin from './pages/Institution/ChatWithAdmin'
import InstitutionDashboard from './pages/Institution/Dashboard'
import InstitutionAnnouncementCreate from './pages/Institution/AnnouncementCreate'
import FacultyManagement from './pages/Institution/FacultyManagement'
import StudentManagement from './pages/Institution/StudentManagement'
import BatchManagement from './pages/Institution/BatchManagement'
import TestManagement from './pages/Institution/TestManagement'
import FacultyDashboard from './pages/Faculty/Dashboard'
import FacultyChat from './pages/Faculty/Chat'
import FacultyTestResults from './pages/Faculty/TestResults'
import FacultyAnnouncements from './pages/Faculty/Announcements'
import StudentDashboard from './pages/Student/Dashboard'
import StudentTest from './pages/Student/Test'
import StudentAnnouncements from './pages/Student/Announcements'
import ContributorDashboard from './pages/Contributor/Dashboard'
import UnifiedContributionRequest from './pages/Contributor/UnifiedContributionRequest'
import ContributorChat from './pages/Contributor/Chat'
import AdminContributorRequestManagement from './pages/Admin/ContributorRequestManagement'
import AdminContributorChatManagement from './pages/Admin/ContributorChatManagement'
import './App.css'

const App: React.FC = () => {
  return (
    <div>
      

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/superadmin/dashboard" element={<Dashboard />} />
        <Route path="/superadmin/institutions" element={<InstitutionManagement />} />
        <Route path="/superadmin/admins" element={<AdminManagement />} />
        <Route path="/superadmin/logs" element={<ViewLogs />} />
        <Route path="/superadmin/system-vitals" element={<SystemVitals />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/institutions" element={<AdminInstitutionManagement />} />
        <Route path="/admin/logs" element={<AdminViewLogs />} />
        <Route path="/admin/announcements" element={<AdminAnnouncementManagement />} />
        <Route path="/admin/contributors" element={<AdminContributorManagement />} />
        <Route path="/admin/institution/:id/chat" element={<InstitutionChatAdmin />} />
        <Route path="/institution/chat" element={<InstitutionChat />} />
        <Route path="/institution/admin-chat" element={<ChatWithAdmin />} />
        <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
        <Route path="/institution/announcements/create" element={<InstitutionAnnouncementCreate />} />
        <Route path="/institution/faculties" element={<FacultyManagement />} />
        <Route path="/institution/students" element={<StudentManagement />} />
        <Route path="/institution/batches" element={<BatchManagement />} />
        <Route path="/institution/tests" element={<TestManagement />} />
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty/test/:id/results" element={<FacultyTestResults />} />
        <Route path="/faculty/announcements" element={<FacultyAnnouncements />} />
        <Route path="/faculty/chat" element={<FacultyChat />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/test/:id" element={<StudentTest />} />
        <Route path="/student/announcements" element={<StudentAnnouncements />} />
        <Route path="/contributor/dashboard" element={<ContributorDashboard />} />
        <Route path="/contributor/create-request" element={<UnifiedContributionRequest />} />
        <Route path="/contributor/chat" element={<ContributorChat />} />
        <Route path="/admin/contributor-requests" element={<AdminContributorRequestManagement />} />
        <Route path="/admin/contributor-chats" element={<AdminContributorChatManagement />} />
        <Route path="*" element={<div className="p-8">Page not found</div>} />
      </Routes>
    </div>
  )
}

export default App
