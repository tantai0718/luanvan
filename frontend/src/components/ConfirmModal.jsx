import { useState } from 'react';

export default function ConfirmModal({ isOpen, title, message, confirmText = 'Đồng ý', type = 'danger', onCancel, onConfirm }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const confirmBtnClass = type === 'danger'
    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
        <p className="text-text-secondary text-base leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-text-secondary bg-slate-100 hover:bg-slate-200 font-medium transition duration-200"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-white font-medium transition duration-200 shadow-sm ${confirmBtnClass} disabled:opacity-50`}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
