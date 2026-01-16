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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
<<<<<<< Updated upstream
    <div className="w-64 bg-gradient-to-b from-red-800 to-red-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-red-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
=======
    <div 
      className={`
        relative flex flex-col min-h-screen bg-[#1a1a1a] text-gray-300 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 transition-colors z-50"
      >
        {isCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
      </button>

      {/* Logo Section */}
      <div className="p-6 mb-2">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">G</span>
>>>>>>> Stashed changes
          </div>
          {!isCollapsed && (
            <span className="text-white text-xl font-bold tracking-wide">GradEdge</span>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/superadmin/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-gradient-to-r from-red-600 to-red-900 text-white shadow-lg shadow-red-900/20' 
                  : 'hover:bg-gray-800 hover:text-white'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <div className={`text-lg ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                {item.icon}
              </div>
              
              {!isCollapsed && (
                <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-800 mt-auto">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center shrink-0 text-white font-semibold">
            S
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Super Admin</p>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 mt-1 transition-colors"
              >
                <FaSignOutAlt size={10} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Collapsed Sign Out */}
        {isCollapsed && (
            <button 
            onClick={handleSignOut}
            className="w-full mt-4 flex justify-center text-gray-400 hover:text-red-500 transition-colors"
            title="Sign Out"
            >
            <FaSignOutAlt size={16} />
            </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
