'use client';

export default function Modal({ isOpen, title, children, onClose, confirmText = 'Confirmar', onConfirm, loading = false }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-4">{children}</div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              disabled={loading}
            >
              Cancelar
            </button>
            {onConfirm && (
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Carregando...' : confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
