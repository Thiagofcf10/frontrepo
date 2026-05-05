"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';

export default function Navbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile top compact bar with toggle */}
      <div className="md:hidden bg-white border-b p-2 flex items-center justify-between">
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-2xl">☰</button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b p-2">
          <nav className="flex flex-col gap-2 items-center">
            <Link href="/home" className="w-full max-w-[260px] mx-auto flex items-center justify-center gap-3 px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-200 text-sm text-gray-900">🏠 Home</Link>
            <Link href="/projetos" className="w-full max-w-[260px] mx-auto flex items-center justify-center gap-3 px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-200 text-sm text-gray-900">📋 Projetos</Link>
            <Link href="/perfil" className="w-full max-w-[260px] mx-auto flex items-center justify-center gap-3 px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-200 text-sm text-gray-900">👤 Perfil</Link>
            {user?.tipo === 'professor' && (
              <>
                <Link href="/professor/gerenciar-projetos" className="w-full max-w-[260px] mx-auto flex items-center justify-center gap-3 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm text-white">🗂️ Gerenciar</Link>
                <Link href="/professor/criar-projeto" className="w-full max-w-[260px] mx-auto flex items-center justify-center gap-3 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm text-white">➕ Criar</Link>
                <Link href="/professor/custos" className="w-full max-w-[260px] mx-auto flex items-center justify-center gap-3 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm text-white">💰 Custos</Link>
                <Link href="/professor/cadastro-codigo-matricula" className="w-full max-w-[260px] mx-auto flex items-center justify-center gap-3 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm text-white">🏷️ Cadastro Matrícula</Link>
                <Link href="/professor/arquivos" className="w-full max-w-[260px] mx-auto flex items-center justify-center gap-3 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm text-white">📁 Arquivos</Link>
                <Link href="/professor/gerenciar-destaques" className="w-full max-w-[260px] mx-auto flex items-center justify-center gap-3 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm text-white">✨ Destaques</Link>
                <Link href="/professor/registros" className="w-full max-w-[260px] mx-auto flex items-center justify-center gap-3 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm text-white">📝 Registros</Link>
                <Link href="/professor/gerenciar-dados" className="w-full max-w-[260px] mx-auto flex items-center justify-center gap-3 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm text-white">🧾 Gerenciar Dados</Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Desktop vertical compact sidebar */}
      <aside className="hidden md:flex flex-col bg-white border-r p-3 w-16 md:w-48 flex-shrink-0 items-center">
        <nav className="flex flex-col items-center gap-2">
          <Link href="/home" className="w-full max-w-[220px] mx-auto flex items-center justify-center gap-3 px-3 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-sm text-gray-900">🏠 <span className="hidden md:inline">Home</span></Link>
          <Link href="/projetos" className="w-full max-w-[220px] mx-auto flex items-center justify-center gap-3 px-3 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-sm text-gray-900">📋 <span className="hidden md:inline">Projetos</span></Link>
          <Link href="/perfil" className="w-full max-w-[220px] mx-auto flex items-center justify-center gap-3 px-3 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-sm text-gray-900">👤 <span className="hidden md:inline">Perfil</span></Link>

          {user?.tipo === 'professor' && (
            <>
              <Link href="/professor/gerenciar-projetos" className="w-full max-w-[220px] mx-auto flex items-center justify-center gap-3 px-3 py-2 rounded-md bg-indigo-500 hover:bg-indigo-700 text-sm text-white">🗂️ <span className="hidden md:inline">Gerenciar</span></Link>
              <Link href="/professor/criar-projeto" className="w-full max-w-[220px] mx-auto flex items-center justify-center gap-3 px-3 py-2 rounded-md bg-indigo-500 hover:bg-indigo-700 text-sm text-white">➕ <span className="hidden md:inline">Criar</span></Link>
              <Link href="/professor/custos" className="w-full max-w-[220px] mx-auto flex items-center justify-center gap-3 px-3 py-2 rounded-md bg-indigo-500 hover:bg-indigo-700 text-sm text-white">💰 <span className="hidden md:inline">Custos</span></Link>
              <Link href="/professor/cadastro-codigo-matricula" className="w-full max-w-[220px] mx-auto flex items-center justify-center gap-3 px-3 py-2 rounded-md bg-indigo-500 hover:bg-indigo-700 text-sm text-white">🏷️ <span className="hidden md:inline">Cadastro Matrícula</span></Link>
              <Link href="/professor/arquivos" className="w-full max-w-[220px] mx-auto flex items-center justify-center gap-3 px-3 py-2 rounded-md bg-indigo-500 hover:bg-indigo-700 text-sm text-white">📁 <span className="hidden md:inline">Arquivos</span></Link>
              <Link href="/professor/gerenciar-destaques" className="w-full max-w-[220px] mx-auto flex items-center justify-center gap-3 px-3 py-2 rounded-md bg-indigo-500 hover:bg-indigo-700 text-sm text-white">✨ <span className="hidden md:inline">Destaques</span></Link>
              <Link href="/professor/registros" className="w-full max-w-[220px] mx-auto flex items-center justify-center gap-3 px-3 py-2 rounded-md bg-indigo-500 hover:bg-indigo-700 text-sm text-white">📝 <span className="hidden md:inline">Registros</span></Link>
              <Link href="/professor/gerenciar-dados" className="w-full max-w-[220px] mx-auto flex items-center justify-center gap-3 px-3 py-2 rounded-md bg-indigo-500 hover:bg-indigo-700 text-sm text-white">🧾 <span className="hidden md:inline">Gerenciar Dados</span></Link>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
