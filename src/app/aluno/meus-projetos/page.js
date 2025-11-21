'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProjetoCard from '@/components/ProjetoCard';
import api, { fetchWithApiKey } from '@/lib/api';

export default function MeusProjetosAlunoPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [meusProjetos, setMeusProjetos] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (user?.tipo !== 'aluno') {
      router.push('/home');
      return;
    }
    loadDados();
  }, [token, user]);

  const loadDados = async () => {
    setLoading(true);
    try {
      // Fetch projects for this aluno (backend will map by student's matricula)
      if (user?.id) {
        try {
          const res = await fetchWithApiKey(`${api.getApiUrl()}/selectmeusprojetos/${user.id}?tipo=aluno`);
          // endpoint returns project rows already
          setProjetos(res.data || []);
        } catch (err) {
          console.error('Erro ao carregar meus projetos:', err);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">📚 Meus Projetos</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-2xl">⏳ Carregando...</div>
          </div>
        ) : projetos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Você não está vinculado a nenhum projeto ainda.</p>
            <p className="mt-2 text-sm">Procure por projetos disponíveis na página inicial.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projetos.map(p => (
              <ProjetoCard key={p.id} projeto={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
