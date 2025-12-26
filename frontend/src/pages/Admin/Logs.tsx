import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJson } from '../../lib/api'

type Log = {
  username: string
  role: string
  action: string
  ts: string
  extra?: any
}

export default function AdminLogsPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 10

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

  // Calculate pagination
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog)
  const totalPages = Math.ceil(logs.length / logsPerPage)

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="h-1.5 w-full bg-red-600 animate-pulse" />
      
      {/* Header */}
      <div className="border-b-4 border-red-600 bg-red-600 px-6 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 animate-slideUp">
              <button
                onClick={() => navigate('/admin/welcome')}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white transition-all duration-300 hover:scale-110"
              >
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Authentication Logs</h1>
                <p className="mt-1 text-sm text-white opacity-90">View all system activity logs</p>
              </div>
            </div>
            
            <div className="animate-slideInRight delay-200">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white ring-2 ring-white/20">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Bar */}
        <div className="mb-6 flex items-center justify-between animate-slideUp delay-300">
          <div className="flex items-center space-x-4">
            <div className="rounded-lg border-2 border-red-600 bg-white px-4 py-3 shadow-md">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Logs</p>
              <p className="text-2xl font-bold text-black">{logs.length}</p>
            </div>
            <div className="rounded-lg border-2 border-red-600 bg-white px-4 py-3 shadow-md">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Current Page</p>
              <p className="text-2xl font-bold text-black">{currentPage} / {totalPages || 1}</p>
            </div>
          </div>
          
          <button
            onClick={load}
            className="flex items-center space-x-2 rounded-lg border-2 border-red-600 bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-md transition-all duration-300 hover:scale-105 hover:bg-red-600 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {/* Logs Table */}
        <div className="overflow-hidden rounded-lg border-2 border-red-600 bg-white shadow-xl animate-scaleIn">
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
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-red-600 bg-white">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">
                        <div className="flex items-center space-x-1.5">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Time (UTC)</span>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">
                        <div className="flex items-center space-x-1.5">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>User</span>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">
                        <div className="flex items-center space-x-1.5">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>Role</span>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-700">
                        <div className="flex items-center space-x-1.5">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Action</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {currentLogs.map((l, i) => (
                      <tr key={i} className="transition-all duration-200 hover:bg-red-50/50">
                        <td className="px-4 py-3 text-xs font-mono text-gray-700">
                          {new Date(l.ts).toISOString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full border-2 border-red-600 bg-white px-2.5 py-1 text-xs font-semibold text-black">
                            {l.username}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            {l.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
                            {l.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t-2 border-red-600 bg-white px-4 py-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="flex items-center space-x-1.5 rounded-lg border-2 border-red-600 bg-white px-3 py-1.5 text-sm font-bold text-red-600 transition-all duration-300 hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-red-600"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center space-x-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`h-8 w-8 rounded-lg text-sm font-bold transition-all duration-300 ${
                            currentPage === pageNum
                              ? 'bg-red-600 text-white shadow-md'
                              : 'border-2 border-red-600 bg-white text-red-600 hover:bg-red-600 hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="flex items-center space-x-1.5 rounded-lg border-2 border-red-600 bg-white px-3 py-1.5 text-sm font-bold text-red-600 transition-all duration-300 hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-red-600"
                    >
                      <span>Next</span>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
