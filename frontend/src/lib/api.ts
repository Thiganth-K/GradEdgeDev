// API configuration and base URL management
// Behavior:
// - If `VITE_API_URL` is set, use it for deployments.
// - If not set and building for production, default to same-origin ('') so the backend
//   served alongside the frontend will handle API requests.
// - Otherwise (development), default to `http://localhost:5001`.
// Additionally: when running the production build locally (localhost), prefer same-origin
// so a locally-served backend receives requests even if VITE_API_URL was set to a remote host.
let API_BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5001');

// If we have a runtime `window` and we're on localhost, prefer local backend for production
// builds so local production testing hits `http://localhost:5001` instead of a remote API.
try {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname === '127.0.0.1') {
      // If running locally prefer the backend at port 5001 (backend configured to use 5001)
      // Use the same port for both PROD local testing and development to match backend
      API_BASE_URL = 'http://localhost:5001';
    }
  }
} catch (e) {
  // ignore any runtime inspection errors
}

// Smart fetch wrapper with automatic fallback to localhost:5001
let workingBaseUrl: string | null = null; // Cache the working URL to avoid repeated retries

/**
 * Smart fetch that automatically falls back to localhost:5001 if the primary API fails with 404.
 * Use this instead of native fetch for API calls to enable automatic fallback.
 */
export const apiFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
  // If we already know which base URL works, use it directly
  if (workingBaseUrl !== null) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const finalUrl = url.startsWith('http') ? url : `${workingBaseUrl}${url}`;
    return fetch(finalUrl, init);
  }

  // Try the configured base URL first
  const primaryUrl = typeof input === 'string' ? 
    (input.startsWith('http') ? input : `${API_BASE_URL}${input}`) : input;
  
  try {
    const response = await fetch(primaryUrl, init);
    
    // If successful (not 404), cache this base URL and return
    if (!response.ok && response.status === 404) {
      throw new Error('404 - trying fallback');
    }
    
    workingBaseUrl = API_BASE_URL;
    return response;
  } catch (error) {
    // If primary fails with 404 or network error, try localhost:5001 as fallback
    const fallbackBase = 'http://localhost:5001';
    
    // Only fallback if we're not already using localhost
    if (API_BASE_URL === fallbackBase) {
      throw error; // Already using fallback, rethrow the error
    }
    
    console.warn(`[apiFetch] Primary API failed, falling back to ${fallbackBase}`, error);
    
    const fallbackUrl = typeof input === 'string' ? 
      (input.startsWith('http') ? input.replace(API_BASE_URL, fallbackBase) : `${fallbackBase}${input}`) : 
      new Request(input, { ...init });
    
    const fallbackResponse = await fetch(fallbackUrl, init);
    
    // If fallback succeeds, cache it
    if (fallbackResponse.ok || fallbackResponse.status !== 404) {
      workingBaseUrl = fallbackBase;
      console.info(`[apiFetch] Fallback to ${fallbackBase} succeeded, caching for future requests`);
    }
    
    return fallbackResponse;
  }
};

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
    // No `/api` prefix here so endpoints match backends mounted at root (e.g. `/contributor`)
    // If your backend is mounted under `/api`, set `VITE_API_URL` to include that prefix
    login: '/contributor/login',
    dashboard: '/contributor/dashboard',
    requests: '/contributor/requests',
    requestById: (id: string) => `/contributor/requests/${id}`,
    contributions: '/contributor/contributions',
    chat: '/contributor/chat',
    chatMessage: '/contributor/chat/message',
    chatRead: '/contributor/chat/read',
    chatUnread: '/contributor/chat/unread',
    libraryMyQuestions: '/contributor/library/my-questions',
    libraryStructure: '/contributor/library/structure',
  },
  
  // Admin endpoints
  admin: {
    login: '/admin/login',
    contributorRequests: '/admin/contributor-requests',
    contributorRequestById: (id: string) => `/admin/contributor-requests/${id}`,
    contributorRequestStatus: (id: string) => `/admin/contributor-requests/${id}/status`,
    contributorChats: '/admin/contributor-chats',
    contributorChatById: (contributorId: string) => `/admin/contributor-chats/${contributorId}`,
    contributorChatMessage: (contributorId: string) => `/admin/contributor-chats/${contributorId}/message`,
    contributorChatRead: (contributorId: string) => `/admin/contributor-chats/${contributorId}/read`,
    contributorChatsUnreadCount: '/admin/contributor-chats/unread/count',
    libraryQuestionsByContributor: '/admin/library/questions-by-contributor',
    libraryQuestionsByContributorId: (contributorId: string) => `/admin/library/contributor/${contributorId}`,
    addQuestionToLibrary: (questionId: string) => `/admin/library/questions/${questionId}`,
    removeQuestionFromLibrary: (questionId: string) => `/admin/library/questions/${questionId}`,
    libraryStructure: '/admin/library/structure',
  },
};

export default API_BASE_URL;
