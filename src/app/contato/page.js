"use client";

import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function ContatoPage() {
  const [form, setForm] = useState({ nome: '', email: '', assunto: '', mensagem: '' });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('Enviando...');
    setTimeout(() => setStatus('Mensagem enviada. Obrigado!'), 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold mb-2">✉️ Contato</h1>
            <p className="text-gray-600 mb-4">Use este formulário para entrar em contato com a equipe do IFPA Projetos.</p>

            <form onSubmit={handleSubmit} className="bg-white p-4 rounded space-y-4">
              <div>
                <label className="block text-sm font-medium">Nome</label>
                <input name="nome" value={form.nome} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">E-mail</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Assunto</label>
                <input name="assunto" value={form.assunto} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Mensagem</label>
                <textarea name="mensagem" value={form.mensagem} onChange={handleChange} rows={6} className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" className="bg-sky-700 text-white px-4 py-2 rounded shadow">Enviar</button>
                {status && <div className="text-sm text-gray-600">{status}</div>}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
