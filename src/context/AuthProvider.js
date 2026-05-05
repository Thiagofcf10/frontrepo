'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api, { setToken as apiSetToken, removeToken as apiRemoveToken, fetchWithAuth } from '../lib/api';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  setToken: (t) => {}
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
            // enrich with role (professor/aluno) if possible
            const basic = res.user || res;
            const enriched = await enrichUserRole(basic);
            setUser(enriched);
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
      try { apiSetToken(data.token); } catch (e) {}
      setTokenState(data.token);
      // Attempt to verify token and populate user state from server
      try {
        const verifyRes = await fetchWithAuth('/verify');
        const basic = verifyRes.user || verifyRes;
        const enriched = await enrichUserRole(basic);
        setUser(enriched || data.user || null);
      } catch (e) {
        // Fallback: use returned user payload if available
        const enriched = await enrichUserRole(data.user || null);
        setUser(enriched || data.user || null);
      }
    }

    return data;
  }

  // Helper to set token from other flows (OTP, guest token, etc.)
  async function setToken(t) {
    try {
      if (!t) {
        apiRemoveToken();
        setTokenState(null);
        setUser(null);
        return;
      }
      apiSetToken(t);
      setTokenState(t);
      try {
        const verifyRes = await fetchWithAuth('/verify');
        const basic = verifyRes.user || verifyRes;
        const enriched = await enrichUserRole(basic);
        setUser(enriched);
        return;
      } catch (err) {
        apiRemoveToken();
        setTokenState(null);
        setUser(null);
      }
    } catch (err) {
      // ignore
    }
  }

  async function refreshUser() {
    try {
      const res = await fetchWithAuth('/verify');
      const basic = res.user || res;
      const enriched = await enrichUserRole(basic);
      setUser(enriched);
      return enriched;
    } catch (e) {
      return null;
    }
  }

  // Determine if user is linked to a professor or aluno record
  async function enrichUserRole(basicUser) {
    if (!basicUser || !basicUser.id) return basicUser;
    // If backend already provided a role in the token/user payload, respect it
    if (basicUser.role) {
      if (basicUser.role === 'professor') return { ...basicUser, tipo: 'professor' };
      if (basicUser.role === 'aluno') return { ...basicUser, tipo: 'aluno' };
      if (basicUser.role === 'guest') return { ...basicUser, tipo: 'guest' };
      return { ...basicUser, tipo: null };
    }
    try {
      // fetch public lists and check for match on usuario_id
      const apiUrl = api.getApiUrl();
      const apiKey = api.getApiKey();
      // Try professores first
      const profResp = await fetch(`${apiUrl}/selectprofessor?api_key=${apiKey}`);
      const profJson = await profResp.json().catch(() => null);
      if (profJson && Array.isArray(profJson.data)) {
        const found = profJson.data.find(p => Number(p.usuario_id) === Number(basicUser.id));
        if (found) return { ...basicUser, tipo: 'professor', professorId: found.id };
      }

      // Try alunos
      const alunoResp = await fetch(`${apiUrl}/selectaluno?api_key=${apiKey}`);
      const alunoJson = await alunoResp.json().catch(() => null);
      if (alunoJson && Array.isArray(alunoJson.data)) {
        const foundA = alunoJson.data.find(a => Number(a.usuario_id) === Number(basicUser.id));
        if (foundA) return { ...basicUser, tipo: 'aluno', alunoId: foundA.id };
      }

      return { ...basicUser, tipo: null };
    } catch (e) {
      return { ...basicUser, tipo: null };
    }
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
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
