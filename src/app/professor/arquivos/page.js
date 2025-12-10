'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api, { fetchWithAuth, fetchWithApiKey } from '@/lib/api';
import Toast from '@/components/Toast';

export default function ArquivosPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [projetos, setProjetos] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [arquivos, setArquivos] = useState([]);
  const [selectedProjetoId, setSelectedProjetoId] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    projeto_id: '',
    resumo: '',
    justificativa: '',
    objetivo: '',
    sumario: '',
    introducao: '',
    bibliografia: ''
  });
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (user?.tipo !== 'professor') {
      router.push('/home');
      return;
    }
    loadProjetos();
  }, [token, user]);

  const loadProjetos = async () => {
    setLoading(true);
    try {
      const res = await fetchWithApiKey(`${api.getApiUrl()}/selectprojetos`);
      setProjetos(res.data || []);
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao carregar projetos' });
    } finally {
      setLoading(false);
    }
  };

  const loadArquivos = async (projetoId) => {
    try {
      const res = await fetchWithApiKey(`${api.getApiUrl()}/selectarquivos?projeto_id=${projetoId}`);
      setArquivos(res.data || []);
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao carregar arquivos' });
    }
  };

  const handleSelectProjeto = (projetoId) => {
    setSelectedProjetoId(projetoId);
    setFormData(prev => ({ ...prev, projeto_id: projetoId }));
    loadArquivos(projetoId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setToast({ type: 'error', message: 'Selecione um arquivo' });
      return;
    }

    if (!selectedProjetoId) {
      setToast({ type: 'error', message: 'Selecione um projeto' });
      return;
    }

    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('arquivo', file);
  fd.append('projeto_id', selectedProjetoId);
      fd.append('resumo', formData.resumo);
      fd.append('justificativa', formData.justificativa);
      fd.append('objetivo', formData.objetivo);
      fd.append('sumario', formData.sumario);
      fd.append('introducao', formData.introducao);
      fd.append('bibliografia', formData.bibliografia);

      const token = localStorage.getItem('token');
      const res = await fetch(`${api.getApiUrl()}/inserirarquivo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });

      if (!res.ok) throw new Error('Erro ao upload de arquivo');

      setToast({ type: 'success', message: 'Arquivo enviado com sucesso' });
      setFile(null);
      setFormData({
        projeto_id: selectedProjetoId,
        resumo: '',
        justificativa: '',
        objetivo: '',
        sumario: '',
        introducao: '',
        bibliografia: ''
      });
      loadArquivos(selectedProjetoId);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao enviar arquivo' });
    } finally {
      setUploading(false);
    }
  };

  // Submit handler for updating metadata when editingId is set
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    setUploading(true);
    try {
      // always send multipart/form-data so the backend multer middleware can
      // handle an optional file replacement. If no file was chosen, we still
      // send the metadata fields as text parts.
      const fd = new FormData();
      if (file) fd.append('arquivo', file);
      fd.append('resumo', formData.resumo || '');
      fd.append('justificativa', formData.justificativa || '');
      fd.append('objetivo', formData.objetivo || '');
      fd.append('sumario', formData.sumario || '');
      fd.append('introducao', formData.introducao || '');
      fd.append('bibliografia', formData.bibliografia || '');
      fd.append('projeto_id', selectedProjetoId);

      const token = localStorage.getItem('token');
      const res = await fetch(`${api.getApiUrl()}/atualizararquivo/${editingId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });

      if (!res.ok) {
        // try to extract a helpful message
        let errText = 'Erro ao atualizar arquivo';
        try {
          const json = await res.json();
          errText = json.error || json.message || errText;
        } catch (parseErr) {
          const text = await res.text().catch(() => null);
          if (text) errText = text;
        }
        throw new Error(errText);
      }

      setToast({ type: 'success', message: 'Arquivo atualizado com sucesso' });
      setEditingId(null);
      setFile(null);
      loadArquivos(selectedProjetoId);
    } catch (err) {
      const text = (err && err.message) ? err.message : 'Erro ao atualizar arquivo';
      setToast({ type: 'error', message: text });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteArquivo = async (arquivoId) => {
    if (!window.confirm('Tem certeza que deseja deletar este arquivo?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${api.getApiUrl()}/deletarquivos/${arquivoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Erro ao deletar arquivo');

      setToast({ type: 'success', message: 'Arquivo deletado com sucesso' });
      loadArquivos(selectedProjetoId);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao deletar arquivo' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">📤 Gerenciar Arquivos</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-2xl">⏳ Carregando...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Seletor de Projeto */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg text-black  font-semibold mb-3">Selecione um Projeto</h2>
              <div className="mb-3">
                <input value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} placeholder="Pesquisar projeto por nome..." className="w-full placeholder-gray-400 px-3 py-2 border border-gray-300 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {projetos.filter(p => !projectSearch || String(p.nome_projeto || '').toLowerCase().includes(projectSearch.toLowerCase())).map(projeto => (
                  <button
                    key={projeto.id}
                    onClick={() => handleSelectProjeto(projeto.id)}
                    className={`p-3 rounded-lg border-2 text-left transition ${
                      selectedProjetoId === String(projeto.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-black">{projeto.nome_projeto}</div>
                    <div className="text-xs text-gray-600">Autores: {projeto.nome_autores}</div>
                    <div className="text-xs text-gray-600">Tipo do projeto: {projeto.tipo_projeto}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedProjetoId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulário de Upload */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg text-black font-semibold mb-4">Enviar Arquivo</h2>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm text-black font-medium mb-1">Arquivo *</label>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        required
                        className="w-full text-gray-500 px-3 py-2 border border-gray-300 rounded"
                      />
                      {file && <p className="text-sm text-gray-700 mt-1">📄 {file.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm text-black font-medium mb-1">Resumo</label>
                      <textarea
                        name="resumo"
                        value={formData.resumo}
                        onChange={handleInputChange}
                        placeholder="Resumo do projeto"
                        rows="2"
                        className="w-full placeholder-gray-400 px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black font-medium mb-1">Objetivo</label>
                      <textarea
                        name="objetivo"
                        value={formData.objetivo}
                        onChange={handleInputChange}
                        placeholder="Objetivo do projeto"
                        rows="2"
                        className="w-full placeholder-gray-400 px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black font-medium mb-1">Justificativa</label>
                      <textarea
                        name="justificativa"
                        value={formData.justificativa}
                        onChange={handleInputChange}
                        placeholder="Justificativa"
                        rows="2"
                        className="w-full placeholder-gray-400 px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black font-medium mb-1">Sumário</label>
                      <textarea
                        name="sumario"
                        value={formData.sumario}
                        onChange={handleInputChange}
                        placeholder="Sumário do arquivo"
                        rows="2"
                        className="w-full placeholder-gray-400 px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black font-medium mb-1">Introdução</label>
                      <textarea
                        name="introducao"
                        value={formData.introducao}
                        onChange={handleInputChange}
                        placeholder="Introdução"
                        rows="2"
                        className="w-full placeholder-gray-400 px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black font-medium mb-1">Bibliografia</label>
                      <textarea
                        name="bibliografia"
                        value={formData.bibliografia}
                        onChange={handleInputChange}
                        placeholder="Referências bibliográficas"
                        rows="2"
                        className="w-full placeholder-gray-400 px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex gap-2">
                      {!editingId ? (
                        <button
                          type="submit"
                          disabled={uploading}
                          className="flex-1 bg-sky-700 hover:bg-sky-800 text-white py-2 rounded font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400"
                          aria-label="Enviar arquivo"
                          title="Enviar arquivo"
                        >
                          {uploading ? 'Enviando...' : '📤 Enviar Arquivo'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleUpdate}
                            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-300"
                            aria-label="Atualizar arquivo"
                            title="Atualizar arquivo"
                          >
                            {uploading ? 'Atualizando...' : '✏️ Atualizar Arquivo'}
                          </button>
                          <button
                            onClick={(ev) => { ev.preventDefault(); setEditingId(null); setFile(null); setFormData(prev => ({ ...prev })); }}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-300"
                            aria-label="Cancelar edição"
                            title="Cancelar edição"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                </div>

                {/* Lista de Arquivos */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg text-black font-semibold mb-4">Arquivos do Projeto</h2>
                  {arquivos.length === 0 ? (
                    <p className="text-gray-500">Nenhum arquivo adicionado ainda.</p>
                  ) : (
                    <div className="space-y-2">
                      {arquivos.map(arquivo => (
                        <div key={arquivo.id} className="border border-gray-200 rounded p-3 flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-black">📄 {arquivo.nome_arquivo}</p>
                            <p className="text-xs text-gray-600 mt-1">{arquivo.resumo}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleDeleteArquivo(arquivo.id)}
                              className="ml-2 bg-rose-700 hover:bg-rose-800 text-white px-2 py-1 rounded text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-300"
                              aria-label={`Deletar arquivo ${arquivo.nome_arquivo || ''}`}
                              title={`Deletar ${arquivo.nome_arquivo || ''}`}
                            >
                              🗑️
                            </button>
                            <button
                              onClick={() => {
                                // populate form for editing
                                setEditingId(arquivo.id);
                                setSelectedProjetoId(String(arquivo.projeto_id || arquivo.id_meuprojeto || ''));
                                setFormData(prev => ({
                                  ...prev,
                                  resumo: arquivo.resumo || '',
                                  justificativa: arquivo.justificativa || '',
                                  objetivo: arquivo.objetivo || '',
                                  sumario: arquivo.sumario || '',
                                  introducao: arquivo.introducao || '',
                                  bibliografia: arquivo.bibliografia || ''
                                }));
                                // don't override file input unless user selects a new file
                                setFile(null);
                              }}
                              className="ml-2 bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-300"
                              aria-label={`Editar arquivo ${arquivo.nome_arquivo || ''}`}
                              title={`Editar ${arquivo.nome_arquivo || ''}`}
                            >
                              ✏️ Editar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
