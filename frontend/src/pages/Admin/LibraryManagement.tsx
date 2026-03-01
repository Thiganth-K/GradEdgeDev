import React, { useState, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '../../lib/api';
import { makeHeaders } from '../../lib/makeHeaders';
import Sidebar from '../../components/Admin/Sidebar';

interface Question {
  _id: string;
  text?: string;
  problemName?: string;
  options?: { text: string; isCorrect?: boolean }[];
  correctIndex?: number;
  correctIndices?: number[];
  category?: string;
  subtopic?: string;
  difficulty: string;
  tags?: string[];
  details?: string;
  createdAt: string;
  questionCategory?: 'MCQ' | 'CODING';
  problemStatement?: string;
  supportedLanguages?: string[];
  constraints?: string[];
  sampleInput?: string;
  sampleOutput?: string;
  industrialTestCases?: Array<{ input: string; output: string }>;
  hiddenTestCases?: Array<{ input: string; output: string }>;
  solutionApproach?: string;
  imageUrls?: string[];
  timeLimit?: string;
  memoryLimit?: string;
}

interface ContributorWithQuestions {
  contributor: {
    id: string;
    username: string;
    fname: string;
    lname: string;
  };
  questions: Question[];
}

interface OrganizedQuestions {
  Aptitude: { [subtopic: string]: Question[] };
  Technical: { [subtopic: string]: Question[] };
  Psychometric: { [subtopic: string]: Question[] };
  Coding: { [subtopic: string]: Question[] };
}

interface DetailedContributor {
  contributor: {
    id: string;
    username: string;
    fname: string;
    lname: string;
  };
  questions: OrganizedQuestions;
}

const AdminLibraryManagement: React.FC = () => {
  const [contributors, setContributors] = useState<ContributorWithQuestions[]>([]);
  const [selectedContributor, setSelectedContributor] = useState<DetailedContributor | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<'Aptitude' | 'Technical' | 'Psychometric' | 'Coding'>('Aptitude');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id?: string; title?: string } | null>(null);

  useEffect(() => {
    fetchContributors();
  }, []);

  const fetchContributors = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(API_ENDPOINTS.admin.libraryQuestionsByContributor, {
        headers: makeHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch library questions');
      }

      const result = await response.json();
      if (result.success) {
        setContributors(result.data);
      } else {
        setError(result.message || 'Failed to fetch library questions');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchContributorDetails = async (contributorId: string) => {
    try {
      const response = await apiFetch(API_ENDPOINTS.admin.libraryQuestionsByContributorId(contributorId), {
        headers: makeHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contributor details');
      }

      const result = await response.json();
      if (result.success) {
        // Normalize library question entries so MCQ questions expose `text` (alias of `question`)
        const data = result.data as DetailedContributor;
        const normalized: OrganizedQuestions = { Aptitude: {}, Technical: {}, Psychometric: {}, Coding: {} };
        Object.keys(data.questions || {}).forEach((topicKey) => {
          const tk = topicKey as keyof OrganizedQuestions;
          const topicObj = (data.questions as any)[tk] || {};
          Object.keys(topicObj).forEach((sub) => {
            const arr = (topicObj[sub] || []).map((entry: any) => {
              // ensure MCQ entries have `text` field (frontend expects `text`)
              if (!entry.text && entry.question) entry.text = entry.question;
              // keep legacy aliases for compatibility
              if (!entry.subtopic && entry.subTopic) entry.subtopic = entry.subTopic;
              if (!entry.difficulty && entry.metadata && entry.metadata.difficulty) entry.difficulty = entry.metadata.difficulty;
              return entry;
            });
            if (!normalized[tk]) normalized[tk] = {} as any;
            normalized[tk][sub] = arr;
          });
        });
        setSelectedContributor({ contributor: data.contributor, questions: normalized });
        setSelectedTopic('Aptitude');
        setSelectedSubtopic(null);
      } else {
        setError(result.message || 'Failed to fetch contributor details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const getCorrectAnswers = (question: Question): number[] => {
    // Priority: correctIndices > correctIndex > isCorrect in options
    if (Array.isArray(question.correctIndices) && question.correctIndices.length > 0) {
      return question.correctIndices;
    }
    
    if (question.correctIndex !== undefined && question.correctIndex !== null) {
      return [question.correctIndex];
    }
    
    const correctIndices: number[] = [];
    question.options?.forEach((option, index) => {
      if (option.isCorrect) {
        correctIndices.push(index);
      }
    });
    return correctIndices;
  };

  const renderQuestion = (question: Question, index: number) => {
    const isExpanded = expandedQuestion === question._id;
    const isCoding = question.questionCategory === 'CODING' || question.problemName;

    if (isCoding) {
      return (
        <div key={question._id} className="border border-gray-700 rounded-lg p-4 mb-3 bg-[#1a1a1a] hover:border-green-600/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-200">Q{index + 1}.</span>
                <span className="text-xs px-2 py-1 rounded bg-green-900/40 text-green-400 border border-green-600/30">Coding</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  question.difficulty === 'Easy' ? 'bg-green-900/40 text-green-400 border border-green-600/30' :
                  question.difficulty === 'Medium' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-600/30' :
                  'bg-red-900/40 text-red-400 border border-red-600/30'
                }`}>
                  {question.difficulty}
                </span>
              </div>
              <p className="text-gray-100 font-semibold mb-2">{question.problemName}</p>
              <div className="mt-2 text-sm text-gray-400 flex gap-4">
                {question.timeLimit && <div>Time: <span className="font-medium text-gray-200">{question.timeLimit}</span></div>}
                {question.memoryLimit && <div>Memory: <span className="font-medium text-gray-200">{question.memoryLimit}</span></div>}
              </div>
              {!isExpanded && <p className="text-sm text-gray-400 line-clamp-2">{question.problemStatement}</p>}
              {isExpanded && (
                <div className="space-y-3 mt-3">
                  <div>
                    <h5 className="font-semibold mb-1 text-gray-200">Problem Statement</h5>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{question.problemStatement}</p>
                  </div>
                  {question.imageUrls && question.imageUrls.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-1 text-gray-200">Problem Images</h5>
                      <div className="flex gap-2 flex-wrap">
                        {question.imageUrls.map((url, i) => (
                          <img key={i} src={url} alt={`problem-img-${i}`} className="w-28 h-28 object-cover rounded border border-gray-700" />
                        ))}
                      </div>
                    </div>
                  )}
                  {question.constraints && question.constraints.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-1 text-gray-200">Constraints</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {question.constraints.map((c, i) => (
                          <li key={i} className="text-sm text-gray-300">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {question.supportedLanguages && question.supportedLanguages.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-1 text-gray-200">Supported Languages</h5>
                      <div className="flex gap-2 flex-wrap">
                        {question.supportedLanguages.map((lang, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-green-900/30 text-green-400 border border-green-600/30 rounded">{lang}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {question.sampleInput && question.sampleOutput && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <h5 className="font-semibold mb-1 text-gray-200">Sample Input</h5>
                        <pre className="text-xs bg-[#141414] p-3 rounded border border-gray-700 overflow-x-auto text-gray-300">{question.sampleInput}</pre>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-1 text-gray-200">Sample Output</h5>
                        <pre className="text-xs bg-[#141414] p-3 rounded border border-gray-700 overflow-x-auto text-gray-300">{question.sampleOutput}</pre>
                      </div>
                    </div>
                  )}
                  {question.solutionApproach && (
                    <div>
                      <h5 className="font-semibold mb-1 text-gray-200">Solution Approach</h5>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap bg-blue-900/20 p-3 rounded border border-blue-600/30">{question.solutionApproach}</p>
                    </div>
                  )}
                  {question.industrialTestCases && question.industrialTestCases.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-1 text-gray-200">Industrial Test Cases</h5>
                      <div className="space-y-2">
                        {question.industrialTestCases.map((tc, i) => (
                          <div key={i} className="grid grid-cols-2 gap-3 p-3 bg-blue-900/20 border border-blue-600/30 rounded">
                            <div>
                              <p className="text-xs font-semibold text-blue-400 mb-1">Input {i + 1}</p>
                              <pre className="text-xs bg-[#141414] p-2 rounded border border-gray-700 overflow-x-auto text-gray-300">{tc.input}</pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-blue-400 mb-1">Output {i + 1}</p>
                              <pre className="text-xs bg-[#141414] p-2 rounded border border-gray-700 overflow-x-auto text-gray-300">{tc.output}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {question.hiddenTestCases && question.hiddenTestCases.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-1 text-gray-200">Hidden Test Cases</h5>
                      <div className="space-y-2">
                        {question.hiddenTestCases.map((tc, i) => (
                          <div key={i} className="grid grid-cols-2 gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded">
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-1">Input {i + 1}</p>
                              <pre className="text-xs bg-[#141414] p-2 rounded border border-gray-700 overflow-x-auto text-gray-300">{tc.input}</pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-1">Output {i + 1}</p>
                              <pre className="text-xs bg-[#141414] p-2 rounded border border-gray-700 overflow-x-auto text-gray-300">{tc.output}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setExpandedQuestion(isExpanded ? null : question._id)}
              className="ml-3 text-sm text-green-500 hover:text-green-400 font-medium"
            >
              {isExpanded ? '▲ Less' : '▼ More'}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Added: {new Date(question.createdAt).toLocaleDateString()}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setDeleteModal({ open: true, id: question._id, title: (question.problemName || question.text || 'question') })}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Delete from Library
            </button>
          </div>
        </div>
      );
    }

    // MCQ Question rendering
    const correctAnswers = getCorrectAnswers(question);

    return (
      <div key={question._id} className="border border-gray-700 rounded-lg p-4 mb-3 bg-[#1a1a1a] hover:border-red-600/50 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-200">Q{index + 1}.</span>
              <span 
                className={`text-xs px-2 py-1 rounded ${
                  question.difficulty === 'easy' ? 'bg-green-900/40 text-green-400 border border-green-600/30' :
                  question.difficulty === 'medium' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-600/30' :
                  'bg-red-900/40 text-red-400 border border-red-600/30'
                }`}
              >
                {question.difficulty}
              </span>
            </div>
            <p className="text-gray-100 mb-3">{question.text}</p>
            { (question as any).questionImageUrls && (question as any).questionImageUrls.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {(question as any).questionImageUrls.map((u: string, i: number) => (
                  <img key={i} src={u} alt={`qimg-${i}`} className="w-28 h-28 object-cover rounded border border-gray-700" />
                ))}
              </div>
            )}
            <div className="space-y-2 mb-2">
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className={`text-sm p-3 rounded border ${correctAnswers.includes(optIndex) ? 'bg-green-900/20 border-green-600/50 font-medium' : 'bg-[#141414] border-gray-700'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-6 font-semibold text-gray-300">{String.fromCharCode(65 + optIndex)}.</div>
                    <div className="flex-1">
                      <div className="text-gray-200">{option.text}</div>
                      { (option as any).imageUrls && (option as any).imageUrls.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {(option as any).imageUrls.map((u: string, i: number) => <img key={i} src={u} className="w-20 h-20 object-cover rounded border border-gray-700" />)}
                        </div>
                      )}
                    </div>
                    {correctAnswers.includes(optIndex) && <div className="ml-2 text-green-400 text-xs">✓ Correct</div>}
                  </div>
                </div>
              ))}
            </div>
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {question.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs bg-blue-900/30 text-blue-400 border border-blue-600/30 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {question.details && isExpanded && (
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-600/30 rounded">
                <p className="text-sm text-gray-300"><strong className="text-blue-400">Details:</strong> {question.details}</p>
              </div>
            )}
            { (question as any).solutions && (question as any).solutions.length > 0 && isExpanded && (
              <div className="mt-3">
                <h4 className="font-semibold mb-2 text-gray-200">Solutions</h4>
                {(question as any).solutions.map((s: any, si: number) => (
                  <div key={si} className="mb-3 bg-[#141414] p-3 rounded border border-gray-700">
                    {s.explanation && <div className="text-sm mb-2 text-gray-300">{s.explanation}</div>}
                    {s.imageUrls && s.imageUrls.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {s.imageUrls.map((u: string, i: number) => <img key={i} src={u} className="w-28 h-28 object-cover rounded border border-gray-700" />)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setExpandedQuestion(isExpanded ? null : question._id)}
            className="ml-3 text-sm text-red-500 hover:text-red-400 font-medium"
          >
            {isExpanded ? '▲ Less' : '▼ More'}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Added: {new Date(question.createdAt).toLocaleDateString()}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setDeleteModal({ open: true, id: question._id, title: (question.problemName || question.text || 'question') })}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Delete from Library
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen bg-[#0d0d0d] p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center text-gray-400 py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
              <p>Loading library...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen bg-[#0d0d0d] p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-900/20 border border-red-600/50 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const topics: Array<'Aptitude' | 'Technical' | 'Psychometric' | 'Coding'> = ['Aptitude', 'Technical', 'Psychometric', 'Coding'];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-[#0d0d0d] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-100">Library Management</h1>
              <p className="text-gray-400 mt-1">Manage and browse question library by contributors</p>
            </div>
            {selectedContributor && (
              <button
                onClick={() => {
                  setSelectedContributor(null);
                  setSelectedTopic('Aptitude');
                  setSelectedSubtopic(null);
                }}
                className="px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 border border-gray-700 transition-colors"
              >
                ← Back to Contributors
              </button>
            )}
          </div>

          {!selectedContributor ? (
            /* Contributors List */
            <div className="bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-800">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-gray-100">Contributors with Library Questions</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {contributors.length} contributor{contributors.length !== 1 ? 's' : ''} have contributed questions to the library
                </p>
              </div>
              {contributors.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No library questions found.
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {contributors.map(item => (
                    <div 
                      key={item.contributor.id} 
                      className="p-6 hover:bg-[#141414] cursor-pointer transition-colors"
                      onClick={() => fetchContributorDetails(item.contributor.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-100">
                            {item.contributor.fname} {item.contributor.lname}
                          </h3>
                          <p className="text-sm text-gray-400">@{item.contributor.username}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-500">{item.questions.length}</p>
                            <p className="text-xs text-gray-500">Questions</p>
                          </div>
                          <button className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 shadow-lg transition-all">
                            View →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            ) : (
            /* Contributor Details View */
            <div>
              <div className="bg-[#1a1a1a] rounded-lg shadow-xl p-6 mb-6 border border-gray-800">
                <h2 className="text-2xl font-bold text-gray-100">
                  {selectedContributor.contributor.fname} {selectedContributor.contributor.lname}
                </h2>
                <p className="text-gray-400">@{selectedContributor.contributor.username}</p>
              </div>

              {/* Topic Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-800">
                {topics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setSelectedSubtopic(null);
                    }}
                    className={`px-6 py-3 font-semibold transition-colors ${
                      selectedTopic === topic
                        ? 'border-b-2 border-red-600 text-red-500'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {/* Subtopics and Questions */}
              {Object.keys(selectedContributor.questions[selectedTopic] || {}).length === 0 ? (
                <div className="bg-[#1a1a1a] rounded-lg shadow-xl p-8 text-center text-gray-400 border border-gray-800">
                  No questions found in {selectedTopic} category.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Subtopics Sidebar */}
                  <div className="lg:col-span-1">
                    <div className="bg-[#1a1a1a] rounded-lg shadow-xl p-4 sticky top-6 border border-gray-800">
                      <h3 className="font-semibold text-gray-200 mb-3">Subtopics</h3>
                      <div className="space-y-1">
                        {Object.keys(selectedContributor.questions[selectedTopic]).map(subtopic => {
                          const count = selectedContributor.questions[selectedTopic][subtopic]?.length || 0;
                          return (
                            <button
                              key={subtopic}
                              onClick={() => setSelectedSubtopic(subtopic)}
                              className={`w-full text-left px-3 py-2 rounded transition-colors ${
                                selectedSubtopic === subtopic
                                  ? 'bg-red-900/30 text-red-400 font-medium border border-red-600/50'
                                  : 'text-gray-400 hover:bg-gray-800'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span>{subtopic}</span>
                                <span className="text-xs bg-gray-800 px-2 py-1 rounded">{count}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Questions Display */}
                  <div className="lg:col-span-3">
                    {selectedSubtopic ? (
                      <div className="bg-[#1a1a1a] rounded-lg shadow-xl p-6 border border-gray-800">
                        <h2 className="text-xl font-semibold text-gray-100 mb-4">
                          {selectedTopic} - {selectedSubtopic}
                        </h2>
                        {selectedContributor.questions[selectedTopic][selectedSubtopic]?.length > 0 ? (
                          <div>
                            {selectedContributor.questions[selectedTopic][selectedSubtopic].map((q, idx) => 
                              renderQuestion(q, idx)
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-center py-8">
                            No questions in this subtopic.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[#1a1a1a] rounded-lg shadow-xl p-8 text-center text-gray-400 border border-gray-800">
                        Select a subtopic to view questions
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {deleteModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold">Confirm Delete</h2>
              <button onClick={() => setDeleteModal(null)} className="text-white/70">✕</button>
            </div>
            <div className="p-6">
              <p className="text-gray-700">Are you sure you want to remove <strong>{deleteModal?.title}</strong> from the Library? This will only remove the Library entry and will not delete the original contributor submission.</p>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
              <button
                onClick={async () => {
                  if (!deleteModal?.id) return;
                  try {
                    const res = await apiFetch(API_ENDPOINTS.admin.removeQuestionFromLibrary(deleteModal.id), {
                      method: 'DELETE',
                      headers: makeHeaders()
                    });
                    const body = await res.json();
                    if (!res.ok) throw new Error(body.message || 'Delete failed');
                    // refresh list
                    if (selectedContributor) {
                      fetchContributorDetails(selectedContributor.contributor.id);
                    } else {
                      fetchContributors();
                    }
                    setDeleteModal(null);
                    setError('');
                  } catch (err: any) {
                    setError(err.message || 'Failed to delete');
                    setDeleteModal(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLibraryManagement;
