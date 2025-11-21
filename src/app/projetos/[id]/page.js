"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { fetchWithApiKey } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function ProjetoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [projeto, setProjeto] = useState(null);
  const [arquivos, setArquivos] = useState([]);
  const [custos, setCustos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const apiKey = api.getApiKey();
        // fetch single projeto by id
        const projResp = await fetchWithApiKey(`${api.getApiUrl()}/selectprojetos/${id}`);
        const p = projResp && projResp.data ? projResp.data : null;
        setProjeto(p || null);

        const arquivosResp = await fetchWithApiKey(`${api.getApiUrl()}/selectarquivos?projeto_id=${id}`);
        setArquivos(arquivosResp.data || []);

        // load custos for this projeto (backend supports projeto_id query)
        try {
          const custosResp = await fetchWithApiKey(`${api.getApiUrl()}/selectcustos?projeto_id=${id}`);
          const rows = custosResp.data || [];
          setCustos(rows);
        } catch (e) {
          // ignore custos load errors
          setCustos([]);
        }
      } catch (e) {
        console.error('Erro ao carregar projeto:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function downloadLink(caminho) {
    if (!caminho) return '#';
    const parts = caminho.split('/');
    const filename = parts[parts.length - 1];
    return `${api.getApiUrl()}/downloadarquivo/${encodeURIComponent(filename)}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      <main className="flex-1 p-8">
        {loading ? (
          <div>⏳ Carregando...</div>
        ) : !projeto ? (
          <div>Projeto não encontrado. <button onClick={() => router.push('/projetos')} className="text-blue-600">Voltar</button></div>
        ) : (
          <div className="space-y-6">
              <div className="bg-white rounded shadow p-6">
                <h1 className="text-2xl font-bold">{projeto.nome_projeto}</h1>
                <p className="text-sm text-gray-700 mt-2">
                  {arquivos && arquivos.length > 0 && arquivos[0].resumo ? (
                    <span>{arquivos[0].resumo}</span>
                  ) : (
                    <span className="text-gray-600">Resumo não disponível.</span>
                  )}
                </p>
                <p className="text-sm text-gray-600 mt-3"><strong>Orientador ID:</strong> {projeto.orientador}</p>
                <p className="text-sm text-gray-600"><strong>Coorientador:</strong> {projeto.coorientador}</p>
                <p className="text-sm text-gray-600"><strong>Alunos:</strong> {projeto.matricula_alunos}</p>
              </div>

            <div className="bg-white rounded shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Arquivos do projeto</h2>
              {arquivos.length === 0 ? (
                <p className="text-gray-500">Nenhum arquivo encontrado.</p>
              ) : (
                <ul className="space-y-2">
                  {arquivos.map(a => (
                    <li key={a.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{a.nome_arquivo || 'Arquivo'}</div>
                        <div className="text-xs text-gray-600">{a.resumo}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <a className="text-blue-600 hover:underline" href={`/arquivos/${a.id}`}>🔍 Ver</a>
                        <a className="text-blue-600 hover:underline" href={downloadLink(a.caminho_arquivo)} target="_blank" rel="noreferrer">⤓ Baixar</a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Custos do projeto</h2>
              {custos.length === 0 ? (
                <p className="text-gray-500">Nenhum custo registrado para este projeto.</p>
              ) : (
                <div>
                  <ul className="space-y-2">
                    {custos.map(c => {
                      const equipamento = c.equipamento || '';
                      const custos_equipamento = Number(c.custos_equipamento || 0);
                      const insumos = c.insumos || '';
                      const custos_insumos = Number(c.custos_insumos || 0);
                      const total = custos_equipamento + custos_insumos;
                      return (
                        <li key={c.id} className="border rounded p-3">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="font-semibold">{equipamento || insumos || 'Custo'}</div>
                              {equipamento && <div className="text-xs text-gray-600">Equipamento: {equipamento}</div>}
                              {insumos && <div className="text-xs text-gray-600">Insumos: {insumos}</div>}
                            </div>
                            <div className="text-sm font-medium text-gray-800">R$ {total.toFixed(2)}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* show aggregate total */}
                  <div className="mt-4 text-right font-semibold">Total do projeto: R$ {custos.reduce((acc, c) => acc + (Number(c.custos_equipamento || 0) + Number(c.custos_insumos || 0)), 0).toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
