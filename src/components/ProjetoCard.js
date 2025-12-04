'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api, { fetchWithApiKey } from '@/lib/api';

// Simple in-memory cache to avoid repeated network calls for the same professor
const professorNameCache = {};
const alunoNamesCache = {};

export default function ProjetoCard({ projeto, onEdit, onDelete, showActions = false }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [orientadorNome, setOrientadorNome] = useState(null);
  const [alunoNomes, setAlunoNomes] = useState([]);
  const [arquivoResumo, setArquivoResumo] = useState(null);

  const goToDetail = () => {
    if (projeto && projeto.id) router.push(`/projetos/${projeto.id}`);
  };

  const onKeyDown = (e) => {
    // support Enter and Space to open the modal
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowModal(true);
    }
  };

  useEffect(() => {
    let mounted = true;
    const o = projeto && projeto.orientador;

    // If orientador already looks like a name (string with letters), use it directly
    if (o && typeof o === 'string' && /[A-Za-zÀ-ú]/.test(o)) {
      setOrientadorNome(o);
      return () => { mounted = false; };
    }

    // If orientador is missing, nothing to do
    if (!o) return () => { mounted = false; };

    // If cached, use cache
    if (professorNameCache[o]) {
      setOrientadorNome(professorNameCache[o]);
      return () => { mounted = false; };
    }

    // Fetch professor by id from backend public endpoint
    (async () => {
      try {
        const resp = await fetchWithApiKey(`/selectprofessor/${o}`);
        const data = resp && resp.data ? resp.data : null;
        const nome = data && (data.nome_professor || data.nome) ? (data.nome_professor || data.nome) : String(o);
        professorNameCache[o] = nome;
        if (mounted) setOrientadorNome(nome);
      } catch (err) {
        // fallback to id
        if (mounted) setOrientadorNome(String(o));
      }
    })();

    return () => { mounted = false; };
  }, [projeto]);

  // Fetch aluno names or use provided nome_autores
  useEffect(() => {
    let mounted = true;

    // If projeto already contains nome_autores (comma-separated names), use them directly
    if (projeto && projeto.nome_autores && typeof projeto.nome_autores === 'string' && projeto.nome_autores.trim() !== '') {
      const nomes = projeto.nome_autores.split(',').map(s => s.trim()).filter(s => s);
      setAlunoNomes(nomes);
      return () => { mounted = false; };
    }

    const matriculaString = projeto && projeto.matricula_alunos;

    if (!matriculaString || typeof matriculaString !== 'string') {
      setAlunoNomes([]);
      return () => { mounted = false; };
    }

    // Parse comma-separated tokens (could be aluno IDs or matricula numbers)
    const tokens = matriculaString.split(',').map(t => t.trim()).filter(Boolean);

    if (tokens.length === 0) {
      setAlunoNomes([]);
      return () => { mounted = false; };
    }

    // Fetch aluno data and try to resolve tokens by id or by matricula number
    (async () => {
      try {
        const resp = await fetchWithApiKey(`/selectaluno`);
        const alunos = resp && resp.data ? resp.data : [];

        // build lookup maps
        const byId = {};
        const byMat = {};
        alunos.forEach(a => {
          if (a && a.id != null) byId[String(a.id)] = a;
          if (a && (a.matricula_aluno != null || a.matricula != null)) byMat[String(a.matricula_aluno || a.matricula)] = a;
        });

        const nomes = tokens.map(tok => {
          // prefer id match
          const byIdFound = byId[String(tok)];
          if (byIdFound) {
            const nome = byIdFound.nome_aluno || byIdFound.nome;
            alunoNamesCache[String(tok)] = nome || `Aluno ${tok}`;
            return nome || `Aluno ${tok}`;
          }
          // try matricula match
          const byMatFound = byMat[String(tok)];
          if (byMatFound) {
            const nome = byMatFound.nome_aluno || byMatFound.nome;
            alunoNamesCache[String(tok)] = nome || `Aluno ${tok}`;
            return nome || `Aluno ${tok}`;
          }

          // cached by token?
          if (alunoNamesCache[String(tok)]) return alunoNamesCache[String(tok)];
          return `Aluno ${tok}`;
        });

        if (mounted) setAlunoNomes(nomes);
      } catch (err) {
        console.error('Erro ao carregar nomes de alunos:', err);
        if (mounted) setAlunoNomes(tokens.map(t => `Aluno ${t}`));
      }
    })();

    return () => { mounted = false; };
  }, [projeto]);

  // load arquivo resumo (first arquivo) for this project
  useEffect(() => {
    let mounted = true;
    const pid = projeto && projeto.id;
    if (!pid) return;

    (async () => {
      try {
        const resp = await fetchWithApiKey(`/selectarquivos?projeto_id=${pid}`);
        const data = resp && resp.data ? resp.data : [];
        const primeiro = Array.isArray(data) && data.length > 0 ? data[0] : null;
        const resumo = primeiro && primeiro.resumo ? primeiro.resumo : null;
        if (mounted) setArquivoResumo(resumo);
      } catch (err) {
        if (mounted) setArquivoResumo(null);
      }
    })();

    return () => { mounted = false; };
  }, [projeto]);

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
        title={`Ver detalhes do projeto ${projeto.nome_projeto}`}
        className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
      >
        <h3 className="text-lg font-bold text-gray-800">{projeto.nome_projeto}</h3>
        
        <div className="mt-3 text-sm text-gray-600 space-y-1">
          <p><strong>Orientador:</strong> {orientadorNome ?? projeto.orientador}</p>
          <p><strong>Coorientador:</strong> {projeto.coorientador || 'N/A'}</p>
          <p><strong>Alunos:</strong> {alunoNomes.length > 0 ? alunoNomes.join(', ') : 'N/A'}</p>
          <p><strong>Tipo:</strong> {projeto.tipo_projeto || 'Integrador'}</p>
          {projeto.created_at && (
            <p><strong>Criado:</strong> {new Date(projeto.created_at).toLocaleDateString('pt-BR')}</p>
          )}
        </div>

        {showActions && (
          <div className="mt-4 flex gap-2">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(projeto.id); }}
                className="flex-1 bg-sky-700 hover:bg-sky-800 text-white py-2 rounded text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400"
                aria-label={`Editar projeto ${projeto.nome_projeto}`}
                title={`Editar ${projeto.nome_projeto}`}
              >
                ✏️ Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(projeto.id); }}
                className="flex-1 bg-rose-700 hover:bg-rose-800 text-white py-2 rounded text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-400"
                aria-label={`Deletar projeto ${projeto.nome_projeto}`}
                title={`Deletar ${projeto.nome_projeto}`}
              >
                🗑️ Deletar
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowModal(false)} />

          <div className="relative z-10 max-w-2xl w-full mx-4 bg-white rounded shadow-lg p-6">
            <h3 className="text-xl font-bold mb-2">{projeto.nome_projeto}</h3>
                {arquivoResumo ? (
                  <p className="text-sm text-gray-700 mb-4">{arquivoResumo}</p>
                ) : (
                  <p className="text-sm text-gray-600 mb-4">Resumo não disponível.</p>
                )}

            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p><strong>Orientador:</strong> {orientadorNome ?? projeto.orientador}</p>
              <p><strong>Coorientador:</strong> {projeto.coorientador || 'N/A'}</p>
              <p><strong>Alunos:</strong> {alunoNomes.length > 0 ? alunoNomes.join(', ') : 'N/A'}</p>
              <p><strong>Tipo:</strong> {projeto.tipo_projeto || 'Integrador'}</p>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200">Fechar</button>
              <button onClick={goToDetail} className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow">🔎 Ver detalhes</button>
              {arquivoResumo && (
                <a href={`${api.getApiUrl()}/downloadarquivo/${encodeURIComponent((projeto.arquivos && projeto.arquivos[0] && projeto.arquivos[0].caminho_arquivo) ? projeto.arquivos[0].caminho_arquivo.split('/').pop() : '')}`} target="_blank" rel="noreferrer" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold shadow">⤓ Baixar resumo</a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
