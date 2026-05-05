"use client";

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import api, { fetchWithAuth } from '@/lib/api';
import { useAuth } from '@/context/AuthProvider';

export default function CadastroCodigoMatricula() {
  const { user } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [matriculaValida, setMatriculaValida] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!codigo || codigo.trim().length === 0) {
      setMessage({ type: 'error', text: 'Informe o código.' });
      return;
    }

    setLoading(true);
    try {
      const body = { codigo: String(codigo).trim(), matricula_valida: matriculaValida ? 1 : 0 };
      const res = await fetchWithAuth('/inserircodigo_matricula_pro', { method: 'POST', body: JSON.stringify(body) });
      setMessage({ type: 'success', text: res && res.message ? res.message : 'Código cadastrado com sucesso' });
      setCodigo('');
      setMatriculaValida(true);
    } catch (err) {
      setMessage({ type: 'error', text: err && err.message ? err.message : 'Erro ao cadastrar código' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl text-black font-bold mb-4">Cadastro de Códigos de Matrícula (Professores)</h1>

          {!user || user.tipo !== 'professor' ? (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">Apenas professores autenticados podem acessar esta página.</div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 space-y-4">
              {message && (
                <div className={`p-3 rounded ${message.type === 'error' ? 'bg-red-50 border-l-4 border-red-400 text-red-700' : 'bg-green-50 border-l-4 border-green-400 text-green-700'}`}>
                  {message.text}
                </div>
              )}

              <div>
                <label className="block text-sm text-black font-medium mb-1">Código</label>
                <input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Ex: N:matricula + 4 digitos " className="w-full border px-3 py-2 rounded" />
                <p className="text-xs text-gray-500 mt-1">Insira o código que será vinculado às matrículas autorizadas para registro de professores.</p>
              </div>

              <div className="flex items-center gap-3">
                <input id="valida" type="checkbox" checked={matriculaValida} onChange={e => setMatriculaValida(e.target.checked)} />
                <label htmlFor="valida" className="text-sm text-black">Matrícula válida (habilitar)</label>
              </div>

              <div className="flex items-center gap-3">
                <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Salvando...' : 'Salvar Código'}</button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
