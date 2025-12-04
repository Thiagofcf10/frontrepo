'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import api, { fetchWithAuth, fetchWithApiKey, getApiKey, getToken } from '@/lib/api';
import Toast from '@/components/Toast';

export default function RegistrosPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [projetos, setProjetos] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [registros, setRegistros] = useState([]);
  const [selectedProjetoId, setSelectedProjetoId] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id_projeto: '',
    data_reuniao: '',
    lista_participantes: '',
    duracao_reuniao: '00:00:00',
    titulo_reuniao: '',
    relatorio: ''
  });
  const [expandedRegistros, setExpandedRegistros] = useState(new Set());

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

  const loadRegistros = async (projetoId) => {
    try {
      const res = await fetchWithApiKey(`${api.getApiUrl()}/selectregistros`);
      const filtrados = (res.data || []).filter(r => r.id_projeto === parseInt(projetoId));
      setRegistros(filtrados);
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao carregar registros' });
    }
  };

  const handleSelectProjeto = (projetoId) => {
    setSelectedProjetoId(projetoId);
    setFormData(prev => ({ ...prev, id_projeto: projetoId }));
    loadRegistros(projetoId);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddRegistro = async () => {
    if (!selectedProjetoId) {
      setToast({ type: 'error', message: 'Selecione um projeto' });
      return;
    }

    if (!formData.data_reuniao || !formData.titulo_reuniao) {
      setToast({ type: 'error', message: 'Preencha data e título da reunião' });
      return;
    }

    try {
      await fetchWithAuth(`${api.getApiUrl()}/inserirregistro`, {
        method: 'POST',
        body: JSON.stringify({
          id_projeto: parseInt(selectedProjetoId),
          data_reuniao: formData.data_reuniao,
          lista_participantes: formData.lista_participantes,
          duracao_reuniao: formData.duracao_reuniao,
          titulo_reuniao: formData.titulo_reuniao,
          relatorio: formData.relatorio,
          relatorio_edit_deadline: formData.relatorio_edit_deadline || null,
          relatorio_edit_allowed: formData.relatorio_edit_allowed || null
        })
      });

      setToast({ type: 'success', message: 'Reunião registrada com sucesso' });
      setFormData({
        id_projeto: selectedProjetoId,
        data_reuniao: '',
        lista_participantes: '',
        duracao_reuniao: '00:00:00',
        titulo_reuniao: ''
        , relatorio: ''
      });
      setModalOpen(false);
      loadRegistros(selectedProjetoId);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao registrar reunião' });
    }
  };

  const handleDeleteRegistro = async (registroId) => {
    if (!window.confirm('Tem certeza que deseja deletar este registro?')) return;

    try {
      await fetchWithAuth(`${api.getApiUrl()}/deleteregistro/${registroId}`, {
        method: 'DELETE'
      });

      setToast({ type: 'success', message: 'Registro deletado com sucesso' });
      loadRegistros(selectedProjetoId);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao deletar registro' });
    }
  };

  const handleDownloadRelatorio = async (projetoId) => {
    if (!projetoId) {
      setToast({ type: 'error', message: 'Selecione um projeto antes de baixar o relatório' });
      return;
    }

    try {
      const url = `${api.getApiUrl()}/selectregistros_txt?projeto_id=${projetoId}`;
      const token = getToken();
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        credentials: 'include'
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Erro ao baixar relatório');
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      let filename = `registros_projeto_${projetoId}.txt`;
      const match = disposition.match(/filename\*=UTF-8''(.+)|filename=\"?([^\";]+)\"?/);
      if (match) filename = decodeURIComponent(match[1] || match[2]);

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      setToast({ type: 'success', message: 'Download iniciado' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao baixar relatório' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">📝 Registros de Reuniões</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-2xl">⏳ Carregando...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Seletor de Projeto */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Selecione um Projeto</h2>
              <div className="mb-3">
                <input value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} placeholder="Pesquisar projeto por nome..." className="w-full px-3 py-2 border border-gray-300 rounded" />
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
                    <div className="font-semibold">{projeto.nome_projeto}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedProjetoId && (
              <>
                {/* Botão de adicionar */}
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  ➕ Registrar Nova Reunião
                </button>

                {/* Botão de baixar relatório geral do projeto */}
                <button
                  onClick={() => handleDownloadRelatorio(selectedProjetoId)}
                  className="ml-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  ⬇️ Baixar Relatório do Projeto
                </button>

                {/* Lista de Registros */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Reuniões Registradas</h2>
                  {registros.length === 0 ? (
                    <p className="text-gray-500">Nenhuma reunião registrada ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {registros.map(registro => {
                        const isExpanded = expandedRegistros.has(registro.id);
                        const short = registro.relatorio && registro.relatorio.length > 200 ? registro.relatorio.slice(0, 200) + '...' : registro.relatorio;
                        return (
                          <div key={registro.id} className="border border-gray-200 rounded p-4 flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold">{registro.titulo_reuniao}</h3>
                              <p className="text-sm text-gray-600">📅 {new Date(registro.data_reuniao).toLocaleDateString('pt-BR')}</p>
                              <p className="text-sm text-gray-600">⏱️ Duração: {registro.duracao_reuniao}</p>
                              {registro.lista_participantes && (
                                <p className="text-sm text-gray-600">👥 Participantes: {registro.lista_participantes}</p>
                              )}
                              {registro.relatorio && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-700 whitespace-pre-line">{isExpanded ? registro.relatorio : short}</p>
                                  {registro.relatorio.length > 200 && (
                                    <button
                                      onClick={() => {
                                        const s = new Set(expandedRegistros);
                                        if (s.has(registro.id)) s.delete(registro.id);
                                        else s.add(registro.id);
                                        setExpandedRegistros(s);
                                      }}
                                      className="mt-1 text-sm text-sky-600 underline"
                                    >
                                      {isExpanded ? 'Ver menos' : 'Ver relatório completo'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 ml-2">
                              <button
                                onClick={() => handleDeleteRegistro(registro.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                              >
                                🗑️ Deletar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Modal de Adicionar Registro */}
        <Modal
          isOpen={modalOpen}
          title="Registrar Nova Reunião"
          onClose={() => setModalOpen(false)}
          confirmText="Registrar"
          onConfirm={handleAddRegistro}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Título da Reunião *</label>
              <input
                type="text"
                name="titulo_reuniao"
                value={formData.titulo_reuniao}
                onChange={handleChange}
                placeholder="Ex: Discussão de Requisitos"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data da Reunião *</label>
              <input
                type="date"
                name="data_reuniao"
                value={formData.data_reuniao}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duração (HH:MM:SS)</label>
              <input
                type="time"
                name="duracao_reuniao"
                value={formData.duracao_reuniao.substring(0, 5)}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  duracao_reuniao: e.target.value + ':00'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Participantes</label>
              <textarea
                name="lista_participantes"
                value={formData.lista_participantes}
                onChange={handleChange}
                placeholder="Nomes dos participantes (separados por vírgula)"
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Relatório</label>
              <textarea
                name="relatorio"
                value={formData.relatorio}
                onChange={handleChange}
                placeholder="Escreva o relatório da reunião aqui"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prazo para edição do relatório (opcional)</label>
              <input
                type="datetime-local"
                name="relatorio_edit_deadline"
                value={formData.relatorio_edit_deadline || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Se definido, apenas alunos listados poderão editar até essa data/hora.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alunos permitidos (matrículas ou IDs, separados por vírgula)</label>
              <input
                type="text"
                name="relatorio_edit_allowed"
                value={formData.relatorio_edit_allowed || ''}
                onChange={handleChange}
                placeholder="ex: 2023001,2023002 ou 12,15"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Modal>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
