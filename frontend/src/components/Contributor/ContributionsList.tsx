import React from 'react';

interface Question {
  _id: string;
  text: string;
  options: Array<{ text: string }>;
  correctIndex: number;
  category: string;
  difficulty: string;
  tags?: string[];
  createdAt: string;
}

interface ContributionsListProps {
  questions: Question[];
}

const ContributionsList: React.FC<ContributionsListProps> = ({ questions }) => {
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

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border-2 border-gray-300">
        <p className="text-gray-500 text-lg">No contributions found</p>
        <p className="text-gray-400 text-sm mt-2">Your contributed questions will appear here</p>
      </div>
    );
  }

  return (
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
          </div>

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
                {option.text}
                {optIndex === question.correctIndex && (
                  <span className="ml-2 text-green-600">✓ Correct</span>
                )}
              </div>
            ))}
          </div>

          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
        </div>
      ))}
    </div>
  );
};

export default ContributionsList;
