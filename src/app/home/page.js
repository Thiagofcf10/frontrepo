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
    if (!token) {
      router.push('/login');
      return;
    }
    loadProjetos();
  }, [token, user]);

  const loadProjetos = async () => {
    setLoading(true);
    try {
      // Carregar todos os projetos
      const todosRes = await fetchWithApiKey(`${api.getApiUrl()}/selectprojetos`);
      setProjetos(todosRes.data || []);

      // Carregar projetos do usuário (se houver)
      if (user?.id) {
        try {
          const meusRes = await fetchWithApiKey(`${api.getApiUrl()}/selectusuario_projetos/${user.id}`);
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Bem-vindo, {user?.nome_usuario || 'Usuário'}!</h1>
          <p className="text-gray-600 mt-2">
            Perfil: <span className="font-semibold capitalize">{user?.tipo === 'professor' ? '🧑‍🏫 Professor' : '👨‍🎓 Aluno'}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('todos')}
            className={`pb-2 px-4 font-semibold ${
              activeTab === 'todos'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Todos os Projetos
          </button>
          <button
            onClick={() => setActiveTab('meus')}
            className={`pb-2 px-4 font-semibold ${
              activeTab === 'meus'
                ? 'text-blue-600 border-b-2 border-blue-600'
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
          <div>
            <h2 className="text-2xl font-bold mb-4">Todos os Projetos</h2>
            {projetos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Nenhum projeto disponível ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projetos.map(projeto => (
                  <ProjetoCard key={projeto.id} projeto={projeto} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4">Meus Projetos</h2>
            {meusProjetos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Você não está vinculado a nenhum projeto ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meusProjetos.map(up => {
                  const projeto = projetos.find(p => p.id === up.projeto_id);
                  return projeto ? (
                    <ProjetoCard
                      key={up.id}
                      projeto={projeto}
                    />
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
