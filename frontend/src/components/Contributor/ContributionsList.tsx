import React, { useState } from 'react';

interface Question {
  _id: string;
  text: string;
  options: Array<{ text?: string; isCorrect?: boolean; imageUrls?: string[] }>;
  correctIndex?: number;
  correctIndices?: number[];
  category: string;
  difficulty: string;
  tags?: string[];
  details?: string;
  questionImageUrls?: string[];
  solutions?: Array<{ explanation?: string; imageUrls?: string[] }>
  createdAt: string;
}

interface ContributionsListProps {
  questions: Question[];
}

const ContributionsList: React.FC<ContributionsListProps> = ({ questions }) => {
  const [selected, setSelected] = useState<Question | null>(null);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'aptitude':
        return 'bg-blue-200 text-blue-900';
      case 'technical':
        return 'bg-purple-200 text-purple-900';
      case 'psychometric':
        return 'bg-green-200 text-green-900';
      default:
        return 'bg-gray-200 text-gray-900';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-200 text-green-900';
      case 'medium':
        return 'bg-yellow-200 text-yellow-900';
      case 'hard':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-200 text-gray-900';
    }
  };

  const getCorrectAnswers = (question: Question): number[] => {
    if (Array.isArray(question.correctIndices) && question.correctIndices.length > 0) return question.correctIndices;
    if (typeof question.correctIndex === 'number') return [question.correctIndex];
    const correct: number[] = [];
    question.options.forEach((opt, idx) => { if (opt && opt.isCorrect) correct.push(idx); });
    return correct;
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border-2 border-gray-300">
        <p className="text-gray-500 text-lg">No contributions found</p>
        <p className="text-gray-400 text-sm mt-2">Your contributed questions will appear here</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {questions.map((question, index) => (
        <div key={question._id} className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-red-600 transition-colors">
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
            <span className="text-sm text-gray-500">{formatDate(question.createdAt)}</span>
          </div>

          <div className="mb-3">
            <p className="text-black font-medium">{question.text}</p>
            {question.questionImageUrls && question.questionImageUrls.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {question.questionImageUrls.map((u, i) => (
                  <img key={i} src={u} alt={`qimg-${i}`} className="w-24 h-24 object-cover rounded" />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 mb-3">
            {question.options.map((option, optIndex) => {
              const isCorrect = getCorrectAnswers(question).includes(optIndex);
              return (
                <div key={optIndex} className={`px-3 py-2 rounded ${isCorrect ? 'bg-green-100 border-2 border-green-500 text-green-900 font-semibold' : 'bg-gray-100 border border-gray-300 text-gray-700'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-6 font-semibold">{String.fromCharCode(65 + optIndex)}.</div>
                    <div className="flex-1">
                      <div>{option.text}</div>
                      {option.imageUrls && option.imageUrls.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {option.imageUrls.map((u, i) => <img key={i} src={u} className="w-20 h-20 object-cover rounded" />)}
                        </div>
                      )}
                    </div>
                    {isCorrect && <div className="ml-2 text-green-600">✓ Correct</div>}
                  </div>
                </div>
              );
            })}
          </div>
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {question.tags.map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setSelected(question)}
              className="px-4 py-2 bg-black text-white rounded-md text-sm font-semibold hover:bg-gray-800"
            >
              View
            </button>
          </div>
        </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-2xl font-bold">Question Details</h2>
              <button onClick={() => setSelected(null)} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Question</h3>
                <p className="text-black font-medium">{selected.text}</p>
                {selected.questionImageUrls && selected.questionImageUrls.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {selected.questionImageUrls.map((u, i) => <img key={i} src={u} className="w-24 h-24 object-cover rounded" />)}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Options</h3>
                <div className="space-y-2">
                  {selected.options.map((opt, i) => {
                    const isCorrect = getCorrectAnswers(selected).includes(i);
                    return (
                      <div key={i} className={`px-3 py-2 rounded ${isCorrect ? 'bg-green-100 border-2 border-green-500 text-green-900 font-semibold' : 'bg-gray-100 border border-gray-300 text-gray-700'}`}>
                        <div className="flex items-start gap-3">
                          <div className="w-6 font-semibold">{String.fromCharCode(65 + i)}.</div>
                          <div className="flex-1">
                            <div>{opt.text}</div>
                            { (opt as any).imageUrls && (opt as any).imageUrls.length > 0 && (
                              <div className="mt-2 flex gap-2">
                                {(opt as any).imageUrls.map((u: string, idx: number) => <img key={idx} src={u} className="w-20 h-20 object-cover rounded" />)}
                              </div>
                            )}
                          </div>
                          {isCorrect && <div className="ml-2 text-green-600">✓ Correct</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selected.details && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Details / Explanation</h3>
                  <p className="text-gray-700 bg-gray-50 border border-gray-300 rounded-lg p-3">{selected.details}</p>
                </div>
              )}

              {selected.tags && selected.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">#{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.solutions && selected.solutions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Solutions</h3>
                  {selected.solutions.map((s, si) => (
                    <div key={si} className="mb-3">
                      {s.explanation && <div className="text-sm mb-2">{s.explanation}</div>}
                      { (s as any).imageUrls && (s as any).imageUrls.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {(s as any).imageUrls.map((u: string, i: number) => <img key={i} src={u} className="w-28 h-28 object-cover rounded" />)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-sm text-gray-600">
                <div>Category: {selected.category}</div>
                <div>Difficulty: {selected.difficulty}</div>
                <div>Created: {formatDate(selected.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContributionsList;
