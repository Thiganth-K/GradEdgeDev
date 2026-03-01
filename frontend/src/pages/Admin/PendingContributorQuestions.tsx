import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { makeHeaders } from '../../lib/makeHeaders';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Admin/Sidebar';
import { FaCheck, FaTimes, FaFilter, FaClipboardList, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface Option { text?: string; isCorrect?: boolean; imageUrls?: string[] }
interface Solution { explanation?: string; imageUrls?: string[] }

interface PendingQuestion {
  _id: string;
  subTopic?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'Easy' | 'Medium' | 'Hard';
  question: string;
  questionImageUrls?: string[];
  options?: Option[];
  solutions?: Solution[];
  contributorId?: string;
  contributor?: { username?: string; email?: string };
  questionType?: 'mcq' | 'placement';
  createdAt?: string;
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
  industrialTestCases?: Array<{ input: string; output: string }>;
  hiddenTestCases?: Array<{ input: string; output: string }>;
  solutionApproach?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy?: { _id: string; username?: string; email?: string };
  createdAt?: string;
  timeLimit?: string;
  memoryLimit?: string;
}

type FilterType = 'all' | 'mcq' | 'placement' | 'coding';

const PendingContributorQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<PendingQuestion[]>([]);
  const [codingProblems, setCodingProblems] = useState<CodingProblem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Approve modal state
  const [approveModal, setApproveModal] = useState<{ open: boolean; question: PendingQuestion } | null>(null);
  const [approveSubtopic, setApproveSubtopic] = useState('');
  const [approving, setApproving] = useState(false);
  // Reject modal state (shared for MCQ and Coding)
  const [rejectModal, setRejectModal] = useState<{ open: boolean; questionId: string; questionText: string; isCoding?: boolean } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => { fetchPending(); }, []);

  const normalizeTopic = (raw?: string) => {
    if (!raw) return undefined;
    const s = String(raw).trim();
    if (!s) return undefined;
    const l = s.toLowerCase();
    if (l === 'aptitude') return 'Aptitude';
    if (l === 'technical') return 'Technical';
    if (l === 'psychometric') return 'Psychometric';
    return undefined;
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      // Fetch both MCQ and Coding problems in parallel
      const [mcqRes, codingRes] = await Promise.all([
        apiFetch('/admin/contributor-questions/pending', { headers: makeHeaders() }),
        apiFetch('/admin/coding-problems/pending', { headers: makeHeaders() })
      ]);
      
      const mcqData = await mcqRes.json();
      const codingData = await codingRes.json();
      
      if (!mcqRes.ok) throw new Error(mcqData.message || 'Failed to fetch MCQ questions');
      if (!codingRes.ok) console.warn('Failed to fetch coding problems:', codingData.message);
      
      setQuestions(mcqData.data || []);
      setCodingProblems(codingData.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load pending questions');
    } finally { setLoading(false); }
  };

  const openApproveModal = (q: PendingQuestion) => {
    setApproveModal({ open: true, question: q });
    // Default topic should come from the contributor question itself
    setApproveSubtopic(q.subTopic || '');
  };

  const closeApproveModal = () => { setApproveModal(null); };

  const handleApproveConfirm = async () => {
    if (!approveModal) return;
    try {
      setApproving(true);
      const res = await apiFetch(`/admin/contributor-questions/${approveModal.question._id}/approve`, {
        method: 'PUT',
        headers: makeHeaders('admin_token', 'application/json'),
        body: JSON.stringify({ subtopic: approveSubtopic.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approve failed');
      toast.success('Question approved and added to Library!');
      setQuestions(qs => qs.filter(q => q._id !== approveModal.question._id));
      closeApproveModal();
    } catch (err: any) {
      toast.error(err.message || 'Approve failed');
    } finally { setApproving(false); }
  };

  const handleApprove = async (id: string) => { openApproveModal(questions.find(q => q._id === id)!); };

  const openRejectModal = (q: PendingQuestion) => {
    setRejectModal({ open: true, questionId: q._id, questionText: q.question });
    setRejectReason('');
  };

  const closeRejectModal = () => {
    setRejectModal(null);
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    
    // Check if this is a coding problem by looking in codingProblems array
    const isCoding = rejectModal.isCoding || codingProblems.some(cp => cp._id === rejectModal.questionId);
    
    try {
      setRejecting(true);
      
      if (isCoding) {
        // Coding problem rejection
        const res = await apiFetch(`/admin/coding-problems/${rejectModal.questionId}/reject`, {
          method: 'PATCH',
          headers: makeHeaders('admin_token', 'application/json'),
          body: JSON.stringify({ reason: rejectReason.trim() || undefined })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Reject failed');
        toast.success('Coding problem rejected. Contributor will be notified.');
        setCodingProblems(list => list.filter(cp => cp._id !== rejectModal.questionId));
      } else {
        // MCQ rejection
        const res = await apiFetch(`/admin/contributor-questions/${rejectModal.questionId}/reject`, {
          method: 'PUT',
          headers: makeHeaders('admin_token', 'application/json'),
          body: JSON.stringify({ reason: rejectReason.trim() || undefined })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Reject failed');
        toast.success('Question rejected. Contributor will be notified.');
        setQuestions(qs => qs.filter(q => q._id !== rejectModal.questionId));
      }
      
      closeRejectModal();
    } catch (err: any) {
      toast.error(err.message || 'Reject failed');
    } finally { setRejecting(false); }
  };

  const handleApproveCoding = async (id: string) => {
    try {
      const res = await apiFetch(`/admin/coding-problems/${id}/approve`, {
        method: 'PUT',
        headers: makeHeaders('admin_token', 'application/json'),
        body: JSON.stringify({ topic: 'Technical', subtopic: undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approve failed');
      toast.success('Coding problem approved and added to Library!');
      setCodingProblems(list => list.filter(cp => cp._id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Approve failed');
    }
  };

  const handleRejectCoding = (id: string, problemName: string) => {
    setRejectModal({ open: true, questionId: id, questionText: problemName, isCoding: true });
    setRejectReason('');
  };

  const filteredMCQ = questions.filter(q => {
    if (filter === 'all') return true;
    if (filter === 'coding') return false;
    return (q.questionType || 'mcq') === filter;
  });
  
  const filteredCoding = filter === 'all' || filter === 'coding' ? codingProblems : [];
  const totalFiltered = filteredMCQ.length + filteredCoding.length;

  const difficultyBadge = (d?: string) => {
    if (d === 'hard' || d === 'Hard') return 'bg-red-100 text-red-700';
    if (d === 'medium' || d === 'Medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-8">

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">PENDING QUESTIONS</h1>
            <p className="text-gray-500 text-sm mt-1 uppercase tracking-wider">Review and approve contributor-submitted questions</p>
          </div>

          {/* Summary Banner */}
          <div className="relative rounded-2xl overflow-hidden bg-[#0d0d0d] text-white shadow-lg p-6 flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white">
                <FaClipboardList size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-300 uppercase opacity-80">Queue</p>
                <p className="text-2xl font-semibold">{questions.length + codingProblems.length} pending question{(questions.length + codingProblems.length) !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="text-xs text-gray-400">MCQ</p>
                <p className="text-xl font-bold text-blue-400">{questions.filter(q => (q.questionType || 'mcq') === 'mcq').length}</p>
              </div>
              <div className="w-px bg-gray-700 mx-1" />
              <div>
                <p className="text-xs text-gray-400">Placement</p>
                <p className="text-xl font-bold text-purple-400">{questions.filter(q => q.questionType === 'placement').length}</p>
              </div>
              <div className="w-px bg-gray-700 mx-1" />
              <div>
                <p className="text-xs text-gray-400">Coding</p>
                <p className="text-xl font-bold text-green-400">{codingProblems.length}</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 bg-white rounded-xl shadow-sm p-2 w-fit border-2 border-red-100">
            <FaFilter className="text-gray-400 ml-2 mr-1" size={13} />
            {(['all', 'mcq', 'placement', 'coding'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  filter === f
                    ? f === 'placement'
                      ? 'bg-purple-600 text-white shadow'
                      : f === 'mcq'
                        ? 'bg-blue-600 text-white shadow'
                      : f === 'coding'
                        ? 'bg-green-600 text-white shadow'
                        : 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {f === 'all' 
                  ? `All (${questions.length + codingProblems.length})` 
                  : f === 'mcq' 
                    ? `MCQ (${questions.filter(q => (q.questionType || 'mcq') === 'mcq').length})` 
                    : f === 'placement'
                      ? `Placement Ready (${questions.filter(q => q.questionType === 'placement').length})`
                      : `Coding (${codingProblems.length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-4 text-gray-500 font-medium">Loading questions...</span>
            </div>
          ) : totalFiltered === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-red-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck size={24} className="text-green-600" />
              </div>
              <p className="text-xl font-bold text-gray-700">All clear!</p>
              <p className="text-gray-500 mt-1">No {filter !== 'all' ? filter.toUpperCase() + ' ' : ''}questions pending review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* MCQ Questions */}
              {filteredMCQ.map(q => {
                const isExpanded = expandedId === q._id;
                const isApproving = approvingId === q._id;
                return (
                  <div key={q._id} className="bg-white rounded-xl shadow-md border-2 border-red-100 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    {/* Card Header — always visible */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Badges row */}
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            {q.questionType === 'placement'
                              ? <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">Placement Readiness</span>
                              : <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">MCQ</span>
                            }
                            {q.difficulty && (
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${difficultyBadge(q.difficulty)}`}>
                                {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                              </span>
                            )}
                            {q.subTopic && (
                              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">{q.subTopic}</span>
                            )}
                          </div>
                          {/* Question text */}
                          <p className="text-gray-900 font-semibold text-base leading-snug line-clamp-2">{q.question}</p>
                          {/* Meta */}
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {q.contributor?.username && (
                              <span className="text-xs text-gray-500">
                                By <span className="font-medium text-gray-700">{q.contributor.username}</span>
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => openApproveModal(q)}
                            disabled={approvingId === q._id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <FaCheck size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(q)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-sm"
                          >
                            <FaTimes size={12} />
                            Reject
                          </button>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : q._id)}
                            className="flex items-center gap-1 px-3 py-2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-all duration-200"
                          >
                            {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            <span className="text-xs font-medium">{isExpanded ? 'Hide' : 'Preview'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Preview */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 pb-5 pt-4">
                        {/* Question images */}
                        {q.questionImageUrls && q.questionImageUrls.length > 0 && (
                          <div className="flex gap-3 flex-wrap mb-4">
                            {q.questionImageUrls.map((u, i) => (
                              <img key={i} src={u} alt={`q-img-${i}`} className="w-28 h-28 object-cover rounded-lg border border-gray-200 shadow-sm" />
                            ))}
                          </div>
                        )}

                        {/* Options */}
                        {q.options && q.options.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Answer Options</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt, idx) => (
                                <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border text-sm transition-colors ${
                                  opt.isCorrect
                                    ? 'bg-green-50 border-green-300 shadow-sm'
                                    : 'bg-white border-gray-200'
                                }`}>
                                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    opt.isCorrect ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <span className={opt.isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}>{opt.text}</span>
                                    {opt.imageUrls && opt.imageUrls.length > 0 && (
                                      <div className="mt-2 flex gap-2 flex-wrap">
                                        {opt.imageUrls.map((u, i) => <img key={i} src={u} className="w-20 h-20 object-cover rounded" alt="" />)}
                                      </div>
                                    )}
                                  </div>
                                  {opt.isCorrect && (
                                    <span className="flex-shrink-0 text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">
                                      CORRECT
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Solutions */}
                        {q.solutions && q.solutions.length > 0 && (
                          <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-bold uppercase text-blue-600 tracking-wider mb-2">Explanation</p>
                            {q.solutions.map((s, si) => (
                              <div key={si}>
                                {s.explanation && <p className="text-sm text-blue-900">{s.explanation}</p>}
                                {s.imageUrls && s.imageUrls.length > 0 && (
                                  <div className="mt-2 flex gap-2 flex-wrap">
                                    {s.imageUrls.map((u, i) => <img key={i} src={u} className="w-24 h-24 object-cover rounded" alt="" />)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Coding Questions */}
              {filteredCoding.map(cp => {
                const isExpanded = expandedId === cp._id;
                return (
                  <div key={cp._id} className="bg-white rounded-xl shadow-md border-2 border-green-100 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    {/* Card Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Badges row */}
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">Coding Problem</span>
                            {cp.difficulty && (
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${difficultyBadge(cp.difficulty)}`}>
                                {cp.difficulty}
                              </span>
                            )}
                            {cp.subTopic && (
                              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">{cp.subTopic}</span>
                            )}
                          </div>
                          {/* Problem name */}
                          <p className="text-gray-900 font-semibold text-base leading-snug">{cp.problemName}</p>
                          {/* Meta */}
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {cp.createdBy?.username && (
                              <span className="text-xs text-gray-500">
                                By <span className="font-medium text-gray-700">{cp.createdBy.username}</span>
                              </span>
                            )}
                              <span className="text-xs text-gray-400">{cp.createdAt ? new Date(cp.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600 flex gap-4">
                              {cp.timeLimit && <div>Time: <span className="font-medium text-gray-700">{cp.timeLimit}</span></div>}
                              {cp.memoryLimit && <div>Memory: <span className="font-medium text-gray-700">{cp.memoryLimit}</span></div>}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApproveCoding(cp._id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm"
                          >
                            <FaCheck size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectCoding(cp._id, cp.problemName)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-sm"
                          >
                            <FaTimes size={12} />
                            Reject
                          </button>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : cp._id)}
                            className="flex items-center gap-1 px-3 py-2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-all duration-200"
                          >
                            {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            <span className="text-xs font-medium">{isExpanded ? 'Hide' : 'Preview'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Preview */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 pb-5 pt-4">
                        {/* Problem Statement */}
                        <div className="mb-4">
                          <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Problem Statement</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{cp.problemStatement}</p>
                        </div>

                        {/* Problem Images */}
                        {cp.imageUrls && cp.imageUrls.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Problem Images</p>
                            <div className="flex gap-2 flex-wrap">
                              {cp.imageUrls.map((u, i) => (
                                <img key={i} src={u} alt={`problem-img-${i}`} className="w-28 h-28 object-cover rounded-lg border border-gray-200 shadow-sm" />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Constraints */}
                        {cp.constraints && cp.constraints.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Constraints</p>
                            <ul className="list-disc list-inside space-y-1">
                              {cp.constraints.map((c, i) => (
                                <li key={i} className="text-sm text-gray-700">{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Supported Languages */}
                        {cp.supportedLanguages && cp.supportedLanguages.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Supported Languages</p>
                            <div className="flex gap-2 flex-wrap">
                              {cp.supportedLanguages.map((lang, i) => (
                                <span key={i} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">{lang}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sample I/O */}
                        {cp.sampleInput && cp.sampleOutput && (
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                              <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Sample Input</p>
                               <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">{cp.sampleInput}</pre>
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Sample Output</p>
                              <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">{cp.sampleOutput}</pre>
                            </div>
                          </div>
                        )}

                        {/* Solution Approach */}
                        {cp.solutionApproach && (
                          <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-bold uppercase text-blue-600 tracking-wider mb-2">Solution Approach</p>
                            <p className="text-sm text-blue-900 whitespace-pre-wrap">{cp.solutionApproach}</p>
                          </div>
                        )}

                        {/* Industrial Test Cases */}
                        {cp.industrialTestCases && cp.industrialTestCases.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Industrial Test Cases</p>
                            <div className="space-y-2">
                              {cp.industrialTestCases.map((tc, i) => (
                                <div key={i} className="grid grid-cols-2 gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                  <div>
                                    <p className="text-xs font-semibold text-blue-700 mb-1">Input {i + 1}</p>
                                    <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">{tc.input}</pre>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-blue-700 mb-1">Output {i + 1}</p>
                                    <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">{tc.output}</pre>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hidden Test Cases */}
                        {cp.hiddenTestCases && cp.hiddenTestCases.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Hidden Test Cases</p>
                            <div className="space-y-2">
                              {cp.hiddenTestCases.map((tc, i) => (
                                <div key={i} className="grid grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Input {i + 1}</p>
                                    <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">{tc.input}</pre>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Output {i + 1}</p>
                                    <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">{tc.output}</pre>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Approve Topic Modal */}
      {approveModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeApproveModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <FaCheck size={14} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Approve Question</h2>
                  <p className="text-green-100 text-xs">Assign topic before adding to Library</p>
                </div>
              </div>
              <button onClick={closeApproveModal} className="text-white/70 hover:text-white"><FaTimes size={18} /></button>
            </div>
            {/* Body */}
            <div className="p-6">
              {/* Question preview */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-5">
                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Question</p>
                <p className="text-sm text-gray-800 font-medium line-clamp-3">{approveModal?.question.question}</p>
              </div>
              {/* Topic (read-only) */}
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topic</label>
              <div className="w-full px-4 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl mb-4">
                {normalizeTopic(approveModal?.question.topic) || 'Technical'}
              </div>
              {/* Subtopic */}
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subtopic <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={approveSubtopic}
                onChange={e => setApproveSubtopic(e.target.value)}
                placeholder="e.g. Number Theory, Data Structures..."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-colors"
              />
            </div>
            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={closeApproveModal} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button
                onClick={handleApproveConfirm}
                disabled={approving}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm disabled:opacity-60"
              >
                {approving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaCheck size={12} />}
                Approve & Add to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeRejectModal} />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <FaTimes size={14} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Reject Question</h2>
                  <p className="text-red-200 text-xs">The contributor will see your reason</p>
                </div>
              </div>
              <button onClick={closeRejectModal} className="text-white/60 hover:text-white transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Question preview */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-5">
                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Question</p>
                <p className="text-sm text-gray-800 font-medium line-clamp-3">{rejectModal?.questionText}</p>
              </div>

              {/* Reason textarea */}
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rejection Reason <span className="text-gray-400 font-normal">(optional but recommended)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={4}
                placeholder="e.g. The question is ambiguous, the correct answer is incorrect, the options are incomplete..."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1.5">{rejectReason.length} characters</p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={closeRejectModal}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejecting}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {rejecting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FaTimes size={12} />
                )}
                Reject Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingContributorQuestions;
