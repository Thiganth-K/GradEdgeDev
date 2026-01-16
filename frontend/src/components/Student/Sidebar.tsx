import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaBullhorn,
  FaClipboardList,
  FaChartBar,
  FaBook,
  FaComments,
  FaUser,
  FaCog,
  FaLifeRing,
  FaUserCircle,
  FaSignOutAlt,
} from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const studentData = localStorage.getItem('student_data');
  const student = studentData ? JSON.parse(studentData) : null;
  const studentName = student?.name || student?.username || 'Student';

  const handleSignOut = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('gradedge_role');
    localStorage.removeItem('student_data');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: <FaHome className="w-5 h-5" /> },
    { name: 'Announcements', path: '/student/announcements', icon: <FaBullhorn className="w-5 h-5" /> },
    { name: 'Tests', path: '/student/tests', icon: <FaClipboardList className="w-5 h-5" /> },
    { name: 'Results', path: '/student/results', icon: <FaChartBar className="w-5 h-5" /> },
    { name: 'Chat', path: '/student/wip/chat', icon: <FaComments className="w-5 h-5" /> },
    { name: 'Profile', path: '/student/profile', icon: <FaUser className="w-5 h-5" /> },
    { name: 'Settings', path: '/student/wip/settings', icon: <FaCog className="w-5 h-5" /> },
    { name: 'Support', path: '/student/wip/support', icon: <FaLifeRing className="w-5 h-5" /> },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-red-800 to-red-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-red-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-white text-xl font-bold">GradEdge</span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-6">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/student/dashboard' && location.pathname.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-red-700 text-white font-medium'
                  : 'text-red-100 hover:bg-red-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile & Sign Out */}
      <div className="border-t border-red-700">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center">
              <FaUserCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{studentName}</p>
              <p className="text-red-300 text-xs">Student</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <FaSignOutAlt className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
