import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function CodingTestAttempt() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<Record<string, { currentLanguage: string; codes: Record<string, string> }>>({});
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testCasesResults, setTestCasesResults] = useState<any[]>([]);
  const [startedAt, setStartedAt] = useState<string>(new Date().toISOString());
  const [timeLeft, setTimeLeft] = useState<number>(3600); // 60 minutes default

  const templates: Record<string, string> = {
    javascript: `// Read from stdin to handle test cases\nfunction solution(input) {\n  // Your code here\n}\n\n// Boilerplate to read from stdin\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\nsolution(input);`,
    python: `# Read from stdin to handle test cases\nimport sys\n\ndef solution():\n    # Read from sys.stdin\n    input_data = sys.stdin.read().trim()\n    # Your code here\n    print(input_data)\n\nif __name__ == "__main__":\n    solution()`,
    cpp: `// Read from stdin to handle test cases\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string input;\n    while (getline(cin, input)) {\n        // Your code here\n        cout << input << endl;\n    }\n    return 0;\n}`,
    java: `// Read from stdin to handle test cases\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        while (sc.hasNextLine()) {\n            String input = sc.nextLine();\n            // Your code here\n            System.out.println(input);\n        }\n    }\n}`,
    c: `// Read from stdin to handle test cases\n#include <stdio.h>\n\nint main() {\n    char input[1024];\n    while (fgets(input, sizeof(input), stdin)) {\n        // Your code here\n        printf("%s", input);\n    }\n    return 0;\n}`
  };

  const languages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'python', name: 'Python 3' },
    { id: 'cpp', name: 'C++ (GCC 10)' },
    { id: 'java', name: 'Java 15' },
    { id: 'c', name: 'C (GCC 10)' }
  ];
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTest();
    enterFullScreen();
    disableCopyPaste();

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(timer);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('cut', preventDefault);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const preventDefault = (e: Event) => {
    e.preventDefault();
    toast.error('Action not allowed during test!', { id: 'security-warning' });
  };

  const disableCopyPaste = () => {
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('cut', preventDefault);
  };

  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  };

  const fetchTest = async () => {
    try {
      const token = localStorage.getItem('student_token');
      if (!token) {
        toast.error('Not authenticated');
        navigate('/login');
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Get Test Details (Questions)
      const res = await axios.get(`${BACKEND}/institution/student/tests/${testId}`, { headers });
      if (res.data.success && res.data.data) {
        setQuestions(res.data.data.questions || []);
      }

      // 2. Mark Test as Started
      await axios.post(`${BACKEND}/institution/student/tests/${testId}/start`, {}, { headers }).catch(e => console.warn('Start already called or failed', e));

    } catch (error) {
      console.error('Failed to load test', error);
      toast.error('Failed to load test');
    }
  };

  // Sync code/language state with current question
  const currentQuestion = questions[currentQIndex];
  const qId = currentQuestion?._id;
  
  const savedResponse = qId ? userResponses[qId] : null;
  const currentLanguage = savedResponse ? savedResponse.currentLanguage : 'javascript';
  const currentCode = (savedResponse && savedResponse.codes[currentLanguage]) 
    ? savedResponse.codes[currentLanguage] 
    : (currentLanguage === 'javascript' ? (currentQuestion?.starterCode || templates.javascript) : templates[currentLanguage]);

  const handleCodeChange = (newCode: string | undefined) => {
    if (qId) {
      setUserResponses(prev => {
        const existing = prev[qId] || { currentLanguage: 'javascript', codes: {} };
        return {
          ...prev,
          [qId]: { 
            ...existing,
            codes: {
              ...existing.codes,
              [existing.currentLanguage]: newCode || ''
            }
          }
        };
      });
    }
  };

  const handleLanguageChange = (newLang: string) => {
    if (qId) {
       setUserResponses(prev => {
         const existing = prev[qId] || { currentLanguage: 'javascript', codes: {} };
         return {
          ...prev,
          [qId]: { 
            ...existing,
            currentLanguage: newLang 
          }
        };
       });
    }
  };

  const [selectedCase, setSelectedCase] = useState(0);

  const handleRunCode = async () => {
    setIsRunning(true);
    setTestCasesResults([]);
    setOutput('Running test cases...');
    
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    try {
        const token = localStorage.getItem('student_token');
        if (!token) return; 
        
        const res = await axios.post(`${BACKEND}/institution/student/run-code`, {
            questionId: currentQ._id,
            testId: testId,
            code: currentCode,
            language: currentLanguage
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
            setTestCasesResults(res.data.results);
            const passedCount = res.data.results.filter((r: any) => r.passed).length;
            const allPassed = passedCount === res.data.results.length;
            
            if (allPassed) {
                setOutput('Accepted');
            } else {
                const firstFailed = res.data.results.find((r: any) => !r.passed);
                setOutput(firstFailed?.status || 'Failed');
                // Auto-select first failed case
                const failedIndex = res.data.results.findIndex((r: any) => !r.passed);
                if (failedIndex !== -1) setSelectedCase(failedIndex);
            }
        } else {
            setOutput('Execution failed');
        }
    } catch (error: any) {
        console.error('Run code error', error);
        setOutput('Error: ' + (error.response?.data?.message || error.message));
    } finally {
        setIsRunning(false);
    }
  };

  const handleSubmitTest = async () => {
    if (!window.confirm('Are you sure you want to submit the test?')) return;
    
    try {
        const token = localStorage.getItem('student_token');
        if (!token) return;

        // Prepare responses array in the same order as questions
        const responses = questions.map(q => {
            const resp = userResponses[q._id];
            if (resp) {
                const lang = resp.currentLanguage;
                const code = resp.codes[lang] || (lang === 'javascript' ? (q.starterCode || templates.javascript) : templates[lang]);
                return { code, language: lang };
            }
            return { code: q.starterCode || templates.javascript, language: 'javascript' };
        });

        const res = await axios.post(`${BACKEND}/institution/student/tests/${testId}/submit`, {
            responses,
            startedAt
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
            toast.success('Test submitted successfully!');
            navigate('/student/results');
        } else {
            toast.error(res.data.message || 'Submission failed');
        }
    } catch (error) {
        console.error('Submission error', error);
        toast.error('Failed to submit test');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden" ref={containerRef}>
      <Toaster />
      {/* Header */}
      <div className="h-12 bg-[#1a1a1a] border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
            <h1 className="font-bold text-sm tracking-tight text-white/90">GradEdge <span className="text-red-500">Assessment</span></h1>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex gap-2">
                {questions.map((_, i) => (
                    <button 
                        key={i}
                        onClick={() => setCurrentQIndex(i)}
                        className={`w-7 h-7 rounded-md text-[11px] font-bold flex items-center justify-center transition-all ${currentQIndex === i ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`text-[12px] font-mono font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-white/60'}`}>
                    {formatTime(timeLeft)}
                </span>
             </div>
             <button 
                onClick={handleSubmitTest}
                className="bg-red-600 px-5 py-1.5 rounded-md text-[12px] font-bold hover:bg-red-700 active:scale-95 transition-all"
             >
                Submit Test
             </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem Description */}
        <div className="w-1/3 border-r border-white/5 p-6 overflow-y-auto bg-[#0a0a0a] custom-scrollbar">
            {currentQuestion ? (
                <>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-3">
                        <span className="text-white/40">{currentQIndex + 1}.</span>
                        {currentQuestion.text}
                    </h2>
                    <div className="mb-6 text-gray-400 text-sm space-y-4 leading-relaxed">
                        {currentQuestion.isCoding ? (
                            <>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <p className="text-[11px] text-blue-400 mb-2 font-bold uppercase tracking-wider">Instructions</p>
                                    <p>Implement the solution. Handle inputs correctly based on the language chosen.</p>
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Examples</h3>
                                    <div className="space-y-4">
                                        {(currentQuestion.testCases || []).filter((tc: any) => !tc.isHidden).map((tc: any, i: number) => (
                                            <div key={i} className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                                <h4 className="text-[10px] font-bold text-white/40 mb-3 uppercase">Example {i + 1}</h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[10px] text-white/20 uppercase font-bold mb-1.5">Input</p>
                                                        <code className="text-[12px] text-blue-300 block bg-black/40 p-3 rounded-lg border border-white/5">{tc.input || 'None'}</code>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-white/20 uppercase font-bold mb-1.5">Output</p>
                                                        <code className="text-[12px] text-green-300 block bg-black/40 p-3 rounded-lg border border-white/5">{tc.output}</code>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p>Multiple Choice Question</p>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-white/20">Loading...</div>
            )}
        </div>

        {/* Right: Editor */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
            {/* Editor Toolbar */}
            <div className="h-10 bg-[#1e1e1e] border-b border-white/5 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <select 
                        value={currentLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="bg-white/5 text-gray-300 text-[11px] font-bold px-3 py-1 rounded-md border border-white/10 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        {languages.map(lang => (
                            <option key={lang.id} value={lang.id}>{lang.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="flex-1 relative">
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={
                        currentLanguage === 'cpp' ? 'cpp' : 
                        currentLanguage === 'python' ? 'python' : 
                        currentLanguage === 'java' ? 'java' : 
                        currentLanguage === 'c' ? 'c' : 
                        'javascript'
                    }
                    value={currentCode}
                    onChange={handleCodeChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        padding: { top: 20 },
                        automaticLayout: true,
                        contextmenu: false,
                        scrollBeyondLastLine: false,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        readOnly: false,
                        cursorStyle: 'line',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}
                  />
            </div>

            {/* LeetCode-Style Console */}
            <div className="h-[280px] bg-[#1a1a1a] border-t border-white/10 flex flex-col">
                <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-[#1a1a1a]">
                    <div className="flex items-center gap-4">
                        <span className="text-[11px] uppercase font-bold tracking-widest text-white/40">Console</span>
                    </div>
                    <div className="flex items-center gap-3">
                         <button 
                            onClick={handleRunCode}
                            disabled={isRunning}
                            className={`px-5 py-1.5 rounded-md text-[12px] font-bold shadow-lg transition-all ${isRunning ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-white/5 text-white hover:bg-white/10 active:scale-95'}`}
                        >
                            {isRunning ? 'Running...' : 'Run Code'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Case Tabs */}
                    {testCasesResults.length > 0 && (
                        <div className="w-40 border-r border-white/5 flex flex-col bg-[#141414]">
                            {testCasesResults.map((res, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedCase(i)}
                                    className={`px-4 py-3 text-left transition-all border-b border-white/5 flex items-center justify-between group ${selectedCase === i ? 'bg-[#1a1a1a]' : 'hover:bg-white/[0.02]'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${res.passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className={`text-[11px] font-bold ${selectedCase === i ? 'text-white' : 'text-white/40'}`}>
                                            Case {i + 1}
                                        </span>
                                    </div>
                                    {!res.passed && <span className="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-black opacity-0 group-hover:opacity-100 uppercase">Fail</span>}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex-1 p-5 overflow-y-auto font-mono text-[13px] custom-scrollbar bg-[#1a1a1a]">
                        {isRunning && (
                            <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50">
                                <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Executing code...</span>
                            </div>
                        )}

                        {!isRunning && output && (
                            <div className="mb-6">
                                <div className={`text-xl font-black uppercase tracking-tighter mb-1 ${output === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                    {output}
                                </div>
                                {testCasesResults[selectedCase] && (
                                    <div className="text-[10px] text-white/30 font-bold uppercase flex gap-4">
                                        <span>Time: {testCasesResults[selectedCase].time}ms</span>
                                        <span>Memory: {testCasesResults[selectedCase].memory}kb</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isRunning && testCasesResults[selectedCase] && (
                            <div className="space-y-6">
                                {testCasesResults[selectedCase].stderr && (
                                    <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
                                        <div className="text-[10px] font-black text-red-500 uppercase mb-2 tracking-widest">Runtime Error</div>
                                        <pre className="text-[12px] text-red-400/90 whitespace-pre-wrap leading-relaxed">{testCasesResults[selectedCase].stderr}</pre>
                                    </div>
                                )}

                                {!testCasesResults[selectedCase].isHidden ? (
                                    <>
                                        <div>
                                            <p className="text-[10px] text-white/20 uppercase font-black mb-1.5 tracking-wider">Input</p>
                                            <pre className="bg-black/30 p-3 rounded-lg border border-white/5 text-blue-300">{testCasesResults[selectedCase].input || 'None'}</pre>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-white/20 uppercase font-black mb-1.5 tracking-wider">Output</p>
                                                <pre className={`bg-black/30 p-3 rounded-lg border border-white/5 ${testCasesResults[selectedCase].passed ? 'text-green-400' : 'text-red-400'}`}>
                                                    {testCasesResults[selectedCase].actualOutput || '(Empty)'}
                                                </pre>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-white/20 uppercase font-black mb-1.5 tracking-wider">Expected</p>
                                                <pre className="bg-black/30 p-3 rounded-lg border border-white/5 text-green-400">{testCasesResults[selectedCase].expectedOutput}</pre>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center py-10 opacity-40">
                                        <div className="text-2xl mb-2">🔒</div>
                                        <p className="text-[11px] font-bold uppercase tracking-widest">This is a hidden test case</p>
                                        <p className="text-[10px] mt-1">Output details are hidden to prevent hardcoding.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isRunning && !output && (
                            <div className="h-full flex flex-col items-center justify-center opacity-10 select-none">
                                <div className="text-4xl mb-4">⚡</div>
                                <span className="text-[11px] font-black uppercase tracking-[0.3em]">Ready to Verify Solution</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
