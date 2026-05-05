"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import api, { fetchWithAuth, fetchWithApiKey } from '@/lib/api';

export default function PerfilPage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ nome_usuario: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  // additional info: aluno/professor and projects (declare before effects)
  const [roleInfo, setRoleInfo] = useState(null);
  const [userProjects, setUserProjects] = useState([]);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (user) {
      setForm({ nome_usuario: user.nome_usuario || '', email: user.email || '', password: '' });
    }
  }, [token, user]);

  // Prefer role-specific name fields when available (most accurate from DB)
  useEffect(() => {
    if (!roleInfo) return;
    if (roleInfo.tipo === 'professor' && roleInfo.nome_professor) {
      setForm(f => ({ ...f, nome_usuario: roleInfo.nome_professor }));
    } else if (roleInfo.tipo === 'aluno' && roleInfo.nome_aluno) {
      setForm(f => ({ ...f, nome_usuario: roleInfo.nome_aluno }));
    }
  }, [roleInfo]);


  useEffect(() => {
    if (!token || !user) return;
    (async () => {
      try {
        // fetch professor or aluno record using helper that sets x-api-key
        try {
          const presp = await fetchWithApiKey(`${api.getApiUrl()}/selectprofessor`);
          const profs = presp && presp.data ? presp.data : [];
          const prof = profs.find(p => Number(p.usuario_id) === Number(user.id));
          if (prof) {
            setRoleInfo({ tipo: 'professor', ...prof });
          } else {
            const aresp = await fetchWithApiKey(`${api.getApiUrl()}/selectaluno`);
            const alunos = aresp && aresp.data ? aresp.data : [];
            const aluno = alunos.find(a => Number(a.usuario_id) === Number(user.id));
            if (aluno) setRoleInfo({ tipo: 'aluno', ...aluno });
          }
        } catch (e) {
          // ignore role lookup errors
        }

        // fetch projects mapped to this user
        try {
          const upsResp = await fetchWithApiKey(`${api.getApiUrl()}/selectusuario_projetos/${user.id}`);
          const mappings = upsResp && upsResp.data ? upsResp.data : [];
          const projetosRes = await fetchWithApiKey(`${api.getApiUrl()}/selectprojetos`);
          const projetos = projetosRes && projetosRes.data ? projetosRes.data : [];
          const myProjects = mappings.map(m => projetos.find(p => Number(p.id) === Number(m.projeto_id))).filter(Boolean);
          setUserProjects(myProjects);
        } catch (e) {
          // ignore project lookup errors
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
      const payload = { nome_usuario: form.nome_usuario };
      // include email when present
      if (form.email) payload.email = form.email;
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
            <h1 className="text-2xl text-black font-bold mb-4">Meu Perfil</h1>

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
            <h2 className="text-xl text-black font-semibold mb-3">Informações</h2>
            <div className="bg-white text-black rounded shadow p-6 mb-6">
              <p><strong>Nome:</strong> {roleInfo?.tipo === 'professor' ? (roleInfo.nome_professor || user?.nome_usuario) : roleInfo?.tipo === 'aluno' ? (roleInfo.nome_aluno || user?.nome_usuario) : (user?.nome_usuario)}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Tipo:</strong> {roleInfo?.tipo || '—'}</p>
              {roleInfo?.tipo === 'professor' && (
                <>
                  <p><strong>Matrícula (prof):</strong> {roleInfo.matricula_professor}</p>
                  <p className="flex items-center gap-3">
                    <strong>Telefone:</strong> {roleInfo.telefone}
                  </p>
                </>
              )}
              {roleInfo?.tipo === 'aluno' && (
                <>
                  <p><strong>Matrícula (aluno):</strong> {roleInfo.matricula_aluno}</p>
                  <p className="flex items-center gap-3">
                    <strong>Telefone:</strong> {roleInfo.telefone}
                  </p>
                </>
              )}
            </div>

            {/* Meus Projetos removido per request; project management handled elsewhere */}
          </div>
        </div>
      </main>
    </div>
  );
}
