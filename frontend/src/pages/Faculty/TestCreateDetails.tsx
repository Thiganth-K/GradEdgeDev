import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../../lib/api';
import Sidebar from '../../components/Faculty/Sidebar';
import { useNavigate } from 'react-router-dom';

const BACKEND = API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';

const STORAGE_KEY = 'faculty_test_creation_draft';

const TestCreateDetails: React.FC = () => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'aptitude' | 'technical' | 'psychometric'>('aptitude');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('faculty_token') : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  useEffect(() => { loadLists(); loadDraft(); }, []);

  const toLocalInput = (iso?: string) => {
    if (!iso) return '';
    try { const d = new Date(iso); const pad = (n:number)=>n.toString().padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; } catch(e){return ''}
  };

  const loadLists = async () => {
    try {
      const bRes = await fetch(`${BACKEND}/institution/faculty/batches`, { headers: headers as HeadersInit });
      const b = await bRes.json().catch(()=>({}));
      if (bRes.ok) setBatches(b.data || []);
    } catch (e) {}
  };

  const loadDraft = () => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      setName(d.name || '');
      setType(d.type || 'aptitude');
      setSelectedBatchIds(d.batchIds || []);
      setDurationMinutes(d.durationMinutes || 30);
      setStartTime(d.startTime ? toLocalInput(d.startTime) : '');
      setEndTime(d.endTime ? toLocalInput(d.endTime) : '');
      setEditId(d.editId || null);
    } catch (e) {}
  };

  const saveDraft = () => {
    const toISO = (local?: string) => { if (!local) return null; try { return new Date(local).toISOString(); } catch (e) { return null; } };
    // Merge with existing draft to avoid clearing selected library questions or custom questions
    let existing: any = {};
    try { const raw = sessionStorage.getItem(STORAGE_KEY); if (raw) existing = JSON.parse(raw) || {}; } catch (e) { existing = {}; }
    const draft = {
      // basic fields from form
      name,
      type,
      batchIds: selectedBatchIds,
      durationMinutes,
      startTime: toISO(startTime),
      endTime: toISO(endTime),
      // preserve previously stored fields when editing
      editId: editId || existing.editId || null,
      libraryQuestionIds: existing.libraryQuestionIds || existing.questionIds || [],
      customQuestions: existing.customQuestions || [],
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  };

  const goNext = () => { if (!name) { alert('Please enter test name'); return; } saveDraft(); navigate('/faculty/tests/create/questions'); };

  const toggleBatch = (id: string) => setSelectedBatchIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);

  useEffect(() => {
    const toLocalInputFromDate = (d: Date) => { const pad = (n:number)=>n.toString().padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
    try {
      if (!startTime) { const now = new Date(); now.setSeconds(0,0); setStartTime(toLocalInputFromDate(now)); const end = new Date(now.getTime() + (durationMinutes||0)*60000); setEndTime(toLocalInputFromDate(end)); return; }
      const base = new Date(startTime); if (isNaN(base.getTime())) return; const end = new Date(base.getTime() + (durationMinutes||0)*60000); setEndTime(toLocalInputFromDate(end));
    } catch (e) {}
  }, [startTime, durationMinutes]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Create Test — Details</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div>
                <label className="block font-medium">Test Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} className="border px-3 py-2 rounded w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium">Type</label>
                  <select value={type} onChange={e=>setType(e.target.value as any)} className="border px-3 py-2 rounded w-full">
                    <option value="aptitude">Aptitude</option>
                    <option value="technical">Technical</option>
                    <option value="psychometric">Psychometric</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium">Duration (minutes)</label>
                  <input type="number" value={durationMinutes} onChange={e=>setDurationMinutes(Number(e.target.value)||30)} className="border px-3 py-2 rounded w-full" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block font-medium">Start</label>
                  <input type="datetime-local" value={startTime} onChange={e=>setStartTime(e.target.value)} className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block font-medium">End</label>
                  <input type="datetime-local" value={endTime} onChange={e=>setEndTime(e.target.value)} className="border px-3 py-2 rounded w-full" />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2">Assign Batches</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-auto border p-3 rounded bg-gray-50">
                  {batches.map(b => (
                    <label key={b._id} className="flex items-center space-x-2">
                      <input type="checkbox" checked={selectedBatchIds.includes(b._id)} onChange={()=>toggleBatch(b._id)} />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => { saveDraft(); navigate('/faculty/tests'); }} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={goNext} className="px-4 py-2 bg-red-600 text-white rounded">Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TestCreateDetails;
