'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import Navbar from '@/components/Navbar';
import ProjetoCard from '@/components/ProjetoCard';
import api, { fetchWithApiKey } from '@/lib/api';

export default function HomePage() {
  const { user, token } = useAuth();
  const [projetos, setProjetos] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [meusProjetos, setMeusProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todos'); // 'todos' ou 'meus'
  const [hasEditableRelatorios, setHasEditableRelatorios] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Always load public projects for the home page so visitors can see published projects.
    // If a user is logged in, also attempt to load their projects.
    // Load featured projects (selected by professors)
    loadProjetos();
  }, [token, user]);

  const loadProjetos = async () => {
    setLoading(true);
    try {
      // Carregar todos os projetos publicados para a aba 'Todos os Projetos'
      const allRes = await fetchWithApiKey(`${api.getApiUrl()}/selectprojetos`);
      setAllProjects(allRes.data || []);

      // Carregar apenas projetos marcados como destaque (selecionados pelos professores)
      const destaquesRes = await fetchWithApiKey(`${api.getApiUrl()}/selectprojetos_destaques`);
      setProjetos(destaquesRes.data || []);

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
      // If user is aluno, check if there are registros with editable relatorio allowed for this student
      if (user?.id && user?.tipo === 'aluno') {
        try {
          const regsRes = await fetchWithApiKey(`${api.getApiUrl()}/selectregistros`);
          const alunosRes = await fetchWithApiKey(`${api.getApiUrl()}/selectaluno`);
          const registros = regsRes.data || [];
          const alunos = alunosRes.data || [];
          const aluno = alunos.find(a => Number(a.usuario_id) === Number(user.id));
          if (aluno) {
            const now = new Date();
            const canEditAny = registros.some(r => {
              const allowedTokens = r.relatorio_edit_allowed ? String(r.relatorio_edit_allowed).split(',').map(t => String(t).trim()).filter(Boolean) : [];
              if (allowedTokens.length === 0) return false;
              const idStr = String(aluno.id);
              const matStr = String(aluno.matricula_aluno);
              if (!(allowedTokens.includes(idStr) || allowedTokens.includes(matStr))) return false;
              const deadline = r.relatorio_edit_deadline ? new Date(r.relatorio_edit_deadline) : null;
              if (deadline && now > deadline) return false;
              return true;
            });
            setHasEditableRelatorios(!!canEditAny);
          }
        } catch (e) {
          console.error('Erro ao verificar relatórios editáveis:', e);
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
       
          {/* quick menu removed as requested */}
        
          {/* Hero / header */}
          <section className="bg-gradient-to-b from-sky-500 to-sky-50 rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bem-vindo, {user?.nome_usuario || 'Usuário'}!</h1>
                <p className="text-gray-600 mt-1">{user?.tipo === 'professor' ? 'Professor' : 'Aluno'}</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Quick actions for alunos: link to Meus Projetos / editar relatórios quando permitido */}
                {user?.tipo === 'aluno' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push('/aluno/meus-projetos')} className="bg-sky-600 text-white px-3 py-2 rounded text-sm">📚 Meus Projetos</button>
                    {hasEditableRelatorios && (
                      <button onClick={() => router.push('/aluno/meus-projetos')} className="bg-green-600 text-white px-3 py-2 rounded text-sm">✏️ Editar Relatórios</button>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* search removed to match professor layout */}
            {/* Quick admin menu removed for professor pages as requested */}
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
          ) : (
            <>
              {/* Destaques sempre visíveis no topo da home */}
              <section className="mb-6">
                <h2 className="text-2xl text-gray-700 font-bold mb-4">Projetos em Destaque</h2>
                {projetos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>Nenhum projeto em destaque.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projetos.map(projeto => (
                      <ProjetoCard key={projeto.id} projeto={projeto} />
                    ))}
                  </div>
                )}
              </section>

              {/* Aba de conteúdo: Todos ou Meus */}
              {activeTab === 'todos' ? (
                <section>
                  <h2 className="text-2xl text-gray-700 font-bold mb-4">Todos os Projetos</h2>
                  {allProjects.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>Nenhum projeto disponível ainda.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allProjects.map(p => (
                        <ProjetoCard key={p.id} projeto={p} />
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                <section>
                  <h2 className="text-2xl text-gray-700 font-bold mb-4">Meus Projetos</h2>
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
            </>
          )}

      


      </main>
    </div>
  );
}
