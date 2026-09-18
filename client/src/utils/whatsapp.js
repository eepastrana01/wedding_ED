export function generateWhatsAppMessage(guest, customBrideGroom = 'Nosotros') {
  const isFamily = Boolean(guest.family_name);
  const name = guest.name;
  
  const text = `¡Hola ${name}!
Esperamos que estés muy bien. Nos hace una ilusión inmensa celebrar nuestro gran día contigo.
¿Podrías por favor confirmarnos tu asistencia (y la de tus acompañantes si aplica)?

Puedes respondernos por este medio con un Sí o No. ¡Un abrazo enorme!`;

  return encodeURIComponent(text);
}

export function openWhatsApp(phone, message) {
  if (!phone) return;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
}
