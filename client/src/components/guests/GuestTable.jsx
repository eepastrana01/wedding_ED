import React from 'react';
import { StatusToggleButtons } from '../common/StatusBadge';
import { PriorityBadge, GroupBadge } from '../common/PriorityBadge';
import { useWedding } from '../../context/WeddingContext';
import { MessageCircle, Phone, Edit2, Trash2, Heart, Users, Utensils } from 'lucide-react';
import { generateWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp';

export function GuestTable({ guests, onEdit, onDelete }) {
  const { setGuestStatus } = useWedding();

  const handleWhatsApp = (guest) => {
    if (!guest.phone) {
      alert('Este invitado no tiene número de teléfono registrado.');
      return;
    }
    const message = generateWhatsAppMessage(guest);
    openWhatsApp(guest.phone, message);
  };

  return (
    <div className="bg-white rounded-2xl border border-wedding-border shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-stone-50/90 border-b border-wedding-border text-stone-600 text-xs uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Invitado / Pareja</th>
              <th className="py-3.5 px-3">Grupo / Relación</th>
              <th className="py-3.5 px-3 text-center">Tipo</th>
              <th className="py-3.5 px-3 text-center">Prioridad</th>
              <th className="py-3.5 px-3">Familia</th>
              <th className="py-3.5 px-4 text-center">Confirmación</th>
              <th className="py-3.5 px-3 text-center">Contacto</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {guests.map((guest) => {
              const isConfirmed = guest.status === 'confirmed';
              const isDeclined = guest.status === 'declined';

              return (
                <tr
                  key={guest.id}
                  className={`hover:bg-stone-50/70 transition-colors ${
                    isConfirmed
                      ? 'bg-emerald-50/20'
                      : isDeclined
                      ? 'bg-rose-50/15'
                      : ''
                  }`}
                >
                  {/* Nombre y Pareja */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 font-medium text-stone-900 font-editorial text-base">
                        <span>{guest.name}</span>
                        {guest.dietary_notes && (
                          <span title={`Alergias: ${guest.dietary_notes}`}>
                            <Utensils size={13} className="text-amber-600 inline" />
                          </span>
                        )}
                      </div>
                      {guest.partner_name && (
                        <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                          <Heart size={11} className="text-wedding-rose fill-wedding-rose" />
                          <span>Pareja: <strong className="text-stone-700">{guest.partner_name}</strong></span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Grupo / Relación */}
                  <td className="py-3.5 px-3">
                    <GroupBadge group={guest.group_relation} />
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                      {guest.type || 'Adulto'}
                    </span>
                  </td>

                  {/* Prioridad */}
                  <td className="py-3.5 px-3 text-center">
                    <PriorityBadge priority={guest.priority} />
                  </td>

                  {/* Familia */}
                  <td className="py-3.5 px-3 text-xs text-stone-600">
                    {guest.family_name ? (
                      <div className="flex items-center gap-1 font-medium text-wedding-accentDark">
                        <Users size={13} className="shrink-0" />
                        <span className="truncate max-w-[130px]">{guest.family_name}</span>
                      </div>
                    ) : (
                      <span className="text-stone-400 italic">Individual</span>
                    )}
                  </td>

                  {/* Status Toggle Buttons */}
                  <td className="py-3.5 px-4 text-center">
                    <StatusToggleButtons
                      size="sm"
                      currentStatus={guest.status}
                      onChange={(newStatus) => setGuestStatus(guest.id, newStatus)}
                    />
                  </td>

                  {/* Quick Contact */}
                  <td className="py-3.5 px-3 text-center">
                    {guest.phone ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleWhatsApp(guest)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Enviar WhatsApp de confirmación"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <a
                          href={`tel:${guest.phone}`}
                          className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Llamar"
                        >
                          <Phone size={15} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-stone-300 text-xs">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => onEdit(guest)}
                        className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Editar invitado"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(guest)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar invitado"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
