'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import api, { fetchWithAuth, fetchWithApiKey } from '@/lib/api';
import Toast from '@/components/Toast';

export default function CustosPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [projetos, setProjetos] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [custos, setCustos] = useState([]);
  const [selectedProjetoId, setSelectedProjetoId] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id_projeto: '',
    equipamento: '',
    custos_equipamento: '',
    insumos: '',
    custos_insumos: ''
  });

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

  const loadCustos = async (projetoId) => {
    try {
      const res = await fetchWithApiKey(`${api.getApiUrl()}/selectcustos`);
      const filtrados = (res.data || []).filter(c => c.id_projeto === parseInt(projetoId));
      setCustos(filtrados);
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao carregar custos' });
    }
  };

  const handleSelectProjeto = (projetoId) => {
    setSelectedProjetoId(projetoId);
    loadCustos(projetoId);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCusto = async () => {
    if (!selectedProjetoId) {
      setToast({ type: 'error', message: 'Selecione um projeto' });
      return;
    }

    try {
      await fetchWithAuth(`${api.getApiUrl()}/inserircusto`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          id_projeto: parseInt(selectedProjetoId),
          custos_equipamento: parseFloat(formData.custos_equipamento),
          custos_insumos: parseFloat(formData.custos_insumos)
        })
      });

      setToast({ type: 'success', message: 'Custo adicionado com sucesso' });
      setFormData({
        id_projeto: '',
        equipamento: '',
        custos_equipamento: '',
        insumos: '',
        custos_insumos: ''
      });
      setModalOpen(false);
      loadCustos(selectedProjetoId);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao adicionar custo' });
    }
  };

  const handleDeleteCusto = async (custoId) => {
    if (!window.confirm('Tem certeza que deseja deletar este custo?')) return;

    try {
      await fetchWithAuth(`${api.getApiUrl()}/deletecusto/${custoId}`, {
        method: 'DELETE'
      });

      setToast({ type: 'success', message: 'Custo deletado com sucesso' });
      loadCustos(selectedProjetoId);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao deletar custo' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">💰 Gerenciar Custos</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-2xl">⏳ Carregando...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Seletor de Projeto */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-black text-lg font-semibold mb-3">Selecione um Projeto</h2>
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
              <>
                {/* Botão de adicionar */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow"
                  >
                    ➕ Adicionar Custo
                  </button>
                  <div className="text-sm text-gray-600">Selecione um projeto à esquerda para ver/gerenciar custos</div>
                </div>

                {/* Lista de Custos */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Custos do Projeto</h2>
                    {custos.length === 0 ? (
                      <p className="text-gray-500">Nenhum custo adicionado ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        {custos.map(custo => (
                              <div key={custo.id} className="border border-gray-100 rounded p-4 flex flex-col md:flex-row md:justify-between gap-3 md:items-center">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-800">{custo.equipamento || '—'}</h3>
                                  <div className="mt-1 text-sm text-gray-600">Equipamento: R$ {parseFloat(custo.custos_equipamento || 0).toFixed(2)}</div>
                                  {custo.insumos && (
                                    <div className="mt-1 text-sm text-gray-600">Insumos: {custo.insumos} — R$ {parseFloat(custo.custos_insumos || 0).toFixed(2)}</div>
                                  )}
                                  {custo.created_at && <div className="mt-1 text-xs text-gray-400">Adicionado em: {new Date(custo.created_at).toLocaleString('pt-BR')}</div>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-lg text-black font-semibold">R$ {(Number(custo.custos_equipamento || 0) + Number(custo.custos_insumos || 0)).toFixed(2)}</div>
                                  <button onClick={() => handleDeleteCusto(custo.id)} className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded">🗑️ Deletar</button>
                                </div>
                              </div>
                            ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Modal de Adicionar Custo */}
        <Modal
          isOpen={modalOpen}
          title={<span className="text-black">Adicionar Custo</span>}
          onClose={() => setModalOpen(false)}
          confirmText="Adicionar"
          onConfirm={handleAddCusto}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-black font-medium mb-1">Equipamento</label>
              <input
                type="text"
                name="equipamento"
                value={formData.equipamento}
                onChange={handleChange}
                placeholder="Ex: Laptop"
                className="w-full placeholder-gray-400 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-black font-medium mb-1">Custo do Equipamento (R$)</label>
              <input
                type="number"
                step="0.01"
                name="custos_equipamento"
                value={formData.custos_equipamento}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full placeholder-gray-400 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-black font-medium mb-1">Insumos</label>
              <input
                type="text"
                name="insumos"
                value={formData.insumos}
                onChange={handleChange}
                placeholder="Ex: Parafusos, Cabos"
                className="w-full placeholder-gray-400 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-black font-medium mb-1">Custo dos Insumos (R$)</label>
              <input
                type="number"
                step="0.01"
                name="custos_insumos"
                value={formData.custos_insumos}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full placeholder-gray-400 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Modal>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
