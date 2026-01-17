import React, { useState, useEffect } from 'react';
import { makeHeaders } from '../../lib/makeHeaders';
import { apiFetch } from '../../lib/api';
import Sidebar from '../../components/Admin/Sidebar';

interface QuestionRequest {
  topic: string;
  category: string;
  difficulty: string;
  count: number;
}

interface DraftedQuestion {
  text: string;
  options: { text: string; isCorrect?: boolean }[];
  // correctIndex is legacy (single-answer); keep optional for backward compatibility
  correctIndex?: number;
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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#0d0d0d] rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Contributor Requests</h1>
            </div>
            <p className="text-gray-600">Review and manage question contribution requests from contributors.</p>
          </div>

        {/* Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl mb-6 font-medium shadow-lg">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 font-medium shadow-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{counts.all}</div>
            <div className="text-sm text-gray-600 mt-1">Total Requests</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center border border-gray-200">
            <div className="text-3xl font-bold text-gray-600">{counts.pending}</div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-600">{counts.inProgress}</div>
            <div className="text-sm text-gray-600 mt-1">In Progress</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center border border-green-200">
            <div className="text-3xl font-bold text-green-600">{counts.completed}</div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center border border-red-200">
            <div className="text-3xl font-bold text-red-600">{counts.rejected}</div>
            <div className="text-sm text-gray-600 mt-1">Rejected</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex space-x-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-[#0d0d0d] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
              filterStatus === 'pending' ? 'bg-[#0d0d0d] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            onClick={() => setFilterStatus('in-progress')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
              filterStatus === 'in-progress' ? 'bg-[#0d0d0d] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            In Progress ({counts.inProgress})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
              filterStatus === 'completed' ? 'bg-[#0d0d0d] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({counts.completed})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
              filterStatus === 'rejected' ? 'bg-[#0d0d0d] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected ({counts.rejected})
          </button>
        </div>

        {/* Request List */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-600 text-lg">Loading requests...</div>
          </div>
        )}

        {!loading && filteredRequests.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Requests Found</h3>
            <p className="text-gray-500">There are no contributor requests matching your filters.</p>
          </div>
        )}

        {!loading && filteredRequests.length > 0 && (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request._id}
                onClick={() => setSelectedRequest(request)}
                className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl cursor-pointer transition-all border border-gray-200 hover:border-gray-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {request.contributorName}
                    </h3>
                    <p className="text-sm text-gray-500">{formatDate(request.submittedAt)}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${getStatusColor(request.status)}`}>
                    {request.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2">
                  {request.questionRequests.map((qr, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <span className="font-semibold text-gray-900">{qr.topic}</span>
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">{qr.category}</span>
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg font-medium">{qr.difficulty}</span>
                      <span className="text-gray-600 font-medium">×{qr.count}</span>
                    </div>
                  ))}
                </div>

                {request.notes && (
                  <div className="mt-3 text-sm text-gray-600 italic bg-gray-50 p-3 rounded-xl">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#0d0d0d] text-white px-6 py-5 flex justify-between items-center rounded-t-2xl sticky top-0 z-10">
              <h2 className="text-2xl font-bold">Request Details</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-white hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedRequest.contributorName}</h3>
                  <p className="text-sm text-gray-600 mt-1">Submitted: {formatDate(selectedRequest.submittedAt)}</p>
                  <p className="text-sm text-gray-600">Updated: {formatDate(selectedRequest.updatedAt)}</p>
                </div>
                <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-3 text-gray-900">Question Requests:</h4>
                <div className="space-y-3">
                  {selectedRequest.questionRequests.map((qr, index) => (
                    <div key={index} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <div className="font-bold text-gray-900 text-lg mb-2">{qr.topic}</div>
                      <div className="flex space-x-2">
                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">{qr.category}</span>
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-semibold text-sm">{qr.difficulty}</span>
                        <span className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-semibold text-sm">{qr.count} questions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <h4 className="font-bold text-lg mb-2 text-gray-900">Contributor Notes:</h4>
                  <p className="bg-gray-50 rounded-2xl p-4 text-gray-700 border border-gray-200">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {selectedRequest.draftedQuestions && selectedRequest.draftedQuestions.length > 0 && (
                <div>
                  <h4 className="font-bold text-lg mb-3 text-gray-900">Drafted Questions ({selectedRequest.draftedQuestions.length}):</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedRequest.draftedQuestions.map((q, index) => (
                      <div key={index} className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-bold text-gray-900">Question {index + 1}</h5>
                          <div className="flex space-x-2">
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">{q.category}</span>
                            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">{q.difficulty}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-800 mb-3 font-medium">{q.text}</p>
                        
                        <div className="space-y-2 mb-3">
                          {q.options.map((opt, optIndex) => {
                            const isCorrect = (q.correctIndex !== undefined && q.correctIndex === optIndex) || (!!opt.isCorrect);
                            return (
                              <div
                                key={optIndex}
                                className={`px-4 py-2.5 rounded-xl ${
                                  isCorrect
                                    ? 'bg-green-50 border-2 border-green-500 text-green-800 font-semibold'
                                    : 'bg-white border border-gray-300 text-gray-700'
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}. {opt.text}
                                {isCorrect && (
                                  <span className="ml-2 text-green-600 font-bold">✓ Correct</span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {q.tags && q.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {q.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {q.details && (
                          <div className="mt-3 text-sm text-gray-600 italic border-t border-gray-300 pt-3">
                            <strong>Details:</strong> {q.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-lg mb-3 text-gray-900">Update Status:</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => updateRequestStatus(selectedRequest._id, 'pending')}
                      disabled={loading}
                      className="py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:bg-gray-300 font-semibold shadow-md transition-colors"
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest._id, 'in-progress')}
                      disabled={loading}
                      className="py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 disabled:bg-gray-300 font-semibold shadow-md transition-colors"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest._id, 'completed')}
                      disabled={loading}
                      className="py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-300 font-semibold shadow-md transition-colors"
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest._id, 'rejected')}
                      disabled={loading}
                      className="py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-300 font-semibold shadow-md transition-colors"
                    >
                      Rejected
                    </button>
                  </div>

                  <textarea
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="Add notes about this status change (use this to provide a rejection reason when rejecting)..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ContributorRequestManagement;
