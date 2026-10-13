import React, { useState } from 'react';
import { 
  Users, Edit2, Trash2, RotateCcw, AlertTriangle, 
  Utensils, Info, Check, UserMinus, Plus, Heart 
} from 'lucide-react';

export function RoundTableCard({
  table,
  onEdit,
  onDelete,
  onClear,
  onAssignGuests,
  onUnassignGuest,
  onQuickAssignClick,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredGuest, setHoveredGuest] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const guests = table.guests || [];
  const capacity = table.capacity || 10;
  const seatedCount = guests.length;
  const isFull = seatedCount === capacity;
  const isOverCapacity = seatedCount > capacity;
  const freeSeats = Math.max(0, capacity - seatedCount);

  // Detect special dietary restrictions
  const guestsWithDietary = guests.filter(g => g.dietary_notes && g.dietary_notes.trim().length > 0);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only set false if leaving the table card
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
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
      console.error('Error handling table drop:', err);
    }
  };

  const handleSeatDragStart = (e, guest) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'guest',
      guestId: guest.id,
      fromTableId: table.id,
    }));
  };

  // Helper to extract initials
  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  // Circular seat coordinates calculation
  // Radius percentage from center
  const radius = 39; 
  const totalSlots = Math.max(capacity, seatedCount);

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-white rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden flex flex-col ${
        isDragOver 
          ? 'border-wedding-accent ring-4 ring-wedding-accent/30 bg-amber-50/40 scale-[1.02]' 
          : isOverCapacity
            ? 'border-rose-300 bg-rose-50/10'
            : 'border-stone-200/90'
      }`}
    >
      {/* Drag Over Banner Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 bg-gradient-to-b from-amber-100/90 via-white/85 to-amber-100/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center pointer-events-none animate-in fade-in duration-150">
          <div className="w-14 h-14 rounded-full bg-wedding-accent/20 border-2 border-wedding-accent flex items-center justify-center text-wedding-accentDark mb-2 animate-bounce">
            <Plus size={28} />
          </div>
          <p className="font-serif font-bold text-wedding-primaryDark text-base">
            Soltar en Mesa {table.table_number}
          </p>
          <p className="text-xs text-stone-600 font-medium">
            {table.name || 'Mesa Redonda'} ({freeSeats} sillas disponibles)
          </p>
        </div>
      )}

      {/* Card Header */}
      <div className="px-5 pt-4 pb-2 border-b border-stone-100 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-bold text-wedding-primaryDark">
              Mesa {table.table_number}
            </span>
            {isOverCapacity && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                <AlertTriangle size={11} />
                Sobrecupada
              </span>
            )}
            {isFull && !isOverCapacity && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Check size={11} />
                Llena
              </span>
            )}
          </div>
          {table.name ? (
            <p className="text-xs font-semibold text-wedding-accentDark truncate max-w-[200px]" title={table.name}>
              {table.name}
            </p>
          ) : (
            <p className="text-xs text-stone-400 font-normal">
              Mesa de Banquete
            </p>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-stone-400">
          <button
            type="button"
            onClick={() => onQuickAssignClick(table)}
            className="p-1.5 rounded-xl hover:bg-stone-100 hover:text-wedding-primary transition-colors cursor-pointer"
            title="Agregar invitados a esta mesa"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(table)}
            className="p-1.5 rounded-xl hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
            title="Editar mesa y capacidad"
          >
            <Edit2 size={15} />
          </button>
          {seatedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Desocupar todos los invitados de la Mesa ${table.table_number}?`)) {
                  onClear(table.id);
                }
              }}
              className="p-1.5 rounded-xl hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
              title="Desocupar mesa (mover todos a sin asignar)"
            >
              <RotateCcw size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`¿Eliminar la Mesa ${table.table_number}? Los invitados quedarán sin asignar.`)) {
                onDelete(table.id);
              }
            }}
            className="p-1.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            title="Eliminar mesa"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Visual Round Table Layout */}
      <div className="p-4 sm:p-5 flex flex-col items-center justify-center select-none">
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
          
          {/* Circular table centerpiece */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#FAF8F5] via-stone-50 to-[#ECE6DC] border-4 border-stone-200/90 shadow-md flex flex-col items-center justify-center text-center p-2 z-10 transition-transform duration-200 group-hover:scale-105">
            <span className="font-serif text-xs uppercase tracking-widest text-stone-500 font-semibold">
              Mesa
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-wedding-primaryDark leading-none my-0.5">
              {table.table_number}
            </span>
            
            {/* Occupancy meter */}
            <div className={`mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-tight inline-flex items-center gap-1 shadow-2xs ${
              isOverCapacity
                ? 'bg-rose-500 text-white'
                : isFull
                  ? 'bg-emerald-600 text-white'
                  : seatedCount > 0
                    ? 'bg-wedding-primary/10 text-wedding-primaryDark'
                    : 'bg-stone-200/80 text-stone-600'
            }`}>
              <Users size={11} />
              <span>{seatedCount}/{capacity}</span>
            </div>
          </div>

          {/* Seats arranged circularly around table */}
          {Array.from({ length: totalSlots }).map((_, i) => {
            const angle = (2 * Math.PI * i) / totalSlots - Math.PI / 2;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            const guest = guests[i];

            if (guest) {
              const hasDietary = Boolean(guest.dietary_notes && guest.dietary_notes.trim());
              return (
                <div
                  key={guest.id}
                  draggable
                  onDragStart={(e) => handleSeatDragStart(e, guest)}
                  onMouseEnter={() => setHoveredGuest(guest)}
                  onMouseLeave={() => setHoveredGuest(null)}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-20 group/seat cursor-grab active:cursor-grabbing"
                  title={`${guest.name}${guest.family_name ? ` (${guest.family_name})` : ''}`}
                >
                  <div className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs text-white shadow-md border-2 border-white transition-all duration-200 group-hover/seat:scale-125 group-hover/seat:z-30 ${
                    hasDietary
                      ? 'bg-gradient-to-tr from-amber-600 to-amber-500 ring-2 ring-amber-300'
                      : guest.status === 'confirmed'
                        ? 'bg-gradient-to-tr from-emerald-700 to-wedding-primary'
                        : 'bg-gradient-to-tr from-stone-600 to-stone-500'
                  }`}>
                    {getInitials(guest.name)}

                    {/* Dietary badge indicator dot */}
                    {hasDietary && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-white text-[8px] flex items-center justify-center text-amber-950 font-bold" title={guest.dietary_notes}>
                        !
                      </span>
                    )}
                  </div>

                  {/* Seat Quick Action Popover (on hover / mobile) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnassignGuest([guest.id]);
                    }}
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-800 text-white opacity-0 group-hover/seat:opacity-100 hover:bg-rose-600 flex items-center justify-center transition-opacity shadow-xs cursor-pointer z-30"
                    title={`Desasignar a ${guest.name}`}
                  >
                    <UserMinus size={9} />
                  </button>
                </div>
              );
            }

            // Empty seat slot
            return (
              <div
                key={`empty-${i}`}
                onClick={() => onQuickAssignClick(table)}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-stone-300 hover:border-wedding-primary/60 bg-white/70 hover:bg-stone-50 flex items-center justify-center text-stone-400 hover:text-wedding-primary text-[10px] font-semibold transition-all duration-150 cursor-pointer shadow-2xs hover:scale-110"
                title={`Silla libre ${i + 1} - Haz clic para sentar invitado`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* Hovered Guest Preview Pill */}
        <div className="h-6 mt-1 flex items-center justify-center">
          {hoveredGuest ? (
            <div className="text-center animate-in fade-in duration-100">
              <span className="text-xs font-bold text-wedding-primaryDark">
                {hoveredGuest.name}
              </span>
              {hoveredGuest.family_name && (
                <span className="text-[11px] text-stone-500 ml-1.5 font-medium">
                  • {hoveredGuest.family_name}
                </span>
              )}
              {hoveredGuest.dietary_notes && (
                <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full ml-1.5 font-semibold">
                  ⚠️ {hoveredGuest.dietary_notes}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-stone-400 italic">
              {seatedCount === 0 
                ? 'Arrastra invitados aquí o toca una silla vacía' 
                : `${freeSeats} sillas libres`}
            </span>
          )}
        </div>
      </div>

      {/* Dietary & Catering Summary tag if present */}
      {guestsWithDietary.length > 0 && (
        <div className="mx-4 mb-3 p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2 text-xs">
          <Utensils size={14} className="text-amber-700 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-amber-900 block leading-tight">
              Requerimientos de Banquete ({guestsWithDietary.length}):
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {guestsWithDietary.map(g => (
                <span key={g.id} className="text-[10px] bg-white px-1.5 py-0.5 rounded-md border border-amber-300 font-medium text-amber-900">
                  <strong>{g.name}:</strong> {g.dietary_notes}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Notes & Seated Guest Drawer Toggle */}
      <div className="mt-auto px-4 py-2.5 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between text-xs">
        {table.notes ? (
          <span className="text-stone-500 truncate max-w-[180px] text-[11px]" title={table.notes}>
            📍 {table.notes}
          </span>
        ) : (
          <span className="text-stone-400 text-[11px]">
            {table.shape === 'round' ? 'Mesa Redonda' : 'Mesa Imperial'}
          </span>
        )}

        {seatedCount > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-stone-600 hover:text-wedding-primary font-medium text-[11px] cursor-pointer hover:underline"
          >
            {isExpanded ? 'Ocultar lista' : `Ver lista (${seatedCount})`}
          </button>
        )}
      </div>

      {/* Expanded Guest List Drawer */}
      {isExpanded && seatedCount > 0 && (
        <div className="px-4 py-3 bg-stone-50/95 border-t border-stone-200 divide-y divide-stone-200/60 max-h-56 overflow-y-auto">
          {guests.map((g) => (
            <div key={g.id} className="py-1.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-5 h-5 rounded-full bg-wedding-primary/10 text-wedding-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                  {getInitials(g.name)}
                </span>
                <div className="truncate">
                  <span className="font-semibold text-stone-800 block truncate leading-tight">
                    {g.name}
                  </span>
                  {g.family_name && (
                    <span className="text-[10px] text-stone-500 block truncate">
                      {g.family_name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {g.dietary_notes && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md font-semibold" title={g.dietary_notes}>
                    🍽️ Especial
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onUnassignGuest([g.id])}
                  className="p-1 rounded-lg hover:bg-rose-100 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Quitar de esta mesa"
                >
                  <UserMinus size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
