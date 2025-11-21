'use client';

export default function ProjetoCard({ projeto, onEdit, onDelete, showActions = false }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <h3 className="text-lg font-bold text-gray-800">{projeto.nome_projeto}</h3>
      
      <div className="mt-3 text-sm text-gray-600 space-y-1">
        <p><strong>Orientador ID:</strong> {projeto.orientador}</p>
        <p><strong>Coorientador:</strong> {projeto.coorientador || 'N/A'}</p>
        <p><strong>Alunos:</strong> {projeto.matricula_alunos || 'N/A'}</p>
        {projeto.created_at && (
          <p><strong>Criado:</strong> {new Date(projeto.created_at).toLocaleDateString('pt-BR')}</p>
        )}
      </div>

      {showActions && (
        <div className="mt-4 flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(projeto.id)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-sm"
            >
              ✏️ Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(projeto.id)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm"
            >
              🗑️ Deletar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
