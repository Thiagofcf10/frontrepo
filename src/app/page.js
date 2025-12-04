'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import ProjetoCard from '@/components/ProjetoCard';
import api, { fetchWithApiKey } from '@/lib/api';

export default function LandingPage() {
  const { user, token } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-sky-50 to-white">
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="grid md:grid-cols-2 gap-8 items-center mb-16">
          <div>
            <h2 className="text-4xl font-bold mb-4 text-cyan-900">Bem-vindo ao Repositório IFPA</h2>
            <p className="text-gray-700 mb-6 text-lg">Explore projetos publicados pelos nossos docentes e discentes. Baixe arquivos, consulte custos e acompanhe as iniciativas acadêmicas da instituição.</p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/projetos" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md hover:shadow-lg">
                Ver Todos os Projetos
              </Link>
              {!user && (
                <Link href="/register" className="px-6 py-3 border-2 border-cyan-600 text-cyan-600 rounded-lg hover:bg-cyan-50 transition-colors font-semibold">
                  Criar Conta
                </Link>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-green-500">
            <h3 className="text-2xl font-bold mb-4 text-cyan-900">Projetos em Destaque</h3>
            {loading ? (
              <div className="text-center py-8 text-cyan-600">⏳ Carregando projetos...</div>
            ) : projetos.length === 0 ? (
              <div className="text-gray-500 text-center py-8">Nenhum projeto publicado ainda.</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {projetos.slice(0, 5).map(p => (
                  <ProjetoCard key={p.id} projeto={p} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-cyan-900 text-center">Como Funciona</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">🔍</div>
              <h4 className="text-xl font-semibold text-cyan-900 mb-2">Pesquisar Projetos</h4>
              <p className="text-gray-600">Encontre projetos por título, orientador, área ou palavras-chave.</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">⬇️</div>
              <h4 className="text-xl font-semibold text-cyan-900 mb-2">Baixar Recursos</h4>
              <p className="text-gray-600">Acesse arquivos, documentos e relatórios dos projetos publicados.</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-500 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">📚</div>
              <h4 className="text-xl font-semibold text-cyan-900 mb-2">Contribuir</h4>
              <p className="text-gray-600">Professores podem criar, publicar e gerenciar seus projetos.</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        {!user && (
          <section className="bg-gradient-to-r from-cyan-600 to-green-600 rounded-lg shadow-lg p-8 text-white text-center mb-12">
            <h3 className="text-2xl font-bold mb-3">Pronto para começar?</h3>
            <p className="mb-6 text-lg">Faça seu cadastro e tenha acesso completo a todos os recursos do repositório IFPA.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/register" className="px-6 py-3 bg-white text-cyan-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                Registrar Agora
              </Link>
              <Link href="/login" className="px-6 py-3 bg-white bg-opacity-20 border-2 border-white text-white rounded-lg hover:bg-opacity-30 transition-colors font-semibold">
                Já tenho conta
              </Link>
            </div>
          </section>
        )}

        {user && (
          <section className="bg-gradient-to-r from-green-600 to-cyan-600 rounded-lg shadow-lg p-8 text-white text-center mb-12">
            <h3 className="text-2xl font-bold mb-2">Bem-vindo, {user.nome_usuario}! 👋</h3>
            <p className="mb-6 text-lg">Acesse suas ferramentas e gerenciamento de projetos.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/home" className="px-6 py-3 bg-white text-cyan-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                Ir ao Painel
              </Link>
              <Link href="/perfil" className="px-6 py-3 bg-white bg-opacity-20 border-2 border-white text-cyan-600 rounded-lg hover:bg-opacity-30 transition-colors font-semibold">
                Meu Perfil
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Footer removed from here to avoid duplication with global Footer in layout.js */}
    </div>
  );
}
