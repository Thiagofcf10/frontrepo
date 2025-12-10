"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { fetchWithApiKey } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function ArquivoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [arquivo, setArquivo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const resp = await fetchWithApiKey(`${api.getApiUrl()}/selectarquivos/${id}`);
        // resp.data is the arquivo object according to our new endpoint
        setArquivo(resp.data || null);
      } catch (e) {
        console.error('Erro ao carregar arquivo:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // fetch text file content when arquivo is loaded and is text
  useEffect(() => {
    let mounted = true;
    const loadContent = async () => {
      if (!arquivo) return;
      if (!isTextFile(arquivo.caminho_arquivo, arquivo.tipo_mime || arquivo.mimetype)) return;
      try {
        const url = downloadLink(arquivo.caminho_arquivo);
        const res = await fetch(url);
        const txt = await res.text();
        if (!mounted) return;
        setFileContent(txt);
      } catch (err) {
        if (!mounted) return;
        setFileContent('Erro ao carregar conteúdo do arquivo.');
      }
    };
    setFileContent(null);
    loadContent();
    return () => { mounted = false; };
  }, [arquivo]);

  const downloadLink = (caminho) => {
    if (!caminho) return '#';
    const parts = caminho.split('/');
    const filename = parts[parts.length - 1];
    return `${api.getApiUrl()}/downloadarquivo/${encodeURIComponent(filename)}`;
  };

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return '—';
    // If bytes is already a human readable string (contains letters), return as-is
    if (typeof bytes === 'string' && /[a-zA-Z]/.test(bytes)) return bytes;
    const b = Number(bytes);
    if (isNaN(b)) return String(bytes || '—');
    const units = ['B','KB','MB','GB','TB'];
    let i = 0; let val = b;
    while (val >= 1024 && i < units.length-1) { val /= 1024; i++; }
    return `${val.toFixed( i===0 ? 0 : 2 )} ${units[i]}`;
  };

  const isImage = (name) => /\.(png|jpe?g|gif|bmp|webp)$/i.test(name || '');
  const isPDF = (name) => /\.pdf$/i.test(name || '');
  const isTextFile = (name, mime) => {
    if (mime && /^text\//.test(String(mime))) return true;
    return /\.(txt|md|csv|json|xml)$/i.test(name || '');
  };

  const [fileContent, setFileContent] = useState(null);
  const [resumoExpanded, setResumoExpanded] = useState(false);
  const [pdfViewable, setPdfViewable] = useState(null); // null=checking, true/false

  // Check if PDF can be previewed (try a fetch to verify availability/CORS)
  useEffect(() => {
    let mounted = true;
    const checkPdf = async () => {
      if (!arquivo || !isPDF(arquivo.caminho_arquivo)) { setPdfViewable(null); return; }
      setPdfViewable(null);
      try {
        const url = downloadLink(arquivo.caminho_arquivo);
        const res = await fetch(url, { method: 'GET', cache: 'no-cache' });
        if (!mounted) return;
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.toLowerCase().includes('pdf')) setPdfViewable(true);
        else setPdfViewable(false);
      } catch (err) {
        if (!mounted) return;
        setPdfViewable(false);
      }
    };
    checkPdf();
    return () => { mounted = false; };
  }, [arquivo]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      <main className="flex-1 p-8">
        {loading ? (
          <div>⏳ Carregando...</div>
        ) : !arquivo ? (
          <div>Arquivo não encontrado. <button onClick={() => router.back()} className="text-blue-600">Voltar</button></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: preview */}
            <div className="lg:col-span-2 bg-white rounded shadow p-6">
              <div className="flex items-start gap-6">
                <div className="w-48 flex-shrink-0">
                  {isImage(arquivo.caminho_arquivo) ? (
                    <img src={downloadLink(arquivo.caminho_arquivo)} alt={arquivo.nome_arquivo} className="w-48 h-48 object-cover rounded" />
                  ) : isPDF(arquivo.caminho_arquivo) ? (
                    <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center text-gray-500">PDF</div>
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center text-gray-500">Arquivo</div>
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-800">{arquivo.nome_arquivo || 'Arquivo'}</h1>
                  <div className="mt-3 text-sm text-gray-600 space-y-2">
                    {arquivo.resumo && (
                      <div>
                        <strong>Resumo:</strong>
                        <div className={`mt-1 text-gray-700 ${resumoExpanded ? '' : 'max-h-20 overflow-hidden'}`}>
                          <p>{arquivo.resumo}</p>
                        </div>
                        {String(arquivo.resumo).length > 280 && (
                          <button onClick={() => setResumoExpanded(!resumoExpanded)} className="mt-1 text-xs text-blue-600">{resumoExpanded ? 'Mostrar menos' : 'Mostrar mais'}</button>
                        )}
                      </div>
                    )}
                    {arquivo.objetivo && <p><strong>Objetivo:</strong> {arquivo.objetivo}</p>}
                    {arquivo.sumario && <p><strong>Sumário:</strong> {arquivo.sumario}</p>}
                    {arquivo.introducao && <p><strong>Introdução:</strong> {arquivo.introducao}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Conteúdo</h2>
                {isPDF(arquivo.caminho_arquivo) ? (
                  pdfViewable === null ? (
                    <div className="p-6 rounded border bg-yellow-50 text-yellow-800">Verificando pré-visualização do PDF...</div>
                  ) : pdfViewable === true ? (
                    <iframe title="PDF preview" src={downloadLink(arquivo.caminho_arquivo)} className="w-full h-[650px] rounded border" />
                  ) : (
                    <div className="p-6 rounded border bg-gray-50 text-gray-600">Pré-visualização do PDF não está disponível neste navegador/servidor. Use o botão de download para obter o arquivo.</div>
                  )
                ) : isImage(arquivo.caminho_arquivo) ? (
                  <img src={downloadLink(arquivo.caminho_arquivo)} alt={arquivo.nome_arquivo} className="w-full rounded border" />
                ) : isTextFile(arquivo.caminho_arquivo, arquivo.tipo_mime || arquivo.mimetype) ? (
                  <div className="p-4 rounded border bg-gray-50">
                    {fileContent === null ? (
                      <div className="text-gray-500">Carregando conteúdo...</div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">{fileContent}</pre>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded border bg-gray-50 text-gray-600">Pré-visualização não disponível para este tipo de arquivo. Use o botão de download para obter o arquivo.</div>
                )}
              </div>
            </div>

            {/* Right: metadata + actions */}
            <aside className="bg-white rounded shadow p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-sm text-gray-500">Detalhes do arquivo</h3>
                <div className="mt-2 text-sm text-gray-800 space-y-1">
                  <div><strong>Nome:</strong> {arquivo.nome_arquivo || '—'}</div>
                  <div><strong>Enviado por:</strong> {arquivo.usuario_id || arquivo.usuario || '—'}</div>
                  <div><strong>Data:</strong> {arquivo.created_at ? new Date(arquivo.created_at).toLocaleString('pt-BR') : '—'}</div>
                  <div><strong>Tamanho:</strong> {formatBytes(arquivo.tamanho || arquivo.size || arquivo.size_bytes || arquivo.bytes)}</div>
                </div>
              </div>

              <div className="mt-2">
                <h3 className="text-sm text-gray-500">Ações</h3>
                <div className="mt-3 flex flex-col gap-3">
                  <a href={downloadLink(arquivo.caminho_arquivo)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold">⤓ Baixar</a>
                </div>
              </div>

            
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
