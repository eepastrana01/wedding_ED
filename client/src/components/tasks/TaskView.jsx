import React, { useState, useMemo } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { TaskCard } from './TaskCard';
import { TaskModal, TASK_CATEGORIES } from './TaskModal';
import { CashOnHandModal } from './CashOnHandModal';
import { matchesSearch } from '../../utils/textUtils';
import { generateExpensesReportPDF } from '../../utils/pdfGenerator';
import { 
  Plus, 
  Sparkles, 
  Search, 
  X, 
  CheckSquare, 
  CheckCircle2, 
  Clock, 
  Coins, 
  ListTodo, 
  Filter,
  FileDown,
  User,
  Users,
  Wallet,
  AlertCircle,
  Edit3,
  TrendingUp,
  Receipt,
  ShieldCheck
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
    loadPresetTasks,
    showToast,
    cashOnHand,
    updateCashOnHand
  } = useWedding();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [assignedFilter, setAssignedFilter] = useState('all'); // 'all', 'Juntos', 'Novio', 'Novia'
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filtrado instantáneo en memoria (0ms)
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tasks.filter((task) => {
      // Filtro de búsqueda (insensible a acentos/diacríticos)
      if (search && search.trim()) {
        const isMatch = matchesSearch([
          task.title,
          task.description,
          task.category,
          task.assigned_to,
          ...(task.subtasks || []).map((st) => st.title)
        ], search);
        if (!isMatch) {
          return false;
        }
      }

      // Filtro de estado
      if (statusFilter === 'pending' && task.status === 'completed') return false;
      if (statusFilter === 'completed' && task.status !== 'completed') return false;

      // Filtro de responsable
      if (assignedFilter !== 'all') {
        const taskAssigned = (task.assigned_to || '').toLowerCase();
        if (assignedFilter === 'Novio' && !taskAssigned.includes('novio') && !taskAssigned.includes('edis')) return false;
        if (assignedFilter === 'Novia' && !taskAssigned.includes('novia') && !taskAssigned.includes('dania')) return false;
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

  const pendingExpenseBalance = useMemo(() => {
    return tasks.reduce((sum, t) => {
      if (t.status === 'completed') return sum;
      const est = Math.max(0, parseFloat(t.estimated_cost) || 0);
      const paid = Math.max(0, parseFloat(t.actual_cost) || 0);
      return sum + Math.max(0, est - paid);
    }, 0);
  }, [tasks]);

  const pendingExpenseItemsCount = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === 'completed') return false;
      const est = Math.max(0, parseFloat(t.estimated_cost) || 0);
      const paid = Math.max(0, parseFloat(t.actual_cost) || 0);
      return Math.max(0, est - paid) > 0;
    }).length;
  }, [tasks]);

  const projectedTotal = taskMetrics.actualCost + pendingExpenseBalance;

  // Dinero en mano y cobertura financiera
  const currentCash = Math.max(0, parseFloat(cashOnHand) || 0);
  const cashDifference = currentCash - pendingExpenseBalance;
  const isBudgetCovered = cashDifference >= 0;
  const cashDeficit = Math.max(0, pendingExpenseBalance - currentCash);
  const cashSurplus = Math.max(0, cashDifference);
  const cashCoveragePercent = pendingExpenseBalance > 0
    ? Math.min(100, Math.round((currentCash / pendingExpenseBalance) * 100))
    : 100;

  const handleDownloadExpensesPdf = () => {
    try {
      setIsGeneratingPdf(true);
      generateExpensesReportPDF(tasks, { cashOnHand: currentCash });
      if (showToast) {
        showToast('Informe formal de gastos en PDF descargado');
      }
    } catch (err) {
      console.error('Error generando informe de gastos PDF:', err);
      if (showToast) {
        showToast('Error al generar el informe PDF', 'error');
      }
    } finally {
      setIsGeneratingPdf(false);
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

          {tasks.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadExpensesPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100/90 text-amber-950 border border-amber-300/80 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              title="Descargar Informe Formal de Presupuesto y Ejecución de Gastos en PDF (Tamaño Carta)"
            >
              <FileDown size={16} className="text-amber-700" />
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Informe Gastos PDF'}</span>
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

      {/* =====================================================================
          BLOQUE 1: FONDOS EN MANO & COBERTURA FINANCIERA (Tarjetitas Principales)
      ===================================================================== */}
      <div className="bg-white rounded-2xl border border-wedding-border p-4 sm:p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              <Wallet size={18} />
            </div>
            <div>
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                Control de Fondos & Balance en Mano
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500">
                Monitorea el dinero que tienen ahorrado vs lo que resta por pagar para la boda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCashModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer self-start sm:self-auto shadow-2xs"
            title="Ingresar o modificar la cantidad de dinero en mano que tienen actualmente"
          >
            <Edit3 size={13} className="text-emerald-700" />
            <span>{currentCash > 0 ? 'Actualizar Balance en Mano' : 'Ingresar Dinero en Mano'}</span>
          </button>
        </div>

        {/* Grid de 3 Tarjetas Clave de Fondos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          
          {/* Tarjeta 1: Dinero en Mano */}
          <div
            onClick={() => setIsCashModalOpen(true)}
            className="group relative bg-gradient-to-br from-emerald-50/50 via-white to-white rounded-2xl border border-emerald-200/90 p-4 shadow-2xs hover:shadow-sm hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] sm:text-xs text-emerald-900 flex items-center gap-1">
                  <Wallet size={13} className="text-emerald-700" />
                  Dinero en Mano
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 group-hover:underline flex items-center gap-1">
                  <Edit3 size={11} />
                  Editar
                </span>
              </div>
              <p className="font-editorial text-2xl sm:text-3xl font-bold text-emerald-950 mt-2">
                L. {currentCash.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-[11px] text-stone-500 mt-2">
              {currentCash > 0
                ? 'Fondos disponibles y ahorros en mano'
                : 'Toca aquí para ingresar su balance actual'}
            </p>
          </div>

          {/* Tarjeta 2: Saldo Pendiente por Pagar */}
          <div className="bg-gradient-to-br from-amber-50/50 via-white to-white rounded-2xl border border-amber-200/90 p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] sm:text-xs text-amber-900 flex items-center gap-1">
                  <Receipt size={13} className="text-amber-700" />
                  Saldo Pendiente por Pagar
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  {pendingExpenseItemsCount} {pendingExpenseItemsCount === 1 ? 'rubro' : 'rubros'}
                </span>
              </div>
              <p className="font-editorial text-2xl sm:text-3xl font-bold text-amber-950 mt-2">
                L. {pendingExpenseBalance.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-[11px] text-stone-500 mt-2">
              Compromisos y cotizaciones pendientes de liquidar
            </p>
          </div>

          {/* Tarjeta 3: ¿Cuánto Nos Hace Falta? (Estado de Cobertura) */}
          <div
            className={`rounded-2xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
              isBudgetCovered
                ? 'bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50 border-emerald-300'
                : 'bg-gradient-to-br from-rose-50/60 via-white to-amber-50/40 border-amber-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold uppercase tracking-wider text-[10px] sm:text-xs flex items-center gap-1 ${
                  isBudgetCovered ? 'text-emerald-900' : 'text-amber-950'
                }`}>
                  {isBudgetCovered ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-700" />
                      Estado de Cobertura
                    </>
                  ) : (
                    <>
                      <AlertCircle size={13} className="text-amber-700" />
                      ¿Cuánto Nos Hace Falta?
                    </>
                  )}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isBudgetCovered
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-100 text-rose-900 border border-rose-200'
                  }`}
                >
                  {isBudgetCovered ? '100% Cubierto' : `${cashCoveragePercent}% cubierto`}
                </span>
              </div>

              <p
                className={`font-editorial text-2xl sm:text-3xl font-bold mt-2 ${
                  isBudgetCovered ? 'text-emerald-800' : 'text-rose-900'
                }`}
              >
                {isBudgetCovered
                  ? `+ L. ${cashSurplus.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `Faltan L. ${cashDeficit.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>

            {/* Subtexto y Barra de Progreso */}
            <div className="mt-2 space-y-1">
              <div className="w-full bg-stone-200/70 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isBudgetCovered ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${cashCoveragePercent}%` }}
                />
              </div>
              <p className="text-[10px] text-stone-500 leading-tight">
                {isBudgetCovered
                  ? '¡Excelente! Los fondos en mano cubren el 100% de los compromisos restantes.'
                  : `Restan L. ${cashDeficit.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por ahorrar o reunir.`}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* =====================================================================
          BLOQUE 2: PRESUPUESTO GLOBAL & ESTADO DE ACTIVIDADES (Tarjetitas Complementarias)
      ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Total Pagado a la Fecha */}
        <div className="bg-white rounded-2xl border border-wedding-border p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs">Total Pagado</span>
            <Coins size={16} className="text-emerald-700" />
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900 mt-1.5">
            L. {taskMetrics.actualCost.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5">
            Abonos liquidados a la fecha
          </p>
        </div>

        {/* Costo Total Proyectado */}
        <div className="bg-white rounded-2xl border border-wedding-border p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs">Presupuesto Proyectado</span>
            <TrendingUp size={16} className="text-wedding-primary" />
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900 mt-1.5">
            L. {projectedTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5">
            Est. inicial: L. {taskMetrics.estimatedCost.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Total Actividades */}
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
        <div className="bg-white rounded-2xl border border-emerald-200 p-3.5 sm:p-4 shadow-card bg-gradient-to-b from-emerald-50/40 to-white">
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
              <option value="Novio">Edis (Novio)</option>
              <option value="Novia">Dania (Novia)</option>
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

      {/* Modal para Crear / Editar Tarea */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
        onSave={handleSaveTask}
      />

      {/* Modal para Ingresar / Actualizar Dinero en Mano */}
      <CashOnHandModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        initialAmount={currentCash}
        pendingExpenseBalance={pendingExpenseBalance}
        onSave={updateCashOnHand}
      />

    </div>
  );
}
