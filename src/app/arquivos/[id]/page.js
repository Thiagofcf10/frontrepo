"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { fetchWithApiKey } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function ArquivoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [arquivo, setArquivo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const resp = await fetchWithApiKey(`${api.getApiUrl()}/selectarquivos/${id}`);
        // resp.data is the arquivo object according to our new endpoint
        setArquivo(resp.data || null);
      } catch (e) {
        console.error('Erro ao carregar arquivo:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const downloadLink = (caminho) => {
    if (!caminho) return '#';
    const parts = caminho.split('/');
    const filename = parts[parts.length - 1];
    return `${api.getApiUrl()}/downloadarquivo/${encodeURIComponent(filename)}`;
  };

  const isImage = (name) => /\.(png|jpe?g|gif|bmp|webp)$/i.test(name || '');
  const isPDF = (name) => /\.pdf$/i.test(name || '');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      <main className="flex-1 p-8">
        {loading ? (
          <div>⏳ Carregando...</div>
        ) : !arquivo ? (
          <div>Arquivo não encontrado. <button onClick={() => router.back()} className="text-blue-600">Voltar</button></div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded shadow p-6">
              <h1 className="text-2xl font-bold">{arquivo.nome_arquivo || 'Arquivo'}</h1>
              <p className="text-sm text-gray-600 mt-2"><strong>Resumo:</strong> {arquivo.resumo}</p>
              <p className="text-sm text-gray-600 mt-1"><strong>Objetivo:</strong> {arquivo.objetivo}</p>
              <p className="text-sm text-gray-600 mt-1"><strong>Justificativa:</strong> {arquivo.justificativa}</p>
              <p className="text-sm text-gray-600 mt-1"><strong>Sumário:</strong> {arquivo.sumario}</p>
              <p className="text-sm text-gray-600 mt-1"><strong>Introdução:</strong> {arquivo.introducao}</p>
              <p className="text-sm text-gray-600 mt-1"><strong>Bibliografia:</strong> {arquivo.bibliografia}</p>
              <p className="text-sm text-gray-600 mt-1"><strong>Enviado por (usuario_id):</strong> {arquivo.usuario_id || arquivo.usuario}</p>
              <p className="text-sm text-gray-600 mt-1"><strong>Projeto ID:</strong> {arquivo.projeto_id || arquivo.id_meuprojeto}</p>

              <div className="mt-4 flex gap-3">
                <a
                  className="inline-flex items-center gap-2 bg-sky-700 hover:bg-sky-800 text-white px-3 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400"
                  href={downloadLink(arquivo.caminho_arquivo)}
                  target="_blank"
                  rel="noreferrer"
                  title={`Baixar ${arquivo.nome_arquivo}`}
                  aria-label={`Baixar ${arquivo.nome_arquivo}`}
                >
                  ⤓ Baixar
                </a>

                <button
                  onClick={() => router.push(`/projetos/${arquivo.projeto_id || arquivo.id_meuprojeto}`)}
                  className="bg-gray-200 px-3 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-300"
                  title="Ver projeto"
                  aria-label="Ver projeto"
                >
                  🔙 Ver Projeto
                </button>
              </div>
            </div>

            <div className="bg-white rounded shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Visualização</h2>
              {isImage(arquivo.caminho_arquivo) ? (
                <img src={downloadLink(arquivo.caminho_arquivo)} alt={arquivo.nome_arquivo} className="max-w-full h-auto" />
              ) : isPDF(arquivo.caminho_arquivo) ? (
                <iframe title="PDF preview" src={downloadLink(arquivo.caminho_arquivo)} className="w-full h-[700px]" />
              ) : (
                <p className="text-gray-600">Pré-visualização não disponível para este tipo de arquivo. Use o botão de download.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
