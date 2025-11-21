'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

export default function TopNav() {
  const router = useRouter();
  const { user, token } = useAuth();

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/');
    }
  };

  const goHome = () => router.push('/');

  return (
    <div className="w-full bg-white border-b border-gray-200 p-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button onClick={goBack} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">← Voltar</button>
        <button onClick={goHome} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">🏠 Principal</button>
      </div>
      <div className="text-sm text-gray-600">
        {user ? (
          <span>Conectado como <strong>{user.nome_usuario}</strong></span>
        ) : (
          <span>Não autenticado</span>
        )}
      </div>
    </div>
  );
}
