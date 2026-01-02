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
    const res = await institutionalApi.createTest(institutionId, { type, title })
    if (!res.ok) return alert(res.error || 'Failed to create test')
    setTitle('')
    await load()
    await loadHelpers()
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
    <div className="min-h-screen bg-white">
      <div className="h-1.5 w-full bg-red-600 animate-pulse" />
      <div className="border-b-4 border-red-600 bg-red-600 px-6 py-6 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold">Institutional MCQ Tests</h1>
          <p className="text-white/80">Create MCQ tests and assign faculty/students.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Create New Test</h2>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <select value={type} onChange={e => setType(e.target.value as any)} className="p-3 border rounded-xl">
              <option value="aptitude">Aptitude MCQ Test</option>
              <option value="technical">Technical MCQ Test</option>
              <option value="psychometric">Psychometric MCQ Test</option>
            </select>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Optional Title" className="p-3 border rounded-xl" />
            <button onClick={create} className="bg-red-600 text-white rounded-xl px-4 py-3">Create</button>
          </div>
          <p className="text-sm text-slate-600">Each new test auto-generates 5 questions for the selected type.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Existing Tests</h2>
            <button onClick={load} className="text-sm bg-slate-100 px-3 py-2 rounded">Refresh</button>
          </div>
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : tests.length === 0 ? (
            <p className="text-slate-500">No tests yet.</p>
          ) : (
            <ul className="space-y-3 mt-4">
              {tests.map(t => (
                <li key={t._id} className="p-3 border rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{t.title} ({t.type})</p>
                      <p className="text-xs text-slate-500">ID: {t._id}</p>
                      <div className="mt-3">
                        <h4 className="text-sm font-medium">Questions</h4>
                        <ol className="list-decimal ml-5 mt-2 space-y-2 text-sm">
                          {(t.questions || []).map((q: any, i: number) => (
                            <li key={i}>
                              <div className="font-medium">{q.q}</div>
                              <div className="mt-1 text-sm text-slate-600">{q.options?.join(' | ')}</div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <div className="ml-6 w-80">
                      <label className="block text-xs text-slate-600">Assign Faculty</label>
                      <select value={selectedFacultyId} onChange={e => setSelectedFacultyId(e.target.value)} className="w-full p-2 border rounded mb-3">
                        <option value="">-- select faculty --</option>
                        {facultyList.map(f => (
                          <option key={f.faculty_id || f.username} value={f.faculty_id || f.username}>{f.full_name || f.username || f.faculty_id}</option>
                        ))}
                      </select>

                      <label className="block text-xs text-slate-600">Assign Batches</label>
                      <select multiple value={selectedBatchCodes} onChange={e => {
                        const opts = Array.from(e.target.selectedOptions).map(o => o.value)
                        setSelectedBatchCodes(opts)
                      }} className="w-full p-2 border rounded mb-3 h-28">
                        {batchList.map(b => (
                          <option key={b.batch_code} value={b.batch_code}>{b.batch_code} {b.name ? `- ${b.name}` : ''}</option>
                        ))}
                      </select>

                      <button onClick={() => assign(t._id)} className="w-full bg-slate-800 text-white rounded px-3 py-2">Assign</button>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this test? This action cannot be undone.')) return
                        const res = await institutionalApi.deleteTest(institutionId, t._id)
                        if (!res.ok) return alert(res.error || 'Failed to delete test')
                        await load()
                        alert('Deleted')
                      }}
                      className="text-sm text-red-600"
                    >
                      Delete Test
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-slate-600">Back</button>
        </div>
      </div>
    </div>
  )
}
