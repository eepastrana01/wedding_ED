import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog / Mobile Bottom Sheet */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-wedding-border overflow-hidden transform transition-all z-10 sm:my-auto max-h-[92vh] sm:max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200`}
      >
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden w-full flex items-center justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-3 sm:py-4 border-b border-wedding-border/60 bg-wedding-bg/60 shrink-0">
          <div>
            <h3 className="font-editorial text-lg sm:text-xl font-bold text-wedding-primaryDark leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 hover:bg-stone-100 p-2 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
}
