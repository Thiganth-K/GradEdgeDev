import React, { useEffect, useState, useRef } from 'react';
import InstitutionSidebar from '../../components/Institution/Sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const InstitutionChat: React.FC = () => {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [chatType, setChatType] = useState<'admin' | 'faculty'>('admin');
  const [faculties, setFaculties] = useState<any[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;
  const ref = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    if (!token) return;
    try {
      let url = `${BACKEND}/institution/chat${chatType === 'faculty' ? '?type=faculty' : ''}`;
      if (chatType === 'faculty' && selectedFacultyId) {
        url += `${url.includes('?') ? '&' : '?'}facultyId=${selectedFacultyId}`;
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) setMsgs(body.data || []);
    } catch (err) { console.error(err); }
  };

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

  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id); }, [chatType]);
  useEffect(() => {
    if (chatType === 'faculty') {
      // load faculty list
      if (!token) return;
      fetch(`${BACKEND}/institution/faculties`, { headers: { Authorization: `Bearer ${token}` } })
        .then(async (r) => {
          const b = await r.json().catch(() => ({}));
          if (r.ok) setFaculties(b.data || []);
        }).catch(() => {});
    }
  }, [chatType]);


  useEffect(()=>{ if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs]);

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !token) return;
    try {
      const url = `${BACKEND}/institution/chat${chatType === 'faculty' ? '?type=faculty' : ''}`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: text }) });
      const body = await res.json().catch(()=>({}));
      if (res.ok && body.success) { setText(''); load(); }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstitutionSidebar />
      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Chats</h1>
              <p className="text-sm text-gray-500">Communicate with admin or faculty.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setChatType('faculty')} className={`px-4 py-2 rounded-lg ${chatType==='faculty' ? 'bg-white ring-1 ring-gray-100 shadow' : 'bg-gray-50 border'}`}>Faculty Chat</button>
              <button onClick={() => setChatType('admin')} className={`px-4 py-2 rounded-lg ${chatType==='admin' ? 'bg-red-600 text-white shadow' : 'bg-white border'}`}>Admin Chat</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 ring-1 ring-gray-50">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left: participants / info for faculty chat */}
              {chatType === 'faculty' && (
                <aside className="w-full md:w-64 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="text-sm font-semibold mb-3">Faculty</div>
                  <div className="space-y-2">
                    <button onClick={() => setSelectedFacultyId(null)} className={`w-full text-left px-3 py-2 rounded ${selectedFacultyId===null ? 'bg-white shadow' : 'hover:bg-gray-100'}`}>All Faculties</button>
                    {faculties.map((f:any) => (
                      <button key={f._id} onClick={() => setSelectedFacultyId(f._id)} className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 ${selectedFacultyId===f._id ? 'bg-white shadow' : 'hover:bg-gray-100'}`}>
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">{(f.username||'U').charAt(0).toUpperCase()}</div>
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{f.username}</div>
                          <div className="text-xs text-gray-500">{f.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </aside>
              )}

              {/* Right: messages */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">{chatType === 'faculty' ? (selectedFacultyId ? `Chat – ${faculties.find(f=>f._id===selectedFacultyId)?.username || 'Faculty'}` : 'Faculty Chat') : 'Contact Admin'}</h3>
                  <div className="text-xs text-gray-500">{chatType==='admin' ? 'Admin channel' : 'Direct faculty messages'}</div>
                </div>

                <div ref={ref} className="max-h-80 overflow-y-auto space-y-3 mb-4">
                  {msgs.map((m:any) => (
                    <div key={m._id} className="flex items-start gap-3">
                          {(() => {
                            const displayName = (chatType === 'admin' && m.fromRole !== 'faculty') ? 'Admin' : (m.fromName || m.fromRole || '');
                            return (
                              <>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${m.fromRole==='institution' ? 'bg-red-100 text-red-700 ml-auto' : 'bg-gray-200 text-gray-700'}`}>
                                  { (displayName || '').charAt(0) }
                                </div>
                                <div className={`p-3 rounded-lg max-w-xl ${m.fromRole === 'institution' ? 'bg-red-50 ml-auto text-right' : 'bg-gray-100'}`}>
                                  <div className="text-xs text-gray-500">{displayName} • {new Date(m.createdAt).toLocaleString()}</div>
                                  <div className="mt-1 text-sm text-gray-800">{m.message}</div>
                                </div>
                              </>
                            );
                          })()}
                    </div>
                  ))}
                  {msgs.length === 0 && (
                    <div className="text-sm text-gray-500">No messages yet. Start the conversation.</div>
                  )}
                </div>

                <form onSubmit={send} className="flex gap-3">
                  <input value={text} onChange={(e)=>setText(e.target.value)} className="flex-1 border border-gray-200 px-3 py-2 rounded-lg shadow-sm" placeholder={chatType === 'faculty' ? 'Type a message to selected faculty' : 'Type a message to admin'} />
                  <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg">Send</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstitutionChat;
