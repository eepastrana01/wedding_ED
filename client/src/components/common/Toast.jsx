import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useWedding } from '../../context/WeddingContext';

export function Toast() {
  const { toastMessage, setToastMessage } = useWedding();

  if (!toastMessage) return null;

  const { message, type } = toastMessage;

  const icons = {
    success: <CheckCircle2 className="text-emerald-600" size={18} />,
    error: <AlertCircle className="text-rose-600" size={18} />,
    info: <Info className="text-blue-600" size={18} />
  };

  const bgClasses = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900'
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-bounce-short bg-white/95 max-w-sm">
      {icons[type] || icons.success}
      <p className="text-xs sm:text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => setToastMessage(null)}
        className="text-stone-400 hover:text-stone-600 p-0.5"
      >
        <X size={16} />
      </button>
    </div>
  );
}
