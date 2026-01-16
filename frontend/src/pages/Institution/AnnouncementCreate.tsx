import React, { useEffect, useState } from 'react';
import InstitutionSidebar from '../../components/Institution/Sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const AnnouncementForm: React.FC<{ onSent?: () => void; compact?: boolean }> = ({ onSent, compact }) => {
  const [message, setMessage] = useState('');
  const [faculties, setFaculties] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedFac, setSelectedFac] = useState<string[]>([]);
  const [selectedStu, setSelectedStu] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string[]>([]);
  const [sendAllFac, setSendAllFac] = useState(false);
  const [sendAllStu, setSendAllStu] = useState(false);
  const [sendAllBatch, setSendAllBatch] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [loadingLists, setLoadingLists] = useState(false);
  const [sending, setSending] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') || '' : '';

  const makeHeaders = (contentType = false) => {
    const h: Record<string, string> = {};
    if (contentType) h['Content-Type'] = 'application/json';
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  useEffect(() => {
    const load = async () => {
      setLoadingLists(true);
      try {
        const [fRes, sRes, bRes] = await Promise.all([
          fetch(`${BACKEND}/institution/faculties`, { headers: makeHeaders() }),
          fetch(`${BACKEND}/institution/students`, { headers: makeHeaders() }),
          fetch(`${BACKEND}/institution/batches`, { headers: makeHeaders() }),
        ]);
        const fBody = await fRes.json().catch(() => ({}));
        const sBody = await sRes.json().catch(() => ({}));
        const bBody = await bRes.json().catch(() => ({}));
        if (fRes.ok) setFaculties(fBody.data || []);
        if (sRes.ok) setStudents(sBody.data || []);
        if (bRes.ok) setBatches(bBody.data || []);
      } catch (err) {
        // ignore – lists may be empty
      } finally {
        setLoadingLists(false);
      }
    };
    load();
  }, []);

  const toggleSelect = (id: string, list: string) => {
    if (list === 'fac') setSelectedFac(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (list === 'stu') setSelectedStu(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (list === 'batch') setSelectedBatch(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setStatus(null);
    if (!message.trim()) { setStatus({ type: 'error', text: 'Message cannot be empty' }); return; }
    if (!token) { setStatus({ type: 'error', text: 'Authentication required' }); return; }
    setSending(true);
    try {
      const res = await fetch(`${BACKEND}/institution/announcements`, {
        method: 'POST',
        headers: makeHeaders(true),
        body: JSON.stringify({
          message,
          targetFacultyIds: selectedFac,
          targetStudentIds: selectedStu,
          targetBatchIds: selectedBatch,
          sendToAllFaculty: sendAllFac,
          sendToAllStudents: sendAllStu,
          sendToAllBatches: sendAllBatch,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setStatus({ type: 'error', text: body.message || 'Failed to create announcement' }); return; }
      setStatus({ type: 'success', text: 'Announcement created and sent' });
      setMessage(''); setSelectedFac([]); setSelectedStu([]); setSelectedBatch([]);
      if (onSent) onSent();
    } catch (err: any) { setStatus({ type: 'error', text: err.message || 'Network error' }); }
    finally { setSending(false); }
  };

  // Compact mode shows just the textarea + send button for modal usage
  if (compact) {
    return (
      <div className="p-4">
        {status && (
          <div className={`mb-3 p-2 rounded text-sm ${status.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>{status.text}</div>
        )}
        <form onSubmit={submit}>
          <textarea value={message} onChange={(e)=>setMessage(e.target.value)} rows={4} placeholder="Write your announcement..." className="w-full p-2 border rounded" />
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={() => { setMessage(''); setStatus(null); }} className="px-3 py-1 border rounded">Reset</button>
            <button type="submit" disabled={sending} className={`px-3 py-1 rounded ${sending ? 'bg-gray-400 text-white' : 'bg-red-600 text-white'}`}>{sending ? 'Sending…' : 'Send'}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Create Announcement</h1>
            <p className="text-sm text-gray-500">Compose an announcement and choose recipients. Use preview before sending.</p>
          </div>
          <div className="text-right">
            <a href="/institution/announcements" className="text-sm text-red-600 font-medium">View All</a>
          </div>
        </div>

        {status && (
          <div className={`mb-4 p-3 rounded ${status.type === 'error' ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-green-50 text-green-800 border border-green-100'}`}>
            {status.text}
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Write your announcement here..."
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <div className="text-xs text-gray-400 mt-1">Tip: Keep it short and actionable.</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <section className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Faculty</h3>
                <label className="text-xs flex items-center gap-2 text-gray-600"><input type="checkbox" checked={sendAllFac} onChange={(e)=>setSendAllFac(e.target.checked)} /> <span>All</span></label>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {loadingLists ? <div className="text-sm text-gray-500">Loading…</div> : (
                  faculties.length === 0 ? <div className="text-sm text-gray-500">No faculties</div> : faculties.map(f => (
                    <label key={f._id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
                      <div className="truncate">{f.username} <span className="text-xs text-gray-400">{f.role}</span></div>
                      {!sendAllFac && <input type="checkbox" checked={selectedFac.includes(f._id)} onChange={() => toggleSelect(f._id, 'fac')} />}
                    </label>
                  ))
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">Selected: {sendAllFac ? 'All' : selectedFac.length}</div>
            </section>

            <section className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Students</h3>
                <label className="text-xs flex items-center gap-2 text-gray-600"><input type="checkbox" checked={sendAllStu} onChange={(e)=>setSendAllStu(e.target.checked)} /> <span>All</span></label>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {loadingLists ? <div className="text-sm text-gray-500">Loading…</div> : (
                  students.length === 0 ? <div className="text-sm text-gray-500">No students</div> : students.map(s => (
                    <label key={s._id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
                      <div className="truncate">{s.username} {s.name ? `(${s.name})` : ''}</div>
                      {!sendAllStu && <input type="checkbox" checked={selectedStu.includes(s._id)} onChange={() => toggleSelect(s._id, 'stu')} />}
                    </label>
                  ))
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">Selected: {sendAllStu ? 'All' : selectedStu.length}</div>
            </section>

            <section className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Batches</h3>
                <label className="text-xs flex items-center gap-2 text-gray-600"><input type="checkbox" checked={sendAllBatch} onChange={(e)=>setSendAllBatch(e.target.checked)} /> <span>All</span></label>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {loadingLists ? <div className="text-sm text-gray-500">Loading…</div> : (
                  batches.length === 0 ? <div className="text-sm text-gray-500">No batches</div> : batches.map(b => (
                    <label key={b._id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
                      <div className="truncate">{b.name}</div>
                      {!sendAllBatch && <input type="checkbox" checked={selectedBatch.includes(b._id)} onChange={() => toggleSelect(b._id, 'batch')} />}
                    </label>
                  ))
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">Selected: {sendAllBatch ? 'All' : selectedBatch.length}</div>
            </section>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => { setMessage(''); setSelectedFac([]); setSelectedStu([]); setSelectedBatch([]); setSendAllFac(false); setSendAllStu(false); setSendAllBatch(false); setStatus(null); }} className="px-4 py-2 border rounded text-sm">Reset</button>
            <button type="submit" disabled={sending} className={`px-4 py-2 rounded text-sm font-medium ${sending ? 'bg-gray-400 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}>
              {sending ? 'Sending…' : 'Send Announcement'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

const AnnouncementCreate: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstitutionSidebar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white shadow rounded-lg p-6">
            <AnnouncementForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnnouncementCreate;
