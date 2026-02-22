import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../../lib/api';
import InstitutionSidebar from '../../components/Institution/Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';

const BACKEND = API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';
const STORAGE_KEY = 'test_creation_draft';

const TestCreateQuestions: React.FC = () => {
  const [libraryQuestions, setLibraryQuestions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [topic, setTopic] = useState<'aptitude'|'technical'|'psychometric'|'coding'>('aptitude');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'all'|'mcq'|'placement'>('all');
  const [draft, setDraft] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  useEffect(() => { loadDraft(); fetchLib(); }, []);

  const loadDraft = () => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) { navigate('/institution/tests/create'); return; }
    const d = JSON.parse(raw); setDraft(d);
    setLoading(false);
  };

  const fetchLib = async (t: string = 'aptitude') => {
    try {
      const res = await fetch(`${BACKEND}/institution/questions?category=${t}`, { headers: headers as HeadersInit });
      const body = await res.json().catch(()=>({}));
      if (res.ok) setLibraryQuestions(body.data || []);
    } catch (e) {}
  };

  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);

  const addCustom = (q: any) => setCustomQuestions(prev => [...prev, q]);

  const submitTest = async () => {
    // combine draft, selectedIds, customQuestions
    const payload = {
      name: draft.name,
      type: draft.type,
      assignedFacultyId: draft.assignedFacultyId || null,
      batchIds: draft.batchIds || [],
      durationMinutes: draft.durationMinutes || 30,
      startTime: draft.startTime || null,
      endTime: draft.endTime || null,
      questionIds: selectedIds,
      customQuestions, // customQuestions will be created by backend and added to the test
    };
    try {
      const res = await fetch(`${BACKEND}/institution/tests`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(headers as any) }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || `Server error (${res.status})`);
      sessionStorage.removeItem(STORAGE_KEY);
      toast.success('Test created successfully!');
      navigate('/institution/tests');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create test.');
      console.error('Error creating test:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster />
      <InstitutionSidebar />
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
                <option value="coding">Coding</option>
              </select>
            </div>
          </div>

          {/* Question type filter tabs */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter by type:</span>
            {(['all', 'mcq', 'placement'] as const).map(f => (
              <button key={f} onClick={() => setQuestionTypeFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  questionTypeFilter === f
                    ? f === 'placement' ? 'bg-purple-600 text-white border-purple-600'
                    : f === 'mcq' ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                }`}>
                {f === 'all' ? 'All Questions' : f === 'mcq' ? 'MCQ Only' : 'Placement Ready Only'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900 mb-4 px-2">Add Custom Question</h3>
                <CustomQuestionForm onAdd={addCustom} globalTopic={topic} />
                
                <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 px-2">Added Custom Questions ({customQuestions.length})</h4>
                    <div className="space-y-2 max-h-64 overflow-auto px-1">
                    {customQuestions.map((cq, i) => (
                        <div key={i} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-red-200 transition-colors">
                            <div className="font-medium text-sm text-gray-800 line-clamp-2">{cq.text}</div>
                            {cq.isCoding ? (
                                <div className="text-xs font-medium text-blue-600 mt-2 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                    Coding Question ({cq.testCases.length} cases)
                                </div>
                            ) : (
                                <div className="text-xs font-medium text-gray-500 mt-2 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                    {cq.options.length} options
                                </div>
                            )}
                        </div>
                    ))}
                    {customQuestions.length === 0 && (
                        <div className="text-xs text-gray-400 italic p-4 text-center border-2 border-dashed border-gray-100 rounded-lg">
                            No custom questions added yet
                        </div>
                    )}
                    </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-semibold text-gray-900">Library Questions</h3>
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{libraryQuestions.length} Available</span>
                </div>
                <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-auto px-2">
                  {libraryQuestions
                    .filter(q => questionTypeFilter === 'all' || (q.questionType || 'mcq') === questionTypeFilter)
                    .map((q:any) => (
                    <label key={q._id} className={`flex items-start space-x-4 p-4 rounded-xl border transition-all cursor-pointer ${selectedIds.includes(q._id) ? 'border-red-500 bg-red-50/30' : 'bg-white border-gray-100 hover:border-red-200'}`}>
                      <input type="checkbox" checked={selectedIds.includes(q._id)} onChange={() => toggle(q._id)} className="mt-1.5 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 flex flex-wrap items-center gap-2">
                            <span className="flex-1">{q.text}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {q.questionType === 'placement'
                            ? <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Placement</span>
                            : <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded">MCQ</span>
                          }
                          {q.topic && <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-700 px-2 py-0.5 rounded">{q.topic}</span>}
                          {q.subtopic && <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{q.subtopic}</span>}
                          {q.difficulty && <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{q.difficulty}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {(q.options || []).map((o:any,i:number)=> (
                                <div key={i} className={`text-xs flex items-center gap-2 p-1.5 rounded border ${o.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                    <span className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold ${o.isCorrect ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>{String.fromCharCode(65+i)}</span>
                                    <span className="truncate">{o?.text || ''}</span>
                                </div>
                            ))}
                        </div>
                      </div>
                    </label>
                  ))}
                  {libraryQuestions.length === 0 && (
                      <div className="p-12 text-center text-gray-500 italic border-2 border-dashed border-gray-100 rounded-2xl">
                          No {topic} questions found in library
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => navigate('/institution/tests/create')} className="px-4 py-2 border rounded">Back</button>
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
  const [testCases, setTestCases] = useState<{input:string, output:string, isHidden:boolean}[]>([{input:'', output:'', isHidden:false}]);

  const toggle = (i:number) => setCorrect(prev => prev.includes(i)?prev.filter(x=>x!==i):[...prev,i]);
  
  // Auto-check coding if global topic is coding
  useEffect(() => {
    if (globalTopic === 'coding') {
        setIsCoding(true);
        setStarterCode(`// Read from stdin to handle test cases
// Example (Node.js):
// const fs = require('fs');
// const input = fs.readFileSync(0, 'utf8').trim();
// console.log(input);

function solution() {
    // Your code here
}

solution();`);
    } else {
        setIsCoding(false);
        setStarterCode('');
    }
  }, [globalTopic]);
  
  const add = () => {
    if (!text.trim()) {
        toast.error('Please enter question text');
        return;
    }
    
    if (isCoding) {
        if (!starterCode.trim()) {
            toast.error('Please enter starter code');
            return;
        }
        if (testCases.length === 0 || !testCases[0].input.trim() || !testCases[0].output.trim()) { 
            toast.error('Add at least one valid test per coding question'); 
            return; 
        }
        onAdd({ 
            text, 
            isCoding: true, 
            starterCode, 
            testCases,
            category: globalTopic, 
            type: globalTopic,
            difficulty: 'medium'
        });
        setText('');
        setStarterCode('');
        setTestCases([{input:'', output:'', isHidden:false}]);
        // Only reset isCoding if the global topic isn't coding
        if (globalTopic !== 'coding') setIsCoding(false);
        toast.success('Coding question added to list');
    } else {
        if (options.filter(o=>o.trim()).length < 2) {
            toast.error('Please enter at least 2 options');
            return;
        }
        if (correct.length === 0) { 
            toast.error('Select at least one correct answer'); 
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
        toast.success('Question added to list');
    }
  };

  const updateTestCase = (idx: number, field: string, val: any) => {
    setTestCases(prev => prev.map((tc, k) => k === idx ? { ...tc, [field]: val } : tc));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900">Configure Question</h3>
        {globalTopic !== 'coding' && (
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input type="checkbox" checked={isCoding} onChange={e => setIsCoding(e.target.checked)} className="accent-red-600" />
              Coding Only
            </label>
        )}
        {globalTopic === 'coding' && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                Coding Question
            </span>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mb-4 italic">
        Tip: Multiple custom questions can be added. Click "Add to List" for each.
      </p>

      <textarea
        placeholder="Question text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4 h-24"
      />
      
      {isCoding ? (
          <div className="space-y-3 border-t pt-2">
              <div>
                  <label className="text-xs font-semibold text-gray-600">Starter Code</label>
                  <textarea 
                    value={starterCode} 
                    onChange={e => setStarterCode(e.target.value)}
                    className="w-full border p-1 rounded font-mono text-xs"
                    rows={3}
                    placeholder="// Starter code..."
                  />
              </div>
              <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Test Cases</label>
                  {testCases.map((tc, i) => (
                      <div key={i} className="flex flex-col gap-1 mb-2 border-b pb-2">
                          <input 
                            placeholder="Input (stdin)" 
                            value={tc.input} 
                            onChange={e => updateTestCase(i, 'input', e.target.value)}
                            className="text-xs border p-1 rounded font-mono"
                          />
                          <input 
                            placeholder="Expected Output (stdout)" 
                            value={tc.output} 
                            onChange={e => updateTestCase(i, 'output', e.target.value)}
                            className="text-xs border p-1 rounded font-mono"
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1 text-xs text-gray-500">
                                <input type="checkbox" checked={tc.isHidden} onChange={e => updateTestCase(i, 'isHidden', e.target.checked)} />
                                Hidden Case
                            </label>
                            <button onClick={() => setTestCases(testCases.filter((_, idx) => idx !== i))} className="text-xs text-red-500">Remove</button>
                          </div>
                      </div>
                  ))}
                  <button onClick={() => setTestCases([...testCases, {input:'', output:'', isHidden:false}])} className="text-xs text-blue-600 font-medium">+ Add Case</button>
              </div>
          </div>
      ) : (
          <div className="grid grid-cols-1 gap-2 mt-2">
            {options.map((o,i)=> (
              <div key={i} className="flex items-center gap-2">
                <input value={o} onChange={e=>{ const next=[...options]; next[i]=e.target.value; setOptions(next); }} className="flex-1 border px-2 py-1 rounded text-sm" placeholder={`Option ${i+1}`} />
                <input type="checkbox" checked={correct.includes(i)} onChange={()=>toggle(i)} />
              </div>
            ))}
          </div>
      )}
      
      <button onClick={add} className="mt-3 w-full py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700">Add to List</button>
    </div>
  );
};

export default TestCreateQuestions;
