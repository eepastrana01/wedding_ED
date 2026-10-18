import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { useWeddingCountdown } from '../../hooks/useWeddingCountdown';
import { CountdownModal } from '../countdown/CountdownModal';
import { Users, Home, Mail, BarChart3, UploadCloud, Heart, Sparkles, ListTodo, Clock, Camera, Utensils, CheckCircle2 } from 'lucide-react';

export function Navbar() {
  const { activeTab, setActiveTab, stats, invitationCards, taskMetrics, photos, tables, openChangelog } = useWedding();
  const { days, hours, minutes } = useWeddingCountdown();
  const [isCountdownOpen, setIsCountdownOpen] = useState(false);

  const navItems = [
    { id: 'guests', label: 'Invitados', icon: Users, count: stats?.overview?.total_guests },
    { id: 'families', label: 'Familias', icon: Home, count: stats?.overview?.total_families },
    { id: 'tables', label: 'Mesas', icon: Utensils, count: tables?.length },
    { id: 'cards', label: 'Tarjetas', icon: Mail, count: invitationCards?.summary?.totalCards },
    { id: 'tasks', label: 'Tareas', icon: ListTodo, count: taskMetrics?.pending },
    { id: 'photos', label: 'Fotos', icon: Camera, count: photos?.length },
    { id: 'dashboard', label: 'Métricas', icon: BarChart3 },
    { id: 'importer', label: 'Importar', icon: UploadCloud },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-wedding-border/80 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
            
            {/* 1. Logo / Monograma E & D compacto y elegante */}
            <div 
              onClick={() => setActiveTab('guests')}
              className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
            >
              <div className="relative w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-br from-amber-300 via-wedding-accent to-wedding-primary shadow-2xs shrink-0 transition-transform duration-200 group-hover:scale-105">
                <div className="w-full h-full rounded-full bg-[#FAF7F2] border border-amber-200/70 flex items-center justify-center">
                  <span className="font-serif font-bold text-wedding-primaryDark text-xs tracking-wider inline-flex items-center leading-none">
                    E<span className="text-wedding-accent text-[10px] font-serif italic mx-0.5">&</span>D
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-center whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-serif text-sm sm:text-base font-bold tracking-wide text-wedding-primaryDark leading-none">
                    Nuestra Boda
                  </h1>
                  <Heart size={12} className="text-wedding-rose fill-wedding-rose shrink-0" />
                </div>
                <span className="text-[10px] text-stone-400 font-medium hidden xl:block mt-0.5">
                  Edis & Dania
                </span>
              </div>
            </div>

            {/* 2. Navegación Central en 1 sola línea limpia (Sin saltos de renglón) */}
            <nav className="hidden md:flex items-center gap-0.5 bg-stone-100/90 p-1 rounded-2xl border border-stone-200/80 overflow-x-auto no-scrollbar max-w-full">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-white text-wedding-primaryDark shadow-xs font-semibold'
                        : 'text-stone-600 hover:text-wedding-primary hover:bg-white/60'
                    }`}
                  >
                    <Icon 
                      size={14} 
                      className={isActive ? 'text-wedding-primary shrink-0' : 'text-stone-400 shrink-0'} 
                    />
                    <span>{item.label}</span>
                    {item.count !== undefined && item.count !== null && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                        isActive 
                          ? 'bg-wedding-primary/10 text-wedding-primary' 
                          : 'bg-stone-200/80 text-stone-600'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* 3. Indicadores Rápidos a la Derecha (Unificados y en 1 línea) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
              
              {/* Píldora de Confirmados */}
              {stats && (
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/90 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                  title="Ver métricas de confirmación y aforo"
                >
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-900">
                    {stats.overview?.confirmed_guests || 0}
                  </span>
                  <span className="text-stone-300">/</span>
                  <span className="text-stone-600 font-medium">
                    {stats.overview?.total_guests || 0}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium hidden xl:inline">
                    confirmados
                  </span>
                </button>
              )}

              {/* Botón Único de Cuenta Regresiva (Abre vista Cuenta Regresiva o Modal) */}
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'countdown') {
                    setIsCountdownOpen(true);
                  } else {
                    setActiveTab('countdown');
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95 cursor-pointer ${
                  activeTab === 'countdown'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50/90 hover:bg-amber-100 text-amber-950 border-amber-300/80'
                }`}
                title="Cuenta regresiva para la boda (Clic para abrir)"
              >
                <Clock size={13} className={activeTab === 'countdown' ? 'text-white' : 'text-amber-700'} />
                <span className="font-mono text-[11px] sm:text-xs font-bold tracking-tight">
                  <span>{days}d</span>
                  <span className={`ml-1 ${activeTab === 'countdown' ? 'text-amber-100' : 'text-amber-700/80'}`}>
                    {hours}h {minutes}m
                  </span>
                </span>
              </button>

              {/* Botón compacto de Novedades */}
              <button
                type="button"
                onClick={openChangelog}
                className="relative w-8 h-8 rounded-xl bg-stone-100 hover:bg-amber-50 text-stone-600 hover:text-amber-800 border border-stone-200/80 flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
                title="Ver novedades y actualizaciones de la app"
              >
                <Sparkles size={14} className="text-amber-600" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Modal interactivo de la cuenta regresiva */}
      <CountdownModal isOpen={isCountdownOpen} onClose={() => setIsCountdownOpen(false)} />
    </>
  );
}

