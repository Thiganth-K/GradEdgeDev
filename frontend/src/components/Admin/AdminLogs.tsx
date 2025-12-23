import { useEffect, useState } from 'react'
import { getJson } from '../../lib/api'

type Log = {
  username: string
  role: string
  action: string
  ts: string
  extra?: any
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  async function load() {
    setLoading(true)
    setError(undefined)
    const res = await getJson<{ ok: true; logs: Log[] }>('/api/admin/logs')
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    const data = (res as any).data
    setLogs(data.logs || [])
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <section className="mt-6 w-full max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium">Auth Logs</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="rounded bg-slate-100 px-3 py-1 text-sm text-slate-800 hover:bg-slate-200"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 bg-white p-3">
        {loading ? (
          <p className="text-sm text-slate-600">Loading logs…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-600">No logs available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-2 py-1">Time (UTC)</th>
                  <th className="px-2 py-1">User</th>
                  <th className="px-2 py-1">Role</th>
                  <th className="px-2 py-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-slate-700">{new Date(l.ts).toISOString()}</td>
                    <td className="px-2 py-2">{l.username}</td>
                    <td className="px-2 py-2">{l.role}</td>
                    <td className="px-2 py-2">{l.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
