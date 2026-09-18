import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useWedding } from '../../context/WeddingContext';
import { DEFAULT_GROUPS, GUEST_TYPES, AGE_TYPES } from '../../constants/weddingConstants';
import { guestApi } from '../../services/guestApi';

export function GuestModal({ isOpen, onClose, guestToEdit = null, onSaved }) {
  const { families, showToast, refreshAll } = useWedding();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    partner_name: '',
    type: 'Adulto',
    group_relation: 'Familia Novio',
    guest_type: 'Titular',
    priority: 'A',
    status: 'pending',
    confirmed_seats: 1,
    family_id: '',
    phone: '',
    dietary_notes: '',
    notes: '',
  });

  useEffect(() => {
    if (guestToEdit) {
      setFormData({
        name: guestToEdit.name || '',
        partner_name: guestToEdit.partner_name || '',
        type: guestToEdit.type || 'Adulto',
        group_relation: guestToEdit.group_relation || 'General',
        guest_type: guestToEdit.guest_type || 'Titular',
        priority: guestToEdit.priority || 'A',
        status: guestToEdit.status || 'pending',
        confirmed_seats: guestToEdit.confirmed_seats || 1,
        family_id: guestToEdit.family_id ? String(guestToEdit.family_id) : '',
        phone: guestToEdit.phone || '',
        dietary_notes: guestToEdit.dietary_notes || '',
        notes: guestToEdit.notes || '',
      });
    } else {
      setFormData({
        name: '',
        partner_name: '',
        type: 'Adulto',
        group_relation: 'Familia Novio',
        guest_type: 'Titular',
        priority: 'A',
        status: 'pending',
        confirmed_seats: 1,
        family_id: '',
        phone: '',
        dietary_notes: '',
        notes: '',
      });
    }
  }, [guestToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Por favor escribe el nombre del invitado', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        family_id: formData.family_id ? parseInt(formData.family_id, 10) : null,
        confirmed_seats: parseInt(formData.confirmed_seats, 10) || 1,
      };

      if (guestToEdit) {
        await guestApi.update(guestToEdit.id, payload);
        showToast('Invitado actualizado correctamente');
      } else {
        await guestApi.create(payload);
        showToast('Invitado agregado con éxito');
      }
      refreshAll();
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      showToast(err.message || 'Error al guardar invitado', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={guestToEdit ? 'Editar Invitado' : 'Nuevo Invitado'}
      subtitle="Ingresa o modifica los datos del invitado"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Nombre */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ej. Juan Pérez"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm"
            />
          </div>

          {/* Pareja */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Pareja / Acompañante
            </label>
            <input
              type="text"
              name="partner_name"
              placeholder="Ej. María Gómez"
              value={formData.partner_name}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Teléfono / WhatsApp
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="Ej. +52 1 55 1234 5678"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm"
            />
          </div>

          {/* Grupo / Relación */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Grupo / Relación
            </label>
            <input
              type="text"
              name="group_relation"
              list="groups-list"
              placeholder="Selecciona o escribe..."
              value={formData.group_relation}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm"
            />
            <datalist id="groups-list">
              {DEFAULT_GROUPS.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Prioridad
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm bg-white"
            >
              <option value="A">Prioridad A (Principal / Familia Directa)</option>
              <option value="B">Prioridad B (Amigos / Segundos)</option>
              <option value="C">Prioridad C (Lista de espera / Extras)</option>
            </select>
          </div>

          {/* Type (Adulto / Niño) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Tipo de Asistente (Type)
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm bg-white"
            >
              {AGE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Tipo Invitado */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Tipo de Invitado
            </label>
            <select
              name="guest_type"
              value={formData.guest_type}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm bg-white"
            >
              {GUEST_TYPES.map((gt) => (
                <option key={gt} value={gt}>{gt}</option>
              ))}
            </select>
          </div>

          {/* Familia Asignada */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Familia / Grupo
            </label>
            <select
              name="family_id"
              value={formData.family_id}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm bg-white"
            >
              <option value="">-- Sin Familia Asignada (Individual) --</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Estado de Asistencia */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Estado de Asistencia
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm bg-white"
            >
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado (Asiste)</option>
              <option value="declined">No Asiste</option>
            </select>
          </div>

          {/* Asientos confirmados */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Puestos / Asientos
            </label>
            <input
              type="number"
              min="1"
              max="10"
              name="confirmed_seats"
              value={formData.confirmed_seats}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm"
            />
          </div>

          {/* Alergias / Restricciones */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Alergias o Restricciones Alimentarias
            </label>
            <input
              type="text"
              name="dietary_notes"
              placeholder="Ej. Vegetariano, alérgico a nueces, celíaco"
              value={formData.dietary_notes}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm"
            />
          </div>

          {/* Notas generales */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Notas Adicionales
            </label>
            <textarea
              name="notes"
              rows="2"
              placeholder="Notas internas..."
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-wedding-primary hover:bg-wedding-primaryLight rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Guardando...' : guestToEdit ? 'Guardar Cambios' : 'Agregar Invitado'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
