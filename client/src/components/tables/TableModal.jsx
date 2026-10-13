import React, { useState, useEffect } from 'react';
import { X, Utensils, Hash, Users, Sparkles } from 'lucide-react';

export function TableModal({ isOpen, onClose, onSave, editingTable }) {
  const [formData, setFormData] = useState({
    table_number: '',
    name: '',
    capacity: 10,
    shape: 'round',
    notes: '',
  });

  useEffect(() => {
    if (editingTable) {
      setFormData({
        table_number: editingTable.table_number || '',
        name: editingTable.name || '',
        capacity: editingTable.capacity || 10,
        shape: editingTable.shape || 'round',
        notes: editingTable.notes || '',
      });
    } else {
      setFormData({
        table_number: '',
        name: '',
        capacity: 10,
        shape: 'round',
        notes: '',
      });
    }
  }, [editingTable, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      table_number: formData.table_number ? parseInt(formData.table_number, 10) : undefined,
      capacity: parseInt(formData.capacity, 10) || 10,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-wedding-primary to-wedding-primaryDark px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-wedding-accent">
              <Utensils size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">
                {editingTable ? `Editar Mesa ${editingTable.table_number}` : 'Crear Nueva Mesa'}
              </h3>
              <p className="text-xs text-white/75 font-sans">
                {editingTable ? 'Ajusta la capacidad y detalles' : 'Define el número y capacidad del banquete'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5 flex items-center gap-1">
                <Hash size={13} className="text-wedding-accent" />
                Número de Mesa
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ej. 1"
                value={formData.table_number}
                onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-wedding-primary/20 focus:border-wedding-primary text-sm font-semibold"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">Vacío para consecutivo</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5 flex items-center gap-1">
                <Users size={13} className="text-wedding-accent" />
                Capacidad (Sillas)
              </label>
              <input
                type="number"
                min="2"
                max="24"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-wedding-primary/20 focus:border-wedding-primary text-sm font-semibold"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">Estándar: 10 personas</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Nombre o Temática (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Mesa de Honor / Novios, Familia Pérez..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-wedding-primary/20 focus:border-wedding-primary text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Formato de Mesa
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, shape: 'round' })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  formData.shape === 'round'
                    ? 'border-wedding-primary bg-wedding-primary/10 text-wedding-primaryDark shadow-xs'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                Redonda (Clásica)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, shape: 'rectangular' })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  formData.shape === 'rectangular'
                    ? 'border-wedding-primary bg-wedding-primary/10 text-wedding-primaryDark shadow-xs'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="w-4 h-2.5 rounded-xs border-2 border-current" />
                Rectangular / Imperial
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Notas & Ubicación en el Salón
            </label>
            <textarea
              rows="2"
              placeholder="Ej. Cerca a la pista de baile, junto a los ventanales..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-wedding-primary/20 focus:border-wedding-primary text-xs text-stone-700"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-wedding-primary to-wedding-primaryDark text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:brightness-105 active:scale-98 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-wedding-accent" />
              {editingTable ? 'Guardar Cambios' : 'Crear Mesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
