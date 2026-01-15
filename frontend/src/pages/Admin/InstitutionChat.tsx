import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { makeHeaders } from '../../lib/makeHeaders';

const InstitutionChatAdmin: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [institutionName, setInstitutionName] = useState('Institution');
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const ref = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const load = async (p = 1) => {
    if (!id) return;
    try {
      const res = await fetch(`${BACKEND}/admin/institution/${id}/admin-chat?page=${p}&limit=20`, { 
        headers: makeHeaders('admin_token') 
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        // Update institution name from the response
        if (body.institution && body.institution.name) {
          setInstitutionName(body.institution.name);
        }
        
        if (p === 1) {
          setMsgs(body.data || []);
          setTimeout(scrollToBottom, 100);
        } else {
          setMsgs((cur) => [...(body.data || []), ...cur]);
        }
        setPage(body.page || p);
        setHasMore(((body.page || p) * (body.limit || 20)) < (body.total || 0));
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  useEffect(() => {
    load(1); 
    let idt: any = null; 
    if (page === 1) idt = setInterval(() => load(1), 5000); 
    return () => { 
      if (idt) clearInterval(idt); 
    }; 
  }, [id, page]);

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !token || !id) return;
    const trimmed = text.trim();
    if (trimmed.length > 2000) { 
      alert('Message too long (max 2000 characters)'); 
      return; 
    }
    try {
      const res = await fetch(`${BACKEND}/admin/institution/${id}/admin-chat`, { 
        method: 'POST', 
        headers: makeHeaders('admin_token', 'application/json'), 
        body: JSON.stringify({ message: trimmed }) 
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) { 
        setText(''); 
        load(1); 
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  const loadMore = async () => {
    const next = page + 1;
    await load(next);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-red-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 border-b border-red-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/institutions')}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{institutionName}</h1>
                  <p className="text-sm text-red-100">Private conversation with institution</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-white bg-opacity-90 text-red-700 rounded-full text-xs font-medium flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col px-6 py-4">
          <div ref={ref} className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {hasMore && (
              <div className="text-center py-3">
                <button 
                  onClick={loadMore} 
                  className="text-sm px-4 py-2 bg-white border border-red-300 rounded-full hover:bg-red-50 transition-colors shadow-sm font-medium text-red-700"
                >
                  Load Earlier Messages
                </button>
              </div>
            )}
            
            {msgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No messages yet</h3>
                <p className="text-gray-500 text-sm max-w-sm">Start the conversation by sending a message below</p>
              </div>
            ) : (
              <>
                {msgs.map((m: any) => (
                  <div 
                    key={m._id} 
                    className={`flex ${m.fromRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-lg ${m.fromRole === 'admin' ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-end gap-2">
                        {m.fromRole !== 'admin' && (
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                          m.fromRole === 'admin' 
                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' 
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}>
                          <div className="break-words whitespace-pre-wrap">{m.message}</div>
                          <div className={`text-xs mt-1.5 ${
                            m.fromRole === 'admin' ? 'text-red-100' : 'text-gray-500'
                          }`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {m.fromRole === 'admin' && (
                          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <form onSubmit={send} className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
                  placeholder="Type your message... (Press Enter to send)"
                  rows={2}
                  maxLength={2000}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {text.length}/2000
                </div>
              </div>
              <button 
                type="submit" 
                disabled={!text.trim()}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
              >
                <span>Send</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionChatAdmin;
