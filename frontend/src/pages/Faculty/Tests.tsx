import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJson } from '../../lib/api'
import { BookOpen, RefreshCw, ChevronLeft, ListChecks, FileText, Users, Clock, TrendingUp, Award, User, ChevronRight } from 'lucide-react'

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
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const submissionsPerPage = 10

  async function load() {
    if (!facultyId) return
    setLoading(true)
    try {
      const res = await getJson<{ ok: boolean; data: TestDoc[] }>(`/api/faculty/${encodeURIComponent(facultyId)}/tests`)
      if (res.ok && res.data) setTests(res.data.data || [])
    } finally {
      setLoading(false)
    }
  }

  async function refresh() {
    await load()
    if (selected) {
      await loadResults(selected._id)
    }
  }

  useEffect(() => { void load() }, [facultyId])

  async function loadResults(testId: string) {
    const res = await getJson<{ ok: boolean; data: Result }>(`/api/faculty/${encodeURIComponent(facultyId || '')}/tests/${encodeURIComponent(testId)}/results`)
    if (!res.ok) return alert(res.error || 'Failed to load results')
    setSelected(res.data.data)
    setCurrentPage(1)
  }

  const getAverageScore = () => {
    if (!selected || selected.submissions.length === 0) return 0
    const total = selected.submissions.reduce((sum, s) => sum + s.score, 0)
    return Math.round(total / selected.submissions.length)
  }

  const getPaginatedSubmissions = () => {
    if (!selected) return []
    const startIndex = (currentPage - 1) * submissionsPerPage
    const endIndex = startIndex + submissionsPerPage
    return selected.submissions.slice(startIndex, endIndex)
  }

  const totalPages = selected ? Math.ceil(selected.submissions.length / submissionsPerPage) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="p-3 bg-red-600 rounded-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MCQ Tests Management</h1>
              <p className="text-sm text-gray-600 mt-0.5">View assigned tests and monitor student performance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Assigned Tests Section */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ListChecks className="w-5 h-5 text-red-600" />
                    <h2 className="text-lg font-bold text-gray-900">Assigned Tests</h2>
                    <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold">{tests.length}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setSelected(null)
                      setCurrentPage(1)
                    }} 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 transition-colors font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="p-6">
                {tests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
                      <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No tests assigned yet</p>
                    <p className="text-sm text-gray-400 mt-1">Tests will appear here once assigned</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tests.map((t, idx) => (
                      <div 
                        key={t._id} 
                        className={`group p-5 border-2 rounded-lg transition-all cursor-pointer ${
                          selected?._id === t._id 
                            ? 'border-red-600 bg-red-50 shadow-md' 
                            : 'border-gray-200 hover:border-red-600 hover:shadow-md'
                        }`}
                        onClick={() => loadResults(t._id)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <span className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                              selected?._id === t._id 
                                ? 'bg-red-600 text-white' 
                                : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <h3 className={`font-bold mb-2 transition-colors ${
                                selected?._id === t._id ? 'text-red-600' : 'text-gray-900 group-hover:text-red-600'
                              }`}>
                                {t.title}
                              </h3>
                              <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                                  <Clock className="w-3.5 h-3.5" />
                                  {t.type}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">ID: {t._id.slice(0, 8)}...</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              loadResults(t._id)
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
                          >
                            View Results
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Sidebar */}
          <div>
            {!selected ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Select a test to view statistics</p>
                  <p className="text-sm text-gray-400 mt-1">Test details will appear here</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">Test Statistics</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 font-medium">Total Submissions</span>
                        <Users className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{selected.submissions.length}</span>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-red-700 font-medium">Average Score</span>
                        <Award className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="text-2xl font-bold text-red-600">{getAverageScore()}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">Test Details</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Title:</span>
                      <span className="font-semibold text-gray-900">{selected.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Type:</span>
                      <span className="font-semibold text-gray-900">{selected.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {selected && (
          <div className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-bold text-gray-900">Student Submissions</h2>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                    {selected.submissions.length} {selected.submissions.length === 1 ? 'submission' : 'submissions'}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {selected.submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
                      <User className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No submissions yet</p>
                    <p className="text-sm text-gray-400 mt-1">Student submissions will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">#</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Student ID</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Attempted At</th>
                          <th className="text-right py-3 px-4 font-bold text-gray-900 text-sm">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedSubmissions().map((s, idx) => {
                          const globalIndex = (currentPage - 1) * submissionsPerPage + idx + 1
                          return (
                            <tr 
                              key={`${s.student_id}-${s.attemptedAt}`} 
                              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-4 px-4">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                                  {globalIndex}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-semibold text-gray-900">{s.student_id}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {new Date(s.attemptedAt).toLocaleString()}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                                  s.score >= 80 
                                    ? 'bg-green-100 text-green-700' 
                                    : s.score >= 60 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : s.score >= 40 
                                        ? 'bg-orange-100 text-orange-700' 
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                  <Award className="w-4 h-4" />
                                  {s.score}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {selected && selected.submissions.length > submissionsPerPage && (
                  <div className="mt-6 flex items-center justify-between pt-5 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * submissionsPerPage + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * submissionsPerPage, selected.submissions.length)}</span> of <span className="font-semibold text-gray-900">{selected.submissions.length}</span> submissions
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                              currentPage === page 
                                ? 'bg-red-600 text-white shadow-sm' 
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
