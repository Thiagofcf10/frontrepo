"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchWithAuth, getApiUrl } from '@/lib/api';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthProvider';
import Toast from '@/components/Toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialEmail = params.get('email') || '';
  // email is provided by the request-otp redirect; do not allow editing here
  const [email] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { setToken } = useAuth();

  // OTP should be requested from the previous flow (/auth/request-otp).
  // This page only accepts the code and new password.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!email) {
        setToast({ type: 'error', message: 'Email ausente. Solicite o código pela tela Esqueci a senha.' });
        setLoading(false);
        return;
      }
      if (!newPassword) {
        setToast({ type: 'error', message: 'Informe a nova senha' });
        setLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setToast({ type: 'error', message: 'As senhas não coincidem' });
        setLoading(false);
        return;
      }
      // If OTP verification returned a token previously, use authenticated user update
      // route to change the password. Otherwise, fallback to the public reset endpoint.
      let usedProtected = false;
      // First, verify the OTP for password_reset — server will return a token when valid
      try {
        const verifyRes = await api.postJson('/verify-otp', { email, code, purpose: 'password_reset' });
        if (verifyRes && verifyRes.token) {
          try { if (typeof setToken === 'function') await setToken(verifyRes.token); } catch (e) {}
          try { await fetchWithAuth('/verify'); } catch (e) {}
          // attempt protected update
          if (verifyRes.user && verifyRes.user.id) {
            usedProtected = true;
            const userId = verifyRes.user.id;
            try {
              // include nome_usuario and email to satisfy `usuario_update` validator
              const body = {
                password: newPassword,
                nome_usuario: verifyRes.user.nome_usuario || undefined,
                email: verifyRes.user.email || undefined
              };
              await fetchWithAuth(`/atualizarusuario/${userId}`, { method: 'PUT', body: JSON.stringify(body) });
              setToast({ type: 'success', message: 'Senha alterada com sucesso' });
            } catch (updateErr) {
              // show backend error if available
              console.error('Erro ao atualizar usuario (protegido):', updateErr);
              setToast({ type: 'error', message: updateErr && updateErr.message ? updateErr.message : 'Erro ao atualizar senha (protegido)' });
              setLoading(false);
              return;
            }
          }
        } else if (verifyRes && verifyRes.success) {
          // no token returned but server says success; fallback to public reset
          usedProtected = false;
        }
      } catch (verifyErr) {
        // verify failed — continue to fallback to public endpoint
        usedProtected = false;
      }

      if (!usedProtected) {
        try {
          const res = await api.postJson('/reset-password', { email, code, newPassword });
          setToast({ type: 'success', message: res.message || 'Senha alterada com sucesso' });
        } catch (pubErr) {
          console.error('Erro em reset-password:', pubErr);
          setToast({ type: 'error', message: pubErr && pubErr.error ? pubErr.error : (pubErr && pubErr.message ? pubErr.message : 'Erro ao resetar senha') });
          setLoading(false);
          return;
        }
      }
      // optional: after change, go to login
      setTimeout(() => router.push('/login'), 900);
    } catch (err) {
      setToast({ type: 'error', message: err && err.message ? err.message : 'Erro ao alterar senha' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold mb-4">Resetar Senha</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700">Código (6 dígitos)</label>
            <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Nova Senha</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Confirme a nova senha</label>
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-sky-600 text-white py-2 rounded">{loading ? 'Alterando...' : 'Alterar senha'}</button>
          </div>
        </form>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
