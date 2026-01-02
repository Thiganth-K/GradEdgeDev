import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJson } from '../../lib/api'

type TestDoc = {
  _id: string
  title: string
  type: string
}

type Result = {
  _id: string
  title: string
  type: string
  submissions: { student_id: string; score: number; attemptedAt: string }[]
}

export default function FacultyTests() {
  const { facultyId } = useParams()
  const navigate = useNavigate()
  const [tests, setTests] = useState<TestDoc[]>([])
  const [selected, setSelected] = useState<Result | null>(null)

  async function load() {
    if (!facultyId) return
    const res = await getJson<{ ok: boolean; data: TestDoc[] }>(`/api/faculty/${encodeURIComponent(facultyId)}/tests`)
    if (res.ok && res.data) setTests(res.data.data || [])
  }

  useEffect(() => { void load() }, [facultyId])

  async function loadResults(testId: string) {
    const res = await getJson<{ ok: boolean; data: Result }>(`/api/faculty/${encodeURIComponent(facultyId || '')}/tests/${encodeURIComponent(testId)}/results`)
    if (!res.ok) return alert(res.error || 'Failed to load results')
    setSelected(res.data.data)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="h-1.5 w-full bg-red-600 animate-pulse" />
      <div className="border-b-4 border-red-600 bg-red-600 px-6 py-6 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold">Faculty MCQ Tests</h1>
          <p className="text-white/80">View your assigned tests and student performance.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Assigned Tests</h2>
            <button onClick={load} className="text-sm bg-slate-100 px-3 py-2 rounded">Refresh</button>
          </div>
          {tests.length === 0 ? (
            <p className="text-slate-500">No tests assigned.</p>
          ) : (
            <ul className="space-y-3">
              {tests.map(t => (
                <li key={t._id} className="p-3 border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{t.title} ({t.type})</p>
                    <p className="text-xs text-slate-500">ID: {t._id}</p>
                  </div>
                  <button onClick={() => loadResults(t._id)} className="bg-slate-800 text-white rounded px-3 py-2">View Results</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold mb-2">Results</h2>
          {!selected ? (
            <p className="text-slate-500">Select a test to view results.</p>
          ) : selected.submissions.length === 0 ? (
            <p className="text-slate-500">No submissions yet.</p>
          ) : (
            <ul className="space-y-2">
              {selected.submissions.map(s => (
                <li key={`${s.student_id}-${s.attemptedAt}`} className="p-3 border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{s.student_id}</p>
                    <p className="text-xs text-slate-500">Attempted: {new Date(s.attemptedAt).toLocaleString()}</p>
                  </div>
                  <div className="font-semibold">Score: {s.score}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2">
          <button onClick={() => navigate(-1)} className="text-sm text-slate-600">Back</button>
        </div>
      </div>
    </div>
  )
}
