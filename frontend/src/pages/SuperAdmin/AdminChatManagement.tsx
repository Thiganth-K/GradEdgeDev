import React, { useState, useEffect } from 'react';
import { makeHeaders } from '../../lib/makeHeaders';
import { apiFetch } from '../../lib/api';
import Sidebar from '../../components/SuperAdmin/sidebar';

interface Message {
  senderRole: 'admin' | 'superadmin';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Chat {
  _id: string;
  superadminName?: string;
  superadminId?: string;
  adminId?: string;
  adminName?: string;
  messages: Message[];
  lastMessageAt: string;
  unreadCountAdmin: number;
  unreadCountSuperadmin: number;
}

const AdminChatManagement: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const pollIntervalRef = React.useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      const response = await apiFetch('/superadmin/admin-chats', {
        headers: makeHeaders('superadmin_token')
      });
      if (!response.ok) throw new Error('Failed to fetch chats');
      const data = await response.json();
      if (data.success) setChats(data.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchChatDetails = async (adminId: string) => {
    try {
      const response = await apiFetch(`/superadmin/admin-chats/${adminId}`, {
        headers: makeHeaders('superadmin_token')
      });
      if (!response.ok) throw new Error('Failed to fetch chat details');
      const data = await response.json();
      if (data.success) {
        setSelectedChat(data.data);
        if (data.data.unreadCountSuperadmin > 0) {
          await apiFetch(`/superadmin/admin-chats/${adminId}/read`, {
            method: 'POST',
            headers: makeHeaders('superadmin_token')
          });
          fetchChats();
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !message.trim()) return;
    setLoading(true);
    setError('');
    try {
      const target = selectedChat.adminId;
      const response = await apiFetch(`/superadmin/admin-chats/${target}/message`, {
        method: 'POST',
        headers: makeHeaders('superadmin_token', 'application/json'),
        body: JSON.stringify({ message })
      });
      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      if (data.success) {
        setSelectedChat(data.data);
        setMessage('');
        scrollToBottom();
        fetchChats();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    if (chat.adminId) fetchChatDetails(chat.adminId);
  };

  useEffect(() => {
    fetchChats();
    pollIntervalRef.current = setInterval(() => {
      fetchChats();
      if (selectedChat && selectedChat.adminId) fetchChatDetails(selectedChat.adminId);
    }, 5001);

    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [selectedChat]);

  useEffect(() => { scrollToBottom(); }, [selectedChat?.messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalUnread = chats.reduce((sum, chat) => sum + chat.unreadCountSuperadmin, 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#0d0d0d] rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Admin Chats (SuperAdmin)</h1>
                  <p className="text-gray-600">Communicate with admins.</p>
                </div>
              </div>
              {totalUnread > 0 && (<div className="bg-yellow-500 text-white px-5 py-2.5 rounded-2xl font-semibold shadow-lg">{totalUnread} unread</div>)}
            </div>
          </div>

          {error && (<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 font-medium shadow-lg">{error}</div>)}

          <div className="grid grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            <div className="col-span-1 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
              <div className="bg-[#0d0d0d] text-white px-5 py-4 font-bold text-lg">Admins ({chats.length})</div>
              <div className="overflow-y-auto flex-1">
                {chats.length === 0 && (<div className="p-8 text-center text-gray-500">No chats yet</div>)}
                {chats.map((chat) => (
                  <div key={chat._id} onClick={() => handleSelectChat(chat)} className={'p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ' + (selectedChat?._id === chat._id ? 'bg-gray-50 border-l-4 border-l-[#0d0d0d]' : '')}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-900">{chat.adminName || 'admin'}</span>
                      {chat.unreadCountSuperadmin > 0 && (<span className="bg-yellow-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">{chat.unreadCountSuperadmin}</span>)}
                    </div>
                    {chat.messages.length > 0 && (<><p className="text-sm text-gray-600 truncate">{chat.messages[chat.messages.length - 1].message}</p><p className="text-xs text-gray-400 mt-1">{formatDate(chat.lastMessageAt)}</p></>)}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
              {!selectedChat ? (<div className="flex-1 flex items-center justify-center text-gray-500">Select an admin to view chat</div>) : (
                <>
                  <div className="bg-[#0d0d0d] text-white px-6 py-4"><h2 className="text-xl font-bold">{selectedChat.adminName}</h2><p className="text-sm text-gray-300">Admin Chat</p></div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">{selectedChat.messages.length === 0 && <div className="text-center text-gray-500 mt-12">No messages yet</div>}
                    {selectedChat.messages.map((msg, index) => (<div key={index} className={'flex ' + (msg.senderRole === 'superadmin' ? 'justify-end' : 'justify-start')}><div className={'max-w-[70%] rounded-2xl px-4 py-3 shadow-md ' + (msg.senderRole === 'superadmin' ? 'bg-[#0d0d0d] text-white' : 'bg-white border border-gray-200 text-gray-900')}><div className={'text-xs mb-1 font-medium ' + (msg.senderRole === 'superadmin' ? 'text-gray-300' : 'text-gray-500')}>{msg.senderName} • {formatTime(msg.timestamp)}</div><div className="whitespace-pre-wrap break-words">{msg.message}</div></div></div>))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="border-t border-gray-200 p-5 bg-white"><div className="flex space-x-3"><input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()} placeholder="Type your message..." className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d0d0d] focus:border-transparent" disabled={loading} /><button onClick={sendMessage} disabled={loading || !message.trim()} className="px-6 py-3 bg-[#0d0d0d] text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold shadow-md transition-colors">{loading ? 'Sending...' : 'Send'}</button></div></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatManagement;
