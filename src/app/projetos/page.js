'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProjetoCard from '@/components/ProjetoCard';
import api, { fetchWithApiKey } from '@/lib/api';

export default function ProjetosPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    loadProjetos();
  }, [token]);

  const loadProjetos = async () => {
    setLoading(true);
    try {
      const res = await fetchWithApiKey(`${api.getApiUrl()}/selectprojetos`);
      setProjetos(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar projetos:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-200 flex">
      <Navbar />

      <main className="flex-1 p-8">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-violet-500 animate-pulse">
          📋 Projetos
        </h1>

        {loading ? (
          <div className="text-center py-16">
            <div className="text-3xl text-blue-600">⏳ Carregando...</div>
          </div>
        ) : projetos.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-xl text-yellow-700 font-semibold">Nenhum projeto disponível.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projetos.map(projeto => (
              <ProjetoCard key={projeto.id} projeto={projeto} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}