import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useWedding } from '../../context/WeddingContext';
import { familyApi } from '../../services/familyApi';
import { Plus, X, Search, UserCheck } from 'lucide-react';

export function FamilyModal({ isOpen, onClose, familyToEdit = null }) {
  const { guests, showToast, refreshAll } = useWedding();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedGuestIds, setSelectedGuestIds] = useState([]);
  const [guestSearch, setGuestSearch] = useState('');

  useEffect(() => {
    if (familyToEdit) {
      setName(familyToEdit.name || '');
      setNotes(familyToEdit.notes || '');
      setPhone(familyToEdit.phone || '');
      setSelectedGuestIds(familyToEdit.members ? familyToEdit.members.map((m) => m.id) : []);
    } else {
      setName('');
      setNotes('');
      setPhone('');
      setSelectedGuestIds([]);
    }
  }, [familyToEdit, isOpen]);

  const toggleGuestSelection = (id) => {
    setSelectedGuestIds((prev) =>
      prev.includes(id) ? prev.filter((gId) => gId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Escribe el nombre de la familia', 'error');
      return;
    }

    setLoading(true);
    try {
      if (familyToEdit) {
        await familyApi.update(familyToEdit.id, { name, notes, phone });
        // Assign selected guests
        await familyApi.assignMembers(familyToEdit.id, selectedGuestIds);
        showToast('Familia actualizada');
      } else {
        await familyApi.create({
          name,
          notes,
          phone,
          member_ids: selectedGuestIds,
        });
        showToast('Familia creada con éxito');
      }
      refreshAll();
      onClose();
    } catch (err) {
      showToast(err.message || 'Error al guardar familia', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter available guests for selection
  const filteredGuests = guests.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
      (g.partner_name && g.partner_name.toLowerCase().includes(guestSearch.toLowerCase()));
    
    // Show if matches search and either is not in a family, or is in THIS family
    const isAvailableOrCurrent = !g.family_id || (familyToEdit && g.family_id === familyToEdit.id);
    return matchesSearch && isAvailableOrCurrent;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={familyToEdit ? 'Editar Familia' : 'Nueva Familia'}
      subtitle="Agrupa invitados para gestionar invitaciones y asistencias juntas"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Nombre de Familia */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Nombre del Grupo o Familia *
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Familia Rodríguez Solís"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm"
          />
        </div>

        {/* Teléfono de Contacto Principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Teléfono / WhatsApp Principal
            </label>
            <input
              type="tel"
              placeholder="Ej. +52 1 55 9876 5432"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Notas del Grupo
            </label>
            <input
              type="text"
              placeholder="Ej. Mesa 4, requieren transporte, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm"
            />
          </div>
        </div>

        {/* Guest selector for this family */}
        <div className="pt-2 border-t border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Miembros de la Familia ({selectedGuestIds.length} seleccionados)
            </label>
          </div>

          {/* Quick guest filter */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              type="text"
              placeholder="Filtrar invitados para agregar a esta familia..."
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-wedding-accent"
            />
          </div>

          {/* Guest Checklist Box */}
          <div className="max-h-52 overflow-y-auto rounded-xl border border-stone-200 divide-y divide-stone-100 bg-stone-50/50 p-1">
            {filteredGuests.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-4">
                No hay más invitados disponibles para agregar.
              </p>
            ) : (
              filteredGuests.map((g) => {
                const isSelected = selectedGuestIds.includes(g.id);
                return (
                  <label
                    key={g.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-wedding-accentLight/50 text-wedding-primaryDark font-medium' : 'hover:bg-stone-100/70 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-xs">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleGuestSelection(g.id)}
                        className="rounded-sm text-wedding-primary focus:ring-wedding-accent w-4 h-4"
                      />
                      <div>
                        <span>{g.name}</span>
                        {g.partner_name && (
                          <span className="text-stone-500 ml-1">({g.partner_name})</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-stone-500 bg-white/80 px-2 py-0.5 rounded-md border border-stone-200">
                      {g.group_relation || 'General'}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-wedding-primary hover:bg-wedding-primaryLight rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Guardando...' : familyToEdit ? 'Guardar Cambios' : 'Crear Familia'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
