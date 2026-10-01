import React, { useEffect } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { useWeddingCountdown } from '../../hooks/useWeddingCountdown';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Heart, 
  Calendar, 
  Clock, 
  X, 
  PartyPopper, 
  Maximize2, 
  CalendarPlus, 
  Download 
} from 'lucide-react';

export function CountdownModal({ isOpen, onClose }) {
  const { setActiveTab } = useWedding();
  const {
    days,
    hours,
    minutes,
    seconds,
    totalWeeks,
    totalHours,
    progress,
    formattedDate,
    formattedTime,
    getGoogleCalendarUrl,
    downloadIcsFile,
  } = useWeddingCountdown();

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

  const handleCelebrate = () => {
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#C5A880', '#1F3A2E', '#F3ECE1', '#E5A93B', '#D9777F', '#FFFFFF'],
    });
  };

  const handleGoToFullView = () => {
    setActiveTab('countdown');
    onClose();
  };

  const units = [
    { label: 'DÍAS', value: days },
    { label: 'HORAS', value: hours },
    { label: 'MINUTOS', value: minutes },
    { label: 'SEGUNDOS', value: seconds, isLive: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/60 backdrop-blur-sm transition-all overflow-y-auto animate-in fade-in duration-200">
      
      {/* Click outside to close */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-xl bg-white rounded-3xl border-2 border-amber-200/90 shadow-2xl overflow-hidden z-10 p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-amber-100/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer z-20"
        >
          <X size={20} />
        </button>

        {/* Content Header */}
        <div className="text-center relative z-10 flex flex-col items-center">
          
          {/* Monogram Medallion */}
          <div className="w-14 h-14 rounded-full p-0.5 bg-linear-to-tr from-amber-300 via-amber-400 to-wedding-primary shadow-md mb-3">
            <div className="w-full h-full rounded-full bg-[#FAF7F2] border border-amber-200 flex items-center justify-center">
              <span className="font-editorial font-bold text-wedding-primaryDark text-sm tracking-widest pl-0.5">
                E<span className="text-amber-600 font-serif italic mx-0.5">&</span>D
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 border border-amber-300/60 text-[11px] font-bold tracking-wider uppercase mb-2">
            <Sparkles size={12} className="text-amber-700" />
            <span>Cuenta Regresiva Oficial</span>
          </span>

          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-wedding-primaryDark">
            Falta muy poco para el «Sí, Acepto»
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 mt-1 flex items-center gap-1.5 justify-center">
            <Calendar size={14} className="text-wedding-primary" />
            <span className="font-semibold text-stone-800">{formattedDate}</span>
            <span className="text-stone-300">•</span>
            <Clock size={14} className="text-amber-700" />
            <span className="font-semibold text-stone-800">{formattedTime}</span>
          </p>
        </div>

        {/* 4 Countdown Digits */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 my-6 relative z-10">
          {units.map((unit) => (
            <div
              key={unit.label}
              className={`p-3 sm:p-4 rounded-2xl text-center bg-linear-to-b from-[#FCFAF6] to-[#F6EFE6] border ${
                unit.isLive ? 'border-amber-400 shadow-md' : 'border-amber-200/80 shadow-2xs'
              }`}
            >
              <span className="font-editorial text-3xl sm:text-4xl font-extrabold text-wedding-primaryDark block select-none">
                {String(unit.value).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/50 px-2 py-0.5 rounded-full inline-block mt-1">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Mini Bar */}
        <div className="relative z-10 mb-6 bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-stone-600 flex items-center gap-1">
              <Heart size={12} className="text-wedding-rose fill-wedding-rose" />
              Camino al Altar ({totalWeeks} semanas restantes)
            </span>
            <span className="font-bold text-amber-900">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-wedding-primary via-emerald-600 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Actions in Modal */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleCelebrate}
            className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Celebrar Momento ✨</span>
          </button>

          <button
            type="button"
            onClick={handleGoToFullView}
            className="flex items-center justify-center gap-1.5 bg-wedding-primary hover:bg-wedding-primaryLight text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Maximize2 size={15} />
            <span>Ver Pantalla Completa</span>
          </button>
        </div>

        {/* Quick Calendar Links */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-center gap-3 text-xs">
          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-600 hover:text-amber-800 font-semibold flex items-center gap-1 underline underline-offset-2"
          >
            <CalendarPlus size={13} />
            <span>Google Calendar</span>
          </a>
          <span className="text-stone-300">•</span>
          <button
            type="button"
            onClick={downloadIcsFile}
            className="text-stone-600 hover:text-emerald-800 font-semibold flex items-center gap-1 underline underline-offset-2 cursor-pointer"
          >
            <Download size={13} />
            <span>Descargar .ics</span>
          </button>
        </div>

      </div>
    </div>
  );
}
