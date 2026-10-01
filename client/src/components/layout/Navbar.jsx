import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { useWeddingCountdown } from '../../hooks/useWeddingCountdown';
import { CountdownModal } from '../countdown/CountdownModal';
import { Users, Home, Mail, BarChart3, UploadCloud, Heart, Sparkles, ListTodo, Clock, Camera } from 'lucide-react';

export function Navbar() {
  const { activeTab, setActiveTab, stats, invitationCards, taskMetrics, photos, openChangelog } = useWedding();
  const { days, hours, minutes } = useWeddingCountdown();
  const [isCountdownOpen, setIsCountdownOpen] = useState(false);

  const navItems = [
    { id: 'guests', label: 'Invitados', icon: Users, count: stats?.overview?.total_guests },
    { id: 'families', label: 'Familias', icon: Home, count: stats?.overview?.total_families },
    { id: 'cards', label: 'Tarjetas', icon: Mail, count: invitationCards?.summary?.totalCards },
    { id: 'tasks', label: 'Tareas', icon: ListTodo, count: taskMetrics?.pending },
    { id: 'photos', label: 'Fotos & Recuerdos', icon: Camera, count: photos?.length },
    { id: 'dashboard', label: 'Métricas & Aforo', icon: BarChart3 },
    { 
      id: 'countdown', 
      label: 'Cuenta Regresiva', 
      icon: Sparkles, 
      count: `${days}d`,
      isCountdown: true 
    },
    { id: 'importer', label: 'Importar CSV', icon: UploadCloud },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-wedding-border shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            
            {/* Logo / Monograma E & D perfectamente equilibrado y posicionado */}
            <div 
              onClick={() => setActiveTab('guests')}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
            >
              {/* Medallón de Lujo Monograma E & D */}
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full p-[2px] bg-gradient-to-br from-amber-300 via-wedding-accent to-wedding-primary shadow-sm shrink-0 transition-transform duration-200 group-hover:scale-105">
                <div className="w-full h-full rounded-full bg-[#FAF7F2] border border-amber-200/70 flex items-center justify-center shadow-inner">
                  <span className="font-serif font-bold text-wedding-primaryDark text-xs sm:text-sm tracking-widest pl-0.5 inline-flex items-center leading-none">
                    E<span className="text-wedding-accent text-[10px] sm:text-xs font-serif italic mx-0.5">&</span>D
                  </span>
                </div>
              </div>

              {/* Texto de Cabecera */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-serif text-sm sm:text-xl font-bold tracking-wide text-wedding-primaryDark leading-tight">
                    Nuestra Boda
                  </h1>
                  <Heart size={13} className="text-wedding-rose fill-wedding-rose animate-pulse shrink-0" />
                </div>
                <p className="text-[10px] sm:text-[11px] text-stone-500 tracking-wider uppercase font-medium mt-0.5 hidden xs:block">
                  Gestión de Invitados & Papelería
                </p>
              </div>
            </div>

            {/* Navegación para Escritorio (Cinta Principal de Opciones) */}
            <nav className="hidden lg:flex items-center gap-1 bg-stone-100/90 p-1.5 rounded-2xl border border-stone-200 shadow-inner">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? item.isCountdown
                          ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-950 shadow-xs font-bold border border-amber-300/80'
                          : 'bg-white text-wedding-primaryDark shadow-sm font-semibold'
                        : item.isCountdown
                          ? 'text-amber-900/90 hover:text-amber-950 hover:bg-amber-100/60 font-semibold'
                          : 'text-stone-600 hover:text-wedding-primary hover:bg-white/60'
                    }`}
                  >
                    <Icon 
                      size={15} 
                      className={
                        isActive 
                          ? item.isCountdown ? 'text-amber-600' : 'text-wedding-accentDark' 
                          : item.isCountdown ? 'text-amber-600 animate-pulse' : 'text-stone-400'
                      } 
                    />
                    <span>{item.label}</span>
                    {item.count !== undefined && item.count !== null && (
                      <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                        item.isCountdown
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-bold shadow-2xs'
                          : isActive 
                            ? 'bg-wedding-primary/10 text-wedding-primary' 
                            : 'bg-stone-200 text-stone-600'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Metrics & Changelog in Header */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Botón Contador Épico en Vivo (Acceso directo a la cuenta regresiva) */}
              <button
                type="button"
                onClick={() => setIsCountdownOpen(true)}
                className="relative flex items-center gap-1.5 bg-gradient-to-r from-amber-50 via-[#FDFBF7] to-amber-100/90 hover:from-amber-100 hover:to-amber-200 text-amber-950 border border-amber-300/80 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold shadow-2xs hover:shadow-xs transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                title="Ver cuenta regresiva oficial para el 21 de Noviembre a las 4:30 PM"
              >
                <Clock size={13} className="text-amber-700 animate-spin" style={{ animationDuration: '10s' }} />
                <span className="font-mono text-[11px] sm:text-xs font-bold tracking-tight text-amber-950">
                  <span className="hidden sm:inline text-amber-800/80 font-sans font-medium mr-1">Boda:</span>
                  <span className="text-amber-900 font-extrabold">{days}d</span>
                  <span className="text-amber-700/80 ml-0.5">{hours}h {minutes}m</span>
                </span>
              </button>

              {/* Botón Novedades / Changelog llamativo con pulso */}
              <button
                type="button"
                onClick={openChangelog}
                className="relative flex items-center gap-1.5 bg-gradient-to-r from-stone-50 to-amber-50/80 hover:from-amber-50 hover:to-amber-100 text-stone-800 border border-stone-200/90 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold shadow-2xs hover:shadow-xs transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                title="Ver novedades y actualizaciones de la boda"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <Sparkles size={13} className="text-amber-700 shrink-0" />
                <span className="tracking-wide hidden xs:inline">Novedades</span>
              </button>

              {/* Métrica de confirmados */}
              {stats && (
                <div className="flex items-center gap-1 sm:gap-1.5 bg-emerald-50 border border-emerald-200/80 px-2 sm:px-3 py-1.5 rounded-full shadow-2xs">
                  <span className="text-xs font-bold text-emerald-800">
                    {stats.overview?.confirmed_guests || 0}
                  </span>
                  <span className="text-[11px] text-emerald-700/70 hidden md:inline">confirmados</span>
                  <span className="text-xs text-stone-300">/</span>
                  <span className="text-xs text-stone-600 font-medium">
                    {stats.overview?.total_guests || 0}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Modal interactivo de la cuenta regresiva */}
      <CountdownModal isOpen={isCountdownOpen} onClose={() => setIsCountdownOpen(false)} />
    </>
  );
}
