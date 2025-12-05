"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { fetchWithApiKey } from '@/lib/api';

export default function ProjetoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [projeto, setProjeto] = useState(null);
  const [arquivos, setArquivos] = useState([]);
  const [custos, setCustos] = useState([]);
  const [orientadorNome, setOrientadorNome] = useState(null);
  const [alunoNomes, setAlunoNomes] = useState([]);
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

        // Fetch orientador name (if it's an id)
        try {
          if (p && p.orientador) {
            const profResp = await fetchWithApiKey(`${api.getApiUrl()}/selectprofessor/${p.orientador}?api_key=${apiKey}`);
            const profData = profResp && profResp.data ? profResp.data : null;
            const nomeProf = profData && (profData.nome_professor || profData.nome) ? (profData.nome_professor || profData.nome) : null;
            setOrientadorNome(nomeProf || null);
          }
        } catch (pf) {
          // ignore
        }

        // Prefer explicit author names if stored, otherwise resolve aluno names from matricula_alunos (comma-separated IDs)
        try {
          if (p && p.nome_autores && typeof p.nome_autores === 'string' && p.nome_autores.trim() !== '') {
            const nomes = p.nome_autores.split(',').map(s => s.trim()).filter(Boolean);
            setAlunoNomes(nomes);
          } else if (p && p.matricula_alunos) {
            const alunoIds = String(p.matricula_alunos).split(',').map(x => x.trim()).filter(Boolean).map(x => parseInt(x));
            if (alunoIds.length > 0) {
              const alunosResp = await fetchWithApiKey(`${api.getApiUrl()}/selectaluno?api_key=${apiKey}`);
              const alunosData = alunosResp && alunosResp.data ? alunosResp.data : [];
              const nomes = alunoIds.map(idNum => {
                const found = alunosData.find(a => Number(a.id) === Number(idNum));
                return found ? found.nome_aluno : `Aluno ${idNum}`;
              });
              setAlunoNomes(nomes);
            }
          }
        } catch (pa) {
          // ignore
        }

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
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto p-8">
        {loading ? (
          <div>⏳ Carregando...</div>
        ) : !projeto ? (
          <div>Projeto não encontrado. <button onClick={() => router.push('/projetos')} className="text-blue-600">Voltar</button></div>
        ) : (
          <div className="space-y-6">
              <div className="bg-white rounded shadow p-6">
                <h1 className="text-2xl text-black font-bold">{projeto.nome_projeto}</h1>
                <p className="text-sm text-gray-700 mt-2">
                  {arquivos && arquivos.length > 0 && arquivos[0].resumo ? (
                    <span>{arquivos[0].resumo}</span>
                  ) : (
                    <span className="text-gray-600">Resumo não disponível.</span>
                  )}
                </p>
                <p className="text-sm text-gray-600 mt-3"><strong>Orientador:</strong> {orientadorNome || projeto.orientador}</p>
                <p className="text-sm text-gray-600"><strong>Coorientador:</strong> {projeto.coorientador}</p>
                <p className="text-sm text-gray-600"><strong>Alunos:</strong> {alunoNomes && alunoNomes.length > 0 ? alunoNomes.join(', ') : (projeto.matricula_alunos || '—')}</p>
              </div>

            <div className="bg-white rounded shadow p-6">
              <h2 className="text-lg text-black font-semibold mb-3">Arquivos do projeto</h2>
              {arquivos.length === 0 ? (
                  <p className="text-gray-500">Nenhum arquivo encontrado.</p>
                ) : (
                  <ul className="space-y-3">
                    {arquivos.map(a => (
                      <li key={a.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded p-3">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{a.nome_arquivo || 'Arquivo'}</div>
                          {a.resumo && <div className="text-xs text-gray-600 mt-1">{a.resumo}</div>}
                          <div className="text-xs text-gray-500 mt-2">Enviado em: {a.created_at ? new Date(a.created_at).toLocaleString('pt-BR') : '—'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <a className="inline-flex items-center gap-2 px-3 py-2 rounded border border-sky-600 text-sky-600 hover:bg-sky-50" href={`/arquivos/${a.id}`}>🔎 Ver</a>
                          <a className="inline-flex items-center gap-2 px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700" href={downloadLink(a.caminho_arquivo)} target="_blank" rel="noreferrer">⤓ Baixar</a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </div>

            <div className="bg-white rounded shadow p-6">
              <h2 className="text-lg text-black  font-semibold mb-3">Custos do projeto</h2>
              {custos.length === 0 ? (
                <p className="text-gray-500">Nenhum custo registrado para este projeto.</p>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left px-4 py-2 text-sm text-gray-600">Item</th>
                          <th className="text-left px-4 py-2 text-sm text-gray-600">Equipamento</th>
                          <th className="text-left px-4 py-2 text-sm text-gray-600">Insumos</th>
                          <th className="text-right px-4 py-2 text-sm text-gray-600">Valor Equip.</th>
                          <th className="text-right px-4 py-2 text-sm text-gray-600">Valor Insumos</th>
                          <th className="text-right px-4 py-2 text-sm text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {custos.map((c, idx) => {
                          const equipamento = c.equipamento || '';
                          const custos_equipamento = Number(c.custos_equipamento || 0);
                          const insumos = c.insumos || '';
                          const custos_insumos = Number(c.custos_insumos || 0);
                          const total = custos_equipamento + custos_insumos;
                          return (
                            <tr key={c.id} className="border-b">
                              <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                              <td className="px-4 py-3 text-sm text-gray-500" >{equipamento || '—'}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{insumos || '—'}</td>
                              <td className="px-4 py-3 text-sm text-gray-500 text-right">R$ {custos_equipamento.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-500 text-right">R$ {custos_insumos.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-500 text-right font-semibold">R$ {total.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">Total de itens: <strong>{custos.length}</strong></div>
                    <div className="text-right text-gray-700 font-semibold">Total do projeto: R$ {custos.reduce((acc, c) => acc + (Number(c.custos_equipamento || 0) + Number(c.custos_insumos || 0)), 0).toFixed(2)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
