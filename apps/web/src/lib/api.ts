export const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api`;

/**
 * Basic fetch wrapper pre-configured with the backend API baseURL.
 * For now it's a simple wrapper for native `fetch`.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Basic default headers, e.g. for JSON requests
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // We could handle common status codes here (e.g. 401, 403, 500)
    const errorBody = await response.text().catch(() => '');
    throw new Error(`API Error ${response.status}: ${errorBody || response.statusText}`);
  }

  return response;
}
