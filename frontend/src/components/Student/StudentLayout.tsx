import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Brain, Code, MessageSquare, BookOpen, Rocket, History, User, LogOut, HelpCircle } from 'lucide-react'

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
    { icon: BookOpen, label: 'Take MCQ Test', path: '/student/tests' },
    { icon: History, label: 'Assessment History', path: '/student/history' },
    { icon: HelpCircle, label: 'Help Center', path: '/help' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-screen z-20">
        {/* Logo */}
        <div className="p-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Grad<span className="text-red-600">Edge</span>
            </h1>
            <span className="text-label-strong text-gray-400 ml-0.5">
              Student Portal
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto">
          <div className="mb-2 px-4">
            <span className="text-label-strong text-gray-400">Menu</span>
          </div>
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${active
                    ? 'bg-red-50 text-red-700 font-bold'
                    : 'text-gray-500 hover:bg-red-50 hover:text-red-600 font-medium'
                    }`}
                >
                  {/* Active Indicator Strip */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-red-600 rounded-r-full"></div>
                  )}

                  <Icon className={`w-5 h-5 transition-colors ${active ? 'text-red-600' : 'text-gray-400 group-hover:text-red-600'}`} />
                  <span className="text-sm">{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => navigate('/student/profile')}
            className="w-full flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors mb-2 group"
          >
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs border border-red-100 group-hover:bg-red-100 transition-colors">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 flex-1 text-left">
              <p className="text-sm font-medium text-gray-700 group-hover:text-red-700">{username}</p>
              <p className="text-[10px] text-gray-400 group-hover:text-red-400">View Profile</p>
            </div>
            <User className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors group"
          >
            <LogOut className="w-5 h-5 transition-colors duration-200 group-hover:text-red-600" />
            <span className="text-sm font-medium">Logout</span>
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
