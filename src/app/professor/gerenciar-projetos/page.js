"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import api, { fetchWithApiKey, fetchWithAuth } from '@/lib/api';
import Navbar from '@/components/Navbar';
import AlunoMultiSelect from '@/components/AlunoMultiSelect';
import { TIPOS_PROJETO } from '@/lib/constants';

export default function GerenciarProjetosPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [projetos, setProjetos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome_projeto: '', orientador: '', coorientador: '', nome_autores: '', tipo_projeto: 'Integrador', published: false, published_at: null });
  const [busy, setBusy] = useState(false);
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
    loadProjetos();
  }, [token, user]);

  const loadProjetos = async () => {
    setLoading(true);
    try {
      const res = await fetchWithApiKey(`${api.getApiUrl()}/selectprojetos`);
      const projetosData = res.data || [];

      // fetch professors to map orientador id -> nome
      let profMap = {};
      try {
        const presp = await fetchWithApiKey(`${api.getApiUrl()}/selectprofessor`);
        const profs = presp && presp.data ? presp.data : [];
        profs.forEach(p => { if (p && p.id) profMap[p.id] = p.nome_professor || p.nome || String(p.id); });
      } catch (e) {
        // ignore professor lookup errors; we'll fall back to IDs
      }

      const mapped = projetosData.map(p => ({ ...p, orientadorNome: profMap[p.orientador] || null }));
      setProjetos(mapped);
      // load alunos for selection
      try {
        const aresp = await fetchWithApiKey(`${api.getApiUrl()}/selectaluno`);
        const alunosData = aresp && aresp.data ? aresp.data : [];
        setAlunos(alunosData);
      } catch (ae) {
        setAlunos([]);
      }
    } catch (err) {
      console.error('Erro ao carregar projetos', err);
      setToast({ type: 'error', message: 'Erro ao carregar projetos' });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    // split matricula_alunos into array-like CSV string stored in form
    const matriculaCsv = p.matricula_alunos || '';
    setForm({
      nome_projeto: p.nome_projeto || '',
      orientador: p.orientador || '',
      coorientador: p.coorientador || '',
      nome_autores: p.nome_autores || '',
      matricula_alunos: matriculaCsv,
      tipo_projeto: p.tipo_projeto || 'Integrador',
      published: !!p.published,
      published_at: p.published_at || null
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ nome_projeto: '', orientador: '', coorientador: '', nome_autores: '' });
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAlunoSelect = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
    const matriculaCsv = selected.join(',');
    const names = selected.map(id => {
      const found = alunos.find(a => String(a.id) === String(id));
      return found ? (found.nome_aluno || found.nome || `Aluno ${id}`) : `Aluno ${id}`;
    });
    setForm(prev => ({ ...prev, matricula_alunos: matriculaCsv, nome_autores: names.join(', ') }));
  };

  const saveProjeto = async (id) => {
    setBusy(true);
    try {
      const payload = { nome_projeto: form.nome_projeto, orientador: form.orientador, coorientador: form.coorientador, matricula_alunos: form.matricula_alunos || '', nome_autores: form.nome_autores, tipo_projeto: form.tipo_projeto, published: !!form.published, published_at: form.published ? (form.published_at || new Date().toISOString().slice(0,19).replace('T',' ')) : null };
      await fetchWithAuth(`${api.getApiUrl()}/atualizarprojeto/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setToast({ type: 'success', message: 'Projeto atualizado' });
      cancelEdit();
      loadProjetos();
    } catch (err) {
      const msg = (err && err.message) ? err.message : 'Erro ao atualizar projeto';
      setToast({ type: 'error', message: msg });
    } finally {
      setBusy(false);
    }
  };

  const deleteProjeto = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este projeto?')) return;
    setBusy(true);
    try {
      await fetchWithAuth(`${api.getApiUrl()}/deleteprojeto/${id}`, { method: 'DELETE' });
      setToast({ type: 'success', message: 'Projeto deletado' });
      loadProjetos();
    } catch (err) {
      const msg = (err && err.message) ? err.message : 'Erro ao deletar projeto';
      setToast({ type: 'error', message: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />

      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Gerenciar Projetos</h1>

          <div className="bg-white rounded shadow p-4 mb-6">
            <p className="text-sm text-gray-600">Lista de projetos. Clique em "Editar" para modificar o projeto ou "Deletar" para remover.</p>
          </div>

          {loading ? (
            <div className="text-center py-12">⏳ Carregando...</div>
          ) : (
            <div className="space-y-4">
              {projetos.map(p => (
                <div key={p.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    {editingId === p.id ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Nome do projeto</label>
                        <input name="nome_projeto" value={form.nome_projeto} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-sm font-medium">Orientador (ID)</label>
                            <input name="orientador" value={form.orientador} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Coorientador</label>
                            <input name="coorientador" value={form.coorientador} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Selecionar Alunos (matrículas)</label>
                            <AlunoMultiSelect
                              alunos={alunos}
                              value={(form.matricula_alunos || '').split(',').filter(Boolean)}
                              onChange={(arr) => {
                                  // Convert selected aluno ids -> student matricula numbers
                                  const matriculas = arr.map(id => {
                                    const found = alunos.find(a => String(a.id) === String(id));
                                    return found ? String(found.matricula_aluno || found.matricula || found.id) : String(id);
                                  });
                                  const names = arr.map(id => {
                                    const found = alunos.find(a => String(a.id) === String(id));
                                    return found ? (found.nome_aluno || found.nome || `Aluno ${id}`) : `Aluno ${id}`;
                                  });
                                  setForm(prev => ({ ...prev, matricula_alunos: matriculas.join(','), nome_autores: names.join(', ') }));
                              }}
                            />
                            <label className="block text-sm font-medium mt-2">Nomes dos autores (separados por vírgula)</label>
                            <input name="nome_autores" value={form.nome_autores} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mt-2">Tipo de projeto</label>
                          <select name="tipo_projeto" value={form.tipo_projeto} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2">
                            {TIPOS_PROJETO.map(tipo => (
                              <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <input id={`edit-published-${p.id}`} type="checkbox" name="published" checked={form.published} onChange={(e) => setForm(prev => ({ ...prev, published: e.target.checked }))} />
                          <label htmlFor={`edit-published-${p.id}`} className="text-sm">Publicado</label>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold">{p.nome_projeto}</h3>
                        <p className="text-sm text-gray-600">Coorientador: {p.coorientador || '—'}</p>
                        <p className="text-sm text-gray-600">Alunos: {p.nome_autores || p.matricula_alunos || '—'}</p>
                        <p className="text-sm text-gray-600">Tipo: {p.tipo_projeto || 'Integrador'}</p>
                        <p className="text-xs text-gray-500 mt-1">Orientador: {p.orientadorNome || p.orientador}</p>
                        <p className="text-xs text-gray-500 mt-1">Status: {p.published ? 'Publicado' : 'Rascunho'} {p.published_at ? `— ${new Date(p.published_at).toLocaleString()}` : ''}</p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {editingId === p.id ? (
                      <>
                        <button onClick={() => saveProjeto(p.id)} disabled={busy} className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-300">Salvar</button>
                        <button onClick={cancelEdit} disabled={busy} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(p)} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded">✏️ Editar</button>
                        <button onClick={() => deleteProjeto(p.id)} className="bg-rose-700 hover:bg-rose-800 text-white px-3 py-2 rounded">🗑️ Deletar</button>
                        <button onClick={async () => {
                          setBusy(true);
                          try {
                            await fetchWithAuth(`${api.getApiUrl()}/publicarprojeto/${p.id}`, { method: 'PUT', body: JSON.stringify({ published: !p.published }) });
                            setToast({ type: 'success', message: p.published ? 'Projeto despublicado' : 'Projeto publicado' });
                            loadProjetos();
                          } catch (err) {
                            setToast({ type: 'error', message: err.message || 'Erro ao alterar publicação' });
                          } finally {
                            setBusy(false);
                          }
                        }} className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded">{p.published ? 'Despublicar' : 'Publicar'}</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {toast && (
            <div className={`mt-4 p-3 rounded ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{toast.message}</div>
          )}
        </div>
      </main>
    </div>
  );
}
