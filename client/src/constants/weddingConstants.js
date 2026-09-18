export const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmado',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badge: 'bg-emerald-600 text-white',
    iconColor: 'text-emerald-600',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
    activeBg: 'bg-emerald-500/10'
  },
  pending: {
    label: 'Pendiente',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    badge: 'bg-amber-500 text-white',
    iconColor: 'text-amber-500',
    dot: 'bg-amber-400',
    border: 'border-amber-200',
    activeBg: 'bg-amber-500/10'
  },
  declined: {
    label: 'No Asiste',
    color: 'bg-rose-50 text-rose-800 border-rose-200',
    badge: 'bg-rose-500 text-white',
    iconColor: 'text-rose-500',
    dot: 'bg-rose-400',
    border: 'border-rose-200',
    activeBg: 'bg-rose-500/10'
  }
};

export const PRIORITY_CONFIG = {
  'A': { label: 'Prioridad A', color: 'bg-wedding-primary/10 text-wedding-primary border-wedding-primary/20' },
  'B': { label: 'Prioridad B', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'C': { label: 'Prioridad C', color: 'bg-stone-100 text-stone-600 border-stone-200' },
  'Alta': { label: 'Prioridad Alta', color: 'bg-wedding-primary/10 text-wedding-primary border-wedding-primary/20' },
  'Media': { label: 'Prioridad Media', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Baja': { label: 'Prioridad Baja', color: 'bg-stone-100 text-stone-600 border-stone-200' },
};

export const DEFAULT_GROUPS = [
  'Familia Novio',
  'Familia Novia',
  'Amigos Novio',
  'Amigos Novia',
  'Amigos en Común',
  'Trabajo Novio',
  'Trabajo Novia',
  'Compromisos / Otros'
];

export const GUEST_TYPES = ['Titular', 'Acompañante', 'Familiar', 'VIP', 'Padrino/Madrina', 'Dama de Honor', 'Testigo'];

export const AGE_TYPES = ['Adulto', 'Joven', 'Niño', 'Bebé'];
