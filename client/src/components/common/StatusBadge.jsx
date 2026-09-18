import React from 'react';
import { STATUS_CONFIG } from '../../constants/weddingConstants';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export function StatusBadge({ status = 'pending', className = '', size = 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  
  const iconSize = size === 'sm' ? 12 : 14;
  const textSize = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-all ${config.color} ${textSize} ${className}`}
    >
      {status === 'confirmed' && <CheckCircle2 size={iconSize} className="text-emerald-600 shrink-0" />}
      {status === 'pending' && <Clock size={iconSize} className="text-amber-600 shrink-0" />}
      {status === 'declined' && <XCircle size={iconSize} className="text-rose-600 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}

export function StatusToggleButtons({ currentStatus, onChange, disabled = false, size = 'md' }) {
  const isSmall = size === 'sm';

  return (
    <div className="inline-flex items-center p-0.5 bg-stone-100/90 rounded-xl border border-stone-200 select-none shadow-2xs">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('confirmed')}
        title="Confirmar asistencia"
        className={`flex items-center justify-center gap-1 font-semibold rounded-lg transition-all duration-150 active:scale-95 ${
          isSmall
            ? 'min-h-[32px] px-2 text-xs'
            : 'min-h-[38px] sm:min-h-[34px] px-3 sm:px-2.5 text-xs'
        } ${
          currentStatus === 'confirmed'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-stone-600 hover:text-emerald-700 hover:bg-emerald-50/60'
        }`}
      >
        <CheckCircle2 size={isSmall ? 13 : 15} className="shrink-0" />
        <span>Sí</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('pending')}
        title="Marcar como pendiente"
        className={`flex items-center justify-center gap-1 font-semibold rounded-lg transition-all duration-150 active:scale-95 ${
          isSmall
            ? 'min-h-[32px] px-2 text-xs'
            : 'min-h-[38px] sm:min-h-[34px] px-3 sm:px-2.5 text-xs'
        } ${
          currentStatus === 'pending'
            ? 'bg-amber-500 text-white shadow-xs'
            : 'text-stone-600 hover:text-amber-700 hover:bg-amber-50/60'
        }`}
      >
        <Clock size={isSmall ? 13 : 15} className="shrink-0" />
        <span>Pend</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('declined')}
        title="Marcar como no asiste"
        className={`flex items-center justify-center gap-1 font-semibold rounded-lg transition-all duration-150 active:scale-95 ${
          isSmall
            ? 'min-h-[32px] px-2 text-xs'
            : 'min-h-[38px] sm:min-h-[34px] px-3 sm:px-2.5 text-xs'
        } ${
          currentStatus === 'declined'
            ? 'bg-rose-600 text-white shadow-xs'
            : 'text-stone-600 hover:text-rose-700 hover:bg-rose-50/60'
        }`}
      >
        <XCircle size={isSmall ? 13 : 15} className="shrink-0" />
        <span>No</span>
      </button>
    </div>
  );
}
