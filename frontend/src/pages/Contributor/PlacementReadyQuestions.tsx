import React, { useEffect, useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { apiFetch, API_ENDPOINTS } from '../../lib/api';
import makeHeaders from '../../lib/makeHeaders';

interface Option { text: string; isCorrect?: boolean; imageUrl?: string }
interface Solution { explanation?: string; imageUrl?: string; imageUrls?: string[] }

const PlacementReadyQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<any | null>(null);

  // form state
  const [question, setQuestion] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const questionSingleInputRef = useRef<HTMLInputElement | null>(null);
  const solutionSingleInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [options, setOptions] = useState<Option[]>([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
  const [optionFiles, setOptionFiles] = useState<Array<File[]>>([[], []]);
  const [metadataDifficulty, setMetadataDifficulty] = useState('Easy');
  const [subTopic, setSubTopic] = useState('');
  const [solutions, setSolutions] = useState<Solution[]>([{ explanation: '' }]);
  const [solutionFiles, setSolutionFiles] = useState<Array<File[]>>([[]]);
  

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
    setQuestion(''); setImageFiles([]); setImagePreviews([]);
    setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]); setMetadataDifficulty('Easy'); setSubTopic('');
    setSolutions([{ explanation: '' }]); setSolutionFiles([[]]); setEditingId(null);
    setOptionFiles([[], []]);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setImageFiles(files);
    const previews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const handleQuestionSingleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) {
      setImageFiles(prev => [...prev, ...files]);
      setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    }
    if (e.target) (e.target as HTMLInputElement).value = '';
  };

  const handleSolutionFileChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSolutionFiles(prev => {
      const copy = prev.map(arr => Array.isArray(arr) ? [...arr] : []);
      while (copy.length <= index) copy.push([]);
      copy[index] = files;
      return copy;
    });
  };

  const handleSolutionSingleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) {
      setSolutionFiles(prev => {
        const copy = prev.map(arr => Array.isArray(arr) ? [...arr] : []);
        while (copy.length <= index) copy.push([]);
        copy[index] = copy[index] || [];
        copy[index] = [...copy[index], ...files];
        return copy;
      });
    }
    if (e.target) (e.target as HTMLInputElement).value = '';
  };

  const triggerQuestionSingle = () => questionSingleInputRef.current && questionSingleInputRef.current.click();
  const triggerSolutionSingle = (index: number) => {
    const el = solutionSingleInputRefs.current[index];
    if (el) el.click();
  };

  const addOption = () => {
    setOptions(prev => [...prev, { text: '', isCorrect: false }]);
    setOptionFiles(prev => [...prev, null]);
  };
  const removeOption = (idx: number) => {
    setOptions(prev => prev.filter((_, i) => i !== idx));
    setOptionFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleOptionFileChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setOptionFiles(prev => {
      const copy = prev.map(arr => Array.isArray(arr) ? [...arr] : []);
      while (copy.length <= index) copy.push([]);
      copy[index] = files;
      return copy;
    });
    if (e.target) (e.target as HTMLInputElement).value = '';
  };

  const addSolution = () => { setSolutions(prev => [...prev, { explanation: '' }]); setSolutionFiles(prev => [...prev, []]); };
  const removeSolution = (idx: number) => { setSolutions(prev => prev.filter((_, i) => i !== idx)); setSolutionFiles(prev => prev.filter((_, i) => i !== idx)); };

  const prepareFormData = () => {
    const fd = new FormData();
    // Backend expects: subTopic, difficulty, question, single question image, options, solutions
    fd.append('subTopic', subTopic);
    fd.append('difficulty', metadataDifficulty);
    fd.append('question', question);
    // append question images (new 'images' array) and append single 'image' for backward compatibility
    if (imageFiles && imageFiles.length) {
      for (let i = 0; i < imageFiles.length; i++) {
        const f = imageFiles[i];
        if (f) fd.append('images', f);
      }
      const first = imageFiles[0];
      if (first) fd.append('image', first);
    }
    fd.append('options', JSON.stringify(options));
    // append option images and build mapping of which option index each image belongs to
    const optionMapping: number[] = [];
    for (let oi = 0; oi < optionFiles.length; oi++) {
      const arr = optionFiles[oi] || [];
      for (let j = 0; j < arr.length; j++) {
        const f = arr[j];
        if (f) {
          fd.append('optionImages', f);
          optionMapping.push(oi);
        }
      }
    }
    if (optionMapping.length) fd.append('optionImageOptionIndex', JSON.stringify(optionMapping));
    fd.append('solutions', JSON.stringify(solutions));
    // append solution files and build mapping of which solution index each file belongs to
    const mapping: number[] = [];
    for (let si = 0; si < solutionFiles.length; si++) {
      const arr = solutionFiles[si] || [];
      for (let j = 0; j < arr.length; j++) {
        const f = arr[j];
        if (f) {
          fd.append('solutionImages', f);
          mapping.push(si);
        }
      }
    }
    if (mapping.length) fd.append('solutionImageSolutionIndex', JSON.stringify(mapping));
    return fd;
  };

  const submitCreate = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      // validate
      if (!subTopic || !question) throw new Error('Sub-topic and question text are required');
      if (options.length < 2) throw new Error('Provide at least two options');
      // ensure each option has text or an image (matches backend validation)
      for (let i = 0; i < options.length; i++) {
        const opt = options[i] || { text: '' };
        const hasText = typeof opt.text === 'string' && opt.text.trim().length > 0;
        const hasImage = Array.isArray(optionFiles[i]) ? optionFiles[i].length > 0 : !!optionFiles[i];
        if (!hasText && !hasImage) throw new Error(`Option ${i + 1} must have text or an image`);
      }
      const fd = prepareFormData();
      const res = await apiFetch(API_ENDPOINTS.contributor.contributions, {
        method: 'POST',
        headers: makeHeaders('contributor_token'),
        body: fd
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        console.error('[submitCreate] server response', body);
        throw new Error(body.message || 'Failed to create');
      }
      setSuccess('Question created'); setShowForm(false); resetForm(); fetchQuestions();
    } catch (err: any) { setError(err.message || 'Error'); }
    finally { setLoading(false); }
  };

  const startEdit = (q: any) => {
    setEditingId(q._id); setShowForm(true);
    setQuestion(q.question || q.questionText || '');
    setSubTopic(q.subTopic || '');
    setMetadataDifficulty(q.difficulty || (q.metadata && q.metadata.difficulty) || 'Easy');
    // set image previews from existing image fields
    const previews: string[] = [];
    if (q.questionImageUrl) previews.push(q.questionImageUrl);
    else if (q.questionImageUrls && q.questionImageUrls.length) previews.push(...q.questionImageUrls);
    else if (q.imageUrl) previews.push(q.imageUrl);
    else if (q.imageUrls && q.imageUrls.length) previews.push(...q.imageUrls);
    setImagePreviews(previews);
    setImageFiles([]);
    setOptions(q.options && q.options.length ? q.options.map((o: any) => ({ text: o.text, isCorrect: !!o.isCorrect, imageUrl: (o.imageUrl || (o.imageUrls && o.imageUrls[0])), imageUrls: (o.imageUrls && o.imageUrls.length) ? o.imageUrls : (o.imageUrl ? [o.imageUrl] : []), imagePublicIds: (o.imagePublicIds && o.imagePublicIds.length) ? o.imagePublicIds : (o.imagePublicId ? [o.imagePublicId] : []) })) : [{ text: '', isCorrect: false }]);
    setSolutions((q.solutions && q.solutions.length) ? q.solutions.map((s: any) => ({ explanation: s.explanation || s.text || '', imageUrls: (s.imageUrls && s.imageUrls.length) ? s.imageUrls : (s.imageUrl ? [s.imageUrl] : []) })) : [{ explanation: '' }]);
    setSolutionFiles((q.solutions && q.solutions.length) ? q.solutions.map(() => []) : [[]]);
    setOptionFiles((q.options && q.options.length) ? q.options.map(() => []) : [[], []]);
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
                  <div className="font-semibold text-lg">#{q.questionNumber || '-'} — {q.subTopic || q.topic || 'General'} — {q.difficulty || (q.metadata && q.metadata.difficulty) || 'N/A'}</div>
                  <div className="text-sm text-gray-600">{q.question || q.questionText}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewingQuestion(q)} className="px-3 py-1 bg-blue-600 text-white rounded">View</button>
                  <button onClick={() => startEdit(q)} className="px-3 py-1 bg-black text-white rounded">Edit</button>
                  <button onClick={() => handleDelete(q._id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                </div>
              </div>
              {(q.questionImageUrl || (q.questionImageUrls && q.questionImageUrls.length) || q.imageUrl || (q.imageUrls && q.imageUrls.length)) ? (
                <div className="mt-3 flex gap-2">
                  {((q.questionImageUrls && q.questionImageUrls.length) ? q.questionImageUrls : (q.imageUrls && q.imageUrls.length) ? q.imageUrls : (q.questionImageUrl ? [q.questionImageUrl] : (q.imageUrl ? [q.imageUrl] : []))).map((u: string, i: number) => (
                    <img key={i} src={u} alt={`q-${i}`} className="max-h-36 object-contain" />
                  ))}
                </div>
              ) : null}

              {Array.isArray(q.options) && q.options.length ? (
                <div className="mt-3">
                  <div className="font-semibold mb-2">Options</div>
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2 border rounded">
                        {((opt.imageUrls && opt.imageUrls.length) ? opt.imageUrls : (opt.imageUrl ? [opt.imageUrl] : [])).map((u: string, ui: number) => (
                          <img key={ui} src={u} alt={`opt-${i}-${ui}`} className="max-h-20 object-contain" />
                        ))}
                        <div className="flex-1 text-sm">{opt.text}</div>
                        {opt.isCorrect ? <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Correct</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

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
                <input value={subTopic} onChange={e => setSubTopic(e.target.value)} placeholder="Sub-Topic" className="p-2 border rounded" />
                <select value={metadataDifficulty} onChange={e => setMetadataDifficulty(e.target.value)} className="p-2 border rounded">
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>

              <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question Text" className="w-full p-3 border rounded h-28" />

              <div>
                <label className="block text-sm font-semibold">Question Images (optional)</label>
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={handleImageChange} multiple />
                  <button type="button" onClick={triggerQuestionSingle} className="px-2 py-1 bg-white border rounded">Add One</button>
                  <input ref={questionSingleInputRef} type="file" accept="image/*" onChange={handleQuestionSingleChange} style={{ display: 'none' }} multiple />
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {imagePreviews.map((p, i) => (
                    <div key={i} className="relative">
                      <img src={p} className="max-h-28 object-contain border rounded" alt={`preview-${i}`} />
                      <button type="button" onClick={() => { setImageFiles(prev => prev.filter((_, idx) => idx !== i)); setImagePreviews(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute top-0 right-0 bg-white text-red-600 rounded-full px-1">x</button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Options</h3>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input value={opt.text} onChange={e => setOptions(prev => { const c = [...prev]; c[idx].text = e.target.value; return c; })} className="flex-1 p-2 border rounded" placeholder={`Option ${idx + 1}`} />
                      <label className="flex items-center gap-2"><input type="checkbox" checked={!!opt.isCorrect} onChange={e => setOptions(prev => { const c = [...prev]; c[idx].isCorrect = e.target.checked; return c; })} /> Correct</label>
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" multiple onChange={(e) => handleOptionFileChange(idx, e)} />
                        {/* existing images from DB (editable) */}
                        {((opt.imageUrls && opt.imageUrls.length) ? opt.imageUrls : (opt.imageUrl ? [opt.imageUrl] : [])).map((u: string, ui: number) => (
                          <div key={`existing-${ui}`} className="relative">
                            <img src={u} alt={`opt-${idx}-${ui}`} className="max-h-16 object-contain border rounded" />
                            <button type="button" onClick={() => {
                              // remove existing image URL and its corresponding public id from option
                              setOptions(prev => {
                                const copy = prev.map(o => ({ ...o }));
                                if (!copy[idx]) return prev;
                                const arr = copy[idx].imageUrls ? [...copy[idx].imageUrls] : [];
                                const pidArr = copy[idx].imagePublicIds ? [...copy[idx].imagePublicIds] : [];
                                // remove by same index
                                arr.splice(ui, 1);
                                pidArr.splice(ui, 1);
                                copy[idx].imageUrls = arr;
                                copy[idx].imagePublicIds = pidArr;
                                // update fallback imageUrl
                                copy[idx].imageUrl = arr && arr.length ? arr[0] : undefined;
                                copy[idx].imagePublicId = pidArr && pidArr.length ? pidArr[0] : undefined;
                                return copy;
                              });
                            }} className="absolute top-0 right-0 bg-white text-red-600 rounded-full px-1">x</button>
                          </div>
                        ))}
                        {/* previews for newly selected files */}
                        {(optionFiles[idx] || []).map((f, fi) => (
                          <img key={fi} src={URL.createObjectURL(f)} alt={`opt-preview-${idx}-${fi}`} className="max-h-16 object-contain border rounded" />
                        ))}
                      </div>
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
                      <textarea value={s.explanation} onChange={e => setSolutions(prev => { const c = [...prev]; c[idx].explanation = e.target.value; return c; })} placeholder="Solution text" className="w-full p-2 border rounded h-20" />
                      <div className="mt-2">
                        <label className="block text-sm">Solution Images (optional)</label>
                        <div className="flex items-center gap-2">
                          <input type="file" accept="image/*" onChange={(e) => handleSolutionFileChange(idx, e)} multiple />
                          <button type="button" onClick={() => triggerSolutionSingle(idx)} className="px-2 py-1 bg-white border rounded">Add One</button>
                          <input ref={el => { solutionSingleInputRefs.current[idx] = el; }} type="file" accept="image/*" onChange={(e) => handleSolutionSingleChange(idx, e)} style={{ display: 'none' }} multiple />
                        </div>
                        <div className="flex gap-2 flex-wrap mt-2">
                          {/* existing solution image URLs from DB */}
                          {(s.imageUrls || []).map((u: string, ui: number) => (
                            <img key={`existing-${ui}`} src={u} className="max-h-20 object-contain border rounded" alt={`existing-${ui}`} />
                          ))}
                          {/* previews for newly selected files */}
                          {(solutionFiles[idx] || []).map((f, fi) => (
                            <div key={fi} className="relative">
                              <img src={URL.createObjectURL(f)} className="max-h-20 object-contain border rounded" alt={`sol-${idx}-${fi}`} />
                              <button type="button" onClick={() => {
                                setSolutionFiles(prev => {
                                  const copy = prev.map(arr => Array.isArray(arr) ? [...arr] : []);
                                  if (!copy[idx]) copy[idx] = [];
                                  copy[idx] = copy[idx].filter((_, k) => k !== fi);
                                  return copy;
                                });
                              }} className="absolute top-0 right-0 bg-white text-red-600 rounded-full px-1">x</button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => removeSolution(idx)} className="px-2 py-1 bg-gray-200 rounded">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2"><button onClick={addSolution} className="px-3 py-1 bg-white border rounded">Add Solution</button></div>
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

      {viewingQuestion && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">View Question</h2>
              <button onClick={() => setViewingQuestion(null)} className="text-gray-600">Close</button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="font-semibold">Question</div>
                <div className="mt-2 text-sm text-gray-800">{viewingQuestion.question}</div>
                {((viewingQuestion.questionImageUrls && viewingQuestion.questionImageUrls.length) ? viewingQuestion.questionImageUrls : (viewingQuestion.imageUrls && viewingQuestion.imageUrls.length) ? viewingQuestion.imageUrls : (viewingQuestion.questionImageUrl ? [viewingQuestion.questionImageUrl] : (viewingQuestion.imageUrl ? [viewingQuestion.imageUrl] : []))).map((u: string, ui: number) => (
                  <img key={ui} src={u} alt={`question-${ui}`} className="mt-3 max-h-48 object-contain" />
                ))}
              </div>

              {Array.isArray(viewingQuestion.options) && viewingQuestion.options.length ? (
                <div>
                  <div className="font-semibold">Options</div>
                  <div className="mt-2 grid gap-2">
                    {viewingQuestion.options.map((opt: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2 border rounded">
                        {((opt.imageUrls && opt.imageUrls.length) ? opt.imageUrls : (opt.imageUrl ? [opt.imageUrl] : [])).map((u: string, ui: number) => (
                          <img key={ui} src={u} alt={`opt-${i}-${ui}`} className="max-h-20 object-contain" />
                        ))}
                        <div className="flex-1 text-sm">{opt.text}</div>
                        {opt.isCorrect ? <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Correct</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {Array.isArray(viewingQuestion.solutions) && viewingQuestion.solutions.length ? (
                <div>
                  <div className="font-semibold">Solutions</div>
                  <div className="mt-2 space-y-2">
                    {viewingQuestion.solutions.map((s: any, i: number) => (
                      <div key={i} className="p-2 border rounded">
                        <div className="text-sm">{s.explanation || s.text}</div>
                        {(s.imageUrls || (s.imageUrl ? [s.imageUrl] : [])).map((u: string, ui: number) => (
                          <img key={ui} src={u} alt={`sol-${i}-${ui}`} className="mt-2 max-h-40 object-contain" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementReadyQuestions;
