'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api, { fetchWithApiKey, fetchWithAuth } from '@/lib/api';
import Toast from '@/components/Toast';

export default function GerenciarDestaquesPage() {
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState(new Set()); // set of projeto ids (string)
  const [initialFeatured, setInitialFeatured] = useState(new Set()); // server state at load
  const [toast, setToast] = useState(null);
  useEffect(() => {
    loadProjetos();
  }, []);

  const loadProjetos = async () => {
    setLoading(true);
    try {
      const res = await fetchWithApiKey(`${api.getApiUrl()}/selectprojetos`);
      const projs = res.data || [];
      setProjetos(projs);
      // initialize featured set from server-side `destaque` flag (if present)
      try {
        const initial = new Set();
        projs.forEach(p => {
          if (p && (p.destaque === 1 || p.destaque === '1' || p.destaque === true)) initial.add(String(p.id));
        });
        setFeatured(initial);
        setInitialFeatured(new Set(initial));
      } catch (e) {
        // ignore
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao carregar projetos' });
    } finally {
      setLoading(false);
    }
  };
  // Toggle locally; changes are saved when the user clicks Save
  const toggleFeatured = (id) => {
    const sid = String(id);
    const s = new Set(Array.from(featured).map(String));
    if (s.has(sid)) s.delete(sid);
    else s.add(sid);
    setFeatured(s);
  };

  // Persist featured changes to server: only send diffs (additions/removals)
  const saveFeatured = async () => {
    const current = new Set(Array.from(featured).map(String));
    const initial = new Set(Array.from(initialFeatured).map(String));

    // compute additions and removals
    const toAdd = Array.from(current).filter(id => !initial.has(id));
    const toRemove = Array.from(initial).filter(id => !current.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      setToast({ type: 'info', message: 'Nenhuma alteração para salvar' });
      return;
    }

    setLoading(true);
    try {
      // Perform requests in parallel
      const requests = [];
      toAdd.forEach(id => {
        requests.push(fetchWithAuth(`${api.getApiUrl()}/destaqueprojeto/${id}`, { method: 'PUT', body: JSON.stringify({ destaque: 1 }) }));
      });
      toRemove.forEach(id => {
        requests.push(fetchWithAuth(`${api.getApiUrl()}/destaqueprojeto/${id}`, { method: 'PUT', body: JSON.stringify({ destaque: 0 }) }));
      });

      await Promise.all(requests);
      setInitialFeatured(new Set(current));
      setToast({ type: 'success', message: 'Destaques salvos com sucesso' });
    } catch (err) {
      console.error('Erro ao salvar destaques:', err);
      if (err && (err.status === 401 || err.status === 403)) {
        setToast({ type: 'error', message: 'Não autorizado. Faça login para salvar destaques.' });
      } else {
        setToast({ type: 'error', message: 'Erro ao salvar destaques no servidor' });
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFeatured = async () => {
    // Clear all featured flags on server for currently featured projects
    const current = Array.from(featured).map(String);
    if (current.length === 0) {
      setToast({ type: 'info', message: 'Nenhum destaque para limpar' });
      return;
    }

    setLoading(true);
    try {
      await Promise.all(current.map(id => fetchWithAuth(`${api.getApiUrl()}/destaqueprojeto/${id}`, { method: 'PUT', body: JSON.stringify({ destaque: 0 }) })));
      setFeatured(new Set());
      setToast({ type: 'success', message: 'Destaques limpos no servidor' });
    } catch (err) {
      console.error('Erro ao limpar destaques:', err);
      if (err && (err.status === 401 || err.status === 403)) {
        setToast({ type: 'error', message: 'Não autorizado. Faça login para alterar destaques.' });
      } else {
        setToast({ type: 'error', message: 'Erro ao limpar destaques no servidor' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">⭐ Gerenciar Projetos em Destaque</h1>

          <p className="text-sm text-gray-600 mb-4">Marque os projetos que devem aparecer como destaque na página principal. As alterações são salvas no servidor.</p>

          {loading ? (
            <div className="text-center py-12">⏳ Carregando...</div>
          ) : (
            <div className="bg-white rounded shadow p-4">
              <div className="grid gap-2">
                {projetos.length === 0 && <div className="text-sm text-gray-500">Nenhum projeto encontrado.</div>}
                {projetos.map(p => (
                  <label key={p.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="text-sm">
                      <div className="font-medium">{p.nome_projeto}</div>
                      <div className="text-xs text-gray-500">ID: {p.id} — Orientador: {p.orientador || p.orientadorNome || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={featured.has(String(p.id))} onChange={() => toggleFeatured(p.id)} />
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex gap-2 items-center">
                <button onClick={saveFeatured} className="bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded">Salvar Destaques</button>
                <button onClick={clearFeatured} className="ml-auto bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded">Limpar seleção</button>
              </div>

              <div className="mt-4 text-xs text-gray-500">Selecione os projetos e pressione <strong>Salvar Destaques</strong> para persistir no servidor.</div>
            </div>
          )}

          {toast && <div className={`mt-4 p-3 rounded ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{toast.message}</div>}
        </div>
      </main>
    </div>
  );
}
