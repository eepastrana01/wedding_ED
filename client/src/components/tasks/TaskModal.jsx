import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Plus, Trash2, Tag, User, Users, Calendar, DollarSign, FileText, CheckSquare } from 'lucide-react';

export const TASK_CATEGORIES = [
  'General',
  'Anillos & Joyería',
  'Vestuario & Belleza',
  'Ceremonia & Religioso',
  'Recepción & Banquete',
  'Fotografía & Video',
  'Música & Fiesta',
  'Papelería & Recuerdos',
  'Trámites & Legal',
  'Luna de Miel',
];

export function TaskModal({ isOpen, onClose, taskToEdit, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [assignedTo, setAssignedTo] = useState('Juntos');
  const [priority, setPriority] = useState('media');
  const [dueDate, setDueDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category || 'General');
      setAssignedTo(taskToEdit.assigned_to || 'Juntos');
      setPriority(taskToEdit.priority || 'media');
      setDueDate(taskToEdit.due_date ? taskToEdit.due_date.split('T')[0] : '');
      setEstimatedCost(taskToEdit.estimated_cost ? String(taskToEdit.estimated_cost) : '');
      setActualCost(taskToEdit.actual_cost ? String(taskToEdit.actual_cost) : '');
      setSubtasks(taskToEdit.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setCategory('General');
      setAssignedTo('Juntos');
      setPriority('media');
      setDueDate('');
      setEstimatedCost('');
      setActualCost('');
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
  }, [taskToEdit, isOpen]);

  // Agregar nueva subtarea
  const handleAddSubtask = (e) => {
    e?.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    setSubtasks((prev) => [
      ...prev,
      {
        id: `st-${Date.now()}-${prev.length}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  // Remover subtarea
  const handleRemoveSubtask = (subtaskId) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
  };

  // Modificar texto de subtarea existente
  const handleSubtaskTextChange = (id, newTitle) => {
    setSubtasks((prev) =>
      prev.map((st) => (st.id === id ? { ...st, title: newTitle } : st))
    );
  };

  // Guardar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        category,
        assigned_to: assignedTo,
        priority,
        due_date: dueDate || null,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : 0,
        actual_cost: actualCost ? parseFloat(actualCost) : 0,
        subtasks,
      });
      onClose();
    } catch {
      // Toast ya es disparado por context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Editar Tarea de Boda' : 'Nueva Tarea o Actividad'}
      subtitle="Organiza tus pendientes, subtareas y detalles clave"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Título de la Tarea */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Nombre de la Tarea o Actividad *
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Comprar y grabar anillos de boda"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm font-medium"
          />
        </div>

        {/* Categoría y Responsable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Categoría */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Categoría
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm bg-white"
              >
                {TASK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Asignado a */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              ¿Quién se encarga?
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm bg-white"
            >
              <option value="Juntos">Juntos (Ambos)</option>
              <option value="Novio">Novio (Edis)</option>
              <option value="Novia">Novia (Dania)</option>
            </select>
          </div>

        </div>

        {/* Prioridad y Fecha Objetivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Prioridad */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm bg-white"
            >
              <option value="alta">Alta (Urgente / Indispensable)</option>
              <option value="media">Media (Importante)</option>
              <option value="baja">Baja (Opcional / Más adelante)</option>
            </select>
          </div>

          {/* Fecha Límite */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Fecha Objetivo / Deadline
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm bg-white"
            />
          </div>

        </div>

        {/* Costos Estimado y Real (Opcional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Costo Estimado / Presupuesto (L.)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent text-base sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Costo Real Pagado (L.)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent text-base sm:text-sm"
            />
          </div>
        </div>

        {/* Mini-Notas / Detalles adicionales */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Mini-Notas & Observaciones
          </label>
          <textarea
            rows="2"
            placeholder="Apunta teléfonos de proveedores, cotizaciones, enlaces o notas especiales..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent focus:border-wedding-accent text-base sm:text-sm placeholder:text-stone-400 resize-none"
          />
        </div>

        {/* Subtareas & Bullet Points Interactivos */}
        <div className="bg-stone-50 p-3.5 sm:p-4 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare size={14} className="text-wedding-primary" />
              <span>Subtareas & Pasos a seguir ({subtasks.length})</span>
            </label>
            <span className="text-[11px] text-stone-500 font-medium">
              Escribe y presiona Enter para agregar
            </span>
          </div>

          {/* Input para agregar subtarea */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej. Visitar joyería el sábado a las 3pm"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              className="flex-1 px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs sm:text-sm focus:ring-2 focus:ring-wedding-accent"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="px-3 py-2 bg-wedding-primary hover:bg-wedding-primaryLight text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
            >
              <Plus size={14} />
              <span>Agregar</span>
            </button>
          </div>

          {/* Lista de subtareas agregadas */}
          {subtasks.length > 0 && (
            <div className="space-y-2 pt-1">
              {subtasks.map((st, idx) => (
                <div
                  key={st.id || idx}
                  className="flex items-center gap-2 bg-white p-2 rounded-xl border border-stone-200 text-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-500 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={st.title}
                    onChange={(e) => handleSubtaskTextChange(st.id, e.target.value)}
                    className="flex-1 bg-transparent border-none focus:outline-hidden text-stone-800 font-medium text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                    title="Remover subtarea"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-stone-600 hover:bg-stone-100 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="px-6 py-2.5 bg-wedding-primary hover:bg-wedding-primaryLight text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : taskToEdit ? 'Actualizar Tarea' : 'Crear Tarea'}
          </button>
        </div>

      </form>
    </Modal>
  );
}
