'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProjetoCard from '@/components/ProjetoCard';
import api, { fetchWithApiKey } from '@/lib/api';

export default function LandingPage() {
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
  try {
  const apiKey = api.getApiKey();
  const resp = await fetchWithApiKey(`${api.getApiUrl()}/selectprojetos_publicos?api_key=${apiKey}`);
  setProjetos(resp && resp.data ? resp.data : []);
      } catch (err) {
        console.error('Erro ao carregar projetos públicos:', err);
        setProjetos([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-600 rounded flex items-center justify-center text-white text-2xl font-bold">IF</div>
            <div>
              <h1 className="text-xl font-bold">Repositório IFPA</h1>
              <p className="text-sm text-gray-500">Projetos acadêmicos do IFPA</p>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 border border-sky-600 text-sky-600 rounded hover:bg-sky-50">Entrar</Link>
            <Link href="/register" className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700">Registrar</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Bem-vindo ao Repositório IFPA</h2>
            <p className="text-gray-700 mb-4">Aqui você encontra projetos publicados pelos nossos docentes e discentes. Explore, baixe arquivos e confira os custos associados aos projetos.</p>
            <div className="flex gap-3">
              <Link href="/projetos" className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700">Ver Projetos</Link>
              <Link href="/register" className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">Criar Conta</Link>
            </div>
          </div>
          <div className="bg-white rounded shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Projetos publicados</h3>
            {loading ? (
              <div className="text-center py-8">⏳ Carregando projetos públicos...</div>
            ) : projetos.length === 0 ? (
              <div className="text-gray-500">Nenhum projeto publicado ainda.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {projetos.slice(0,6).map(p => (
                  <ProjetoCard key={p.id} projeto={p} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-12">
          <h3 className="text-2xl font-bold mb-4">Como usar</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded shadow p-4">
              <h4 className="font-semibold">Pesquisar</h4>
              <p className="text-sm text-gray-600">Encontre projetos por título, orientador ou palavras-chave.</p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <h4 className="font-semibold">Baixar</h4>
              <p className="text-sm text-gray-600">Faça download dos arquivos associados aos projetos.</p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <h4 className="font-semibold">Contribuir</h4>
              <p className="text-sm text-gray-600">Professores podem publicar novos projetos e gerenciar custos e arquivos.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600">© {new Date().getFullYear()} Repositório IFPA — Todos os direitos reservados</div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/about" className="text-sm text-gray-600 hover:underline">Sobre</Link>
            <Link href="/contact" className="text-sm text-gray-600 hover:underline">Contato</Link>
            <a href="#" className="text-sm text-gray-600 hover:underline">Política de Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
