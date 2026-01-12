import React, { useState } from 'react';

interface QuestionRequest {
  topic: string;
  category: 'aptitude' | 'technical' | 'psychometric';
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}

interface CreateRequestModalProps {
  onClose: () => void;
  onSubmit: (requests: QuestionRequest[], notes: string) => void;
}

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({ onClose, onSubmit }) => {
  const [questionRequests, setQuestionRequests] = useState<QuestionRequest[]>([
    { topic: '', category: 'aptitude', difficulty: 'medium', count: 1 }
  ]);
  const [notes, setNotes] = useState('');

  const addQuestionRequest = () => {
    setQuestionRequests([
      ...questionRequests,
      { topic: '', category: 'aptitude', difficulty: 'medium', count: 1 }
    ]);
  };

  const removeQuestionRequest = (index: number) => {
    const newRequests = questionRequests.filter((_, i) => i !== index);
    setQuestionRequests(newRequests);
  };

  const updateQuestionRequest = (index: number, field: keyof QuestionRequest, value: any) => {
    const newRequests = [...questionRequests];
    newRequests[index] = { ...newRequests[index], [field]: value };
    setQuestionRequests(newRequests);
  };

  const handleSubmit = () => {
    // Validate
    for (const req of questionRequests) {
      if (!req.topic.trim()) {
        alert('Please fill in all topic fields');
        return;
      }
      if (req.count < 1) {
        alert('Question count must be at least 1');
        return;
      }
    }

    onSubmit(questionRequests, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-2xl font-bold">Create Contribution Request</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {questionRequests.map((request, index) => (
            <div key={index} className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-black">Question Set {index + 1}</h3>
                {questionRequests.length > 1 && (
                  <button
                    onClick={() => removeQuestionRequest(index)}
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Topic *</label>
                  <input
                    type="text"
                    value={request.topic}
                    onChange={(e) => updateQuestionRequest(index, 'topic', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                    placeholder="e.g., Algebra, Data Structures, Logical Reasoning"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Category *</label>
                    <select
                      value={request.category}
                      onChange={(e) => updateQuestionRequest(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600 bg-white"
                    >
                      <option value="aptitude">Aptitude</option>
                      <option value="technical">Technical</option>
                      <option value="psychometric">Psychometric</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Difficulty *</label>
                    <select
                      value={request.difficulty}
                      onChange={(e) => updateQuestionRequest(index, 'difficulty', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600 bg-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Count *</label>
                    <input
                      type="number"
                      min="1"
                      value={request.count}
                      onChange={(e) => updateQuestionRequest(index, 'count', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addQuestionRequest}
            className="w-full py-2 border-2 border-red-600 text-red-600 rounded-md hover:bg-red-50 font-semibold"
          >
            + Add Another Question Set
          </button>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
              placeholder="Any additional information or special requirements..."
            />
          </div>
        </div>

        <div className="bg-gray-100 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-400 text-gray-700 rounded-md hover:bg-gray-200 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestModal;
