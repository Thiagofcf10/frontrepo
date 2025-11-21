"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import api, { fetchWithAuth } from '@/lib/api';

export default function PerfilPage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ nome_usuario: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (user) {
      setForm({ nome_usuario: user.nome_usuario || '', email: user.email || '', password: '' });
    }
  }, [token, user]);

  // additional info: aluno/professor and projects
  const [roleInfo, setRoleInfo] = useState(null);
  const [userProjects, setUserProjects] = useState([]);

  useEffect(() => {
    if (!token || !user) return;
    (async () => {
      try {
        const apiKey = api.getApiKey();
        // fetch professor or aluno record
        const profRes = await fetch(`${api.getApiUrl()}/selectprofessor?api_key=${apiKey}`);
        const profJson = await profRes.json().catch(() => ({}));
        const prof = (profJson.data || []).find(p => Number(p.usuario_id) === Number(user.id));

        if (prof) {
          setRoleInfo({ tipo: 'professor', ...prof });
        } else {
          const alunoRes = await fetch(`${api.getApiUrl()}/selectaluno?api_key=${apiKey}`);
          const alunoJson = await alunoRes.json().catch(() => ({}));
          const aluno = (alunoJson.data || []).find(a => Number(a.usuario_id) === Number(user.id));
          if (aluno) setRoleInfo({ tipo: 'aluno', ...aluno });
        }

        // fetch projects mapped to this user
        try {
          const ups = await fetch(`${api.getApiUrl()}/selectusuario_projetos/${user.id}?api_key=${apiKey}`);
          const upsJson = await ups.json().catch(() => ({}));
          const mappings = upsJson.data || [];
          // fetch all projects and join
          const projetosRes = await fetch(`${api.getApiUrl()}/selectprojetos?api_key=${apiKey}`);
          const projetosJson = await projetosRes.json().catch(() => ({}));
          const projetos = projetosJson.data || [];
          const myProjects = mappings.map(m => projetos.find(p => Number(p.id) === Number(m.projeto_id))).filter(Boolean);
          setUserProjects(myProjects);
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [token, user]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload = { nome_usuario: form.nome_usuario, email: form.email };
      // only send password if provided
      if (form.password && form.password.length >= 6) payload.password = form.password;

      const res = await fetchWithAuth(`${api.getApiUrl()}/atualizarusuario/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      // refresh user from server (verify + role enrichment)
      if (refreshUser) await refreshUser();
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso.' });
      setForm(f => ({ ...f, password: '' }));
    } catch (err) {
      const text = (err && err.error) ? err.error : (err && err.message) ? err.message : 'Erro ao atualizar perfil';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar (Navbar present in other pages) */}
      <main className="flex-1 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1">
            <h1 className="text-2xl font-bold mb-4">Meu Perfil</h1>

            <div className="bg-white rounded shadow p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    name="nome_usuario"
                    value={form.nome_usuario}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nova senha (opcional)</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Deixe em branco para manter a senha atual"
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres para alterar.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {loading ? 'Atualizando...' : 'Salvar alterações'}
                  </button>
                </div>
              </form>

              {message && (
                <div className={`mt-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {message.text}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2">
            <h2 className="text-xl font-semibold mb-3">Informações</h2>
            <div className="bg-white rounded shadow p-6 mb-6">
              <p><strong>Nome:</strong> {user?.nome_usuario}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Tipo:</strong> {roleInfo?.tipo || '—'}</p>
              {roleInfo?.tipo === 'professor' && (
                <>
                  <p><strong>Matrícula (prof):</strong> {roleInfo.matricula_professor}</p>
                  <p className="flex items-center gap-3">
                    <strong>Telefone:</strong> {roleInfo.telefone}
                    <button
                      onClick={() => router.push(`/professores/${roleInfo.id}`)}
                      className="ml-3 text-sm inline-flex items-center gap-2 bg-sky-700 hover:bg-sky-800 text-white px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400"
                      title={`Ver perfil do professor ${roleInfo.nome_professor || ''}`}
                      aria-label={`Ver perfil do professor ${roleInfo.nome_professor || ''}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553 4.553a2 2 0 01-2.828 2.828L12 12.828" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                      </svg>
                      <span>Ver perfil</span>
                    </button>
                  </p>
                </>
              )}
              {roleInfo?.tipo === 'aluno' && (
                <>
                  <p><strong>Matrícula (aluno):</strong> {roleInfo.matricula_aluno}</p>
                  <p className="flex items-center gap-3">
                    <strong>Telefone:</strong> {roleInfo.telefone}
                    <button
                      onClick={() => router.push(`/alunos/${roleInfo.id}`)}
                      className="ml-3 text-sm inline-flex items-center gap-2 bg-sky-700 hover:bg-sky-800 text-white px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400"
                      title={`Ver perfil do aluno ${roleInfo.nome_aluno || ''}`}
                      aria-label={`Ver perfil do aluno ${roleInfo.nome_aluno || ''}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553 4.553a2 2 0 01-2.828 2.828L12 12.828" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                      </svg>
                      <span>Ver perfil</span>
                    </button>
                  </p>
                </>
              )}
            </div>

            <h2 className="text-xl font-semibold mb-3">Meus Projetos</h2>
            <div className="bg-white rounded shadow p-6">
              {userProjects.length === 0 ? (
                <p className="text-gray-500">Nenhum projeto encontrado.</p>
              ) : (
                <ul className="space-y-2">
                  {userProjects.map(p => (
                    <li key={p.id}>
                      <a href={`/projetos/${p.id}`} className="text-blue-600 hover:underline">{p.nome_projeto}</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
