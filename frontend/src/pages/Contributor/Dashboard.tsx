import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeHeaders } from '../../lib/makeHeaders';
const BASE = import.meta.env.VITE_API_URL || '';
import RequestList from '../../components/Contributor/RequestList';
import ContributionsList from '../../components/Contributor/ContributionsList';

interface QuestionRequest {
  topic: string;
  category: 'aptitude' | 'technical' | 'psychometric';
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}

interface Request {
  _id: string;
  questionRequests: QuestionRequest[];
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  notes?: string;
  submittedAt: string;
  updatedAt: string;
}

interface Question {
  _id: string;
  text: string;
  options: Array<{ text: string }>;
  correctIndex: number;
  category: string;
  difficulty: string;
  tags?: string[];
  createdAt: string;
}

const ContributorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'requests' | 'contributions'>('requests');
  const [requests, setRequests] = useState<Request[]>([]);
  const [contributions, setContributions] = useState<Question[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch requests
  const fetchRequests = async () => {
    try {
      const response = await fetch(`${BASE}/contributor/requests`, {
        headers: makeHeaders('contributor_token')
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fetch contributions
  const fetchContributions = async () => {
    try {
      const response = await fetch(`${BASE}/contributor/contributions`, {
        headers: makeHeaders('contributor_token')
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contributions');
      }

      const data = await response.json();
      if (data.success) {
        setContributions(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${BASE}/contributor/chat/unread`, {
        headers: makeHeaders('contributor_token')
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      // Silently fail for unread count
    }
  };

  // Create request (no longer needed, moved to separate page)

  useEffect(() => {
    fetchRequests();
    fetchContributions();
    fetchUnreadCount();

    // Poll for unread count every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusCounts = () => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      inProgress: requests.filter(r => r.status === 'in-progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black">Contributor Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your question contributions</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/contributor/chat')}
                className="relative px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 font-semibold"
              >
                Chat with Admin
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate('/contributor/create-request')}
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
              >
                + New Request
              </button>
              <button
                onClick={() => {
                  // Clear all contributor tokens and redirect to login
                  localStorage.removeItem('contributor_token');
                  localStorage.removeItem('contributor_data');
                  localStorage.removeItem('gradedge_role');
                  navigate('/login');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-100 border-2 border-green-500 text-green-800 px-4 py-3 rounded-lg mb-6 font-semibold">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-800 px-4 py-3 rounded-lg mb-6 font-semibold">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-black">{counts.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total Requests</div>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">{counts.pending}</div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">{counts.inProgress}</div>
            <div className="text-sm text-gray-600 mt-1">In Progress</div>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{counts.completed}</div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{contributions.length}</div>
            <div className="text-sm text-gray-600 mt-1">Contributions</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg">
          <div className="flex border-b-2 border-gray-300">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'requests'
                  ? 'bg-red-600 text-white border-b-4 border-red-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Requests
            </button>
            <button
              onClick={() => setActiveTab('contributions')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'contributions'
                  ? 'bg-red-600 text-white border-b-4 border-red-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Contributions ({contributions.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'requests' && (
              <RequestList
                requests={requests}
                onSelectRequest={setSelectedRequest}
              />
            )}

            {activeTab === 'contributions' && (
              <ContributionsList questions={contributions} />
            )}
          </div>
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-2xl font-bold">Request Details</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedRequest.status === 'pending' ? 'bg-gray-200 text-gray-800' :
                  selectedRequest.status === 'in-progress' ? 'bg-yellow-200 text-yellow-900' :
                  selectedRequest.status === 'completed' ? 'bg-green-200 text-green-900' :
                  'bg-red-200 text-red-900'
                }`}>
                  {selectedRequest.status.toUpperCase()}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Question Requests:</h3>
                <div className="space-y-3">
                  {selectedRequest.questionRequests.map((qr, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                      <div className="font-semibold text-black">{qr.topic}</div>
                      <div className="flex space-x-2 mt-2 text-sm">
                        <span className="px-2 py-1 bg-gray-200 rounded">{qr.category}</span>
                        <span className="px-2 py-1 bg-gray-200 rounded">{qr.difficulty}</span>
                        <span className="px-2 py-1 bg-gray-200 rounded">{qr.count} questions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Notes:</h3>
                  <p className="text-gray-700 bg-gray-50 border border-gray-300 rounded-lg p-3">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-red-700">Rejection Reason:</h3>
                  <p className="text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <div>Submitted: {new Date(selectedRequest.submittedAt).toLocaleString()}</div>
                <div>Updated: {new Date(selectedRequest.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContributorDashboard;
