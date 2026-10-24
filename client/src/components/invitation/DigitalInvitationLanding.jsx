import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useWedding } from '../../context/WeddingContext';
import { useWeddingCountdown } from '../../hooks/useWeddingCountdown';
import { openWhatsApp } from '../../utils/whatsapp';
import {
  Heart,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  MessageCircle,
  ChevronDown,
  Ticket,
  Mail,
  Users,
  Search,
  Share2,
  Download,
  ExternalLink,
  UserCheck,
  ArrowLeft,
} from 'lucide-react';

// Curva suave estilo Canva para interpolar el ensamblaje con el scroll
function easeOutCubic(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

// Calcula progreso [0..1] para un rango específico dentro del progreso maestro [start..end]
function subProgress(progress, start, end) {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return easeOutCubic((progress - start) / (end - start));
}

export function DigitalInvitationLanding({ onBackToAdmin }) {
  const {
    invitationCards,
    setFamilyStatus,
    setGuestStatus,
    showToast,
  } = useWedding();
  const { days, hours, minutes, seconds } = useWeddingCountdown();

  // Parámetros de la URL (?invitacion=fam-12 o ?card=fam-12&para=Familia+Pastrana&pases=4)
  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const p = new URLSearchParams(window.location.search);
    return {
      cardId: p.get('card') || p.get('invitacion') || '',
      guestNameParam: p.get('para') || '',
      seatsParam: parseInt(p.get('pases'), 10) || null,
      isAdminPreview: p.get('preview') === 'true',
    };
  }, []);

  const allCards = invitationCards?.all || [];

  // Si el link tiene un cardId específico (ej. fam-12 o guest-45), buscamos su tarjeta en tiempo real
  const [selectedCardId, setSelectedCardId] = useState(() => {
    if (
      urlParams.cardId &&
      urlParams.cardId !== 'true' &&
      urlParams.cardId !== 'general'
    ) {
      return urlParams.cardId;
    }
    return '';
  });

  const activeCard = useMemo(() => {
    if (!selectedCardId) return null;
    return allCards.find((c) => String(c.id) === String(selectedCardId)) || null;
  }, [allCards, selectedCardId]);

  // Nombre y cantidad de pases a mostrar (usa la tarjeta activa o los parámetros del link o valor general)
  const displaySalutation =
    activeCard?.salutation ||
    urlParams.guestNameParam ||
    'Invitado Especial';

  const displaySeats =
    activeCard?.seats ||
    urlParams.seatsParam ||
    2;

  // Buscador para cuando se comparte el link general sin cardId preasignado
  const [guestSearch, setGuestSearch] = useState('');
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(false);

  // Referencias de las 3 secciones que se ensamblan con el scroll
  const stage1Ref = useRef(null);
  const stage2Ref = useRef(null);
  const stage3Ref = useRef(null);

  const [scrollState, setScrollState] = useState({
    p1: 0.15, // Progreso Invitación Principal (0 a 1)
    p2: 0,    // Progreso Pases Reservados (0 a 1)
    p3: 0,    // Progreso Tarjeta de Regalo (0 a 1)
  });

  // Motor de animación sincronizado con el scroll a 60fps
  useEffect(() => {
    let rafId = null;

    const updateScrollProgress = () => {
      const vh = window.innerHeight || 800;

      const calcStageProgress = (el, startOffset = 0.88, travelFactor = 0.85) => {
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        // Empieza a ensamblarse apenas entra en pantalla y termina cuando llega al centro/sticky
        const startY = vh * startOffset;
        const totalTravel = vh * travelFactor;
        const raw = (startY - rect.top) / totalTravel;
        return Math.max(0, Math.min(1, raw));
      };

      setScrollState({
        p1: calcStageProgress(stage1Ref.current, 0.92, 0.72),
        p2: calcStageProgress(stage2Ref.current, 0.92, 0.68),
        p3: calcStageProgress(stage3Ref.current, 0.92, 0.68),
      });
    };

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateScrollProgress);
    };

    updateScrollProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleStartJourney = () => {
    setIsEnvelopeOpened(true);
    if (stage1Ref.current) {
      stage1Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Confirmar toda la tarjeta directamente en la base de datos
  const handleDirectConfirmCard = async (card) => {
    if (!card) return;
    try {
      if (card.type === 'family') {
        await setFamilyStatus(card.familyId, 'confirmed');
      } else {
        await setGuestStatus(card.guestId, 'confirmed');
      }
      setRsvpSubmitted(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#4C8B54', '#C5A880', '#1F3A2E', '#FAF8F5'],
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Cambiar estado de un miembro individual de la tarjeta
  const handleToggleMember = (card, member) => {
    if (!card || !member) return;
    const realGuestId = String(member.id).startsWith('p-') ? card.guestId : member.id;
    const nextStatus = member.status === 'confirmed' ? 'pending' : 'confirmed';
    setGuestStatus(realGuestId, nextStatus);
  };

  // Confirmar por WhatsApp (+504 8778-8207)
  const handleWhatsAppRsvp = () => {
    const seatsText = `${displaySeats} ${displaySeats === 1 ? 'pase' : 'pases'}`;
    const namePart =
      displaySalutation && displaySalutation !== 'Invitado Especial'
        ? `Somos *${displaySalutation}* (${seatsText}) y confirmamos`
        : `Hola Edis y Dania, confirmo`;

    const msg = `¡Hola Edis y Dania! 💍✨ ${namePart} con mucha alegría nuestra asistencia a su boda el 21 de Noviembre en Calan Park. ¡Muchas gracias por la invitación!`;
    openWhatsApp('+50487788207', msg);
  };

  // Filtrar tarjetas en el buscador si el usuario abrió el link general
  const matchingCards = useMemo(() => {
    if (!guestSearch || guestSearch.trim().length < 2) return [];
    const q = guestSearch.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return allCards
      .filter((c) => {
        const hay = [
          c.salutation,
          c.title,
          ...(c.members || []).map((m) => m.name),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return hay.includes(q);
      })
      .slice(0, 6);
  }, [allCards, guestSearch]);

  // Progresos individuales para las capas de la Invitación Principal (Stage 1)
  const p1 = scrollState.p1;
  const s1Corners = subProgress(p1, 0.0, 0.55);
  const s1Names = subProgress(p1, 0.08, 0.62);
  const s1Verse = subProgress(p1, 0.18, 0.70);
  const s1Date = subProgress(p1, 0.28, 0.78);
  const s1Venue = subProgress(p1, 0.38, 0.86);
  const s1Footer = subProgress(p1, 0.48, 0.96);
  const s1Unified = subProgress(p1, 0.82, 1.0);

  // Progresos individuales para Pases Reservados (Stage 2)
  const p2 = scrollState.p2;
  const s2Leaves = subProgress(p2, 0.0, 0.60);
  const s2Title = subProgress(p2, 0.12, 0.65);
  const s2Box = subProgress(p2, 0.24, 0.82);
  const s2Text = subProgress(p2, 0.35, 0.92);
  const s2Unified = subProgress(p2, 0.80, 1.0);

  // Progresos individuales para Tarjeta de Regalo (Stage 3)
  const p3 = scrollState.p3;
  const s3Flowers = subProgress(p3, 0.0, 0.58);
  const s3Quote = subProgress(p3, 0.16, 0.76);
  const s3Envelope = subProgress(p3, 0.32, 0.92);
  const s3Unified = subProgress(p3, 0.80, 1.0);

  return (
    <div className="min-h-screen bg-[#F5F7F3] text-[#2F352E] font-sans overflow-x-hidden selection:bg-[#7A8F76]/25">
      {/* Barra flotante superior minimalista */}
      <div className="fixed top-3 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none flex items-center justify-between max-w-5xl mx-auto">
        {onBackToAdmin || urlParams.isAdminPreview ? (
          <button
            type="button"
            onClick={() => {
              if (onBackToAdmin) {
                onBackToAdmin();
              } else {
                window.location.href = '/';
              }
            }}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md text-stone-700 hover:text-wedding-primaryDark text-xs font-semibold shadow-md border border-stone-200/80 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Volver a la App</span>
          </button>
        ) : (
          <div className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-md shadow-sm border border-[#7A8F76]/25">
            <span className="font-serif font-bold text-xs text-[#2F4838]">E & D</span>
            <span className="text-[11px] text-stone-500">• 21 Nov 2026</span>
          </div>
        )}

        <a
          href="#confirmar-asistencia"
          className="pointer-events-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2F4838] hover:bg-[#23372A] text-white text-xs font-semibold shadow-md transition-all"
        >
          <CheckCircle2 size={14} className="text-[#C5A880]" />
          <span>Confirmar Asistencia</span>
        </a>
      </div>

      {/* =====================================================================
          PORTADA DE BIENVENIDA (SOBRE BOTÁNICO INTERACTIVO)
      ===================================================================== */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 py-16 overflow-hidden bg-gradient-to-b from-[#EBF0E8] via-[#F5F7F3] to-[#F5F7F3]">
        {/* Ramas de eucalipto decorativas flotando en las esquinas de la portada */}
        <img
          src="/invitacion/leaf-top-left.png"
          alt=""
          className="pointer-events-none select-none absolute -top-4 -left-6 w-44 sm:w-64 md:w-80 opacity-85 transition-transform duration-700"
          style={{
            transform: `translate3d(${isEnvelopeOpened ? '-10px' : '0px'}, 0, 0) rotate(-4deg)`,
          }}
        />
        <img
          src="/invitacion/leaf-bottom-right.png"
          alt=""
          className="pointer-events-none select-none absolute -bottom-4 -right-6 w-44 sm:w-64 md:w-80 opacity-85 transition-transform duration-700"
          style={{
            transform: `translate3d(${isEnvelopeOpened ? '10px' : '0px'}, 0, 0) rotate(4deg)`,
          }}
        />

        {/* Tarjeta / Sobre de Bienvenida */}
        <div className="relative z-10 max-w-lg w-full text-center space-y-6 bg-white/80 backdrop-blur-md rounded-3xl p-7 sm:p-10 shadow-[0_20px_60px_-15px_rgba(47,72,56,0.14)] border border-[#7A8F76]/25 animate-in fade-in duration-300">
          {/* Sello Monograma E & D */}
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-[#52795C] via-[#3A5A43] to-[#243B2B] p-[2px] shadow-lg flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#FAF9F5] border border-[#C5A880]/60 flex flex-col items-center justify-center">
              <span className="font-serif text-xl font-bold text-[#243B2B] tracking-wider leading-none">
                E<span className="text-[#C5A880] italic font-serif text-base mx-0.5">&</span>D
              </span>
              <span className="text-[8px] uppercase tracking-[0.22em] text-stone-400 mt-1">
                21 • 11 • 26
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-[#4C8B54] font-semibold">
              Invitación Digital de Boda
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#2D332B] tracking-wide">
              Edis <span className="italic font-light text-[#6B7F67]">&</span> Dania
            </h1>
          </div>

          {/* Destinatario personalizado */}
          <div className="bg-[#F3F6F1] border border-[#4C8B54]/25 rounded-2xl px-5 py-4 space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 block">
              Invitación Especial Para
            </span>
            <p className="font-serif text-xl sm:text-2xl font-bold text-[#243B2B]">
              {displaySalutation}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#4C8B54]/30 text-[#3B6E42] text-xs font-bold shadow-2xs mt-1">
              <Ticket size={13} />
              <span>
                {displaySeats} {displaySeats === 1 ? 'Pase Reservado' : 'Pases Reservados'}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
            Desliza suavemente hacia abajo para descubrir cada detalle y ver cómo se une nuestra invitación.
          </p>

          <button
            type="button"
            onClick={handleStartJourney}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#2F4838] hover:bg-[#23372A] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          >
            <Sparkles size={16} className="text-[#C5A880]" />
            <span>Deslizar y Abrir Invitación</span>
            <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Indicador animado de scroll */}
        <div className="mt-8 flex flex-col items-center gap-1.5 text-stone-400">
          <span className="text-[10px] uppercase tracking-[0.25em]">Desliza hacia abajo</span>
          <ChevronDown size={18} className="animate-bounce text-[#4C8B54]" />
        </div>
      </section>

      {/* =====================================================================
          STAGE 1: LA INVITACIÓN PRINCIPAL (ENSAMBLAJE ESTILO CANVA AL HACER SCROLL)
      ===================================================================== */}
      <section
        ref={stage1Ref}
        className="relative py-8 sm:py-14 px-3 sm:px-6 max-w-4xl mx-auto"
      >
        <div className="text-center mb-5 sm:mb-7 space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4C8B54]/10 text-[#3B6E42] text-[11px] font-bold uppercase tracking-widest">
            <Sparkles size={12} />
            {p1 >= 0.92 ? 'Invitación Completa' : 'Desliza para unir las piezas'}
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-[#2D332B] font-semibold">
            Nuestra Invitación Oficial
          </h2>
        </div>

        {/* Lienzo de Ensamblaje con Aspect Ratio Exacto de InvitacionBoda.png (1428 x 2000) */}
        <div className="relative mx-auto w-full max-w-[540px] aspect-[1428/2000] rounded-3xl shadow-[0_25px_70px_-15px_rgba(31,58,46,0.22)] border border-[#7A8F76]/30 bg-[#F3F5F0] overflow-hidden select-none">
          
          {/* CAPA 0: Fondo de papel acuarela suave */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-xl scale-105 opacity-35"
          />

          {/* CAPA 1A: Esquina Superior Izquierda (Hojas de Olivo en Acuarela) */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(0% 56% 58% 0%)',
              opacity: s1Corners,
              transform: `translate3d(${(1 - s1Corners) * -95}px, ${(1 - s1Corners) * -65}px, 0) rotate(${(1 - s1Corners) * -10}deg) scale(${0.86 + 0.14 * s1Corners})`,
            }}
          />

          {/* CAPA 1B: Esquina Superior Derecha (Rosas Blancas en Acuarela) */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(0% 0% 60% 56%)',
              opacity: s1Corners,
              transform: `translate3d(${(1 - s1Corners) * 95}px, ${(1 - s1Corners) * -60}px, 0) rotate(${(1 - s1Corners) * 10}deg) scale(${0.86 + 0.14 * s1Corners})`,
            }}
          />

          {/* CAPA 1C: Flores Blancas Laterales Izquierdas */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(38% 60% 0% 0%)',
              opacity: s1Corners,
              transform: `translate3d(${(1 - s1Corners) * -105}px, ${(1 - s1Corners) * 45}px, 0) rotate(${(1 - s1Corners) * -7}deg) scale(${0.88 + 0.12 * s1Corners})`,
            }}
          />

          {/* CAPA 1D: Esquina Inferior Derecha (Hojas de Olivo Inferiores) */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(58% 0% 0% 54%)',
              opacity: s1Corners,
              transform: `translate3d(${(1 - s1Corners) * 95}px, ${(1 - s1Corners) * 75}px, 0) rotate(${(1 - s1Corners) * 9}deg) scale(${0.88 + 0.12 * s1Corners})`,
            }}
          />

          {/* CAPA 2: Caligrafía Principal "Edis y Dania" */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt="Edis y Dania"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(6% 14% 66% 14%)',
              opacity: s1Names,
              transform: `translate3d(0, ${(1 - s1Names) * -65}px, 0) scale(${0.82 + 0.18 * s1Names})`,
            }}
          />

          {/* CAPA 3: "TE INVITAMOS A NUESTRA BODA" + Versículo Mateo 19:6 */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt="Mateo 19:6"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(34% 10% 47.5% 10%)',
              opacity: s1Verse,
              transform: `translate3d(0, ${(1 - s1Verse) * 55}px, 0) scale(${0.92 + 0.08 * s1Verse})`,
            }}
          />

          {/* CAPA 4A: "NOV" (entra desde la izquierda) */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt="Noviembre"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(52.5% 57% 36.5% 18%)',
              opacity: s1Date,
              transform: `translate3d(${(1 - s1Date) * -110}px, 0, 0)`,
            }}
          />

          {/* CAPA 4B: "21" (emerge en el centro con efecto zoom) */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt="Día 21"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(52% 41% 36% 41%)',
              opacity: s1Date,
              transform: `translate3d(0, ${(1 - s1Date) * 35}px, 0) scale(${0.55 + 0.45 * s1Date})`,
            }}
          />

          {/* CAPA 4C: "4:30 P.M." (entra desde la derecha) */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt="4:30 P.M."
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(52.5% 16% 36.5% 57%)',
              opacity: s1Date,
              transform: `translate3d(${(1 - s1Date) * 110}px, 0, 0)`,
            }}
          />

          {/* CAPA 5: Lugar (Calan Park, Villanueva) + Confirmar Asistencia + Código de Vestimenta */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt="Calan Park, Villanueva"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(64% 12% 13.5% 12%)',
              opacity: s1Venue,
              transform: `translate3d(0, ${(1 - s1Venue) * 70}px, 0)`,
            }}
          />

          {/* CAPA 6: Firma Caligráfica "Te esperamos" */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt="Te esperamos"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(86% 18% 1% 18%)',
              opacity: s1Footer,
              transform: `translate3d(0, ${(1 - s1Footer) * 60}px, 0) scale(${0.86 + 0.14 * s1Footer})`,
            }}
          />

          {/* CAPA FINAL UNIFICADA: Garantiza nitidez 100% sin costuras al terminar el ensamblaje */}
          <img
            src="/invitacion/invitacion-boda.png"
            alt="Invitación de Boda Edis y Dania"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
            style={{ opacity: s1Unified }}
          />
        </div>
      </section>

      {/* =====================================================================
          STAGE 2: TARJETA DE PASES RESERVADOS (CON CONTEO DINÁMICO EN EL CUADRO VERDE)
      ===================================================================== */}
      <section
        ref={stage2Ref}
        className="relative py-10 sm:py-16 px-3 sm:px-6 max-w-4xl mx-auto"
      >
        <div className="text-center mb-5 sm:mb-7 space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4C8B54]/12 text-[#3B6E42] text-[11px] font-bold uppercase tracking-widest">
            <Ticket size={13} />
            Tus Pases Asignados
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-[#2D332B] font-semibold">
            Pases Reservados para {displaySalutation}
          </h2>
        </div>

        {/* Lienzo de Ensamblaje de Pases Reservados (1600 x 889) */}
        <div className="relative mx-auto w-full max-w-[640px] aspect-[1600/889] rounded-3xl shadow-[0_22px_55px_-12px_rgba(31,58,46,0.18)] border border-[#4C8B54]/25 bg-white overflow-hidden select-none">
          
          {/* CAPA 1A: Rama de Eucalipto Superior Izquierda */}
          <img
            src="/invitacion/pases-reservados.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(0% 68% 48% 0%)',
              opacity: s2Leaves,
              transform: `translate3d(${(1 - s2Leaves) * -85}px, ${(1 - s2Leaves) * -55}px, 0) rotate(${(1 - s2Leaves) * -12}deg)`,
            }}
          />

          {/* CAPA 1B: Rama de Eucalipto Inferior Derecha */}
          <img
            src="/invitacion/pases-reservados.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(48% 0% 0% 68%)',
              opacity: s2Leaves,
              transform: `translate3d(${(1 - s2Leaves) * 85}px, ${(1 - s2Leaves) * 55}px, 0) rotate(${(1 - s2Leaves) * 12}deg)`,
            }}
          />

          {/* CAPA 2: Título "PASES RESERVADOS" */}
          <img
            src="/invitacion/pases-reservados.png"
            alt="Pases Reservados"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(6% 18% 76% 18%)',
              opacity: s2Title,
              transform: `translate3d(0, ${(1 - s2Title) * -45}px, 0)`,
            }}
          />

          {/* CAPA 3: Cuadro Verde Central */}
          <img
            src="/invitacion/pases-reservados.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(22% 40% 54% 40%)',
              opacity: s2Box,
              transform: `scale(${0.45 + 0.55 * s2Box})`,
            }}
          />

          {/* CAPA 4: Texto Inferior de Agradecimiento */}
          <img
            src="/invitacion/pases-reservados.png"
            alt="Nos encanta tenerte en nuestra boda"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(46% 14% 8% 14%)',
              opacity: s2Text,
              transform: `translate3d(0, ${(1 - s2Text) * 55}px, 0)`,
            }}
          />

          {/* CAPA FINAL UNIFICADA */}
          <img
            src="/invitacion/pases-reservados.png"
            alt="Tarjeta Pases Reservados"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
            style={{ opacity: s2Unified }}
          />

          {/* NÚMERO DINÁMICO DE PASES EXACTAMENTE EN EL CENTRO DEL CUADRO VERDE (X: 49.97%, Y: 33.8%) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none will-change-transform"
            style={{
              left: '49.97%',
              top: '33.8%',
              width: '11.31%',
              height: '17.21%',
              opacity: s2Box,
              transform: `translate(-50%, -50%) scale(${0.4 + 0.6 * s2Box})`,
            }}
          >
            <span
              className="font-sans font-semibold text-2xl sm:text-4xl md:text-[42px] leading-none tracking-tight"
              style={{ color: '#4C8B54' }}
            >
              {displaySeats}
            </span>
          </div>
        </div>

        {/* Si la invitación corresponde a una tarjeta con integrantes, mostramos sus nombres debajo */}
        {activeCard && activeCard.members && activeCard.members.length > 0 && (
          <div className="mt-5 max-w-[640px] mx-auto bg-white/90 rounded-2xl p-4 sm:p-5 border border-[#4C8B54]/25 shadow-sm text-center space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#4C8B54]">
              Personas contempladas en esta invitación ({activeCard.seats} {activeCard.seats === 1 ? 'pase' : 'pases'})
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {activeCard.members.map((m, idx) => (
                <span
                  key={m.id || idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F6F1] border border-[#4C8B54]/25 text-xs font-semibold text-[#243B2B]"
                >
                  <Heart size={11} className="text-[#4C8B54] fill-[#4C8B54]" />
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          STAGE 3: TARJETA DE REGALO / LLUVIA DE SOBRES (ENSAMBLAJE AL HACER SCROLL)
      ===================================================================== */}
      <section
        ref={stage3Ref}
        className="relative py-10 sm:py-16 px-3 sm:px-6 max-w-4xl mx-auto"
      >
        <div className="text-center mb-5 sm:mb-7 space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4C8B54]/12 text-[#3B6E42] text-[11px] font-bold uppercase tracking-widest">
            <Mail size={13} />
            Muestras de Cariño
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-[#2D332B] font-semibold">
            Detalle de Boda
          </h2>
        </div>

        {/* Lienzo de Ensamblaje de Tarjeta de Regalo (1875 x 3281) */}
        <div className="relative mx-auto w-full max-w-[440px] aspect-[1875/3281] rounded-3xl shadow-[0_25px_65px_-15px_rgba(31,58,46,0.2)] border border-[#7A8F76]/30 bg-[#F3F5F0] overflow-hidden select-none">
          
          {/* CAPA 0: Fondo acuarela suave */}
          <img
            src="/invitacion/tarjeta-regalo.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-lg scale-105 opacity-40"
          />

          {/* CAPA 1A: Flores y Hojas Izquierdas */}
          <img
            src="/invitacion/tarjeta-regalo.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(0% 50% 0% 0%)',
              opacity: s3Flowers,
              transform: `translate3d(${(1 - s3Flowers) * -85}px, 0, 0) scale(${0.9 + 0.1 * s3Flowers})`,
            }}
          />

          {/* CAPA 1B: Flores y Hojas Derechas */}
          <img
            src="/invitacion/tarjeta-regalo.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(0% 0% 0% 50%)',
              opacity: s3Flowers,
              transform: `translate3d(${(1 - s3Flowers) * 85}px, 0, 0) scale(${0.9 + 0.1 * s3Flowers})`,
            }}
          />

          {/* CAPA 2: Mensaje Central "Nuestro mejor regalo es tu presencia..." */}
          <img
            src="/invitacion/tarjeta-regalo.png"
            alt="Nuestro mejor regalo es tu presencia"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(35% 8% 37% 8%)',
              opacity: s3Quote,
              transform: `translate3d(0, ${(1 - s3Quote) * 55}px, 0) scale(${0.9 + 0.1 * s3Quote})`,
            }}
          />

          {/* CAPA 3: Ícono del Sobre (✉) que sube flotando al centro */}
          <img
            src="/invitacion/tarjeta-regalo.png"
            alt="Sobre"
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              clipPath: 'inset(62% 35% 27% 35%)',
              opacity: s3Envelope,
              transform: `translate3d(0, ${(1 - s3Envelope) * 65}px, 0) scale(${0.55 + 0.45 * s3Envelope})`,
            }}
          />

          {/* CAPA FINAL UNIFICADA */}
          <img
            src="/invitacion/tarjeta-regalo.png"
            alt="Tarjeta de Regalo"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
            style={{ opacity: s3Unified }}
          />
        </div>
      </section>

      {/* =====================================================================
          STAGE 4: CUENTA REGRESIVA, UBICACIÓN GPS & CONFIRMACIÓN DE ASISTENCIA
      ===================================================================== */}
      <section
        id="confirmar-asistencia"
        className="relative py-12 sm:py-16 px-4 sm:px-6 max-w-3xl mx-auto space-y-8"
      >
        {/* 1. Cuenta Regresiva y Ubicación */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_18px_50px_-15px_rgba(31,58,46,0.14)] border border-[#7A8F76]/25 text-center space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#4C8B54] font-bold">
              Cuenta Regresiva
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#243B2B] font-bold">
              Sábado 21 de Noviembre, 2026 • 4:30 P.M.
            </h3>
          </div>

          {/* Reloj en vivo */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md mx-auto">
            {[
              { label: 'Días', value: days },
              { label: 'Horas', value: hours },
              { label: 'Minutos', value: minutes },
              { label: 'Segundos', value: seconds },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#F3F6F1] border border-[#4C8B54]/20 rounded-2xl py-3 px-2 flex flex-col items-center justify-center"
              >
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#243B2B] tabular-nums">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mt-0.5">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Ubicación Calan Park + Botones de Mapa */}
          <div className="pt-4 border-t border-stone-200/70 space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-[#3B6E42] font-bold text-xs uppercase tracking-wider">
              <MapPin size={15} />
              <span>Lugar de la Celebración</span>
            </div>
            <p className="font-serif text-base sm:text-lg font-semibold text-stone-800 max-w-lg mx-auto">
              Calan Park, a 1.5 km del desvío a El Calán (Zona Zip Búfalo), Villanueva
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Calan+Park+El+Calan+Villanueva+Honduras"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2F4838] hover:bg-[#23372A] text-white text-xs font-semibold shadow-sm transition-all"
              >
                <MapPin size={14} className="text-[#C5A880]" />
                <span>Ver Ubicación en Google Maps</span>
                <ExternalLink size={12} />
              </a>
              <a
                href="https://waze.com/ul?q=Calan%20Park%20Villanueva"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F3F6F1] hover:bg-[#E5ECE1] text-[#243B2B] border border-[#4C8B54]/30 text-xs font-semibold transition-all"
              >
                <span>Abrir en Waze</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* 2. Tarjeta de Confirmación de Asistencia (RSVP Directo en Base de Datos + WhatsApp) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_55px_-15px_rgba(31,58,46,0.18)] border border-[#4C8B54]/30 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F3F6F1] border border-[#4C8B54]/25 text-[#3B6E42] flex items-center justify-center mx-auto">
              <UserCheck size={24} />
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#243B2B]">
              Confirmar Asistencia
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              Para nosotros es muy importante contar contigo. Puedes confirmar tu asistencia aquí mismo en 1 clic o enviarnos un mensaje por WhatsApp.
            </p>
          </div>

          {/* Si no hay tarjeta seleccionada en el link, permitir buscar apellido/nombre para confirmar en lista */}
          {!activeCard && (
            <div className="bg-[#F8FAF7] border border-stone-200/80 rounded-2xl p-4 space-y-3">
              <label className="block text-xs font-semibold text-stone-700 text-center">
                ¿Quieres confirmar directamente en nuestra lista oficial? Busca tu nombre o familia:
              </label>
              <div className="relative max-w-md mx-auto">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  placeholder="Escribe tu nombre o apellido (ej. Pastrana)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-[#4C8B54]"
                />
              </div>

              {matchingCards.length > 0 && (
                <div className="space-y-1.5 max-w-md mx-auto pt-1">
                  {matchingCards.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCardId(c.id);
                        setGuestSearch('');
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F3F6F1] border border-stone-200 hover:border-[#4C8B54]/40 text-left transition-all cursor-pointer"
                    >
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#243B2B]">{c.salutation}</p>
                        <p className="text-[11px] text-stone-500">
                          {c.seats} {c.seats === 1 ? 'Pase reservado' : 'Pases reservados'}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#4C8B54]">Seleccionar →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Si hay una tarjeta activa (por link personalizado o seleccionada en el buscador) */}
          {activeCard && (
            <div className="bg-[#F3F6F1] border border-[#4C8B54]/30 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#4C8B54]/15 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4C8B54]">
                    Invitación Seleccionada
                  </span>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-[#243B2B]">
                    {activeCard.salutation}
                  </h4>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#4C8B54]/30 text-xs font-bold text-[#3B6E42] self-start sm:self-auto">
                  <Ticket size={13} />
                  {activeCard.seats} {activeCard.seats === 1 ? 'Pase' : 'Pases'}
                </span>
              </div>

              {/* Lista de miembros de la tarjeta para confirmar individualmente o todos */}
              {activeCard.members && activeCard.members.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-stone-600">
                    Integrantes contemplados en tu pase:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeCard.members.map((m, i) => {
                      const isConfirmed = m.status === 'confirmed';
                      return (
                        <button
                          key={m.id || i}
                          type="button"
                          onClick={() => handleToggleMember(activeCard, m)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isConfirmed
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-white border-stone-200 text-stone-700 hover:border-[#4C8B54]/50'
                          }`}
                        >
                          <span className="truncate pr-2">{m.name}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                              isConfirmed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {isConfirmed ? '✓ Confirmado' : 'Confirmar'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botón principal de Confirmar Toda la Invitación en 1 clic */}
              <button
                type="button"
                onClick={() => handleDirectConfirmCard(activeCard)}
                className={`w-full py-3.5 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  activeCard.statusSummary?.isAllConfirmed || rsvpSubmitted
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#2F4838] hover:bg-[#23372A] text-white'
                }`}
              >
                <CheckCircle2 size={18} className="text-[#C5A880]" />
                <span>
                  {activeCard.statusSummary?.isAllConfirmed || rsvpSubmitted
                    ? `¡Asistencia Confirmada para ${activeCard.salutation}!`
                    : `Confirmar Asistencia de ${activeCard.salutation} (${activeCard.seats} ${activeCard.seats === 1 ? 'Pase' : 'Pases'})`}
                </span>
              </button>
            </div>
          )}

          {/* Botón Directo de WhatsApp (+504 8778-8207) */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleWhatsAppRsvp}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <MessageCircle size={18} />
              <span>Confirmar por WhatsApp (+504 8778-8207)</span>
            </button>
            <p className="text-center text-[11px] text-stone-400">
              Código de Vestimenta: <strong className="text-stone-600">FORMAL</strong> • Teléfono Oficial: <strong className="text-stone-600">+504 8778-8207</strong>
            </p>
          </div>
        </div>

        {/* Footer romántico */}
        <footer className="text-center pt-6 pb-12 space-y-2 text-stone-500">
          <p className="font-serif text-2xl text-[#2F4838] italic">
            ¡Te esperamos!
          </p>
          <p className="text-xs tracking-widest uppercase text-stone-400">
            Edis & Dania • 21 de Noviembre de 2026
          </p>
        </footer>
      </section>
    </div>
  );
}
