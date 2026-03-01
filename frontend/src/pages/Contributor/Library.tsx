import React, { useState, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '../../lib/api';
import { makeHeaders } from '../../lib/makeHeaders';

interface Question {
  _id: string;
  text?: string; // For MCQ
  problemName?: string; // For Coding
  options?: { text: string; isCorrect?: boolean; imageUrls?: string[] }[];
  correctIndex?: number;
  correctIndices?: number[];
  category?: string;
  subtopic?: string;
  subTopic?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
  details?: string;
  createdAt: string;
  
  // For all types
  questionCategory?: 'MCQ' | 'CODING';
  questionType?: 'mcq' | 'placement';
  question?: string; // MCQ question text
  questionImageUrls?: string[];
  solutions?: Array<{ explanation?: string; imageUrls?: string[] }>;
  
  // For coding questions
  problemStatement?: string;
  supportedLanguages?: string[];
  constraints?: string[];
  sampleInput?: string;
  sampleOutput?: string;
  industrialTestCases?: Array<{ input: string; output: string }>;
  hiddenTestCases?: Array<{ input: string; output: string }>;
  solutionApproach?: string;
  imageUrls?: string[];
  imagePublicIds?: string[];
}

interface OrganizedQuestions {
  Aptitude: { [subtopic: string]: Question[] };
  Technical: { [subtopic: string]: Question[] };
  Psychometric: { [subtopic: string]: Question[] };
  Coding: { [subtopic: string]: Question[] };
}

const ContributorLibrary: React.FC = () => {
  const [questions, setQuestions] = useState<OrganizedQuestions>({
    Aptitude: {},
    Technical: {},
    Psychometric: {},
    Coding: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<'Aptitude' | 'Technical' | 'Psychometric' | 'Coding'>('Aptitude');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    fetchLibraryQuestions();
  }, []);

  const fetchLibraryQuestions = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(API_ENDPOINTS.contributor.libraryMyQuestions, {
        headers: makeHeaders('contributor_token'),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch library questions');
      }

      const result = await response.json();
      if (result.success) {
        setQuestions(result.data);
      } else {
        setError(result.message || 'Failed to fetch library questions');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
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
      // Render Coding Question
      return (
        <div key={question._id} className="border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-700">Q{index + 1}.</span>
                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-bold">
                  Coding
                </span>
                <span 
                  className={`text-xs px-2 py-1 rounded ${
                    (question.difficulty === 'easy' || question.difficulty === 'Easy') ? 'bg-green-100 text-green-700' :
                    (question.difficulty === 'medium' || question.difficulty === 'Medium') ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}
                >
                  {question.difficulty}
                </span>
              </div>
              <p className="text-gray-800 font-semibold mb-2">{question.problemName}</p>
              {!isExpanded && question.problemStatement && (
                <p className="text-sm text-gray-600 line-clamp-2">{question.problemStatement}</p>
              )}
            </div>?
            <button
              onClick={() => setExpandedQuestion(isExpanded ? null : question._id)}
              className="ml-3 text-sm text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? '▲ Less' : '▼ More'}
            </button>
          </div>
          
          {isExpanded && (
            <div className="mt-4 space-y-3">
              {question.problemStatement && (
                <div>
                  <h5 className="font-semibold mb-1">Problem Statement</h5>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{question.problemStatement}</p>
                </div>
              )}
              
              {question.imageUrls && question.imageUrls.length > 0 && (
                <div>
                  <h5 className="font-semibold mb-1">Problem Images</h5>
                  <div className="flex gap-2 flex-wrap">
                    {question.imageUrls.map((url, i) => (
                      <img key={i} src={url} alt={`problem-img-${i}`} className="w-28 h-28 object-cover rounded-lg border border-gray-200 shadow-sm" />
                    ))}
                  </div>
                </div>
              )}
              
              {question.constraints && question.constraints.length > 0 && (
                <div>
                  <h5 className="font-semibold mb-1">Constraints</h5>
                  <ul className="list-disc list-inside space-y-1">
                    {question.constraints.map((c, i) => (
                      <li key={i} className="text-sm text-gray-700">{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {question.supportedLanguages && question.supportedLanguages.length > 0 && (
                <div>
                  <h5 className="font-semibold mb-1">Supported Languages</h5>
                  <div className="flex gap-2 flex-wrap">
                    {question.supportedLanguages.map((lang, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">{lang}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {question.sampleInput && question.sampleOutput && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h5 className="font-semibold mb-1">Sample Input</h5>
                    <pre className="text-xs bg-gray-100 p-3 rounded border overflow-x-auto">{question.sampleInput}</pre>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Sample Output</h5>
                    <pre className="text-xs bg-gray-100 p-3 rounded border overflow-x-auto">{question.sampleOutput}</pre>
                  </div>
                </div>
              )}
              
              {question.solutionApproach && (
                <div>
                  <h5 className="font-semibold mb-1">Solution Approach</h5>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap bg-blue-50 p-3 rounded border border-blue-200">{question.solutionApproach}</p>
                </div>
              )}

              {question.industrialTestCases && question.industrialTestCases.length > 0 && (
                <div>
                  <h5 className="font-semibold mb-1">Industrial Test Cases</h5>
                  <div className="space-y-2">
                    {question.industrialTestCases.map((tc, i) => (
                      <div key={i} className="grid grid-cols-2 gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <div>
                          <p className="text-xs font-semibold text-blue-700 mb-1">Input {i + 1}</p>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">{tc.input}</pre>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-700 mb-1">Output {i + 1}</p>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">{tc.output}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {question.hiddenTestCases && question.hiddenTestCases.length > 0 && (
                <div>
                  <h5 className="font-semibold mb-1">Hidden Test Cases</h5>
                  <div className="space-y-2">
                    {question.hiddenTestCases.map((tc, i) => (
                      <div key={i} className="grid grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Input {i + 1}</p>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">{tc.input}</pre>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Output {i + 1}</p>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">{tc.output}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            Added: {new Date(question.createdAt).toLocaleDateString()}
          </div>
        </div>
      );
    }
    
    // Render MCQ Question
    const correctAnswers = getCorrectAnswers(question);

    return (
      <div key={question._id} className="border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-700">Q{index + 1}.</span>
              <span 
                className={`text-xs px-2 py-1 rounded ${
                  question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}
              >
                {question.difficulty}
              </span>
            </div>
            <p className="text-gray-800 mb-2">{question.question || question.text}</p>
            { (question as any).questionImageUrls && (question as any).questionImageUrls.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {(question as any).questionImageUrls.map((u: string, i: number) => (
                  <img key={i} src={u} alt={`qimg-${i}`} className="w-28 h-28 object-cover rounded" />
                ))}
              </div>
            )}
            <div className="space-y-1 mb-2">
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className={`text-sm p-2 rounded ${correctAnswers.includes(optIndex) ? 'bg-green-50 border border-green-300 font-medium' : 'bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-6 font-semibold">{String.fromCharCode(65 + optIndex)}.</div>
                    <div className="flex-1">
                      <div>{option.text}</div>
                      { (option as any).imageUrls && (option as any).imageUrls.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {(option as any).imageUrls.map((u: string, i: number) => <img key={i} src={u} className="w-20 h-20 object-cover rounded" />)}
                        </div>
                      )}
                    </div>
                    {correctAnswers.includes(optIndex) && <div className="ml-2 text-green-600 text-xs">✓ Correct</div>}
                  </div>
                </div>
              ))}
            </div>
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {question.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {question.details && isExpanded && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-gray-700"><strong>Details:</strong> {question.details}</p>
              </div>
            )}
            { (question as any).solutions && (question as any).solutions.length > 0 && isExpanded && (
              <div className="mt-3">
                <h4 className="font-semibold mb-2">Solutions</h4>
                {(question as any).solutions.map((s: any, si: number) => (
                  <div key={si} className="mb-3">
                    {s.explanation && <div className="text-sm mb-2">{s.explanation}</div>}
                    {s.imageUrls && s.imageUrls.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {s.imageUrls.map((u: string, i: number) => <img key={i} src={u} className="w-28 h-28 object-cover rounded" />)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setExpandedQuestion(isExpanded ? null : question._id)}
            className="ml-3 text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? '▲ Less' : '▼ More'}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Added: {new Date(question.createdAt).toLocaleDateString()}
        </div>
      </div>
    );
  };

  const topics: Array<'Aptitude' | 'Technical' | 'Psychometric' | 'Coding'> = ['Aptitude', 'Technical', 'Psychometric', 'Coding'];
  const subtopics = Object.keys(questions[selectedTopic] || {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading library questions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Library Questions</h1>

        {/* Topic Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-300">
          {topics.map(topic => (
            <button
              key={topic}
              onClick={() => {
                setSelectedTopic(topic);
                setSelectedSubtopic(null);
              }}
              className={`px-6 py-3 font-semibold transition-colors ${
                selectedTopic === topic
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Subtopics and Questions */}
        {subtopics.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No library questions found in {selectedTopic} category.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Subtopics Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4 sticky top-6">
                <h3 className="font-semibold text-gray-700 mb-3">Subtopics</h3>
                <div className="space-y-1">
                  {subtopics.map(subtopic => {
                    const count = questions[selectedTopic][subtopic]?.length || 0;
                    return (
                      <button
                        key={subtopic}
                        onClick={() => setSelectedSubtopic(subtopic)}
                        className={`w-full text-left px-3 py-2 rounded transition-colors ${
                          selectedSubtopic === subtopic
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{subtopic}</span>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{count}</span>
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
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {selectedTopic} - {selectedSubtopic}
                  </h2>
                  {questions[selectedTopic][selectedSubtopic]?.length > 0 ? (
                    <div>
                      {questions[selectedTopic][selectedSubtopic].map((q, idx) => 
                        renderQuestion(q, idx)
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No questions in this subtopic.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  Select a subtopic to view questions
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContributorLibrary;
