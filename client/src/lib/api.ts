import { clientEnv } from './env';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('medisync_token');
  const base = clientEnv.VITE_API_BASE_URL.replace(/\/$/, '');
  const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      data?.error?.message ||
      (typeof data === 'string' ? data : `Request failed with status ${response.status}`);
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).code = data?.error?.code || data?.code;
    (err as any).details = data?.error?.details || data?.details;
    (err as any).requestId = data?.error?.requestId || data?.requestId || data?.request_id;
    throw err;
  }

  return data as T;
}
