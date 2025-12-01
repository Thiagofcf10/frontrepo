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
    <div className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 border-b-2 border-pink-400 p-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-100 rounded-full transition-all duration-200 transform hover:scale-105 shadow-md"
        >
          ← Voltar
        </button>
        <button
          onClick={goHome}
          className="px-4 py-2 bg-white text-pink-600 hover:bg-pink-100 rounded-full transition-all duration-200 transform hover:scale-105 shadow-md"
        >
          🏠 Principal
        </button>
      </div>
      <div className="text-sm font-medium text-white">
        {user ? (
          <span>Conectado como <strong className="text-yellow-300">{user.nome_usuario}</strong></span>
        ) : (
          <span className="text-red-200">Não autenticado</span>
        )}
      </div>
    </div>
  );
}
