import './App.css'
import AdminWelcomePage from './pages/Admin/Welcome'
import { postJson } from './lib/api'
import FacultyManage from './pages/Faculty/Manage'
import FacultyWelcome from './pages/Faculty/Welcome'
import { useEffect, useState } from 'react'
import StudentWelcome from './pages/Student/Welcome'
import RecruiterWelcome from './pages/Recruiter/Welcome'
import LoginPage from './pages/Login'
import StudentDashboard from './pages/Student/Dashboard'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'

function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(!!localStorage.getItem('logged_in'))
  const [username, setUsername] = useState<string>(localStorage.getItem('username') || '')
  const [role, setRole] = useState<string>(localStorage.getItem('role') || '')
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
    const p = location.pathname || '/'
    if (p === '/' || p === '/login') {
      if (role === 'faculty') navigate('/faculty/welcome')
      else if (role === 'student') navigate('/student/welcome')
      else if (role === 'recruiter') navigate('/recruiter/welcome')
      else navigate('/admin/welcome')
    }
    // reset flag after performing redirect once
    setShouldAutoRedirect(false)
  }, [shouldAutoRedirect, loggedIn, role, location.pathname, navigate])

  function handleLoginSuccess(name: string, r?: string) {
    setUsername(name)
    setRole(r || 'admin')
    setLoggedIn(true)
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
        <Route path="/admin/faculty" element={loggedIn && role === 'admin' ? <FacultyManage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/faculty/manage" element={loggedIn && role === 'admin' ? <FacultyManage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/faculty/welcome" element={loggedIn && role === 'faculty' ? <FacultyWelcome username={username} onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/student/welcome" element={loggedIn && role === 'student' ? <StudentWelcome username={username} onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/student/dashboard" element={loggedIn && role === 'student' ? <StudentDashboard /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/recruiter/welcome" element={loggedIn && role === 'recruiter' ? <RecruiterWelcome username={username} onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
