import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Wallet, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Plus, RotateCcw } from 'lucide-react';

export function CashOnHandModal({
  isOpen,
  onClose,
  initialAmount = 0,
  pendingExpenseBalance = 0,
  onSave,
}) {
  const [amountStr, setAmountStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmountStr(initialAmount > 0 ? String(initialAmount) : '');
    }
  }, [isOpen, initialAmount]);

  const parsedAmount = Math.max(0, parseFloat(amountStr) || 0);
  const difference = parsedAmount - pendingExpenseBalance;
  const isCovered = difference >= 0;
  const deficit = Math.max(0, pendingExpenseBalance - parsedAmount);
  const surplus = Math.max(0, difference);
  const coveragePercent =
    pendingExpenseBalance > 0
      ? Math.min(100, Math.round((parsedAmount / pendingExpenseBalance) * 100))
      : 100;

  const handleAddShortcut = (add) => {
    const next = (parseFloat(amountStr) || 0) + add;
    setAmountStr(String(next));
  };

  const handleReset = () => {
    setAmountStr('0');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSave(parsedAmount);
      onClose();
    } catch {
      // Error handled by context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Balance en Mano (Dinero Disponible)"
      subtitle="Registra el total de ahorros o fondos que tienen en mano para la boda"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        {/* Input de Dinero en Mano */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            Dinero / Fondos en Mano (HNL)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-editorial text-lg sm:text-xl font-bold text-emerald-800 select-none">
              L.
            </span>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              autoFocus
              className="w-full pl-11 pr-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl font-editorial text-2xl sm:text-3xl font-bold text-stone-900 focus:outline-hidden transition-all placeholder:text-stone-300"
            />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Ingresa la cantidad total de dinero que tienen guardado o en cuenta bancaria para la boda.
          </p>
        </div>

        {/* Botones de incremento rápido */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mr-1">
            Sumar rápido:
          </span>
          <button
            type="button"
            onClick={() => handleAddShortcut(1000)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={11} />
            <span>L. 1,000</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddShortcut(5000)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={11} />
            <span>L. 5,000</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddShortcut(10000)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={11} />
            <span>L. 10,000</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer ml-auto"
            title="Poner en 0"
          >
            <RotateCcw size={11} />
            <span>Limpiar</span>
          </button>
        </div>

        {/* Live Calculation Simulation Card */}
        <div
          className={`rounded-2xl border p-4 space-y-3 transition-all ${
            isCovered
              ? 'bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40 border-emerald-300'
              : 'bg-gradient-to-br from-amber-50/70 via-white to-rose-50/40 border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-stone-500 uppercase tracking-wider text-[10px]">
              Cálculo en Tiempo Real
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isCovered
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {isCovered ? (
                <>
                  <CheckCircle2 size={12} className="text-emerald-700" />
                  <span>Meta Cubierta ({coveragePercent}%)</span>
                </>
              ) : (
                <>
                  <AlertCircle size={12} className="text-amber-700" />
                  <span>Falta Dinero ({coveragePercent}% cubierto)</span>
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-y border-stone-200/60 py-2.5">
            <div>
              <p className="text-stone-400 text-[10px] uppercase font-semibold">Saldo Pendiente Real</p>
              <p className="font-editorial text-base sm:text-lg font-bold text-stone-800">
                L. {pendingExpenseBalance.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-stone-400 text-[10px] uppercase font-semibold">Dinero en Mano</p>
              <p className="font-editorial text-base sm:text-lg font-bold text-emerald-700">
                L. {parsedAmount.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Resultado: Cuánto falta o Superávit */}
          <div className="flex items-center justify-between pt-0.5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                {isCovered ? 'Superávit / Colchón Disponible:' : '¿Cuánto nos hace falta?:'}
              </span>
              <p
                className={`font-editorial text-xl sm:text-2xl font-bold leading-tight ${
                  isCovered ? 'text-emerald-700' : 'text-amber-800'
                }`}
              >
                {isCovered
                  ? `+ L. ${surplus.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `Faltan L. ${deficit.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>

            {/* Progress indicator */}
            <div className="text-right">
              <span className="text-[10px] text-stone-500 font-medium block">
                Cobertura
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-stone-800">
                {coveragePercent}%
              </span>
            </div>
          </div>

          {/* Mini Progress Bar */}
          <div className="w-full bg-stone-200/80 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCovered ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
        </div>

        {/* Sincronización Nota */}
        <p className="text-[11px] text-stone-500 bg-stone-50 rounded-xl p-2.5 border border-stone-200/70 text-center">
          ☁️ Este balance se sincroniza automáticamente en la nube para ambos (Edis y Dania) en cualquier computadora o teléfono.
        </p>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-wedding-primary hover:bg-wedding-primaryLight text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Wallet size={16} />
            <span>{isSubmitting ? 'Guardando...' : 'Guardar Balance'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
