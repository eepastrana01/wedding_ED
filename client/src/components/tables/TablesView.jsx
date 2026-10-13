import React, { useState, useMemo } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { RoundTableCard } from './RoundTableCard';
import { FloorPlanStudio } from './FloorPlanStudio';
import { TableModal } from './TableModal';
import { TablePrintModal } from './TablePrintModal';
import { QuickAssignModal } from './QuickAssignModal';
import { 
  Utensils, Plus, Search, Users, Printer, Sparkles, 
  Wand2, Home, UserCheck, RefreshCw, AlertCircle, ChevronDown, ChevronRight, Check,
  Maximize2, LayoutGrid, Compass, ExternalLink
} from 'lucide-react';
import { matchesSearch } from '../../utils/textUtils';

export function TablesView() {
  const {
    tables = [],
    guests = [],
    createTable,
    updateTable,
    deleteTable,
    assignGuestsToTable,
    unassignGuestsFromTable,
    clearTable,
    autoGenerateTables,
    isRefreshing,
    refreshAll,
  } = useWedding();

  // Mode: 'studio' (Lienzo Arquitectónico 360°) or 'cards' (Cuadrícula de Tarjetas)
  const [viewMode, setViewMode] = useState('studio');
  const [isFullscreenStudio, setIsFullscreenStudio] = useState(false);

  // Modals state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isQuickAssignOpen, setIsQuickAssignOpen] = useState(false);
  const [targetQuickTable, setTargetQuickTable] = useState(null);

  // Filters for unassigned guests sidebar
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [unassignedFilter, setUnassignedFilter] = useState('all'); // 'all', 'confirmed', 'with_family'
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Filter for tables
  const [tableSearch, setTableSearch] = useState('');

  // Unassigned guests calculation
  const unassignedGuests = useMemo(() => {
    return guests.filter((g) => !g.table_id);
  }, [guests]);

  const filteredUnassignedGuests = useMemo(() => {
    return unassignedGuests.filter((g) => {
      const matchQuery =
        matchesSearch(g.name, unassignedSearch) ||
        matchesSearch(g.partner_name, unassignedSearch) ||
        matchesSearch(g.family_name, unassignedSearch);

      if (!matchQuery) return false;

      if (unassignedFilter === 'confirmed') {
        return g.status === 'confirmed';
      }
      if (unassignedFilter === 'with_family') {
        return Boolean(g.family_id);
      }
      return true;
    });
  }, [unassignedGuests, unassignedSearch, unassignedFilter]);

  // Group unassigned by family
  const unassignedFamilies = useMemo(() => {
    const map = new Map();
    filteredUnassignedGuests.forEach((g) => {
      const famKey = g.family_id || `indiv-${g.id}`;
      const famName = g.family_name || 'Sin Familia Asignada';
      if (!map.has(famKey)) {
        map.set(famKey, {
          id: famKey,
          isRealFamily: Boolean(g.family_id),
          name: famName,
          guests: [],
        });
      }
      map.get(famKey).guests.push(g);
    });
    return Array.from(map.values()).sort((a, b) => b.guests.length - a.guests.length);
  }, [filteredUnassignedGuests]);

  // Overall banquet metrics
  const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 10), 0);
  const totalSeated = tables.reduce((acc, t) => acc + (t.guests?.length || 0), 0);
  const freeSeats = Math.max(0, totalCapacity - totalSeated);
  const dietaryCount = tables.reduce(
    (acc, t) => acc + (t.guests?.filter((g) => g.dietary_notes && g.dietary_notes.trim())?.length || 0),
    0
  );

  // Filtered tables by search
  const filteredTables = useMemo(() => {
    if (!tableSearch.trim()) return tables;
    return tables.filter((t) => {
      const matchNum = String(t.table_number).includes(tableSearch);
      const matchName = matchesSearch(t.name, tableSearch);
      const matchGuests = t.guests?.some((g) => matchesSearch(g.name, tableSearch));
      return matchNum || matchName || matchGuests;
    });
  }, [tables, tableSearch]);

  // Handle Drag Start from unassigned list
  const handleDragGuestStart = (e, guest) => {
    e.dataTransfer.effectAllowed = 'move';
    const payload = JSON.stringify({ type: 'guest', guestId: guest.id });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', payload);
  };

  const handleDragFamilyStart = (e, family) => {
    e.dataTransfer.effectAllowed = 'move';
    const guestIds = family.guests.map((g) => g.id);
    const payload = JSON.stringify({ type: 'family', guestIds });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', payload);
  };

  // Quick assign modal trigger
  const handleOpenQuickAssign = (table = null) => {
    setTargetQuickTable(table);
    setIsQuickAssignOpen(true);
  };

  // If user enters immersive fullscreen mode, render FloorPlanStudio full-bleed
  if (isFullscreenStudio) {
    return (
      <FloorPlanStudio
        isFullscreenMode={true}
        onToggleFullscreen={() => setIsFullscreenStudio(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Banquet Metric Cards */}
      <div className="bg-gradient-to-br from-white via-[#FCFAF6] to-white rounded-3xl border border-wedding-border/80 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full bg-wedding-accentLight/60 text-wedding-primaryDark text-xs font-serif font-bold tracking-wider uppercase">
                Salón & Banquete
              </span>
              <span className="text-xs text-stone-400">• Formato Redondo & Plano Arquitectónico</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-wedding-primaryDark">
              Distribución de Mesas de Boda
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
              Diseña la ubicación de tus invitados con personitas ilustradas, arrastra comensales y mueve mesas en un plano arquitectónico 360°.
            </p>
          </div>

          {/* Quick Actions Buttons & View Mode Switch */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Selector de Modo: Plano 360° vs Tarjetas */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={() => setViewMode('studio')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'studio'
                    ? 'bg-white text-wedding-primaryDark shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Compass size={14} className={viewMode === 'studio' ? 'text-wedding-primary' : 'text-stone-400'} />
                <span>Plano 360°</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-wedding-primaryDark shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LayoutGrid size={14} className={viewMode === 'cards' ? 'text-wedding-primary' : 'text-stone-400'} />
                <span>Tarjetas</span>
              </button>
            </div>

            <a
              href="/?tab=tables&standalone=true"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-gradient-to-r from-amber-50 to-amber-100/90 hover:from-amber-100 hover:to-amber-200 text-amber-950 border border-amber-300/80 text-xs font-bold rounded-2xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Abrir en pestaña nueva para ocupar el 100% del navegador"
            >
              <ExternalLink size={14} className="text-amber-800" />
              <span className="hidden sm:inline">Nueva Pestaña</span>
            </a>

            <button
              type="button"
              onClick={() => setIsFullscreenStudio(true)}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-bold rounded-2xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Abrir estudio en pantalla completa para máximo espacio"
            >
              <Maximize2 size={14} className="text-stone-600" />
              <span className="hidden sm:inline">Pantalla Completa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingTable(null);
                setIsTableModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-wedding-primary to-wedding-primaryDark text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm hover:shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} className="text-wedding-accent" />
              Nueva Mesa
            </button>

            {tables.length > 0 && (
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={15} className="text-stone-600" />
                <span className="hidden md:inline">Reporte PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => refreshAll()}
              className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-wedding-primary' : ''} />
            </button>
          </div>
        </div>

        {/* Banquet Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-5">
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Mesas Montadas</span>
              <Utensils size={16} className="text-wedding-accent" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-extrabold text-wedding-primaryDark">
                {tables.length}
              </span>
              <span className="text-xs text-stone-400 font-medium">
                ({totalCapacity} sillas)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Comensales Sentados</span>
              <UserCheck size={16} className="text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-extrabold text-emerald-800">
                {totalSeated}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                de {guests.length} invitados
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Sin Mesa Asignada</span>
              <Users size={16} className="text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`font-serif text-2xl sm:text-3xl font-extrabold ${
                unassignedGuests.length > 0 ? 'text-amber-800' : 'text-stone-400'
              }`}>
                {unassignedGuests.length}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                {freeSeats} sillas libres
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Menús Especiales</span>
              <Sparkles size={16} className="text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-800">
                {dietaryCount}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                con alergia/dieta
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal: Plano Arquitectónico 360° o Cuadrícula de Tarjetas */}
      {viewMode === 'studio' ? (
        <FloorPlanStudio
          isFullscreenMode={false}
          onToggleFullscreen={() => setIsFullscreenStudio(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Unassigned Guests Drawer */}
          <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-3xl border border-wedding-border p-4 sm:p-5 shadow-xs sticky top-20 flex flex-col max-h-[85vh]">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-wedding-primary" />
              <h3 className="font-serif text-base font-bold text-wedding-primaryDark">
                Sin Mesa ({unassignedGuests.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleOpenQuickAssign(null)}
              className="text-[11px] font-bold text-wedding-accentDark hover:text-wedding-primary hover:underline cursor-pointer"
            >
              + Asignar a...
            </button>
          </div>

          {/* Search & Filter pills */}
          <div className="py-3 space-y-2.5">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar invitado o familia..."
                value={unassignedSearch}
                onChange={(e) => setUnassignedSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-wedding-primary"
              />
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setUnassignedFilter('all')}
                className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  unassignedFilter === 'all'
                    ? 'bg-wedding-primary text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setUnassignedFilter('confirmed')}
                className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  unassignedFilter === 'confirmed'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Confirmados
              </button>
              <button
                type="button"
                onClick={() => setUnassignedFilter('with_family')}
                className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  unassignedFilter === 'with_family'
                    ? 'bg-wedding-accentDark text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Con Familia
              </button>
            </div>
          </div>

          {/* Draggable Guests / Families List */}
          <div className="overflow-y-auto flex-1 pr-1 space-y-2.5 divide-y divide-stone-100">
            {unassignedFamilies.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Check size={28} className="mx-auto text-emerald-600 mb-2" />
                <p className="font-serif font-bold text-sm text-stone-700">
                  ¡Todos los invitados tienen mesa!
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  O ninguna coincidencia con el filtro aplicado.
                </p>
              </div>
            ) : (
              unassignedFamilies.map((fam) => (
                <div key={fam.id} className="pt-2 first:pt-0">
                  {/* Family Header Chip (if multiple members) */}
                  {fam.isRealFamily && fam.guests.length > 1 && (
                    <div className="mb-1.5 flex items-center justify-between bg-stone-50 px-2 py-1 rounded-lg border border-stone-200/70">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 truncate">
                        <Home size={13} className="text-wedding-accent shrink-0" />
                        <span className="truncate">{fam.name} ({fam.guests.length})</span>
                      </div>
                      <div
                        draggable
                        onDragStart={(e) => handleDragFamilyStart(e, fam)}
                        className="px-2 py-0.5 rounded-md bg-stone-200 hover:bg-wedding-primary hover:text-white text-[10px] font-bold text-stone-700 transition-colors cursor-grab active:cursor-grabbing shrink-0"
                        title="Arrastra este botón para sentar a toda la familia junta en una mesa"
                      >
                        Arrastrar Toda
                      </div>
                    </div>
                  )}

                  {/* Individual Guest Cards */}
                  <div className="space-y-1.5">
                    {fam.guests.map((guest) => (
                      <div
                        key={guest.id}
                        draggable
                        onDragStart={(e) => handleDragGuestStart(e, guest)}
                        className="p-2.5 rounded-xl bg-white border border-stone-200/90 hover:border-wedding-accent hover:shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing flex items-center justify-between gap-2 group select-none"
                      >
                        <div className="truncate flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-stone-800 truncate group-hover:text-wedding-primary">
                              {guest.name}
                            </span>
                            {guest.status === 'confirmed' && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Confirmado" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-stone-400">
                            {guest.family_name && (
                              <span className="truncate">{guest.family_name}</span>
                            )}
                            {guest.dietary_notes && (
                              <span className="text-amber-800 bg-amber-100 px-1 rounded-xs font-semibold shrink-0" title={guest.dietary_notes}>
                                🍽️ Dieta
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mobile tap quick assign trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            setTargetQuickTable(null);
                            setIsQuickAssignOpen(true);
                          }}
                          className="text-[10px] px-2 py-1 rounded-lg bg-stone-100 hover:bg-wedding-primary hover:text-white text-stone-600 font-semibold transition-colors cursor-pointer shrink-0"
                          title="Asignar a una mesa..."
                        >
                          Sentar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-400 text-center">
            💡 <em>Arrastra hacia cualquier mesa redonda</em>
          </div>
        </div>

        {/* Right Column: Salon Tables Grid */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          
          {/* Tables Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-wedding-border">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por número de mesa, nombre o invitado sentado..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:bg-white focus:border-wedding-primary"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500 shrink-0">
              <span className="font-semibold text-wedding-primaryDark">
                {filteredTables.length} mesas en salón
              </span>
            </div>
          </div>

          {/* Tables Canvas */}
          {tables.length === 0 ? (
            <div className="bg-white rounded-3xl border border-wedding-border p-10 sm:p-14 text-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-800 mx-auto mb-4">
                <Utensils size={30} />
              </div>
              <h3 className="font-serif text-xl font-bold text-wedding-primaryDark">
                Aún no has configurado tus mesas
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mt-1 mb-6">
                Organiza el banquete de tu boda creando mesas redondas para tus invitados. Puedes crear mesas manualmente o autogenerar las 10 primeras en 1 clic.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => autoGenerateTables(10, 10)}
                  className="px-5 py-2.5 bg-gradient-to-r from-wedding-primary to-wedding-primaryDark text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Wand2 size={16} className="text-wedding-accent" />
                  Auto-generar 10 Mesas Redondas (10 sillas c/u)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTable(null);
                    setIsTableModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold rounded-2xl transition-all cursor-pointer"
                >
                  + Crear Mesa Manual
                </button>
              </div>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="bg-white rounded-3xl border border-wedding-border p-10 text-center">
              <p className="text-sm text-stone-500">
                No se encontraron mesas que coincidan con "{tableSearch}".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredTables.map((table) => (
                <RoundTableCard
                  key={table.id}
                  table={table}
                  onEdit={(t) => {
                    setEditingTable(t);
                    setIsTableModalOpen(true);
                  }}
                  onDelete={deleteTable}
                  onClear={clearTable}
                  onAssignGuests={assignGuestsToTable}
                  onUnassignGuest={unassignGuestsFromTable}
                  onQuickAssignClick={handleOpenQuickAssign}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Modals */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => {
          setIsTableModalOpen(false);
          setEditingTable(null);
        }}
        onSave={(data) => {
          if (editingTable) {
            updateTable(editingTable.id, data);
          } else {
            createTable(data);
          }
        }}
        editingTable={editingTable}
      />

      <TablePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tables={tables}
        guests={guests}
      />

      <QuickAssignModal
        isOpen={isQuickAssignOpen}
        onClose={() => {
          setIsQuickAssignOpen(false);
          setTargetQuickTable(null);
        }}
        targetTable={targetQuickTable}
        tables={tables}
        unassignedGuests={unassignedGuests}
        onAssignGuests={assignGuestsToTable}
      />
    </div>
  );
}
