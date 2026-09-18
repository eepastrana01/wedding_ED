import React from 'react';
import { PRIORITY_CONFIG } from '../../constants/weddingConstants';

export function PriorityBadge({ priority = 'A', className = '' }) {
  const config = PRIORITY_CONFIG[priority] || {
    label: `Prioridad ${priority}`,
    color: 'bg-stone-100 text-stone-600 border-stone-200'
  };

  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md border tracking-wide uppercase ${config.color} ${className}`}>
      {priority}
    </span>
  );
}

export function GroupBadge({ group, className = '' }) {
  if (!group) return null;
  const isNovio = group.toLowerCase().includes('novio');
  const isNovia = group.toLowerCase().includes('novia');

  let colorClass = 'bg-stone-100 text-stone-700 border-stone-200';
  if (isNovio) {
    colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/70';
  } else if (isNovia) {
    colorClass = 'bg-rose-50 text-rose-800 border-rose-200/70';
  }

  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass} ${className}`}>
      {group}
    </span>
  );
}
