import AdminWelcomePage from './pages/Admin/Welcome'
import AdminLogsPage from './pages/Admin/Logs'
import { postJson, getJson } from './lib/api'
import FacultyManage from './pages/Faculty/Manage'
import FacultyWelcome from './pages/Faculty/Welcome'
import { useEffect, useState } from 'react'
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
  const [facultyId, setFacultyId] = useState<string | null>(null)
  const navigate = useNavigate()
  // Controls whether the app should perform the automatic role-based redirect.
  // We only enable this immediately after a successful login to avoid redirecting
  // on a fresh frontend start when a previous session exists in localStorage.
  const [shouldAutoRedirect, setShouldAutoRedirect] = useState<boolean>(false)

  const location = useLocation()

  useEffect(() => {
    // Only perform the automatic redirect when triggered by a new login in this
    // session (shouldAutoRedirect). This prevents redirecting on dev server
    // start or page reloads when `logged_in` remains in localStorage.
    if (!shouldAutoRedirect) return
    if (!loggedIn) return

    // For faculty, wait until we have facultyId (prefix + name) so the URL uses facultyId, not username.
    if (role === 'faculty' && !facultyId) return

    const p = location.pathname || '/'
    if (p === '/' || p === '/login') {
      if (role === 'faculty') navigate(`/faculty/${facultyId}/welcome`)
      else if (role === 'student') navigate('/student/dashboard')
      else if (role === 'recruiter') navigate('/recruiter/welcome')
      else if (role === 'institutional') navigate('/institutional/welcome')
      else navigate('/admin/welcome')
    } else if (role === 'student' && !p.startsWith('/student/')) {
      // Always redirect students to dashboard if they're not already on a student page
      navigate('/student/dashboard')
    }
    // reset flag after performing redirect once
    setShouldAutoRedirect(false)
  }, [shouldAutoRedirect, loggedIn, role, facultyId, username, location.pathname, navigate])

  // Fetch faculty details to obtain faculty_id (includes institutional prefix) when faculty logs in.
  useEffect(() => {
    async function loadFacultyId() {
      if (!loggedIn || role !== 'faculty' || !username) return
      try {
        const res = await getJson<{ ok: boolean; data?: { faculty_id?: string } }>(`/api/faculty/${username}`)
        if (res.ok && res.data.ok && res.data.data?.faculty_id) {
          setFacultyId(res.data.data.faculty_id)
        } else {
          setFacultyId(null)
        }
      } catch {
        setFacultyId(null)
      }
    }
    void loadFacultyId()
  }, [loggedIn, role, username])

  function handleLoginSuccess(name: string, r?: string) {
    const userRole = r || 'admin'
    setUsername(name)
    setRole(userRole)
    if (r === 'faculty') setFacultyId(null)
    setLoggedIn(true)
    
    // Persist login state to localStorage
    localStorage.setItem('logged_in', 'true')
    localStorage.setItem('username', name)
    localStorage.setItem('role', userRole)
    
    // enable the auto-redirect for this freshly completed login
    setShouldAutoRedirect(true)
  }

  function handleLogout() {
    // notify backend (best-effort) so logout event is recorded
    ;(async () => {
      try {
        await postJson('/api/auth/logout', { username, role })
      } catch (e) {
        // ignore errors — logout should proceed locally regardless
      }
    })()

    localStorage.removeItem('logged_in')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    setLoggedIn(false)
    setUsername('')
    setRole('')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Routes>
        <Route path="/" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route
          path="/admin/welcome"
          element={
            loggedIn && role === 'admin' ? (
              <AdminWelcomePage username={username} onLogout={handleLogout} />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/admin/logs"
          element={
            loggedIn && role === 'admin' ? (
              <AdminLogsPage />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route path="/admin/faculty" element={loggedIn && role === 'admin' ? <FacultyManage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/faculty/manage" element={loggedIn && role === 'admin' ? <FacultyManage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route
          path="/faculty/:facultyId/welcome"
          element={
            loggedIn && role === 'faculty' ? (
              <FacultyWelcome username={username} onLogout={handleLogout} />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        {/* Backward compatibility redirect */}
        <Route
          path="/faculty/welcome"
          element={
            loggedIn && role === 'faculty' && facultyId ? (
              <Navigate to={`/faculty/${facultyId}/welcome`} />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route path="/admin/institutional" element={loggedIn && role === 'admin' ? <InstitutionalPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/student/dashboard" element={loggedIn && role === 'student' ? <StudentDashboard username={username} onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/student/profile" element={loggedIn && role === 'student' ? <StudentProfile username={username} onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/recruiter/welcome" element={loggedIn && role === 'recruiter' ? <RecruiterWelcome username={username} onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/institutional/welcome" element={loggedIn && role === 'institutional' ? <InstitutionalWelcome username={username} onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/institutional/faculty" element={loggedIn && role === 'institutional' ? <FacultyManagement username={username} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/institutional/batch" element={loggedIn && role === 'institutional' ? <BatchManagement username={username} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/institutional/students" element={loggedIn && role === 'institutional' ? <StudentManagement username={username} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
