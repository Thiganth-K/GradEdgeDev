import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface QuestionRequest {
  topic: string;
  category: 'aptitude' | 'technical' | 'psychometric';
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}

interface DraftedQuestion {
  text: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  topic: string;
  subtopic: string;
  category: string; // Category from Excel (aptitude/technical/psychometric)
  difficulty: string;
  tags?: string[];
  details?: string;
}

interface ParsedData {
  questions: DraftedQuestion[];
  totalRows: number;
  validQuestions: number;
  errors: Array<{ row: number; field?: string; message: string }>;
}

interface CreateRequestModalProps {
  onClose: () => void;
  onSubmit: (requests: QuestionRequest[], notes: string, draftedQuestions?: DraftedQuestion[]) => void;
}

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({ onClose, onSubmit }) => {
  const [questionRequests, setQuestionRequests] = useState<QuestionRequest[]>([
    { topic: '', category: 'aptitude', difficulty: 'medium', count: 1 }
  ]);
  const [notes, setNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<DraftedQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<Array<{ row: number; field?: string; message: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('contributor_token');
      const response = await fetch('http://localhost:5001/contributor/bulk/template', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      // Use arrayBuffer to ensure raw binary is preserved
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
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template. Please try again.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    setParsedQuestions([]);
    setParseErrors([]);

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
      
      // Extract unique topics from parsed questions and populate questionRequests
      const topicsMap = new Map<string, { category: string; count: number }>();
      
      data.questions.forEach(q => {
        const topic = q.topic;
        const category = (q as any).category || 'aptitude'; // Use category from Excel or default
        
        if (topicsMap.has(topic)) {
          const existing = topicsMap.get(topic)!;
          existing.count++;
        } else {
          topicsMap.set(topic, { category, count: 1 });
        }
      });
      
      // Create questionRequests array from unique topics
      if (topicsMap.size > 0) {
        const requests: QuestionRequest[] = Array.from(topicsMap.entries()).map(([topic, data]) => ({
          topic,
          category: data.category as 'aptitude' | 'technical' | 'psychometric',
          difficulty: 'medium', // Default difficulty
          count: data.count
        }));
        setQuestionRequests(requests);
      }
      
      setParsedQuestions(data.questions);
      setParseErrors(data.errors);
      setShowPreview(true);

      if (data.errors.length > 0) {
        alert(`File parsed with ${data.errors.length} error(s). Please review the errors below.`);
      } else {
        alert(`Successfully parsed ${data.validQuestions} question(s)!`);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to parse file'}`);
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearUpload = () => {
    setUploadedFile(null);
    setParsedQuestions([]);
    setParseErrors([]);
    setShowPreview(false);
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

    // Pass drafted questions from bulk upload if available
    onSubmit(questionRequests, notes, parsedQuestions.length > 0 ? parsedQuestions : undefined);
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

          {/* Bulk Upload Section */}
          <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-lg text-black mb-3">📊 Bulk Question Upload (Optional)</h3>
            <p className="text-sm text-gray-700 mb-4">
              Upload multiple questions at once using an Excel file. Download the template, fill it with your questions, and upload it here.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleDownloadTemplate}
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
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
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center py-3 text-blue-600">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing file...
                </div>
              )}

              {uploadedFile && !isProcessing && (
                <div className="bg-white border-2 border-green-300 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">{uploadedFile.name}</span>
                      <span className="text-xs text-gray-500">({parsedQuestions.length} questions parsed)</span>
                    </div>
                    <button
                      onClick={handleClearUpload}
                      className="text-red-600 hover:text-red-800 font-semibold text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {parseErrors.length > 0 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-md p-3">
                  <h4 className="font-semibold text-red-800 mb-2">⚠️ Parsing Errors ({parseErrors.length})</h4>
                  <div className="max-h-40 overflow-y-auto">
                    {parseErrors.slice(0, 5).map((error, idx) => (
                      <div key={idx} className="text-sm text-red-700 mb-1">
                        Row {error.row}: {error.message}
                      </div>
                    ))}
                    {parseErrors.length > 5 && (
                      <div className="text-sm text-red-700 font-semibold">
                        ... and {parseErrors.length - 5} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showPreview && parsedQuestions.length > 0 && (
                <div className="bg-white border-2 border-gray-300 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">✓ Preview ({parsedQuestions.length} questions)</h4>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                    >
                      {showPreview ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {parsedQuestions.slice(0, 3).map((q, idx) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                        <div className="font-medium text-gray-800 mb-1">Q{idx + 1}: {q.text}</div>
                        <div className="text-xs text-gray-600">
                          Topic: {q.topic} | Subtopic: {q.subtopic} | Category: {q.category} | Difficulty: {q.difficulty}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Options ({q.options.length}): {q.options.map((opt, i) => `${i + 1}. ${opt.text}${opt.isCorrect ? ' ✓' : ''}`).join(' | ')}
                        </div>
                      </div>
                    ))}
                    {parsedQuestions.length > 3 && (
                      <div className="text-sm text-gray-600 text-center font-semibold">
                        ... and {parsedQuestions.length - 3} more questions
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

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
