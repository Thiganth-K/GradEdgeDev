import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeHeaders } from '../../lib/makeHeaders';

const BASE = import.meta.env.VITE_API_URL || '';

interface QuestionRequest {
  topic: string;
  category: 'aptitude' | 'technical' | 'psychometric';
  count: number;
}

interface DraftedQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  category: 'aptitude' | 'technical' | 'psychometric';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string;
  details: string;
}

const UnifiedContributionRequest: React.FC = () => {
  const navigate = useNavigate();
  
  // Request metadata state
  const [questionRequests, setQuestionRequests] = useState<QuestionRequest[]>([
    { topic: '', category: 'aptitude', count: 1 }
  ]);
  const [notes, setNotes] = useState('');
  
  // Drafted questions state
  const [draftedQuestions, setDraftedQuestions] = useState<DraftedQuestion[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  
  // New question form state
  const [newQuestion, setNewQuestion] = useState<DraftedQuestion>({
    text: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    category: 'aptitude',
    difficulty: 'medium',
    tags: '',
    details: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Request metadata handlers
  const addQuestionRequest = () => {
    setQuestionRequests([
      ...questionRequests,
      { topic: '', category: 'aptitude', count: 1 }
    ]);
  };

  const removeQuestionRequest = (index: number) => {
    if (questionRequests.length > 1) {
      setQuestionRequests(questionRequests.filter((_, i) => i !== index));
    }
  };

  const updateQuestionRequest = (index: number, field: keyof QuestionRequest, value: any) => {
    const updated = [...questionRequests];
    updated[index] = { ...updated[index], [field]: value };
    setQuestionRequests(updated);
  };

  // Question draft handlers
  const handleOptionChange = (index: number, value: string) => {
    const updated = [...newQuestion.options];
    updated[index] = value;
    setNewQuestion({ ...newQuestion, options: updated });
  };

  const addOption = () => {
    setNewQuestion({ ...newQuestion, options: [...newQuestion.options, ''] });
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length > 2) {
      const updated = newQuestion.options.filter((_, i) => i !== index);
      setNewQuestion({ 
        ...newQuestion, 
        options: updated,
        correctIndex: newQuestion.correctIndex >= updated.length ? 0 : newQuestion.correctIndex
      });
    }
  };

  const handleAddQuestion = () => {
    setError('');
    const filteredOptions = newQuestion.options.filter(o => o.trim() !== '');
    
    if (!newQuestion.text.trim()) {
      setError('Question text is required');
      return;
    }
    if (filteredOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }
    
    const questionToAdd: DraftedQuestion = {
      ...newQuestion,
      options: filteredOptions,
      tags: newQuestion.tags.trim(),
      details: newQuestion.details.trim()
    };
    
    setDraftedQuestions([...draftedQuestions, questionToAdd]);
    setSuccess('Question added to draft');
    
    // Reset form
    setNewQuestion({
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      category: 'aptitude',
      difficulty: 'medium',
      tags: '',
      details: ''
    });
    setShowQuestionForm(false);
    
    setTimeout(() => setSuccess(''), 3000);
  };

  const removeQuestion = (index: number) => {
    setDraftedQuestions(draftedQuestions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate request metadata
    for (const req of questionRequests) {
      if (!req.topic.trim()) {
        setError('Please fill in all topic fields');
        setLoading(false);
        return;
      }
      if (req.count < 1) {
        setError('Question count must be at least 1');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        questionRequests,
        notes: notes.trim() || undefined,
        draftedQuestions: draftedQuestions.map(q => ({
          text: q.text,
          options: q.options.map(o => ({ text: o })),
          correctIndex: q.correctIndex,
          category: q.category,
          difficulty: q.difficulty,
          tags: q.tags ? q.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          details: q.details || undefined
        }))
      };

      const response = await fetch(`${BASE}/contributor/requests`, {
        method: 'POST',
        headers: makeHeaders('contributor_token', 'application/json'),
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create request');
      }

      if (data.success) {
        navigate('/contributor/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'aptitude': return 'bg-blue-200 text-blue-900';
      case 'technical': return 'bg-purple-200 text-purple-900';
      case 'psychometric': return 'bg-green-200 text-green-900';
      default: return 'bg-gray-200 text-gray-900';
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'bg-green-200 text-green-900';
      case 'medium': return 'bg-yellow-200 text-yellow-900';
      case 'hard': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-200 text-gray-900';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black">Create Contribution Request</h1>
              <p className="text-gray-600 mt-1">Define question requirements and draft your questions</p>
            </div>
            <button
              onClick={() => navigate('/contributor/dashboard')}
              className="px-4 py-2 border-2 border-gray-400 text-gray-700 rounded-md hover:bg-gray-200 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-800 px-4 py-3 rounded-lg mb-6 font-semibold">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border-2 border-green-500 text-green-800 px-4 py-3 rounded-lg mb-6 font-semibold">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Request Metadata */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-black mb-4">Request Details</h2>
              
              <div className="space-y-4 mb-4">
                {questionRequests.map((request, index) => (
                  <div key={index} className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-black">Set {index + 1}</h3>
                      {questionRequests.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestionRequest(index)}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">Topic *</label>
                        <input
                          type="text"
                          value={request.topic}
                          onChange={(e) => updateQuestionRequest(index, 'topic', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                          placeholder="e.g., Arrays, Logic"
                        />
                      </div>

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
                ))}
              </div>

              <button
                type="button"
                onClick={addQuestionRequest}
                className="w-full py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 font-semibold mb-4"
              >
                + Add Question Set
              </button>

              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-1">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                  placeholder="Any special requirements..."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Submitting...' : `Submit Request (${draftedQuestions.length} questions)`}
              </button>
            </div>
          </div>

          {/* Right Column - Question Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Form */}
            {showQuestionForm ? (
              <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-black">Draft New Question</h2>
                  <button
                    onClick={() => setShowQuestionForm(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ✕ Cancel
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Question Text *</label>
                    <textarea
                      value={newQuestion.text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                      placeholder="Enter your question..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Category *</label>
                      <select
                        value={newQuestion.category}
                        onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value as any })}
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
                        value={newQuestion.difficulty}
                        onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as any })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600 bg-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Options * (minimum 2)</label>
                    <div className="space-y-2">
                      {newQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={newQuestion.correctIndex === index}
                            onChange={() => setNewQuestion({ ...newQuestion, correctIndex: index })}
                            className="w-4 h-4 text-red-600"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                            placeholder={`Option ${index + 1}`}
                          />
                          {newQuestion.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="text-red-600 hover:text-red-800 font-semibold"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addOption}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 font-semibold"
                    >
                      + Add Option
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={newQuestion.tags}
                      onChange={(e) => setNewQuestion({ ...newQuestion, tags: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                      placeholder="e.g., algebra, equations, math"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Question Details / Explanation</label>
                    <textarea
                      value={newQuestion.details}
                      onChange={(e) => setNewQuestion({ ...newQuestion, details: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                      placeholder="Add any additional details or explanations..."
                    />
                  </div>

                  <button
                    onClick={handleAddQuestion}
                    className="w-full py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
                  >
                    Add Question to Draft
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowQuestionForm(true)}
                className="w-full py-4 bg-white border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-semibold text-lg"
              >
                + Draft a New Question
              </button>
            )}

            {/* Drafted Questions List */}
            <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">
                Drafted Questions ({draftedQuestions.length})
              </h2>

              {draftedQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-gray-500 text-lg">No questions drafted yet</p>
                  <p className="text-gray-400 text-sm mt-2">Click "Draft a New Question" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {draftedQuestions.map((question, index) => (
                    <div key={index} className="border-2 border-gray-300 rounded-lg p-4 hover:border-red-600 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-black">Q{index + 1}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(question.category)}`}>
                            {question.category.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty.toUpperCase()}
                          </span>
                        </div>
                        <button
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </div>

                      <p className="text-black font-medium mb-3">{question.text}</p>

                      <div className="space-y-2 mb-3">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`px-3 py-2 rounded ${
                              optIndex === question.correctIndex
                                ? 'bg-green-100 border-2 border-green-500 text-green-900 font-semibold'
                                : 'bg-gray-100 border border-gray-300 text-gray-700'
                            }`}
                          >
                            <span className="mr-2 font-semibold">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            {option}
                            {optIndex === question.correctIndex && (
                              <span className="ml-2 text-green-600">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {question.details && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-900">
                            <span className="font-semibold">Details:</span> {question.details}
                          </p>
                        </div>
                      )}

                      {question.tags && (
                        <div className="flex flex-wrap gap-2">
                          {question.tags.split(',').map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded"
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedContributionRequest;
