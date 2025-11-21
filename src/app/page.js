'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    // Redirecionar baseado no token
    if (token) {
      router.push('/admin');
    } else {
      router.push('/login');
    }
  }, [token, router]);

  // Mostrar loader enquanto redireciona
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f2f5',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        <h2>⏳ Carregando...</h2>
        <p style={{ color: '#666' }}>Redirecionando para login...</p>
      </div>
    </div>
  );
}
