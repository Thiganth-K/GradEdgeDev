import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const InstitutionChatAdmin: React.FC = () => {
  const { id } = useParams();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const ref = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    if (!token || !id) return;
    try {
      const res = await fetch(`${BACKEND}/admin/institution/${id}/chat`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) setMsgs(body.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); const idt = setInterval(load, 5000); return () => clearInterval(idt); }, [id]);
  useEffect(()=>{ if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs]);

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !token || !id) return;
    try {
      const res = await fetch(`${BACKEND}/admin/institution/${id}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: text }) });
      const body = await res.json().catch(()=>({}));
      if (res.ok && body.success) { setText(''); load(); }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-3">Chat with Institution</h2>
      <div className="bg-white rounded shadow p-4 max-w-3xl">
        <div ref={ref} className="max-h-80 overflow-y-auto space-y-2 mb-3">
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
