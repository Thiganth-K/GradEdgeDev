import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../../lib/api';
import InstitutionSidebar from '../../components/Institution/Sidebar';

const BACKEND = API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface Question {
  _id: string;
  text: string;
  options: { text: string; isCorrect?: boolean }[];
  correctIndex?: number;
  correctIndices?: number[];
  category: string;
  subtopic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  details?: string;
  createdAt?: string;
  timeLimit?: string;
  memoryLimit?: string;
}

const InstitutionLibrary: React.FC = () => {
  const [questions, setQuestions] = useState<Record<string, Record<string, Question[]>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('Aptitude');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;
  const getHeaders = (extra: any = {}) => {
    const h: any = { ...extra };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BACKEND}/institution/questions`, { headers: getHeaders() });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || 'Failed to load library questions');
      }
      const data: Question[] = Array.isArray(body.data) ? body.data : (body.data || []);
      // group by category -> subtopic
      const grouped: Record<string, Record<string, Question[]>> = {};
      data.forEach((q) => {
        const cat = q.category ? String(q.category).charAt(0).toUpperCase() + String(q.category).slice(1) : 'Aptitude';
        const sub = q.subtopic || 'General';
        if (!grouped[cat]) grouped[cat] = {};
        if (!grouped[cat][sub]) grouped[cat][sub] = [];
        grouped[cat][sub].push(q);
      });
      setQuestions(grouped);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCorrectAnswers = (q: Question) => {
    if (Array.isArray(q.correctIndices) && q.correctIndices.length) return q.correctIndices;
    if (q.correctIndex !== undefined && q.correctIndex !== null) return [q.correctIndex];
    const out: number[] = [];
    (q.options||[]).forEach((o, i) => { if ((o as any).isCorrect) out.push(i); });
    return out;
  };

  const renderQuestion = (question: Question, index: number) => {
    const isExpanded = expandedQuestion === question._id;
    const correct = getCorrectAnswers(question);
    return (
      <div key={question._id} className="border border-gray-100 rounded-lg p-4 mb-3 hover:shadow transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-semibold text-gray-800">Q{index + 1}.</span>
              <span className={`text-xs px-2 py-1 rounded ${question.difficulty === 'easy' ? 'bg-green-50 text-green-700' : question.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                {question.difficulty || 'medium'}
              </span>
            </div>
            <p className="text-gray-900 mb-2">{question.text}</p>
            <div className="space-y-1 mb-2">
              {(question.options || []).map((opt, idx) => (
                <div key={idx} className={`text-sm p-2 rounded ${correct.includes(idx) ? 'bg-red-50 border border-red-200 font-medium' : 'bg-white'}`}>
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {opt.text}
                  {correct.includes(idx) && <span className="ml-2 text-red-600 text-xs">✓ Correct</span>}
                </div>
              ))}
            </div>
            {question.details && isExpanded && (
              <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded">
                <p className="text-sm text-gray-800">{question.details}</p>
              </div>
            )}
            {(question.timeLimit || question.memoryLimit) && isExpanded && (
              <div className="mt-3 text-sm text-gray-600 flex gap-4">
                {question.timeLimit && <div>Time Limit: <span className="font-medium text-gray-800">{question.timeLimit}</span></div>}
                {question.memoryLimit && <div>Memory Limit: <span className="font-medium text-gray-800">{question.memoryLimit}</span></div>}
              </div>
            )}
          </div>
          <button onClick={() => setExpandedQuestion(isExpanded ? null : question._id)} className="ml-3 text-sm text-red-600">
            {isExpanded ? '▲ Less' : '▼ More'}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">Added: {question.createdAt ? new Date(question.createdAt).toLocaleDateString() : '-'}</div>
      </div>
    );
  };

  const topics = Object.keys(questions).length ? Object.keys(questions) : ['Aptitude', 'Technical', 'Psychometric'];
  const subtopics = selectedTopic && questions[selectedTopic] ? Object.keys(questions[selectedTopic]) : [];

  if (loading) return <div className="min-h-screen bg-gray-50 p-6"><div className="max-w-6xl mx-auto text-center">Loading library...</div></div>;
  if (error) return <div className="min-h-screen bg-gray-50 p-6"><div className="max-w-6xl mx-auto"><div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div></div></div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstitutionSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-red-700 mb-6">Library Questions</h1>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {topics.map((topic) => (
            <button key={topic} onClick={() => { setSelectedTopic(topic); setSelectedSubtopic(null); }} className={`px-6 py-3 font-semibold transition-colors ${selectedTopic === topic ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600 hover:text-gray-800'}`}>
              {topic}
            </button>
          ))}
        </div>

        {subtopics.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No library questions found.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4 sticky top-6">
                <h3 className="font-semibold text-gray-700 mb-3">Subtopics</h3>
                <div className="space-y-1">
                  {subtopics.map((s) => (
                    <button key={s} onClick={() => setSelectedSubtopic(s)} className={`w-full text-left px-3 py-2 rounded transition-colors ${selectedSubtopic === s ? 'bg-red-100 text-red-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <div className="flex justify-between items-center">
                        <span>{s}</span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">{(questions[selectedTopic][s] || []).length}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              {selectedSubtopic ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">{selectedTopic} - {selectedSubtopic}</h2>
                  {(questions[selectedTopic][selectedSubtopic] || []).length > 0 ? (
                    <div>
                      {questions[selectedTopic][selectedSubtopic].map((q, idx) => renderQuestion(q, idx))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No questions in this subtopic.</p>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">Select a subtopic to view questions</div>
              )}
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default InstitutionLibrary;
