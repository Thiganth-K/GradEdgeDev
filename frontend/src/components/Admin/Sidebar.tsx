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
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FaChartPie /> },
    { name: 'Announcements', path: '/admin/announcements', icon: <FaBullhorn /> },
    { name: 'Institutions', path: '/admin/institutions', icon: <FaUniversity /> },
    { name: 'Contributors', path: '/admin/contributors', icon: <FaUsers /> },
    { name: 'Contributor Requests', path: '/admin/contributor-requests', icon: <FaUserPlus /> },
    { name: 'Contributor Chats', path: '/admin/contributor-chats', icon: <FaComments /> },
    { name: 'Audit Logs', path: '/admin/logs', icon: <FaClipboardList /> }
  ];

  return (
    <aside className={`relative flex flex-col min-h-screen text-gray-300 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 transition-colors z-50"
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
      </button>

      <div className="p-6 border-b border-red-700 bg-gradient-to-b from-red-800 to-red-900">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          {!isCollapsed && <span className="text-white text-xl font-bold">GradEdge</span>}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 bg-[#111827]">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-3 py-3 mb-2 rounded-lg transition-all duration-200 group ${isActive ? 'bg-gradient-to-r from-red-600 to-red-900 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className={`text-lg ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{item.icon}</div>
              {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 bg-[#0b1220] mt-auto">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center shrink-0 text-white font-semibold">
            {adminName.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{adminName}</p>
              <button onClick={handleSignOut} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 mt-1 transition-colors">
                <FaSignOutAlt size={12} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
        {isCollapsed && (
          <button onClick={handleSignOut} className="w-full mt-4 flex justify-center text-gray-400 hover:text-red-500 transition-colors" title="Sign Out">
            <FaSignOutAlt size={16} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
