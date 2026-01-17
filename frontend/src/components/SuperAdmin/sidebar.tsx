import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaChartPie, 
  FaUniversity, 
  FaUserShield, 
  FaClipboardList, 
  FaHeartbeat,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('superadmin_sidebar_collapsed');
    return saved === 'true';
  });

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('superadmin_sidebar_collapsed', String(newState));
  };

  const handleSignOut = () => {
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('gradedge_role');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/superadmin/dashboard', icon: <FaChartPie /> },
    { name: 'Institutions', path: '/superadmin/institutions', icon: <FaUniversity /> },
    { name: 'Admin Management', path: '/superadmin/admins', icon: <FaUserShield /> },
    { name: 'View Logs', path: '/superadmin/logs', icon: <FaClipboardList /> },
    { name: 'System Vitals', path: '/superadmin/system-vitals', icon: <FaHeartbeat /> }
  ];

  return (
    <div className={`min-h-screen flex flex-col bg-[#0d0d0d] ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 shadow-lg`}>
      {/* Top: logo + collapse control */}
      <div className="relative p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold">G</span>
          </div>
          {!isCollapsed && <span className="text-white text-lg font-semibold tracking-tight">GradEdge</span>}
        </div>

        {/* Collapse toggle - circular red button overlapping edge */}
        <button
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Open sidebar' : 'Close sidebar'}
          className="absolute -right-3 top-4 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg border-2 border-[#0d0d0d]"
        >
          {isCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/superadmin/dashboard' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center gap-4 transition-all duration-200 ${
                isCollapsed 
                  ? isActive 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg rounded-full w-12 h-12 mx-auto justify-center' 
                    : 'text-white/70 hover:bg-red-700/20 hover:text-white rounded-lg w-12 h-12 mx-auto justify-center'
                  : isActive 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg rounded-full w-full px-3 py-3'
                    : 'text-white/70 hover:bg-red-700/20 hover:text-white rounded-lg w-full px-3 py-3'
              }`} 
            >
              {/* active left marker */}
              {isActive && !isCollapsed && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/30 rounded-full" />
              )}

              <div className={`shrink-0 flex items-center justify-center ${isCollapsed ? '' : 'w-8 h-8 rounded-md'}`}>
                <span className={`text-white ${isActive ? 'text-lg' : 'text-lg'}`}>{item.icon}</span>
              </div>

              {!isCollapsed && <span className="text-sm font-medium pl-1">{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer / profile */}
      <div className="p-4 border-t border-black/40 mt-auto">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-white font-semibold">S</div>
          {!isCollapsed && (
            <div className="flex-1">
              <div className="text-sm text-white font-medium">Super Admin</div>
              <button onClick={handleSignOut} className="mt-1 text-xs text-gray-300 hover:text-white flex items-center gap-2">
                <FaSignOutAlt size={12} /> Sign Out
              </button>
            </div>
          )}
        </div>

        {isCollapsed && (
          <div className="mt-3 flex justify-center">
            <button onClick={handleSignOut} className="text-gray-300 hover:text-white text-sm" title="Sign out">
              <FaSignOutAlt />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
