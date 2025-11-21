'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api, { setToken as apiSetToken, removeToken as apiRemoveToken, fetchWithAuth } from '../lib/api';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {}
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Mark as hydrated and load token from localStorage
    setIsHydrated(true);
    try {
      const t = localStorage.getItem('token');
      if (t) {
        setTokenState(t);
        // verify token on load
        (async () => {
          try {
            const res = await fetchWithAuth('/verify');
            setUser(res.user || res);
          } catch (err) {
            // invalid token
            setTokenState(null);
            setUser(null);
            apiRemoveToken();
          }
        })();
      }
    } catch (e) {
      // noop
    }
  }, []);

  async function login(email, password) {
    const url = `${api.getApiUrl()}/login`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) throw data;

    if (data.token) {
      apiSetToken(data.token);
      setTokenState(data.token);
      setUser(data.user || null);
    }
    return data;
  }

  function logout() {
    apiRemoveToken();
    setTokenState(null);
    setUser(null);
    router.push('/login');
  }

  // Don't render children until hydrated
  if (!isHydrated) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
