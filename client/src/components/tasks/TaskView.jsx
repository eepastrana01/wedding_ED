import React, { useState, useMemo } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { TaskCard } from './TaskCard';
import { TaskModal, TASK_CATEGORIES } from './TaskModal';
import { 
  Plus, 
  Sparkles, 
  Search, 
  X, 
  CheckSquare, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ListTodo, 
  Filter,
  User,
  Users
} from 'lucide-react';

export function TaskView() {
  const { 
    tasks, 
    taskMetrics, 
    createTask, 
    updateTask, 
    deleteTask, 
    toggleTaskStatus, 
    toggleSubtask, 
    loadPresetTasks 
  } = useWedding();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [assignedFilter, setAssignedFilter] = useState('all'); // 'all', 'Juntos', 'Novio', 'Novia'
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filtrado instantáneo en memoria (0ms)
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tasks.filter((task) => {
      // Filtro de búsqueda
      if (q) {
        const matchTitle = task.title && task.title.toLowerCase().includes(q);
        const matchDesc = task.description && task.description.toLowerCase().includes(q);
        const matchCategory = task.category && task.category.toLowerCase().includes(q);
        const matchSubtasks = task.subtasks && task.subtasks.some((st) => st.title.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchCategory && !matchSubtasks) {
          return false;
        }
      }

      // Filtro de estado
      if (statusFilter === 'pending' && task.status === 'completed') return false;
      if (statusFilter === 'completed' && task.status !== 'completed') return false;

      // Filtro de responsable
      if (assignedFilter !== 'all') {
        const taskAssigned = (task.assigned_to || '').toLowerCase();
        if (assignedFilter === 'Novio' && !taskAssigned.includes('novio') && !taskAssigned.includes('enrique')) return false;
        if (assignedFilter === 'Novia' && !taskAssigned.includes('novia') && !taskAssigned.includes('denia')) return false;
        if (assignedFilter === 'Juntos' && !taskAssigned.includes('juntos')) return false;
      }

      // Filtro de categoría
      if (categoryFilter !== 'all' && task.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, search, statusFilter, assignedFilter, categoryFilter]);

  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (formData) => {
    if (taskToEdit) {
      await updateTask(taskToEdit.id, formData);
    } else {
      await createTask(formData);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('¿Seguro que deseas eliminar esta tarea?')) {
      await deleteTask(taskId);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 md:pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-wedding-border p-4 sm:p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-wedding-accentLight text-wedding-primaryDark">
              <ListTodo size={22} />
            </div>
            <div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900 leading-none">
                Tareas & Actividades de Boda
              </h2>
              <p className="text-stone-500 text-xs sm:text-sm mt-1">
                To-do list dinámico para coordinar compras, citas y pendientes en pareja
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {tasks.length === 0 && (
            <button
              type="button"
              onClick={loadPresetTasks}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-wedding-accentLight/60 hover:bg-wedding-accentLight text-wedding-primaryDark border border-wedding-accent/40 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95"
            >
              <Sparkles size={15} className="text-wedding-accentDark" />
              <span>Cargar Tareas Sugeridas</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-wedding-primary hover:bg-wedding-primaryLight text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Plus size={16} />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Total Tareas */}
        <div className="bg-white rounded-2xl border border-wedding-border p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs">Total Actividades</span>
            <CheckSquare size={16} className="text-wedding-primary" />
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900 mt-1.5">
            {taskMetrics.total || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5">Pendientes registrados</p>
        </div>

        {/* Completadas & Progreso */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-3.5 sm:p-4 shadow-card bg-linear-to-b from-emerald-50/40 to-white">
          <div className="flex items-center justify-between text-emerald-800 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs">Completadas</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-emerald-950 mt-1.5">
            {taskMetrics.completed || 0} <span className="text-xs text-stone-400 font-sans font-normal">({taskMetrics.progress || 0}%)</span>
          </p>
          <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${taskMetrics.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Por Resolver */}
        <div className="bg-white rounded-2xl border border-amber-200 p-3.5 sm:p-4 shadow-card bg-linear-to-b from-amber-50/40 to-white">
          <div className="flex items-center justify-between text-amber-800 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs">Por Resolver</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-amber-950 mt-1.5">
            {taskMetrics.pending || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-amber-700/80 mt-0.5">Actividades en curso</p>
        </div>

        {/* Presupuesto / Gastos */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-white rounded-2xl border border-wedding-border p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs">Control de Gastos</span>
            <DollarSign size={16} className="text-emerald-700" />
          </div>
          <p className="font-editorial text-xl sm:text-2xl font-bold text-stone-900 mt-1.5">
            L. {taskMetrics.actualCost.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5">
            Estimado: L. {taskMetrics.estimatedCost.toLocaleString()}
          </p>
        </div>

      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-wedding-border p-3 sm:p-4 shadow-sm space-y-3">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
          <input
            type="text"
            placeholder="Buscar tarea, subtarea, proveedor o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-wedding-accent focus:bg-white transition-all placeholder:text-stone-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills & Selectors */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-150 font-medium ${
                statusFilter === 'all'
                  ? 'bg-wedding-primary text-white font-semibold shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Todas ({tasks.length})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-150 font-medium flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/50'
              }`}
            >
              <Clock size={12} />
              Pendientes ({taskMetrics.pending})
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-150 font-medium flex items-center gap-1.5 ${
                statusFilter === 'completed'
                  ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
              }`}
            >
              <CheckCircle2 size={12} />
              Completadas ({taskMetrics.completed})
            </button>
          </div>

          {/* Assigned & Category Dropdowns */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            
            {/* Responsable */}
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-xs focus:ring-1 focus:ring-wedding-accent bg-white flex-1 sm:flex-initial"
            >
              <option value="all">Todos los Responsables</option>
              <option value="Juntos">Juntos (Ambos)</option>
              <option value="Novio">Enrique (Novio)</option>
              <option value="Novia">Denia (Novia)</option>
            </select>

            {/* Categoría */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-xs focus:ring-1 focus:ring-wedding-accent bg-white flex-1 sm:flex-initial"
            >
              <option value="all">Todas las Categorías</option>
              {TASK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

          </div>

        </div>

      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteTask}
              onToggleTask={toggleTaskStatus}
              onToggleSubtask={toggleSubtask}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-wedding-border p-8 sm:p-12 text-center shadow-card space-y-4">
          <div className="w-16 h-16 rounded-full bg-wedding-accentLight/60 text-wedding-primary flex items-center justify-center mx-auto">
            <ListTodo size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-editorial text-xl font-bold text-stone-900">
              {tasks.length === 0 ? '¡Empiecen a planificar sus actividades!' : 'No hay tareas con estos filtros'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              {tasks.length === 0
                ? 'Agreguen su primera tarea personalizada o carguen las tareas esenciales recomendadas para coordinar anillos, vestuario, recepción y más.'
                : 'Intenta limpiar el buscador o seleccionar otros filtros para ver más tareas.'}
            </p>
          </div>
          {tasks.length === 0 && (
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={loadPresetTasks}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-wedding-accentLight text-wedding-primaryDark font-semibold rounded-xl text-xs sm:text-sm border border-wedding-accent/40 shadow-xs hover:bg-wedding-accentLight/80 transition-all active:scale-95"
              >
                <Sparkles size={16} />
                <span>Cargar 8 Tareas Sugeridas</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-wedding-primary text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs hover:bg-wedding-primaryLight transition-all active:scale-95"
              >
                <Plus size={16} />
                <span>Crear Primera Tarea</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal para Crear / Editar */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
        onSave={handleSaveTask}
      />

    </div>
  );
}
