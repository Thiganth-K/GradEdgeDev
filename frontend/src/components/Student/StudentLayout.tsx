import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Brain, Code, MessageSquare, BookOpen, Rocket, History, User, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'

interface StudentLayoutProps {
  children: React.ReactNode
  username: string
  onLogout: () => void
  isCollapsed: boolean
  toggleCollapse: () => void
  isMobileOpen: boolean
  setIsMobileOpen: (isOpen: boolean) => void
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ 
  children, 
  username, 
  onLogout,
  isCollapsed,
  toggleCollapse,
  isMobileOpen,
  setIsMobileOpen
}) => {
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
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-100 transition-all duration-300 flex flex-col h-screen
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'} 
          ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-64'}
        `}
      >
        {/* Logo */}
        <div className={`p-8 ${isCollapsed ? 'px-4' : ''}`}>
          {isCollapsed ? (
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl cursor-pointer mx-auto">
              G
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Grad<span className="text-red-600">Edge</span>
              </h1>
              <span className="text-label-strong text-gray-400 ml-0.5">
                Student Portal
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto">
          {!isCollapsed && (
            <div className="mb-2 px-4">
              <span className="text-label-strong text-gray-400">Menu</span>
            </div>
          )}
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setIsMobileOpen(false)
                  }}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                    active
                      ? 'bg-red-50 text-red-700 font-bold'
                      : 'text-gray-500 hover:bg-red-50 hover:text-red-600 font-medium'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  {/* Active Indicator Strip */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-red-600 rounded-r-full"></div>
                  )}

                  <Icon className={`w-5 h-5 transition-colors flex-shrink-0 ${active ? 'text-red-600' : 'text-gray-400 group-hover:text-red-600'}`} />
                  {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Collapse Toggle (Desktop Only) */}
        <div className="hidden lg:flex p-4 border-t border-gray-100 justify-end">
          <button 
            onClick={toggleCollapse}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100">
          {!isCollapsed ? (
            <>
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
                <LogOut className="w-5 h-5 group-hover:text-red-600" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/student/profile')}
                className="w-full flex justify-center p-2 rounded-lg hover:bg-red-50 transition-colors mb-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs border border-red-100 group-hover:bg-red-100 transition-colors">
                  {username.charAt(0).toUpperCase()}
                </div>
              </button>
              <button
                onClick={onLogout}
                className="w-full flex justify-center px-4 py-3 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors group"
              >
                <LogOut className="w-5 h-5 group-hover:text-red-600" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-[88px]' : 'lg:ml-64'}`}>
        {children}
      </div>
    </div>
  )
}

export default StudentLayout
