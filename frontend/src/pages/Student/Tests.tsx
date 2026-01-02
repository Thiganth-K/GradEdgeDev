import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { getJson, postJson } from '../../lib/api'

type TestListItem = { _id: string; title: string; type: string }

type TestDetail = { _id: string; title: string; type: string; questions: { q: string; options: string[] }[] }

type Props = { username?: string; onLogout?: () => void }

export default function StudentTests({ username = '', onLogout }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [tests, setTests] = useState<TestListItem[]>([])
  const [active, setActive] = useState<TestDetail | null>(null)
  const [answers, setAnswers] = useState<number[]>([])

  async function load() {
    if (!username) return
    const res = await getJson<{ ok: boolean; data: TestListItem[] }>(`/api/student/${encodeURIComponent(username)}/tests`)
    if (res.ok && res.data) setTests(res.data.data || [])
  }

  useEffect(() => { void load() }, [username])

  useEffect(() => {
    // If navigated from an announcement with a test id, auto-open
    const state: any = location.state as any
    if (state && state.openTestId && username) {
      void openTest(state.openTestId)
      // clear history state so repeated navigations don't reopen
      window.history.replaceState({}, '')
    }
  }, [location.state, username])

  async function openTest(id: string) {
    const res = await getJson<{ ok: boolean; data: TestDetail }>(`/api/student/${encodeURIComponent(username)}/tests/${encodeURIComponent(id)}`)
    if (!res.ok) return alert(res.error || 'Failed to load test')
    const test = res.data.data
    setActive(test)
    setAnswers(Array(test.questions.length).fill(-1))
  }

  async function submit() {
    if (!active) return
    const res = await postJson<{ ok: boolean; data: { score: number; total: number } }, { answers: number[] }>(
      `/api/student/${encodeURIComponent(username)}/tests/${encodeURIComponent(active._id)}/submit`,
      { answers },
    )
    if (!res.ok) return alert(res.error || 'Failed to submit')
    alert(`Score: ${res.data.data.score}/${res.data.data.total}`)
    setActive(null)
    setAnswers([])
    await load()
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="h-1.5 w-full bg-red-600 animate-pulse" />
      <div className="border-b-4 border-red-600 bg-red-600 px-6 py-6 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold">Student MCQ Tests</h1>
          <p className="text-white/80">Take assigned tests and view your score.</p>
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
                  <button onClick={() => openTest(t._id)} className="bg-slate-800 text-white rounded px-3 py-2">Take Test</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold mb-2">Test</h2>
          {!active ? (
            <p className="text-slate-500">Select a test to take.</p>
          ) : (
            <div className="space-y-4">
              <p className="font-semibold">{active.title} ({active.type})</p>
              {active.questions.map((q, i) => (
                <div key={i} className="p-3 border rounded-xl">
                  <p className="font-medium mb-2">Q{i+1}. {q.q}</p>
                  <div className="space-y-1">
                    {q.options.map((opt, idx) => (
                      <label key={idx} className="flex items-center gap-2">
                        <input type="radio" name={`q${i}`} checked={answers[i] === idx} onChange={() => setAnswers(a => { const b = [...a]; b[i] = idx; return b })} />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={submit} className="bg-red-600 text-white rounded px-4 py-2">Submit</button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <button onClick={() => navigate(-1)} className="text-sm text-slate-600">Back</button>
        </div>
      </div>
    </div>
  )
}
