import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  const [type, setType] = useState<'aptitude' | 'technical' | 'psycometric'>('aptitude');
  const [assignedFacultyId, setAssignedFacultyId] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [customQText, setCustomQText] = useState('');
  const [customOptions, setCustomOptions] = useState<string[]>(['', '', '', '']);
  const [customCorrectIndex, setCustomCorrectIndex] = useState<number>(0);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);

  // Question creation state
  const [qText, setQText] = useState('');
  const [qCategory, setQCategory] = useState<'aptitude' | 'technical' | 'psycometric'>('aptitude');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState<number>(0);

  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;

  const load = async () => {
    const headers = { Authorization: `Bearer ${token}` } as any;
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
    const headers = { Authorization: `Bearer ${token}` } as any;
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
    const headers = { Authorization: `Bearer ${token}` } as any;
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
    const headers = { Authorization: `Bearer ${token}` } as any;
    fetch(`${BACKEND}/institution/questions?category=${editingTest.type}`, { headers })
      .then((r) => r.json())
      .then((b) => setQuestions(b.data || []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { // refresh questions when type changes
    const headers = { Authorization: `Bearer ${token}` } as any;
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
    setCustomQuestions((prev) => [...prev, { text: customQText, options: customOptions.filter((o) => !!o), correctIndex: customCorrectIndex }]);
    setCustomQText('');
    setCustomOptions(['', '', '', '']);
    setCustomCorrectIndex(0);
  };

  const createTest = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${BACKEND}/institution/tests`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  const removeTest = async (id: string) => { await fetch(`${BACKEND}/institution/tests/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); load(); };

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${BACKEND}/institution/questions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: qText, options: qOptions.filter((o) => !!o), correctIndex: qCorrectIndex, category: qCategory }),
    });
    setQText(''); setQOptions(['', '', '', '']); setQCorrectIndex(0);
    // reload questions
    fetch(`${BACKEND}/institution/questions?category=${type}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((b) => setQuestions(b.data || [])).catch(() => {});
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Question Library */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Question Library</h3>
          <div className="flex space-x-2 mb-3">
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="border p-2">
              <option value="aptitude">Aptitude</option>
              <option value="technical">Technical</option>
              <option value="psycometric">Psycometric</option>
            </select>
            <button onClick={() => load()} className="px-3 py-2 border rounded">Refresh</button>
          </div>
          <div className="space-y-2 max-h-64 overflow-auto border rounded p-2">
            {questions.map((q) => (
              <label key={q._id} className="flex items-start space-x-2">
                <input type="checkbox" checked={selectedQuestionIds.includes(q._id)} onChange={() => toggleSelectQuestion(q._id)} />
                <div>
                  <div className="font-medium">{q.text}</div>
                  <div className="text-sm text-gray-600">{(q.options||[]).map((o:any,i:number)=>`${i+1}. ${o.text}`).join(' | ')}</div>
                </div>
              </label>
            ))}
            {questions.length === 0 && (<p className="text-sm text-gray-600">No questions in this category yet.</p>)}
          </div>

          <form onSubmit={createQuestion} className="mt-4 space-y-2">
            <h4 className="font-semibold">Add Question</h4>
            <select value={qCategory} onChange={(e)=>setQCategory(e.target.value as any)} className="border p-2">
              <option value="aptitude">Aptitude</option>
              <option value="technical">Technical</option>
              <option value="psycometric">Psycometric</option>
            </select>
            <input value={qText} onChange={(e)=>setQText(e.target.value)} placeholder="Question text" className="border p-2 w-full" />
            {qOptions.map((opt, idx) => (
              <input key={idx} value={opt} onChange={(e)=>{
                const next=[...qOptions]; next[idx]=e.target.value; setQOptions(next);
              }} placeholder={`Option ${idx+1}`} className="border p-2 w-full" />
            ))}
            <label className="block text-sm">Correct Option Index (0-based)
              <input type="number" value={qCorrectIndex} onChange={(e)=>setQCorrectIndex(Number(e.target.value))} className="border p-2 w-full" />
            </label>
            <button className="px-4 py-2 bg-red-600 text-white rounded">Add to Library</button>
          </form>
        </div>

        {/* Create Test */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Create Test</h3>
          <form onSubmit={createTest} className="space-y-2">
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Test name" className="border p-2 w-full" />
            <select value={type} onChange={(e)=>setType(e.target.value as any)} className="border p-2 w-full">
              <option value="aptitude">Aptitude</option>
              <option value="technical">Technical</option>
              <option value="psycometric">Psycometric</option>
            </select>
            <select value={assignedFacultyId} onChange={(e)=>setAssignedFacultyId(e.target.value)} className="border p-2 w-full">
              <option value="">-- assign faculty --</option>
              {faculties.map((f)=> <option key={f._id} value={f._id}>{f.username} ({f.role})</option>)}
            </select>
            <div>
              <div className="font-medium mb-1">Assign Batches</div>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-auto border rounded p-2">
                {batches.map((b)=> (
                  <label key={b._id} className="flex items-center space-x-2">
                    <input type="checkbox" checked={selectedBatchIds.includes(b._id)} onChange={()=>toggleBatch(b._id)} />
                    <span>{b.name}</span>
                  </label>
                ))}
                {batches.length===0 && <p className="text-sm text-gray-600">No batches yet.</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">Duration (minutes)
                <input type="number" value={durationMinutes} onChange={(e)=>setDurationMinutes(Number(e.target.value)||30)} className="border p-2 w-full" />
              </label>
              <label className="block">Start Time
                <input type="datetime-local" value={startTime} onChange={(e)=>setStartTime(e.target.value)} className="border p-2 w-full" />
              </label>
              <label className="block">End Time
                <input type="datetime-local" value={endTime} onChange={(e)=>setEndTime(e.target.value)} className="border p-2 w-full" />
              </label>
            </div>

            <div className="mt-2">
              <div className="font-medium mb-1">Add Custom Questions</div>
              <input value={customQText} onChange={(e)=>setCustomQText(e.target.value)} placeholder="Question text" className="border p-2 w-full" />
              {customOptions.map((opt, idx) => (
                <input key={idx} value={opt} onChange={(e)=>{
                  const next=[...customOptions]; next[idx]=e.target.value; setCustomOptions(next);
                }} placeholder={`Option ${idx+1}`} className="border p-2 w-full" />
              ))}
              <label className="block text-sm">Correct Option Index (0-based)
                <input type="number" value={customCorrectIndex} onChange={(e)=>setCustomCorrectIndex(Number(e.target.value)||0)} className="border p-2 w-full" />
              </label>
              <button type="button" onClick={addCustomQuestion} className="px-3 py-2 border rounded">Add Custom Question</button>
              <div className="mt-2 text-sm text-gray-700">Custom Queue: {customQuestions.length} question(s)</div>
            </div>

            <button className="px-4 py-2 bg-red-600 text-white rounded mt-2">Create Test</button>
          </form>
        </div>

        {/* Existing Tests */}
        <div className="md:col-span-2 bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Existing Tests</h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="p-2 text-left">Name</th><th className="text-left">Type</th><th className="text-left">Faculty</th><th className="text-left">Questions</th><th className="text-left">Actions</th></tr></thead>
              <tbody>
                {tests.map((t) => (
                  <tr key={t._id} className="border-t">
                    <td className="p-2">{t.name}</td>
                    <td>{t.type}</td>
                    <td>{t.assignedFaculty?.username || '-'}</td>
                    <td>{t.questions?.length || 0}</td>
                    <td className="p-2 space-x-2">
                      <button className="text-blue-600" onClick={() => openEditModal(t._id)}>Edit</button>
                      <button className="text-red-600" onClick={() => removeTest(t._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {tests.length===0 && (
                  <tr><td className="p-2" colSpan={5}>No tests yet.</td></tr>
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
                    <option value="psycometric">Psycometric</option>
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
                            <div className="text-xs text-gray-600">{(q.options || []).map((o: string, i: number) => `${i + 1}. ${o}`).join(' | ')}</div>
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
