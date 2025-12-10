'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import api, { fetchWithAuth } from '@/lib/api';

export default function GerenciarDados() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [area, setArea] = useState({ nome_area: '', codigo_area: '' });
  const [turma, setTurma] = useState({ cod_turma: '', turno: '', quantidade_alunos: '' });
  const [curso, setCurso] = useState({ nome_curso: '', coordenador: '', duracao: '', descricao_curso: '' });

  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    // if not logged, redirect to login
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  if (user?.tipo !== 'professor') {
    // Only professors should access this page
    if (typeof window !== 'undefined') router.push('/home');
    return null;
  }

  const submitArea = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${api.getApiUrl()}/inserirarea`, {
        method: 'POST',
        body: JSON.stringify(area)
      });
      setToast({ type: 'success', message: 'Área criada com sucesso!' });
      setArea({ nome_area: '', codigo_area: '' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || JSON.stringify(err) });
    } finally {
      setLoading(false);
    }
  };

  const submitTurma = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...turma };
      if (payload.quantidade_alunos === '') delete payload.quantidade_alunos;
      const res = await fetchWithAuth(`${api.getApiUrl()}/inserirturma`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setToast({ type: 'success', message: 'Turma criada com sucesso!' });
      setTurma({ cod_turma: '', turno: '', quantidade_alunos: '' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || JSON.stringify(err) });
    } finally {
      setLoading(false);
    }
  };

  const submitCurso = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...curso };
      if (payload.duracao === '') payload.duracao = 0;
      const res = await fetchWithAuth(`${api.getApiUrl()}/inserircursos`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setToast({ type: 'success', message: 'Curso criado com sucesso!' });
      setCurso({ nome_curso: '', coordenador: '', duracao: '', descricao_curso: '' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || JSON.stringify(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      <main className="flex-1 p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl text-black  font-bold mb-4">Gerenciar Dados Acadêmicos</h1>
        <p className="text-sm text-gray-600 mb-6">Adicione áreas, turmas e cursos (caso ainda não exista no sistema).</p>

        <section className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-black font-semibold mb-3">Nova Área Acadêmica</h2>
          <form onSubmit={submitArea} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700">Nome da Área *</label>
              <input type="text" required value={area.nome_area} onChange={(e) => setArea(prev => ({ ...prev, nome_area: e.target.value }))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Código da Área *</label>
              <input type="number" required value={area.codigo_area} onChange={(e) => setArea(prev => ({ ...prev, codigo_area: e.target.value }))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">Criar Área</button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-black font-semibold mb-3">Nova Turma</h2>
          <form onSubmit={submitTurma} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700">Código da Turma *</label>
              <input type="text" required value={turma.cod_turma} onChange={(e) => setTurma(prev => ({ ...prev, cod_turma: e.target.value }))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Turno *</label>
              <input type="text" required value={turma.turno} onChange={(e) => setTurma(prev => ({ ...prev, turno: e.target.value }))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Quantidade de Alunos (opcional)</label>
              <input type="number" value={turma.quantidade_alunos} onChange={(e) => setTurma(prev => ({ ...prev, quantidade_alunos: e.target.value }))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">Criar Turma</button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-black font-semibold mb-3">Novo Curso</h2>
          <form onSubmit={submitCurso} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700">Nome do Curso *</label>
              <input type="text" required value={curso.nome_curso} onChange={(e) => setCurso(prev => ({ ...prev, nome_curso: e.target.value }))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Coordenador *</label>
              <input type="text" required value={curso.coordenador} onChange={(e) => setCurso(prev => ({ ...prev, coordenador: e.target.value }))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Duração (em semestres)</label>
              <input type="number" value={curso.duracao} onChange={(e) => setCurso(prev => ({ ...prev, duracao: e.target.value }))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Descrição (opcional)</label>
              <textarea value={curso.descricao_curso} onChange={(e) => setCurso(prev => ({ ...prev, descricao_curso: e.target.value }))} className="w-full border px-3 py-2 rounded" rows={4} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">Criar Curso</button>
            </div>
          </form>
        </section>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </div>
  );
}
