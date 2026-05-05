"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { useState } from 'react';

export default function TopNav() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/');
    }
  };

  const goHome = () => router.push('/');

  const goToProfile = () => router.push('/perfil');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="w-full bg-gradient-to-r from-cyan-700 to-cyan-900 border-b-4 border-green-500 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Logo e Título */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-green-500 rounded-lg flex items-center justify-center text-white text-xl md:text-2xl font-bold shadow-md hover:shadow-lg transition-shadow">
            IF
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-white">Repositório IFPA</h1>
            <p className="text-[10px] md:text-xs text-cyan-200">Projetos acadêmicos</p>
          </div>
        </div>

        {/* Navegação Central (esconde em mobile) */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={goBack}
            className="px-3 py-1 bg-white bg-opacity-20 text-black hover:bg-opacity-30 rounded-full transition-all duration-200 transform hover:scale-105 text-sm font-medium"
          >
            ← Voltar
          </button>
          <button
            onClick={goHome}
            className="px-3 py-1 bg-white bg-opacity-20 text-black hover:bg-opacity-30 rounded-full transition-all duration-200 transform hover:scale-105 text-sm font-medium"
          >
            🏠 Principal
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-2xl p-2 bg-white bg-opacity-10 rounded"
            aria-label="Menu"
          >
            ☰
          </button>
        </div>

        {/* Área de Autenticação */}
        <div className="flex items-center gap-4">
          {/* Desktop auth area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-cyan-100">
                  Olá, <strong className="text-green-300">{user.nome_usuario}</strong>
                </span>
                <button onClick={() => router.push('/home')} className="px-3 py-2 bg-white bg-opacity-10 text-black rounded hover:bg-opacity-20 text-sm">Ir ao Painel</button>
                <button
                  onClick={goToProfile}
                  className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors text-lg font-bold shadow-md hover:shadow-lg"
                  title="Meu perfil"
                >
                  👤
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors text-sm font-medium"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 bg-white text-cyan-800 hover:bg-cyan-50 rounded transition-colors font-medium text-sm"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 bg-green-500 text-white hover:bg-green-600 rounded transition-colors font-medium text-sm"
                >
                  Registrar
                </Link>
              </>
            )}
          </div>

          {/* Mobile auth shortcuts: show profile + visible logout when logged */}
          <div className="flex md:hidden items-center gap-2">
            {user ? (
              <>
                <button onClick={() => router.push('/perfil')} className="p-2 bg-white bg-opacity-10 rounded">👤</button>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-red-500 text-white rounded mobile-logout-btn text-sm"
                  title="Sair"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="p-2 bg-white text-cyan-800 rounded">🔐</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-cyan-800 text-white px-4 py-3 border-t border-cyan-600">
          <div className="flex flex-col gap-2">
            <button onClick={goBack} className="text-left">← Voltar</button>
            <button onClick={goHome} className="text-left">🏠 Principal</button>
            <Link href="/perfil" className="text-left">👤 Perfil</Link>
            <Link href="/projetos" className="text-left">📋 Projetos</Link>
          </div>
        </div>
      )}
    </div>
  );
}
