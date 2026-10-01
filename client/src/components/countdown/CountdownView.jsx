import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { useWeddingCountdown } from '../../hooks/useWeddingCountdown';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Heart, 
  Calendar, 
  Clock, 
  CalendarPlus, 
  Download, 
  Users, 
  Home, 
  Mail, 
  CheckCircle2, 
  Share2, 
  Check, 
  ArrowRight,
  Flame,
  Music,
  MapPin,
  PartyPopper
} from 'lucide-react';

export function CountdownView() {
  const { stats, invitationCards, taskMetrics, setActiveTab } = useWedding();
  const {
    days,
    hours,
    minutes,
    seconds,
    totalWeeks,
    totalHours,
    totalMinutes,
    totalSeconds,
    progress,
    isPassed,
    formattedDate,
    formattedTime,
    getGoogleCalendarUrl,
    downloadIcsFile,
  } = useWeddingCountdown();

  const [copiedLink, setCopiedLink] = useState(false);
  const [celebrateCount, setCelebrateCount] = useState(0);

  // Celebración épica con ráfaga multicolor y dorada de confeti
  const handleCelebrate = () => {
    setCelebrateCount((prev) => prev + 1);

    // Primera ráfaga: Centro
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.65 },
      colors: ['#C5A880', '#1F3A2E', '#F3ECE1', '#E5A93B', '#D9777F', '#FFFFFF'],
    });

    // Segunda ráfaga: Laterales sincronizados
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 60,
        origin: { x: 0.1, y: 0.7 },
        colors: ['#C5A880', '#E5A93B', '#FAF7F2'],
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 60,
        origin: { x: 0.9, y: 0.7 },
        colors: ['#1F3A2E', '#2D5342', '#D9777F'],
      });
    }, 250);
  };

  const handleShareWedding = () => {
    const text = `¡Faltan solo ${days} días para nuestra boda! Sábado, 21 de Noviembre de 2026 a las 4:30 PM. 💍✨ E & D`;
    if (navigator.share) {
      navigator.share({
        title: 'Nuestra Boda • E & D',
        text: text,
        url: window.location.origin,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const countdownUnits = [
    { label: 'DÍAS', value: days, subtitle: 'días de ilusión' },
    { label: 'HORAS', value: hours, subtitle: 'horas restantes' },
    { label: 'MINUTOS', value: minutes, subtitle: 'minutos vivos' },
    { label: 'SEGUNDOS', value: seconds, subtitle: 'segundos y contando', isLive: true },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* ========================================================
          HERO BANNER PRINCIPAL: MEDALLÓN MONOGRAMA & PRESENTACIÓN
          ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-[#FCFAF6] to-[#F6EFE6] border-2 border-amber-200/90 shadow-luxury p-6 sm:p-10 text-center">
        {/* Adorno decorativo de esquinas doradas */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-amber-200/40 via-transparent to-transparent pointer-events-none rounded-tl-3xl" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-amber-200/40 via-transparent to-transparent pointer-events-none rounded-br-3xl" />
        <div className="absolute top-4 right-6 text-amber-200/40 select-none pointer-events-none hidden sm:block">
          <Sparkles size={48} />
        </div>
        <div className="absolute bottom-4 left-6 text-emerald-200/30 select-none pointer-events-none hidden sm:block">
          <Heart size={44} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          
          {/* Medallón Monograma de Lujo E & D */}
          <div className="relative mb-5 group">
            {/* Halo radiante animado */}
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-wedding-primary opacity-65 blur-xs group-hover:opacity-100 transition duration-500 animate-pulse" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-amber-200 via-amber-400 to-wedding-primary shadow-xl">
              <div className="w-full h-full rounded-full bg-[#FAF7F2] border-2 border-amber-200 flex flex-col items-center justify-center shadow-inner">
                <span className="font-editorial font-bold text-wedding-primaryDark text-xl sm:text-2xl tracking-widest pl-1 leading-none">
                  E<span className="text-amber-600 font-serif italic mx-1">&</span>D
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-amber-800/80 font-bold mt-1">
                  21 • NOV
                </span>
              </div>
            </div>
          </div>

          {/* Badge Oficial */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 border border-amber-300/80 text-amber-900 text-xs font-bold tracking-wider uppercase mb-3 shadow-2xs">
            <Sparkles size={14} className="text-amber-700 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Cuenta Regresiva Oficial de Nuestra Boda</span>
            <Sparkles size={14} className="text-amber-700 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          {/* Título Principal */}
          <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-wedding-primaryDark leading-tight sm:leading-tight">
            Cada Segundo Nos Acerca al <span className="italic text-amber-800">«Sí, Acepto»</span>
          </h1>

          {/* Fecha y Hora de la Ceremonia */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-stone-700 font-medium text-sm sm:text-base">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-stone-200 shadow-2xs">
              <Calendar size={16} className="text-wedding-primary" />
              <strong className="text-stone-900">{formattedDate}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-stone-200 shadow-2xs">
              <Clock size={16} className="text-amber-700" />
              <strong className="text-stone-900">{formattedTime}</strong> (Ceremonia)
            </span>
          </div>

          {/* Cita Romántica en Monotype Corsiva */}
          <div className="mt-5 max-w-xl mx-auto px-4 py-2.5 rounded-2xl bg-white/60 border border-amber-200/60 shadow-2xs">
            <p className="font-corsiva text-lg sm:text-xl text-stone-700 italic leading-relaxed">
              «El amor no se mira con los ojos, sino con el corazón... y el nuestro late al ritmo de este día tan esperado.»
            </p>
          </div>

        </div>
      </div>

      {/* ========================================================
          LOS 4 GRANDES RELOJES / DÍGITOS ÉPICOS
          ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5">
        {countdownUnits.map((unit, index) => {
          return (
            <div
              key={unit.label}
              className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 text-center transition-all duration-300 bg-gradient-to-b from-white via-white to-amber-50/60 border-2 ${
                unit.isLive
                  ? 'border-amber-400 shadow-xl shadow-amber-900/10 scale-[1.01]'
                  : 'border-amber-200/90 shadow-lg shadow-stone-900/5 hover:border-amber-300'
              }`}
            >
              {/* Resplandor suave superior */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-200 via-amber-400 to-wedding-primary" />

              {/* Indicador de pulso activo para los segundos */}
              {unit.isLive && (
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider hidden sm:inline">En vivo</span>
                </div>
              )}

              {/* DÍGITO GIGANTE ÉPICO */}
              <div className="my-2 sm:my-3">
                <span className="font-editorial text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-wedding-primaryDark block select-none">
                  {String(unit.value).padStart(2, '0')}
                </span>
              </div>

              {/* ETIQUETA DORADA DE LA UNIDAD */}
              <div className="inline-block">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-100 to-amber-200/90 border border-amber-300/80 text-amber-900 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase shadow-2xs">
                  {unit.label}
                </span>
              </div>

              {/* Subtítulo poético */}
              <p className="text-[11px] sm:text-xs text-stone-500 font-medium mt-2">
                {unit.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          BARRA DE PROGRESO Y HITOS DEL CAMINO HACIA EL ALTAR
          ======================================================== */}
      <div className="bg-white rounded-3xl border border-wedding-border shadow-luxury p-5 sm:p-7">
        
        {/* Cabecera del Progreso */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <Heart size={16} className="fill-amber-600 text-amber-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-editorial font-bold text-stone-900 text-base sm:text-lg">
                Camino Hacia el Altar
              </h3>
              <p className="text-xs text-stone-500">
                Seguimiento temporal desde el inicio de nuestra planeación
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300">
              {progress}% completado
            </span>
          </div>
        </div>

        {/* Barra Visual con Indicador */}
        <div className="relative w-full h-4 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-wedding-primary via-emerald-600 to-amber-500 transition-all duration-1000 relative shadow-inner"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/60 animate-pulse rounded-full" />
          </div>
        </div>

        {/* 4 Métricas de Hitos Detallados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-100 text-center">
          <div className="p-3 rounded-2xl bg-[#FCFAF6] border border-amber-100">
            <span className="font-editorial text-2xl font-bold text-wedding-primaryDark block">
              {totalWeeks}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
              Semanas Restantes
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FCFAF6] border border-amber-100">
            <span className="font-editorial text-2xl font-bold text-wedding-primaryDark block">
              {totalHours.toLocaleString()}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
              Horas en Total
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FCFAF6] border border-amber-100">
            <span className="font-editorial text-2xl font-bold text-wedding-primaryDark block">
              {totalMinutes.toLocaleString()}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
              Minutos de Emoción
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FCFAF6] border border-amber-100">
            <span className="font-editorial text-2xl font-bold text-wedding-primaryDark block">
              {totalSeconds.toLocaleString()}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
              Segundos Vivos
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================
          PANEL DE ACCIONES ÉPICAS: CELEBRACIÓN Y CALENDARIOS
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Botón Épico de Confetti */}
        <div className="md:col-span-1 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition duration-500" />
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3">
              <PartyPopper size={14} />
              <span>Emoción Pura</span>
            </div>
            <h3 className="font-editorial text-2xl font-bold leading-tight">
              ¡Celebremos Cada Minuto!
            </h3>
            <p className="text-amber-100 text-xs mt-2 leading-relaxed">
              Presiona el botón para festejar este momento con una explosión de confeti dorado y esmeralda.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCelebrate}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-white text-amber-900 hover:bg-amber-50 active:scale-95 px-5 py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer"
          >
            <Sparkles size={18} className="text-amber-600" />
            <span>Celebrar Momento {celebrateCount > 0 ? `(${celebrateCount})` : '✨'}</span>
          </button>
        </div>

        {/* Calendarios: Google Calendar & Descarga .ics */}
        <div className="md:col-span-2 rounded-3xl bg-white border border-wedding-border p-6 shadow-luxury flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <CalendarPlus size={20} className="text-wedding-primary" />
                <h3 className="font-editorial text-xl font-bold text-stone-900">
                  Agendar Nuestra Boda en el Calendario
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                1 Clic
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Guarda el evento oficial con fecha, hora de la ceremonia (4:30 PM) y recordatorio directo en tu teléfono (iPhone / Android) o en tu cuenta de Google Calendar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-stone-100">
            {/* Google Calendar */}
            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-stone-50 hover:bg-amber-50 text-stone-800 hover:text-amber-900 border border-stone-200 hover:border-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs text-center"
            >
              <Calendar size={15} className="text-wedding-primary" />
              <span>Google Calendar</span>
            </a>

            {/* Descargar .ics */}
            <button
              type="button"
              onClick={downloadIcsFile}
              className="flex items-center justify-center gap-2 bg-stone-50 hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border border-stone-200 hover:border-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <Download size={15} className="text-emerald-700" />
              <span>Descargar .ics (Apple/Outlook)</span>
            </button>

            {/* Compartir con pareja / familia */}
            <button
              type="button"
              onClick={handleShareWedding}
              className="flex items-center justify-center gap-2 bg-stone-50 hover:bg-blue-50 text-stone-800 hover:text-blue-900 border border-stone-200 hover:border-blue-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              {copiedLink ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} className="text-blue-600" />}
              <span>{copiedLink ? '¡Copiado!' : 'Compartir Anuncio'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================
          INTEGRACIÓN DE PREPARATIVOS: ESTADO ACTUAL DE LA BODA
          ======================================================== */}
      <div className="bg-gradient-to-b from-[#FAF7F2] to-white rounded-3xl border border-amber-200/70 p-6 sm:p-7 shadow-sm">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h3 className="font-editorial text-lg sm:text-xl font-bold text-wedding-primaryDark">
              Preparativos en Marcha para el 21 de Noviembre
            </h3>
            <p className="text-xs text-stone-500">
              Sincronizado en tiempo real con la base de datos de nuestra boda
            </p>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            ¡Todo avanza con orden y elegancia!
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Tarjeta 1: Invitados */}
          <div 
            onClick={() => setActiveTab('guests')}
            className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:shadow-md hover:border-wedding-primary/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Users size={16} />
              </span>
              <ArrowRight size={14} className="text-stone-300 group-hover:text-wedding-primary group-hover:translate-x-0.5 transition" />
            </div>
            <span className="font-editorial text-2xl font-bold text-stone-900 block">
              {stats?.overview?.confirmed_guests || 0}
            </span>
            <p className="text-xs font-medium text-stone-500">
              Confirmados de {stats?.overview?.total_guests || 0} invitados
            </p>
          </div>

          {/* Tarjeta 2: Familias */}
          <div 
            onClick={() => setActiveTab('families')}
            className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:shadow-md hover:border-wedding-primary/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Home size={16} />
              </span>
              <ArrowRight size={14} className="text-stone-300 group-hover:text-wedding-primary group-hover:translate-x-0.5 transition" />
            </div>
            <span className="font-editorial text-2xl font-bold text-stone-900 block">
              {stats?.overview?.total_families || 0}
            </span>
            <p className="text-xs font-medium text-stone-500">
              Familias registradas
            </p>
          </div>

          {/* Tarjeta 3: Tarjetas de Invitación */}
          <div 
            onClick={() => setActiveTab('cards')}
            className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:shadow-md hover:border-wedding-primary/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-700">
                <Mail size={16} />
              </span>
              <ArrowRight size={14} className="text-stone-300 group-hover:text-wedding-primary group-hover:translate-x-0.5 transition" />
            </div>
            <span className="font-editorial text-2xl font-bold text-stone-900 block">
              {invitationCards?.summary?.totalCards || 0}
            </span>
            <p className="text-xs font-medium text-stone-500">
              Sobres & tarjetas preparadas
            </p>
          </div>

          {/* Tarjeta 4: Tareas pendientes */}
          <div 
            onClick={() => setActiveTab('tasks')}
            className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:shadow-md hover:border-wedding-primary/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <CheckCircle2 size={16} />
              </span>
              <ArrowRight size={14} className="text-stone-300 group-hover:text-wedding-primary group-hover:translate-x-0.5 transition" />
            </div>
            <span className="font-editorial text-2xl font-bold text-stone-900 block">
              {taskMetrics?.completed || 0} / {taskMetrics?.total || 0}
            </span>
            <p className="text-xs font-medium text-stone-500">
              Tareas completadas ({taskMetrics?.pending || 0} pendientes)
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
