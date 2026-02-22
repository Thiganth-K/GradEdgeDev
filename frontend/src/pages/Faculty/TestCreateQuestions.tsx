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
                <CustomQuestionForm onAdd={addCustom} />
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

const CustomQuestionForm: React.FC<{ onAdd: (q:any)=>void }> = ({ onAdd }) => {
  const [text, setText] = useState('');
  const [options, setOptions] = useState<string[]>(['','','','']);
  const [correct, setCorrect] = useState<number[]>([]);
  const toggle = (i:number) => setCorrect(prev => prev.includes(i)?prev.filter(x=>x!==i):[...prev,i]);
  const add = () => { if (!text || options.filter(o=>o).length<2) return; if (correct.length===0) { alert('Select correct answer'); return; } onAdd({ text, options: options.filter(o=>o), correctIndices: correct }); setText(''); setOptions(['','','','']); setCorrect([]); };
  return (
    <div>
      <textarea value={text} onChange={e=>setText(e.target.value)} className="w-full border p-2 rounded" placeholder="Question text" />
      <div className="grid grid-cols-1 gap-2 mt-2">
        {options.map((o,i)=> (
          <div key={i} className="flex items-center gap-2">
            <input value={o} onChange={e=>{ const next=[...options]; next[i]=e.target.value; setOptions(next); }} className="flex-1 border px-2 py-1 rounded" placeholder={`Option ${i+1}`} />
            <input type="checkbox" checked={correct.includes(i)} onChange={()=>toggle(i)} />
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-2 px-3 py-1 bg-green-600 text-white rounded">Add</button>
    </div>
  );
};

export default TestCreateQuestions;
