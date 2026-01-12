// API configuration and base URL management
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Get the full API URL by appending the path to the base URL
 * @param path - API endpoint path (e.g., '/api/contributor/requests')
 * @returns Full API URL
 */
export const getApiUrl = (path: string): string => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  // Contributor endpoints
  contributor: {
    login: '/api/contributor/login',
    dashboard: '/api/contributor/dashboard',
    requests: '/api/contributor/requests',
    requestById: (id: string) => `/api/contributor/requests/${id}`,
    contributions: '/api/contributor/contributions',
    chat: '/api/contributor/chat',
    chatMessage: '/api/contributor/chat/message',
    chatRead: '/api/contributor/chat/read',
    chatUnread: '/api/contributor/chat/unread',
  },
  
  // Admin endpoints
  admin: {
    login: '/api/admin/login',
    contributorRequests: '/api/admin/contributor-requests',
    contributorRequestById: (id: string) => `/api/admin/contributor-requests/${id}`,
    contributorRequestStatus: (id: string) => `/api/admin/contributor-requests/${id}/status`,
    contributorChats: '/api/admin/contributor-chats',
    contributorChatById: (contributorId: string) => `/api/admin/contributor-chats/${contributorId}`,
    contributorChatMessage: (contributorId: string) => `/api/admin/contributor-chats/${contributorId}/message`,
    contributorChatRead: (contributorId: string) => `/api/admin/contributor-chats/${contributorId}/read`,
    contributorChatsUnreadCount: '/api/admin/contributor-chats/unread/count',
  },
};

export default API_BASE_URL;
