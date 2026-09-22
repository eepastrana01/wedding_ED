import React, { useState, useEffect } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { 
  Sparkles, 
  ListTodo, 
  Users, 
  Coins, 
  RefreshCw, 
  Heart, 
  CheckCircle2, 
  ArrowRight, 
  X,
  Layers,
  FileText,
  Bell
} from 'lucide-react';

export function ChangelogModal({ isOpen, onClose }) {
  const { setActiveTab } = useWedding();
  const [autoShow, setAutoShow] = useState(() => {
    return localStorage.getItem('wedding_changelog_auto_open') !== 'false';
  });

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

  const handleToggleAutoShow = (e) => {
    const checked = e.target.checked;
    setAutoShow(checked);
    localStorage.setItem('wedding_changelog_auto_open', checked ? 'true' : 'false');
  };

  const handleGoToTasks = () => {
    setActiveTab('tasks');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm transition-all overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop clickable */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-amber-200/80 overflow-hidden transform transition-all z-10 my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header con gradiente de boda y monograma */}
        <div className="relative bg-gradient-to-br from-[#FAF6F0] via-[#F4EFE6] to-[#EFE7D8] p-5 sm:p-6 border-b border-amber-200/70 shrink-0">
          
          {/* Botón cerrar X */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 p-2 rounded-full transition-colors"
            aria-label="Cerrar ventana"
          >
            <X size={20} />
          </button>

          {/* Badge superior */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-amber-300/80 shadow-xs text-amber-900 text-xs font-bold tracking-wide uppercase mb-2.5">
            <Sparkles size={13} className="text-amber-600" />
            <span>Actualización Reciente • Boda E & D</span>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-wedding-primaryDark tracking-tight">
              ¡Novedades en Nuestra Boda!
            </h2>
            <Heart size={20} className="text-wedding-rose fill-wedding-rose shrink-0 animate-pulse" />
          </div>

          <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed font-normal">
            Para <strong className="text-stone-900 font-semibold">Dania & Edis</strong>: Hemos implementado nuevas herramientas para que la planificación de nuestra boda sea más fluida, colaborativa y organizada.
          </p>
        </div>

        {/* Contenido scrolleable con tarjetas de mejoras */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          
          {/* Card 1: To-Do List & Tareas */}
          <div className="p-4 rounded-2xl bg-[#FCFAF6] border border-wedding-border/90 hover:border-emerald-300 transition-colors shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <ListTodo size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-editorial text-base sm:text-lg font-bold text-wedding-primaryDark">
                    Nuevo Gestor de Tareas & To-Do List
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                    Nuevo
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Diseñado para controlar cada actividad de la boda sin olvidar ningún pendiente:
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-stone-700">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Subtareas interactivas:</strong> Divide pendientes grandes en pasos con checkboxes y barra de progreso porcentual.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Mini-Notas y Proveedores:</strong> Guarda teléfonos, direcciones, recordatorios y cotizaciones dentro de cada tarea.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Tareas Sugeridas:</strong> Botón para precargar 8 actividades indispensables de boda en 1 solo clic.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 2: Asignación por Pareja */}
          <div className="p-4 rounded-2xl bg-[#FCFAF6] border border-wedding-border/90 hover:border-indigo-300 transition-colors shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100/80 border border-indigo-200 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                <Users size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-editorial text-base sm:text-lg font-bold text-wedding-primaryDark">
                    Asignación en Pareja: ¿Quién se encarga?
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full shrink-0">
                    Edis & Dania
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Distribución clara de responsabilidades con un toque personalizado:
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-stone-700">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                    <span>Asigna tareas a <strong>Edis (Novio)</strong>, <strong>Dania (Novia)</strong> o <strong>Juntos (Ambos)</strong>.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                    <span>Filtros instantáneos para ver solo lo que le corresponde a Dania, a Edis o a los dos.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 3: Moneda en Lempiras y Control de Gastos */}
          <div className="p-4 rounded-2xl bg-[#FCFAF6] border border-wedding-border/90 hover:border-amber-300 transition-colors shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Coins size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-editorial text-base sm:text-lg font-bold text-wedding-primaryDark">
                    Moneda Nacional: Lempiras (L.) & Control de Gastos
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                    Honduras
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Eliminamos los confusos símbolos de dólar ($) y unificamos los presupuestos:
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-stone-700">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>Montos en formato oficial: <strong>L. 6,000.00</strong> con separadores de miles y decimales exactos.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>Registro de <strong>Presupuesto Estimado</strong> vs. <strong>Costo Real Pagado</strong> con resumen global.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 4: Sincronización Automática en Vivo */}
          <div className="p-4 rounded-2xl bg-[#FCFAF6] border border-wedding-border/90 hover:border-sky-300 transition-colors shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100/80 border border-sky-200 text-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                <RefreshCw size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-editorial text-base sm:text-lg font-bold text-wedding-primaryDark">
                    Sincronización en Vivo PC ↔ Móvil
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full shrink-0">
                    En Tiempo Real
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Ya no necesitas recargar la página:
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-stone-700">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={14} className="text-sky-600 shrink-0 mt-0.5" />
                    <span>Cualquier cambio hecho en el celular se refleja automáticamente en la computadora y viceversa gracias a la base de datos Neon PostgreSQL.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 5: Cero Emojis & Pack de Iconos Elegantes */}
          <div className="p-4 rounded-2xl bg-[#FCFAF6] border border-wedding-border/90 hover:border-rose-300 transition-colors shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-editorial text-base sm:text-lg font-bold text-wedding-primaryDark">
                    Iconografía Vectorial & Estilo Editorial
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full shrink-0">
                    Elegancia
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Cero emojis informales: Toda la interfaz ahora utiliza iconos vectoriales de alta definición (Lucide) adaptados al diseño refinado de la boda.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer con opciones y botón de acción */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-wedding-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-600 hover:text-stone-900 transition-colors">
            <input
              type="checkbox"
              checked={autoShow}
              onChange={handleToggleAutoShow}
              className="w-4 h-4 rounded text-wedding-primary focus:ring-wedding-accent border-stone-300"
            />
            <span>Mostrar novedades al entrar a la página</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-medium text-stone-700 hover:bg-stone-200/50 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleGoToTasks}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-wedding-primary hover:bg-wedding-primaryLight text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <span>¡Ir a ver las Tareas!</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
