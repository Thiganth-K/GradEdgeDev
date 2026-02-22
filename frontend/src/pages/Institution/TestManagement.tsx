import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../../lib/api';
import InstitutionSidebar from '../../components/Institution/Sidebar';
import { useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TestManagement: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  // Edit mode state
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [editingTest, setEditingTest] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Preview / answer sheet state
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState<'preview'|'answersheet'>('preview');

  // Create Test form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'aptitude' | 'technical' | 'psychometric' | 'coding'>('aptitude');
  const [assignedFacultyId, setAssignedFacultyId] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [customQText, setCustomQText] = useState('');
  const [customOptions, setCustomOptions] = useState<string[]>(['', '', '', '']);
  const [customCorrectIndices, setCustomCorrectIndices] = useState<number[]>([]);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);

  // Question creation state
  

  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const getHeaders = (extra: any = {}) => {
    const h: any = { ...extra };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  const formatDateTimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    if (!value) {
      setEndTime('');
      return;
    }
    const dt = new Date(value);
    const mins = Number(durationMinutes) || 30;
    dt.setMinutes(dt.getMinutes() + mins);
    setEndTime(formatDateTimeLocal(dt));
  };

  const load = async () => {
    const headers = getHeaders();
    const [tRes, fRes, bRes, qRes] = await Promise.all([
      fetch(`${BACKEND}/institution/tests`, { headers }),
      fetch(`${BACKEND}/institution/faculties`, { headers }),
      fetch(`${BACKEND}/institution/batches`, { headers }),
      fetch(`${BACKEND}/institution/questions?category=${type}`, { headers }),
    ]);
    const t = await tRes.json().catch(() => ({}));
    const f = await fRes.json().catch(() => ({}));
    const b = await bRes.json().catch(() => ({}));
    const q = await qRes.json().catch(() => ({}));
    if (tRes.ok) setTests(t.data || []);
    if (fRes.ok) setFaculties(f.data || []);
    if (bRes.ok) setBatches(b.data || []);
    if (qRes.ok) setQuestions(q.data || []);
  };

  const openEditModal = async (testId: string) => {
    const headers = getHeaders();
    const res = await fetch(`${BACKEND}/institution/tests/${testId}`, { headers });
    const body = await res.json().catch(() => ({}));
    if (body.success) {
      setEditingTest(body.data);
      setEditingTestId(testId);
    }
  };

  const closeEditModal = () => {
    setEditingTestId(null);
    setEditingTest(null);
  };

  const saveEditedTest = async () => {
    if (!editingTest) return;
    const headers = getHeaders();
    await fetch(`${BACKEND}/institution/tests/${editingTestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        name: editingTest.name,
        type: editingTest.type,
        durationMinutes: editingTest.durationMinutes,
        startTime: editingTest.startTime,
        endTime: editingTest.endTime,
        assignedFacultyId: editingTest.assignedFaculty?._id || editingTest.assignedFaculty,
        batchIds: editingTest.assignedBatches,
      }),
    });
    closeEditModal();
    load();
  };

  const removeQuestionFromEditTest = (idx: number) => {
    if (editingTest) {
      setEditingTest((prev: any) => ({ ...prev, questions: prev.questions.filter((_: any, i: number) => i !== idx) }));
    }
  };

  const addQuestionToEditTest = () => {
    if (!editingTest) return;
    const headers = getHeaders();
    fetch(`${BACKEND}/institution/questions?category=${editingTest.type}`, { headers })
      .then((r) => r.json())
      .then((b) => setQuestions(b.data || []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { // refresh questions when type changes
    const headers = getHeaders();
    fetch(`${BACKEND}/institution/questions?category=${type}`, { headers }).then((r) => r.json()).then((b) => setQuestions(b.data || [])).catch(() => {});
  }, [type]);

  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleBatch = (id: string) => {
    setSelectedBatchIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const addCustomQuestion = () => {
    if (!customQText || customOptions.filter((o) => !!o).length < 2) return;
    if (customCorrectIndices.length === 0) {
      alert('Please select at least one correct answer');
      return;
    }
    setCustomQuestions((prev) => [...prev, { 
      text: customQText, 
      options: customOptions.filter((o) => !!o), 
      correctIndices: customCorrectIndices 
    }]);
    setCustomQText('');
    setCustomOptions(['', '', '', '']);
    setCustomCorrectIndices([]);
  };

  const toggleCorrectAnswer = (index: number) => {
    setCustomCorrectIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const createTest = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${BACKEND}/institution/tests`, {
      method: 'POST', headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name,
        type,
        assignedFacultyId: assignedFacultyId || null,
        batchIds: selectedBatchIds,
        durationMinutes,
        startTime: startTime || null,
        endTime: endTime || null,
        questionIds: selectedQuestionIds,
        customQuestions,
      }),
    });
    // reset
    setName(''); setType('aptitude'); setAssignedFacultyId(''); setSelectedBatchIds([]);
    setDurationMinutes(30); setStartTime(''); setEndTime(''); setSelectedQuestionIds([]); setCustomQuestions([]);
    load();
  };

  const removeTest = async (id: string) => { await fetch(`${BACKEND}/institution/tests/${id}`, { method: 'DELETE', headers: getHeaders() }); load(); };

  const openPreview = async (id: string) => {
    setPreviewLoading(true);
    setPreviewData(null);
    setPreviewTab('preview');
    try {
      const res = await fetch(`${BACKEND}/institution/tests/${id}/preview`, { headers: getHeaders() });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) setPreviewData(body.data);
    } catch (_) {}
    setPreviewLoading(false);
  };

  

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstitutionSidebar />
      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Tests</h1>
              <p className="text-sm text-gray-500">Configure tests, add questions and manage existing tests.</p>
            </div>
            <div>
              <CreateTestButton />
            </div>
          </div>
          <div className="space-y-6">

          {/* Create Test Modal (opened from + Create Test) */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-h-screen overflow-auto ring-1 ring-gray-100" style={{ maxWidth: '960px' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold mb-0 text-red-700">📋 Test Configuration</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-gray-500">✕</button>
                </div>
                <p className="text-sm text-gray-600 mb-4">Configure basic test details before selecting questions.</p>
                <form onSubmit={(e) => { createTest(e); setShowCreateModal(false); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1">Test Name</label>
                      <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Test name" className="border border-gray-200 px-3 py-2 w-full rounded-lg shadow-sm focus:outline-none" required />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Test Type</label>
                      <select value={type} onChange={(e)=>setType(e.target.value as any)} className="border border-gray-200 px-3 py-2 w-full rounded-lg shadow-sm">
                        <option value="aptitude">Aptitude</option>
                        <option value="technical">Technical</option>
                        <option value="psychometric">Psychometric</option>
                        <option value="coding">Coding</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Assigned Faculty</label>
                      <select value={assignedFacultyId} onChange={(e)=>setAssignedFacultyId(e.target.value)} className="border border-gray-200 px-3 py-2 w-full rounded-lg shadow-sm">
                        <option value="">-- No faculty assigned --</option>
                        {faculties.map((f)=> <option key={f._id} value={f._id}>{f.username} ({f.role})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Duration (minutes)</label>
                      <input type="number" value={durationMinutes} onChange={(e)=>setDurationMinutes(Number(e.target.value)||30)} className="border border-gray-200 px-3 py-2 w-full rounded-lg shadow-sm" />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Start Time</label>
                      <input type="datetime-local" value={startTime} onChange={(e)=>handleStartTimeChange(e.target.value)} className="border border-gray-200 px-3 py-2 w-full rounded-lg shadow-sm" />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">End Time</label>
                      <input type="datetime-local" value={endTime} onChange={(e)=>setEndTime(e.target.value)} className="border border-gray-200 px-3 py-2 w-full rounded-lg shadow-sm" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block font-medium mb-2">Assign Batches</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-auto border border-gray-100 rounded-lg p-3 bg-gray-50">
                      {batches.map((b)=> (
                        <label key={b._id} className="flex items-center space-x-2">
                          <input type="checkbox" checked={selectedBatchIds.includes(b._id)} onChange={()=>toggleBatch(b._id)} />
                          <span className="text-sm">{b.name}</span>
                        </label>
                      ))}
                      {batches.length===0 && <p className="text-sm text-gray-600">No batches available.</p>}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg">Create Test</button>
                  </div>
                </form>
              </div>
            </div>
          )}

        {/* Library Questions removed per request */}

        {/* Custom Questions removed per request */}
    
        {/* Existing Tests (card list) */}
        <div className="bg-white rounded-2xl shadow p-6 ring-1 ring-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">All Tests ({tests.length})</h3>
            <div className="text-sm text-gray-500">Manage created tests</div>
          </div>

          <div className="space-y-4">
            {tests.length === 0 && (
              <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-600">No tests created yet.</div>
            )}

            {tests.map((t) => (
              <div key={t._id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex items-center justify-between">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{t.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{t.type ? String(t.type).charAt(0).toUpperCase() + String(t.type).slice(1) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{t.assignedFaculty?.username || '-'}</div>
                    <div className="text-xs text-gray-400">Assigned Faculty</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-800">{(t.questions && t.questions.length) || 0} question(s)</div>
                    <div className="text-xs text-gray-400">Questions</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 ml-4">
                  <button onClick={() => openPreview(t._id)} className="text-gray-500 hover:text-green-600 p-2 rounded-full hover:bg-gray-50" title="Preview & Answer Sheet">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button onClick={() => openEditModal(t._id)} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-50" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h6M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7" />
                    </svg>
                  </button>
                  <button onClick={() => removeTest(t._id)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-50" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Test Modal */}
        {editingTest && editingTestId && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-h-screen overflow-auto ring-1 ring-gray-100" style={{ maxWidth: '720px' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Test: {editingTest.name}</h3>
                <button onClick={closeEditModal} className="text-gray-500">✕</button>
              </div>
              
              <div className="space-y-4">
                {/* Basic Fields */}
                <div>
                  <label className="block font-medium">Test Name</label>
                  <input value={editingTest.name} onChange={(e) => setEditingTest((prev: any) => ({ ...prev, name: e.target.value }))} className="border border-gray-200 px-3 py-2 w-full rounded-lg shadow-sm" />
                </div>

                <div>
                  <label className="block font-medium">Type</label>
                  <select value={editingTest.type} onChange={(e) => setEditingTest((prev: any) => ({ ...prev, type: e.target.value }))} className="border border-gray-200 px-3 py-2 w-full rounded-lg shadow-sm">
                    <option value="aptitude">Aptitude</option>
                    <option value="technical">Technical</option>
                    <option value="psychometric">Psychometric</option>
                    <option value="coding">Coding</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium">Duration (minutes)</label>
                  <input type="number" value={editingTest.durationMinutes} onChange={(e) => setEditingTest((prev: any) => ({ ...prev, durationMinutes: Number(e.target.value) }))} className="border border-gray-200 px-3 py-2 w-full rounded-lg shadow-sm" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-sm">Start Time</label>
                    <input type="datetime-local" value={editingTest.startTime ? editingTest.startTime.slice(0, 16) : ''} onChange={(e) => setEditingTest((prev: any) => ({ ...prev, startTime: e.target.value }))} className="border border-gray-200 px-3 py-2 w-full rounded-lg shadow-sm" />
                  </div>
                  <div>
                    <label className="block font-medium text-sm">End Time</label>
                    <input type="datetime-local" value={editingTest.endTime ? editingTest.endTime.slice(0, 16) : ''} onChange={(e) => setEditingTest((prev: any) => ({ ...prev, endTime: e.target.value }))} className="border border-gray-200 px-3 py-2 w-full rounded-lg shadow-sm" />
                  </div>
                </div>

                <div>
                  <label className="block font-medium">Assigned Faculty</label>
                  <select value={editingTest.assignedFaculty?._id || editingTest.assignedFaculty || ''} onChange={(e) => setEditingTest((prev: any) => ({ ...prev, assignedFaculty: e.target.value }))} className="border border-gray-200 px-3 py-2 w-full rounded-lg shadow-sm">
                    <option value="">-- None --</option>
                    {faculties.map((f) => (<option key={f._id} value={f._id}>{f.username} ({f.role})</option>))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-2">Assigned Batches</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-auto border border-gray-100 rounded-lg p-2">
                    {batches.map((b) => (
                      <label key={b._id} className="flex items-center space-x-2">
                        <input type="checkbox" checked={editingTest.assignedBatches?.includes(b._id)} onChange={(e) => {
                          setEditingTest((prev: any) => ({
                            ...prev, assignedBatches: e.target.checked ? [...(prev.assignedBatches || []), b._id] : (prev.assignedBatches || []).filter((x: string) => x !== b._id)
                          }));
                        }} />
                        <span>{b.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Questions */}
                <div>
                  <label className="block font-medium mb-2">Questions ({editingTest.questions?.length || 0})</label>
                  <div className="space-y-2 max-h-40 overflow-auto border border-gray-100 rounded-lg p-2">
                    {(editingTest.questions || []).map((q: any, idx: number) => (
                      <div key={idx} className="bg-gray-100 p-2 rounded text-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">Q{idx + 1}. {q.text}</div>
                            <div className="text-xs text-gray-600">
                              {(q.options || []).map((o: any, i: number) => {
                                // Handle both string and object formats
                                const optionText = typeof o === 'string' ? o : (o.text || String(o));
                                return `${i + 1}. ${optionText}`;
                              }).join(' | ')}
                            </div>
                          </div>
                          <button type="button" onClick={() => removeQuestionFromEditTest(idx)} className="text-red-600 text-xs">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={closeEditModal} className="px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
                <button onClick={saveEditedTest} className="px-4 py-2 bg-red-600 text-white rounded-lg">Save Changes</button>
              </div>
            </div>
          </div>
        )}
        {/* Test Preview & Answer Sheet Modal */}
        {(previewLoading || previewData) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full my-6 ring-1 ring-gray-100" style={{ maxWidth: '800px' }}>
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{previewData?.name || 'Test Preview'}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{previewData?.totalQuestions || 0} Questions • {previewData?.durationMinutes || '—'} min</p>
                </div>
                <button onClick={() => setPreviewData(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
              </div>

              {previewLoading && <div className="p-12 text-center text-gray-500">Loading preview…</div>}

              {!previewLoading && previewData && (
                <>
                  {/* Tabs */}
                  <div className="flex border-b px-6">
                    <button onClick={() => setPreviewTab('preview')}
                      className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${previewTab === 'preview' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      Question Preview
                    </button>
                    <button onClick={() => setPreviewTab('answersheet')}
                      className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${previewTab === 'answersheet' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      Answer Sheet
                    </button>
                  </div>

                  {/* Preview Tab */}
                  {previewTab === 'preview' && (
                    <div className="p-6 space-y-6 overflow-auto max-h-[70vh]">
                      {previewData.questions.map((q: any) => (
                        <div key={q._id || q.number} className="border rounded-xl p-4 bg-gray-50">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">{q.number}</span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{q.text}</p>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{q.difficulty}</span>
                                {q.isCoding && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">Coding</span>}
                              </div>
                            </div>
                          </div>
                          {!q.isCoding && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 ml-10">
                              {q.options.map((opt: string, i: number) => (
                                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${q.correctIndices?.includes(i) ? 'bg-green-50 border-green-300 font-semibold text-green-800' : 'bg-white border-gray-200 text-gray-700'}`}>
                                  <span className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${q.correctIndices?.includes(i) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{String.fromCharCode(65 + i)}</span>
                                  <span>{opt}</span>
                                  {q.correctIndices?.includes(i) && <span className="ml-auto text-green-700 text-xs">✓ Correct</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.isCoding && (
                            <div className="ml-10 mt-2 text-xs text-gray-500">{q.testCases?.length || 0} test case(s)</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Answer Sheet Tab */}
                  {previewTab === 'answersheet' && (
                    <div className="p-6 overflow-auto max-h-[70vh]">
                      <div className="grid grid-cols-1 gap-3">
                        {previewData.answerSheet.map((item: any) => (
                          <div key={item.number} className="flex items-start gap-4 p-3 border rounded-lg bg-gray-50">
                            <span className="w-8 h-8 flex-shrink-0 rounded-full bg-red-600 text-white text-sm font-bold flex items-center justify-center">{item.number}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.questionText}</p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {item.correctOptionLabels.length > 0 && item.correctOptionLabels.map((label: string, i: number) => (
                                  <span key={i} className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">
                                    {label}
                                  </span>
                                ))}
                                <span className="text-xs text-gray-600">{item.correctAnswers.join(' / ')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default TestManagement;

// small navigation button component to avoid cluttering above
function CreateTestButton() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/institution/tests/create')} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
      + Create Test
    </button>
  );
}
