import { useState, useEffect } from 'react';

// Sábado, 21 de Noviembre de 2026 a las 4:30 PM (UTC-6)
export const WEDDING_TARGET_DATE = new Date('2026-11-21T16:30:00-06:00');
// Fecha de referencia inicial para el cálculo de progreso (ej. 1 de Enero de 2026)
const WEDDING_START_DATE = new Date('2026-01-01T00:00:00-06:00');

function calculateTimeRemaining() {
  const now = new Date();
  const diff = WEDDING_TARGET_DATE.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalDays: 0,
      totalHours: 0,
      totalMinutes: 0,
      totalSeconds: 0,
      totalWeeks: 0,
      progress: 100,
      isPassed: true,
      formattedDate: 'Sábado, 21 de Noviembre de 2026',
      formattedTime: '4:30 PM',
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  const totalWeeks = Math.floor(totalDays / 7);

  const days = totalDays;
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  // Progreso porcentual
  const totalSpan = WEDDING_TARGET_DATE.getTime() - WEDDING_START_DATE.getTime();
  const elapsed = now.getTime() - WEDDING_START_DATE.getTime();
  const rawProgress = Math.round((elapsed / totalSpan) * 100);
  const progress = Math.min(100, Math.max(0, rawProgress));

  return {
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalHours,
    totalMinutes,
    totalSeconds,
    totalWeeks,
    progress,
    isPassed: false,
    formattedDate: 'Sábado, 21 de Noviembre de 2026',
    formattedTime: '4:30 PM',
  };
}

export function useWeddingCountdown() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeRemaining);

  useEffect(() => {
    // Actualizar inmediatamente al montar
    setTimeLeft(calculateTimeRemaining());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Generador de enlace directo a Google Calendar
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent('Nuestra Boda • E & D');
    const details = encodeURIComponent(
      '¡El gran día ha llegado! Celebración de la Boda de Edisp y su prometida (E & D). ¡Acompáñanos a celebrar nuestro amor!'
    );
    const location = encodeURIComponent('Ceremonia y Recepción');
    // 2026-11-21 16:30 UTC-6 = 2026-11-21 22:30:00 UTC
    // Duración estimada: 7 horas -> 2026-11-22 05:30:00 UTC
    const dates = '20261121T223000Z/20261122T053000Z';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  // Descarga de archivo .ics para Apple Calendar, Android o Outlook
  const downloadIcsFile = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nuestra Boda E & D//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:boda-ed-20261121@wedding.ed',
      'DTSTAMP:20260930T000000Z',
      'DTSTART:20261121T223000Z',
      'DTEND:20261122T053000Z',
      'SUMMARY:Nuestra Boda • E & D 💍',
      'DESCRIPTION:¡El gran día ha llegado! Celebración de la Boda de Edisp y su prometida (E & D).',
      'LOCATION:Ceremonia & Recepción',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Boda_E_y_D_21_Noviembre_2026.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    ...timeLeft,
    getGoogleCalendarUrl,
    downloadIcsFile,
  };
}
