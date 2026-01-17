import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeHeaders } from '../../lib/makeHeaders';
import { apiFetch } from '../../lib/api';

interface Message {
  _id: string;
  sender: 'contributor' | 'admin';
  text: string;
  timestamp: string;
  read: boolean;
}

interface ChatData {
  _id: string;
  contributorId: string | { _id: string };
  messages: Message[];
  // backend may use unreadCountContributor/unreadCountAdmin
  unreadByContributor: number;
  unreadByAdmin: number;
  lastMessageAt: string;
}

const ContributorChat: React.FC = () => {
  const navigate = useNavigate();
  const [chat, setChat] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChat = async () => {
    try {
      const response = await apiFetch('/contributor/chat', {
        headers: makeHeaders('contributor_token')
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat');
      }

      const data = await response.json();
      if (data.success) {
        const raw = data.data || {};
        // normalize fields coming from backend
        const messagesRaw = Array.isArray(raw.messages) ? raw.messages : [];
        const messages: Message[] = messagesRaw.map((m: any) => ({
          _id: m._id || m.id || String(Math.random()),
          // backend uses senderRole, some places may use sender
          sender: (m.sender as any) || (m.senderRole as any) || 'contributor',
          // backend uses 'message' field for text
          text: (m.text as any) || (m.message as any) || '',
          timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
          read: !!m.read
        }));

        const normalized: ChatData = {
          _id: raw._id || raw.id || '',
          contributorId: raw.contributorId || raw.contributor || '',
          messages,
          unreadByContributor: raw.unreadCountContributor ?? raw.unreadByContributor ?? 0,
          unreadByAdmin: raw.unreadCountAdmin ?? raw.unreadByAdmin ?? 0,
          lastMessageAt: raw.lastMessageAt || raw.updatedAt || new Date().toISOString()
        };

        setChat(normalized);
        if (normalized.unreadByContributor > 0) {
          markAsRead();
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await apiFetch('/contributor/chat/read', {
        method: 'POST',
        headers: makeHeaders('contributor_token')
      });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  useEffect(() => {
    loadChat();
    const interval = setInterval(loadChat, 5001); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    setError('');

    try {
      const response = await apiFetch('/contributor/chat/message', {
        method: 'POST',
        headers: makeHeaders('contributor_token', 'application/json'),
        body: JSON.stringify({ message: message.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      if (data.success) {
        setMessage('');
        loadChat();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black">Admin Chat</h1>
              <p className="text-gray-600 mt-1">
                Communicate with administrators about your contributions
              </p>
            </div>
            <button
              onClick={() => navigate('/contributor/dashboard')}
              className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 font-semibold"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-800 px-4 py-3 rounded-lg mb-6 font-semibold">
            {error}
          </div>
        )}

        {/* Chat Container */}
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!chat || chat.messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-xl font-semibold text-gray-700 mb-2">No messages yet</p>
                  <p className="text-gray-500">Start a conversation with an admin</p>
                </div>
              </div>
            ) : (
              <>
                {chat.messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.sender === 'contributor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        msg.sender === 'contributor'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-black border-2 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold opacity-75">
                          {msg.sender === 'contributor' ? 'You' : 'Admin'}
                        </span>
                        <span className="text-xs opacity-75 ml-2">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm break-words">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t-2 border-gray-300 p-4 bg-gray-50">
            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                placeholder="Type your message..."
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributorChat;
