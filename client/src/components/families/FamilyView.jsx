import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { FamilyCard } from './FamilyCard';
import { FamilyModal } from './FamilyModal';
import { Modal } from '../common/Modal';
import { familyApi } from '../../services/familyApi';
import { Home, Plus, Search, X, Sparkles, RefreshCw } from 'lucide-react';

export function FamilyView() {
  const { families, loading, isRefreshing, showToast, refreshAll } = useWedding();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [familyToEdit, setFamilyToEdit] = useState(null);
  const [familyToDelete, setFamilyToDelete] = useState(null);
  const [deleteMembersAlso, setDeleteMembersAlso] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  const filteredFamilies = families.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.members && f.members.some((m) => m.name.toLowerCase().includes(search.toLowerCase())))
  );

  const handleOpenAdd = () => {
    setFamilyToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (fam) => {
    setFamilyToEdit(fam);
    setModalOpen(true);
  };

  const handleAutoGenerate = async () => {
    setIsAutoGenerating(true);
    try {
      const res = await familyApi.autoGenerate();
      if (res.success) {
        showToast(res.message || 'Familias generadas y vinculadas con éxito');
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Error al auto-generar familias', 'error');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!familyToDelete) return;
    setIsDeleting(true);
    try {
      await familyApi.delete(familyToDelete.id, deleteMembersAlso);
      showToast('Familia eliminada');
      refreshAll();
      setFamilyToDelete(null);
    } catch (err) {
      showToast(err.message || 'Error al eliminar', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 md:pb-8 animate-in fade-in duration-200">
      
      {/* Header bar: Search & Add Family */}
      <div className="bg-white rounded-2xl border border-wedding-border p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por nombre de familia o integrante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-base sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-wedding-accent focus:bg-white transition-all placeholder:text-stone-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 rounded-md"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isAutoGenerating}
            onClick={handleAutoGenerate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-all whitespace-nowrap active:scale-95 disabled:opacity-50 min-h-[42px]"
            title="Detecta automáticamente grupos y apellidos de tus invitados para crear sus familias"
          >
            {isAutoGenerating ? (
              <div className="w-4 h-4 border-2 border-amber-800 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Sparkles size={16} className="text-amber-600 shrink-0" />
            )}
            <span>{isAutoGenerating ? 'Generando...' : 'Auto-agrupar'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-wedding-primary hover:bg-wedding-primaryLight text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all whitespace-nowrap active:scale-95 min-h-[42px]"
          >
            <Plus size={17} />
            <span>Nueva Familia</span>
          </button>
        </div>
      </div>

      {/* Families Count & Sync Indicator */}
      {families.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs text-stone-500">
          <span>
            Mostrando <strong className="text-stone-800">{filteredFamilies.length}</strong> de {families.length} familias
          </span>
          {isRefreshing && (
            <span className="flex items-center gap-1 text-[11px] text-stone-400">
              <RefreshCw size={11} className="animate-spin" />
              <span>Sincronizando...</span>
            </span>
          )}
        </div>
      )}

      {/* Families Grid */}
      {loading && families.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-wedding-border">
          <div className="w-8 h-8 border-3 border-wedding-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-stone-500 mt-3 font-medium">Cargando familias...</p>
        </div>
      ) : filteredFamilies.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-wedding-border shadow-xs space-y-4">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-wedding-accentDark">
            <Home size={28} />
          </div>
          <div>
            <h3 className="font-editorial text-xl font-medium text-stone-900">
              {search ? 'Ninguna familia coincide con la búsqueda' : 'No hay familias registradas'}
            </h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto mt-1">
              {search
                ? 'Prueba con otro apellido o integrante familiar.'
                : 'Crea familias para agrupar invitados (por ejemplo familias con hijos o parejas) y confirmar la asistencia de todos en un solo toque.'}
            </p>
          </div>
          {!search && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isAutoGenerating}
                onClick={handleAutoGenerate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {isAutoGenerating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles size={17} />
                )}
                <span>Auto-crear Familias desde Invitados</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-sm font-semibold transition-colors"
              >
                <Plus size={17} />
                <span>Crear Familia Manual</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredFamilies.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              onEdit={handleOpenEdit}
              onDelete={(fam) => {
                setFamilyToDelete(fam);
                setDeleteMembersAlso(false);
              }}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Family Modal */}
      <FamilyModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFamilyToEdit(null);
        }}
        familyToEdit={familyToEdit}
      />

      {/* Delete Family Confirmation Modal */}
      <Modal
        isOpen={Boolean(familyToDelete)}
        onClose={() => setFamilyToDelete(null)}
        title="Eliminar Familia"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            ¿Deseas eliminar a la <strong className="text-stone-900">{familyToDelete?.name}</strong>?
          </p>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer text-xs text-stone-700">
            <input
              type="checkbox"
              checked={deleteMembersAlso}
              onChange={(e) => setDeleteMembersAlso(e.target.checked)}
              className="mt-0.5 rounded-sm text-rose-600 focus:ring-rose-500"
            />
            <span>
              <strong>Eliminar también a los invitados</strong> de la lista general. (Si no marcas esto, quedarán como invitados individuales sin familia).
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFamilyToDelete(null)}
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Familia'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
