import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaChartPie, 
  FaBullhorn, 
  FaUniversity, 
  FaUsers, 
  FaUserPlus, 
  FaComments, 
  FaClipboardList, 
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const adminData = localStorage.getItem('admin_data');
  const admin = adminData ? JSON.parse(adminData) : null;
  const adminName = admin?.username || 'Admin';

  const handleSignOut = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('gradedge_role');
    localStorage.removeItem('admin_data');
    navigate('/login');
  };

  const menuItems = [
<<<<<<< Updated upstream
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Institutions',
      path: '/admin/institutions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      name: 'Contributors',
      path: '/admin/contributors',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    },
    {
      name: 'Contributor Requests',
      path: '/admin/contributor-requests',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      name: 'Contributor Chats',
      path: '/admin/contributor-chats',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    {
      name: 'Audit Logs',
      path: '/admin/logs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
=======
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FaChartPie /> },
    { name: 'Announcements', path: '/admin/announcements', icon: <FaBullhorn /> },
    { name: 'Institutions', path: '/admin/institutions', icon: <FaUniversity /> },
    { name: 'Contributors', path: '/admin/contributors', icon: <FaUsers /> },
    { name: 'Requests', path: '/admin/contributor-requests', icon: <FaUserPlus /> },
    { name: 'Chats', path: '/admin/contributor-chats', icon: <FaComments /> },
    { name: 'Audit Logs', path: '/admin/logs', icon: <FaClipboardList /> }
>>>>>>> Stashed changes
  ];

  return (
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
                          (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
          
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
            {adminName.charAt(0).toUpperCase()}
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{adminName}</p>
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
