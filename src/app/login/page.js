'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');

    try {
      const data = await login(email, password);
      router.push('/home');
    } catch (err) {
      setMsg(err.error || err.message || JSON.stringify(err));
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Login</h1>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420 }}>
        <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Entrar</button>
      </form>
      {msg && <p style={{ color: 'red' }}>{msg}</p>}
      <p>
        Não tem conta? <a href="/register">Registre-se</a>
      </p>
    </main>
  );
}
