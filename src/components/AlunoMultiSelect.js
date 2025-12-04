 'use client';

import { useEffect, useState } from 'react';

export default function AlunoMultiSelect({ alunos = [], value = [], onChange }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());

  // value may be an array of aluno ids OR matricula numbers. Map incoming values to aluno ids when possible.
  useEffect(() => {
    const vals = Array.isArray(value) ? value.map(String) : [];
    const s = new Set();
    vals.forEach(v => {
      // try to find matching aluno by id or matricula
      const found = alunos.find(a => String(a.id) === v || String(a.matricula_aluno) === v || String(a.matricula) === v);
      if (found && found.id != null) s.add(String(found.id));
      else s.add(v);
    });
    setSelected(s);
  }, [value, alunos]);

  const toggle = (id) => {
    const s = new Set(selected);
    const sid = String(id);
    if (s.has(sid)) s.delete(sid);
    else s.add(sid);
    setSelected(s);
    // emit array of selected aluno ids (or tokens when not resolved)
    onChange && onChange(Array.from(s));
  };

  const filtered = alunos.filter(a => {
    if (!search) return true;
    const s = String(search).toLowerCase();
    const nome = String(a.nome_aluno || a.nome || '').toLowerCase();
    const mat = String(a.matricula_aluno || a.matricula || '').toLowerCase();
    const idStr = String(a.id || '').toLowerCase();
    return nome.includes(s) || mat.includes(s) || idStr.includes(s);
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Pesquisar por nome ou matrícula..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded"
      />

      <div className="max-h-48 overflow-auto border border-gray-200 rounded p-2 bg-white">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500">Nenhum aluno encontrado.</div>
        ) : (
          filtered.map(a => {
            const id = String(a.id);
            const label = (a.nome_aluno || a.nome || `Aluno ${a.id}`) + (a.matricula_aluno ? ` — ${a.matricula_aluno}` : '');
            const checked = selected.has(id) || selected.has(String(a.matricula_aluno)) || selected.has(String(a.matricula));
            return (
              <label key={id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                <input type="checkbox" checked={checked} onChange={() => toggle(id)} />
                <span className="text-sm">{label}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
