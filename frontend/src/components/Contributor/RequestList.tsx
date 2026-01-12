import React from 'react';

interface Request {
  _id: string;
  questionRequests: Array<{
    topic: string;
    category: string;
    difficulty: string;
    count: number;
  }>;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  notes?: string;
  submittedAt: string;
  updatedAt: string;
}

interface RequestListProps {
  requests: Request[];
  onSelectRequest: (request: Request) => void;
}

const RequestList: React.FC<RequestListProps> = ({ requests, onSelectRequest }) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border-2 border-gray-300">
        <p className="text-gray-500 text-lg">No requests found</p>
        <p className="text-gray-400 text-sm mt-2">Create your first contribution request to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request._id}
          onClick={() => onSelectRequest(request)}
          className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-red-600 cursor-pointer transition-colors"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                {request.status.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(request.submittedAt)}
            </div>
          </div>

          <div className="space-y-2">
            {request.questionRequests.map((qr, index) => (
              <div key={index} className="flex items-center space-x-4 text-sm">
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
  );
};

export default RequestList;
