import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Layers,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle
} from 'lucide-react'

type Props = {
  facultyId: string
  onLogout: () => void
  isCollapsed: boolean
  toggleCollapse: () => void
  isMobileOpen: boolean
  setIsMobileOpen: (isOpen: boolean) => void
}

export default function FacultySidebar({
  facultyId,
  onLogout,
  isCollapsed,
  toggleCollapse,
  isMobileOpen,
  setIsMobileOpen
}: Props) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname.includes(path)

  const NavItem = ({ to, icon: Icon, label, activePath, badge }: any) => {
    const active = isActive(activePath)
    return (
      <Link
        to={to}
        onClick={() => setIsMobileOpen(false)}
        className={`flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-300 group relative
          ${active
            ? 'text-slate-900 font-bold'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
      >
        {/* Active Indicator (Left styling matching reference) */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 bg-[#EA0029] rounded-r-full" />
        )}

        <Icon size={22} className={`transition-colors flex-shrink-0 ${active ? 'text-[#EA0029]' : 'text-slate-400 group-hover:text-slate-600'}`} />

        {!isCollapsed && (
          <span className="truncate">{label}</span>
        )}

        {badge && !isCollapsed && (
          <span className="ml-auto bg-[#111827] text-white text-[10px] font-bold px-2 py-1 rounded-md">{badge}</span>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-slate-100 transition-all duration-300 flex flex-col
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'} 
          ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-72'}
        `}
      >
        {/* Logo Section */}
        <div className={`h-24 flex items-center ${isCollapsed ? 'justify-center' : 'px-8'}`}>
          {isCollapsed ? (
            <div className="w-10 h-10 bg-[#EA0029] rounded-xl flex items-center justify-center text-white font-bold text-xl cursor-copy">
              G
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Grad<span className="text-[#EA0029]">Edge</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-1">Faculty Portal</p>
            </div>
          )}
        </div>

         {/* Navigation */}
         <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
            
            {/* Main Menu */}
            <div>
               {!isCollapsed && (
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Menu</h3>
               )}
               <div className="space-y-1">
                  <NavItem to={`/faculty/${facultyId}/dashboard`} icon={LayoutDashboard} label="Dashboard" activePath="/dashboard" />
                  <NavItem to={`/faculty/${facultyId}/batches`} icon={Layers} label="Batches" activePath="/batches" />
                  <NavItem to={`/faculty/${facultyId}/students`} icon={Users} label="Students" activePath="/students" />
                  <NavItem to={`/faculty/${facultyId}/tests`} icon={Layers} label="Tests" activePath="/tests" />
                  {/* Reuse NavItem for other placeholder links if needed */}
               </div>
            </div>

          {/* General Settings */}
          <div>
            {!isCollapsed && (
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">General</h3>
            )}
            <div className="space-y-1">
              <NavItem to="#" icon={Settings} label="Settings" activePath="/settings" />
              <NavItem to="/help" icon={HelpCircle} label="Help Center" activePath="/help" />
            </div>
          </div>
        </div>

        {/* Collapse Toggle (Desktop Only) */}
        <div className="hidden lg:flex p-4 border-t border-slate-50 justify-end">
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-50">
          <button
            onClick={onLogout}
            className={`flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="transition-colors duration-200" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
