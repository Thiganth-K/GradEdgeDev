import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeHeaders } from '../../lib/makeHeaders';
import { apiFetch } from '../../lib/api';

interface QuestionRequest {
  topic: string;
  category: 'aptitude' | 'technical' | 'psychometric';
  count: number;
}

interface DraftedQuestion {
  text: string;
  options: { text: string; isCorrect: boolean }[];
  topic: string;
  subtopic: string;
  category?: string; // Optional: category from bulk upload
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string;
  details: string;
}

interface ParsedData {
  questions: DraftedQuestion[];
  totalRows: number;
  validQuestions: number;
  errors: Array<{ row: number; field?: string; message: string }>;
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // New question form state
  const [newQuestion, setNewQuestion] = useState<DraftedQuestion>({
    text: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    topic: '',
    subtopic: '',
    difficulty: 'medium',
    tags: '',
    details: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bulk upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkParseErrors, setBulkParseErrors] = useState<Array<{ row: number; field?: string; message: string }>>([]);
  const [showBulkPreview, setShowBulkPreview] = useState(false);

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
    updated[index] = { ...updated[index], text: value };
    setNewQuestion({ ...newQuestion, options: updated });
  };

  const handleCorrectToggle = (index: number) => {
    const updated = [...newQuestion.options];
    updated[index] = { ...updated[index], isCorrect: !updated[index].isCorrect };
    setNewQuestion({ ...newQuestion, options: updated });
  };

  const addOption = () => {
    setNewQuestion({ 
      ...newQuestion, 
      options: [...newQuestion.options, { text: '', isCorrect: false }] 
    });
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length > 2) {
      const updated = newQuestion.options.filter((_, i) => i !== index);
      setNewQuestion({ 
        ...newQuestion, 
        options: updated
      });
    }
  };

  const handleAddQuestion = () => {
    setError('');
    const filteredOptions = newQuestion.options.filter(o => o.text.trim() !== '');
    const correctCount = filteredOptions.filter(o => o.isCorrect).length;
    
    if (!newQuestion.text.trim()) {
      setError('Question text is required');
      return;
    }
    if (!newQuestion.topic || !newQuestion.topic.trim()) {
      setError('Please select a topic for the question');
      return;
    }
    if (!newQuestion.subtopic || !newQuestion.subtopic.trim()) {
      setError('Please enter a subtopic for the question');
      return;
    }
    if (filteredOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }
    if (correctCount === 0) {
      setError('At least one option must be marked as correct');
      return;
    }
    
    const questionToAdd: DraftedQuestion = {
      ...newQuestion,
      options: filteredOptions,
      tags: newQuestion.tags.trim(),
      details: newQuestion.details.trim()
    };
    
    if (editingIndex !== null) {
      // Update existing question
      const updated = [...draftedQuestions];
      updated[editingIndex] = questionToAdd;
      setDraftedQuestions(updated);
      setSuccess('Question updated successfully');
      setEditingIndex(null);
    } else {
      // Add new question
      setDraftedQuestions([...draftedQuestions, questionToAdd]);
      setSuccess('Question added to draft');
    }
    
    // Reset form
    setNewQuestion({
      text: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      topic: '',
      subtopic: '',
      difficulty: 'medium',
      tags: '',
      details: ''
    });
    setShowQuestionForm(false);
    
    setTimeout(() => setSuccess(''), 3000);
  };

  const editQuestion = (index: number) => {
    const question = draftedQuestions[index];
    setNewQuestion(question);
    setEditingIndex(index);
    setShowQuestionForm(true);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setNewQuestion({
      text: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      topic: '',
      subtopic: '',
      difficulty: 'medium',
      tags: '',
      details: ''
    });
    setShowQuestionForm(false);
  };

  const removeQuestion = (index: number) => {
    setDraftedQuestions(draftedQuestions.filter((_, i) => i !== index));
  };

  // Bulk upload handlers
  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('contributor_token');
      const response = await fetch('http://localhost:5001/contributor/bulk/template', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      // Preserve raw binary via arrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'question_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Template downloaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Failed to download template. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBulkFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUploadedFile(file);
    setIsProcessingBulk(true);
    setBulkParseErrors([]);

    try {
      const token = localStorage.getItem('contributor_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5001/contributor/bulk/parse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to parse file');
      }

      const data: ParsedData = result.data;
      
      // Add parsed questions to drafted questions
      const newQuestions = data.questions.map(q => ({
        ...q,
        tags: Array.isArray(q.tags) ? q.tags.join(', ') : ''
      }));
      
      // Extract unique topics from parsed questions and populate questionRequests
      const topicsMap = new Map<string, { category: string; count: number }>();
      
      [...draftedQuestions, ...newQuestions].forEach(q => {
        const topic = q.topic;
        const category = (() => {
          // Try to find category from existing questionRequests first
          const existingReq = questionRequests.find(r => r.topic === topic);
          if (existingReq) return existingReq.category;
          
          // If question has category field, use it (for bulk upload)
          if ('category' in q && q.category) {
            return q.category as 'aptitude' | 'technical' | 'psychometric';
          }
          
          // Default to aptitude
          return 'aptitude' as const;
        })();
        
        if (topicsMap.has(topic)) {
          const existing = topicsMap.get(topic)!;
          existing.count++;
        } else {
          topicsMap.set(topic, { category, count: 1 });
        }
      });
      
      // Create new questionRequests array from topics
      const updatedRequests: QuestionRequest[] = Array.from(topicsMap.entries()).map(([topic, data]) => ({
        topic,
        category: data.category as 'aptitude' | 'technical' | 'psychometric',
        count: data.count
      }));
      
      // Update state
      setQuestionRequests(updatedRequests.length > 0 ? updatedRequests : [{ topic: '', category: 'aptitude', count: 1 }]);
      setDraftedQuestions([...draftedQuestions, ...newQuestions]);
      setBulkParseErrors(data.errors);
      setShowBulkPreview(true);

      if (data.errors.length > 0) {
        setError(`File parsed with ${data.errors.length} error(s). ${data.validQuestions} questions added.`);
      } else {
        setSuccess(`Successfully added ${data.validQuestions} question(s) from file!`);
      }
      setTimeout(() => { setError(''); setSuccess(''); }, 5000);
    } catch (error) {
      console.error('Error parsing file:', error);
      setError(`Error: ${error instanceof Error ? error.message : 'Failed to parse file'}`);
      setUploadedFile(null);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleClearBulkUpload = () => {
    setUploadedFile(null);
    setBulkParseErrors([]);
    setShowBulkPreview(false);
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
      // count is computed automatically from drafted questions
    }

    try {
      const payload = {
        questionRequests,
        notes: notes.trim() || undefined,
        draftedQuestions: draftedQuestions.map(q => ({
          text: q.text,
          options: q.options, // Already includes { text, isCorrect }
          topic: q.topic,
          subtopic: q.subtopic,
          difficulty: q.difficulty,
          tags: q.tags ? q.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          details: q.details || undefined
        }))
      };

      const response = await apiFetch('/contributor/requests', {
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
                        <label className="block text-sm font-medium text-black mb-1">Count</label>
                        <input
                          type="number"
                          min="0"
                          value={draftedQuestions.filter(dq => dq.topic === request.topic).length}
                          readOnly
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                        />
                        <div className="text-xs text-gray-500 mt-1">Automatically updated from drafted questions</div>
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
                  <h2 className="text-xl font-bold text-black">
                    {editingIndex !== null ? 'Edit Question' : 'Draft New Question'}
                  </h2>
                  <button
                    onClick={cancelEdit}
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
                      <label className="block text-sm font-medium text-black mb-1">Topic *</label>
                      <select
                        value={newQuestion.topic}
                        onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600 bg-white"
                      >
                        <option value="">-- select topic --</option>
                        {questionRequests.map((qr, i) => (
                          <option key={i} value={qr.topic}>{qr.topic || `Set ${i+1}`}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Subtopic *</label>
                      <input
                        type="text"
                        value={newQuestion.subtopic}
                        onChange={(e) => setNewQuestion({ ...newQuestion, subtopic: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                        placeholder="e.g., Binary Search, Logic Gates"
                      />
                    </div>
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

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Options * (minimum 2, check all correct answers)
                    </label>
                    <div className="space-y-2">
                      {newQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={() => handleCorrectToggle(index)}
                            className="w-4 h-4 text-red-600"
                          />
                          <input
                            type="text"
                            value={option.text}
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
                    <p className="text-xs text-gray-500 mt-1">
                      Check the box(es) next to correct answer(s). Multiple correct answers are supported.
                    </p>
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
                    {editingIndex !== null ? 'Update Question' : 'Add Question to Draft'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Bulk Upload Section */}
                <div className="bg-white border-2 border-blue-300 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-black mb-3 flex items-center gap-2">
                    <span>📊</span>
                    <span>Bulk Question Upload</span>
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload multiple questions at once using an Excel file. Download the template, fill it with your questions, and upload it here.
                  </p>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Excel Template
                    </button>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Upload Filled Template</label>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleBulkFileUpload}
                        disabled={isProcessingBulk}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    {isProcessingBulk && (
                      <div className="flex items-center justify-center py-3 text-blue-600">
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing file...
                      </div>
                    )}

                    {uploadedFile && !isProcessingBulk && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">{uploadedFile.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearBulkUpload}
                            className="text-red-600 hover:text-red-800 font-semibold text-sm"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}

                    {bulkParseErrors.length > 0 && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-md p-3 max-h-40 overflow-y-auto">
                        <h4 className="font-semibold text-red-800 mb-2">⚠️ Parsing Errors ({bulkParseErrors.length})</h4>
                        {bulkParseErrors.slice(0, 5).map((error, idx) => (
                          <div key={idx} className="text-sm text-red-700 mb-1">
                            Row {error.row}: {error.message}
                          </div>
                        ))}
                        {bulkParseErrors.length > 5 && (
                          <div className="text-sm text-red-700 font-semibold">
                            ... and {bulkParseErrors.length - 5} more errors
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Draft New Question Button */}
                <button
                  onClick={() => {
                    setEditingIndex(null);
                    setShowQuestionForm(true);
                  }}
                  className="w-full py-4 bg-white border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-semibold text-lg"
                >
                  + Draft a New Question
                </button>
              </>
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
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-semibold text-black">Q{index + 1}</span>
                          {(() => {
                            const qr = questionRequests.find(r => r.topic === question.topic);
                            if (qr) return (
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(qr.category)}`}>
                                {qr.category.toUpperCase()}
                              </span>
                            );
                            return null;
                          })()}
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty.toUpperCase()}
                          </span>
                          {question.subtopic && (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-indigo-100 text-indigo-700">
                              {question.subtopic}
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editQuestion(index)}
                            className="px-3 py-1 text-blue-600 hover:text-blue-800 font-semibold border border-blue-600 rounded hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeQuestion(index)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <p className="text-black font-medium mb-3">{question.text}</p>

                      <div className="space-y-2 mb-3">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`px-3 py-2 rounded ${
                              option.isCorrect
                                ? 'bg-green-100 border-2 border-green-500 text-green-900 font-semibold'
                                : 'bg-gray-100 border border-gray-300 text-gray-700'
                            }`}
                          >
                            <span className="mr-2 font-semibold">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            {option.text}
                            {option.isCorrect && (
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
