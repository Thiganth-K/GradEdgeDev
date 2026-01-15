import React, { useState, useEffect } from 'react';
import { makeHeaders } from '../../lib/makeHeaders';
import { apiFetch } from '../../lib/api';
import Sidebar from '../../components/Admin/Sidebar';

interface Message {
  senderRole: 'admin' | 'contributor';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Chat {
  _id: string;
  contributorId: string;
  contributorName: string;
  adminId?: string;
  adminName?: string;
  messages: Message[];
  lastMessageAt: string;
  unreadCountAdmin: number;
  unreadCountContributor: number;
}

const ContributorChatManagement: React.FC = () => {
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
      const response = await apiFetch('/admin/contributor-chats', {
        headers: makeHeaders('admin_token')
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      if (data.success) {
        setChats(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchChatDetails = async (contributorId: string) => {
    try {
      const response = await apiFetch(`/admin/contributor-chats/${contributorId}`, {
        headers: makeHeaders('admin_token')
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat details');
      }

      const data = await response.json();
      if (data.success) {
        setSelectedChat(data.data);

        // Mark messages as read
        if (data.data.unreadCountAdmin > 0) {
          await apiFetch(`/admin/contributor-chats/${contributorId}/read`, {
            method: 'POST',
            headers: makeHeaders('admin_token')
          });
          fetchChats(); // Refresh chat list
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
      const response = await apiFetch(`/admin/contributor-chats/${selectedChat.contributorId}/message`, {
        method: 'POST',
        headers: makeHeaders('admin_token', 'application/json'),
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (data.success) {
        setSelectedChat(data.data);
        setMessage('');
        scrollToBottom();
        fetchChats(); // Refresh chat list
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    fetchChatDetails(chat.contributorId);
  };

  useEffect(() => {
    fetchChats();

    // Poll for new messages every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchChats();
      if (selectedChat) {
        fetchChatDetails(selectedChat.contributorId);
      }
    }, 5001);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalUnread = chats.reduce((sum, chat) => sum + chat.unreadCountAdmin, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Contributor Chat</h1>
                <p className="text-red-100 mt-1">Communicate with contributors</p>
              </div>
              {totalUnread > 0 && (
                <div className="bg-white text-red-600 px-4 py-2 rounded-full font-semibold shadow-lg">
                  {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-800 px-4 py-3 rounded-lg mb-6 font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Chat List */}
          <div className="col-span-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-red-600 text-white px-4 py-3 font-semibold">
              Contributors ({chats.length})
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {chats.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No chats yet
                </div>
              )}

              {chats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => handleSelectChat(chat)}
                  className={
                    'p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ' +
                    (selectedChat?._id === chat._id ? 'bg-red-50 border-l-4 border-l-red-600' : '')
                  }
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-black">{chat.contributorName}</span>
                    {chat.unreadCountAdmin > 0 && (
                      <span className="bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {chat.unreadCountAdmin}
                      </span>
                    )}
                  </div>
                  {chat.messages.length > 0 && (
                    <>
                      <p className="text-sm text-gray-600 truncate">
                        {chat.messages[chat.messages.length - 1].message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(chat.lastMessageAt)}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="col-span-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden flex flex-col">
            {!selectedChat ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg">Select a contributor to view chat</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-red-600 text-white px-6 py-4">
                  <h2 className="text-xl font-bold">{selectedChat.contributorName}</h2>
                  <p className="text-sm text-red-100">Contributor Chat</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 max-h-[calc(100vh-400px)]">
                  {selectedChat.messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                      <p>No messages yet</p>
                      <p className="text-sm mt-2">Start a conversation with this contributor</p>
                    </div>
                  )}

                  {selectedChat.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={'flex ' + (msg.senderRole === 'admin' ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={
                          'max-w-[70%] rounded-lg px-4 py-2 ' +
                          (msg.senderRole === 'admin'
                            ? 'bg-red-600 text-white'
                            : 'bg-white border-2 border-gray-300 text-black')
                        }
                        >
                        <div className="text-xs opacity-75 mb-1">
                          {msg.senderName} • {formatTime(msg.timestamp)}
                        </div>
                        <div className="whitespace-pre-wrap break-words">{msg.message}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t-2 border-gray-300 p-4 bg-white">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                      disabled={loading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading || !message.trim()}
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                    >
                      {loading ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributorChatManagement;
