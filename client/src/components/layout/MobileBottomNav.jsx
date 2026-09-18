import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Users, Home, Mail, BarChart3, UploadCloud } from 'lucide-react';

export function MobileBottomNav() {
  const { activeTab, setActiveTab, stats, invitationCards } = useWedding();

  const navItems = [
    { id: 'guests', label: 'Invitados', icon: Users, badge: stats?.overview?.total_guests },
    { id: 'families', label: 'Familias', icon: Home, badge: stats?.overview?.total_families },
    { id: 'cards', label: 'Tarjetas', icon: Mail, badge: invitationCards?.summary?.totalCards },
    { id: 'dashboard', label: 'Métricas', icon: BarChart3 },
    { id: 'importer', label: 'Importar', icon: UploadCloud },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-wedding-border/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-safe select-none">
      <div className="grid grid-cols-5 gap-1 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-0.5 rounded-xl transition-all duration-150 active:scale-90 relative ${
                isActive
                  ? 'text-wedding-primary font-bold'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              {/* Active Background Pill Indicator */}
              {isActive && (
                <span className="absolute inset-x-1 inset-y-1 bg-wedding-accentLight/60 rounded-xl -z-10 animate-in fade-in zoom-in-95 duration-150" />
              )}

              <div className="relative">
                <Icon
                  size={19}
                  className={`transition-colors ${
                    isActive
                      ? 'text-wedding-primary stroke-[2.4]'
                      : 'text-stone-400'
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 text-[9px] font-bold px-1 rounded-full min-w-[15px] h-[15px] flex items-center justify-center shadow-xs transition-colors ${
                      isActive
                        ? 'bg-wedding-primary text-white'
                        : 'bg-stone-300 text-stone-700'
                    }`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] mt-1 tracking-tight leading-none ${
                  isActive ? 'font-semibold text-wedding-primaryDark' : 'font-medium text-stone-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
