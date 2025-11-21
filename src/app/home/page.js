'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProjetoCard from '@/components/ProjetoCard';
import api, { fetchWithApiKey } from '@/lib/api';

export default function HomePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [projetos, setProjetos] = useState([]);
  const [meusProjetos, setMeusProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todos'); // 'todos' ou 'meus'

  useEffect(() => {
    // Always load public projects for the home page so visitors can see published projects.
    // If a user is logged in, also attempt to load their projects.
    loadProjetos();
  }, [token, user]);

  const loadProjetos = async () => {
    setLoading(true);
    try {
      // Carregar apenas projetos publicados para a exibição pública da Home
      // Use o endpoint público que retorna somente projetos publicados
      const todosRes = await fetchWithApiKey(`${api.getApiUrl()}/selectprojetos_publicos`);
      setProjetos(todosRes.data || []);

      // Carregar projetos do usuário (se houver) - use role-aware endpoint
      if (user?.id) {
        try {
          const tipo = user?.tipo === 'professor' ? 'professor' : 'aluno';
          const meusRes = await fetchWithApiKey(`${api.getApiUrl()}/selectmeusprojetos/${user.id}?tipo=${tipo}`);
          setMeusProjetos(meusRes.data || []);
        } catch (err) {
          console.error('Erro ao carregar meus projetos:', err);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar projetos:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero / header */}
          <section className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bem-vindo, {user?.nome_usuario || 'Usuário'}!</h1>
                <p className="text-gray-600 mt-1">{user?.tipo === 'professor' ? 'Professor' : 'Aluno'}</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Perfil link moved to sidebar; removed button here per request */}
              </div>
            </div>
            <div className="mt-4">
              <input
                type="search"
                placeholder="Pesquisar projetos por nome..."
                value={''}
                onChange={() => {}}
                className="w-full border border-gray-300 rounded px-3 py-2"
                aria-label="Pesquisar projetos"
              />
            </div>
          </section>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('todos')}
              className={`pb-2 px-4 font-semibold ${
                activeTab === 'todos'
                  ? 'text-sky-700 border-b-2 border-sky-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 Todos os Projetos
            </button>
            <button
              onClick={() => setActiveTab('meus')}
              className={`pb-2 px-4 font-semibold ${
                activeTab === 'meus'
                  ? 'text-sky-700 border-b-2 border-sky-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📚 Meus Projetos
            </button>
          </div>

          {/* Conteúdo */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-2xl">⏳ Carregando...</div>
            </div>
          ) : activeTab === 'todos' ? (
            <section>
              <h2 className="text-2xl font-bold mb-4">Todos os Projetos</h2>
              {projetos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Nenhum projeto disponível ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projetos.map(projeto => (
                    <ProjetoCard key={projeto.id} projeto={projeto} />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section>
              <h2 className="text-2xl font-bold mb-4">Meus Projetos</h2>
              {meusProjetos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Você não está vinculado a nenhum projeto ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {meusProjetos.map(p => (
                    <ProjetoCard key={p.id} projeto={p} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
