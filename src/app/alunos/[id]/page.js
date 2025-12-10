"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { fetchWithApiKey } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function AlunoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [aluno, setAluno] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const resp = await fetchWithApiKey(`${api.getApiUrl()}/selectaluno/${id}`);
        setAluno(resp.data || null);
      } catch (e) {
        console.error('Erro ao carregar aluno:', e);
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
        ) : !aluno ? (
          <div>Aluno não encontrado. <button onClick={() => router.back()} className="text-blue-600">Voltar</button></div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded shadow p-6">
              <h1 className="text-2xl font-bold">{aluno.nome_aluno || 'Aluno'}</h1>
              <p className="text-sm text-gray-600 mt-2"><strong>Matrícula:</strong> {aluno.matricula_aluno}</p>
              <p className="text-sm text-gray-600 mt-1"><strong>Telefone:</strong> {aluno.telefone}</p>
              <p className="text-sm text-gray-600 mt-1"><strong>Usuário ID:</strong> {aluno.usuario_id}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
