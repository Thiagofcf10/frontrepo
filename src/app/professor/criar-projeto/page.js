'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api, { fetchWithAuth, fetchWithApiKey } from '@/lib/api';
import Toast from '@/components/Toast';

export default function CriarProjetoPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome_projeto: '',
    orientador: '',
    coorientador: '',
    matricula_alunos: '',
    published: false
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [professores, setProfessores] = useState([]);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (user?.tipo !== 'professor') {
      router.push('/home');
    }

    // load list of professors for the orientador select
    (async () => {
      try {
        const apiKey = api.getApiKey();
        const resp = await fetchWithApiKey(`${api.getApiUrl()}/selectprofessor?api_key=${apiKey}`);
        const data = resp && resp.data ? resp.data : [];
        setProfessores(data || []);

        // default orientador to current user id when available
        if (user && user.id) {
          setFormData(prev => ({ ...prev, orientador: String(user.id) }));
        }
      } catch (err) {
        // ignore load errors, keep empty list
        setProfessores([]);
      }
    })();
  }, [token, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...formData };
      // if orientador is an empty string (user didn't select), remove it so server middleware
      // can set orientador = authenticated user id
      if (payload.orientador === '') delete payload.orientador;
      if (payload.published) {
        const d = new Date();
        payload.published_at = d.toISOString().slice(0,19).replace('T', ' ');
      } else {
        payload.published_at = null;
      }

      const res = await fetchWithAuth(`${api.getApiUrl()}/inserirprojeto`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setToast({ type: 'success', message: 'Projeto criado com sucesso!' });
      setTimeout(() => {
        router.push('/professor/meus-projetos');
      }, 2000);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao criar projeto' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">➕ Criar Novo Projeto</h1>

        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto *</label>
              <input
                type="text"
                name="nome_projeto"
                value={formData.nome_projeto}
                onChange={handleChange}
                required
                placeholder="Ex: Sistema de Gerenciamento de Tarefas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Orientador é preenchido automaticamente com o usuário autenticado */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orientador</label>
              <select
                name="orientador"
                value={formData.orientador}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Selecionar orientador (opcional) --</option>
                {professores.map(p => (
                  <option key={p.id} value={p.id}>{p.nome_professor || p.nome || `ID ${p.id}`}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coorientador</label>
              <input
                type="text"
                name="coorientador"
                value={formData.coorientador}
                onChange={handleChange}
                placeholder="Nome do coorientador (opcional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matrículas dos Alunos</label>
              <textarea
                name="matricula_alunos"
                value={formData.matricula_alunos}
                onChange={handleChange}
                placeholder="Ex: 2023001,2023002,2023003 (separadas por vírgula)"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input id="published" name="published" type="checkbox" checked={formData.published} onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))} />
              <label htmlFor="published" className="text-sm text-gray-700">Publicar projeto imediatamente</label>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Projeto'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
