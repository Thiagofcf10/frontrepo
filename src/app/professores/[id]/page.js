"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { fetchWithApiKey } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function ProfessorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [prof, setProf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const resp = await fetchWithApiKey(`${api.getApiUrl()}/selectprofessor/${id}`);
        setProf(resp.data || null);
      } catch (e) {
        console.error('Erro ao carregar professor:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      <main className="flex-1 p-8">
        {loading ? (
          <div>⏳ Carregando...</div>
        ) : !prof ? (
          <div>Professor não encontrado. <button onClick={() => router.back()} className="text-blue-600">Voltar</button></div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded shadow p-6">
              <h1 className="text-2xl font-bold">{prof.nome_professor || 'Professor'}</h1>
              <p className="text-sm text-gray-600 mt-2"><strong>Matrícula:</strong> {prof.matricula_professor}</p>
              <p className="text-sm text-gray-600 mt-1"><strong>Telefone:</strong> {prof.telefone}</p>
              <p className="text-sm text-gray-600 mt-1"><strong>Usuário ID:</strong> {prof.usuario_id}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
