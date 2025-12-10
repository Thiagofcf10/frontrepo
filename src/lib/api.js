// Default to '/api' so frontend routes to nginx proxy when NEXT_PUBLIC_API_URL
// is not provided at build time. Set NEXT_PUBLIC_API_URL to an absolute URL
// to point to an external API host if needed.
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ifpa_public_api_key_2025';

export function getApiUrl() {
  return API_URL;
}

export function getApiKey() {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('apiKey') || API_KEY : API_KEY;
  } catch (e) {
    return API_KEY;
  }
}

export function setApiKey(key) {
  try {
    if (typeof window !== 'undefined') localStorage.setItem('apiKey', key);
  } catch (e) {
    // ignore
  }
}

export function getToken() {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  } catch (e) {
    return null;
  }
}

export function setToken(token) {
  try {
    if (typeof window !== 'undefined') localStorage.setItem('token', token);
  } catch (e) {
    // ignore
  }
}

export function removeToken() {
  try {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  } catch (e) {}
}

export async function fetchWithAuth(path, options = {}) {
  // Build request URL correctly:
  const buildUrl = (p) => {
    if (typeof p !== 'string') return p;
    if (p.startsWith('http')) return p;
    // If we have an API base (e.g. '/api'), prefer to prefix it unless the path already includes it
    if (API_URL) {
      const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      if (p.startsWith(base)) return p; // already contains base
      if (p.startsWith('/')) return `${base}${p}`;
      return `${base}/${p}`;
    }
    // No API_URL: ensure path is absolute
    return p.startsWith('/') ? p : `/${p}`;
  };

  const url = buildUrl(path);
  const token = getToken();

  // Prepare headers. If body is FormData, do not set Content-Type so browser sets the correct boundary.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  // If response is JSON, parse
  if (contentType.includes('application/json')) {
    try {
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) throw json;
      return json;
    } catch (err) {
      if (!res.ok) throw { message: text || 'Erro na requisição' };
      return text;
    }
  }

  // Not JSON: return raw text or throw on error
  if (!res.ok) throw { message: text || 'Erro na requisição', status: res.status };
  return text;
}

/**
 * Fetch data using API Key (for public GET endpoints)
 * Automatically includes the x-api-key header
 */
export async function fetchWithApiKey(path, options = {}) {
  const buildUrl = (p) => {
    if (typeof p !== 'string') return p;
    if (p.startsWith('http')) return p;
    if (API_URL) {
      const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      if (p.startsWith(base)) return p;
      if (p.startsWith('/')) return `${base}${p}`;
      return `${base}/${p}`;
    }
    return p.startsWith('/') ? p : `/${p}`;
  };

  const url = buildUrl(path);
  const apiKey = getApiKey();

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    ...(options.headers || {})
  };

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  // If response is JSON, parse
  if (contentType.includes('application/json')) {
    try {
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) throw json;
      return json;
    } catch (err) {
      if (!res.ok) throw { message: text || 'Erro na requisição' };
      return text;
    }
  }

  // Not JSON: return raw text or throw on error
  if (!res.ok) throw { message: text || 'Erro na requisição', status: res.status };
  return text;
}

export async function postJson(path, body = {}) {
  return fetchWithAuth(path, { method: 'POST', body: JSON.stringify(body) });
}

export default { getApiUrl, getApiKey, setApiKey, getToken, setToken, removeToken, fetchWithAuth, fetchWithApiKey, postJson };
