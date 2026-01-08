import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FacultyTestResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('faculty_token') : null;

  const load = async () => {
    setError(null);
    try {
      const res = await fetch(`${BACKEND}/institution/faculty/tests/${id}/results`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) throw new Error(body.message || 'failed to load results');
      setData(body.data);
      // Auto-select first completed student
      const completed = body.data?.status?.find((s: any) => s.status === 'completed');
      if (completed) setSelectedStudent(completed.studentId);
    } catch (err: any) {
      setError(err.message || 'failed to load results');
    }
  };

  useEffect(() => { load(); }, []);

  if (!data) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold">Loading Results...</h2>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  const { test, status } = data;
  const currentStudent = selectedStudent ? status.find((s: any) => s.studentId === selectedStudent) : null;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">{test.name}</h2>
              <p className="text-gray-600 text-sm">Type: <span className="font-medium capitalize">{test.type}</span> • Questions: {test.questions?.length || 0}</p>
            </div>
            <button onClick={() => navigate('/faculty/dashboard')} className="px-4 py-2 border rounded hover:bg-gray-50">Back to Dashboard</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Student List */}
          <div className="bg-white rounded shadow p-6 h-fit">
            <h3 className="text-lg font-semibold mb-4">Student Performance</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {status.map((s: any) => (
                <button
                  key={s.studentId}
                  onClick={() => setSelectedStudent(s.studentId)}
                  className={`w-full text-left p-3 rounded border-l-4 transition ${
                    selectedStudent === s.studentId
                      ? 'bg-blue-50 border-l-blue-500'
                      : 'bg-gray-50 border-l-gray-300 hover:bg-white'
                  }`}
                >
                  <div className="font-medium text-sm">{s.name || s.student || 'Unknown'}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Status: <span className={s.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}>{s.status}</span>
                  </div>
                  {s.status === 'completed' && (
                    <div className="text-xs font-semibold text-blue-600 mt-1">
                      Score: {s.score}% ({s.correctCount}/{s.total})
                    </div>
                  )}
                </button>
              ))}
              {status.length === 0 && <p className="text-sm text-gray-600">No students assigned.</p>}
            </div>
          </div>

          {/* Answer Sheet */}
          <div className="col-span-2 bg-white rounded shadow p-6">
            {!currentStudent ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Select a student to view their answer sheet</p>
              </div>
            ) : currentStudent.status === 'pending' ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Student has not started the test yet.</p>
              </div>
            ) : (
              <div>
                {/* Student Info */}
                <div className="mb-6 pb-4 border-b">
                  <h3 className="text-xl font-bold mb-2">{currentStudent.name || currentStudent.student}</h3>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Score</div>
                      <div className="text-2xl font-bold text-green-600">{currentStudent.score}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Correct Answers</div>
                      <div className="text-2xl font-bold text-blue-600">{currentStudent.correctCount}/{currentStudent.total}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Time Taken</div>
                      <div className="text-2xl font-bold text-gray-700">
                        {Math.floor((currentStudent.timeTakenSeconds || 0) / 60)}m {(currentStudent.timeTakenSeconds || 0) % 60}s
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Status</div>
                      <div className="text-xl font-bold text-green-600">Completed</div>
                    </div>
                  </div>
                </div>

                {/* Questions and Answers */}
                <div className="space-y-4">
                  {test.questions.map((q: any, qIdx: number) => {
                    const response = currentStudent.responses?.[qIdx];
                    const isCorrect = response?.correct;
                    return (
                      <div key={qIdx} className={`border-l-4 p-4 rounded ${isCorrect ? 'bg-green-50 border-l-green-500' : 'bg-red-50 border-l-red-500'}`}>
                        <div className="font-semibold mb-3 flex items-center justify-between">
                          <span>Q{qIdx + 1}. {q.text}</span>
                          <span className={`text-sm font-bold px-2 py-1 rounded ${isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {isCorrect ? '✓ Correct' : '✗ Wrong'}
                          </span>
                        </div>
                        <div className="space-y-2 ml-2">
                          {q.options.map((opt: string, optIdx: number) => {
                            const isCorrectOption = optIdx === q.correctIndex;
                            const isSelectedOption = optIdx === response?.selectedIndex;
                            return (
                              <div
                                key={optIdx}
                                className={`p-2 rounded border ${
                                  isCorrectOption
                                    ? 'border-green-500 bg-green-100'
                                    : isSelectedOption && !isCorrectOption
                                      ? 'border-red-500 bg-red-100'
                                      : 'border-gray-300'
                                }`}
                              >
                                <span className="font-medium">{String.fromCharCode(65 + optIdx)})</span> {opt}
                                {isCorrectOption && <span className="ml-2 text-green-700 font-bold">✓ Correct Answer</span>}
                                {isSelectedOption && !isCorrectOption && <span className="ml-2 text-red-700 font-bold">✗ Student Answer</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyTestResults;
