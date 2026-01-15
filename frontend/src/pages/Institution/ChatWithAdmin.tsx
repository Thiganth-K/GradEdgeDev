import React, { useEffect, useState, useRef } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ChatWithAdmin: React.FC = () => {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('institution_token') : null;
  const ref = useRef<HTMLDivElement | null>(null);

  const load = async (p = 1) => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND}/institution/admin-chat?page=${p}&limit=20`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        if (p === 1) {
          setMsgs(body.data || []);
        } else {
          setMsgs((cur) => [...(body.data || []), ...cur]);
        }
        setPage(body.page || p);
        setHasMore(((body.page || p) * (body.limit || 20)) < (body.total || 0));
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(1); let id: any = null; if (page === 1) id = setInterval(()=>load(1), 5001); return () => { if (id) clearInterval(id); }; }, [page]);
  useEffect(()=>{ if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs]);

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !token) return;
    try {
      const res = await fetch(`${BACKEND}/institution/admin-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: text }) });
      const body = await res.json().catch(()=>({}));
      if (res.ok && body.success) { setText(''); load(); }
    } catch (err) { console.error(err); }
  };

  const loadMore = async () => {
    const next = page + 1;
    await load(next);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()} 
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Admin Chat</h1>
              <p className="text-red-100 text-sm">Communicate directly with administrators</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Messages Area */}
          <div 
            ref={ref} 
            className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50"
            style={{ scrollBehavior: 'smooth' }}
          >
            {hasMore && (
              <div className="text-center mb-4">
                <button 
                  onClick={loadMore} 
                  className="px-4 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                >
                  Load earlier messages
                </button>
              </div>
            )}
            
            {msgs.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500 text-sm">No messages yet. Start a conversation!</p>
              </div>
            )}

            {msgs.map((m: any) => {
              const isInstitution = m.fromRole === 'institution';
              return (
                <div key={m._id} className={`flex ${isInstitution ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isInstitution ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      isInstitution 
                        ? 'bg-red-600 text-white rounded-br-sm' 
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{m.message}</p>
                    </div>
                    <div className={`mt-1 px-2 flex items-center gap-2 text-xs ${
                      isInstitution ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className="text-gray-400">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isInstitution && (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={send} className="flex gap-3">
              <input 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none" 
                placeholder="Type your message..." 
              />
              <button 
                type="submit" 
                disabled={!text.trim()}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>Send</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Chat Guidelines</p>
            <p className="text-blue-700">This is a direct communication channel with administrators. Messages are monitored and responses are typically provided within 24 hours.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWithAdmin;
