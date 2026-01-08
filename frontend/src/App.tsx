import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/SuperAdmin/Dashboard'
import InstitutionManagement from './pages/SuperAdmin/InstitutionManagement'
import ViewLogs from './pages/SuperAdmin/ViewLogs'
import AdminDashboard from './pages/Admin/Dashboard'
import AdminInstitutionManagement from './pages/Admin/InstitutionManagement'
import AdminViewLogs from './pages/Admin/ViewLogs'
import InstitutionDashboard from './pages/Institution/Dashboard'
import FacultyManagement from './pages/Institution/FacultyManagement'
import StudentManagement from './pages/Institution/StudentManagement'
import BatchManagement from './pages/Institution/BatchManagement'
import TestManagement from './pages/Institution/TestManagement'
import FacultyDashboard from './pages/Faculty/Dashboard'
import FacultyTestResults from './pages/Faculty/TestResults'
import StudentDashboard from './pages/Student/Dashboard'
import StudentTest from './pages/Student/Test'
import './App.css'

const App: React.FC = () => {
  return (
    <div>
      <nav className="p-4 bg-white shadow">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-xl font-bold text-red-700">GradEdgeDev</div>
          <div className="space-x-3">
            <Link to="/login" className="text-sm text-gray-700">Login</Link>
            <Link to="/superadmin/dashboard" className="text-sm text-gray-700">Dashboard</Link>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/superadmin/dashboard" element={<Dashboard />} />
        <Route path="/superadmin/institutions" element={<InstitutionManagement />} />
        <Route path="/superadmin/logs" element={<ViewLogs />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/institutions" element={<AdminInstitutionManagement />} />
        <Route path="/admin/logs" element={<AdminViewLogs />} />
        <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
        <Route path="/institution/faculties" element={<FacultyManagement />} />
        <Route path="/institution/students" element={<StudentManagement />} />
        <Route path="/institution/batches" element={<BatchManagement />} />
        <Route path="/institution/tests" element={<TestManagement />} />
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty/test/:id/results" element={<FacultyTestResults />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/test/:id" element={<StudentTest />} />
        <Route path="*" element={<div className="p-8">Page not found</div>} />
      </Routes>
    </div>
  )
}

export default App
