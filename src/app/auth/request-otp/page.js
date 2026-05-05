"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import api from '@/lib/api';

export default function RequestOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('login');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.postJson('/send-otp', { email, purpose });
      setToast({ type: 'success', message: 'Código enviado (verifique seu email).' });
      // redirect user to the appropriate page to enter the code
      if (purpose === 'password_reset') {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&purpose=password_reset`);
      } else {
        router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}&purpose=login`);
      }
    } catch (err) {
      setToast({ type: 'error', message: err && err.message ? err.message : 'Erro ao enviar código' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold mb-4">Solicitar Código por Email</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Finalidade</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full border px-3 py-2 rounded">
              <option value="login">Login (2FA)</option>
              <option value="password_reset">Recuperação / Troca de senha</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-sky-600 text-white py-2 rounded">{loading ? 'Enviando...' : 'Enviar código'}</button>
          </div>
        </form>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
