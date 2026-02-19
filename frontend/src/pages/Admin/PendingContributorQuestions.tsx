import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { makeHeaders } from '../../lib/makeHeaders';
import toast from 'react-hot-toast';

interface Option { text?: string; imageUrls?: string[] }
interface Solution { explanation?: string; imageUrls?: string[] }

interface PendingQuestion {
  _id: string;
  subTopic?: string;
  difficulty?: string;
  question: string;
  questionImageUrls?: string[];
  options?: Option[];
  solutions?: Solution[];
  contributorId?: string;
  contributor?: any;
  createdAt?: string;
}

const PendingContributorQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<PendingQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/contributor-questions/pending', { headers: makeHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch pending questions');
      setQuestions(data.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load pending questions');
    } finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    try {
      toast.loading('Approving...');
      const res = await apiFetch(`/admin/contributor-questions/${id}/approve`, { method: 'PUT', headers: makeHeaders() });
      const data = await res.json();
      toast.dismiss();
      if (!res.ok) throw new Error(data.message || 'Approve failed');
      toast.success('Question approved and added to Library.');
      setQuestions(qs => qs.filter(q => q._id !== id));
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Approve failed');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const reason = window.prompt('Optional rejection reason (visible to contributor):') || undefined;
      toast.loading('Rejecting...');
      const res = await apiFetch(`/admin/contributor-questions/${id}/reject`, { method: 'PUT', headers: makeHeaders('','application/json'), body: JSON.stringify({ reason }) });
      const data = await res.json();
      toast.dismiss();
      if (!res.ok) throw new Error(data.message || 'Reject failed');
      toast.error('Question rejected.');
      setQuestions(qs => qs.filter(q => q._id !== id));
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Reject failed');
    }
  };

  if (loading) return <div className="p-6">Loading pending questions...</div>;

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Pending Contributor Questions</h1>
        {questions.length === 0 ? (
          <div className="bg-white p-6 rounded shadow">No pending questions</div>
        ) : (
          <div className="space-y-4">
            {questions.map(q => (
              <div key={q._id} className="bg-white p-4 rounded shadow border">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-gray-500">{q.subTopic} • {q.difficulty}</div>
                    <h3 className="text-lg font-semibold mt-1">{q.question}</h3>
                    {q.questionImageUrls && q.questionImageUrls.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {q.questionImageUrls.map((u, i) => (
                          <img key={i} src={u} alt={`question-${i}`} className="w-24 h-24 object-cover rounded" />
                        ))}
                      </div>
                    )}
                    <div className="mt-3">
                      {q.options && q.options.map((opt, idx) => (
                        <div key={idx} className="mb-2">
                          <div className="font-semibold">{String.fromCharCode(65 + idx)}.</div>
                          <div>{opt.text}</div>
                          {opt.imageUrls && opt.imageUrls.length > 0 && (
                            <div className="mt-1 flex gap-2">
                              {opt.imageUrls.map((u, i) => <img key={i} src={u} className="w-20 h-20 object-cover rounded" />)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {q.solutions && q.solutions.length > 0 && (
                      <div className="mt-3">
                        <div className="font-semibold">Solutions</div>
                        {q.solutions.map((s, si) => (
                          <div key={si} className="mt-2">
                            <div>{s.explanation}</div>
                            {s.imageUrls && s.imageUrls.length > 0 && (
                              <div className="mt-1 flex gap-2">
                                {s.imageUrls.map((u, i) => <img key={i} src={u} className="w-24 h-24 object-cover rounded" />)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleApprove(q._id)} className="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
                    <button onClick={() => handleReject(q._id)} className="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-3">Submitted: {q.createdAt ? new Date(q.createdAt).toLocaleString() : '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingContributorQuestions;
