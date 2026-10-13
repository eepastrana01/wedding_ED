import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { InteractiveTable, SweetheartHeadTable } from './InteractiveTable';
import { PersonAvatar } from './PersonAvatar';
import { TableModal } from './TableModal';
import { TablePrintModal } from './TablePrintModal';
import { QuickAssignModal } from './QuickAssignModal';
import { 
  ZoomIn, ZoomOut, Maximize2, Minimize2, Move, Plus, Search, 
  Users, Home, Wand2, Printer, Check, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, Compass, X,
  Layers, RotateCcw, Sparkles, Utensils, ExternalLink, Grid
} from 'lucide-react';
import { matchesSearch } from '../../utils/textUtils';

export function FloorPlanStudio({ 
  isFullscreenMode = false, 
  isStandaloneTab = false,
  onToggleFullscreen 
}) {
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

  // Canvas pan & zoom state (Responsive defaults para móvil y PC)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [zoom, setZoom] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 0.6 : 1));
  const [pan, setPan] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return {
        x: Math.round(window.innerWidth / 2 - 780 * 0.6),
        y: 20,
      };
    }
    return { x: 0, y: 0 };
  });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Sidebar / Drawer state (Inicia cerrado en móviles y tablets para dar visión total)
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'confirmed', 'with_family'

  // Modals state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isQuickAssignOpen, setIsQuickAssignOpen] = useState(false);
  const [targetQuickTable, setTargetQuickTable] = useState(null);

  const canvasRef = useRef(null);

  // Helper para calcular coordenadas por defecto espaciadas
  const getTableCoordinates = useCallback((table, index) => {
    if (table.pos_x && table.pos_y && (table.pos_x !== 0 || table.pos_y !== 0)) {
      return { x: table.pos_x, y: table.pos_y };
    }
    const cols = 3;
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      x: 140 + col * 460,
      y: 340 + row * 440,
    };
  }, []);

  // Estado local de posiciones de mesas (para arrastre fluido a 60fps)
  const [localTableCoords, setLocalTableCoords] = useState({});
  const [movingTable, setMovingTable] = useState(null);

  // Sincronizar coordenadas al recibir tablas
  useEffect(() => {
    const coords = {};
    tables.forEach((t, i) => {
      coords[t.id] = getTableCoordinates(t, i);
    });
    setLocalTableCoords(coords);
  }, [tables, getTableCoordinates]);

  // Sincronización continua de referencias para callbacks táctiles sin cierres obsoletos
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const movingTableRef = useRef(null);
  const localTableCoordsRef = useRef({});
  const touchTrackingRef = useRef({
    mode: null,
    startTouch1: { x: 0, y: 0 },
    startTouch2: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
    startDistance: 0,
    startZoom: 1,
    midpoint: { x: 0, y: 0 },
  });

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { movingTableRef.current = movingTable; }, [movingTable]);
  useEffect(() => { localTableCoordsRef.current = localTableCoords; }, [localTableCoords]);

  // Manejador para empezar a mover una mesa (ratón o toque táctil)
  const handleStartDragTable = (table, e) => {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    const currentPos = localTableCoordsRef.current[table.id] || getTableCoordinates(table, 0);
    const newMoving = {
      id: table.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      initialX: currentPos.x,
      initialY: currentPos.y,
    };
    movingTableRef.current = newMoving;
    setMovingTable(newMoving);
  };

  // 1. Motor Táctil para Móvil y Tablets (Paneo con 1 dedo, Pinch-to-zoom con 2 dedos, y arrastre de mesas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e) => {
      if (e.target.closest('button, input, select, textarea, [role="dialog"], .modal-backdrop')) {
        return;
      }

      if (e.touches.length === 1) {
        if (!movingTableRef.current) {
          touchTrackingRef.current.mode = 'pan';
          touchTrackingRef.current.startTouch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          touchTrackingRef.current.startPan = { ...panRef.current };
          setIsPanning(true);
        }
      } else if (e.touches.length === 2) {
        e.preventDefault();
        touchTrackingRef.current.mode = 'pinch';
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        touchTrackingRef.current.startDistance = Math.max(10, dist);
        touchTrackingRef.current.startZoom = zoomRef.current;
        touchTrackingRef.current.midpoint = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
        touchTrackingRef.current.startPan = { ...panRef.current };
        setIsPanning(false);
      }
    };

    const onTouchMove = (e) => {
      if (movingTableRef.current || touchTrackingRef.current.mode) {
        if (e.cancelable) e.preventDefault();
      }

      // Arrastre táctil de mesa
      if (movingTableRef.current && e.touches.length > 0) {
        const touch = e.touches[0];
        const m = movingTableRef.current;
        const currentZoom = zoomRef.current || 1;
        const deltaX = (touch.clientX - m.startMouseX) / currentZoom;
        const deltaY = (touch.clientY - m.startMouseY) / currentZoom;
        const newX = Math.round((m.initialX + deltaX) / 10) * 10;
        const newY = Math.round((m.initialY + deltaY) / 10) * 10;

        const updated = {
          ...localTableCoordsRef.current,
          [m.id]: { x: Math.max(20, newX), y: Math.max(260, newY) },
        };
        localTableCoordsRef.current = updated;
        setLocalTableCoords(updated);
        return;
      }

      // Pinch to zoom táctil
      if (touchTrackingRef.current.mode === 'pinch' && e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const newDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const { startDistance, startZoom, startPan, midpoint } = touchTrackingRef.current;
        const scaleChange = newDist / startDistance;
        const nextZoom = Math.min(1.6, Math.max(0.35, Number((startZoom * scaleChange).toFixed(2))));

        const rect = canvas.getBoundingClientRect();
        const relMidX = midpoint.x - rect.left;
        const relMidY = midpoint.y - rect.top;
        const newPanX = relMidX - (relMidX - startPan.x) * (nextZoom / startZoom);
        const newPanY = relMidY - (relMidY - startPan.y) * (nextZoom / startZoom);

        zoomRef.current = nextZoom;
        setZoom(nextZoom);
        panRef.current = { x: newPanX, y: newPanY };
        setPan({ x: newPanX, y: newPanY });
        return;
      }

      // Paneo táctil con 1 dedo
      if (touchTrackingRef.current.mode === 'pan' && e.touches.length === 1) {
        const touch = e.touches[0];
        const { startTouch1, startPan } = touchTrackingRef.current;
        const dx = touch.clientX - startTouch1.x;
        const dy = touch.clientY - startTouch1.y;
        const newPan = { x: startPan.x + dx, y: startPan.y + dy };
        panRef.current = newPan;
        setPan(newPan);
      }
    };

    const onTouchEnd = (e) => {
      if (movingTableRef.current) {
        const m = movingTableRef.current;
        const finalPos = localTableCoordsRef.current[m.id];
        if (finalPos) {
          updateTable(m.id, {
            pos_x: Math.round(finalPos.x),
            pos_y: Math.round(finalPos.y),
          });
        }
        movingTableRef.current = null;
        setMovingTable(null);
      }

      if (e.touches.length === 0) {
        touchTrackingRef.current.mode = null;
        setIsPanning(false);
      } else if (e.touches.length === 1 && touchTrackingRef.current.mode === 'pinch') {
        touchTrackingRef.current.mode = 'pan';
        touchTrackingRef.current.startTouch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        touchTrackingRef.current.startPan = { ...panRef.current };
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [updateTable]);

  // 2. Motor de Ratón para Escritorio (Paneo y arrastre con ventana activa)
  const handleMouseDown = (e) => {
    if (
      e.target === canvasRef.current || 
      e.target.classList.contains('canvas-background') ||
      e.target.classList.contains('canvas-surface')
    ) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (movingTableRef.current) {
        const m = movingTableRef.current;
        const currentZoom = zoomRef.current || 1;
        const deltaX = (e.clientX - m.startMouseX) / currentZoom;
        const deltaY = (e.clientY - m.startMouseY) / currentZoom;
        const newX = Math.round((m.initialX + deltaX) / 10) * 10;
        const newY = Math.round((m.initialY + deltaY) / 10) * 10;
        
        const updated = {
          ...localTableCoordsRef.current,
          [m.id]: { x: Math.max(20, newX), y: Math.max(260, newY) },
        };
        localTableCoordsRef.current = updated;
        setLocalTableCoords(updated);
      } else if (isPanning) {
        const newPan = {
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y,
        };
        panRef.current = newPan;
        setPan(newPan);
      }
    };

    const onMouseUp = () => {
      if (movingTableRef.current) {
        const m = movingTableRef.current;
        const finalPos = localTableCoordsRef.current[m.id];
        if (finalPos) {
          updateTable(m.id, {
            pos_x: Math.round(finalPos.x),
            pos_y: Math.round(finalPos.y),
          });
        }
        movingTableRef.current = null;
        setMovingTable(null);
      }
      setIsPanning(false);
    };

    if (movingTable || isPanning) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [movingTable, isPanning, startPan, updateTable]);

  // Auto-alinear mesas en cuadrícula ordenada
  const handleAutoAlignTables = () => {
    const cols = 3;
    const newCoords = {};
    tables.forEach((t, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 140 + col * 460;
      const y = 340 + row * 440;
      newCoords[t.id] = { x, y };
      updateTable(t.id, { pos_x: x, pos_y: y });
    });
    setLocalTableCoords(newCoords);
  };

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

  const handleResetView = () => {
    const isMob = typeof window !== 'undefined' && window.innerWidth < 768;
    const targetZoom = isMob ? 0.6 : 1;
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const targetPan = {
      x: Math.round(screenW / 2 - 780 * targetZoom),
      y: 20,
    };
    setZoom(targetZoom);
    setPan(targetPan);
    zoomRef.current = targetZoom;
    panRef.current = targetPan;
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

  const handleOpenQuickAssign = (table = null) => {
    setTargetQuickTable(table);
    setIsQuickAssignOpen(true);
  };

  return (
    <div 
      className={`relative w-full overflow-hidden select-none bg-[#F7F8FA] flex flex-col ${
        isFullscreenMode || isStandaloneTab 
          ? 'fixed inset-0 z-50 h-screen w-screen' 
          : 'h-[85vh] rounded-3xl border border-wedding-border shadow-md'
      }`}
    >
      {/* 1. Barra de Herramientas Superior del Estudio (Floating Studio HUD) */}
      {/* 1. Barra de Herramientas Superior del Estudio (Floating Studio HUD) */}
      <header className="absolute top-3 left-3 right-3 z-30 bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-stone-200/90 shadow-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-wedding-primary text-wedding-accent flex items-center justify-center font-serif font-bold text-xs shadow-xs shrink-0">
              E&D
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif font-bold text-xs sm:text-sm text-wedding-primaryDark leading-tight truncate">
                  Estudio del Salón
                </h3>
                {isStandaloneTab && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wider">
                    Pestaña Completa
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-500 font-medium hidden sm:block truncate">
                Plano 360° Interactivo con Personitas & Arrastre de Mesas
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Botón Móvil/Tablet para abrir Invitados Sin Asignar */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isDrawerOpen
                ? 'bg-wedding-primary text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200'
            }`}
            title="Ver invitados sin mesa"
          >
            <Users size={14} className={isDrawerOpen ? 'text-wedding-accent' : 'text-amber-700'} />
            <span className="text-xs font-bold">{unassignedGuests.length}</span>
            <span className="hidden sm:inline text-xs font-semibold">Sin mesa</span>
          </button>

          {/* Botón Auto-alinear Mesas */}
          {tables.length > 0 && (
            <button
              type="button"
              onClick={handleAutoAlignTables}
              className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="Alinear todas las mesas en orden"
            >
              <Grid size={13} />
              <span className="hidden md:inline">Auto-alinear</span>
            </button>
          )}

          {/* Botón + Mesa */}
          <button
            type="button"
            onClick={() => {
              setEditingTable(null);
              setIsTableModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-wedding-primary text-white text-xs font-bold hover:bg-wedding-primaryDark transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus size={14} className="text-wedding-accent" />
            <span>Mesa</span>
          </button>

          {/* Botón Abrir en Nueva Pestaña (Para ocupar todo el navegador en la PC) */}
          {!isStandaloneTab && (
            <a
              href="/?tab=tables&standalone=true"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="Abrir en pestaña nueva para ocupar el 100% del navegador"
            >
              <ExternalLink size={13} />
              <span className="hidden lg:inline">Nueva Pestaña</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer hidden sm:flex"
            title="Imprimir plano de mesas"
          >
            <Printer size={14} />
          </button>

          {onToggleFullscreen && !isStandaloneTab && (
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
        className="canvas-background relative flex-1 w-full h-full overflow-hidden cursor-default touch-none"
        style={{
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
            transformOrigin: '0 0',
            transition: isPanning || movingTable ? 'none' : 'transform 0.15s ease-out',
          }}
          className="canvas-surface relative min-w-[2000px] min-h-[1800px] pt-24 pb-40 px-20"
        >
          {/* A. Encabezado del Salón: Mesa Presidencial de los Novios (Bride & Groom) */}
          <div className="absolute top-10 left-[780px] -translate-x-1/2 flex flex-col items-center z-10 pointer-events-auto">
            <div className="mb-2 px-3 py-1 rounded-full bg-stone-200/70 border border-stone-300 text-[10px] font-bold tracking-widest uppercase text-stone-600">
              Cabecera del Salón • Pista de Baile & Banquete
            </div>
            <SweetheartHeadTable
              brideName="Dania"
              groomName="Edis"
            />
          </div>

          {/* B. Salón Principal: Mesas Posicionadas Libremente en el Plano */}
          {tables.length === 0 ? (
            <div className="absolute top-80 left-1/2 -translate-x-1/2 p-10 bg-white/95 rounded-3xl border border-stone-300 shadow-lg text-center max-w-md backdrop-blur-xs z-10">
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
            tables.map((table, i) => {
              const coords = localTableCoords[table.id] || getTableCoordinates(table, i);
              const isMoving = movingTable?.id === table.id;
              return (
                <div
                  key={table.id}
                  style={{
                    position: 'absolute',
                    left: `${coords.x}px`,
                    top: `${coords.y}px`,
                    zIndex: isMoving ? 40 : 20,
                    transition: isMoving ? 'none' : 'box-shadow 0.2s',
                  }}
                  className={isMoving ? 'scale-105 shadow-2xl ring-4 ring-wedding-accent/40 rounded-full' : ''}
                >
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
                    onStartDragTable={handleStartDragTable}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Backdrop oscuro para móvil cuando se abre la gaveta de invitados */}
      {isDrawerOpen && (
        <div 
          onClick={() => setIsDrawerOpen(false)}
          className="md:hidden fixed inset-0 z-25 bg-stone-900/40 backdrop-blur-2xs transition-opacity cursor-pointer"
        />
      )}

      {/* 3. Gaveta Deslizante de Invitados Sin Asignar (Slide-out Left Drawer) */}
      <aside
        className={`absolute top-16 bottom-4 left-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200 shadow-xl transition-all duration-300 flex flex-col overflow-hidden max-w-[calc(100vw-24px)] ${
          isDrawerOpen ? 'w-72 sm:w-80' : 'w-0 md:w-10 overflow-hidden border-0 md:border pointer-events-none md:pointer-events-auto'
        }`}
      >
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="absolute top-3 right-2.5 z-40 p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
          title={isDrawerOpen ? 'Ocultar panel' : 'Mostrar invitados'}
        >
          {isDrawerOpen ? <X size={15} /> : <ChevronRight size={16} />}
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

                    {/* Personitas individuales con traje/vestido corregido */}
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
            className="hidden md:flex flex-1 flex-col items-center justify-center cursor-pointer hover:bg-stone-50"
            title="Abrir lista de invitados sin mesa"
          >
            <span className="writing-mode-vertical text-xs font-bold text-stone-500 tracking-widest uppercase rotate-180">
              Invitados ({unassignedGuests.length})
            </span>
          </div>
        )}
      </aside>

      {/* 4. D-Pad / Control Pad de Navegación Rápida para Móvil y Táctil (Bottom Left HUD) */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-stone-200/90 shadow-md flex flex-col items-center gap-0.5 select-none">
          {/* Botón Arriba */}
          <button
            type="button"
            onClick={() => {
              const newPan = { ...panRef.current, y: panRef.current.y + 140 };
              panRef.current = newPan;
              setPan(newPan);
            }}
            className="w-7 h-7 rounded-xl bg-stone-50 hover:bg-stone-200 active:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Mover salón hacia arriba"
          >
            <ChevronUp size={15} />
          </button>

          <div className="flex items-center gap-0.5">
            {/* Botón Izquierda */}
            <button
              type="button"
              onClick={() => {
                const newPan = { ...panRef.current, x: panRef.current.x + 140 };
                panRef.current = newPan;
                setPan(newPan);
              }}
              className="w-7 h-7 rounded-xl bg-stone-50 hover:bg-stone-200 active:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Mover salón a la izquierda"
            >
              <ChevronLeft size={15} />
            </button>

            {/* Botón Centrar Salón */}
            <button
              type="button"
              onClick={handleResetView}
              className="w-7 h-7 rounded-xl bg-wedding-primary/10 hover:bg-wedding-primary active:bg-wedding-primaryDark text-wedding-primary hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Centrar Salón y Mesa Presidencial"
            >
              <Compass size={14} />
            </button>

            {/* Botón Derecha */}
            <button
              type="button"
              onClick={() => {
                const newPan = { ...panRef.current, x: panRef.current.x - 140 };
                panRef.current = newPan;
                setPan(newPan);
              }}
              className="w-7 h-7 rounded-xl bg-stone-50 hover:bg-stone-200 active:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Mover salón a la derecha"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Botón Abajo */}
          <button
            type="button"
            onClick={() => {
              const newPan = { ...panRef.current, y: panRef.current.y - 140 };
              panRef.current = newPan;
              setPan(newPan);
            }}
            className="w-7 h-7 rounded-xl bg-stone-50 hover:bg-stone-200 active:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Mover salón hacia abajo"
          >
            <ChevronDown size={15} />
          </button>
        </div>
      </div>

      {/* 5. Controles de Zoom Flotantes (Bottom Right HUD) */}
      <div className="absolute bottom-4 right-4 z-30 bg-white/95 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-2xl border border-stone-200/90 shadow-md flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => {
            const nextZoom = Math.max(0.35, Number((zoom - 0.1).toFixed(1)));
            zoomRef.current = nextZoom;
            setZoom(nextZoom);
          }}
          className="p-1 sm:p-1.5 rounded-xl hover:bg-stone-100 text-stone-600 cursor-pointer"
          title="Alejar (-)"
        >
          <ZoomOut size={15} />
        </button>

        <span className="text-xs font-mono font-bold text-stone-700 min-w-[36px] sm:min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => {
            const nextZoom = Math.min(1.6, Number((zoom + 0.1).toFixed(1)));
            zoomRef.current = nextZoom;
            setZoom(nextZoom);
          }}
          className="p-1 sm:p-1.5 rounded-xl hover:bg-stone-100 text-stone-600 cursor-pointer"
          title="Acercar (+)"
        >
          <ZoomIn size={15} />
        </button>

        <div className="h-4 w-px bg-stone-200 mx-0.5 sm:mx-1" />

        <button
          type="button"
          onClick={handleResetView}
          className="text-[10px] sm:text-[11px] font-semibold text-stone-600 hover:text-wedding-primary px-1.5 sm:px-2 py-1 rounded-lg hover:bg-stone-100 cursor-pointer"
          title="Restablecer posición y centrar salón"
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
