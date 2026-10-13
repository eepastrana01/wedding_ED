import React, { useState } from 'react';
import { PersonAvatar, EmptySeatSlot } from './PersonAvatar';
import { 
  Users, Edit2, Trash2, RotateCcw, Plus, AlertTriangle, Check, 
  Utensils, Move, Sparkles 
} from 'lucide-react';

export function InteractiveTable({
  table,
  onEdit,
  onDelete,
  onClear,
  onAssignGuests,
  onUnassignGuest,
  onQuickAssignClick,
  onStartDragTable,
  zoom = 1,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingTable, setIsDraggingTable] = useState(false);

  const guests = table.guests || [];
  const capacity = table.capacity || 10;
  const shape = table.shape || 'round';
  const seatedCount = guests.length;
  const isOverCapacity = seatedCount > capacity;
  const isFull = seatedCount === capacity;
  const freeSeats = Math.max(0, capacity - seatedCount);
  const totalSlots = Math.max(capacity, seatedCount);

  // Drag and drop for guests
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const rawData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const data = JSON.parse(rawData);

      if (data.type === 'guest' && data.guestId) {
        onAssignGuests(table.id, [data.guestId]);
      } else if (data.type === 'family' && Array.isArray(data.guestIds)) {
        onAssignGuests(table.id, data.guestIds);
      }
    } catch (err) {
      console.error('Error in table drop:', err);
    }
  };

  // Drag start for seated guest avatar
  const handleSeatDragStart = (e, guest) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    const payload = JSON.stringify({
      type: 'guest',
      guestId: guest.id,
      fromTableId: table.id,
    });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', payload);
  };

  // Dimensions for round table
  // Table diameter: 220px, total canvas radius including seats: 170px (diameter 340px)
  const roundRadius = 118; // Distance of avatars from center

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative select-none transition-shadow duration-300 ${
        isDragOver ? 'scale-105' : ''
      }`}
      style={{
        width: shape === 'rectangular' ? '440px' : '360px',
        height: shape === 'rectangular' ? '300px' : '360px',
      }}
    >
      {/* Halo de arrastre (Drop Target Glow) */}
      {isDragOver && (
        <div className="absolute inset-0 rounded-full bg-amber-400/20 border-4 border-dashed border-amber-500 animate-pulse pointer-events-none z-0" />
      )}

      {/* Renderizado según la forma: REDONDA */}
      {shape === 'round' && (
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* El Mantel / Círculo de la Mesa (Exacto al estilo del plano de referencia) */}
          <div 
            onMouseDown={(e) => {
              if (e.button === 0 && !e.target.closest('button')) {
                onStartDragTable && onStartDragTable(table, e);
              }
            }}
            className="relative w-48 h-48 rounded-full bg-[#E8E8E8] border-4 border-[#C8C8C8] shadow-[0_10px_25px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center text-center z-10 group/center transition-all hover:border-wedding-primary/50 cursor-grab active:cursor-grabbing"
          >
            
            {/* Número grande de mesa en el centro */}
            <span className="font-sans font-light text-5xl text-stone-600 tracking-tight leading-none pointer-events-none">
              {table.table_number}
            </span>

            {/* Nombre opcional de la mesa */}
            {table.name ? (
              <span className="font-serif italic text-xs font-semibold text-wedding-primaryDark mt-1 px-3 truncate max-w-[140px] pointer-events-none" title={table.name}>
                {table.name}
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mt-1 pointer-events-none">
                Mesa
              </span>
            )}

            {/* Contador de ocupación (ej. 8/10) */}
            <div className={`mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs inline-flex items-center gap-1 pointer-events-none ${
              isOverCapacity
                ? 'bg-rose-500 text-white'
                : isFull
                  ? 'bg-emerald-600 text-white'
                  : seatedCount > 0
                    ? 'bg-white/90 text-stone-700 border border-stone-300'
                    : 'bg-stone-200/90 text-stone-500'
            }`}>
              <Users size={11} />
              <span>{seatedCount}/{capacity}</span>
            </div>

            {/* Menú de acciones en hover sobre el centro de la mesa */}
            <div className="absolute inset-0 rounded-full bg-stone-900/75 backdrop-blur-2xs opacity-0 group-hover/center:opacity-100 flex items-center justify-center gap-1.5 transition-opacity duration-200 z-30">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartDragTable && onStartDragTable(table, e);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-wedding-primary text-white flex items-center justify-center transition-colors cursor-move"
                title="Mover mesa en el plano"
              >
                <Move size={14} />
              </button>
              <button
                type="button"
                onClick={() => onQuickAssignClick(table)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-wedding-primary flex items-center justify-center transition-colors cursor-pointer"
                title="Agregar comensales"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={() => onEdit(table)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Editar mesa"
              >
                <Edit2 size={14} />
              </button>
              {seatedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Desocupar todos los invitados de la Mesa ${table.table_number}?`)) {
                      onClear(table.id);
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-amber-400 text-white hover:text-amber-950 flex items-center justify-center transition-colors cursor-pointer"
                  title="Desocupar mesa"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Eliminar la Mesa ${table.table_number}?`)) {
                    onDelete(table.id);
                  }
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-rose-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Eliminar mesa"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* SILLAS Y PERSONITAS alrededor de la mesa circular (360°) */}
          {Array.from({ length: totalSlots }).map((_, i) => {
            const angle = (2 * Math.PI * i) / totalSlots - Math.PI / 2;
            const x = 180 + roundRadius * Math.cos(angle);
            const y = 180 + roundRadius * Math.sin(angle);
            const guest = guests[i];

            return (
              <div
                key={guest ? guest.id : `empty-${table.id}-${i}`}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20,
                }}
              >
                {guest ? (
                  <PersonAvatar
                    guest={guest}
                    radialAngle={angle}
                    seatNumber={i + 1}
                    onDragStart={(e) => handleSeatDragStart(e, guest)}
                    onRemove={() => onUnassignGuest([guest.id])}
                    onClick={() => onQuickAssignClick(table)}
                    showName={true}
                    size={48}
                  />
                ) : (
                  <EmptySeatSlot
                    seatNumber={i + 1}
                    radialAngle={angle}
                    onClick={() => onQuickAssignClick(table)}
                    onDrop={(e) => handleDrop(e)}
                    size={44}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Renderizado según la forma: RECTANGULAR / IMPERIAL */}
      {shape === 'rectangular' && (
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* El Tablón Rectangular */}
          <div 
            onMouseDown={(e) => {
              if (e.button === 0 && !e.target.closest('button')) {
                onStartDragTable && onStartDragTable(table, e);
              }
            }}
            className="relative w-72 h-36 rounded-2xl bg-[#E8E8E8] border-4 border-[#C8C8C8] shadow-md flex flex-col items-center justify-center text-center z-10 group/center cursor-grab active:cursor-grabbing"
          >
            <span className="font-sans font-light text-4xl text-stone-600 leading-none pointer-events-none">
              {table.table_number}
            </span>
            <span className="font-serif italic text-xs font-semibold text-wedding-primaryDark mt-1 pointer-events-none">
              {table.name || 'Mesa Imperial'}
            </span>
            <span className="text-[11px] font-bold text-stone-600 bg-white/90 px-2 py-0.5 rounded-full mt-1 border border-stone-200 pointer-events-none">
              {seatedCount}/{capacity}
            </span>

            {/* Hover Actions */}
            <div className="absolute inset-0 rounded-2xl bg-stone-900/75 backdrop-blur-2xs opacity-0 group-hover/center:opacity-100 flex items-center justify-center gap-2 transition-opacity z-30">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartDragTable && onStartDragTable(table, e);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-wedding-primary text-white flex items-center justify-center cursor-move"
                title="Mover mesa en el plano"
              >
                <Move size={14} />
              </button>
              <button
                type="button"
                onClick={() => onQuickAssignClick(table)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-wedding-primary flex items-center justify-center cursor-pointer"
                title="Agregar"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={() => onEdit(table)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-stone-800 flex items-center justify-center cursor-pointer"
                title="Editar"
              >
                <Edit2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(table.id)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-rose-500 text-white flex items-center justify-center cursor-pointer"
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* SILLAS a lo largo de los lados superior e inferior */}
          {Array.from({ length: totalSlots }).map((_, i) => {
            const isTopRow = i % 2 === 0;
            const colIndex = Math.floor(i / 2);
            const totalCols = Math.ceil(totalSlots / 2);
            const colWidth = 260 / Math.max(1, totalCols);
            const x = 90 + colIndex * colWidth;
            const y = isTopRow ? 50 : 250;
            const guest = guests[i];

            return (
              <div
                key={guest ? guest.id : `rect-empty-${table.id}-${i}`}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20,
                }}
              >
                {guest ? (
                  <PersonAvatar
                    guest={guest}
                    seatNumber={i + 1}
                    radialAngle={isTopRow ? -Math.PI / 2 : Math.PI / 2}
                    onDragStart={(e) => handleSeatDragStart(e, guest)}
                    onRemove={() => onUnassignGuest([guest.id])}
                    onClick={() => onQuickAssignClick(table)}
                    showName={true}
                    size={46}
                  />
                ) : (
                  <EmptySeatSlot
                    seatNumber={i + 1}
                    radialAngle={isTopRow ? -Math.PI / 2 : Math.PI / 2}
                    onClick={() => onQuickAssignClick(table)}
                    onDrop={(e) => handleDrop(e)}
                    size={42}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Mesa Presidencial de los Novios (Bride & Groom) + Mesa de Regalos
export function SweetheartHeadTable({
  groomName = 'Edis',
  brideName = 'Dania',
  onAssignNovios,
}) {
  return (
    <div className="flex items-center gap-10 select-none">
      {/* Semicircular Bride & Groom Table */}
      <div className="relative flex flex-col items-center">
        {/* Personitas Novios sentados */}
        <div className="flex items-center gap-8 mb-[-12px] z-20">
          <div className="flex flex-col items-center">
            <span className="font-serif font-bold text-xs text-stone-800 mb-0.5">
              Novia
            </span>
            <PersonAvatar
              isBride={true}
              showName={false}
              size={52}
            />
            <span className="font-sans font-bold text-[11px] text-stone-700 mt-1">
              {brideName}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-serif font-bold text-xs text-stone-800 mb-0.5">
              Novio
            </span>
            <PersonAvatar
              isGroom={true}
              showName={false}
              size={52}
            />
            <span className="font-sans font-bold text-[11px] text-stone-700 mt-1">
              {groomName}
            </span>
          </div>
        </div>

        {/* Mesa Semicircular de los Novios (Exacta al boceto arquitectónico) */}
        <div 
          className="relative w-64 h-32 bg-[#E8E8E8] border-4 border-[#C8C8C8] shadow-lg flex items-center justify-center text-center z-10"
          style={{
            borderBottomLeftRadius: '130px',
            borderBottomRightRadius: '130px',
          }}
        >
          <div className="mt-4">
            <span className="font-serif text-stone-500 font-bold text-sm tracking-widest uppercase block">
              Mesa Presidencial
            </span>
            <span className="font-serif italic font-extrabold text-wedding-primaryDark text-base">
              {brideName} & {groomName}
            </span>
          </div>
        </div>
      </div>

      {/* Mesa de Regalos / Decoración (Icono de regalo idéntico al del boceto) */}
      <div className="relative flex flex-col items-center group cursor-pointer" title="Mesa de Regalos y Sobres">
        <div className="w-20 h-20 rounded-full bg-white border-2 border-dashed border-stone-400 group-hover:border-wedding-primary flex items-center justify-center text-stone-600 group-hover:text-wedding-primary shadow-xs transition-colors">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12v10H4V12" />
            <path d="M2 7h20v5H2z" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        </div>
        <span className="font-serif text-[11px] font-bold text-stone-500 mt-1 uppercase tracking-wider">
          Regalos
        </span>
      </div>
    </div>
  );
}
