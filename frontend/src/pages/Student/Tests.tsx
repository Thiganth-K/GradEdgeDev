import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getJson, postJson } from '../../lib/api'
import { 
  BookOpen, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Send,
  AlertCircle,
  Award,
  ListChecks,
  Flag,
  Eye,
  SkipForward,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Filter,
  Trophy,
  TrendingUp,
  ThumbsUp,
  Target
} from 'lucide-react'

type TestListItem = { _id: string; title: string; type: string }

type TestDetail = { _id: string; title: string; type: string; questions: { q: string; options: string[] }[] }

type TestResult = { score: number; total: number; percentage: number }

type Props = { username?: string; onLogout?: () => void }

export default function StudentTests({ username = '' }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [tests, setTests] = useState<TestListItem[]>([])
  const [active, setActive] = useState<TestDetail | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set())
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [filterMode, setFilterMode] = useState<'all' | 'flagged' | 'unanswered'>('all')
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  async function load() {
    if (!username) return
    setLoading(true)
    try {
      const res = await getJson<{ ok: boolean; data: TestListItem[] }>(`/api/student/${encodeURIComponent(username)}/tests`)
      if (res.ok && res.data) setTests(res.data.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [username])

  useEffect(() => {
    const state: any = location.state as any
    if (state && state.openTestId && username) {
      void openTest(state.openTestId)
      window.history.replaceState({}, '')
    }
  }, [location.state, username])

  async function openTest(id: string) {
    const res = await getJson<{ ok: boolean; data: TestDetail }>(`/api/student/${encodeURIComponent(username)}/tests/${encodeURIComponent(id)}`)
    if (!res.ok) return alert(res.error || 'Failed to load test')
    const test = res.data.data
    setActive(test)
    setAnswers(Array(test.questions.length).fill(-1))
    setVisitedQuestions(new Set([0]))
    setFlaggedQuestions(new Set())
    setCurrentQuestion(0)
    setFilterMode('all')
  }

  const toggleFlag = (index: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const scrollToQuestion = (index: number) => {
    setCurrentQuestion(index)
    setVisitedQuestions(prev => new Set(prev).add(index))
    questionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const goToNextQuestion = () => {
    if (!active || currentQuestion >= active.questions.length - 1) return
    scrollToQuestion(currentQuestion + 1)
  }

  const goToPrevQuestion = () => {
    if (currentQuestion <= 0) return
    scrollToQuestion(currentQuestion - 1)
  }

  const clearAllAnswers = () => {
    if (confirm('Clear all answers? This cannot be undone.')) {
      setAnswers(Array(active?.questions.length || 0).fill(-1))
    }
  }

  const getFilteredQuestions = () => {
    if (!active) return []
    return active.questions.map((_, i) => i).filter(i => {
      if (filterMode === 'flagged') return flaggedQuestions.has(i)
      if (filterMode === 'unanswered') return answers[i] === -1
      return true
    })
  }

  async function submit() {
    if (!active) return
    const unanswered = answers.filter(a => a === -1).length
    const flagged = flaggedQuestions.size
    
    if (unanswered > 0 || flagged > 0) {
      let message = ''
      if (unanswered > 0) message += `${unanswered} unanswered question(s)`
      if (flagged > 0) message += `${message ? ' and ' : ''}${flagged} flagged question(s)`
      if (!confirm(`You have ${message}. Submit anyway?`)) return
    }
    
    const res = await postJson<{ ok: boolean; data: { score: number; total: number } }, { answers: number[] }>(
      `/api/student/${encodeURIComponent(username)}/tests/${encodeURIComponent(active._id)}/submit`,
      { answers },
    )
    if (!res.ok) return alert(res.error || 'Failed to submit')
    
    const { score, total } = res.data.data
    const percentage = Math.round((score / total) * 100)
    setResult({ score, total, percentage })
    setShowResult(true)
  }

  const closeResultModal = async () => {
    setShowResult(false)
    setResult(null)
    setActive(null)
    setAnswers([])
    setVisitedQuestions(new Set())
    setFlaggedQuestions(new Set())
    await load()
  }

  const getResultConfig = (percentage: number) => {
    if (percentage === 100) {
      return {
        title: 'Perfect Score',
        message: 'Outstanding performance! You have demonstrated complete mastery of the material.',
        color: 'bg-red-600',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        Icon: Trophy,
        showConfetti: true
      }
    } else if (percentage >= 80) {
      return {
        title: 'Excellent Performance',
        message: 'Exceptional work! You have shown strong understanding of the concepts.',
        color: 'bg-red-600',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        Icon: Award,
        showConfetti: true
      }
    } else if (percentage >= 60) {
      return {
        title: 'Good Performance',
        message: 'Well done! You have displayed satisfactory understanding of the material.',
        color: 'bg-red-500',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        Icon: ThumbsUp,
        showConfetti: false
      }
    } else if (percentage >= 40) {
      return {
        title: 'Needs Improvement',
        message: 'Additional study is recommended. Review the material and attempt again.',
        color: 'bg-orange-500',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        Icon: TrendingUp,
        showConfetti: false
      }
    } else {
      return {
        title: 'Further Study Required',
        message: 'Please review the material thoroughly and practice more before retaking.',
        color: 'bg-gray-500',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        Icon: Target,
        showConfetti: false
      }
    }
  }

  const answeredCount = answers.filter(a => a !== -1).length
  const progressPercent = active ? Math.round((answeredCount / active.questions.length) * 100) : 0
  const filteredQuestions = getFilteredQuestions()

  return (
    <div className="min-h-screen bg-gray-50">
      {showResult && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="relative bg-white rounded-lg shadow-2xl max-w-lg w-full">
            {getResultConfig(result.percentage).showConfetti && (
              <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 animate-confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '-10px',
                      backgroundColor: '#dc2626',
                      animationDelay: `${Math.random() * 0.5}s`,
                      animationDuration: `${2 + Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>
            )}

            <button onClick={closeResultModal} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10">
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>

            <div className="p-12 text-center">
              <div className={`inline-flex p-6 rounded-2xl ${getResultConfig(result.percentage).iconBg} mb-8`}>
                {(() => {
                  const IconComponent = getResultConfig(result.percentage).Icon
                  return <IconComponent className={`w-16 h-16 ${getResultConfig(result.percentage).iconColor}`} />
                })()}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-12">{getResultConfig(result.percentage).title}</h2>

              <div className="flex items-center justify-center gap-8 mb-10">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle cx="96" cy="96" r="80" stroke="#f3f4f6" strokeWidth="16" fill="none" />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      className="transition-all duration-1000 ease-out"
                      stroke={result.percentage >= 60 ? '#dc2626' : result.percentage >= 40 ? '#f97316' : '#6b7280'}
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 80}`}
                      strokeDashoffset={`${2 * Math.PI * 80 * (1 - result.percentage / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-gray-900 mb-1">{result.percentage}%</span>
                    <span className="text-sm text-gray-500 font-medium">Score</span>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full ${getResultConfig(result.percentage).color} text-white font-bold text-base shadow-lg whitespace-nowrap`}>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{result.score} out of {result.total} Correct</span>
                </div>
              </div>

              <p className="text-gray-600 text-base mb-8 leading-relaxed max-w-lg mx-auto">{getResultConfig(result.percentage).message}</p>

              <div className="flex gap-3">
                <button onClick={closeResultModal} className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Back to Tests
                </button>
                <button onClick={closeResultModal} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/student/dashboard')} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="p-3 bg-red-600 rounded-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MCQ Tests</h1>
              <p className="text-sm text-gray-600 mt-0.5">Complete your assigned assessments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {!active ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ListChecks className="w-5 h-5 text-red-600" />
                      <h2 className="text-lg font-bold text-gray-900">Assigned Tests</h2>
                      <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold">{tests.length}</span>
                    </div>
                    <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 font-medium">
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
                      <p className="text-sm text-gray-400 mt-1">Check back later for new assessments</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tests.map((t, idx) => (
                        <div key={t._id} className="group p-5 border border-gray-200 rounded-lg hover:border-red-600 hover:shadow-md transition-all cursor-pointer" onClick={() => openTest(t._id)}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 text-red-600 text-sm font-bold group-hover:bg-red-600 group-hover:text-white transition-colors">{idx + 1}</span>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">{t.title}</h3>
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                                    <Clock className="w-3.5 h-3.5" />
                                    {t.type}
                                  </span>
                                  <span className="text-xs text-gray-400 font-medium">ID: {t._id.slice(0, 8)}...</span>
                                </div>
                              </div>
                            </div>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm">
                              Start Test
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Test Instructions</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-red-600" />
                    </div>
                    <span>Read each question carefully before selecting an answer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-red-600" />
                    </div>
                    <span>Select one answer per question from the options</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-red-600" />
                    </div>
                    <span>Review all answers before final submission</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-red-600" />
                    </div>
                    <span>Submit test to receive instant results and feedback</span>
                  </li>
                </ul>
              </div>

              <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Award className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Important Note</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Take your time to carefully consider each question. You can review and modify your answers before final submission.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{active.title}</h2>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-700">
                          <Clock className="w-3.5 h-3.5" />
                          {active.type}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">{active.questions.length} Questions</span>
                      </div>
                    </div>
                    <button onClick={() => {
                      if (confirm('Exit test? Your progress will be lost.')) {
                        setActive(null)
                        setAnswers([])
                      }
                    }} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-semibold">Progress</span>
                      <span className="text-red-600 font-bold">{answeredCount} / {active.questions.length} Answered</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-red-600 h-3 transition-all duration-300 rounded-full" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6 max-h-[calc(100vh-20rem)] overflow-y-auto">
                  {active.questions.map((q, i) => (
                    <div key={i} ref={el => { questionRefs.current[i] = el }} className={`p-6 border-2 rounded-lg transition-all ${
                      currentQuestion === i ? 'border-red-300 bg-red-50/30 shadow-md' : 'border-gray-100 hover:border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <span className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            currentQuestion === i ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'
                          }`}>{i + 1}</span>
                          <p className="font-medium text-gray-900 leading-relaxed">{q.q}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {visitedQuestions.has(i) && (
                            <div className="p-1.5 bg-blue-50 rounded-full" title="Visited">
                              <Eye className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          <button onClick={() => toggleFlag(i)} className={`p-1.5 rounded-full transition-colors ${
                            flaggedQuestions.has(i) ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-orange-600'
                          }`} title={flaggedQuestions.has(i) ? 'Unflag question' : 'Flag for review'}>
                            <Flag className="w-4 h-4" fill={flaggedQuestions.has(i) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 ml-11">
                        {q.options.map((opt, idx) => (
                          <label key={idx} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            answers[i] === idx ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200 hover:bg-gray-50'
                          }`}>
                            <input type="radio" name={`q${i}`} checked={answers[i] === idx} onChange={() => {
                              setAnswers(a => { const b = [...a]; b[i] = idx; return b })
                              setVisitedQuestions(prev => new Set(prev).add(i))
                            }} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                            <span className={`text-sm ${answers[i] === idx ? 'text-red-700 font-medium' : 'text-gray-700'}`}>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between gap-4">
                    <button onClick={goToPrevQuestion} disabled={currentQuestion === 0} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <button onClick={() => scrollToQuestion(answers.findIndex(a => a === -1))} disabled={answeredCount === active.questions.length} className="p-2.5 text-blue-600 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all" title="Jump to next unanswered">
                        <SkipForward className="w-5 h-5" />
                      </button>
                      <button onClick={clearAllAnswers} className="p-2.5 text-orange-600 bg-orange-50 border-2 border-orange-200 rounded-lg hover:bg-orange-100 transition-all" title="Clear all answers">
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>

                    <button onClick={goToNextQuestion} disabled={currentQuestion === active.questions.length - 1} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900">Question Navigator</h3>
                  <button onClick={() => setFilterMode(prev => prev === 'all' ? 'flagged' : prev === 'flagged' ? 'unanswered' : 'all')} className="p-2 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors" title="Filter questions">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>

                {filterMode !== 'all' && (
                  <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg flex items-center justify-between">
                    <span>Filter: {filterMode === 'flagged' ? 'Flagged' : 'Unanswered'}</span>
                    <button onClick={() => setFilterMode('all')} className="hover:text-red-900">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-5 gap-2 mb-6 max-h-64 overflow-y-auto p-1">
                  {(filterMode === 'all' ? active.questions.map((_, i) => i) : filteredQuestions).map((i) => (
                    <button key={i} onClick={() => scrollToQuestion(i)} className={`relative w-11 h-11 rounded-lg text-sm font-bold transition-all shadow-sm ${
                      currentQuestion === i ? 'ring-2 ring-red-600 ring-offset-2' : ''
                    } ${answers[i] !== -1 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'}`}>
                      {i + 1}
                      {flaggedQuestions.has(i) && <Flag className="absolute -top-1 -right-1 w-3.5 h-3.5 text-orange-600" fill="currentColor" />}
                      {visitedQuestions.has(i) && !flaggedQuestions.has(i) && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3 text-xs border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-red-600 border border-red-700" />
                    <span className="text-gray-700 font-medium">Answered</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <Flag className="w-3.5 h-3.5 text-orange-600" fill="currentColor" />
                    </div>
                    <span className="text-gray-700 font-medium">Flagged</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center relative">
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                    </div>
                    <span className="text-gray-700 font-medium">Visited</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6 pt-5 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-semibold">Answered</span>
                    <span className="font-bold text-red-600">{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-semibold">Unanswered</span>
                    <span className="font-bold text-orange-600">{active.questions.length - answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-semibold">Flagged</span>
                    <span className="font-bold text-orange-600">{flaggedQuestions.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-semibold">Visited</span>
                    <span className="font-bold text-blue-600">{visitedQuestions.size}</span>
                  </div>
                </div>

                <button onClick={submit} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md hover:shadow-lg text-sm">
                  <Send className="w-4 h-4" />
                  Submit Test
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes confetti {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}</style>
    </div>
  )
}
