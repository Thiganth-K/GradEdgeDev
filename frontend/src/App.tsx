import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/SuperAdmin/Dashboard'
import InstitutionManagement from './pages/SuperAdmin/InstitutionManagement'
import ViewLogs from './pages/SuperAdmin/ViewLogs'
import AdminManagement from './pages/SuperAdmin/AdminManagement'
import SystemVitals from './pages/SuperAdmin/SystemVitals'
import SuperAdminAdminChatManagement from './pages/SuperAdmin/AdminChatManagement'
import AdminDashboard from './pages/Admin/Dashboard'
import AdminInstitutionManagement from './pages/Admin/InstitutionManagement'
import AdminCreateInstitution from './pages/Admin/CreateInstitution'
import AdminViewLogs from './pages/Admin/ViewLogs'
import AdminAnnouncementManagement from './pages/Admin/AnnouncementManagement'
import AdminContributorManagement from './pages/Admin/ContributorManagement'
import AdminCreateContributor from './pages/Admin/CreateContributor'
import InstitutionChatAdmin from './pages/Admin/InstitutionChat'
import InstitutionChat from './pages/Institution/Chat'
import ChatWithAdmin from './pages/Institution/ChatWithAdmin'
import InstitutionDashboard from './pages/Institution/Dashboard'
import InstitutionAnnouncementCreate from './pages/Institution/AnnouncementCreate'
import InstitutionAnnouncements from './pages/Institution/Announcements'
import InstitutionLibrary from './pages/Institution/Library'
import FacultyManagement from './pages/Institution/FacultyManagement'
import StudentManagement from './pages/Institution/StudentManagement'
import BatchManagement from './pages/Institution/BatchManagement'
import TestManagement from './pages/Institution/TestManagement'
import TestCreateDetails from './pages/Institution/TestCreateDetails'
import TestCreateQuestions from './pages/Institution/TestCreateQuestions'
import FacultyDashboard from './pages/Faculty/Dashboard'
import FacultyAssignedTests from './pages/Faculty/AssignedTests'
import FacultyTestList from './pages/Faculty/FacultyTestList'
import FacultyChat from './pages/Faculty/Chat'
import FacultyTestResults from './pages/Faculty/TestResults'
import FacultyAnnouncements from './pages/Faculty/Announcements'
import FacTestCreateDetails from './pages/Faculty/TestCreateDetails'
import FacTestCreateQuestions from './pages/Faculty/TestCreateQuestions'
import FacultyTestEdit from './pages/Faculty/FacultyTestEdit'
import StudentDashboard from './pages/Student/Dashboard'
import StudentTest from './pages/Student/Test'
import StudentAnnouncements from './pages/Student/Announcements'
import StudentTests from './pages/Student/Tests'
import StudentResults from './pages/Student/Results'
import StudentProfile from './pages/Student/Profile'
import StudentWorkInProgress from './pages/Student/WorkInProgress'
import StudentSandbox from './pages/Student/Sandbox'
import CodingTestAttempt from './pages/Student/CodingTestAttempt'
import ContributorDashboard from './pages/Contributor/Dashboard'
import UnifiedContributionRequest from './pages/Contributor/UnifiedContributionRequest'
import ContributorChat from './pages/Contributor/Chat'
import ContributorLibrary from './pages/Contributor/Library'
import PlacementReadyQuestions from './pages/Contributor/PlacementReadyQuestions'
import AdminContributorRequestManagement from './pages/Admin/ContributorRequestManagement'
import AdminContributorChatManagement from './pages/Admin/ContributorChatManagement'
import AdminSuperadminChatManagement from './pages/Admin/SuperadminChatManagement'
import AdminLibraryManagement from './pages/Admin/LibraryManagement'
import PendingContributorQuestions from './pages/Admin/PendingContributorQuestions'
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
        <Route path="/superadmin/admins/create" element={<AdminManagement />} />
        <Route path="/superadmin/admins/edit" element={<AdminManagement />} />
        <Route path="/superadmin/logs" element={<ViewLogs />} />
        <Route path="/superadmin/system-vitals" element={<SystemVitals />} />
        <Route path="/superadmin/admin-chats" element={<SuperAdminAdminChatManagement />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/institutions" element={<AdminInstitutionManagement />} />
        <Route path="/admin/institutions/create" element={<AdminCreateInstitution />} />
        <Route path="/admin/logs" element={<AdminViewLogs />} />
        <Route path="/admin/announcements" element={<AdminAnnouncementManagement />} />
        <Route path="/admin/contributors" element={<AdminContributorManagement />} />
        <Route path="/admin/contributors/create" element={<AdminCreateContributor />} />
        <Route path="/admin/contributors/edit/:id" element={<AdminCreateContributor />} />
        <Route path="/admin/institution/:id/chat" element={<InstitutionChatAdmin />} />
        <Route path="/institution/chat" element={<InstitutionChat />} />
        <Route path="/institution/admin-chat" element={<ChatWithAdmin />} />
        <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
        <Route path="/institution/announcements" element={<InstitutionAnnouncements />} />
        <Route path="/institution/announcements/create" element={<InstitutionAnnouncementCreate />} />
        <Route path="/institution/library" element={<InstitutionLibrary />} />
        <Route path="/institution/faculties" element={<FacultyManagement />} />
        <Route path="/institution/students" element={<StudentManagement />} />
        <Route path="/institution/batches" element={<BatchManagement />} />
        <Route path="/institution/tests" element={<TestManagement />} />
        <Route path="/institution/tests/create" element={<TestCreateDetails />} />
        <Route path="/institution/tests/create/questions" element={<TestCreateQuestions />} />
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty/assignedtests" element={<FacultyAssignedTests />} />
        <Route path="/faculty/tests" element={<FacultyTestList />} />
        <Route path="/faculty/tests/create" element={<FacTestCreateDetails />} />
        <Route path="/faculty/tests/create/questions" element={<FacTestCreateQuestions />} />
        <Route path="/faculty/tests/:id/edit" element={<FacultyTestEdit />} />
        <Route path="/faculty/test/:id/results" element={<FacultyTestResults />} />
        <Route path="/faculty/announcements" element={<FacultyAnnouncements />} />
        <Route path="/faculty/chat" element={<FacultyChat />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/tests" element={<StudentTests />} />
        <Route path="/student/test/:id" element={<StudentTest />} />
        <Route path="/student/announcements" element={<StudentAnnouncements />} />
        <Route path="/student/results" element={<StudentResults />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/wip/:section" element={<StudentWorkInProgress />} />
        <Route path="/student/sandbox" element={<StudentSandbox />} />
        <Route path="/student/test/:testId/attempt" element={<CodingTestAttempt />} />
        <Route path="/contributor/dashboard" element={<ContributorDashboard />} />
        <Route path="/contributor/placement-questions" element={<PlacementReadyQuestions />} />
        <Route path="/contributor/create-request" element={<UnifiedContributionRequest />} />
        <Route path="/contributor/chat" element={<ContributorChat />} />
        <Route path="/contributor/library" element={<ContributorLibrary />} />
        <Route path="/admin/contributor-requests" element={<AdminContributorRequestManagement />} />
        <Route path="/admin/contributor-chats" element={<AdminContributorChatManagement />} />
        <Route path="/admin/superadmin-chats" element={<AdminSuperadminChatManagement />} />
        <Route path="/admin/library" element={<AdminLibraryManagement />} />
        <Route path="/admin/pending-questions" element={<PendingContributorQuestions />} />
        <Route path="*" element={<div className="p-8">Page not found</div>} />
      </Routes>
    </div>
  )
}

export default App
