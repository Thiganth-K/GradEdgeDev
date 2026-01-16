import React, { useState, useEffect, useRef } from 'react';
import { makeHeaders } from '../../lib/makeHeaders';
import { apiFetch } from '../../lib/api';

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
  unreadCountContributor: number;
}

interface ChatInterfaceProps {
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChat = async () => {
    try {
      const response = await apiFetch('/contributor/chat', {
        headers: makeHeaders('contributor_token')
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat');
      }

      const data = await response.json();
      if (data.success) {
        setChat(data.data);
        
        // Mark messages as read
        if (data.data.unreadCountContributor > 0) {
          await apiFetch('/contributor/chat/read', {
            method: 'POST',
            headers: makeHeaders('contributor_token')
          });
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/contributor/chat/message', {
        method: 'POST',
        headers: makeHeaders('contributor_token'),
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (data.success) {
        setChat(data.data);
        setMessage('');
        scrollToBottom();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChat();
    
    // Poll for new messages every 5 seconds
    pollIntervalRef.current = setInterval(fetchChat, 5001);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col">
        <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold">Chat with Admin</h2>
            {chat?.adminName && (
              <p className="text-sm text-red-100">Connected with {chat.adminName}</p>
            )}
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {!chat && (
            <div className="text-center text-gray-500 mt-8">Loading chat...</div>
          )}

          {chat && chat.messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p>No messages yet</p>
              <p className="text-sm mt-2">Start a conversation with the admin</p>
            </div>
          )}

          {chat?.messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.senderRole === 'contributor' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.senderRole === 'contributor'
                    ? 'bg-red-600 text-white'
                    : 'bg-white border-2 border-gray-300 text-black'
                }`}
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

        <div className="border-t-2 border-gray-300 p-4 bg-white rounded-b-lg">
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
      </div>
    </div>
  );
};

export default ChatInterface;
