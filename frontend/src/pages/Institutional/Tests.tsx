import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { institutionalApi } from '../../lib/api'

type TestDoc = {
  _id: string
  title: string
  type: 'aptitude' | 'technical' | 'psychometric'
  createdAt?: string
}

type Props = {
  username?: string
  institutionId?: string
}

export default function InstitutionalTests({ username, institutionId: propInstitutionId }: Props) {
  const navigate = useNavigate()
  const [institutionId] = useState(propInstitutionId || username || '')
  const [tests, setTests] = useState<TestDoc[]>([])
  const [facultyList, setFacultyList] = useState<Array<{ username: string; faculty_id?: string }>>([])
  const [batchList, setBatchList] = useState<Array<{ batch_code: string; name?: string }>>([])
  const [type, setType] = useState<'aptitude' | 'technical' | 'psychometric'>('aptitude')
  const [title, setTitle] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [questions, setQuestions] = useState<Array<{ q: string; options: string[]; correctIndex: number }>>([])
  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedBatchCodes, setSelectedBatchCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const header = { headers: { 'x-requested-by': 'institutional' } }

  async function load() {
    if (!institutionId) return
    setLoading(true)
    const res = await institutionalApi.listTests(institutionId)
    setLoading(false)
    if (!res.ok) return
    // backend shape: { ok: true, data: [...] }
    const docs = (res.data && (res.data.data ?? res.data)) || []
    setTests(docs)
  }

  async function loadHelpers() {
    if (!institutionId) return
    const f = await institutionalApi.listFaculty(institutionId)
    if (f.ok) {
      const docs = (f.data && (f.data.data ?? f.data)) || []
      setFacultyList(docs)
    }
    const b = await institutionalApi.listBatches(institutionId)
    if (b.ok) {
      const docs = (b.data && (b.data.data ?? b.data)) || []
      setBatchList(docs)
    }
  }

  useEffect(() => { void load(); void loadHelpers() }, [institutionId])

  async function create() {
    if (!institutionId) return alert('Institution ID required')
    const body: any = { type, title }
    if (useCustom && questions.length > 0) body.questions = questions
    const res = await institutionalApi.createTest(institutionId, body)
    if (!res.ok) return alert(res.error || 'Failed to create test')
    setTitle('')
    setUseCustom(false)
    setQuestions([])
    await load()
    await loadHelpers()
  }

  function addQuestion() {
    setQuestions(prev => [...prev, { q: '', options: ['', ''], correctIndex: 0 }])
  }

  function updateQuestion(i: number, patch: Partial<{ q: string; options: string[]; correctIndex: number }>) {
    setQuestions(prev => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }

  function removeQuestion(i: number) {
    setQuestions(prev => prev.filter((_, idx) => idx !== i))
  }

  async function assign(testId: string) {
    if (!institutionId) return alert('Institution ID required')
    const faculty_ids = selectedFacultyId ? [selectedFacultyId] : []
    const batch_codes = selectedBatchCodes
    const res = await institutionalApi.assignTest(institutionId, testId, { faculty_ids, batch_codes })
    if (!res.ok) return alert(res.error || 'Failed to assign')
    // Refresh tests to show assigned info
    await load()
    alert('Assigned successfully')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Progress Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 animate-pulse" />
      
      {/* Header Section */}
      <div className="border-b-4 border-red-600 bg-gradient-to-r from-red-600 to-red-700 px-6 py-8 shadow-lg">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center space-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-md">MCQ Test Management</h1>
              <p className="text-white/90 mt-1">Create, assign, and manage assessments for faculty and students</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Create Test Section */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Create New Test</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="grid sm:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Test Type</label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value as any)} 
                  className="w-full p-3 border-2 border-slate-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                >
                  <option value="aptitude">Aptitude MCQ Test</option>
                  <option value="technical">Technical MCQ Test</option>
                  <option value="psychometric">Psychometric MCQ Test</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Test Title (Optional)</label>
                <input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g., Data Structures Quiz" 
                  className="w-full p-3 border-2 border-slate-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all" 
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={create} 
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105"
                >
                  Create Test
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useCustom} 
                  onChange={e => setUseCustom(e.target.checked)} 
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Use custom questions</span>
                  <p className="text-sm text-slate-600">Leave disabled to auto-generate 5 questions from AI</p>
                </div>
              </label>
            </div>

            {useCustom && (
              <div className="space-y-4 border-t-2 border-slate-200 pt-5">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={addQuestion} 
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Question</span>
                  </button>
                  <span className="text-sm font-semibold text-slate-600">
                    {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
                  </span>
                </div>

                {questions.map((q, i) => (
                  <div key={i} className="p-5 border-2 border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white font-bold text-sm">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-slate-800">Question {i + 1}</span>
                      </div>
                      <button 
                        onClick={() => removeQuestion(i)} 
                        className="px-3 py-1 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                    <input 
                      value={q.q} 
                      onChange={e => updateQuestion(i, { q: e.target.value })} 
                      placeholder="Enter your question here..." 
                      className="w-full p-3 border-2 border-slate-300 rounded-lg mb-3 focus:border-red-500 focus:ring-2 focus:ring-red-200" 
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      {Array.from({ length: Math.max(2, q.options.length) }).map((_, oi) => (
                        <input
                          key={oi}
                          value={q.options[oi] ?? ''}
                          onChange={e => {
                            const opts = q.options.slice()
                            opts[oi] = e.target.value
                            updateQuestion(i, { options: opts })
                          }}
                          placeholder={`Option ${oi + 1}`}
                          className="p-3 border-2 border-slate-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-end gap-3 mb-3">
                      <button
                        onClick={() => {
                          const opts = q.options ? q.options.slice() : []
                          opts.push('')
                          updateQuestion(i, { options: opts })
                        }}
                        className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all"
                      >
                        Add option
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-semibold text-slate-700">Correct Answer:</label>
                      <select 
                        value={q.correctIndex} 
                        onChange={e => updateQuestion(i, { correctIndex: Number(e.target.value) })} 
                        className="p-2 border-2 border-slate-300 rounded-lg focus:border-red-500"
                      >
                        {q.options.map((_, oi) => (
                          <option key={oi} value={oi}>Option {oi + 1}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Existing Tests Section */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Existing Tests</h2>
              </div>
              <button 
                onClick={load} 
                className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-semibold">Refresh</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
                <p className="mt-4 text-slate-600 font-medium">Loading tests...</p>
              </div>
            ) : tests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="mt-4 text-lg font-medium text-slate-600">No tests created yet</p>
                <p className="text-sm text-slate-500">Create your first test above to get started</p>
              </div>
            ) : (
              <div className="space-y-6">
                {tests.map(t => (
                  <div key={t._id} className="border-2 border-slate-200 rounded-2xl bg-gradient-to-br from-white to-slate-50 shadow-md hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        {/* Test Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex-shrink-0">
                              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-800">{t.title || 'Untitled Test'}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                  {t.type}
                                </span>
                                <span className="text-xs text-slate-500">ID: {t._id}</span>
                              </div>
                            </div>
                          </div>

                          {/* Questions */}
                          <div className="bg-white rounded-xl border-2 border-slate-200 p-4 mt-4">
                            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Questions ({(t.questions || []).length})
                            </h4>
                            <ol className="list-decimal ml-6 space-y-3 text-sm">
                              {(t.questions || []).map((q: any, i: number) => (
                                <li key={i} className="text-slate-700">
                                  <div className="font-semibold mb-1">{q.q}</div>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {q.options?.map((opt: string, oi: number) => (
                                      <span 
                                        key={oi} 
                                        className={`px-3 py-1 rounded-lg text-xs ${
                                          oi === q.correctIndex 
                                            ? 'bg-green-100 text-green-700 font-semibold border-2 border-green-300' 
                                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                                        }`}
                                      >
                                        {oi + 1}. {opt}
                                      </span>
                                    ))}
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>

                        {/* Assignment Panel */}
                        <div className="lg:w-96 bg-white rounded-xl border-2 border-slate-200 p-5 shadow-sm">
                          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Assignment
                          </h4>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">Assign to Faculty</label>
                              <select 
                                value={selectedFacultyId} 
                                onChange={e => setSelectedFacultyId(e.target.value)} 
                                className="w-full p-3 border-2 border-slate-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm"
                              >
                                <option value="">-- Select Faculty --</option>
                                {facultyList.map(f => (
                                  <option key={f.faculty_id || f.username} value={f.faculty_id || f.username}>
                                    {f.full_name || f.username || f.faculty_id}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">Assign to Batches</label>
                              <select 
                                multiple 
                                value={selectedBatchCodes} 
                                onChange={e => {
                                  const opts = Array.from(e.target.selectedOptions).map(o => o.value)
                                  setSelectedBatchCodes(opts)
                                }} 
                                className="w-full p-3 border-2 border-slate-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm h-32"
                              >
                                {batchList.map(b => (
                                  <option key={b.batch_code} value={b.batch_code}>
                                    {b.batch_code} {b.name ? `- ${b.name}` : ''}
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                            </div>

                            <button 
                              onClick={() => assign(t._id)} 
                              className="w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold rounded-lg px-4 py-3 hover:from-slate-900 hover:to-black transition-all shadow-md hover:shadow-lg"
                            >
                              Assign Test
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <div className="mt-6 pt-4 border-t-2 border-slate-200 flex justify-end">
                        <button
                          onClick={async () => {
                            if (!confirm('Delete this test? This action cannot be undone.')) return
                            const res = await institutionalApi.deleteTest(institutionId, t._id)
                            if (!res.ok) return alert(res.error || 'Failed to delete test')
                            await load()
                            alert('Test deleted successfully')
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete Test</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>
        </div>
      </div>
    </div>
  )
}
