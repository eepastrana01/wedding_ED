import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { GuestFilters } from './GuestFilters';
import { GuestTable } from './GuestTable';
import { GuestCardMobile } from './GuestCardMobile';
import { GuestModal } from './GuestModal';
import { Modal } from '../common/Modal';
import { guestApi } from '../../services/guestApi';
import { Users, Sparkles, UserPlus, UploadCloud, SearchX, RefreshCw } from 'lucide-react';

export function GuestView() {
  const { guests, filteredGuests, loading, isRefreshing, showToast, refreshAll, setActiveTab } = useWedding();
  const [modalOpen, setModalOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState(null);
  const [guestToDelete, setGuestToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAddModal = () => {
    setGuestToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (guest) => {
    setGuestToEdit(guest);
    setModalOpen(true);
  };

  const handleDeleteGuest = async () => {
    if (!guestToDelete) return;
    setIsDeleting(true);
    try {
      await guestApi.delete(guestToDelete.id);
      showToast('Invitado eliminado');
      refreshAll();
      setGuestToDelete(null);
    } catch (err) {
      showToast(err.message || 'Error al eliminar', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 md:pb-8 animate-in fade-in duration-200">
      
      {/* Top filter section */}
      <GuestFilters
        onNewGuest={handleOpenAddModal}
        totalCount={guests.length}
      />

      {/* Main content display */}
      {loading && guests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-wedding-border shadow-xs">
          <div className="w-8 h-8 border-3 border-wedding-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-stone-500 mt-3 font-medium">Cargando lista de invitados...</p>
        </div>
      ) : guests.length === 0 ? (
        /* Empty State: No guests at all */
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-wedding-border shadow-xs space-y-4">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-wedding-accentDark">
            <Users size={28} />
          </div>
          <div>
            <h3 className="font-editorial text-xl font-medium text-stone-900">
              No hay invitados registrados aún
            </h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto mt-1">
              Puedes cargar tu archivo CSV con las columnas correspondientes o registrar nuevos invitados manualmente.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('importer')}
              className="flex items-center gap-2 px-4 py-2.5 bg-wedding-accentLight text-wedding-accentDark hover:bg-wedding-accentLight/80 rounded-xl text-sm font-semibold transition-colors"
            >
              <UploadCloud size={16} />
              <span>Importar CSV</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-wedding-primary hover:bg-wedding-primaryLight text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <UserPlus size={16} />
              <span>Agregar Manual</span>
            </button>
          </div>
        </div>
      ) : filteredGuests.length === 0 ? (
        /* Filter Empty State: Search or filter matched nothing */
        <div className="text-center py-14 px-4 bg-white rounded-2xl border border-wedding-border shadow-xs space-y-3">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
            <SearchX size={24} />
          </div>
          <h3 className="font-editorial text-lg font-medium text-stone-800">
            Ningún invitado coincide con los filtros
          </h3>
          <p className="text-stone-500 text-xs max-w-sm mx-auto">
            Prueba a borrar la búsqueda o cambiar los filtros seleccionados.
          </p>
        </div>
      ) : (
        <>
          {/* Active Results Summary count */}
          <div className="flex items-center justify-between px-1 text-xs text-stone-500">
            <span>
              Mostrando <strong className="text-stone-800">{filteredGuests.length}</strong> de {guests.length} invitados
            </span>
            {isRefreshing && (
              <span className="flex items-center gap-1 text-[11px] text-stone-400">
                <RefreshCw size={11} className="animate-spin" />
                <span>Sincronizando...</span>
              </span>
            )}
          </div>

          {/* Mobile Card Grid (Visible on small screens) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredGuests.map((guest) => (
              <GuestCardMobile
                key={guest.id}
                guest={guest}
                onEdit={handleOpenEditModal}
                onDelete={(g) => setGuestToDelete(g)}
              />
            ))}
          </div>

          {/* Desktop Table (Visible on medium screens and larger) */}
          <div className="hidden md:block">
            <GuestTable
              guests={filteredGuests}
              onEdit={handleOpenEditModal}
              onDelete={(g) => setGuestToDelete(g)}
            />
          </div>
        </>
      )}

      {/* Guest Add / Edit Modal */}
      <GuestModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setGuestToEdit(null);
        }}
        guestToEdit={guestToEdit}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(guestToDelete)}
        onClose={() => setGuestToDelete(null)}
        title="Eliminar Invitado"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            ¿Estás seguro de que deseas eliminar a <strong className="text-stone-900">{guestToDelete?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setGuestToDelete(null)}
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteGuest}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
