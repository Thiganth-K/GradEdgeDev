export function makeHeaders(tokenKey: string | null = 'admin_token', contentType?: string): Record<string,string> {
  const headers: Record<string,string> = {};
  try {
    const token = (typeof window !== 'undefined' && tokenKey) ? localStorage.getItem(tokenKey) : null;
    if (contentType) headers['Content-Type'] = contentType;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch (e) {
    // ignore in SSR or restricted environments
  }
  return headers;
}

export function makeHeadersFromToken(token: string | null, contentType?: string): Record<string,string> {
  const headers: Record<string,string> = {};
  if (contentType) headers['Content-Type'] = contentType;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
