export function generateWhatsAppMessage(guest) {
  const name = guest.name;

  const text = `¡Hola ${name}!
Esperamos que estés muy bien. Nos hace una ilusión inmensa celebrar nuestro gran día contigo.
¿Podrías por favor confirmarnos tu asistencia (y la de tus acompañantes si aplica)?

Puedes respondernos por este medio con un Sí o No. ¡Un abrazo enorme!`;

  return encodeURIComponent(text);
}

// Genera el mensaje romántico personalizado listo para pegar o enviar por WhatsApp junto con el enlace firmado
export function buildInvitationShareMessage(card, inviteUrl) {
  const salutation = card?.salutation || 'Invitado Especial';
  const seats = Number(card?.seats) || 1;
  const isPlural = seats > 1 || card?.type === 'family' || card?.type === 'couple';

  if (isPlural) {
    return (
      `¡Hola, *${salutation}*! 🤍✨\n\n` +
      `Con la bendición de Dios, *Edis y Dania* tenemos la inmensa alegría de invitarles a celebrar nuestra boda el *Sábado 21 de Noviembre de 2026*. 💍\n\n` +
      `Hemos reservado con mucho cariño *${seats} pases* especialmente para ustedes. 🎟️\n\n` +
      `Pueden abrir su sobre e invitación digital, ver la ubicación y confirmar su asistencia en este enlace:\n` +
      `${inviteUrl}\n\n` +
      `¡Nos hará muy felices compartir este gran día con ustedes! 🥂✨`
    );
  }

  return (
    `¡Hola, *${salutation}*! 🤍✨\n\n` +
    `Con la bendición de Dios, *Edis y Dania* tenemos la inmensa alegría de invitarte a celebrar nuestra boda el *Sábado 21 de Noviembre de 2026*. 💍\n\n` +
    `Hemos reservado con mucho cariño *1 pase* especial para ti. 🎟️\n\n` +
    `Puedes abrir tu sobre e invitación digital, ver la ubicación y confirmar tu asistencia en este enlace:\n` +
    `${inviteUrl}\n\n` +
    `¡Nos hará muy felices compartir este gran día contigo! 🥂✨`
  );
}

export function openWhatsApp(phone, message) {
  if (!phone) return;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  // Si el mensaje ya viene codificado (%20 / %0A), respetarlo; si es texto plano, codificarlo para conservar saltos de línea y parámetros del link
  const isAlreadyEncoded = /%[0-9A-Fa-f]{2}/.test(message) && !message.includes(' ') && !message.includes('\n');
  const safeText = isAlreadyEncoded ? message : encodeURIComponent(message);
  window.open(`https://wa.me/${cleanPhone}?text=${safeText}`, '_blank');
}
