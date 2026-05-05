"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Toast from '@/components/Toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthProvider';

export default function VerifyOtpPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialEmail = params.get('email') || '';
  const initialPurpose = params.get('purpose') || 'login';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [purpose, setPurpose] = useState(initialPurpose);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { refreshUser, setToken } = useAuth();
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.postJson('/verify-otp', { email, code, purpose });
      if (res && res.token) {
        // store token and refresh global auth state
        try { localStorage.setItem('token', res.token); } catch (e) {}
        try { if (typeof setToken === 'function') setToken(res.token); } catch (e) {}
        try { await refreshUser(); } catch (e) {}
        // If there is temp registration data, resume creating aluno/professor
        try {
          const raw = localStorage.getItem('tempRegisterData');
          if (raw) {
            const reg = JSON.parse(raw);
            // ensure we have user id
            let userId = res.user?.id;
            if (!userId) {
              try {
                const verify = await api.fetchWithAuth('/verify');
                userId = verify.user?.id || null;
              } catch (e) {
                userId = null;
              }
            }

            if (reg && reg.tipo) {
              if (reg.tipo === 'aluno') {
                const payload = {
                  nome_aluno: reg.nome_usuario,
                  matricula_aluno: String(reg.matricula_aluno),
                  id_curso: parseInt(reg.id_curso) || null,
                  usuario_id: userId,
                  telefone: reg.telefone_aluno || ''
                };
                await api.postJson('/inseriraluno', payload);
              } else if (reg.tipo === 'professor') {
                const payload = {
                  nome_professor: reg.nome_usuario,
                  matricula_professor: String(reg.matricula_professor),
                  id_area: parseInt(reg.id_area) || null,
                  codigo_matricula: reg.codigo_matricula,
                  usuario_id: userId,
                  telefone: reg.telefone_professor || ''
                };
                await api.postJson('/inserirprofessor', payload);
              }

              // cleanup
              localStorage.removeItem('tempRegisterData');
              localStorage.removeItem('postRegisterUserEmail');
            }
          }
        } catch (resumeErr) {
          console.error('Erro ao completar registro após OTP:', resumeErr);
        }

        router.push('/home');
        return;
      }
      // If verifying for password reset, show reset form instead of redirecting
      if (purpose === 'password_reset' && res && (res.success || res.token)) {
        setShowResetForm(true);
        setToast({ type: 'success', message: res.message || 'Código válido. Informe a nova senha.' });
        return;
      }
      if (res && res.guestToken) {
        try { localStorage.setItem('token', res.guestToken); } catch (e) {}
        try { if (typeof setToken === 'function') setToken(res.guestToken); } catch (e) {}
        try { await refreshUser(); } catch (e) {}
        router.push('/home');
        return;
      }
      setToast({ type: 'success', message: res.message || 'Verificado com sucesso' });
    } catch (err) {
      setToast({ type: 'error', message: err && err.message ? err.message : 'Erro ao verificar código' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return setToast({ type: 'error', message: 'Informe a nova senha' });
    if (newPassword !== confirmPassword) return setToast({ type: 'error', message: 'As senhas não coincidem' });
    setLoading(true);
    try {
      const res = await api.postJson('/reset-password', { email, code, newPassword });
      setToast({ type: 'success', message: res.message || 'Senha alterada com sucesso' });
      // redirect to login after short delay
      setTimeout(() => router.push('/login'), 900);
    } catch (err) {
      setToast({ type: 'error', message: err && err.message ? err.message : 'Erro ao trocar senha' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold mb-4">Verificar Código (OTP)</h1>
        {showResetForm ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700">Nova senha</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Confirme a nova senha</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 bg-sky-600 text-white py-2 rounded">{loading ? 'Processando...' : 'Trocar senha'}</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Código (6 dígitos)</label>
            <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Finalidade</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full border px-3 py-2 rounded">
              <option value="login">Login (2FA)</option>
              <option value="password_reset">Recuperação / Troca de senha</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-sky-600 text-white py-2 rounded">{loading ? 'Verificando...' : 'Verificar código'}</button>
          </div>
        </form>
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
