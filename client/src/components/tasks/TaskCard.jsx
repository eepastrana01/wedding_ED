import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  FileText, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Users, 
  Tag, 
  DollarSign, 
  CheckSquare, 
  Square,
  Sparkles
} from 'lucide-react';

export function TaskCard({ task, onEdit, onDelete, onToggleTask, onToggleSubtask }) {
  const [showSubtasks, setShowSubtasks] = useState(true);

  const isCompleted = task.status === 'completed';
  const subtasks = task.subtasks || [];
  const completedSubtasksCount = subtasks.filter((st) => st.completed).length;
  const totalSubtasks = subtasks.length;
  const subtasksProgress = totalSubtasks > 0 ? Math.round((completedSubtasksCount / totalSubtasks) * 100) : 0;

  // Formato amigable de fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Color de badge por responsable
  const getAssignedBadge = (assigned) => {
    const norm = (assigned || '').toLowerCase();
    if (norm.includes('novio') || norm.includes('enrique')) {
      return {
        bg: 'bg-blue-50 text-blue-800 border-blue-200/70',
        label: 'Enrique',
        icon: User,
      };
    }
    if (norm.includes('novia') || norm.includes('denia')) {
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-200/70',
        label: 'Denia',
        icon: User,
      };
    }
    return {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
      label: 'Juntos',
      icon: Users,
    };
  };

  const assignedInfo = getAssignedBadge(task.assigned_to);
  const AssignedIcon = assignedInfo.icon;

  // Color de prioridad
  const getPriorityBadge = (priority) => {
    const p = (priority || 'media').toLowerCase();
    if (p === 'alta') {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (p === 'baja') {
      return 'bg-stone-100 text-stone-600 border-stone-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
        isCompleted
          ? 'bg-stone-50/70 border-stone-200 opacity-85'
          : 'bg-white border-wedding-border hover:shadow-md hover:border-wedding-accent/40'
      }`}
    >
      <div className="p-4 sm:p-5">
        
        {/* Header: Checkbox + Título + Acciones */}
        <div className="flex items-start justify-between gap-3">
          
          {/* Checkbox y Título Principal */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onToggleTask(task.id)}
              className="mt-0.5 text-stone-400 hover:text-emerald-600 transition-transform active:scale-90 shrink-0"
              title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
            >
              {isCompleted ? (
                <CheckCircle2 size={22} className="text-emerald-600 fill-emerald-100" />
              ) : (
                <Circle size={22} className="text-stone-300 hover:text-stone-500" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <h3
                onClick={() => onToggleTask(task.id)}
                className={`font-editorial text-base sm:text-lg font-bold leading-snug cursor-pointer transition-colors ${
                  isCompleted
                    ? 'line-through text-stone-400 font-normal'
                    : 'text-stone-900 hover:text-wedding-primary'
                }`}
              >
                {task.title}
              </h3>

              {/* Badges de Categoría, Responsable, Prioridad y Fecha */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap text-xs">
                
                {/* Categoría */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-stone-100 text-stone-700 border border-stone-200/80 text-[11px]">
                  <Tag size={10} className="text-stone-400 shrink-0" />
                  <span>{task.category || 'General'}</span>
                </span>

                {/* Responsable */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold border text-[11px] ${assignedInfo.bg}`}>
                  <AssignedIcon size={10} className="shrink-0" />
                  <span>{assignedInfo.label}</span>
                </span>

                {/* Prioridad */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold border text-[10px] uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                  {task.priority || 'media'}
                </span>

                {/* Fecha límite */}
                {task.due_date && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200/60">
                    <Calendar size={11} className="text-stone-400 shrink-0" />
                    <span>{formatDate(task.due_date)}</span>
                  </span>
                )}

                {/* Costo (si existe) */}
                {(task.estimated_cost > 0 || task.actual_cost > 0) && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    <DollarSign size={11} className="text-emerald-600 shrink-0" />
                    <span>
                      {task.actual_cost > 0 ? `L. ${task.actual_cost}` : `Est: L. ${task.estimated_cost}`}
                    </span>
                  </span>
                )}

              </div>
            </div>
          </div>

          {/* Botones de Acción (Editar / Eliminar) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              title="Editar tarea"
            >
              <Edit3 size={15} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Eliminar tarea"
            >
              <Trash2 size={15} />
            </button>
          </div>

        </div>

        {/* Mini-Notas o Descripción adicional */}
        {task.description && (
          <div className="mt-3 flex items-start gap-1.5 bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/70 text-xs text-stone-600">
            <FileText size={13} className="text-stone-400 shrink-0 mt-0.5" />
            <span className="whitespace-pre-line leading-relaxed">{task.description}</span>
          </div>
        )}

        {/* Sección de Subtareas / Bullet Points Interactivos */}
        {totalSubtasks > 0 && (
          <div className="mt-3 pt-3 border-t border-stone-100">
            
            {/* Cabecera de subtareas con progreso */}
            <div className="flex items-center justify-between text-xs mb-2">
              <button
                type="button"
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="flex items-center gap-1.5 font-semibold text-stone-700 hover:text-stone-900 transition-colors"
              >
                <span>Subtareas & Detalles ({completedSubtasksCount}/{totalSubtasks})</span>
                {showSubtasks ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              <span className="text-[11px] font-bold text-stone-500">
                {subtasksProgress}%
              </span>
            </div>

            {/* Barra de progreso de subtareas */}
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${subtasksProgress}%` }}
              />
            </div>

            {/* Lista interactiva de subtareas */}
            {showSubtasks && (
              <div className="space-y-1.5 pl-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => onToggleSubtask(task.id, st.id)}
                    className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors group select-none"
                  >
                    <button
                      type="button"
                      className="text-stone-300 group-hover:text-emerald-600 transition-colors shrink-0"
                    >
                      {st.completed ? (
                        <CheckSquare size={15} className="text-emerald-600" />
                      ) : (
                        <Square size={15} />
                      )}
                    </button>
                    <span
                      className={`leading-tight flex-1 ${
                        st.completed
                          ? 'line-through text-stone-400'
                          : 'text-stone-700 font-medium'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
