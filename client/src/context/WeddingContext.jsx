import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { guestApi } from '../services/guestApi';
import { familyApi } from '../services/familyApi';
import { statsApi } from '../services/statsApi';
import { taskApi } from '../services/taskApi';

const WeddingContext = createContext();

export function WeddingProvider({ children }) {
  const [activeTab, setActiveTab] = useState('guests');
  const [guests, setGuests] = useState([]);
  const [families, setFamilies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters for guests view
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    group_relation: 'all',
    priority: 'all',
    family_id: '',
  });

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#C5A880', '#2D5342', '#D9777F', '#F0E6D2']
      });
    } catch (e) {
      // ignore
    }
  };

  // Fetch all guests once from server (no filtering on server so local filtering is 0ms instant)
  const fetchAllGuests = useCallback(async (silent = false) => {
    try {
      const res = await guestApi.getAll();
      if (res.success) {
        setGuests(res.data);
      }
    } catch (err) {
      console.error('Error fetching guests:', err);
      if (!silent) {
        showToast(err.message, 'error');
      }
    }
  }, []);

  const fetchFamilies = useCallback(async () => {
    try {
      const res = await familyApi.getAll();
      if (res.success) {
        setFamilies(res.data);
      }
    } catch (err) {
      console.error('Error fetching families:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await statsApi.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const fetchTasks = useCallback(async (silent = false) => {
    try {
      const res = await taskApi.getAll();
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      if (!silent) {
        showToast(err.message, 'error');
      }
    }
  }, []);

  // Silent refresh in background that does NOT flash full loading spinners or reset scroll
  const refreshAll = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    await Promise.all([
      fetchAllGuests(!isInitial), 
      fetchFamilies(), 
      fetchStats(),
      fetchTasks(!isInitial)
    ]);
    if (isInitial) {
      setLoading(false);
    } else {
      setIsRefreshing(false);
    }
  }, [fetchAllGuests, fetchFamilies, fetchStats, fetchTasks]);

  useEffect(() => {
    // Carga inicial
    refreshAll(true);

    // Sincronización automática entre dispositivos (PC <-> Celular)
    // Se actualiza en silencio cuando el usuario vuelve a enfocar la ventana/pestaña
    const handleFocusOrVisible = () => {
      if (!document.hidden) {
        refreshAll(false);
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    // Sondeo inteligente en vivo (cada 6 segundos, únicamente si la pestaña está visible)
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        refreshAll(false);
      }
    }, 6000);

    return () => {
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      clearInterval(intervalId);
    };
  }, [refreshAll]);

  // Instant in-memory filtering: 0ms lag, silky smooth 60fps typing
  const filteredGuests = useMemo(() => {
    const searchLower = filters.search.trim().toLowerCase();

    return guests.filter((g) => {
      // Search filter
      if (searchLower) {
        const matchName = g.name && g.name.toLowerCase().includes(searchLower);
        const matchPartner = g.partner_name && g.partner_name.toLowerCase().includes(searchLower);
        const matchFamily = g.family_name && g.family_name.toLowerCase().includes(searchLower);
        const matchPhone = g.phone && g.phone.toLowerCase().includes(searchLower);
        const matchGroup = g.group_relation && g.group_relation.toLowerCase().includes(searchLower);
        if (!matchName && !matchPartner && !matchFamily && !matchPhone && !matchGroup) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (g.status !== filters.status) return false;
      }

      // Group relation filter
      if (filters.group_relation && filters.group_relation !== 'all') {
        if (g.group_relation !== filters.group_relation) return false;
      }

      // Priority filter
      if (filters.priority && filters.priority !== 'all') {
        if (g.priority !== filters.priority) return false;
      }

      // Family filter
      if (filters.family_id) {
        if (filters.family_id === 'none') {
          if (g.family_id !== null && g.family_id !== undefined) return false;
        } else {
          if (String(g.family_id) !== String(filters.family_id)) return false;
        }
      }

      return true;
    });
  }, [guests, filters]);

  // Derived Cards summary & items (Tarjetas de Invitación necesarias)
  const invitationCards = useMemo(() => {
    // 1. Family cards
    const familyCards = families.map((fam) => {
      const members = fam.members || [];
      const totalSeats = members.reduce((sum, m) => sum + (parseInt(m.confirmed_seats, 10) || 1), 0) || fam.total_members || 1;
      const allConfirmed = members.length > 0 && members.every((m) => m.status === 'confirmed');
      const anyDeclined = members.length > 0 && members.every((m) => m.status === 'declined');

      return {
        id: `fam-${fam.id}`,
        type: 'family',
        familyId: fam.id,
        title: fam.name,
        salutation: fam.name.toLowerCase().startsWith('familia') ? fam.name : `Familia ${fam.name}`,
        seats: Math.max(totalSeats, fam.total_members || 1),
        membersCount: fam.total_members || members.length,
        members: members,
        phone: fam.phone || members.find((m) => m.phone)?.phone || null,
        delivered: Boolean(fam.invitation_delivered),
        notes: fam.notes,
        statusSummary: {
          confirmed: fam.confirmed_members || 0,
          pending: fam.pending_members || 0,
          declined: fam.declined_members || 0,
          isAllConfirmed: allConfirmed,
          isAllDeclined: anyDeclined,
        },
        group: members[0]?.group_relation || 'General',
        priority: members[0]?.priority || 'A',
      };
    });

    // 2. Individual / Couple cards (guests with no family_id)
    const soloGuests = guests.filter((g) => !g.family_id);
    const individualCards = soloGuests.map((guest) => {
      const INVALID_PARTNERS = ['novio', 'novia', 'comun', 'común', 'general', 'ninguno', 'ninguna', 'no', 'sin pareja'];
      const rawPartner = (guest.partner_name || '').trim();
      const hasPartner = Boolean(rawPartner && !INVALID_PARTNERS.includes(rawPartner.toLowerCase()));
      const seats = hasPartner ? Math.max(2, parseInt(guest.confirmed_seats, 10) || 2) : (parseInt(guest.confirmed_seats, 10) || 1);

      let salutation = guest.name;
      if (hasPartner) {
        salutation = `${guest.name} & ${guest.partner_name}`;
      }

      return {
        id: `guest-${guest.id}`,
        type: hasPartner ? 'couple' : 'individual',
        guestId: guest.id,
        title: guest.name,
        partner_name: hasPartner ? guest.partner_name : null,
        salutation,
        seats,
        membersCount: hasPartner ? 2 : 1,
        members: [
          guest,
          ...(hasPartner ? [{ id: `p-${guest.id}`, name: guest.partner_name, type: 'Acompañante', status: guest.status }] : [])
        ],
        phone: guest.phone,
        delivered: Boolean(guest.invitation_delivered),
        notes: guest.notes,
        statusSummary: {
          confirmed: guest.status === 'confirmed' ? 1 : 0,
          pending: guest.status === 'pending' ? 1 : 0,
          declined: guest.status === 'declined' ? 1 : 0,
          isAllConfirmed: guest.status === 'confirmed',
          isAllDeclined: guest.status === 'declined',
        },
        group: guest.group_relation || 'General',
        priority: guest.priority || 'A',
      };
    });

    const all = [...familyCards, ...individualCards];

    // Stats for cards
    const totalCards = all.length;
    const totalFamilyCards = familyCards.length;
    const totalIndividualCards = individualCards.length;
    const totalSeatsRequired = all.reduce((sum, c) => sum + c.seats, 0);
    const deliveredCount = all.filter((c) => c.delivered).length;
    const pendingDeliveryCount = totalCards - deliveredCount;

    return {
      all,
      familyCards,
      individualCards,
      summary: {
        totalCards,
        totalFamilyCards,
        totalIndividualCards,
        totalSeatsRequired,
        deliveredCount,
        pendingDeliveryCount,
        deliveryRate: totalCards > 0 ? Math.round((deliveredCount / totalCards) * 100) : 0,
      }
    };
  }, [families, guests]);

  // Optimistic RSVP status update for single guest
  const setGuestStatus = async (guestId, newStatus) => {
    const previousGuests = [...guests];

    // Immediate optimistic local update (0ms perceived latency!)
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, status: newStatus } : g))
    );

    // Also update family members list if present
    setFamilies((prev) =>
      prev.map((f) => {
        if (f.members && f.members.some((m) => m.id === guestId)) {
          const updatedMembers = f.members.map((m) => (m.id === guestId ? { ...m, status: newStatus } : m));
          const confirmed = updatedMembers.filter((m) => m.status === 'confirmed').length;
          const declined = updatedMembers.filter((m) => m.status === 'declined').length;
          const pending = updatedMembers.filter((m) => m.status === 'pending').length;
          return {
            ...f,
            members: updatedMembers,
            confirmed_members: confirmed,
            declined_members: declined,
            pending_members: pending,
          };
        }
        return f;
      })
    );

    if (newStatus === 'confirmed') {
      triggerCelebration();
    }

    try {
      await guestApi.updateStatus(guestId, newStatus);
      showToast(
        `Asistencia de invitado: ${newStatus === 'confirmed' ? 'Confirmado' : newStatus === 'declined' ? 'No Asiste' : 'Pendiente'}`
      );
      fetchStats();
    } catch (err) {
      // Revert if error
      setGuests(previousGuests);
      showToast('Error al actualizar estado', 'error');
    }
  };

  // Optimistic RSVP status update for whole family
  const setFamilyStatus = async (familyId, newStatus) => {
    const previousGuests = [...guests];
    const previousFamilies = [...families];

    // Immediate optimistic update for all family members
    setGuests((prev) =>
      prev.map((g) => (g.family_id === familyId ? { ...g, status: newStatus } : g))
    );

    setFamilies((prev) =>
      prev.map((f) => {
        if (f.id === familyId) {
          const updatedMembers = (f.members || []).map((m) => ({ ...m, status: newStatus }));
          return {
            ...f,
            members: updatedMembers,
            confirmed_members: newStatus === 'confirmed' ? (f.total_members || updatedMembers.length) : 0,
            declined_members: newStatus === 'declined' ? (f.total_members || updatedMembers.length) : 0,
            pending_members: newStatus === 'pending' ? (f.total_members || updatedMembers.length) : 0,
          };
        }
        return f;
      })
    );

    if (newStatus === 'confirmed') {
      triggerCelebration();
    }

    try {
      await familyApi.updateBulkStatus(familyId, newStatus);
      showToast(
        `Familia completa marcada como ${newStatus === 'confirmed' ? 'Confirmada' : newStatus === 'declined' ? 'No Asisten' : 'Pendiente'}`
      );
      fetchStats();
    } catch (err) {
      setGuests(previousGuests);
      setFamilies(previousFamilies);
      showToast('Error al actualizar familia', 'error');
    }
  };

  // Optimistic toggle for invitation card delivery
  const toggleDeliveryStatus = async (card) => {
    const newDelivered = !card.delivered;

    if (card.type === 'family') {
      setFamilies((prev) =>
        prev.map((f) => (f.id === card.familyId ? { ...f, invitation_delivered: newDelivered } : f))
      );
      try {
        await familyApi.updateDelivery(card.familyId, newDelivered);
        showToast(newDelivered ? 'Tarjeta familiar marcada como entregada' : 'Tarjeta familiar marcada como pendiente');
      } catch (err) {
        setFamilies((prev) =>
          prev.map((f) => (f.id === card.familyId ? { ...f, invitation_delivered: !newDelivered } : f))
        );
        showToast('Error al actualizar entrega', 'error');
      }
    } else {
      setGuests((prev) =>
        prev.map((g) => (g.id === card.guestId ? { ...g, invitation_delivered: newDelivered } : g))
      );
      try {
        await guestApi.updateDelivery(card.guestId, newDelivered);
        showToast(newDelivered ? 'Tarjeta individual marcada como entregada' : 'Tarjeta individual marcada como pendiente');
      } catch (err) {
        setGuests((prev) =>
          prev.map((g) => (g.id === card.guestId ? { ...g, invitation_delivered: !newDelivered } : g))
        );
        showToast('Error al actualizar entrega', 'error');
      }
    }
  };

  // Task Metrics & Calculation
  const taskMetrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const estimatedCost = tasks.reduce((acc, t) => acc + (parseFloat(t.estimated_cost) || 0), 0);
    const actualCost = tasks.reduce((acc, t) => acc + (parseFloat(t.actual_cost) || 0), 0);

    return {
      total,
      completed,
      pending,
      progress,
      estimatedCost,
      actualCost,
    };
  }, [tasks]);

  const createTask = async (data) => {
    try {
      const res = await taskApi.create(data);
      if (res.success) {
        setTasks((prev) => [res.data, ...prev]);
        showToast('Tarea agregada con éxito');
        return res.data;
      }
    } catch (err) {
      showToast(err.message || 'Error al crear tarea', 'error');
      throw err;
    }
  };

  const updateTask = async (id, data) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    try {
      const res = await taskApi.update(id, data);
      if (res.success) {
        setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
        showToast('Tarea actualizada');
        return res.data;
      }
    } catch (err) {
      fetchTasks(true);
      showToast(err.message || 'Error al actualizar tarea', 'error');
      throw err;
    }
  };

  const deleteTask = async (id) => {
    const backup = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await taskApi.delete(id);
      showToast('Tarea eliminada');
    } catch (err) {
      setTasks(backup);
      showToast(err.message || 'Error al eliminar tarea', 'error');
      throw err;
    }
  };

  const toggleTaskStatus = async (id) => {
    const current = tasks.find((t) => t.id === id);
    if (!current) return;
    const newStatus = current.status === 'completed' ? 'pending' : 'completed';

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updatedSubtasks = newStatus === 'completed'
            ? (t.subtasks || []).map((st) => ({ ...st, completed: true }))
            : t.subtasks;
          return { ...t, status: newStatus, subtasks: updatedSubtasks };
        }
        return t;
      })
    );

    if (newStatus === 'completed') {
      triggerCelebration();
    }

    try {
      const res = await taskApi.toggleStatus(id, newStatus);
      if (res.success) {
        setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
      }
    } catch (err) {
      fetchTasks(true);
      showToast('Error al actualizar estado de la tarea', 'error');
    }
  };

  const toggleSubtask = async (taskId, subtaskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = (t.subtasks || []).map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);
          const newStatus = allCompleted ? 'completed' : t.status === 'completed' ? 'pending' : t.status;
          return { ...t, subtasks: updatedSubtasks, status: newStatus };
        }
        return t;
      })
    );

    try {
      const res = await taskApi.toggleSubtask(taskId, subtaskId);
      if (res.success) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? res.data : t)));
        if (res.data.status === 'completed') {
          triggerCelebration();
        }
      }
    } catch (err) {
      fetchTasks(true);
      showToast('Error al actualizar subtarea', 'error');
    }
  };

  const loadPresetTasks = async () => {
    try {
      const res = await taskApi.loadPresets();
      if (res.success) {
        setTasks((prev) => [...res.data, ...prev]);
        showToast(res.message || 'Tareas sugeridas agregadas');
        triggerCelebration();
      }
    } catch (err) {
      showToast(err.message || 'Error al cargar tareas esenciales', 'error');
    }
  };

  return (
    <WeddingContext.Provider
      value={{
        activeTab,
        setActiveTab,
        guests,
        filteredGuests,
        families,
        invitationCards,
        tasks,
        taskMetrics,
        stats,
        loading,
        isRefreshing,
        filters,
        setFilters,
        fetchAllGuests,
        fetchFamilies,
        fetchStats,
        fetchTasks,
        refreshAll,
        setGuestStatus,
        setFamilyStatus,
        toggleDeliveryStatus,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        toggleSubtask,
        loadPresetTasks,
        showToast,
        toastMessage,
        setToastMessage,
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
}

export function useWedding() {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error('useWedding must be used within a WeddingProvider');
  }
  return context;
}
