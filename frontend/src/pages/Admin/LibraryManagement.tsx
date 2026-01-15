import React, { useState, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '../../lib/api';
import { makeHeaders } from '../../lib/makeHeaders';

interface Question {
  _id: string;
  text: string;
  options: { text: string; isCorrect?: boolean }[];
  correctIndex?: number;
  correctIndices?: number[];
  category: string;
  subtopic: string;
  difficulty: string;
  tags?: string[];
  details?: string;
  createdAt: string;
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
  const [selectedTopic, setSelectedTopic] = useState<'Aptitude' | 'Technical' | 'Psychometric'>('Aptitude');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

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
        setSelectedContributor(result.data);
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
    question.options.forEach((option, index) => {
      if (option.isCorrect) {
        correctIndices.push(index);
      }
    });
    return correctIndices;
  };

  const renderQuestion = (question: Question, index: number) => {
    const isExpanded = expandedQuestion === question._id;
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
            <p className="text-gray-800 mb-2">{question.text}</p>
            <div className="space-y-1 mb-2">
              {question.options.map((option, optIndex) => (
                <div 
                  key={optIndex} 
                  className={`text-sm p-2 rounded ${
                    correctAnswers.includes(optIndex) 
                      ? 'bg-green-50 border border-green-300 font-medium' 
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                  {option.text}
                  {correctAnswers.includes(optIndex) && (
                    <span className="ml-2 text-green-600 text-xs">✓ Correct</span>
                  )}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading library...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const topics: Array<'Aptitude' | 'Technical' | 'Psychometric'> = ['Aptitude', 'Technical', 'Psychometric'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Library Management</h1>
          {selectedContributor && (
            <button
              onClick={() => {
                setSelectedContributor(null);
                setSelectedTopic('Aptitude');
                setSelectedSubtopic(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              ← Back to Contributors
            </button>
          )}
        </div>

        {!selectedContributor ? (
          /* Contributors List */
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Contributors with Library Questions</h2>
              <p className="text-sm text-gray-600 mt-1">
                {contributors.length} contributor{contributors.length !== 1 ? 's' : ''} have contributed questions to the library
              </p>
            </div>
            {contributors.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No library questions found.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {contributors.map(item => (
                  <div 
                    key={item.contributor.id} 
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => fetchContributorDetails(item.contributor.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.contributor.fname} {item.contributor.lname}
                        </h3>
                        <p className="text-sm text-gray-600">@{item.contributor.username}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{item.questions.length}</p>
                          <p className="text-xs text-gray-500">Questions</p>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
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
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedContributor.contributor.fname} {selectedContributor.contributor.lname}
              </h2>
              <p className="text-gray-600">@{selectedContributor.contributor.username}</p>
            </div>

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
            {Object.keys(selectedContributor.questions[selectedTopic] || {}).length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No questions found in {selectedTopic} category.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Subtopics Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow p-4 sticky top-6">
                    <h3 className="font-semibold text-gray-700 mb-3">Subtopics</h3>
                    <div className="space-y-1">
                      {Object.keys(selectedContributor.questions[selectedTopic]).map(subtopic => {
                        const count = selectedContributor.questions[selectedTopic][subtopic]?.length || 0;
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
                      {selectedContributor.questions[selectedTopic][selectedSubtopic]?.length > 0 ? (
                        <div>
                          {selectedContributor.questions[selectedTopic][selectedSubtopic].map((q, idx) => 
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
        )}
      </div>
    </div>
  );
};

export default AdminLibraryManagement;
