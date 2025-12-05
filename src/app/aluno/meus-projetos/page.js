'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProjetoCard from '@/components/ProjetoCard';
import api, { fetchWithApiKey, fetchWithAuth } from '@/lib/api';

export default function MeusProjetosAlunoPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [meusProjetos, setMeusProjetos] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [selectedProjectRegs, setSelectedProjectRegs] = useState([]);
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [editingRegistro, setEditingRegistro] = useState(null);
  const [editTexto, setEditTexto] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (user?.tipo !== 'aluno') {
      router.push('/home');
      return;
    }
    loadDados();
  }, [token, user]);

  const loadDados = async () => {
    setLoading(true);
    try {
      // Fetch projects for this aluno (backend will map by student's matricula)
      if (user?.id) {
        try {
          const res = await fetchWithApiKey(`${api.getApiUrl()}/selectmeusprojetos/${user.id}?tipo=aluno`);
          // endpoint returns project rows already
          setProjetos(res.data || []);
        } catch (err) {
          console.error('Erro ao carregar meus projetos:', err);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRelatorio = async (registroId, texto) => {
    try {
      await fetchWithAuth(`${api.getApiUrl()}/atualizarrelatorio/${registroId}`, {
        method: 'PUT',
        body: JSON.stringify({ relatorio: texto })
      });
      // update local copy
      setSelectedProjectRegs(prev => prev.map(r => r.id === registroId ? { ...r, relatorio: texto } : r));
      alert('Relatório atualizado com sucesso.');
    } catch (err) {
      console.error('Erro ao atualizar relatório:', err);
      alert('Erro ao atualizar relatório: ' + (err.message || ''));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />

      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">📚 Meus Projetos</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-2xl">⏳ Carregando...</div>
          </div>
        ) : projetos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Você não está vinculado a nenhum projeto ainda.</p>
            <p className="mt-2 text-sm">Procure por projetos disponíveis na página inicial.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projetos.map(p => (
                <div key={p.id} className="relative">
                  <ProjetoCard projeto={p} />
                  <div className="mt-2">
                    <button onClick={async () => {
                      // load registros for this project and open modal
                      try {
                        const res = await fetchWithApiKey(`${api.getApiUrl()}/selectregistros`);
                        const rows = (res.data || []).filter(r => r.id_projeto === p.id);
                        setSelectedProjectRegs(rows);
                        setSelectedProjectName(p.nome_projeto || 'Projeto');
                          setRegModalOpen(true);
                      } catch (err) {
                        console.error('Erro ao carregar registros:', err);
                      }
                    }} className="mt-2 bg-sky-600 text-white px-3 py-2 rounded text-sm">✏️ Editar Relatórios</button>
                  </div>
                </div>
            ))}
          </div>
        )}
        {regModalOpen && (
          <RegistroModal
            isOpen={regModalOpen}
            onClose={() => setRegModalOpen(false)}
            projectName={selectedProjectName}
            registros={selectedProjectRegs}
            currentUserId={user?.id}
            onEditSubmit={handleEditRelatorio}
          />
        )}
      </main>
    </div>
  );
}

// Add modal markup for registros and editing
export function RegistroModal({ isOpen, onClose, projectName, registros, currentUserId, onEditSubmit }) {
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [aluno, setAluno] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!isOpen) {
      setEditing(null);
      setEditText('');
    }
  }, [isOpen]);

  // fetch aluno once when modal opens so we can determine permissions synchronously
  useEffect(() => {
    let mounted = true;
    const fetchAluno = async () => {
      try {
        const res = await fetchWithApiKey(`${api.getApiUrl()}/selectaluno`);
        const arr = res.data || [];
        if (!mounted) return;
        const found = arr.find(a => a.usuario_id === currentUserId) || null;
        setAluno(found);
      } catch (err) {
        if (!mounted) return;
        setAluno(null);
      }
    };
    if (isOpen && currentUserId) fetchAluno();

    // update 'now' in real-time while modal is open (1s interval for live feel)
    let timer = null;
    if (isOpen) {
      setNow(new Date());
      timer = setInterval(() => setNow(new Date()), 1000);
    }

    return () => { mounted = false; if (timer) clearInterval(timer); };
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  const formatRemaining = (deadline) => {
    if (!deadline) return { text: 'Sem prazo definido', expired: true, soon: false };
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return { text: 'Data inválida', expired: true, soon: false };
    const diff = d - now;
    if (diff <= 0) return { text: 'Prazo expirado', expired: true, soon: false };
    const seconds = Math.floor(diff / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (days === 0 && hours === 0) parts.push(`${mins}m`);
    const soon = diff <= 24 * 3600 * 1000; // within 24 hours
    return { text: `${parts.join(' ')} restantes`, expired: false, soon };
  };

  const canEditSync = (r) => {
    if (!aluno) return false;
    const allowedTokens = r.relatorio_edit_allowed ? String(r.relatorio_edit_allowed).split(',').map(t => String(t).trim()).filter(Boolean) : [];
    if (allowedTokens.length === 0) return false;
    const idStr = String(aluno.id);
    const matStr = String(aluno.matricula_aluno);
    const deadline = r.relatorio_edit_deadline ? new Date(r.relatorio_edit_deadline) : null;
    if (!(allowedTokens.includes(idStr) || allowedTokens.includes(matStr))) return false;
    if (deadline && new Date() > deadline) return false;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-70" onClick={onClose} />
      <div className="relative z-10 max-w-3xl w-full mx-4 bg-white rounded shadow-lg p-6 h-5/6 overflow-y-auto">
        <h3 className="text-xl text-black font-bold mb-2">Registros — {projectName}</h3>
        <div className="space-y-3 max-h-full overflow-y-auto">
          {registros.length === 0 && <p className="text-sm text-black text-gray-500">Nenhum registro.</p>}
          {registros.map(r => {
            const deadline = r.relatorio_edit_deadline ? new Date(r.relatorio_edit_deadline) : null;
            const remaining = formatRemaining(deadline);
            const canEdit = canEditSync(r);

            const badgeColor = remaining.expired ? 'bg-red-100 text-red-700' : (remaining.soon ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800');

            const emoji = remaining.expired ? '⛔' : (remaining.soon ? '⚠️' : '⏰');

            return (
              <div key={r.id} className="border p-3 rounded">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-black">{r.titulo_reuniao}</div>
                    <div className="text-sm text-gray-600">{r.data_reuniao ? new Date(r.data_reuniao).toLocaleDateString('pt-BR') : ''}</div>
                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">{r.relatorio || '—'}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs rounded ${badgeColor}`}>
                        <span className="text-sm">{emoji}</span>
                        <span>{remaining.text}</span>
                      </span>
                      {r.relatorio_edit_deadline && (
                        <span className="ml-2 text-xs text-gray-500">até {new Date(r.relatorio_edit_deadline).toLocaleString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col gap-2 ">
                    <button onClick={() => {
                      if (!canEdit) return alert('Você não tem permissão para editar este relatório ou o prazo expirou.');
                      setEditing(r.id);
                      setEditText(r.relatorio || '');
                    }} disabled={!canEdit} className={`flex items-center gap-2 px-3 py-1 rounded ${canEdit ? 'bg-sky-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                      <span>{canEdit ? '✏️' : '🔒'}</span>
                      <span>{canEdit ? 'Editar' : 'Bloqueado'}</span>
                    </button>
                  </div>
                </div>
                {editing === r.id && (
                  <div className="mt-2 text-gray-700 text-sm">
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full border rounded p-2" rows={4} />
                    <div className="mt-2 flex gap-2">
                      <button onClick={async () => {
                        await onEditSubmit(r.id, editText);
                        setEditing(null);
                      }} className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded"><span>💾</span><span>Salvar</span></button>
                      <button onClick={() => setEditing(null)} className="flex items-center gap-2 bg-gray-600 px-3 py-1 rounded"><span>✖️</span><span>Cancelar</span></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 rounded">Fechar</button>
        </div>
      </div>
    </div>
  );
}

// Registro modal and edit UI injected at file bottom

