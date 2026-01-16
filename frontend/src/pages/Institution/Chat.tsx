import React, { useEffect, useState, useRef } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const InstitutionChat: React.FC = () => {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;
  const ref = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND}/institution/chat`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) setMsgs(body.data || []);
    } catch (err) { console.error(err); }
  };

<<<<<<< Updated upstream
  useEffect(() => { load(); const id = setInterval(load, 5001); return () => clearInterval(id); }, []);
=======
  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id); }, [chatType]);
  useEffect(() => {
    if (chatType === 'faculty') {
      const loadFaculties = async () => {
        if (!token) return;
        try {
          const r = await fetch(`${BACKEND}/institution/faculties`, { headers: { Authorization: `Bearer ${token}` } });
          const b = await r.json();
          if (r.ok) setFaculties(b.data || []);
        } catch {}
      };
      loadFaculties();
    }
  }, [chatType]);
>>>>>>> Stashed changes

  useEffect(()=>{ if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs]);

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !token) return;
    try {
      const res = await fetch(`${BACKEND}/institution/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: text }) });
      const body = await res.json().catch(()=>({}));
      if (res.ok && body.success) { setText(''); load(); }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-3">Contact Admin</h2>
      <div className="bg-white rounded shadow p-4 max-w-3xl">
        <div ref={ref} className="max-h-80 overflow-y-auto space-y-2 mb-3">
          {msgs.map((m:any) => (
            <div key={m._id} className={`p-2 rounded ${m.fromRole === 'institution' ? 'bg-red-50 self-end' : 'bg-gray-100'}`}>
              <div className="text-xs text-gray-500">{m.fromRole} • {new Date(m.createdAt).toLocaleString()}</div>
              <div className="mt-1">{m.message}</div>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2">
          <input value={text} onChange={(e)=>setText(e.target.value)} className="flex-1 border p-2 rounded" placeholder="Type a message to admin" />
          <button type="submit" className="px-3 py-2 bg-red-600 text-white rounded">Send</button>
        </form>
      </div>
    </div>
  );
};

export default InstitutionChat;
