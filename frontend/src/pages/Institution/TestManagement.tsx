import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../../lib/api';

const BACKEND = API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TestManagement: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  // Edit mode state
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [editingTest, setEditingTest] = useState<any | null>(null);

  // Create Test form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'aptitude' | 'technical' | 'psychometric'>('aptitude');
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

  

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-red-700">Create a Test</h1>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Test Configuration Card */}
        <div className="bg-white rounded shadow p-6">
          <h3 className="text-xl font-semibold mb-4 text-red-700">📋 Test Configuration</h3>
          <p className="text-sm text-gray-600 mb-4">Configure basic test details before selecting questions.</p>
          <form onSubmit={createTest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Test Name</label>
                <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Test name" className="border p-2 w-full rounded" required />
              </div>
              <div>
                <label className="block font-medium mb-1">Test Type</label>
                <select value={type} onChange={(e)=>setType(e.target.value as any)} className="border p-2 w-full rounded">
                  <option value="aptitude">Aptitude</option>
                  <option value="technical">Technical</option>
                  <option value="psychometric">psychometric</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Assigned Faculty</label>
                <select value={assignedFacultyId} onChange={(e)=>setAssignedFacultyId(e.target.value)} className="border p-2 w-full rounded">
                  <option value="">-- No faculty assigned --</option>
                  {faculties.map((f)=> <option key={f._id} value={f._id}>{f.username} ({f.role})</option>)}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Duration (minutes)</label>
                <input type="number" value={durationMinutes} onChange={(e)=>setDurationMinutes(Number(e.target.value)||30)} className="border p-2 w-full rounded" />
              </div>
              <div>
                <label className="block font-medium mb-1">Start Time</label>
                <input type="datetime-local" value={startTime} onChange={(e)=>handleStartTimeChange(e.target.value)} className="border p-2 w-full rounded" />
              </div>
              <div>
                <label className="block font-medium mb-1">End Time</label>
                <input type="datetime-local" value={endTime} onChange={(e)=>setEndTime(e.target.value)} className="border p-2 w-full rounded" />
              </div>
            </div>
            
            <div>
              <label className="block font-medium mb-2">Assign Batches</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-auto border rounded p-3 bg-gray-50">
                {batches.map((b)=> (
                  <label key={b._id} className="flex items-center space-x-2">
                    <input type="checkbox" checked={selectedBatchIds.includes(b._id)} onChange={()=>toggleBatch(b._id)} />
                    <span className="text-sm">{b.name}</span>
                  </label>
                ))}
                {batches.length===0 && <p className="text-sm text-gray-600">No batches available.</p>}
              </div>
            </div>
          </form>
        </div>

        {/* Library Questions Section */}
        <div className="bg-white rounded shadow p-6 border-l-4 border-blue-500">
          <h3 className="text-xl font-semibold mb-2 flex items-center justify-between">
            <span className="text-blue-700">📚 Library Questions</span>
            <span className="text-xs font-normal text-gray-500 bg-blue-50 px-3 py-1 rounded-full">Reusable across tests</span>
          </h3>
          <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded border border-blue-200">
            ℹ️ Library questions are contributor-created and approved. Select questions to include in this test. Editing library questions updates all tests using them.
          </p>
          
          <div className="mb-4">
            <label className="block font-medium mb-2">Filter by Category</label>
            <div className="flex space-x-2">
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="border p-2 rounded flex-1">
                <option value="aptitude">Aptitude</option>
                <option value="technical">Technical</option>
                <option value="psychometric">psychometric</option>
              </select>
              <button onClick={() => load()} className="px-4 py-2 border rounded hover:bg-gray-100">Refresh</button>
            </div>
          </div>
          
          <div className="mb-3 text-sm font-medium text-gray-700">
            Selected: {selectedQuestionIds.length} question(s)
          </div>
          
          <div className="space-y-2 max-h-80 overflow-auto border rounded p-3 bg-gray-50">
            {questions.map((q) => {
              // Get correct answer indices from all possible sources
              const getCorrectIndices = (question: any): number[] => {
                if (Array.isArray(question.correctIndices) && question.correctIndices.length > 0) {
                  return question.correctIndices;
                }
                if (question.correctIndex !== undefined && question.correctIndex !== null) {
                  return [question.correctIndex];
                }
                const indices: number[] = [];
                (question.options || []).forEach((opt: any, idx: number) => {
                  if (opt.isCorrect) indices.push(idx);
                });
                return indices;
              };
              
              const correctIndices = getCorrectIndices(q);
              
              return (
                <label key={q._id} className="flex items-start space-x-3 p-3 bg-white rounded border hover:border-blue-400 cursor-pointer">
                  <input type="checkbox" checked={selectedQuestionIds.includes(q._id)} onChange={() => toggleSelectQuestion(q._id)} className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{q.text}</div>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      {(q.options||[]).map((o:any,i:number)=> {
                        const isCorrect = correctIndices.includes(i);
                        return (
                          <div key={i} className={`${isCorrect ? 'font-semibold text-green-700' : ''}`}>
                            {String.fromCharCode(65 + i)}) {o.text} {isCorrect && '✓'}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Difficulty: {q.difficulty || 'medium'} | Category: {q.category}
                      {correctIndices.length > 1 && <span className="ml-2 text-blue-600 font-semibold">ℹ️ Multiple correct answers</span>}
                    </div>
                  </div>
                </label>
              );
            })}
            {questions.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">No library questions available for this category.</p>
            )}
          </div>
        </div>

        {/* Custom Questions Section */}
        <div className="bg-white rounded shadow p-6 border-l-4 border-green-500">
          <h3 className="text-xl font-semibold mb-2 flex items-center justify-between">
            <span className="text-green-700">✏️ Custom Questions</span>
            <span className="text-xs font-normal text-gray-500 bg-green-50 px-3 py-1 rounded-full">Test-specific only</span>
          </h3>
          <p className="text-sm text-gray-600 mb-4 bg-green-50 p-3 rounded border border-green-200">
            ✓ Custom questions exist only for this test and will not be added to the library. Use these for one-time or test-specific questions.
          </p>
          
          <div className="mb-4">
            <label className="block font-medium mb-2">Question Text</label>
            <input value={customQText} onChange={(e)=>setCustomQText(e.target.value)} placeholder="Enter your custom question" className="border p-2 w-full rounded" />
          </div>
          
          <div className="mb-4">
            <label className="block font-medium mb-2">Options</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {customOptions.map((opt, idx) => (
                <input key={idx} value={opt} onChange={(e)=>{
                  const next=[...customOptions]; next[idx]=e.target.value; setCustomOptions(next);
                }} placeholder={`Option ${idx+1}`} className="border p-2 rounded" />
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block font-medium mb-2">Correct Answers (select one or more)</label>
            <div className="space-y-2 bg-gray-50 p-3 rounded border">
              {customOptions.map((opt, idx) => (
                <label key={idx} className={`flex items-center space-x-2 p-2 rounded ${opt ? 'cursor-pointer hover:bg-gray-100' : 'opacity-50'}`}>
                  <input 
                    type="checkbox" 
                    checked={customCorrectIndices.includes(idx)}
                    onChange={() => toggleCorrectAnswer(idx)}
                    disabled={!opt}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{opt || `Option ${idx+1} (not set)`}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">✓ Check all correct answers. Multiple selections allowed.</p>
          </div>
          
          <button type="button" onClick={addCustomQuestion} className="px-4 py-2 border border-green-600 text-green-700 rounded hover:bg-green-50">
            + Add Custom Question
          </button>
          
          {customQuestions.length > 0 && (
            <div className="mt-4">
              <div className="font-medium mb-2">Added Custom Questions: {customQuestions.length}</div>
              <div className="space-y-2 max-h-60 overflow-auto border rounded p-3 bg-gray-50">
                {customQuestions.map((cq, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">Q{idx + 1}. {cq.text}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {cq.options.map((o: string, i: number) => `${i + 1}. ${o}`).join(' | ')}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          ✓ Correct: {Array.isArray(cq.correctIndices) 
                            ? cq.correctIndices.map((ci: number) => `Option ${ci + 1}`).join(', ')
                            : `Option ${cq.correctIndex + 1}`}
                        </div>
                      </div>
                      <button type="button" onClick={() => setCustomQuestions(prev => prev.filter((_, i) => i !== idx))} className="text-red-600 text-sm ml-2">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded shadow p-6">
          <button onClick={createTest} className="w-full px-6 py-3 bg-red-600 text-white rounded text-lg font-semibold hover:bg-red-700">
            Create Test with {selectedQuestionIds.length} Library + {customQuestions.length} Custom Questions
          </button>
          <p className="text-sm text-gray-600 text-center mt-3">
            Total Questions: {selectedQuestionIds.length + customQuestions.length}
          </p>
        </div>

        

        {/* Existing Tests */}
        <div className="bg-white rounded shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Existing Tests</h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2">
                  <th className="p-3 text-left">Name</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Faculty</th>
                  <th className="text-left">Questions</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t) => (
                  <tr key={t._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{t.name}</td>
                    <td className="capitalize">{t.type}</td>
                    <td>{t.assignedFaculty?.username || '-'}</td>
                    <td>{t.questions?.length || 0}</td>
                    <td className="p-3 space-x-2">
                      <button className="text-blue-600 hover:underline" onClick={() => openEditModal(t._id)}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => removeTest(t._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {tests.length===0 && (
                  <tr><td className="p-3 text-center text-gray-600" colSpan={5}>No tests created yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Test Modal */}
        {editingTest && editingTestId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded shadow p-6 w-full max-h-screen overflow-auto" style={{ maxWidth: '600px' }}>
              <h3 className="text-lg font-semibold mb-4">Edit Test: {editingTest.name}</h3>
              
              <div className="space-y-4">
                {/* Basic Fields */}
                <div>
                  <label className="block font-medium">Test Name</label>
                  <input value={editingTest.name} onChange={(e) => setEditingTest((prev: any) => ({ ...prev, name: e.target.value }))} className="border p-2 w-full" />
                </div>

                <div>
                  <label className="block font-medium">Type</label>
                  <select value={editingTest.type} onChange={(e) => setEditingTest((prev: any) => ({ ...prev, type: e.target.value }))} className="border p-2 w-full">
                    <option value="aptitude">Aptitude</option>
                    <option value="technical">Technical</option>
                    <option value="psychometric">psychometric</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium">Duration (minutes)</label>
                  <input type="number" value={editingTest.durationMinutes} onChange={(e) => setEditingTest((prev: any) => ({ ...prev, durationMinutes: Number(e.target.value) }))} className="border p-2 w-full" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-sm">Start Time</label>
                    <input type="datetime-local" value={editingTest.startTime ? editingTest.startTime.slice(0, 16) : ''} onChange={(e) => setEditingTest((prev: any) => ({ ...prev, startTime: e.target.value }))} className="border p-2 w-full" />
                  </div>
                  <div>
                    <label className="block font-medium text-sm">End Time</label>
                    <input type="datetime-local" value={editingTest.endTime ? editingTest.endTime.slice(0, 16) : ''} onChange={(e) => setEditingTest((prev: any) => ({ ...prev, endTime: e.target.value }))} className="border p-2 w-full" />
                  </div>
                </div>

                <div>
                  <label className="block font-medium">Assigned Faculty</label>
                  <select value={editingTest.assignedFaculty?._id || editingTest.assignedFaculty || ''} onChange={(e) => setEditingTest((prev: any) => ({ ...prev, assignedFaculty: e.target.value }))} className="border p-2 w-full">
                    <option value="">-- None --</option>
                    {faculties.map((f) => (<option key={f._id} value={f._id}>{f.username} ({f.role})</option>))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-2">Assigned Batches</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-auto border rounded p-2">
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
                  <div className="space-y-2 max-h-40 overflow-auto border rounded p-2">
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
                <button onClick={closeEditModal} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={saveEditedTest} className="px-4 py-2 bg-red-600 text-white rounded">Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestManagement;
