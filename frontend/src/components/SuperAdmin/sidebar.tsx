import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HiOutlineHome, HiOutlineUsers, HiOutlineClipboardList, HiOutlineChartBar, HiOutlineLogout } from 'react-icons/hi'
import { HiAcademicCap } from 'react-icons/hi2'

const items = [
  { key: 'overview', label: 'Overview', to: '/superadmin/dashboard', icon: <HiOutlineHome className="h-5 w-5" /> },
  { key: 'admins', label: 'Admin Management', to: '/superadmin/admins', icon: <HiOutlineUsers className="h-5 w-5" /> },
  { key: 'logs', label: 'View Logs', to: '/superadmin/logs', icon: <HiOutlineClipboardList className="h-5 w-5" /> },
  { key: 'vitals', label: 'System Vitals', to: '/superadmin/system-vitals', icon: <HiOutlineChartBar className="h-5 w-5" /> },
]

const Sidebar: React.FC = () => {
  const loc = useLocation()
  const navigate = useNavigate()

  const signOut = () => {
    localStorage.removeItem('gradedge_role')
    localStorage.removeItem('superadmin_token')
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_data')
    window.location.href = '/login'
  }

  return (
    <aside className="hidden md:block w-72 pr-6">
      <div className="sticky top-6"> 
        <div className="mb-6">
          <div className="glass-card inline-flex items-center gap-3 px-4 py-2 ring-1 ring-white/10 bg-white/5 rounded-lg">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-red-700">
              <HiAcademicCap className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide text-white">GradEdgeDev</div>
              <div className="text-xs text-white/70">Super Admin</div>
            </div>
          </div>
        </div>

        <nav className="bg-white/5 rounded-xl p-3">
          <ul className="space-y-1">
            {items.map((it) => {
              const active = loc.pathname === it.to
              return (
                <li key={it.key}>
                  <Link to={it.to} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${active ? 'bg-red-600 text-white' : 'text-white/90 hover:bg-white/5'}`}>
                    <span className="text-inherit">{it.icon}</span>
                    <span className="font-medium">{it.label}</span>
                  </Link>
                </li>
              )
            })}
            <li>
              <button onClick={signOut} className="mt-3 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/5">
                <HiOutlineLogout className="h-5 w-5" />
                <span className="font-medium">Log out</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
