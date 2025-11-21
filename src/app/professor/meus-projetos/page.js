'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProjetoCard from '@/components/ProjetoCard';
import api, { fetchWithApiKey, fetchWithAuth } from '@/lib/api';
import Toast from '@/components/Toast';

export default function MeusProjetosPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (user?.tipo !== 'professor') {
      router.push('/home');
      return;
    }
    loadMeusProjetos();
  }, [token, user]);

  const loadMeusProjetos = async () => {
    setLoading(true);
    try {
      // Se professor é orientador (projeto.orientador === user.id)
      const res = await fetchWithApiKey(`${api.getApiUrl()}/selectprojetos`);
      const meus = (res.data || []).filter(p => p.orientador === user?.id);
      setProjetos(meus);
    } catch (err) {
      console.error('Erro ao carregar projetos:', err);
      setToast({ type: 'error', message: 'Erro ao carregar projetos' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProjeto = async (projetoId) => {
    if (!window.confirm('Tem certeza que deseja deletar este projeto?')) return;

    try {
      await fetchWithAuth(`${api.getApiUrl()}/deleteprojeto/${projetoId}`, {
        method: 'DELETE'
      });

      setToast({ type: 'success', message: 'Projeto deletado com sucesso' });
      loadMeusProjetos();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao deletar projeto' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📚 Meus Projetos</h1>
          <button
            onClick={() => router.push('/professor/criar-projeto')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
          >
            ➕ Novo Projeto
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-2xl">⏳ Carregando...</div>
          </div>
        ) : projetos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Você ainda não criou nenhum projeto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projetos.map(projeto => (
              <ProjetoCard
                key={projeto.id}
                projeto={projeto}
                onDelete={() => handleDeleteProjeto(projeto.id)}
                showActions={true}
              />
            ))}
          </div>
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
