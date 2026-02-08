import React, { useEffect, useState, ChangeEvent } from 'react';
import { apiFetch, API_ENDPOINTS } from '../../lib/api';
import makeHeaders from '../../lib/makeHeaders';

interface Option { text: string; isCorrect?: boolean }
interface Solution { text?: string; imageUrl?: string }

const PlacementReadyQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form state
  const [subject, setSubject] = useState('');
  const [questionType, setQuestionType] = useState('MCQ');
  const [questionNumber, setQuestionNumber] = useState<number | ''>('');
  const [questionText, setQuestionText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [options, setOptions] = useState<Option[]>([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
  const [metadataDifficulty, setMetadataDifficulty] = useState('Easy');
  const [bloom, setBloom] = useState('Remember');
  const [tags, setTags] = useState('');
  const [topic, setTopic] = useState('');
  const [subTopic, setSubTopic] = useState('');
  const [codeEditor, setCodeEditor] = useState(false);
  const [solutions, setSolutions] = useState<Solution[]>([{ text: '' }]);
  const [solutionFiles, setSolutionFiles] = useState<Array<File | null>>([null]);
  const [hints, setHints] = useState('');
  const [courseOutcome, setCourseOutcome] = useState('');
  const [programOutcome, setProgramOutcome] = useState('');

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    setLoading(true); setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.contributor.contributions, { headers: makeHeaders('contributor_token') });
      if (!res.ok) throw new Error('Failed to fetch');
      const body = await res.json();
      if (!body.success) throw new Error(body.message || 'Failed');
      setQuestions(body.data || []);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setSubject(''); setQuestionType('MCQ'); setQuestionNumber(''); setQuestionText(''); setImageFile(null); setImagePreview(null);
    setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]); setMetadataDifficulty('Easy'); setBloom('Remember'); setTags(''); setTopic(''); setSubTopic(''); setCodeEditor(false);
    setSolutions([{ text: '' }]); setSolutionFiles([null]); setHints(''); setCourseOutcome(''); setProgramOutcome(''); setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    setImageFile(f || null);
    if (f) setImagePreview(URL.createObjectURL(f)); else setImagePreview(null);
  };

  const handleSolutionFileChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    setSolutionFiles(prev => { const copy = [...prev]; copy[index] = f || null; return copy; });
  };

  const addOption = () => setOptions(prev => [...prev, { text: '', isCorrect: false }]);
  const removeOption = (idx: number) => setOptions(prev => prev.filter((_, i) => i !== idx));

  const addSolution = () => { setSolutions(prev => [...prev, { text: '' }]); setSolutionFiles(prev => [...prev, null]); };
  const removeSolution = (idx: number) => { setSolutions(prev => prev.filter((_, i) => i !== idx)); setSolutionFiles(prev => prev.filter((_, i) => i !== idx)); };

  const prepareFormData = () => {
    const fd = new FormData();
    fd.append('subject', subject);
    fd.append('questionType', questionType);
    if (questionNumber !== '') fd.append('questionNumber', String(questionNumber));
    fd.append('questionText', questionText);
    if (imageFile) fd.append('image', imageFile);
    fd.append('options', JSON.stringify(options));
    fd.append('metadata', JSON.stringify({ difficulty: metadataDifficulty, bloomTaxonomy: bloom }));
    fd.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
    fd.append('topic', topic);
    fd.append('subTopic', subTopic);
    fd.append('codeEditor', String(codeEditor));
    fd.append('solutions', JSON.stringify(solutions));
    // append solution files
    solutionFiles.forEach((f) => { if (f) fd.append('solutionImages', f); });
    fd.append('hints', JSON.stringify(hints.split('\n').map(s => s.trim()).filter(Boolean)));
    fd.append('courseOutcome', courseOutcome);
    fd.append('programOutcome', programOutcome);
    return fd;
  };

  const submitCreate = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      // validate
      if (!subject || !questionType || !questionText) throw new Error('Subject, type and text are required');
      if (options.length < 2) throw new Error('Provide at least two options');
      const fd = prepareFormData();
      const res = await apiFetch(API_ENDPOINTS.contributor.contributions, {
        method: 'POST',
        headers: makeHeaders('contributor_token'),
        body: fd
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.message || 'Failed to create');
      setSuccess('Question created'); setShowForm(false); resetForm(); fetchQuestions();
    } catch (err: any) { setError(err.message || 'Error'); }
    finally { setLoading(false); }
  };

  const startEdit = (q: any) => {
    setEditingId(q._id); setShowForm(true);
    setSubject(q.subject || ''); setQuestionType(q.questionType || 'MCQ'); setQuestionNumber(q.questionNumber || ''); setQuestionText(q.questionText || '');
    setImagePreview(q.imageUrl || null); setImageFile(null);
    setOptions(q.options && q.options.length ? q.options.map((o: any) => ({ text: o.text, isCorrect: !!o.isCorrect })) : [{ text: '', isCorrect: false }]);
    setMetadataDifficulty((q.metadata && q.metadata.difficulty) || 'Easy'); setBloom((q.metadata && q.metadata.bloomTaxonomy) || 'Remember'); setTags((q.tags || []).join(',')); setTopic(q.topic || ''); setSubTopic(q.subTopic || ''); setCodeEditor(!!q.codeEditor);
    setSolutions((q.solutions && q.solutions.length) ? q.solutions.map((s: any) => ({ text: s.text || '', imageUrl: s.imageUrl })) : [{ text: '' }]);
    setSolutionFiles((q.solutions && q.solutions.length) ? q.solutions.map(() => null) : [null]);
    setHints((q.hints || []).join('\n')); setCourseOutcome(q.courseOutcome || ''); setProgramOutcome(q.programOutcome || '');
  };

  const submitUpdate = async () => {
    if (!editingId) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const fd = prepareFormData();
      const res = await apiFetch(`${API_ENDPOINTS.contributor.contributions}/${editingId}`, {
        method: 'PUT', headers: makeHeaders('contributor_token'), body: fd
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.message || 'Failed to update');
      setSuccess('Updated'); setShowForm(false); resetForm(); fetchQuestions();
    } catch (err: any) { setError(err.message || 'Error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    setLoading(true); setError('');
    try {
      const res = await apiFetch(`${API_ENDPOINTS.contributor.contributions}/${id}`, { method: 'DELETE', headers: makeHeaders('contributor_token') });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.message || 'Failed to delete');
      // if backend reports cloudErrors, surface a warning but treat as success
      if (body.cloudErrors && Array.isArray(body.cloudErrors) && body.cloudErrors.length) {
        setSuccess('Deleted (with warnings)');
        setError('Some images could not be removed from Cloudinary.');
      } else {
        setSuccess('Deleted');
      }
      fetchQuestions();
    } catch (err: any) { setError(err.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Placement Ready Questions</h1>
          <div className="flex items-center gap-3">
            <button onClick={openCreate} className="px-4 py-2 bg-red-600 text-white rounded-md">+ New Question</button>
            <button onClick={fetchQuestions} className="px-3 py-2 bg-white border rounded-md">Refresh</button>
          </div>
        </div>

        {success && <div className="mb-4 text-green-700 bg-green-100 p-3 rounded">{success}</div>}
        {error && <div className="mb-4 text-red-700 bg-red-100 p-3 rounded">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map(q => (
            <div key={q._id} className="bg-white border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{q.subject} — {q.questionType}</div>
                  <div className="text-sm text-gray-600">{q.questionText}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(q)} className="px-3 py-1 bg-black text-white rounded">Edit</button>
                  <button onClick={() => handleDelete(q._id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                </div>
              </div>
              {q.imageUrl && <img src={q.imageUrl} alt="q" className="mt-3 max-h-36 object-contain" />}
              <div className="mt-3 text-sm text-gray-700">Tags: {(q.tags||[]).join(', ')}</div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingId ? 'Edit Question' : 'Create Question'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-600">Close</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="p-2 border rounded" />
                <select value={questionType} onChange={e => setQuestionType(e.target.value)} className="p-2 border rounded">
                  <option>MCQ</option>
                  <option>Short</option>
                  <option>Long</option>
                </select>
                <input value={questionNumber as any} onChange={e => setQuestionNumber(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Question #" className="p-2 border rounded" />
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={codeEditor} onChange={e => setCodeEditor(e.target.checked)} /> <span>Code Editor</span>
                </div>
              </div>

              <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Question Text" className="w-full p-3 border rounded h-28" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold">Question Image</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                  {imagePreview && <img src={imagePreview} className="mt-2 max-h-40 object-contain" alt="preview" />}
                </div>
                <div>
                  <label className="block text-sm font-semibold">Tags (comma separated)</label>
                  <input value={tags} onChange={e => setTags(e.target.value)} className="p-2 border rounded w-full" />
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Options</h3>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input value={opt.text} onChange={e => setOptions(prev => { const c = [...prev]; c[idx].text = e.target.value; return c; })} className="flex-1 p-2 border rounded" placeholder={`Option ${idx + 1}`} />
                      <label className="flex items-center gap-2"><input type="checkbox" checked={!!opt.isCorrect} onChange={e => setOptions(prev => { const c = [...prev]; c[idx].isCorrect = e.target.checked; return c; })} /> Correct</label>
                      {options.length > 2 && <button onClick={() => removeOption(idx)} className="px-2 py-1 bg-gray-200 rounded">Remove</button>}
                    </div>
                  ))}
                </div>
                <div className="mt-2"><button onClick={addOption} className="px-3 py-1 bg-white border rounded">Add Option</button></div>
              </div>

              <div>
                <h3 className="font-semibold">Solutions</h3>
                <div className="space-y-2">
                  {solutions.map((s, idx) => (
                    <div key={idx} className="border p-2 rounded">
                      <textarea value={s.text} onChange={e => setSolutions(prev => { const c = [...prev]; c[idx].text = e.target.value; return c; })} placeholder="Solution text" className="w-full p-2 border rounded h-20" />
                      <div className="mt-2">
                        <label className="block text-sm">Solution Image (optional)</label>
                        <input type="file" accept="image/*" onChange={(e) => handleSolutionFileChange(idx, e)} />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => removeSolution(idx)} className="px-2 py-1 bg-gray-200 rounded">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2"><button onClick={addSolution} className="px-3 py-1 bg-white border rounded">Add Solution</button></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select value={metadataDifficulty} onChange={e => setMetadataDifficulty(e.target.value)} className="p-2 border rounded">
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
                <select value={bloom} onChange={e => setBloom(e.target.value)} className="p-2 border rounded">
                  <option>Remember</option>
                  <option>Understand</option>
                  <option>Apply</option>
                  <option>Analyze</option>
                  <option>Evaluate</option>
                  <option>Create</option>
                </select>
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic" className="p-2 border rounded" />
                <input value={subTopic} onChange={e => setSubTopic(e.target.value)} placeholder="Sub-Topic" className="p-2 border rounded" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <textarea value={hints} onChange={e => setHints(e.target.value)} placeholder="Hints (one per line)" className="p-2 border rounded h-24" />
                <div>
                  <input value={courseOutcome} onChange={e => setCourseOutcome(e.target.value)} placeholder="Course Outcome" className="p-2 border rounded w-full" />
                  <input value={programOutcome} onChange={e => setProgramOutcome(e.target.value)} placeholder="Program Outcome" className="p-2 border rounded w-full mt-2" />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                {editingId ? (
                  <button onClick={submitUpdate} className="px-4 py-2 bg-black text-white rounded">Update</button>
                ) : (
                  <button onClick={submitCreate} className="px-4 py-2 bg-red-600 text-white rounded">Create</button>
                )}
                <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementReadyQuestions;
