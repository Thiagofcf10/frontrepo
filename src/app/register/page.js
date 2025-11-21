'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import api from '@/lib/api';

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: usuário, 2: tipo, 3: dados adicionais
  const [formData, setFormData] = useState({
    nome_usuario: '',
    email: '',
    password: '',
    tipo: '', // 'aluno' ou 'professor'
    // Campos para aluno
    matricula_aluno: '',
    id_curso: '',
    telefone_aluno: '',
    // Campos para professor
    matricula_professor: '',
    id_area: '',
    telefone_professor: ''
  });
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('error');
  const [loading, setLoading] = useState(false);
  const [cursos, setCursos] = useState([]);
  const [areas, setAreas] = useState([]);
  const router = useRouter();

  // Buscar cursos e áreas para os selects
  const loadFormOptions = async () => {
    try {
      const cursosRes = await fetch(`${api.getApiUrl()}/selectcursos?api_key=ifpa_public_api_key_2025`);
      const cursosData = await cursosRes.json();
      setCursos(cursosData.data || []);

      const areasRes = await fetch(`${api.getApiUrl()}/selectareas?api_key=ifpa_public_api_key_2025`);
      const areasData = await areasRes.json();
      setAreas(areasData.data || []);
    } catch (err) {
      console.error('Erro ao carregar opções:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep1 = () => {
    if (!formData.nome_usuario.trim()) {
      setMsg('Nome é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setMsg('Email é obrigatório');
      return false;
    }
    if (formData.password.length < 6) {
      setMsg('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.tipo) {
      setMsg('Selecione se é aluno ou professor');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.tipo === 'aluno') {
      if (!formData.matricula_aluno) {
        setMsg('Matrícula é obrigatória');
        return false;
      }
      if (!formData.id_curso) {
        setMsg('Selecione um curso');
        return false;
      }
    } else if (formData.tipo === 'professor') {
      if (!formData.matricula_professor) {
        setMsg('Matrícula é obrigatória');
        return false;
      }
      if (!formData.id_area) {
        setMsg('Selecione uma área acadêmica');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setMsg('');
    setMsgType('error');

    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    if (step === 2) {
      loadFormOptions();
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setMsg('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    setMsg('');

    try {
      // 1. Criar usuário via endpoint público /register
      const registerRes = await fetch(`${api.getApiUrl()}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_usuario: formData.nome_usuario,
          email: formData.email,
          password: formData.password
        })
      });

      if (!registerRes.ok) {
        const errData = await registerRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao criar usuário');
      }

      const createdUser = await registerRes.json();

      // 2. Fazer login automaticamente para obter token e user id (necessário para criar aluno/professor)
      const loginRes = await fetch(`${api.getApiUrl()}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      if (!loginRes.ok) {
        const errData = await loginRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao efetuar login automático');
      }

      const loginData = await loginRes.json();
      const tokenNew = loginData.token;
      // Salvar token no localStorage para uso posterior
      if (tokenNew) {
        localStorage.setItem('token', tokenNew);
      }

      const usuarioId = loginData.user?.id || createdUser.user?.id || createdUser.id;

      // 3. Criar aluno ou professor vinculado usando token
      const authHeaders = { 'Content-Type': 'application/json' };
      if (tokenNew) authHeaders['Authorization'] = `Bearer ${tokenNew}`;

      if (formData.tipo === 'aluno') {
        const alunoRes = await fetch(`${api.getApiUrl()}/inseriraluno`, {
          method: 'POST',
          headers: authHeaders,
          credentials: 'include',
          body: JSON.stringify({
            nome_aluno: formData.nome_usuario,
            matricula_aluno: parseInt(formData.matricula_aluno),
            id_curso: parseInt(formData.id_curso),
            usuario_id: usuarioId,
            telefone: formData.telefone_aluno || ''
          })
        });

        if (!alunoRes.ok) {
          const e = await alunoRes.json().catch(() => ({}));
          throw new Error(e.error || 'Erro ao criar registro de aluno');
        }
      } else if (formData.tipo === 'professor') {
        const professorRes = await fetch(`${api.getApiUrl()}/inserirprofessor`, {
          method: 'POST',
          headers: authHeaders,
          credentials: 'include',
          body: JSON.stringify({
            nome_professor: formData.nome_usuario,
            matricula_professor: parseInt(formData.matricula_professor),
            id_area: parseInt(formData.id_area),
            usuario_id: usuarioId,
            telefone: formData.telefone_professor || ''
          })
        });

        if (!professorRes.ok) {
          const e = await professorRes.json().catch(() => ({}));
          throw new Error(e.error || 'Erro ao criar registro de professor');
        }
      }

      setMsgType('success');
      setMsg('Cadastro realizado com sucesso! Você já foi autenticado e será redirecionado...');

      setTimeout(() => {
        router.push('/home');
      }, 1500);
    } catch (err) {
      setMsgType('error');
      setMsg(err.message || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Registrar-se no IFPA Projetos</h1>

        {/* Indicador de etapa */}
        <div className="flex gap-2 mb-8 justify-center">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition ${
                s <= step ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Dados de Usuário */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Dados da Conta</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input
                type="text"
                name="nome_usuario"
                value={formData.nome_usuario}
                onChange={handleInputChange}
                placeholder="Seu nome"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="seu@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Step 2: Tipo de Usuário */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Qual é seu perfil?</h2>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, tipo: 'aluno' }))}
              className={`w-full p-4 border-2 rounded-lg text-left transition ${
                formData.tipo === 'aluno'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-lg font-semibold">👨‍🎓 Aluno</div>
              <div className="text-sm text-gray-600">Participar de projetos como aluno</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, tipo: 'professor' }))}
              className={`w-full p-4 border-2 rounded-lg text-left transition ${
                formData.tipo === 'professor'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-lg font-semibold">🧑‍🏫 Professor</div>
              <div className="text-sm text-gray-600">Criar e gerenciar projetos</div>
            </button>
          </div>
        )}

        {/* Step 3: Dados Adicionais */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">
              {formData.tipo === 'aluno' ? 'Dados do Aluno' : 'Dados do Professor'}
            </h2>

            {formData.tipo === 'aluno' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                  <input
                    type="number"
                    name="matricula_aluno"
                    value={formData.matricula_aluno}
                    onChange={handleInputChange}
                    placeholder="Sua matrícula"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                  <select
                    name="id_curso"
                    value={formData.id_curso}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um curso</option>
                    {cursos.map(curso => (
                      <option key={curso.id} value={curso.id}>
                        {curso.nome_curso}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (Opcional)</label>
                  <input
                    type="tel"
                    name="telefone_aluno"
                    value={formData.telefone_aluno}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                  <input
                    type="number"
                    name="matricula_professor"
                    value={formData.matricula_professor}
                    onChange={handleInputChange}
                    placeholder="Sua matrícula"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área Acadêmica</label>
                  <select
                    name="id_area"
                    value={formData.id_area}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma área</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>
                        {area.nome_area}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (Opcional)</label>
                  <input
                    type="tel"
                    name="telefone_professor"
                    value={formData.telefone_professor}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>
        )}

        {/* Mensagens */}
        {msg && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              msgType === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {msg}
          </div>
        )}

        {/* Botões de navegação */}
        <div className="mt-6 flex gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold"
            >
              ← Voltar
            </button>
          )}
          {step < 3 && (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold"
            >
              Próximo →
            </button>
          )}
        </div>

        {/* Link para login */}
        <p className="text-center mt-4 text-sm text-gray-600">
          Já tem conta?{' '}
          <a href="/login" className="text-blue-500 hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </main>
  );
}
