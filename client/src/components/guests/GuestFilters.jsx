import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Search, Filter, X, Users, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { DEFAULT_GROUPS } from '../../constants/weddingConstants';

export function GuestFilters({ onNewGuest, totalCount = 0 }) {
  const { filters, setFilters, stats, families } = useWedding();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleStatusFilter = (status) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleGroupFilter = (e) => {
    setFilters((prev) => ({ ...prev, group_relation: e.target.value }));
  };

  const handlePriorityFilter = (e) => {
    setFilters((prev) => ({ ...prev, priority: e.target.value }));
  };

  const handleFamilyFilter = (e) => {
    setFilters((prev) => ({ ...prev, family_id: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      group_relation: 'all',
      priority: 'all',
      family_id: '',
    });
  };

  const activeAdvancedCount = [
    filters.group_relation !== 'all' ? 1 : 0,
    filters.priority !== 'all' ? 1 : 0,
    filters.family_id ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    activeAdvancedCount > 0;

  return (
    <div className="bg-white rounded-2xl border border-wedding-border p-3.5 sm:p-4 shadow-sm space-y-3">
      
      {/* Top row: Search input & Add guest button */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search Bar with instant 0ms search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por nombre, pareja, familia o teléfono..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-base sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-wedding-accent focus:bg-white transition-all placeholder:text-stone-400"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 rounded-md"
              aria-label="Limpiar búsqueda"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Action Button: Nuevo Invitado */}
        <button
          onClick={onNewGuest}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-wedding-primary hover:bg-wedding-primaryLight text-white rounded-xl text-sm font-semibold shadow-xs transition-all duration-150 active:scale-95 shrink-0"
        >
          <UserPlus size={17} />
          <span>Nuevo Invitado</span>
        </button>
      </div>

      {/* Quick Status Tabs / Pills with smooth horizontal scrolling */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium select-none">
        <button
          onClick={() => handleStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-150 ${
            filters.status === 'all'
              ? 'bg-wedding-primary text-white font-semibold shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Todos ({stats?.overview?.total_guests || totalCount})
        </button>
        <button
          onClick={() => handleStatusFilter('confirmed')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
            filters.status === 'confirmed'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Confirmados ({stats?.overview?.confirmed_guests || 0})
        </button>
        <button
          onClick={() => handleStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
            filters.status === 'pending'
              ? 'bg-amber-500 text-white font-semibold shadow-xs'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          Pendientes ({stats?.overview?.pending_guests || 0})
        </button>
        <button
          onClick={() => handleStatusFilter('declined')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
            filters.status === 'declined'
              ? 'bg-rose-600 text-white font-semibold shadow-xs'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
          No Asisten ({stats?.overview?.declined_guests || 0})
        </button>

        {/* Mobile toggle for advanced filters */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`sm:hidden ml-auto px-2.5 py-1.5 rounded-xl border flex items-center gap-1 text-xs shrink-0 transition-colors ${
            activeAdvancedCount > 0
              ? 'bg-wedding-accentLight text-wedding-primaryDark border-wedding-accent/50 font-semibold'
              : 'bg-stone-50 text-stone-600 border-stone-200'
          }`}
        >
          <Filter size={13} />
          <span>Filtros</span>
          {activeAdvancedCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-wedding-primary text-white text-[10px] flex items-center justify-center font-bold">
              {activeAdvancedCount}
            </span>
          )}
          {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Advanced Dropdown Filters (Always visible on desktop, toggleable on mobile) */}
      <div className={`${showAdvanced ? 'block' : 'hidden sm:grid'} grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-100 text-xs animate-in fade-in duration-150`}>
        
        {/* Grupo / Relación */}
        <div>
          <select
            value={filters.group_relation}
            onChange={handleGroupFilter}
            className="w-full px-2.5 py-2 sm:py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-base sm:text-xs focus:ring-1 focus:ring-wedding-accent bg-white"
          >
            <option value="all">👥 Todo Grupo / Relación</option>
            {DEFAULT_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Prioridad */}
        <div>
          <select
            value={filters.priority}
            onChange={handlePriorityFilter}
            className="w-full px-2.5 py-2 sm:py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-base sm:text-xs focus:ring-1 focus:ring-wedding-accent bg-white"
          >
            <option value="all">⭐ Todas las Prioridades</option>
            <option value="A">Prioridad A (Principal)</option>
            <option value="B">Prioridad B (Amigos/Segundos)</option>
            <option value="C">Prioridad C (Extras)</option>
          </select>
        </div>

        {/* Familia */}
        <div>
          <select
            value={filters.family_id}
            onChange={handleFamilyFilter}
            className="w-full px-2.5 py-2 sm:py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-base sm:text-xs focus:ring-1 focus:ring-wedding-accent bg-white"
          >
            <option value="">🏠 Todas las Familias</option>
            <option value="none">Sin Familia (Individuales)</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        <div className="flex items-center justify-between sm:justify-end">
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="text-stone-500 hover:text-stone-800 text-xs flex items-center gap-1 px-3 py-1.5 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <X size={14} />
              <span>Limpiar filtros</span>
            </button>
          ) : (
            <span className="text-[11px] text-stone-400 hidden sm:inline">Sin filtros activos</span>
          )}
        </div>
      </div>
    </div>
  );
}
