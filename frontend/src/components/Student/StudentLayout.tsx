import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Brain, Code, MessageSquare, BookOpen, Rocket, History, LogOut } from 'lucide-react'

interface StudentLayoutProps {
  children: React.ReactNode
  username: string
  onLogout: () => void
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children, username, onLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
    { icon: Brain, label: 'Aptitude & Logic', path: '/student/aptitude' },
    { icon: Code, label: 'Coding & Tech', path: '/student/coding' },
    { icon: MessageSquare, label: 'Soft Skills', path: '/student/soft-skills' },
    { icon: BookOpen, label: 'Domain Knowledge', path: '/student/domain' },
    { icon: Rocket, label: 'Project Sim', path: '/student/project-sim' },
    { icon: History, label: 'Assessment History', path: '/student/history' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-red-800 to-red-900 text-white flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-red-800" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <span className="text-xl font-bold">GradEdge+</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors ${
                  active
                    ? 'bg-red-700 text-white'
                    : 'text-red-100 hover:bg-red-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-red-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center">
              <span className="text-sm font-semibold">{username.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{username}</div>
              <div className="text-xs text-red-200">Student</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-100 hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  )
}

export default StudentLayout
