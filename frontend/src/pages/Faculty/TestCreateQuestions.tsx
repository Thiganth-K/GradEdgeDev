import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../../lib/api';
import Sidebar from '../../components/Faculty/Sidebar';
import { useNavigate } from 'react-router-dom';

const BACKEND = API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';
const STORAGE_KEY = 'faculty_test_creation_draft';

const TestCreateQuestions: React.FC = () => {
  const [libraryQuestions, setLibraryQuestions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [topic, setTopic] = useState<'aptitude'|'technical'|'psychometric'>('aptitude');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'all'|'mcq'|'placement'>('all');
  const [draft, setDraft] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('faculty_token') : null;
  const headers: Record<string,string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  useEffect(() => { loadDraft(); fetchLib(); }, []);

  const loadDraft = () => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) { navigate('/faculty/tests/create'); return; }
    const d = JSON.parse(raw);
    setDraft(d);
    setSelectedIds((d.libraryQuestionIds || d.questionIds || []).map((x: any) => String(x)));
    setCustomQuestions(d.customQuestions || []);
    setLoading(false);
  };

  const fetchLib = async (t: string = 'aptitude') => {
    try {
      const res = await fetch(`${BACKEND}/faculty/questions?category=${t}`, { headers: headers as HeadersInit });
      const body = await res.json().catch(()=>({}));
      if (res.ok) setLibraryQuestions(body.data || []);
    } catch (e) {}
  };

  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  const addCustom = (q: any) => setCustomQuestions(prev => [...prev, q]);

  const submitTest = async () => {
    const payload = {
      name: draft.name,
      type: draft.type,
      batchIds: draft.batchIds || [],
      durationMinutes: draft.durationMinutes || 30,
      startTime: draft.startTime || null,
      endTime: draft.endTime || null,
      libraryQuestionIds: selectedIds,
      customQuestions,
    };
    try {
      if (draft && draft.editId) {
        // update existing
        await fetch(`${BACKEND}/faculty/tests/${draft.editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(headers as any) }, body: JSON.stringify(payload) });
      } else {
        await fetch(`${BACKEND}/faculty/tests`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(headers as any) }, body: JSON.stringify(payload) });
      }
    } catch (e) {
      console.error(e);
    }
    sessionStorage.removeItem(STORAGE_KEY);
    navigate('/faculty/tests');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Create Test — Select Questions</h1>

          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Test: <strong>{draft.name}</strong></div>
            <div className="flex items-center gap-2">
              <select value={topic} onChange={e => { setTopic(e.target.value as any); fetchLib(e.target.value); }} className="border px-3 py-2 rounded">
                <option value="aptitude">Aptitude</option>
                <option value="technical">Technical</option>
                <option value="psychometric">Psychometric</option>
              </select>
            </div>
          </div>

          {/* Question type filter tabs */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter:</span>
            {(['all', 'mcq', 'placement'] as const).map(f => (
              <button key={f} onClick={() => setQuestionTypeFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  questionTypeFilter === f
                    ? f === 'placement' ? 'bg-purple-600 text-white border-purple-600'
                    : f === 'mcq' ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}>
                {f === 'all' ? 'All' : f === 'mcq' ? 'MCQ' : 'Placement Ready'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-2">Library Questions ({libraryQuestions.length})</h3>
                <div className="space-y-2 max-h-96 overflow-auto">
                  {libraryQuestions
                    .filter(q => questionTypeFilter === 'all' || (q.questionType || 'mcq') === questionTypeFilter)
                    .map((q:any) => (
                    <label key={q._id} className={`flex items-start space-x-3 p-3 bg-white rounded-lg border cursor-pointer transition-all ${
                      selectedIds.includes(String(q._id)) ? 'border-red-400 bg-red-50/30' : 'hover:border-red-300'
                    }`}>
                      <input type="checkbox" checked={selectedIds.includes(String(q._id))} onChange={() => toggle(String(q._id))} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {q.questionType === 'placement'
                            ? <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Placement</span>
                            : <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">MCQ</span>
                          }
                          {q.difficulty && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{q.difficulty}</span>}
                        </div>
                        <div className="font-medium text-gray-800">{q.text}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {(q.options || []).map((o:any,i:number)=> (
                            <div key={i} className={`text-xs py-0.5 ${o.isCorrect ? 'text-green-700 font-semibold' : ''}`}>
                              {String.fromCharCode(65+i)}) {o.text}{o.isCorrect ? ' ✓' : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-2">Custom Questions</h3>
                <CustomQuestionForm onAdd={addCustom} globalTopic={topic === 'technical' ? 'coding' : topic} />
                <div className="mt-3 space-y-2 max-h-64 overflow-auto">
                  {customQuestions.map((cq, i) => (
                    <div key={i} className="p-2 border rounded">{cq.text}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => navigate('/faculty/tests/create')} className="px-4 py-2 border rounded">Back</button>
            <button onClick={submitTest} className="px-4 py-2 bg-red-600 text-white rounded">Create Test</button>
          </div>
        </div>
      </main>
    </div>
  );
};

const CustomQuestionForm: React.FC<{ onAdd: (q:any)=>void, globalTopic: string }> = ({ onAdd, globalTopic }) => {
  const [text, setText] = useState('');
  
  // MCQ State
  const [options, setOptions] = useState<string[]>(['','','','']);
  const [correct, setCorrect] = useState<number[]>([]);
  
  // Coding State
  const [isCoding, setIsCoding] = useState(false);
  const [starterCode, setStarterCode] = useState('');
  const [constraints, setConstraints] = useState('');
  const [timeComplexity, setTimeComplexity] = useState('');
  const [spaceComplexity, setSpaceComplexity] = useState('');
  const [maxTimeMs, setMaxTimeMs] = useState(2000);
  const [maxMemoryKb, setMaxMemoryKb] = useState(51200);
  const [testCases, setTestCases] = useState<{input:string, output:string, isHidden:boolean}[]>(
    [{input:'', output:'', isHidden:false}]
  );

  const toggle = (i:number) => setCorrect(prev => prev.includes(i)?prev.filter(x=>x!==i):[...prev,i]);
  
  // Auto-check coding if global topic is coding
  useEffect(() => {
    if (globalTopic === 'coding') {
        setIsCoding(true);
        setStarterCode(`// Read from stdin to handle test cases\n// Example (Node.js):\n// const fs = require('fs');\n// const input = fs.readFileSync(0, 'utf8').trim();\n// console.log(input);\n\nfunction solution() {\n    // Your code here\n}\n\nsolution();`);
    } else {
        setIsCoding(false);
        setStarterCode('');
    }
  }, [globalTopic]);
  
  const add = () => {
    if (!text.trim()) {
        alert('Please enter question text');
        return;
    }
    
    if (isCoding) {
        if (testCases.length === 0 || !testCases[0].input.trim() || !testCases[0].output.trim()) { 
            alert('Add at least one valid test per coding question'); 
            return; 
        }
        onAdd({ 
            text, 
            isCoding: true, 
            starterCode, 
            testCases,
            constraints,
            timeComplexity,
            spaceComplexity,
            maxTimeMs,
            maxMemoryKb,
            category: globalTopic, 
            type: globalTopic,
            difficulty: 'medium'
        });
        setText('');
        setStarterCode('');
        setConstraints('');
        setTimeComplexity('');
        setSpaceComplexity('');
        setMaxTimeMs(2000);
        setMaxMemoryKb(51200);
        setTestCases([{input:'', output:'', isHidden:false}]);
        if (globalTopic !== 'coding') setIsCoding(false);
    } else {
        if (options.filter(o=>o.trim()).length < 2) {
            alert('Please enter at least 2 options');
            return;
        }
        if (correct.length === 0) { 
            alert('Select at least one correct answer'); 
            return; 
        }
        onAdd({ 
            text, 
            options: options.filter(o=>o).map((t,i) => ({ text: t, isCorrect: correct.includes(i) })),
            isCoding: false,
            category: globalTopic,
            type: globalTopic
        }); 
        setText(''); setOptions(['','','','']); setCorrect([]);
    }
  };

  const updateTestCase = (idx: number, field: string, val: any) => {
    setTestCases(prev => prev.map((tc, k) => k === idx ? { ...tc, [field]: val } : tc));
  };

  return (
    <div className="bg-white rounded border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-900 uppercase">Configure Question</h3>
        {globalTopic !== 'coding' && (
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
              <input type="checkbox" checked={isCoding} onChange={e => setIsCoding(e.target.checked)} className="accent-red-600" />
              Coding Only
            </label>
        )}
      </div>

      <textarea
        placeholder="Question text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 mb-3 h-20"
      />
      
      {isCoding ? (
          <div className="space-y-3 border-t pt-2">
              <div className="grid grid-cols-2 gap-2">
                  <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase">Time Comp.</label>
                      <input type="text" value={timeComplexity} onChange={e => setTimeComplexity(e.target.value)} className="w-full border p-1 rounded text-xs" placeholder="e.g. O(n)" />
                  </div>
                  <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase">Space Comp.</label>
                      <input type="text" value={spaceComplexity} onChange={e => setSpaceComplexity(e.target.value)} className="w-full border p-1 rounded text-xs" placeholder="e.g. O(1)" />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                  <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase">Max Time (ms)</label>
                      <input type="number" value={maxTimeMs} onChange={e => setMaxTimeMs(Number(e.target.value))} className="w-full border p-1 rounded text-xs" />
                  </div>
                  <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase">Max Mem (KB)</label>
                      <input type="number" value={maxMemoryKb} onChange={e => setMaxMemoryKb(Number(e.target.value))} className="w-full border p-1 rounded text-xs" />
                  </div>
              </div>

              <div>
                  <label className="text-[10px] font-semibold text-gray-600 uppercase">Constraints</label>
                  <textarea value={constraints} onChange={e => setConstraints(e.target.value)} className="w-full border p-1 rounded text-xs" rows={2} placeholder="Constraints..." />
              </div>

              <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block uppercase">Test Cases</label>
                  {testCases.map((tc, i) => (
                      <div key={i} className="flex flex-col gap-1.5 p-2 bg-gray-50 rounded border border-gray-100 mb-2">
                          <input placeholder="Input (stdin)" value={tc.input} onChange={e => updateTestCase(i, 'input', e.target.value)} className="text-xs border p-1 rounded w-full" />
                          <input placeholder="Expected Output" value={tc.output} onChange={e => updateTestCase(i, 'output', e.target.value)} className="text-xs border p-1 rounded w-full" />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1 text-[10px] text-gray-600">
                                <input type="checkbox" checked={tc.isHidden} onChange={e => updateTestCase(i, 'isHidden', e.target.checked)} /> Hidden
                            </label>
                            {testCases.length > 1 && <button onClick={() => setTestCases(prev => prev.filter((_,k)=>k!==i))} className="text-red-500 text-[10px] hover:underline">Remove</button>}
                          </div>
                      </div>
                  ))}
                  <button onClick={() => setTestCases(prev => [...prev, {input:'', output:'', isHidden:false}])} className="text-blue-600 text-xs font-bold hover:underline">+ Add Case</button>
              </div>
          </div>
      ) : (
          <div className="space-y-2">
              {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                      <input
                          placeholder={`Option ${i+1}`}
                          value={opt}
                          onChange={(e) => setOptions(prev => prev.map((x, k) => k === i ? e.target.value : x))}
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-red-500"
                      />
                      <input type="checkbox" checked={correct.includes(i)} onChange={() => toggle(i)} className="accent-green-600" />
                  </div>
              ))}
          </div>
      )}

      <button
        onClick={add}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition-colors mt-4 text-xs"
      >
        Add to List
      </button>
    </div>
  );
};

export default TestCreateQuestions;
