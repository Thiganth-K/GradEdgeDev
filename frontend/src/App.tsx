import AdminWelcomePage from './pages/Admin/Welcome'
import AdminLogsPage from './pages/Admin/Logs'
import { postJson, getJson } from './lib/api'
import FacultyManage from './pages/Faculty/Manage'
import FacultyDashboard from './pages/Faculty/Dashboard'
import FacultyStudents from './pages/Faculty/Students'
import FacultyBatches from './pages/Faculty/Batches'


import { useEffect, useState, type ReactElement } from 'react'
import RecruiterWelcome from './pages/Recruiter/Welcome'
import LoginPage from './pages/Login'
import StudentDashboard from './pages/Student/Dashboard'
import StudentProfile from './pages/Student/Profile'
import InstitutionalWelcome from './pages/Institutional/Welcome'
import InstitutionalPage from './pages/Admin/Institutional'
import FacultyManagement from './pages/Institutional/FacultyManagement'
import BatchManagement from './pages/Institutional/BatchManagement'
import StudentManagement from './pages/Institutional/StudentManagement'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'

function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(!!localStorage.getItem('logged_in'))
  const [username, setUsername] = useState<string>(localStorage.getItem('username') || '')
  const [role, setRole] = useState<string>(localStorage.getItem('role') || '')
  
  // Persist facultyID to avoid async load delays on refresh
  const [facultyId, setFacultyId] = useState<string | null>(localStorage.getItem('faculty_id'))
  // Persist institutionalId (institutional_id field) for institutional dashboards
  const [institutionalId, setInstitutionalId] = useState<string | null>(localStorage.getItem('institutional_id'))
  
  const navigate = useNavigate()
  const [shouldAutoRedirect, setShouldAutoRedirect] = useState<boolean>(false)
  const location = useLocation()

  useEffect(() => {
    // Redirect logic: Run only if triggered by new login OR if user is at root
    if (!loggedIn) return

    // If we need facultyId but don't have it yet, wait (unless it's in localStorage already)
    if (role === 'faculty' && !facultyId) return

    if (shouldAutoRedirect) {
        if (role === 'faculty') navigate(`/faculty/${facultyId}/dashboard`)
        else if (role === 'student') navigate('/student/dashboard')
        else if (role === 'recruiter') navigate('/recruiter/welcome')
        else if (role === 'institutional') navigate('/institutional/welcome')
        else navigate('/admin/welcome')
        setShouldAutoRedirect(false)
    }
  }, [shouldAutoRedirect, loggedIn, role, facultyId, navigate])

  // Sync facultyId with localStorage and Fetch if missing
  useEffect(() => {
    async function loadFacultyId() {
      if (!loggedIn || role !== 'faculty' || !username) return
      
      // If we already have it in state (from localStorage), verify it matches or just use it.
      // But if it's missing, fetch it.
      if (facultyId) return 

      try {
        const res = await getJson<{ ok: boolean; data?: { faculty_id?: string } }>(`/api/faculty/${username}`)
        if (res.ok && res.data.ok && res.data.data?.faculty_id) {
          const fid = res.data.data.faculty_id
          setFacultyId(fid)
          localStorage.setItem('faculty_id', fid || '')
          // Trigger redirect if we were waiting for this
           if (location.pathname === '/' || location.pathname === '/login') {
               setShouldAutoRedirect(true) // Force re-eval
           }
        } else {
          setFacultyId(null)
        }
      } catch {
        setFacultyId(null)
      }
    }
    void loadFacultyId()
  }, [loggedIn, role, username, facultyId, location.pathname])

  // Sync institutionalId (institutional_id) with localStorage and fetch if missing
  useEffect(() => {
    async function loadInstitutionalId() {
      if (!loggedIn || role !== 'institutional' || !username) return

      if (institutionalId) return

      try {
        const res = await getJson<{ ok: boolean; data?: { institutional_id?: string } }>(`/api/institutional/${username}`)
        if (res.ok && res.data.ok && res.data.data?.institutional_id) {
          const instId = res.data.data.institutional_id
          setInstitutionalId(instId)
          localStorage.setItem('institutional_id', instId || '')
        } else {
          setInstitutionalId(null)
        }
      } catch {
        setInstitutionalId(null)
      }
    }
    void loadInstitutionalId()
  }, [loggedIn, role, username, institutionalId])

  function handleLoginSuccess(name: string, r?: string) {
    const userRole = r || 'admin'
    setUsername(name)
    setRole(userRole)
    // Clear cached IDs when logging in with a new role; they'll be re-fetched as needed
    if (r === 'faculty') {
      setFacultyId(null)
      localStorage.removeItem('faculty_id')
      setInstitutionalId(null)
      localStorage.removeItem('institutional_id')
    } else if (r === 'institutional') {
      setInstitutionalId(null)
      localStorage.removeItem('institutional_id')
      setFacultyId(null)
      localStorage.removeItem('faculty_id')
    } else {
      setFacultyId(null)
      localStorage.removeItem('faculty_id')
      setInstitutionalId(null)
      localStorage.removeItem('institutional_id')
    }
    
    setLoggedIn(true)
    
    localStorage.setItem('logged_in', 'true')
    localStorage.setItem('username', name)
    localStorage.setItem('role', userRole)
    
    setShouldAutoRedirect(true)
  }

  function handleLogout() {
    ;(async () => {
      try {
        await postJson('/api/auth/logout', { username, role })
      } catch (e) {}
    })()

    localStorage.removeItem('logged_in')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    localStorage.removeItem('faculty_id') // Clear faculty ID
    localStorage.removeItem('institutional_id') // Clear institutional ID
    
    setLoggedIn(false)
    setUsername('')
    setRole('')
    setFacultyId(null)
    setInstitutionalId(null)
    navigate('/')
  }

  // Common wrapper for protected faculty routes to avoid code duplication
  const ProtectedFacultyRoute = ({ children }: { children: ReactElement }) => {
      return loggedIn && role === 'faculty' ? children : <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Routes>
        <Route path="/" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        
        {/* Admin Routes */}
        <Route path="/admin/welcome" element={loggedIn && role === 'admin' ? <AdminWelcomePage username={username} onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/admin/logs" element={loggedIn && role === 'admin' ? <AdminLogsPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/admin/faculty" element={loggedIn && role === 'admin' ? <FacultyManage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/faculty/manage" element={loggedIn && role === 'admin' ? <FacultyManage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        
        {/* Faculty Routes */}
        <Route path="/faculty/:facultyId/dashboard" element={<ProtectedFacultyRoute><FacultyDashboard username={username} onLogout={handleLogout} /></ProtectedFacultyRoute>} />
        <Route path="/faculty/:facultyId/batches" element={<ProtectedFacultyRoute><FacultyBatches /></ProtectedFacultyRoute>} />
        <Route path="/faculty/:facultyId/students" element={<ProtectedFacultyRoute><FacultyStudents /></ProtectedFacultyRoute>} />
        <Route path="/faculty/:facultyId/schedule" element={<ProtectedFacultyRoute><FacultyDashboard username={username} onLogout={handleLogout} /></ProtectedFacultyRoute>} /> 
        <Route path="/faculty/:facultyId/welcome" element={<Navigate to={`/faculty/${facultyId}/dashboard`} />} />
        
        {/* Fallback for Faculty URL without ID (try to recover) */}
        <Route path="/faculty/welcome" element={loggedIn && role === 'faculty' && facultyId ? <Navigate to={`/faculty/${facultyId}/dashboard`} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />

        {/* Other Roles */}
        <Route path="/admin/institutional" element={loggedIn && role === 'admin' ? <InstitutionalPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/student/dashboard" element={loggedIn && role === 'student' ? <StudentDashboard username={username} onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/student/profile" element={loggedIn && role === 'student' ? <StudentProfile username={username} onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/recruiter/welcome" element={loggedIn && role === 'recruiter' ? <RecruiterWelcome username={username} onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route
          path="/institutional/welcome"
          element={
            loggedIn && role === 'institutional'
              ? <InstitutionalWelcome username={username} institutionalId={institutionalId || undefined} onLogout={handleLogout} />
              : <LoginPage onLoginSuccess={handleLoginSuccess} />
          }
        />
        <Route
          path="/institutional/faculty"
          element={
            loggedIn && role === 'institutional'
              ? <FacultyManagement username={username} institutionId={institutionalId || undefined} />
              : <LoginPage onLoginSuccess={handleLoginSuccess} />
          }
        />
        <Route
          path="/institutional/batch"
          element={
            loggedIn && role === 'institutional'
              ? <BatchManagement username={username} institutionId={institutionalId || undefined} />
              : <LoginPage onLoginSuccess={handleLoginSuccess} />
          }
        />
        <Route
          path="/institutional/students"
          element={
            loggedIn && role === 'institutional'
              ? <StudentManagement username={username} institutionId={institutionalId || undefined} />
              : <LoginPage onLoginSuccess={handleLoginSuccess} />
          }
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
