import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Student/Sidebar';
import {
  FaBullhorn,
  FaClipboardList,
  FaChartBar,
  FaBook,
  FaComments,
  FaUser,
  FaCog,
  FaLifeRing,
  FaWrench,
  FaHome,
} from 'react-icons/fa';

const WorkInProgress: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const sectionSlug = (section || 'section').toLowerCase();
  const title = sectionSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const iconMap: Record<string, React.ElementType> = {
    announcements: FaBullhorn,
    tests: FaClipboardList,
    results: FaChartBar,
    library: FaBook,
    chat: FaComments,
    profile: FaUser,
    settings: FaCog,
    support: FaLifeRing,
    dashboard: FaHome,
  };
  const Icon = iconMap[sectionSlug] || FaWrench;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded shadow p-8">
            <div className="flex items-center gap-3 mb-2">
              <Icon className="w-6 h-6 text-red-700" />
              <h1 className="text-2xl font-bold">{title}</h1>
            </div>
            <p className="text-sm text-gray-600 mb-6">This feature is a work in progress.</p>
            <div className="space-x-3">
              <button onClick={() => navigate('/student/dashboard')} className="px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100">Back to Dashboard</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkInProgress;