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
    <section className="mx-auto mt-12 w-full max-w-7xl animate-slideUp px-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-red-600 bg-red-600 px-6 py-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white">
            <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Authentication Logs</h2>
        </div>
        <button
          onClick={load}
          className="flex items-center space-x-2 rounded-lg border-2 border-white bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-black hover:text-white hover:border-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden border-2 border-red-600 bg-white shadow-2xl">
        {loading ? (
          <div className="flex items-center justify-center space-x-3 p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-red-600 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">Loading logs…</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center space-x-2 p-8">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-red-600">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 p-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-600">No logs available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-red-600 bg-white">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-red-700">
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Time (UTC)</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-red-700">
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>User</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-red-700">
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Role</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-red-700">
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Action</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {logs.map((l, i) => (
                  <tr key={i} className="transition-all duration-200 hover:bg-red-50/50">
                    <td className="px-6 py-4 text-xs font-mono text-gray-700">
                      {new Date(l.ts).toISOString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                        {l.username}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        {l.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                        {l.action}
                      </span>
                    </td>
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
