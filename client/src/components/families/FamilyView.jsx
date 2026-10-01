import React, { useState, useMemo } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { FamilyCard } from './FamilyCard';
import { FamilyModal } from './FamilyModal';
import { Modal } from '../common/Modal';
import { familyApi } from '../../services/familyApi';
import { 
  Home, 
  Plus, 
  Search, 
  X, 
  Sparkles, 
  RefreshCw, 
  Users, 
  User, 
  UserPlus, 
  HeartHandshake, 
  Heart, 
  Link2,
  CheckCircle2,
  Clock,
  XCircle,
  Tag
} from 'lucide-react';

export function FamilyView() {
  const { families, guests = [], loading, isRefreshing, showToast, refreshAll } = useWedding();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('families'); // 'families', 'individuals', 'all', 'friends'
  const [modalOpen, setModalOpen] = useState(false);
  const [familyToEdit, setFamilyToEdit] = useState(null);
  const [preselectedGuestId, setPreselectedGuestId] = useState(null);
  const [familyToDelete, setFamilyToDelete] = useState(null);
  const [deleteMembersAlso, setDeleteMembersAlso] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  // Vincular invitado existente a una familia
  const [guestToAssign, setGuestToAssign] = useState(null);
  const [targetFamilyId, setTargetFamilyId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Clasificación de amigos (solo para casos genuinos de grupos de amigos)
  const isFriendFamily = (fam) => {
    if (!fam) return false;
    const nameMatch = fam.name && /amig/i.test(fam.name);
    const notesMatch = fam.notes && /amig/i.test(fam.notes);
    const memberMatch = fam.members && fam.members.some((m) => m.group_relation && /amig/i.test(m.group_relation));
    return Boolean(nameMatch || notesMatch || memberMatch);
  };

  // Invitados sin familia asignada (solos / individuales)
  const unassignedGuests = useMemo(() => {
    return (guests || []).filter((g) => !g.family_id);
  }, [guests]);

  const isFriendGuest = (g) => {
    return Boolean(g.group_relation && /amig/i.test(g.group_relation));
  };

  // Conteos
  const friendsFamiliesCount = useMemo(() => families.filter(isFriendFamily).length, [families]);
  const unassignedFriendsCount = useMemo(() => unassignedGuests.filter(isFriendGuest).length, [unassignedGuests]);
  const totalFriendsCount = friendsFamiliesCount + unassignedFriendsCount;
  const totalAllCount = families.length + unassignedGuests.length;

  // Filtrado de Familias (En la pestaña "Familias", TODAS las familias registradas son familias)
  const filteredFamilies = useMemo(() => {
    const q = search.trim().toLowerCase();

    // En la pestaña "Individuales", no mostramos las familias
    if (categoryFilter === 'individuals') {
      return [];
    }

    return families.filter((f) => {
      // Si se activa el filtro específico de amigos
      if (categoryFilter === 'friends' && !isFriendFamily(f)) {
        return false;
      }

      // Filtro de búsqueda en tiempo real
      if (q) {
        const matchName = f.name && f.name.toLowerCase().includes(q);
        const matchNotes = f.notes && f.notes.toLowerCase().includes(q);
        const matchPhone = f.phone && f.phone.toLowerCase().includes(q);
        const matchMembers = f.members && f.members.some((m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.group_relation && m.group_relation.toLowerCase().includes(q))
        );
        if (!matchName && !matchNotes && !matchPhone && !matchMembers) {
          return false;
        }
      }

      return true;
    });
  }, [families, categoryFilter, search]);

  // Filtrado de Invitados Individuales (sin familia asignada)
  const filteredUnassignedGuests = useMemo(() => {
    const q = search.trim().toLowerCase();

    // En la pestaña "Familias", no mostramos los individuales sin familia (a menos que haya una búsqueda específica)
    if (categoryFilter === 'families' && !q) {
      return [];
    }

    return unassignedGuests.filter((g) => {
      // En filtro "Amigos", solo amigos individuales
      if (categoryFilter === 'friends' && !isFriendGuest(g)) {
        return false;
      }

      // Búsqueda en tiempo real
      if (q) {
        const matchName = g.name && g.name.toLowerCase().includes(q);
        const matchPartner = g.partner_name && g.partner_name.toLowerCase().includes(q);
        const matchGroup = g.group_relation && g.group_relation.toLowerCase().includes(q);
        const matchPhone = g.phone && g.phone.toLowerCase().includes(q);
        if (!matchName && !matchPartner && !matchGroup && !matchPhone) {
          return false;
        }
      }

      return true;
    });
  }, [unassignedGuests, categoryFilter, search]);

  const handleOpenAdd = () => {
    setFamilyToEdit(null);
    setPreselectedGuestId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (fam) => {
    setFamilyToEdit(fam);
    setPreselectedGuestId(null);
    setModalOpen(true);
  };

  const handleCreateFamilyForGuest = (guest) => {
    setFamilyToEdit(null);
    setPreselectedGuestId(guest.id);
    setModalOpen(true);
  };

  const handleAssignGuestToFamily = async () => {
    if (!guestToAssign || !targetFamilyId) return;
    setIsAssigning(true);
    try {
      await familyApi.assignMembers(targetFamilyId, [guestToAssign.id]);
      showToast(`${guestToAssign.name} vinculado con éxito`);
      await refreshAll();
      setGuestToAssign(null);
      setTargetFamilyId('');
    } catch (err) {
      showToast(err.message || 'Error al vincular invitado', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAutoGenerate = async () => {
    setIsAutoGenerating(true);
    try {
      const res = await familyApi.autoGenerate();
      if (res.success) {
        showToast(res.message || 'Familias generadas y vinculadas con éxito');
        await refreshAll();
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
      await refreshAll();
      setFamilyToDelete(null);
    } catch (err) {
      showToast(err.message || 'Error al eliminar', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasAnyResults = filteredFamilies.length > 0 || filteredUnassignedGuests.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 md:pb-8 animate-in fade-in duration-200">
      
      {/* Header bar: Search, Categories & Actions */}
      <div className="bg-white rounded-2xl border border-wedding-border p-3.5 sm:p-5 shadow-sm space-y-3.5">
        
        {/* Row 1: Search + Add Family */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
            <input
              type="text"
              placeholder="Buscar por familia, integrante o individual..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-base sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-wedding-accent focus:bg-white transition-all placeholder:text-stone-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 rounded-md cursor-pointer"
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-all whitespace-nowrap active:scale-95 disabled:opacity-50 min-h-[42px] cursor-pointer"
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-wedding-primary hover:bg-wedding-primaryLight text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all whitespace-nowrap active:scale-95 min-h-[42px] cursor-pointer"
            >
              <Plus size={17} />
              <span>Nueva Familia</span>
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 text-xs">
          <button
            onClick={() => setCategoryFilter('families')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              categoryFilter === 'families'
                ? 'bg-wedding-primary text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200/60'
            }`}
          >
            <Home size={14} />
            <span>Familias ({families.length})</span>
          </button>

          <button
            onClick={() => setCategoryFilter('individuals')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              categoryFilter === 'individuals'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200/70'
            }`}
            title="Invitados individuales sin familia asignada"
          >
            <User size={14} />
            <span>Individuales ({unassignedGuests.length})</span>
          </button>

          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-wedding-primary text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200/60'
            }`}
          >
            <Users size={14} />
            <span>Todos ({totalAllCount})</span>
          </button>

          {totalFriendsCount > 0 && (
            <button
              onClick={() => setCategoryFilter('friends')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === 'friends'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/70'
              }`}
              title="Invitados asignados al grupo Amigos"
            >
              <HeartHandshake size={14} />
              <span>Amigos ({totalFriendsCount})</span>
            </button>
          )}
        </div>

      </div>

      {/* Families Count & Sync Indicator */}
      <div className="flex items-center justify-between px-1 text-xs text-stone-500">
        <span>
          Mostrando <strong className="text-stone-800">{filteredFamilies.length}</strong> familias
          {filteredUnassignedGuests.length > 0 && (
            <span> y <strong className="text-stone-800">{filteredUnassignedGuests.length}</strong> individuales</span>
          )}
        </span>
        {isRefreshing && (
          <span className="flex items-center gap-1 text-[11px] text-stone-400">
            <RefreshCw size={11} className="animate-spin" />
            <span>Sincronizando...</span>
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && families.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-wedding-border">
          <div className="w-8 h-8 border-3 border-wedding-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-stone-500 mt-3 font-medium">Cargando familias...</p>
        </div>
      ) : !hasAnyResults ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-wedding-border shadow-xs space-y-4">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-wedding-accentDark">
            <Home size={28} />
          </div>
          <div>
            <h3 className="font-editorial text-xl font-medium text-stone-900">
              {search ? 'Ningún grupo o invitado coincide con la búsqueda' : 'No hay elementos en esta categoría'}
            </h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto mt-1">
              {search
                ? 'Prueba con otro término de búsqueda o limpia los filtros.'
                : 'Crea una familia o vincula invitados para organizarlos en este grupo.'}
            </p>
          </div>
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('families');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <span>Restablecer filtros</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 1. Grid de Familias y Grupos */}
          {filteredFamilies.length > 0 && (
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

          {/* 2. Sección de Invitados Individuales (Sin Familia Asignada) */}
          {filteredUnassignedGuests.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-t border-stone-200/80 pt-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      Invitados Individuales (Sin Familia Asignada)
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Invitados que asisten solos o que aún no han sido vinculados a un grupo familiar
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                  {filteredUnassignedGuests.length} {filteredUnassignedGuests.length === 1 ? 'invitado' : 'invitados'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredUnassignedGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-stone-900 text-sm truncate">{guest.name}</h4>
                          {guest.partner_name && (
                            <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                              <Heart size={11} className="text-pink-500 shrink-0" />
                              <span>Pareja: {guest.partner_name}</span>
                            </p>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          guest.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : guest.status === 'declined'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {guest.status === 'confirmed' ? 'Confirmado' : guest.status === 'declined' ? 'No Asiste' : 'Pendiente'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                          {guest.group_relation || 'General'}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-wedding-accentLight text-wedding-primaryDark">
                          {guest.confirmed_seats || 1} {(guest.confirmed_seats || 1) === 1 ? 'pase' : 'pases'}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60">
                          Individual
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => handleCreateFamilyForGuest(guest)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-wedding-primary hover:bg-wedding-primaryLight text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                        title="Crear un grupo o tarjeta familiar para este invitado"
                      >
                        <Plus size={13} />
                        <span>Crear Grupo</span>
                      </button>
                      <button
                        onClick={() => {
                          setGuestToAssign(guest);
                          setTargetFamilyId('');
                        }}
                        className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-stone-200 active:scale-95"
                        title="Vincular a una familia ya existente"
                      >
                        <Link2 size={13} />
                        <span>Vincular</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Add / Edit Family Modal */}
      <FamilyModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFamilyToEdit(null);
          setPreselectedGuestId(null);
        }}
        familyToEdit={familyToEdit}
        preselectedGuestId={preselectedGuestId}
      />

      {/* Modal para Vincular Invitado a Familia Existente */}
      <Modal
        isOpen={Boolean(guestToAssign)}
        onClose={() => {
          setGuestToAssign(null);
          setTargetFamilyId('');
        }}
        title="Vincular a Familia Existente"
        subtitle={`Selecciona la familia a la que pertenece ${guestToAssign?.name}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Familia de Destino *
            </label>
            <select
              value={targetFamilyId}
              onChange={(e) => setTargetFamilyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-wedding-accent text-sm bg-white"
            >
              <option value="">-- Elige una familia --</option>
              {families.map((fam) => (
                <option key={fam.id} value={fam.id}>
                  {fam.name} ({fam.total_members} {fam.total_members === 1 ? 'persona' : 'personas'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setGuestToAssign(null);
                setTargetFamilyId('');
              }}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!targetFamilyId || isAssigning}
              onClick={handleAssignGuestToFamily}
              className="px-4 py-2 text-xs font-semibold text-white bg-wedding-primary hover:bg-wedding-primaryLight rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isAssigning ? 'Vinculando...' : 'Confirmar Vinculación'}
            </button>
          </div>
        </div>
      </Modal>

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
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Familia'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
