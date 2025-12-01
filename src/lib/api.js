const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://backend2-xi-puce.vercel.app').replace(/\/+$/, '');
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
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
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
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
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
