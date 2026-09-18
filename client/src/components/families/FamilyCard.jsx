import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { StatusToggleButtons } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { Users, CheckCheck, XCircle, Clock, ChevronDown, ChevronUp, MessageCircle, Phone, Edit2, Trash2, Heart, MailCheck } from 'lucide-react';
import { generateWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp';

export function FamilyCard({ family, onEdit, onDelete }) {
  const { setFamilyStatus, setGuestStatus } = useWedding();
  const [expanded, setExpanded] = useState(true);

  const total = family.total_members || 0;
  const confirmed = family.confirmed_members || 0;
  const declined = family.declined_members || 0;
  const pending = family.pending_members || 0;

  const isAllConfirmed = total > 0 && confirmed === total;
  const isAllDeclined = total > 0 && declined === total;

  const handleWhatsAppFamily = () => {
    if (!family.phone) {
      alert('Esta familia no tiene número de teléfono registrado.');
      return;
    }
    const message = generateWhatsAppMessage({ name: family.name, family_name: family.name });
    openWhatsApp(family.phone, message);
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-150 shadow-card overflow-hidden ${
      isAllConfirmed
        ? 'border-emerald-200/90 bg-linear-to-b from-emerald-50/25 to-white'
        : isAllDeclined
        ? 'border-rose-200/70 bg-linear-to-b from-rose-50/20 to-white'
        : 'border-wedding-border'
    }`}>
      
      {/* Header of Family Card */}
      <div className="p-3.5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-stone-900 truncate">
                {family.name}
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-wedding-accentLight text-wedding-primaryDark font-semibold">
                {total} {total === 1 ? 'persona' : 'personas'}
              </span>
              {family.invitation_delivered && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300/60">
                  <MailCheck size={11} />
                  <span>Invitación Entregada</span>
                </span>
              )}
            </div>

            {/* Badges count */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
                <CheckCheck size={12} /> {confirmed} confirmados
              </span>
              {pending > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 text-[11px]">
                  <Clock size={12} /> {pending} pendientes
                </span>
              )}
              {declined > 0 && (
                <span className="inline-flex items-center gap-1 text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60 text-[11px]">
                  <XCircle size={12} /> {declined} no asisten
                </span>
              )}
            </div>

            {family.notes && (
              <p className="text-xs text-stone-500 mt-2 italic">
                📝 {family.notes}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {family.phone && (
              <button
                onClick={handleWhatsAppFamily}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
                title="WhatsApp al grupo familiar"
              >
                <MessageCircle size={18} />
              </button>
            )}
            <button
              onClick={() => onEdit(family)}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
              title="Editar familia"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(family)}
              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
              title="Eliminar familia"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Bulk attendance buttons row */}
        <div className="mt-3.5 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Confirmar Grupo:
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFamilyStatus(family.id, 'confirmed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-bold rounded-xl border transition-all duration-150 active:scale-95 ${
                isAllConfirmed
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCheck size={14} />
              <span>Confirmar Todos</span>
            </button>

            <button
              type="button"
              onClick={() => setFamilyStatus(family.id, 'declined')}
              className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-bold rounded-xl border transition-all duration-150 active:scale-95 ${
                isAllDeclined
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <XCircle size={14} />
              <span>Declinar Todos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Member list accordion */}
      <div className="bg-stone-50/70 border-t border-stone-200/80">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3.5 sm:px-5 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users size={14} className="text-wedding-primary" />
            <span>Integrantes ({family.members?.length || 0})</span>
          </div>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {expanded && (
          <div className="px-3.5 sm:px-5 pb-3 divide-y divide-stone-200/60 animate-in fade-in duration-150">
            {family.members && family.members.length > 0 ? (
              family.members.map((member) => (
                <div
                  key={member.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-editorial text-sm font-semibold text-stone-800">
                        {member.name}
                      </span>
                      <PriorityBadge priority={member.priority} />
                      <span className="text-[10px] text-stone-500 bg-white px-2 py-0.2 rounded-md border border-stone-200">
                        {member.type || 'Adulto'}
                      </span>
                    </div>

                    {member.partner_name && (
                      <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                        <Heart size={10} className="text-wedding-rose fill-wedding-rose" />
                        <span>Pareja: <strong>{member.partner_name}</strong></span>
                      </div>
                    )}

                    {member.dietary_notes && (
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        🍽️ {member.dietary_notes}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 pt-1 sm:pt-0">
                    <StatusToggleButtons
                      size="sm"
                      currentStatus={member.status}
                      onChange={(newStatus) => setGuestStatus(member.id, newStatus)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-400 py-3 italic text-center">
                No hay miembros asignados a esta familia aún.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
