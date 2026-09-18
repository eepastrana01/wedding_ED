import React, { useState } from 'react';
import { StatusBadge, StatusToggleButtons } from '../common/StatusBadge';
import { PriorityBadge, GroupBadge } from '../common/PriorityBadge';
import { useWedding } from '../../context/WeddingContext';
import { Phone, MessageCircle, Heart, MoreVertical, Edit2, Trash2, Users, AlertCircle, ChevronDown, ChevronUp, Ticket } from 'lucide-react';
import { generateWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp';

export function GuestCardMobile({ guest, onEdit, onDelete }) {
  const { setGuestStatus } = useWedding();
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleStatusChange = (status) => {
    setGuestStatus(guest.id, status);
  };

  const handleWhatsApp = () => {
    if (!guest.phone) {
      alert('Este invitado no tiene número de teléfono registrado.');
      return;
    }
    const message = generateWhatsAppMessage(guest);
    openWhatsApp(guest.phone, message);
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-150 shadow-card overflow-hidden ${
        guest.status === 'confirmed'
          ? 'border-emerald-200/90 bg-linear-to-b from-emerald-50/25 to-white'
          : guest.status === 'declined'
          ? 'border-rose-200/70 bg-linear-to-b from-rose-50/20 to-white'
          : 'border-wedding-border'
      }`}
    >
      {/* Main card body */}
      <div className="p-3.5 sm:p-4 space-y-2.5">
        
        {/* Header: Name + Badges + Menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-editorial text-base sm:text-lg font-bold text-stone-900 truncate">
                {guest.name}
              </h4>
              <PriorityBadge priority={guest.priority} />
            </div>

            {/* Pareja if exists */}
            {guest.partner_name && (
              <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-0.5">
                <Heart size={12} className="text-wedding-rose fill-wedding-rose shrink-0" />
                <span>Pareja: <strong className="text-stone-800 font-semibold">{guest.partner_name}</strong></span>
              </div>
            )}

            {/* Family and Seats badge */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {guest.family_name && (
                <div className="flex items-center gap-1 text-[11px] text-wedding-accentDark font-semibold bg-wedding-accentLight/60 px-2 py-0.2 rounded-md">
                  <Users size={11} className="shrink-0" />
                  <span>{guest.family_name}</span>
                </div>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                <Ticket size={11} className="text-stone-500 shrink-0" />
                <span>{guest.confirmed_seats || 1} {guest.confirmed_seats === 1 ? 'pase' : 'pases'}</span>
              </span>
            </div>
          </div>

          {/* Actions Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors"
              aria-label="Opciones"
            >
              <MoreVertical size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-stone-200 py-1 z-20 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(guest);
                  }}
                  className="w-full px-3 py-2.5 text-left flex items-center gap-2 text-stone-700 hover:bg-stone-50"
                >
                  <Edit2 size={14} />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(guest);
                  }}
                  className="w-full px-3 py-2.5 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={14} />
                  <span>Eliminar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tags row */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <GroupBadge group={guest.group_relation} />
          {guest.type && (
            <span className="text-[10px] sm:text-[11px] px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full border border-stone-200">
              {guest.type}
            </span>
          )}
          {guest.guest_type && guest.guest_type !== 'Titular' && (
            <span className="text-[10px] sm:text-[11px] px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200 font-medium">
              {guest.guest_type}
            </span>
          )}
        </div>

        {/* Quick RSVP Status Buttons */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100">
          <span className="text-xs font-semibold text-stone-600">Asistencia:</span>
          <StatusToggleButtons
            currentStatus={guest.status}
            onChange={handleStatusChange}
          />
        </div>

        {/* Quick Contacts Bar (WhatsApp / Call) */}
        {guest.phone && (
          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 min-h-[40px] py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200/80 transition-all duration-150 active:scale-98 shadow-2xs"
            >
              <MessageCircle size={16} className="text-emerald-600" />
              <span>WhatsApp</span>
            </button>
            <a
              href={`tel:${guest.phone}`}
              className="flex items-center justify-center min-w-[40px] min-h-[40px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-all duration-150 active:scale-95"
              title="Llamar"
            >
              <Phone size={16} />
            </a>
          </div>
        )}

        {/* Expand for Details (Dietary, Notes) */}
        {(guest.dietary_notes || guest.notes) && (
          <div className="pt-1 border-t border-stone-100">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between text-[11px] text-stone-400 hover:text-stone-600 py-1"
            >
              <span>{expanded ? 'Ocultar detalles' : 'Ver alergias / notas'}</span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expanded && (
              <div className="mt-1.5 space-y-1.5 bg-stone-50 p-2.5 rounded-xl text-xs text-stone-700 border border-stone-200/70 animate-in fade-in duration-150">
                {guest.dietary_notes && (
                  <div className="flex items-start gap-1.5 text-amber-900">
                    <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Alergias:</strong> {guest.dietary_notes}</span>
                  </div>
                )}
                {guest.notes && (
                  <p className="text-stone-600"><strong>Notas:</strong> {guest.notes}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
