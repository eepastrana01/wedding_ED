import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { InteractiveTable, SweetheartHeadTable } from './InteractiveTable';
import { PersonAvatar } from './PersonAvatar';
import { TableModal } from './TableModal';
import { TablePrintModal } from './TablePrintModal';
import { QuickAssignModal } from './QuickAssignModal';
import { 
  ZoomIn, ZoomOut, Maximize2, Minimize2, Move, Plus, Search, 
  Users, Home, Wand2, Printer, Check, ChevronLeft, ChevronRight,
  Layers, RotateCcw, Sparkles, Utensils
} from 'lucide-react';
import { matchesSearch } from '../../utils/textUtils';

export function FloorPlanStudio({ isFullscreenMode = false, onToggleFullscreen }) {
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
  } = useWedding();

  // Canvas pan & zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Sidebar / Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'confirmed', 'with_family'

  // Modals state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isQuickAssignOpen, setIsQuickAssignOpen] = useState(false);
  const [targetQuickTable, setTargetQuickTable] = useState(null);

  const canvasRef = useRef(null);

  // Unassigned guests
  const unassignedGuests = useMemo(() => {
    return guests.filter((g) => !g.table_id);
  }, [guests]);

  const filteredUnassignedGuests = useMemo(() => {
    return unassignedGuests.filter((g) => {
      const matchQuery =
        matchesSearch(g.name, searchTerm) ||
        matchesSearch(g.partner_name, searchTerm) ||
        matchesSearch(g.family_name, searchTerm);

      if (!matchQuery) return false;

      if (filterType === 'confirmed') return g.status === 'confirmed';
      if (filterType === 'with_family') return Boolean(g.family_id);
      return true;
    });
  }, [unassignedGuests, searchTerm, filterType]);

  // Group unassigned by family
  const unassignedFamilies = useMemo(() => {
    const map = new Map();
    filteredUnassignedGuests.forEach((g) => {
      const famKey = g.family_id || `indiv-${g.id}`;
      const famName = g.family_name || 'Individual (Sin Familia)';
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

  // Metrics
  const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 10), 0);
  const totalSeated = tables.reduce((acc, t) => acc + (t.guests?.length || 0), 0);
  const freeSeats = Math.max(0, totalCapacity - totalSeated);

  // Pan canvas with mouse
  const handleMouseDown = (e) => {
    // Only pan if clicking on canvas background directly
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-background')) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag guest start
  const handleDragGuestStart = (e, guest) => {
    e.dataTransfer.effectAllowed = 'move';
    const payload = JSON.stringify({ type: 'guest', guestId: guest.id });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', payload);
  };

  const handleDragFamilyStart = (e, fam) => {
    e.dataTransfer.effectAllowed = 'move';
    const guestIds = fam.guests.map((g) => g.id);
    const payload = JSON.stringify({ type: 'family', guestIds });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', payload);
  };

  // Open quick assign modal
  const handleOpenQuickAssign = (table = null) => {
    setTargetQuickTable(table);
    setIsQuickAssignOpen(true);
  };

  return (
    <div 
      className={`relative w-full overflow-hidden select-none bg-[#F7F8FA] flex flex-col ${
        isFullscreenMode ? 'fixed inset-0 z-50 h-screen w-screen' : 'h-[85vh] rounded-3xl border border-wedding-border shadow-md'
      }`}
    >
      {/* 1. Barra de Herramientas Superior del Estudio (Floating Studio HUD) */}
      <header className="absolute top-3 left-3 right-3 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200/90 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-wedding-primary text-wedding-accent flex items-center justify-center font-serif font-bold text-xs shadow-xs">
              E&D
            </span>
            <div>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-wedding-primaryDark leading-tight">
                Estudio del Salón de Banquete
              </h3>
              <p className="text-[10px] text-stone-500 font-medium hidden sm:block">
                Plano 360° Interactivo con Personitas & Asignación Dinámica
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-stone-200 hidden md:block" />

          {/* Métricas rápidas en la barra */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <span className="text-stone-600">
              <strong>{tables.length}</strong> mesas
            </span>
            <span className="text-emerald-700 font-semibold">
              <strong>{totalSeated}</strong> sentados
            </span>
            <span className="text-amber-700 font-semibold">
              <strong>{unassignedGuests.length}</strong> sin mesa
            </span>
          </div>
        </div>

        {/* Acciones principales de salón */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingTable(null);
              setIsTableModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-wedding-primary text-white text-xs font-bold hover:bg-wedding-primaryDark transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus size={14} className="text-wedding-accent" />
            <span>+ Mesa</span>
          </button>

          {tables.length === 0 && (
            <button
              type="button"
              onClick={() => autoGenerateTables(10, 10)}
              className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Wand2 size={13} className="text-amber-800" />
              <span>Generar 10 Mesas</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            title="Imprimir plano de mesas"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
              title={isFullscreenMode ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          )}
        </div>
      </header>

      {/* 2. Contenedor Principal (Lienzo Arquitectónico + Gaveta Lateral) */}
      <div 
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="canvas-background relative flex-1 w-full h-full overflow-hidden cursor-default"
        style={{
          // Fondo con textura de papel milimetrado / plano de arquitectura
          backgroundColor: '#F8F9FA',
          backgroundImage: `
            radial-gradient(#D3DCE6 1.1px, transparent 1.1px),
            linear-gradient(to right, #EDF1F5 1px, transparent 1px),
            linear-gradient(to bottom, #EDF1F5 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      >
        {/* Lienzo Escalable y Mapeable (Pan & Zoom Container) */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative min-w-[1600px] min-h-[1400px] pt-24 pb-40 px-20 flex flex-col items-center"
        >
          {/* A. Encabezado del Salón: Mesa Presidencial de los Novios (Bride & Groom) */}
          <div className="mb-14 flex flex-col items-center">
            <div className="mb-2 px-3 py-1 rounded-full bg-stone-200/70 border border-stone-300 text-[10px] font-bold tracking-widest uppercase text-stone-600">
              Cabecera del Salón • Pista de Baile & Banquete
            </div>
            <SweetheartHeadTable
              brideName="Dania"
              groomName="Eduardo"
            />
          </div>

          {/* B. Salón Principal: Grid espacioso de Mesas Redondas con sus Personitas */}
          {tables.length === 0 ? (
            <div className="mt-10 p-10 bg-white/90 rounded-3xl border border-stone-300 shadow-lg text-center max-w-md backdrop-blur-xs">
              <Utensils size={36} className="mx-auto text-wedding-accent mb-3" />
              <h4 className="font-serif text-lg font-bold text-wedding-primaryDark">
                Salón listo para montar
              </h4>
              <p className="text-xs text-stone-500 mt-1 mb-4">
                Comienza agregando las mesas redondas para tus invitados con el botón superior o autogenera 10 mesas redondas.
              </p>
              <button
                type="button"
                onClick={() => autoGenerateTables(10, 10)}
                className="px-4 py-2 bg-wedding-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-wedding-primaryDark transition-all cursor-pointer"
              >
                Auto-generar 10 Mesas Redondas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-16 justify-items-center">
              {tables.map((table) => (
                <div key={table.id} className="p-2 transition-transform hover:scale-[1.01]">
                  <InteractiveTable
                    table={table}
                    zoom={zoom}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Gaveta Deslizante de Invitados Sin Asignar (Slide-out Left Drawer) */}
      <aside
        className={`absolute top-16 bottom-4 left-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200 shadow-xl transition-all duration-300 flex flex-col overflow-hidden ${
          isDrawerOpen ? 'w-72 sm:w-80' : 'w-10'
        }`}
      >
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="absolute top-3 right-2.5 z-40 p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
          title={isDrawerOpen ? 'Ocultar panel para ampliar el salón' : 'Mostrar invitados'}
        >
          {isDrawerOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {isDrawerOpen ? (
          <div className="flex flex-col h-full p-4">
            {/* Header del Drawer */}
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <Users size={16} className="text-wedding-primary" />
              <h4 className="font-serif font-bold text-sm text-wedding-primaryDark">
                Sin Asignar ({unassignedGuests.length})
              </h4>
            </div>

            {/* Búsqueda y Filtros */}
            <div className="py-2.5 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar persona o familia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-hidden focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                    filterType === 'all' ? 'bg-wedding-primary text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('confirmed')}
                  className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                    filterType === 'confirmed' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  Confirmados
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('with_family')}
                  className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                    filterType === 'with_family' ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  Familias
                </button>
              </div>
            </div>

            {/* Lista de Personitas Arrastrables */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-2 divide-y divide-stone-100">
              {unassignedFamilies.length === 0 ? (
                <div className="text-center py-10 px-2 text-stone-400 text-xs">
                  <Check size={24} className="mx-auto text-emerald-600 mb-1" />
                  ¡Todos los invitados tienen mesa asignada!
                </div>
              ) : (
                unassignedFamilies.map((fam) => (
                  <div key={fam.id} className="pt-2 first:pt-0">
                    {/* Tarjeta de Familia (Permite arrastrar a todos de 1 tirón) */}
                    {fam.isRealFamily && fam.guests.length > 1 && (
                      <div className="mb-1.5 flex items-center justify-between bg-amber-50/70 border border-amber-200/60 px-2 py-1 rounded-lg">
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-950 truncate">
                          <Home size={12} className="text-amber-700 shrink-0" />
                          <span className="truncate">{fam.name} ({fam.guests.length})</span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) => handleDragFamilyStart(e, fam)}
                          className="px-2 py-0.5 rounded-md bg-amber-200 hover:bg-amber-300 text-[10px] font-bold text-amber-950 cursor-grab active:cursor-grabbing shrink-0"
                          title="Arrastra para sentar a toda la familia junta"
                        >
                          Arrastrar Toda
                        </div>
                      </div>
                    )}

                    {/* Personitas individuales */}
                    <div className="space-y-1">
                      {fam.guests.map((guest) => (
                        <div
                          key={guest.id}
                          draggable
                          onDragStart={(e) => handleDragGuestStart(e, guest)}
                          className="p-1.5 rounded-xl bg-white border border-stone-200 hover:border-wedding-accent hover:shadow-xs flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing group/item"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <PersonAvatar
                              guest={guest}
                              showName={false}
                              size={32}
                            />
                            <div className="truncate">
                              <span className="text-xs font-bold text-stone-800 block truncate leading-tight group-hover/item:text-wedding-primary">
                                {guest.name}
                              </span>
                              {guest.family_name && (
                                <span className="text-[10px] text-stone-400 block truncate">
                                  {guest.family_name}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setTargetQuickTable(null);
                              setIsQuickAssignOpen(true);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 hover:bg-wedding-primary hover:text-white text-stone-600 font-semibold cursor-pointer shrink-0"
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

            <div className="pt-2 border-t border-stone-100 text-[10px] text-stone-400 text-center">
              💡 <em>Arrastra la personita hacia cualquier mesa</em>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50"
            title="Abrir lista de invitados sin mesa"
          >
            <span className="writing-mode-vertical text-xs font-bold text-stone-500 tracking-widest uppercase rotate-180">
              Invitados ({unassignedGuests.length})
            </span>
          </div>
        )}
      </aside>

      {/* 4. Controles de Zoom Flotantes (Bottom Right HUD) */}
      <div className="absolute bottom-4 right-4 z-30 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-stone-200/90 shadow-md flex items-center gap-2">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(1))))}
          className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-600 cursor-pointer"
          title="Alejar (-)"
        >
          <ZoomOut size={16} />
        </button>

        <span className="text-xs font-mono font-bold text-stone-700 min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(1))))}
          className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-600 cursor-pointer"
          title="Acercar (+)"
        >
          <ZoomIn size={16} />
        </button>

        <div className="h-4 w-px bg-stone-200 mx-1" />

        <button
          type="button"
          onClick={handleResetView}
          className="text-[11px] font-semibold text-stone-600 hover:text-wedding-primary px-2 py-1 rounded-lg hover:bg-stone-100 cursor-pointer"
          title="Restablecer posición y zoom"
        >
          Centrar
        </button>
      </div>

      {/* Modales */}
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
