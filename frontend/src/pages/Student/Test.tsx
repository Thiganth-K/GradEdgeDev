import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL, { getApiUrl } from '../../lib/api';

const StudentTest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<any | null>(null);
  const [answers, setAnswers] = useState<(number | number[])[]>([]); // Mixed array: number for single, number[] for multiple
  const [startedAt, setStartedAt] = useState<string>('');
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('student_token') : null;

  const load = async () => {
    setError(null);
    try {
      const res = await fetch(getApiUrl(`/institution/student/tests/${id}`), { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) throw new Error(body.message || 'failed to load test');
      // Normalize questions and set test
      const normalizedQuestions = (body.data && Array.isArray(body.data.questions)) ? body.data.questions : [];
      console.debug('[StudentTest] loaded test data', body.data);
      setTest({ ...(body.data || {}), questions: normalizedQuestions });
      // Initialize answers: null for single-answer, [] for multiple-answer questions
      setAnswers(normalizedQuestions.map((q: any) => q.isMultipleAnswer ? [] : null));
      setTimeRemaining((body.data?.durationMinutes || 30) * 60); // convert to seconds
      const startRes = await fetch(getApiUrl(`/institution/student/tests/${id}/start`), { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const sBody = await startRes.json().catch(() => ({}));
      if (startRes.ok && sBody.success) setStartedAt(sBody.data?.startedAt || new Date().toISOString());
    } catch (err:any) {
      setError(err.message || 'failed to load');
    }
  };

  useEffect(() => { load(); }, []);

  // Timer countdown
  useEffect(() => {
    if (!test || result) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time runs out
          submit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [test, result]);

  const setSingleAnswer = (qIdx: number, optIdx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  };

  const toggleMultipleAnswer = (qIdx: number, optIdx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      const currentAnswers = Array.isArray(next[qIdx]) ? next[qIdx] as number[] : [];
      if (currentAnswers.includes(optIdx)) {
        next[qIdx] = currentAnswers.filter(i => i !== optIdx);
      } else {
        next[qIdx] = [...currentAnswers, optIdx];
      }
      return next;
    });
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(getApiUrl(`/institution/student/tests/${id}/submit`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ responses: answers, startedAt }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) throw new Error(body.message || 'submit failed');
      setResult(body.data);
    } catch (err:any) {
      setError(err.message || 'submit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeColor = timeRemaining <= 300 ? 'text-red-600' : 'text-gray-600';

  const [showDebug, setShowDebug] = useState(false);

  if (!test) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold">Loading Test...</h2>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4 text-green-600">Test Submitted Successfully!</h2>
          <div className="space-y-3 mb-6">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-lg font-semibold">Score: <span className="text-2xl text-green-600">{result.score}%</span></p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-gray-700">Correct Answers</p>
                <p className="text-2xl font-bold text-blue-600">{result.correctCount}/{result.total}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="text-sm text-gray-700">Time Taken</p>
                <p className="text-2xl font-bold text-gray-600">{Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button onClick={() => navigate('/student/dashboard')} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">{test.name}</h2>
              <p className="text-gray-600 text-sm">Type: <span className="font-medium capitalize">{test.type}</span> • Questions: {test.questions?.length || 0}</p>
            </div>
            <div className={`text-right ${timeColor}`}>
              <div className="text-sm text-gray-600">Time Remaining</div>
              <div className="text-3xl font-bold">{formatTime(timeRemaining)}</div>
              {timeRemaining <= 300 && <div className="text-xs text-red-600 mt-1">⚠️ Less than 5 minutes</div>}
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-end mb-2">
            <button onClick={() => setShowDebug(s => !s)} className="text-xs text-gray-600 underline">{showDebug ? 'Hide' : 'Show'} debug</button>
          </div>
          {(test.questions || []).map((q: any, qIdx: number) => {
            const isMultiple = q.isMultipleAnswer;
            const answer = answers[qIdx];
            const isAnswered = isMultiple 
              ? Array.isArray(answer) && answer.length > 0 
              : answer !== null && answer !== undefined;
            
            return (
              <div key={qIdx} className="bg-white rounded shadow p-5">
                <div className="font-semibold mb-3 text-lg">Q{qIdx + 1}. {q.text}</div>
                {isMultiple && (
                  <div className="text-sm text-blue-600 mb-2">ℹ️ Multiple answers may be correct - select all that apply</div>
                )}
                <div className="space-y-2">
                  {(q.options || []).map((opt: any, optIdx: number) => {
                    const optionText = typeof opt === 'string' ? opt : (opt?.text || String(opt));
                    return (
                      <label key={optIdx} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type={isMultiple ? "checkbox" : "radio"}
                          name={`question-${qIdx}`}
                          checked={isMultiple 
                            ? (Array.isArray(answer) && answer.includes(optIdx))
                            : answer === optIdx}
                          onChange={() => isMultiple 
                            ? toggleMultipleAnswer(qIdx, optIdx)
                            : setSingleAnswer(qIdx, optIdx)}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700">{String.fromCharCode(65 + optIdx)}) {optionText}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-500 mt-3">
                  {!isAnswered ? '❌ Not answered' : 
                    isMultiple ? `✅ ${(answer as number[]).length} answer(s) selected` : '✅ Answered'}
                </div>
              </div>
            );
          })}
        </div>

        {showDebug && (
          <div className="bg-black bg-opacity-75 text-white rounded p-4 mt-4">
            <div className="font-semibold mb-2">Debug: test object</div>
            <div className="text-xs mb-2">Questions summary:</div>
            <div className="text-xs mb-3">
              {(test.questions || []).map((q: any, i: number) => (
                <div key={i} className="mb-1">Q{i + 1}: opts={Array.isArray(q.options) ? q.options.length : 0} • isMultiple={!!q.isMultipleAnswer}</div>
              ))}
            </div>
            <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(test, null, 2)}</pre>
          </div>
        )}

        {/* Footer */}
        <div className="bg-white rounded shadow p-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Answered: <span className="font-semibold">{answers.filter((a) => 
              Array.isArray(a) ? a.length > 0 : a !== null && a !== undefined
            ).length}/{test.questions?.length || 0}</span>
          </div>
          <button
            onClick={submit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentTest;
