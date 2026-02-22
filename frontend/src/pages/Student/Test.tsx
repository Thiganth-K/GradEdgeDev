/**
 * StudentTest — MCQ test-taking page with anti-misuse controls:
 *  • Fullscreen enforcement (auto-request, exit detection, re-entry attempt)
 *  • Tab-switch & window-blur detection  (visibilitychange + blur)
 *  • Right-click, copy, paste prevention
 *  • user-select: none  (no text selection)
 *  • Violation counter with warning banner (auto-dismiss 5 s)
 *  • Auto-submit when violations ≥ MAX_VIOLATIONS (default 3)
 *  • Auto-submit on timer expiry
 *
 * LIMITATIONS (soft enforcement only):
 *  • Cannot prevent screenshots, second devices, or external help
 *  • Determined users can bypass browser restrictions
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL, { getApiUrl } from '../../lib/api';

const MAX_VIOLATIONS = 3;

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

  // ── Anti-misuse state ──────────────────────────────────────────────────────
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState('');
  const [violationLog, setViolationLog] = useState<string[]>([]);

  // Refs so callbacks always see latest values without stale-closure issues
  const violationsRef = useRef(0);
  const submittingRef = useRef(false);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('student_token') : null;

  // ── Warning banner helper ──────────────────────────────────────────────────
  const showWarningBanner = useCallback((msg: string) => {
    setShowWarning(msg);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => setShowWarning(''), 5000);
  }, []);

  // ── Fullscreen helpers ─────────────────────────────────────────────────────
  const requestFullscreen = useCallback(() => {
    const elem = document.documentElement as any;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => showWarningBanner('⚠️ Please enable fullscreen for the test'));
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    }
  }, [showWarningBanner]);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }, []);

  // ── Submit (stable ref so timer/event-listener callbacks always call latest) ─
  const submitRef = useRef<(reason?: string) => void>(() => {});

  const load = async () => {
    setError(null);
    try {
      const res = await fetch(getApiUrl(`/institution/student/tests/${id}`), { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) throw new Error(body.message || 'failed to load test');
      // Normalize questions and set test
      const normalizedQuestions = (body.data && Array.isArray(body.data.questions)) ? body.data.questions : [];
      console.debug('[StudentTest] loaded test data', body.data);
      
      // Check for coding questions and redirect
      if (normalizedQuestions.some((q: any) => q.isCoding)) {
        navigate(`/student/test/${id}/attempt`);
        return;
      }

      setTest({ ...(body.data || {}), questions: normalizedQuestions });
      // Initialize answers: null for single-answer, [] for multiple-answer questions
      setAnswers(normalizedQuestions.map((q: any) => q.isMultipleAnswer ? [] : null));
      setTimeRemaining((body.data?.durationMinutes || 30) * 60); // convert to seconds
      const startRes = await fetch(getApiUrl(`/institution/student/tests/${id}/start`), { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const sBody = await startRes.json().catch(() => ({}));
      if (startRes.ok && sBody.success) setStartedAt(sBody.data?.startedAt || new Date().toISOString());

      // Enter fullscreen once test loads
      requestFullscreen();
    } catch (err:any) {
      setError(err.message || 'failed to load');
    }
  };

  useEffect(() => { load(); }, []);

  // Timer countdown
  useEffect(() => {
    if (!test || result) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          submitRef.current('auto_time');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [test, result]);

  // ── Anti-misuse: event listeners ──────────────────────────────────────────
  useEffect(() => {
    if (!test || result) return;

    const preventContextMenu = (e: Event) => { e.preventDefault(); };
    const preventCopy = (e: Event) => { e.preventDefault(); };
    const preventPaste = (e: Event) => { e.preventDefault(); };

    const handleVisibilityChange = () => {
      if (document.hidden) recordViolation('tabSwitch');
    };
    const handleWindowBlur = () => {
      recordViolation('tabSwitch');
    };
    const handleFullscreenChange = () => {
      const isFull = !!(
        (document as any).fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      setIsFullscreen(isFull);
      if (!isFull && !submittingRef.current) {
        recordViolation('fullscreenExit');
        setTimeout(() => requestFullscreen(), 1500);
      }
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    (document as any).addEventListener('webkitfullscreenchange', handleFullscreenChange);
    (document as any).addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventPaste);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      (document as any).removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      (document as any).removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test, result]);

  // Keep submitRef current
  useEffect(() => {
    submitRef.current = (reason?: string) => submit(reason);
  });

  const recordViolation = (type: 'tabSwitch' | 'fullscreenExit') => {
    if (submittingRef.current) return;
    violationsRef.current += 1;
    const newCount = violationsRef.current;
    setViolations(newCount);
    const label = type === 'tabSwitch' ? 'Tab switch detected!' : 'Fullscreen exited!';
    const ts = new Date().toLocaleTimeString();
    setViolationLog(prev => [...prev, `[${ts}] ${label}`]);
    showWarningBanner(
      `⚠️ ${label} Violation ${newCount}/${MAX_VIOLATIONS}. ${
        type === 'tabSwitch' ? 'Do not switch tabs or windows.' : 'Stay in fullscreen mode.'
      }`
    );
    if (newCount >= MAX_VIOLATIONS) {
      showWarningBanner(`🚨 Max violations reached! Submitting test automatically...`);
      setTimeout(() => submitRef.current('auto_violation'), 1500);
    }
  };

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

  const submit = async (reason = 'manual') => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const res = await fetch(getApiUrl(`/institution/student/tests/${id}/submit`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          responses: answers,
          startedAt,
          violationCount: violationsRef.current,
          violationLog,
          submissionReason: reason,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) throw new Error(body.message || 'submit failed');
      exitFullscreen();
      setResult(body.data);
    } catch (err:any) {
      setError(err.message || 'submit failed');
      submittingRef.current = false;
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
  const [current, setCurrent] = useState(0);

  // Helper: format time taken safely
  const formatTimeTakenSafe = (secs: any) => {
    const n = Number(secs);
    if (!Number.isFinite(n) || n <= 0) return '—';
    const mins = Math.floor(n / 60);
    const s = Math.floor(n % 60);
    return `${mins}m ${s}s`;
  };

  // Progress ring component (animated)
  const ProgressRing: React.FC<{ percent: number; size?: number; stroke?: number; color?: string }> = ({ percent, size = 140, stroke = 12, color = '#16a34a' }) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const [display, setDisplay] = useState(0);

    useEffect(() => {
      let raf: number | null = null;
      const start = performance.now();
      const from = display;
      const to = Math.max(0, Math.min(100, Math.round(percent)));
      const dur = 800;
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        const val = Math.round(from + (to - from) * p);
        setDisplay(val);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => { if (raf) cancelAnimationFrame(raf); };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [percent]);

    const offset = circumference - (display / 100) * circumference;

    return (
      <svg width={size} height={size} className="mx-auto">
        <defs>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.08)"/>
          </filter>
        </defs>
        <g transform={`translate(${size/2}, ${size/2})`}>
          <circle r={radius} fill="transparent" stroke="#f3f4f6" strokeWidth={stroke} />
          <circle r={radius} fill="transparent" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} transform="rotate(-90)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} filter="url(#soft)" />
          <text x="0" y="6" textAnchor="middle" className="text-2xl font-bold" style={{ fontSize: 22, fill: '#111827' }}>{display}%</text>
        </g>
      </svg>
    );
  };

  const scoreMessage = (pct: number) => {
    if (pct >= 90) return { title: 'Excellent — Keep it up!', color: 'text-green-700' };
    if (pct >= 75) return { title: 'Great job!', color: 'text-green-600' };
    if (pct >= 50) return { title: 'Good effort', color: 'text-yellow-600' };
    if (pct >= 30) return { title: 'Needs improvement', color: 'text-orange-600' };
    return { title: 'Keep practicing', color: 'text-red-600' };
  };

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
    const pct = Number(result.score) || 0;
    const { title, color } = scoreMessage(pct);
    const timeTakenLabel = formatTimeTakenSafe((result.timeTakenSeconds ?? result.timeTaken) ?? result.timeTakenSecondsInSec);

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Test Submitted Successfully!</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mb-6">
            <div className="lg:col-span-1 flex items-center justify-center">
              <ProgressRing percent={pct} size={140} stroke={12} color={pct >= 50 ? '#16a34a' : '#ef4444'} />
            </div>

            <div className="lg:col-span-2">
              <div className="p-4 rounded border bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-semibold ${color}`}>{title}</div>
                    <div className="mt-2 text-gray-600">Score: <span className="font-bold text-3xl text-gray-800">{pct}%</span></div>
                  </div>
                  <div className="text-sm text-gray-500">{result.correctCount ?? '—'}/{result.total ?? '—'} correct</div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded p-4">
                    <div className="text-sm text-gray-700">Correct Answers</div>
                    <div className="text-2xl font-bold text-blue-600">{result.correctCount ?? '—'}/{result.total ?? '—'}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded p-4">
                    <div className="text-sm text-gray-700">Time Taken</div>
                    <div className="text-2xl font-bold text-gray-800">{timeTakenLabel}</div>
                  </div>
                </div>
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
    <div className="p-8 bg-gray-50 min-h-screen select-none" style={{ userSelect: 'none' }}>

      {/* ── Violation warning banner ───────────────────────────────────────── */}
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-6 py-3 text-center font-semibold shadow-lg animate-pulse">
          {showWarning}
        </div>
      )}

      {/* ── Fullscreen reminder overlay ────────────────────────────────────── */}
      {!isFullscreen && test && !result && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-70 flex flex-col items-center justify-center gap-4">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm text-center">
            <div className="text-4xl mb-3">⛶</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Fullscreen Required</h3>
            <p className="text-sm text-gray-600 mb-4">This test must be taken in fullscreen mode. Please re-enter fullscreen to continue.</p>
            <button
              onClick={() => requestFullscreen()}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
            >
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">{test.name}</h2>
              <p className="text-gray-600 text-sm">Type: <span className="font-medium capitalize">{test.type}</span> • Questions: {test.questions?.length || 0}</p>
            </div>
            {/* Violation badge */}
            <div className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${violations === 0 ? 'bg-green-100 text-green-700' : violations >= MAX_VIOLATIONS - 1 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {violations === 0 ? '✔ No violations' : `⚠ ${violations}/${MAX_VIOLATIONS} violations`}
            </div>
          </div>
        </div>

        {/* Questions + Sidebar layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">

            {/* Single question view */}
            {test.questions && test.questions.length > 0 && (() => {
              const q = test.questions[current];
              const qIdx = current;
              const isMultiple = q.isMultipleAnswer;
              const answer = answers[qIdx];
              const isAnswered = isMultiple ? Array.isArray(answer) && answer.length > 0 : answer !== null && answer !== undefined;

              return (
                <div className="bg-white rounded shadow p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-lg">Question {qIdx + 1} of {test.questions.length}</div>
                      <div className="mt-2 text-xl font-medium text-gray-800">{q.text}</div>
                      {isMultiple && <div className="text-sm text-blue-600 mt-2">ℹ️ Multiple answers may be correct - select all that apply</div>}
                    </div>
                    <div className="text-sm text-gray-500">{isAnswered ? <span className="text-green-600">Answered</span> : <span className="text-red-600">Not answered</span>}</div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {(q.options || []).map((opt: any, optIdx: number) => {
                      const optionText = typeof opt === 'string' ? opt : (opt?.text || String(opt));
                      const checked = isMultiple ? (Array.isArray(answer) && answer.includes(optIdx)) : answer === optIdx;
                      return (
                        <label key={optIdx} className={`flex items-center gap-3 p-3 border rounded hover:shadow cursor-pointer ${checked ? 'bg-red-50 border-red-100' : 'bg-white'}`}>
                          <input
                            type={isMultiple ? 'checkbox' : 'radio'}
                            name={`question-${qIdx}`}
                            checked={checked}
                            onChange={() => isMultiple ? toggleMultipleAnswer(qIdx, optIdx) : setSingleAnswer(qIdx, optIdx)}
                            className="w-4 h-4"
                          />
                          <div className="text-gray-800"> <span className="font-semibold mr-2">{String.fromCharCode(65 + optIdx)})</span> {optionText}</div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">{q.explanation ? 'Explanation available after submission' : ''}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} className="px-4 py-2 border rounded text-sm disabled:opacity-50">Prev</button>
                      <button onClick={() => setCurrent(c => Math.min(test.questions.length - 1, c + 1))} disabled={current >= test.questions.length - 1} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Next</button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right sidebar: timer, palette, submit */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className={`bg-white border rounded p-4 text-center ${timeRemaining <= 300 ? 'border-red-300' : ''}`}>
                <div className="text-sm text-gray-500">Time Remaining</div>
                <div className={`text-4xl font-bold mt-2 ${timeRemaining <= 300 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>{formatTime(timeRemaining)}</div>
                {timeRemaining <= 300 && <div className="text-xs text-red-600 mt-1">⏰ Less than 5 minutes!</div>}
              </div>

              <div className="bg-white border rounded p-3">
                <div className="text-sm font-medium text-gray-700 mb-2">Question Palette</div>
                <div className="grid grid-cols-8 gap-2">
                  {test.questions.map((_: any, i: number) => {
                    const ans = answers[i];
                    const answered = Array.isArray(ans) ? ans.length > 0 : ans !== null && ans !== undefined;
                    const isCurrent = i === current;
                    const cls = answered ? 'bg-green-600 text-white' : (isCurrent ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700');
                    return (
                      <button key={i} onClick={() => setCurrent(i)} className={`w-8 h-8 rounded ${cls}`}>{i + 1}</button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border rounded p-3 flex flex-col gap-2">
                <button onClick={() => submit('manual')} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Submit Test'}</button>
                <button onClick={() => navigate('/student/dashboard')} className="px-4 py-2 border rounded text-sm">Back to Dashboard</button>
              </div>
            </div>
          </aside>
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
            onClick={() => submit('manual')}
            disabled={isSubmitting}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>

        {/* Violation log (shown if any violations occurred) */}
        {violationLog.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded p-4">
            <div className="text-sm font-semibold text-red-700 mb-2">⚠ Integrity Violation Log</div>
            <ul className="text-xs text-red-600 space-y-1">
              {violationLog.map((entry, i) => <li key={i}>{entry}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTest;
