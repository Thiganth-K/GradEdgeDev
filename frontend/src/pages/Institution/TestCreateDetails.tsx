import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../../lib/api';
import InstitutionSidebar from '../../components/Institution/Sidebar';
import { useNavigate } from 'react-router-dom';

const BACKEND = API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';

const STORAGE_KEY = 'test_creation_draft';

const TestCreateDetails: React.FC = () => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'aptitude' | 'technical' | 'psychometric'>('aptitude');
  const [assignedFacultyId, setAssignedFacultyId] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [faculties, setFaculties] = useState<any[]>([]);

  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  useEffect(() => { loadLists(); loadDraft(); }, []);

  const toLocalInput = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) { return ''; }
  };

  const loadLists = async () => {
    try {
      const [fRes, bRes] = await Promise.all([
        fetch(`${BACKEND}/institution/faculties`, { headers: headers as HeadersInit }),
        fetch(`${BACKEND}/institution/batches`, { headers: headers as HeadersInit }),
      ]);
      const f = await fRes.json().catch(()=>({}));
      const b = await bRes.json().catch(()=>({}));
      if (fRes.ok) setFaculties(f.data || []);
      if (bRes.ok) setBatches(b.data || []);
    } catch (e) { }
  };

  const loadDraft = () => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      setName(d.name || ''); setType(d.type || 'aptitude'); setAssignedFacultyId(d.assignedFacultyId || '');
      setSelectedBatchIds(d.batchIds || []); setDurationMinutes(d.durationMinutes || 30);
      setStartTime(d.startTime ? toLocalInput(d.startTime) : ''); setEndTime(d.endTime ? toLocalInput(d.endTime) : '');
    } catch (e) {}
  };

  const saveDraft = () => {
    const toISO = (local?: string) => {
      if (!local) return null;
      try { return new Date(local).toISOString(); } catch (e) { return null; }
    };
    const draft = { name, type, assignedFacultyId, batchIds: selectedBatchIds, durationMinutes, startTime: toISO(startTime), endTime: toISO(endTime) };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  };

  const goNext = () => {
    if (!name) { alert('Please enter test name'); return; }
    saveDraft();
    navigate('/institution/tests/create/questions');
  };

  const toggleBatch = (id: string) => setSelectedBatchIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstitutionSidebar />
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
                <label className="block font-medium">Assigned Faculty</label>
                <select value={assignedFacultyId} onChange={e=>setAssignedFacultyId(e.target.value)} className="border px-3 py-2 rounded w-full">
                  <option value="">-- No faculty assigned --</option>
                  {faculties.map(f => <option key={f._id} value={f._id}>{f.username}</option>)}
                </select>
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
                <button onClick={() => { saveDraft(); navigate('/institution/tests'); }} className="px-4 py-2 border rounded">Cancel</button>
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
