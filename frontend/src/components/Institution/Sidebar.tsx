import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaChalkboardTeacher, FaUserGraduate, FaLayerGroup, FaClipboardList, FaBullhorn, FaComments, FaBook, FaCog, FaSignOutAlt } from 'react-icons/fa';

const InstitutionSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const instData = typeof window !== 'undefined' ? localStorage.getItem('institution_data') : null;
  const inst = instData ? JSON.parse(instData) : null;
  const name = inst?.name || 'Institution';

  const handleSignOut = () => {
    localStorage.removeItem('institution_token');
    localStorage.removeItem('gradedge_role');
    localStorage.removeItem('institution_data');
    navigate('/login');
  };

  const items = [
    { name: 'Dashboard', path: '/institution/dashboard', icon: <FaHome className="w-5 h-5" /> },
    { name: 'Faculties', path: '/institution/faculties', icon: <FaChalkboardTeacher className="w-5 h-5" /> },
    { name: 'Students', path: '/institution/students', icon: <FaUserGraduate className="w-5 h-5" /> },
    { name: 'Batches', path: '/institution/batches', icon: <FaLayerGroup className="w-5 h-5" /> },
    { name: 'Tests', path: '/institution/tests', icon: <FaClipboardList className="w-5 h-5" /> },
    { name: 'Announcements', path: '/institution/announcements', icon: <FaBullhorn className="w-5 h-5" /> },
    { name: 'Chats', path: '/institution/chat', icon: <FaComments className="w-5 h-5" /> },
    { name: 'Library', path: '/institution/library', icon: <FaBook className="w-5 h-5" /> }
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-red-800 to-red-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-red-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13"/></svg>
          </div>
          <div>
            <div className="text-white text-lg font-bold">{name}</div>
            <div className="text-red-300 text-xs">Institution</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6">
        {items.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${isActive ? 'bg-red-700 text-white font-medium' : 'text-red-100 hover:bg-red-700 hover:text-white'}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      

      <div className="border-t border-red-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">{name}</p>
            <p className="text-red-300 text-xs">Institution</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};



export default InstitutionSidebar;
