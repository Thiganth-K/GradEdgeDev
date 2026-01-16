import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../../lib/api';
import InstitutionSidebar from '../../components/Institution/Sidebar';
import { useNavigate } from 'react-router-dom';

const BACKEND = API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';
const STORAGE_KEY = 'test_creation_draft';

const TestCreateQuestions: React.FC = () => {
  const [libraryQuestions, setLibraryQuestions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [topic, setTopic] = useState<'aptitude'|'technical'|'psychometric'>('aptitude');
  const [draft, setDraft] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => { loadDraft(); fetchLib(); }, []);

  const loadDraft = () => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) { navigate('/institution/tests/create'); return; }
    const d = JSON.parse(raw); setDraft(d);
    // prepopulate if exists
    setLoading(false);
  };

  const fetchLib = async (t: string = 'aptitude') => {
    try {
      const res = await fetch(`${BACKEND}/institution/questions?category=${t}`, { headers });
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
      customQuestions,
    };
    await fetch(`${BACKEND}/institution/tests`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(payload) });
    sessionStorage.removeItem(STORAGE_KEY);
    navigate('/institution/tests');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
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
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-2">Library Questions ({libraryQuestions.length})</h3>
                <div className="space-y-2 max-h-96 overflow-auto">
                  {libraryQuestions.map((q:any, idx:number) => (
                    <label key={q._id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border hover:border-red-300 cursor-pointer">
                      <input type="checkbox" checked={selectedIds.includes(q._id)} onChange={() => toggle(q._id)} className="mt-1" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{q.text}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {(q.options || []).map((o:any,i:number)=> <div key={i} className="text-sm">{String.fromCharCode(65+i)}) {o.text}</div>)}
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
            <button onClick={() => navigate('/institution/tests/create')} className="px-4 py-2 border rounded">Back</button>
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
  const add = () => {
    if (!text || options.filter(o=>o).length<2) return; if (correct.length===0) { alert('Select correct answer'); return; }
    onAdd({ text, options: options.filter(o=>o), correctIndices: correct }); setText(''); setOptions(['','','','']); setCorrect([]);
  };
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
