'use client';

import { useEffect, useState } from 'react';
import api, { fetchWithAuth, fetchWithApiKey, getApiUrl, getApiKey, setApiKey } from '../../lib/api';
import { useAuth } from '../../context/AuthProvider';

const resourceMap = {
  alunos: {list: '/selectaluno', post: '/inseriraluno', put: '/atualizaraluno', delete: '/deletealuno'},
  professores: {list: '/selectprofessor', post: '/inserirprofessor', put: '/atualizarprofessor', delete: '/deleteprofessor'},
  areas: {list: '/selectareas', post: '/inserirarea', put: '/atualizararea', delete: '/deletearea'},
  arquivos: {list: '/selectarquivos', post: '/inserirarquivo', put: '/atualizararquivo', delete: '/deletarquivos'},
  cursos: {list: '/selectcursos', post: '/inserircursos', put: '/atualizarcurso', delete: '/deletecurso'},
  custos: {list: '/selectcustos', post: '/inserircusto', put: '/atualizarcusto', delete: '/deletecusto'},
  meusprojetos: {list: '/selectmeusprojetos', post: '/inserirmeuprojeto', put: '/atualizarmeusprojeto', delete: '/deletemeusprojeto'},
  projetos: {list: '/selectprojetos', post: '/inserirprojeto', put: '/atualizarprojeto', delete: '/deleteprojeto'},
  registros: {list: '/selectregistros', post: '/inserirregistro', put: '/atualizarregistro', delete: '/deleteregistro'},
  turmas: {list: '/selectturmas', post: '/inserirturma', put: '/atualizarturma', delete: '/deleteturma'},
  usuarios: {list: '/selectusuarios', post: '/inserirusuario', put: '/atualizarusuario', delete: '/deleteusuario'}
};

const templates = {
  alunos: {
    insert: '{"nome_aluno":"Novo Aluno","matricula_aluno":20230001,"id_curso":1,"usuario_id":null,"telefone":""}',
    update: '{"nome_aluno":"Aluno Atualizado","matricula_aluno":20230001,"id_curso":1,"telefone":"9999999999"}'
  },
  professores: {
    insert: '{"nome_professor":"Novo Professor","matricula_professor":20210001,"id_area":1,"usuario_id":null,"telefone":""}',
    update: '{"nome_professor":"Professor Atualizado","matricula_professor":20210001,"id_area":1,"telefone":"9999999999"}'
  },
  cursos: {
    insert: '{"nome_curso":"Novo Curso","coordenador":"Coordenador","duracao":8,"descricao_curso":"Descrição"}',
    update: '{"nome_curso":"Curso Atualizado","coordenador":"Coordenador","duracao":8,"descricao_curso":"Descrição"}'
  },
  turmas: {
    insert: '{"cod_turma":"TUR-2024-01","turno":"Matutino","quantidade_alunos":30,"id_curso":1}',
    update: '{"cod_turma":"TUR-2024-01","turno":"Noturno","quantidade_alunos":35,"id_curso":1}'
  },
  areas: {
    insert: '{"nome_area":"Nova Área","codigo_area":999,"descricao_area":"Descrição da área"}',
    update: '{"nome_area":"Área Atualizada","codigo_area":999,"descricao_area":"Descrição atualizada"}'
  },
  usuarios: {
    insert: '{"nome_usuario":"novo.usuario","email":"novo@example.com","password":"senha123","ativo":true}',
    update: '{"nome_usuario":"usuario.atualizado","email":"atualizado@example.com","password":"novaSenha123","ativo":true}'
  },
  projetos: {
    insert: '{"nome_projeto":"Novo Projeto","orientador":1,"coorientador":"Dr. Silva","matricula_alunos":"2023001"}',
    update: '{"nome_projeto":"Projeto Atualizado","orientador":1,"coorientador":"Dr. Silva","matricula_alunos":"2023001,2023002"}'
  },
  custos: {
    insert: '{"id_projeto":1,"equipamento":"Equipamento","custos_equipamento":1000.00,"insumos":"Insumos","custos_insumos":500.00}',
    update: '{"id_projeto":1,"equipamento":"Equipamento Updated","custos_equipamento":1500.00,"insumos":"Insumos","custos_insumos":600.00}'
  }
};

export default function AdminPageFull() {
  const [activeTab, setActiveTab] = useState('alunos');
  const [method, setMethod] = useState({});
  const [idMap, setIdMap] = useState({});
  const [pageMap, setPageMap] = useState({});
  const [limitMap, setLimitMap] = useState({});
  const [bodyMap, setBodyMap] = useState({});
  const [formFieldsMap, setFormFieldsMap] = useState({});
  const [fileMap, setFileMap] = useState({});
  const [pretty, setPretty] = useState(true);
  const [history, setHistory] = useState([]);
  const [output, setOutput] = useState('Nenhuma requisição feita ainda.');
  const [responseStatus, setResponseStatus] = useState('-');
  const [responseTime, setResponseTime] = useState('-');
  const [loading, setLoading] = useState(false);
  const [fieldErrorsMap, setFieldErrorsMap] = useState({});
  const { logout } = useAuth();
  const [apiKey, setApiKeyState] = useState(() => getApiKey());

  function handleSaveApiKey() {
    try {
      setApiKey(apiKey);
      setOutput('API key salva localmente.');
    } catch (e) {
      setOutput('Erro ao salvar API key');
    }
  }

  function handleResetApiKey() {
    try {
      if (typeof window !== 'undefined') localStorage.removeItem('apiKey');
      const current = getApiKey();
      setApiKeyState(current);
      setOutput('API key restaurada para o padrão do ambiente.');
    } catch (e) {
      setOutput('Erro ao resetar API key');
    }
  }

  // Define simple schemas for resources to map fields to inputs
  const schemas = {
    alunos: [
      { name: 'nome_aluno', type: 'text', label: 'Nome do aluno' },
      { name: 'matricula_aluno', type: 'number', label: 'Matrícula' },
      { name: 'id_curso', type: 'number', label: 'ID do curso' },
      { name: 'usuario_id', type: 'number', label: 'ID do usuário' },
      { name: 'telefone', type: 'text', label: 'Telefone' }
    ],
    professores: [
      { name: 'nome_professor', type: 'text', label: 'Nome do professor' },
      { name: 'matricula_professor', type: 'number', label: 'Matrícula' },
      { name: 'id_area', type: 'number', label: 'ID da área' },
      { name: 'telefone', type: 'text', label: 'Telefone' }
    ],
    usuarios: [
      { name: 'nome_usuario', type: 'text', label: 'Nome do usuário' },
      { name: 'email', type: 'email', label: 'Email' },
      { name: 'password', type: 'password', label: 'Senha' },
      { name: 'ativo', type: 'checkbox', label: 'Ativo' }
    ],
    cursos: [
      { name: 'nome_curso', type: 'text', label: 'Nome do curso' },
      { name: 'coordenador', type: 'text', label: 'Coordenador' },
      { name: 'duracao', type: 'number', label: 'Duração (semestres)' },
      { name: 'descricao_curso', type: 'text', label: 'Descrição' }
    ],
    turmas: [
      { name: 'cod_turma', type: 'text', label: 'Código da turma' },
      { name: 'turno', type: 'text', label: 'Turno' },
      { name: 'quantidade_alunos', type: 'number', label: 'Quantidade de alunos' },
      { name: 'id_curso', type: 'number', label: 'ID do curso' }
    ],
    areas: [
      { name: 'nome_area', type: 'text', label: 'Nome da área' },
      { name: 'codigo_area', type: 'number', label: 'Código da área' },
      { name: 'descricao_area', type: 'text', label: 'Descrição' }
    ],
    projetos: [
      { name: 'nome_projeto', type: 'text', label: 'Nome do projeto' },
      { name: 'orientador', type: 'number', label: 'Orientador (ID)' },
      { name: 'coorientador', type: 'text', label: 'Coorientador' },
      { name: 'matricula_alunos', type: 'text', label: 'Matrículas (separadas por vírgula)' }
    ],
    custos: [
      { name: 'id_projeto', type: 'number', label: 'ID do projeto' },
      { name: 'equipamento', type: 'text', label: 'Equipamento' },
      { name: 'custos_equipamento', type: 'number', label: 'Custo do equipamento' },
      { name: 'insumos', type: 'text', label: 'Insumos' },
      { name: 'custos_insumos', type: 'number', label: 'Custo dos insumos' }
    ],
    meusprojetos: [
      { name: 'nome_projeto', type: 'text', label: 'Nome do projeto' },
      { name: 'usuarios', type: 'number', label: 'ID do usuário' },
      { name: 'data_publicacao', type: 'date', label: 'Data de publicação' },
      { name: 'area_de_pesquisa', type: 'text', label: 'Área de pesquisa' },
      { name: 'coordenador', type: 'text', label: 'Coordenador' }
    ],
    registros: [
      { name: 'id_projeto', type: 'number', label: 'ID do projeto' },
      { name: 'data_reuniao', type: 'date', label: 'Data da reunião' },
      { name: 'lista_participantes', type: 'text', label: 'Participantes' },
      { name: 'duracao_reuniao', type: 'text', label: 'Duração (HH:MM:SS)' },
      { name: 'titulo_reuniao', type: 'text', label: 'Título da reunião' }
    ],
    arquivos: [
      { name: 'projeto_id', type: 'number', label: 'ID do projeto (novo)' },
      { name: 'id_meuprojeto', type: 'number', label: 'ID do meu projeto (legado)' },
      { name: 'resumo', type: 'text', label: 'Resumo' },
      { name: 'justificativa', type: 'text', label: 'Justificativa' },
      { name: 'objetivo', type: 'text', label: 'Objetivo' },
      { name: 'sumario', type: 'text', label: 'Sumário' }
    ]
  };

  // Required fields per resource (based on backend validacoes)
  const requiredFields = {
    aluno: ['nome_aluno', 'matricula_aluno'],
    alunos: ['nome_aluno', 'matricula_aluno'],
    professor: ['nome_professor', 'matricula_professor'],
    professores: ['nome_professor', 'matricula_professor'],
    curso: ['nome_curso', 'coordenador'],
    cursos: ['nome_curso', 'coordenador'],
    usuario: ['nome_usuario', 'email', 'password'],
    usuarios: ['nome_usuario', 'email', 'password'],
    turma: ['cod_turma', 'turno'],
    turmas: ['cod_turma', 'turno'],
    area: ['nome_area', 'codigo_area'],
    areas: ['nome_area', 'codigo_area'],
    projeto: ['nome_projeto', 'orientador'],
    projetos: ['nome_projeto', 'orientador'],
    meuprojeto: ['nome_projeto', 'usuarios'],
    meusprojetos: ['nome_projeto', 'usuarios']
  };

  // Validation helpers (field-level validation and form sync)
  function validateResourceFields(resource, data) {
    const errors = {};
    const reqs = requiredFields[resource] || [];
    reqs.forEach(f => {
      if (data[f] === undefined || data[f] === null || data[f] === '') {
        errors[f] = 'Campo obrigatório';
      }
    });

    const schema = schemas[resource] || [];
    schema.forEach(field => {
      const val = data[field.name];
      if (val !== undefined && val !== null && val !== '') {
        if (field.type === 'number' && isNaN(Number(val))) {
          errors[field.name] = 'Deve ser um número';
        }
        if (field.type === 'email' && typeof val === 'string' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) {
          errors[field.name] = 'Email inválido';
        }
      }
    });

    return errors;
  }

  function setFormField(resource, fieldName, value) {
    setFormFieldsMap(prev => {
      const next = { ...(prev[resource] || {}), [fieldName]: value };
      const merged = { ...prev, [resource]: next };
      const errs = validateResourceFields(resource, next);
      setFieldErrorsMap(prevErr => ({ ...prevErr, [resource]: errs }));
      return merged;
    });
  }

  function setFormFromBody(resource) {
    try {
      const text = bodyMap[resource] || '{}';
      const obj = JSON.parse(text);
      setFormFieldsMap(prev => ({ ...prev, [resource]: obj }));
      const errs = validateResourceFields(resource, obj);
      setFieldErrorsMap(prevErr => ({ ...prevErr, [resource]: errs }));
    } catch (err) {
      setOutput('JSON inválido — não foi possível extrair para o formulário');
    }
  }

  function setBodyFromForm(resource) {
    const data = formFieldsMap[resource] || {};
    try {
      setBodyMap(prev => ({ ...prev, [resource]: JSON.stringify(data, null, 2) }));
      const errs = validateResourceFields(resource, data);
      setFieldErrorsMap(prevErr => ({ ...prevErr, [resource]: errs }));
    } catch (err) {
      setOutput('Erro ao construir JSON do formulário');
    }
  }

  useEffect(() => {
    // initialize defaults
    const resources = Object.keys(resourceMap);
    const m = {};
    const ids = {};
    const pages = {};
    const limits = {};
    const bodies = {};
    resources.forEach(r => {
      m[r] = 'GET';
      ids[r] = '';
      pages[r] = 1;
      limits[r] = 10;
      bodies[r] = templates[r] ? templates[r].insert : '{}';
    });
    setMethod(m);
    setIdMap(ids);
    setPageMap(pages);
    setLimitMap(limits);
    setBodyMap(bodies);
    // initialize form fields from templates when possible
    const forms = {};
    resources.forEach(r => {
      try {
        forms[r] = bodies[r] ? JSON.parse(bodies[r]) : {};
      } catch (e) {
        forms[r] = {};
      }
    });
    setFormFieldsMap(forms);
  }, []);

  function setBodyTemplate(resource, type) {
    setBodyMap(prev => ({ ...prev, [resource]: templates[resource] ? templates[resource][type] : '{}' }));
  }

  function clearOutput() {
    setOutput('Resposta limpa.');
    setResponseStatus('-');
    setResponseTime('-');
  }

  async function sendRequest(resource) {
    const map = resourceMap[resource];
    if (!map) return setOutput('Recurso desconhecido');

    const m = method[resource] || 'GET';
    const id = (idMap[resource] || '').trim();
    let url = getApiUrl() + (m === 'GET' ? map.list : (m === 'POST' ? map.post : (m === 'PUT' ? `${map.put}/${id}` : `${map.delete}/${id}`)));

    if ((m === 'PUT' || m === 'DELETE') && !id) return setOutput('⚠️ Informe o ID para PUT/DELETE');

    // Validar antes de enviar
    if (m === 'POST' || m === 'PUT') {
      if (schemas[resource]) {
        try {
          const parsed = bodyMap[resource] ? JSON.parse(bodyMap[resource]) : (formFieldsMap[resource] || {});
          const finalErrs = validateResourceFields(resource, parsed);
          if (Object.keys(finalErrs).length > 0) {
            setFieldErrorsMap(prev => ({ ...prev, [resource]: finalErrs }));
            setOutput('Corrija os erros do formulário antes de enviar');
            setLoading(false);
            return;
          }
        } catch (e) {
          setOutput('Erro ao validar formulário');
          setLoading(false);
          return;
        }
      }
    }

    setOutput('⏳ Enviando para: ' + url);
    setLoading(true);
    const start = Date.now();

    try {
      let opts = { method: m, headers: {} };

      // Handle arquivos upload with FormData if a file is selected
      if (resource === 'arquivos' && m === 'POST' && fileMap && fileMap.arquivos) {
        const fd = new FormData();
        fd.append('arquivo', fileMap.arquivos);
        // append JSON fields from bodyMap or formFieldsMap
        try {
          const json = bodyMap[resource] ? JSON.parse(bodyMap[resource]) : (formFieldsMap[resource] || {});
          Object.keys(json).forEach(k => {
            if (json[k] !== undefined && json[k] !== null) fd.append(k, json[k]);
          });
          // Ensure projeto_id is included if present in form
          if (formFieldsMap[resource]?.projeto_id) {
            fd.append('projeto_id', formFieldsMap[resource].projeto_id);
          }
        } catch (e) {
          const json = formFieldsMap[resource] || {};
          Object.keys(json).forEach(k => { if (json[k] !== undefined && json[k] !== null) fd.append(k, json[k]); });
          if (json.projeto_id) fd.append('projeto_id', json.projeto_id);
        }
        opts.body = fd;
      } else {
          if (m === 'POST' || m === 'PUT') {
            const text = bodyMap[resource] || '{}';
            try {
              // ensure valid JSON
              const parsed = JSON.parse(text);

              // validate required fields if schema lists them
              const reqs = requiredFields[resource];
              if (reqs && reqs.length > 0) {
                const missing = reqs.filter(f => parsed[f] === undefined || parsed[f] === null || parsed[f] === '');
                if (missing.length > 0) {
                  setOutput(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
                  setLoading(false);
                  return;
                }
              }

              opts.headers['Content-Type'] = 'application/json';
              opts.body = text;
            } catch (err) {
              setOutput('JSON inválido: corrija o payload antes de enviar');
              setLoading(false);
              return;
            }
          }
      }

      const fullUrl = url;
  // use fetchWithApiKey for GET (public read endpoints require API key)
  // use fetchWithAuth for POST/PUT/DELETE (protected write endpoints require JWT)
  const resp = m === 'GET' ? await fetchWithApiKey(fullUrl, opts) : await fetchWithAuth(fullUrl, opts);
      const end = Date.now();

      // fetchWithAuth throws on non-ok; so if we reach here it's ok
  // Pretty print JSON or show raw text
  const prettyOutput = typeof resp === 'object' ? (pretty ? JSON.stringify(resp, null, 2) : JSON.stringify(resp)) : String(resp);
  setOutput(prettyOutput);
  setResponseStatus('200 OK');
  setResponseTime(`${end - start}ms`);
      const newHist = [{ method: m, resource, id, status: 200, ok: true, time: new Date().toLocaleTimeString() }, ...history];
      setHistory(newHist.slice(0, 20));
    } catch (err) {
      const end = Date.now();
  // Show error nicely
  const errText = (err && typeof err === 'object') ? (err.message || JSON.stringify(err)) : String(err);
  setOutput(errText);
  setResponseStatus(err.status || 'Erro');
      setResponseTime(`${end - start}ms`);
      const newHist = [{ method: m, resource, id, status: err.status || 0, ok: false, time: new Date().toLocaleTimeString() }, ...history];
      setHistory(newHist.slice(0, 20));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <style jsx global>{`
        /* Paste of admin.html CSS adapted */
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #f0f2f5; color: #333; }
        header { background: #2c3e50; color: #fff; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        header h1 { margin: 0; font-size: 28px; }
        header p { margin: 8px 0 0; opacity: 0.9; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .box { background: #fff; border: 1px solid #e1e1e8; padding: 16px; border-radius: 8px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .tabs { display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid #e1e1e8; overflow-x: auto; }
        .tab { padding: 12px 16px; cursor: pointer; border: none; background: none; font-size: 14px; color: #666; border-bottom: 3px solid transparent; transition: all 0.3s; }
        .tab:hover { color: #2c3e50; }
        .tab.active { color: #2c3e50; border-bottom-color: #3498db; }
        label { display: block; margin: 12px 0 6px; font-weight: 600; color: #2c3e50; }
        textarea, input, select { width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 13px; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #3498db; box-shadow: 0 0 0 3px rgba(52,152,219,0.1); }
        .btn-primary { background: #3498db; color: #fff; padding: 10px 16px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-secondary { background: #95a5a6; color: #fff; padding: 10px 16px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-info { background: #1abc9c; color: #fff; font-size: 12px; padding: 6px 10px; border: none; border-radius:4px; }
        .row { display: flex; gap: 12px; }
        .row > * { flex: 1; }
        .output-box { background: #1e1e1e; color: #e0e0e0; padding: 16px; border-radius: 6px; border: 1px solid #333; overflow-x: auto; max-height: 400px; font-family: 'Courier New', monospace; font-size: 13px; white-space: pre-wrap; word-wrap: break-word; }
        .response-meta { display: flex; gap: 16px; margin-bottom: 12px; font-size: 12px; }
        .history-item { background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 8px; font-size: 12px; border-left: 4px solid #3498db; cursor: pointer; }
      `}</style>

      <header>
        <h1>🔧 Admin — Teste da API</h1>
        <p>Painel para testar endpoints da API (GET/POST/PUT/DELETE).</p>
      </header>

      <div className="container">
        <div className="box">
          <h3>🔑 API Key</h3>
          <p style={{ color: '#666', marginTop: 6 }}>Insira a API key usada para chamadas públicas (GET).</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input style={{ flex: 1 }} value={apiKey || ''} onChange={e => setApiKeyState(e.target.value)} placeholder="Cole a API Key aqui" />
            <button className="btn-info" onClick={handleSaveApiKey}>Salvar</button>
            <button className="btn-secondary" onClick={handleResetApiKey} style={{ marginLeft: 8 }}>Reset</button>
          </div>
        </div>
        <div className="box">
          <div className="tabs">
            {Object.keys(resourceMap).map(r => (
              <button key={r} className={`tab ${activeTab === r ? 'active' : ''}`} onClick={() => setActiveTab(r)}>{r}</button>
            ))}
          </div>

          <div>
            <h3 style={{ textTransform: 'capitalize' }}>{activeTab}</h3>
            <div className="row">
              <div style={{ flex: 1 }}>
                <label>Método</label>
                <select value={method[activeTab] || 'GET'} onChange={e => setMethod(prev => ({ ...prev, [activeTab]: e.target.value }))}>
                  <option value="GET">GET - Listar</option>
                  <option value="POST">POST - Criar</option>
                  <option value="PUT">PUT - Atualizar</option>
                  <option value="DELETE">DELETE - Deletar</option>
                </select>
              </div>
              <div style={{ width: 140 }}>
                <label>ID (para PUT/DELETE)</label>
                <input value={idMap[activeTab] || ''} onChange={e => setIdMap(prev => ({ ...prev, [activeTab]: e.target.value }))} placeholder="ex: 1" />
              </div>
            </div>

            <div className="row" style={{ marginTop: 10, display: (method[activeTab] || 'GET') === 'GET' ? 'flex' : 'none' }}>
                <div style={{ color: '#999', fontSize: '12px' }}>
                  <p>ℹ️ Endpoints de leitura agora retornam todos os registros (sem paginação no servidor).</p>
                </div>
              </div>

            <label style={{ marginTop: 12 }}>Payload JSON</label>
            <textarea rows={6} value={bodyMap[activeTab] || ''} onChange={e => setBodyMap(prev => ({ ...prev, [activeTab]: e.target.value }))} />

            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button className="btn-info" onClick={() => setBodyTemplate(activeTab, 'insert')}>📋 Inserir</button>
              <button className="btn-info" onClick={() => setBodyTemplate(activeTab, 'update')}>✏️ Atualizar</button>
              <button className="btn-info" onClick={() => setFormFromBody(activeTab)}>🔁 Extrair p/ formulário</button>
              <button className="btn-info" onClick={() => setBodyFromForm(activeTab)}>🧩 Preencher JSON do formulário</button>
            </div>

            {/* Auto-generated form fields if schema exists */}
            {schemas[activeTab] && schemas[activeTab].map(field => {
  const value = (formFieldsMap[activeTab] && formFieldsMap[activeTab][field.name]) ?? '';
  const errs = (fieldErrorsMap[activeTab] || {})[field.name];

  if (field.type === 'checkbox') {
    return (
      <label key={field.name} style={{ display: 'block', marginTop: 8 }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => setFormField(activeTab, field.name, e.target.checked)}
        />{' '}
        {field.label}
        {errs && <div style={{ color: 'red', fontSize: 12 }}>{errs}</div>}
      </label>
    );
  }

  return (
    <div key={field.name} style={{ marginTop: 8 }}>
      <label>{field.label}</label>
      <input
        value={value}
        type={field.type}
        onChange={e => {
          const v = field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
          setFormField(activeTab, field.name, v);
        }}
      />
      {errs && <div style={{ color: 'red', fontSize: 12 }}>{errs}</div>}
    </div>
  );
})}

            {/* File upload for arquivos */}
            {activeTab === 'arquivos' && (
              <div style={{ marginTop: 12 }}>
                <label>Projeto (ID)</label>
                <input 
                  type="number" 
                  value={formFieldsMap.arquivos?.projeto_id || ''} 
                  onChange={e => setFormField('arquivos', 'projeto_id', e.target.value)}
                  placeholder="ID do projeto" 
                />
                <label style={{ marginTop: 8, display: 'block' }}>📤 Arquivo para upload</label>
                <input type="file" onChange={e => setFileMap(prev => ({ ...prev, arquivos: e.target.files[0] }))} />
              </div>
            )}

            {/* Sync buttons between JSON and form */}
            <div style={{ marginTop: 12 }}>
              <button className="btn-info" onClick={() => setFormFromBody(activeTab)} style={{ marginRight: 8 }}>
                📋 JSON → Formulário
              </button>
              <button className="btn-info" onClick={() => setBodyFromForm(activeTab)}>
                📝 Formulário → JSON
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              {(() => {
                const errors = fieldErrorsMap[activeTab] || {};
                const hasErrors = Object.keys(errors).length > 0;
                return (
                  <>
                    <button 
                      className="btn-primary" 
                      onClick={() => sendRequest(activeTab)} 
                      disabled={loading || hasErrors}
                      title={hasErrors ? 'Corrija os erros no formulário antes de enviar' : 'Enviar requisição'}
                    >
                      Enviar {hasErrors && `(${Object.keys(errors).length} erro${Object.keys(errors).length > 1 ? 's' : ''})`}
                    </button>
                  </>
                );
              })()}
              <button className="btn-secondary" onClick={clearOutput} style={{ marginLeft: 8 }}>Limpar</button>
              <button className="btn-secondary" onClick={() => logout()} style={{ marginLeft: 8 }}>Logout</button>
            </div>
          </div>
        </div>

        <div className="box">
          <h3>📊 Resposta</h3>
          <div className="response-meta">
            <span>Status: <strong>{responseStatus}</strong></span>
            <span>Tempo: {responseTime}</span>
            <span>
              <button className="btn-info" onClick={() => { try { navigator.clipboard.writeText(output); } catch (e) {} }}>Copiar</button>
              <button className="btn-info" style={{ marginLeft: 8 }} onClick={() => setPretty(p => !p)}>{pretty ? 'Raw' : 'Pretty'}</button>
            </span>
          </div>
          <div className="output-box">{output}</div>
        </div>

        <div className="box">
          <h3>📜 Histórico de Requisições</h3>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {history.length === 0 ? <p style={{ color: '#999' }}>Nenhuma requisição ainda.</p> : history.map((h, i) => (
              <div key={i} className="history-item" onClick={() => alert(`${h.method} /${h.resource}${h.id ? ' #' + h.id : ''} — ${h.status}`)}>
                <strong>{h.method}</strong> /{h.resource}{h.id ? `#${h.id}` : ''} — {h.status} {h.ok ? '✅' : '❌'} às {h.time}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
