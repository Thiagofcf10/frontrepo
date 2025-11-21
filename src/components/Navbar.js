'use client';

import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="bg-blue-600 text-white p-4 shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-2xl"
          >
            ☰
          </button>
          <h1 className="text-xl font-bold">IFPA Projetos</h1>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm">👤 {user.nome_usuario}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium">Entrar</Link>
              <Link href="/register" className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium">Registrar</Link>
            </>
          )}
        </div>
      </nav>

      {/* Sidebar Menu */}
      <div
        className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-gray-800 text-white w-64 transform transition-transform ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:h-auto md:w-64 md:flex md:flex-col md:gap-2 p-4 md:shadow-lg z-50`}
      >
        <div className="flex flex-col gap-2">
          {/* Menu comum para todos */}
          <Link href="/perfil" className="hover:bg-gray-700 p-2 rounded">
            👤 Perfil
          </Link>
          <Link href="/home" className="hover:bg-gray-700 p-2 rounded">
            🏠 Home
          </Link>
          <Link href="/projetos" className="hover:bg-gray-700 p-2 rounded">
            📋 Projetos
          </Link>

          {/* Menu específico para Professores */}
          {user?.tipo === 'professor' && (
            <>
              <hr className="my-2" />
              <h3 className="text-xs uppercase tracking-widest text-gray-400">
                Professor
              </h3>
              {/* Dados acadêmicos - seção separada */}
              <div className="mt-2">
                <h4 className="text-xs uppercase tracking-widest text-gray-400 mt-2">Dados Acadêmicos</h4>
                <Link href="/professor/gerenciar-dados" className="hover:bg-gray-700 p-2 rounded text-sm">
                  🧾 Gerenciar Dados
                </Link>
              </div>
                  <Link href="/professor/gerenciar-projetos" className="hover:bg-gray-700 p-2 rounded text-sm">
                    🗂️ Gerenciar Projetos
                  </Link>
              {/* Admin link visible only to professors (opens backend admin UI) */}
              <Link href="/admin" className="hover:bg-gray-700 p-2 rounded text-sm">
                🛠️ Admin
              </Link>
              <Link href="/professor/criar-projeto" className="hover:bg-gray-700 p-2 rounded text-sm">
                ➕ Novo Projeto
              </Link>
              <Link href="/professor/custos" className="hover:bg-gray-700 p-2 rounded text-sm">
                💰 Custos
              </Link>
              <Link href="/professor/arquivos" className="hover:bg-gray-700 p-2 rounded text-sm">
                📤 Arquivos
              </Link>
              <Link href="/professor/registros" className="hover:bg-gray-700 p-2 rounded text-sm">
                📝 Registros de Reuniões
              </Link>
            </>
          )}

          {/* Menu específico para Alunos */}
          {user?.tipo === 'aluno' && (
            <>
              <hr className="my-2" />
              <h3 className="text-xs uppercase tracking-widest text-gray-400">
                Aluno
              </h3>
              <Link href="/aluno/meus-projetos" className="hover:bg-gray-700 p-2 rounded text-sm">
                📚 Meus Projetos
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Overlay para fechar menu em mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40 top-16"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
