import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { makeHeaders } from '../../lib/makeHeaders';
import toast from 'react-hot-toast';

interface TestCase {
  input: string;
  output: string;
}

interface CodingProblem {
  _id: string;
  subTopic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  problemName: string;
  problemStatement: string;
  imageUrls?: string[];
  imagePublicIds?: string[];
  supportedLanguages?: string[];
  constraints?: string[];
  sampleInput?: string;
  sampleOutput?: string;
  industrialTestCases?: TestCase[];
  hiddenTestCases?: TestCase[];
  solutionApproach?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isPlacementReadyQuestion?: boolean;
  createdAt: string;
}

const CodingQuestions: React.FC = () => {
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewingProblem, setViewingProblem] = useState<CodingProblem | null>(null);

  // Form state
  const [subTopic, setSubTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [problemName, setProblemName] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['JavaScript', 'Python', 'Java']);
  const [constraints, setConstraints] = useState<string[]>(['']);
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [industrialTestCases, setIndustrialTestCases] = useState<TestCase[]>([{ input: '', output: '' }]);
  const [hiddenTestCases, setHiddenTestCases] = useState<TestCase[]>([{ input: '', output: '' }]);
  const [solutionApproach, setSolutionApproach] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  useEffect(() => { fetchProblems(); }, []);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/contributor/coding-problems/my-problems', {
        headers: makeHeaders('contributor_token')
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch');
      setProblems(data.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading problems');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubTopic('');
    setDifficulty('Medium');
    setProblemName('');
    setProblemStatement('');
    setSupportedLanguages(['JavaScript', 'Python', 'Java']);
    setConstraints(['']);
    setSampleInput('');
    setSampleOutput('');
    setIndustrialTestCases([{ input: '', output: '' }]);
    setHiddenTestCases([{ input: '', output: '' }]);
    setSolutionApproach('');
    setSelectedImages([]);
  };

  const handleSubmit = async () => {
    // Validation
    if (!subTopic.trim()) {
      toast.error('Sub-topic is required');
      return;
    }
    if (!problemName.trim()) {
      toast.error('Problem name is required');
      return;
    }
    if (!problemStatement.trim()) {
      toast.error('Problem statement is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        subTopic: subTopic.trim(),
        difficulty,
        problemName: problemName.trim(),
        problemStatement: problemStatement.trim(),
        supportedLanguages: JSON.stringify(supportedLanguages.filter(l => l.trim())),
        constraints: JSON.stringify(constraints.filter(c => c.trim())),
        sampleInput: sampleInput.trim() || undefined,
        sampleOutput: sampleOutput.trim() || undefined,
        industrialTestCases: JSON.stringify(industrialTestCases.filter(tc => tc.input.trim() && tc.output.trim())),
        hiddenTestCases: JSON.stringify(hiddenTestCases.filter(tc => tc.input.trim() && tc.output.trim())),
        solutionApproach: solutionApproach.trim() || undefined,
        isPlacementReadyQuestion: 'true' // Convert boolean to string for FormData
      };

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value as string);
        }
      });

      // Append images
      selectedImages.forEach((file) => {
        formData.append('images', file);
      });

      const res = await apiFetch('/contributor/coding-problems', {
        method: 'POST',
        headers: makeHeaders('contributor_token'),
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create');

      toast.success('Sent for admin approval!');
      setShowForm(false);
      resetForm();
      fetchProblems();
    } catch (err: any) {
      toast.error(err.message || 'Error creating problem');
    } finally {
      setLoading(false);
    }
  };

  const addConstraint = () => setConstraints([...constraints, '']);
  const removeConstraint = (idx: number) => setConstraints(constraints.filter((_, i) => i !== idx));
  const updateConstraint = (idx: number, value: string) => {
    const updated = [...constraints];
    updated[idx] = value;
    setConstraints(updated);
  };

  const addTestCase = (type: 'industrial' | 'hidden') => {
    if (type === 'industrial') {
      setIndustrialTestCases([...industrialTestCases, { input: '', output: '' }]);
    } else {
      setHiddenTestCases([...hiddenTestCases, { input: '', output: '' }]);
    }
  };

  const removeTestCase = (type: 'industrial' | 'hidden', idx: number) => {
    if (type === 'industrial') {
      setIndustrialTestCases(industrialTestCases.filter((_, i) => i !== idx));
    } else {
      setHiddenTestCases(hiddenTestCases.filter((_, i) => i !== idx));
    }
  };

  const updateTestCase = (type: 'industrial' | 'hidden', idx: number, field: 'input' | 'output', value: string) => {
    if (type === 'industrial') {
      const updated = [...industrialTestCases];
      updated[idx][field] = value;
      setIndustrialTestCases(updated);
    } else {
      const updated = [...hiddenTestCases];
      updated[idx][field] = value;
      setHiddenTestCases(updated);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (supportedLanguages.includes(lang)) {
      setSupportedLanguages(supportedLanguages.filter(l => l !== lang));
    } else {
      setSupportedLanguages([...supportedLanguages, lang]);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const difficultyBadge = (d: string) => {
    if (d === 'Hard') return 'bg-red-100 text-red-700';
    if (d === 'Medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Coding Questions (Placement Ready)</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { resetForm(); setShowForm(true); }} 
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              + New Coding Question
            </button>
            <button 
              onClick={fetchProblems} 
              className="px-3 py-2 bg-white border rounded-md hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading && !showForm ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {problems.map(p => (
              <div key={p._id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${difficultyBadge(p.difficulty)}`}>
                        {p.difficulty}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(p.status)}`}>
                        {p.status}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                        Coding
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">{p.problemName}</h3>
                    <p className="text-sm text-gray-600">{p.subTopic}</p>
                  </div>
                  <button 
                    onClick={() => setViewingProblem(p)} 
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    View
                  </button>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{p.problemStatement}</p>
                {p.rejectionReason && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs font-semibold text-red-700">Rejection Reason:</p>
                    <p className="text-xs text-red-600">{p.rejectionReason}</p>
                  </div>
                )}
                <div className="mt-3 text-xs text-gray-500">
                  Created: {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {problems.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            No coding questions yet. Create your first one!
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 my-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Coding Question</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">Sub-Topic *</label>
                  <input
                    value={subTopic}
                    onChange={e => setSubTopic(e.target.value)}
                    placeholder="e.g., Arrays, Dynamic Programming"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Difficulty *</label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Problem Name *</label>
                <input
                  value={problemName}
                  onChange={e => setProblemName(e.target.value)}
                  placeholder="e.g., Two Sum, Longest Substring"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Problem Statement *</label>
                <textarea
                  value={problemStatement}
                  onChange={e => setProblemStatement(e.target.value)}
                  placeholder="Describe the problem..."
                  className="w-full p-3 border rounded h-32"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Problem Images (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedImages(Array.from(e.target.files));
                    }
                  }}
                  className="w-full p-2 border rounded"
                />
                {selectedImages.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {selectedImages.map((file, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`preview-${idx}`}
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <button
                          onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Supported Languages</label>
                <div className="flex gap-3 flex-wrap">
                  {['JavaScript', 'Python', 'Java', 'C++', 'C', 'Go'].map(lang => (
                    <label key={lang} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={supportedLanguages.includes(lang)}
                        onChange={() => toggleLanguage(lang)}
                        className="accent-purple-600"
                      />
                      <span className="text-sm">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Constraints</label>
                {constraints.map((c, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={c}
                      onChange={e => updateConstraint(i, e.target.value)}
                      placeholder="e.g., 1 <= n <= 10^5"
                      className="flex-1 p-2 border rounded"
                    />
                    {constraints.length > 1 && (
                      <button onClick={() => removeConstraint(i)} className="px-3 py-1 bg-gray-200 rounded">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={addConstraint} className="px-3 py-1 bg-white border rounded text-sm">+ Add Constraint</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">Sample Input</label>
                  <textarea
                    value={sampleInput}
                    onChange={e => setSampleInput(e.target.value)}
                    placeholder="Sample input..."
                    className="w-full p-2 border rounded h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Sample Output</label>
                  <textarea
                    value={sampleOutput}
                    onChange={e => setSampleOutput(e.target.value)}
                    placeholder="Sample output..."
                    className="w-full p-2 border rounded h-20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Industrial Test Cases</label>
                {industrialTestCases.map((tc, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 mb-2 p-3 border rounded bg-gray-50">
                    <div>
                      <label className="block text-xs mb-1">Input</label>
                      <textarea
                        value={tc.input}
                        onChange={e => updateTestCase('industrial', i, 'input', e.target.value)}
                        className="w-full p-2 border rounded text-sm h-16"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Output</label>
                      <textarea
                        value={tc.output}
                        onChange={e => updateTestCase('industrial', i, 'output', e.target.value)}
                        className="w-full p-2 border rounded text-sm h-16"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {industrialTestCases.length > 1 && (
                        <button onClick={() => removeTestCase('industrial', i)} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Remove</button>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={() => addTestCase('industrial')} className="px-3 py-1 bg-white border rounded text-sm">+ Add Test Case</button>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Hidden Test Cases</label>
                {hiddenTestCases.map((tc, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 mb-2 p-3 border rounded bg-gray-50">
                    <div>
                      <label className="block text-xs mb-1">Input</label>
                      <textarea
                        value={tc.input}
                        onChange={e => updateTestCase('hidden', i, 'input', e.target.value)}
                        className="w-full p-2 border rounded text-sm h-16"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Output</label>
                      <textarea
                        value={tc.output}
                        onChange={e => updateTestCase('hidden', i, 'output', e.target.value)}
                        className="w-full p-2 border rounded text-sm h-16"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {hiddenTestCases.length > 1 && (
                        <button onClick={() => removeTestCase('hidden', i)} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Remove</button>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={() => addTestCase('hidden')} className="px-3 py-1 bg-white border rounded text-sm">+ Add Test Case</button>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Solution Approach (Optional)</label>
                <textarea
                  value={solutionApproach}
                  onChange={e => setSolutionApproach(e.target.value)}
                  placeholder="Describe the approach to solve this problem..."
                  className="w-full p-3 border rounded h-24"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button 
                onClick={() => setShowForm(false)} 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingProblem && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 my-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">View Problem</h2>
              <button onClick={() => setViewingProblem(null)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${difficultyBadge(viewingProblem.difficulty)}`}>
                    {viewingProblem.difficulty}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(viewingProblem.status)}`}>
                    {viewingProblem.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold">{viewingProblem.problemName}</h3>
                <p className="text-sm text-gray-600 mt-1">{viewingProblem.subTopic}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Problem Statement</h4>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{viewingProblem.problemStatement}</p>
              </div>

              {viewingProblem.imageUrls && viewingProblem.imageUrls.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Problem Images</h4>
                  <div className="flex gap-2 flex-wrap">
                    {viewingProblem.imageUrls.map((url, i) => (
                      <img key={i} src={url} alt={`problem-img-${i}`} className="w-28 h-28 object-cover rounded-lg border border-gray-200 shadow-sm" />
                    ))}
                  </div>
                </div>
              )}

              {viewingProblem.constraints && viewingProblem.constraints.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Constraints</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {viewingProblem.constraints.map((c, i) => (
                      <li key={i} className="text-sm text-gray-700">{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingProblem.supportedLanguages && viewingProblem.supportedLanguages.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Supported Languages</h4>
                  <div className="flex gap-2 flex-wrap">
                    {viewingProblem.supportedLanguages.map((lang, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">{lang}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewingProblem.sampleInput && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="font-semibold mb-2">Sample Input</h4>
                    <pre className="text-xs bg-gray-100 p-3 rounded border">{viewingProblem.sampleInput}</pre>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Sample Output</h4>
                    <pre className="text-xs bg-gray-100 p-3 rounded border">{viewingProblem.sampleOutput}</pre>
                  </div>
                </div>
              )}

              {viewingProblem.solutionApproach && (
                <div>
                  <h4 className="font-semibold mb-2">Solution Approach</h4>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{viewingProblem.solutionApproach}</p>
                </div>
              )}

              {viewingProblem.industrialTestCases && viewingProblem.industrialTestCases.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Industrial Test Cases</h4>
                  <div className="space-y-2">
                    {viewingProblem.industrialTestCases.map((tc, i) => (
                      <div key={i} className="grid grid-cols-2 gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <div>
                          <p className="text-xs font-semibold text-blue-700 mb-1">Input {i + 1}</p>
                          <pre className="text-xs bg-white p-2 rounded border">{tc.input}</pre>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-700 mb-1">Output {i + 1}</p>
                          <pre className="text-xs bg-white p-2 rounded border">{tc.output}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingProblem.hiddenTestCases && viewingProblem.hiddenTestCases.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Hidden Test Cases</h4>
                  <div className="space-y-2">
                    {viewingProblem.hiddenTestCases.map((tc, i) => (
                      <div key={i} className="grid grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Input {i + 1}</p>
                          <pre className="text-xs bg-white p-2 rounded border">{tc.input}</pre>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Output {i + 1}</p>
                          <pre className="text-xs bg-white p-2 rounded border">{tc.output}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingQuestions;
