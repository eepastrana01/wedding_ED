import React, { useState, useMemo } from 'react';
import { X, Search, Users, Check, Sparkles, Home } from 'lucide-react';
import { matchesSearch } from '../../utils/textUtils';

export function QuickAssignModal({ 
  isOpen, 
  onClose, 
  targetTable, 
  tables,
  unassignedGuests, 
  onAssignGuests 
}) {
  const [selectedTableId, setSelectedTableId] = useState(targetTable?.id || '');
  const [selectedGuestIds, setSelectedGuestIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [familyFilter, setFamilyFilter] = useState('all');

  // Keep selectedTableId synced with targetTable when opened
  React.useEffect(() => {
    if (targetTable) {
      setSelectedTableId(targetTable.id);
    } else if (tables && tables.length > 0 && !selectedTableId) {
      setSelectedTableId(tables[0].id);
    }
    setSelectedGuestIds([]);
    setSearchTerm('');
  }, [targetTable, isOpen, tables]);

  const currentTable = tables.find(t => t.id === Number(selectedTableId)) || targetTable;

  // Filter unassigned guests
  const filteredGuests = useMemo(() => {
    return unassignedGuests.filter(g => {
      const matchText = matchesSearch(g.name, searchTerm) || 
        matchesSearch(g.partner_name, searchTerm) || 
        matchesSearch(g.family_name, searchTerm);

      if (!matchText) return false;

      if (familyFilter !== 'all') {
        if (familyFilter === 'without_family') {
          return !g.family_id;
        }
        return String(g.family_id) === String(familyFilter);
      }

      return true;
    });
  }, [unassignedGuests, searchTerm, familyFilter]);

  // Group by families for quick selection
  const familyGroups = useMemo(() => {
    const groups = {};
    unassignedGuests.forEach(g => {
      const famId = g.family_id || 'no_family';
      const famName = g.family_name || 'Individuales (Sin Familia)';
      if (!groups[famId]) {
        groups[famId] = {
          id: famId,
          name: famName,
          guests: [],
        };
      }
      groups[famId].guests.push(g);
    });
    return Object.values(groups).sort((a, b) => b.guests.length - a.guests.length);
  }, [unassignedGuests]);

  if (!isOpen) return null;

  const toggleGuest = (id) => {
    setSelectedGuestIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectFamily = (famGuests) => {
    const ids = famGuests.map(g => g.id);
    const allSelected = ids.every(id => selectedGuestIds.includes(id));
    if (allSelected) {
      // Unselect all in this family
      setSelectedGuestIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      // Select all in this family
      setSelectedGuestIds(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleConfirm = () => {
    if (!selectedTableId || selectedGuestIds.length === 0) return;
    onAssignGuests(Number(selectedTableId), selectedGuestIds);
    onClose();
  };

  const capacity = currentTable?.capacity || 10;
  const currentSeated = currentTable?.guests?.length || 0;
  const availableSeats = Math.max(0, capacity - currentSeated);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-wedding-primary to-wedding-primaryDark px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-wedding-accent">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">
                Asignar Invitados a Mesa
              </h3>
              <p className="text-xs text-white/75 font-sans">
                Elige la mesa y selecciona comensales o familias enteras
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Table Selector */}
        <div className="px-6 py-3.5 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
              Mesa Destino
            </label>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm font-semibold text-wedding-primaryDark focus:ring-2 focus:ring-wedding-primary/20"
            >
              {tables.map(t => (
                <option key={t.id} value={t.id}>
                  Mesa {t.table_number}{t.name ? ` - ${t.name}` : ''} (Ocupación: {t.guests?.length || 0}/{t.capacity})
                </option>
              ))}
            </select>
          </div>

          {currentTable && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-stone-200 text-xs shrink-0">
              <span className="text-stone-500 font-medium">Sillas disponibles:</span>
              <span className={`font-bold px-2 py-0.5 rounded-full ${
                availableSeats > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {availableSeats}
              </span>
            </div>
          )}
        </div>

        {/* Search & Quick Family Shortcuts */}
        <div className="p-4 sm:px-6 pb-2 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o familia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:bg-white focus:border-wedding-primary"
            />
          </div>

          {/* Quick select family chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] text-stone-400 font-medium shrink-0 flex items-center gap-1">
              <Home size={12} /> Familias:
            </span>
            {familyGroups.slice(0, 8).map(group => {
              if (group.guests.length === 0) return null;
              const allInFamilySelected = group.guests.every(g => selectedGuestIds.includes(g.id));
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => selectFamily(group.guests)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                    allInFamilySelected
                      ? 'bg-wedding-primary text-white border-wedding-primary'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                  }`}
                >
                  +{group.name} ({group.guests.length})
                </button>
              );
            })}
          </div>
        </div>

        {/* Guest List */}
        <div className="px-4 sm:px-6 py-2 overflow-y-auto flex-1 divide-y divide-stone-100">
          {filteredGuests.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-xs">
              No hay invitados sin mesa que coincidan con la búsqueda.
            </div>
          ) : (
            filteredGuests.map(guest => {
              const isSelected = selectedGuestIds.includes(guest.id);
              return (
                <div
                  key={guest.id}
                  onClick={() => toggleGuest(guest.id)}
                  className={`py-2 px-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-amber-50/80 border border-amber-200' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      isSelected 
                        ? 'bg-wedding-primary border-wedding-primary text-white' 
                        : 'border-stone-300 bg-white'
                    }`}>
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-stone-800 block leading-tight">
                        {guest.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                        {guest.family_name && <span>{guest.family_name}</span>}
                        {guest.dietary_notes && (
                          <span className="text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.2 rounded-xs">
                            🍽️ {guest.dietary_notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    guest.status === 'confirmed' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {guest.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <div className="text-xs text-stone-600">
            <span className="font-bold text-wedding-primaryDark">{selectedGuestIds.length}</span> seleccionados
            {selectedGuestIds.length > availableSeats && (
              <span className="text-rose-600 font-semibold ml-1.5">
                (⚠️ Excede capacidad libre por {selectedGuestIds.length - availableSeats})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedGuestIds.length === 0}
              onClick={handleConfirm}
              className="px-5 py-2.5 bg-gradient-to-r from-wedding-primary to-wedding-primaryDark text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-wedding-accent" />
              Asignar a Mesa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
