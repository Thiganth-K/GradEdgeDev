import React, { useState, useEffect } from 'react';
import { makeHeaders } from '../../lib/makeHeaders';
import { apiFetch } from '../../lib/api';

interface QuestionRequest {
  topic: string;
  category: string;
  difficulty: string;
  count: number;
}

interface DraftedQuestion {
  text: string;
  options: { text: string }[];
  correctIndex: number;
  category: string;
  difficulty: string;
  tags: string[];
  details: string;
}

interface Request {
  _id: string;
  contributorId: string;
  contributorName: string;
  questionRequests: QuestionRequest[];
  draftedQuestions?: DraftedQuestion[];
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  notes?: string;
  submittedAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

const ContributorRequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/admin/contributor-requests', {
        headers: makeHeaders('admin_token')
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
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await apiFetch(`/admin/contributor-requests/${requestId}/status`, {
        method: 'PUT',
        headers: makeHeaders('admin_token', 'application/json'),
        body: JSON.stringify({ status: newStatus, notes: updateNotes })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update status');
      }

      const data = await response.json();
      if (data.success) {
        setSuccessMessage(`Request status updated to ${newStatus}`);
        setSelectedRequest(null);
        setUpdateNotes('');
        fetchRequests();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  const getStatusCounts = () => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      inProgress: requests.filter(r => r.status === 'in-progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };
  };

  const counts = getStatusCounts();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-200 text-gray-800';
      case 'in-progress':
        return 'bg-yellow-200 text-yellow-900';
      case 'completed':
        return 'bg-green-200 text-green-900';
      case 'rejected':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-black">Contributor Request Management</h1>
          <p className="text-gray-600 mt-1">Review and manage question contribution requests</p>
        </div>

        {/* Messages */}
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
            <div className="text-3xl font-bold text-black">{counts.all}</div>
            <div className="text-sm text-gray-600 mt-1">Total Requests</div>
          </div>
          <div className="bg-white border-2 border-yellow-300 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">{counts.pending}</div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </div>
          <div className="bg-white border-2 border-yellow-300 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">{counts.inProgress}</div>
            <div className="text-sm text-gray-600 mt-1">In Progress</div>
          </div>
          <div className="bg-white border-2 border-green-300 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{counts.completed}</div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
          <div className="bg-white border-2 border-red-300 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{counts.rejected}</div>
            <div className="text-sm text-gray-600 mt-1">Rejected</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-6 flex space-x-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded font-semibold ${
              filterStatus === 'all' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded font-semibold ${
              filterStatus === 'pending' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            onClick={() => setFilterStatus('in-progress')}
            className={`px-4 py-2 rounded font-semibold ${
              filterStatus === 'in-progress' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            In Progress ({counts.inProgress})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded font-semibold ${
              filterStatus === 'completed' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Completed ({counts.completed})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded font-semibold ${
              filterStatus === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Rejected ({counts.rejected})
          </button>
        </div>

        {/* Request List */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading requests...</div>
          </div>
        )}

        {!loading && filteredRequests.length === 0 && (
          <div className="bg-white border-2 border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No requests found</p>
          </div>
        )}

        {!loading && filteredRequests.length > 0 && (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request._id}
                onClick={() => setSelectedRequest(request)}
                className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-red-600 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-black">
                      Request by {request.contributorName}
                    </h3>
                    <p className="text-sm text-gray-500">{formatDate(request.submittedAt)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                    {request.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2">
                  {request.questionRequests.map((qr, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <span className="font-semibold text-black">{qr.topic}</span>
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded">{qr.category}</span>
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded">{qr.difficulty}</span>
                      <span className="text-gray-600">×{qr.count}</span>
                    </div>
                  ))}
                </div>

                {request.notes && (
                  <div className="mt-3 text-sm text-gray-600 italic">
                    "{request.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-2xl font-bold">Request Details</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-black">{selectedRequest.contributorName}</h3>
                  <p className="text-sm text-gray-600">Submitted: {formatDate(selectedRequest.submittedAt)}</p>
                  <p className="text-sm text-gray-600">Updated: {formatDate(selectedRequest.updatedAt)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status.toUpperCase()}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-3">Question Requests:</h4>
                <div className="space-y-3">
                  {selectedRequest.questionRequests.map((qr, index) => (
                    <div key={index} className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3">
                      <div className="font-semibold text-black text-lg">{qr.topic}</div>
                      <div className="flex space-x-2 mt-2">
                        <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded font-semibold">{qr.category}</span>
                        <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded font-semibold">{qr.difficulty}</span>
                        <span className="px-3 py-1 bg-red-600 text-white rounded font-semibold">{qr.count} questions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <h4 className="font-semibold text-lg mb-2">Contributor Notes:</h4>
                  <p className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {selectedRequest.draftedQuestions && selectedRequest.draftedQuestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg mb-3">Drafted Questions ({selectedRequest.draftedQuestions.length}):</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedRequest.draftedQuestions.map((q, index) => (
                      <div key={index} className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-semibold text-black">Question {index + 1}</h5>
                          <div className="flex space-x-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">{q.category}</span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">{q.difficulty}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-800 mb-3 font-medium">{q.text}</p>
                        
                        <div className="space-y-2 mb-3">
                          {q.options.map((opt, optIndex) => (
                            <div 
                              key={optIndex} 
                              className={`px-3 py-2 rounded ${
                                optIndex === q.correctIndex 
                                  ? 'bg-green-100 border-2 border-green-500 text-green-800 font-semibold' 
                                  : 'bg-white border border-gray-300 text-gray-700'
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {opt.text}
                              {optIndex === q.correctIndex && (
                                <span className="ml-2 text-green-600">✓ Correct</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {q.tags && q.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {q.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {q.details && (
                          <div className="mt-2 text-sm text-gray-600 italic border-t border-gray-300 pt-2">
                            <strong>Details:</strong> {q.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-lg mb-2">Update Status:</h4>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateRequestStatus(selectedRequest._id, 'pending')}
                      disabled={loading}
                      className="flex-1 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 font-semibold"
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest._id, 'in-progress')}
                      disabled={loading}
                      className="flex-1 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-300 font-semibold"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest._id, 'completed')}
                      disabled={loading}
                      className="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 font-semibold"
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest._id, 'rejected')}
                      disabled={loading}
                      className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 font-semibold"
                    >
                      Rejected
                    </button>
                  </div>

                  <textarea
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="Add notes about this status change (use this to provide a rejection reason when rejecting)..."
                    rows={3}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContributorRequestManagement;
