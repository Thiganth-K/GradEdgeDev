import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';
import { makeHeaders } from '../../lib/makeHeaders';

const InstitutionChatAdmin: React.FC = () => {
  const { id } = useParams();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const ref = useRef<HTMLDivElement | null>(null);

  const load = async (p = 1) => {
    if (!id) return;
    try {
      const res = await fetch(`${BACKEND}/admin/institution/${id}/admin-chat?page=${p}&limit=20`, { headers: makeHeaders('admin_token') });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        if (p === 1) setMsgs(body.data || []);
        else setMsgs((cur) => [...(body.data || []), ...cur]);
        setPage(body.page || p);
        setHasMore(((body.page || p) * (body.limit || 20)) < (body.total || 0));
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(1); let idt: any = null; if (page === 1) idt = setInterval(()=>load(1), 5001); return () => { if (idt) clearInterval(idt); }; }, [id, page]);
  useEffect(()=>{ if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs]);

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !token || !id) return;
    const trimmed = text.trim();
    if (trimmed.length > 2000) { alert('Message too long (max 2000 characters)'); return; }
    try {
      const res = await fetch(`${BACKEND}/admin/institution/${id}/admin-chat`, { method: 'POST', headers: makeHeaders('admin_token', 'application/json'), body: JSON.stringify({ message: trimmed }) });
      const body = await res.json().catch(()=>({}));
      if (res.ok && body.success) { setText(''); load(1); }
    } catch (err) { console.error(err); }
  };

  const loadMore = async () => {
    const next = page + 1;
    await load(next);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-3">Chat with Institution</h2>
      <div className="bg-white rounded shadow p-4 max-w-3xl">
        <div ref={ref} className="max-h-80 overflow-y-auto space-y-2 mb-3">
          {hasMore && (
            <div className="text-center text-sm mb-2">
              <button onClick={loadMore} className="text-sm px-3 py-1 border rounded bg-white">Load earlier messages</button>
            </div>
          )}
          {msgs.map((m:any) => (
            <div key={m._id} className={`p-2 rounded ${m.fromRole === 'admin' ? 'bg-green-50' : 'bg-gray-100'}`}>
              <div className="text-xs text-gray-500">{m.fromRole} • {new Date(m.createdAt).toLocaleString()}</div>
              <div className="mt-1">{m.message}</div>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2">
          <input value={text} onChange={(e)=>setText(e.target.value)} className="flex-1 border p-2 rounded" placeholder="Type a message to institution" />
          <button type="submit" className="px-3 py-2 bg-red-600 text-white rounded">Send</button>
        </form>
      </div>
    </div>
  );
};

export default InstitutionChatAdmin;
