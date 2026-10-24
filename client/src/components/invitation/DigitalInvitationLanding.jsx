import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useWedding } from '../../context/WeddingContext';
import { useWeddingCountdown } from '../../hooks/useWeddingCountdown';
import { openWhatsApp } from '../../utils/whatsapp';
import { decodeInvitationToken } from '../../utils/invitationToken';
import {
  Heart,
  MapPin,
  CheckCircle2,
  MessageCircle,
  ChevronDown,
  Ticket,
  Mail,
  ExternalLink,
  UserCheck,
  ArrowLeft,
} from 'lucide-react';

// Curva suave estilo Canva para interpolar el ensamblaje con el scroll
function easeOutCubic(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

// Calcula progreso [0..1] para un sub-rango dentro del progreso de la sección [start..end]
function subProgress(progress, start, end) {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return easeOutCubic((progress - start) / (end - start));
}

// Reloj regresivo aislado (corre 100% en el navegador sin consultar la base de datos ni re-renderizar las tarjetas)
const LiveCountdownGrid = React.memo(function LiveCountdownGrid() {
  const { days, hours, minutes, seconds } = useWeddingCountdown();
  return (
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
  );
});

export function DigitalInvitationLanding({
  onBackToAdmin,
  isAdminUnlocked = false,
  onUnlockAdmin,
}) {
  const {
    invitationCards,
    setFamilyStatus,
    setGuestStatus,
  } = useWedding();

  // Decodificación segura del enlace (?k=TOKEN_FIRMADO o compatibilidad con enlaces previos ?card=...)
  const urlData = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const p = new URLSearchParams(window.location.search);
    const token = p.get('k');
    const verified = token ? decodeInvitationToken(token) : null;

    if (verified) {
      return {
        cardId: verified.cardId,
        salutation: verified.salutation,
        seats: verified.seats,
      };
    }

    // Compatibilidad con enlaces anteriores (?card=fam-51), pero los pases reales los dicta la BD
    const legacyCardId = p.get('card') || p.get('invitacion') || '';
    return {
      cardId:
        legacyCardId && legacyCardId !== 'true' && legacyCardId !== 'general'
          ? legacyCardId
          : '',
      salutation: '',
      seats: null,
    };
  }, []);

  const allCards = invitationCards?.all || [];

  // Tarjeta oficial desde la base de datos (inmune a manipulaciones en la URL)
  const activeCard = useMemo(() => {
    if (!urlData.cardId) return null;
    return allCards.find((c) => String(c.id) === String(urlData.cardId)) || null;
  }, [allCards, urlData.cardId]);

  // Prioriza siempre los datos reales de la base de datos o del token firmado (nunca parámetros editables)
  const displaySalutation =
    activeCard?.salutation ||
    urlData.salutation ||
    'Invitado Especial';

  const displaySeats =
    activeCard?.seats ||
    urlData.seats ||
    2;

  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(false);

  // Gesto secreto de 5 toques en el sello E & D para desbloquear el panel en dispositivos de Edis/Dania
  const secretTapCountRef = useRef(0);
  const secretTapTimerRef = useRef(null);

  const handleSecretMonogramTap = () => {
    secretTapCountRef.current += 1;
    if (secretTapTimerRef.current) clearTimeout(secretTapTimerRef.current);
    if (secretTapCountRef.current >= 5) {
      secretTapCountRef.current = 0;
      if (onUnlockAdmin) onUnlockAdmin();
      return;
    }
    secretTapTimerRef.current = setTimeout(() => {
      secretTapCountRef.current = 0;
    }, 1800);
  };

  const stage1Ref = useRef(null);
  const stage2Ref = useRef(null);
  const stage3Ref = useRef(null);

  const [scrollState, setScrollState] = useState({
    p1: 0.15,
    p2: 0,
    p3: 0,
  });

  useEffect(() => {
    let rafId = null;

    const updateScrollProgress = () => {
      const vh = window.innerHeight || 800;

      const calcSectionProgress = (el, startFactor = 0.95, travelFactor = 0.68) => {
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const startY = vh * startFactor;
        const travel = vh * travelFactor;
        const raw = (startY - rect.top) / travel;
        return Math.max(0, Math.min(1, raw));
      };

      setScrollState({
        p1: calcSectionProgress(stage1Ref.current, 0.94, 0.66),
        p2: calcSectionProgress(stage2Ref.current, 0.94, 0.62),
        p3: calcSectionProgress(stage3Ref.current, 0.94, 0.64),
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

  const handleDirectConfirmCard = async () => {
    const targetId = activeCard?.id || urlData.cardId;
    if (!targetId) return;
    try {
      if (String(targetId).startsWith('fam-')) {
        const famId = Number(String(targetId).replace('fam-', ''));
        await setFamilyStatus(famId, 'confirmed');
      } else if (String(targetId).startsWith('guest-')) {
        const gId = Number(String(targetId).replace('guest-', ''));
        await setGuestStatus(gId, 'confirmed');
      }
      setRsvpSubmitted(true);
      try {
        localStorage.setItem(`wedding_rsvp_done_${targetId}`, 'true');
      } catch {}
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

  const handleToggleMember = (card, member) => {
    if (!card || !member) return;
    const realGuestId = String(member.id).startsWith('p-') ? card.guestId : member.id;
    const nextStatus = member.status === 'confirmed' ? 'pending' : 'confirmed';
    setGuestStatus(realGuestId, nextStatus);
  };

  const handleWhatsAppRsvp = () => {
    const seatsText = `${displaySeats} ${displaySeats === 1 ? 'pase' : 'pases'}`;
    const namePart =
      displaySalutation && displaySalutation !== 'Invitado Especial'
        ? `Somos *${displaySalutation}* (${seatsText}) y confirmamos`
        : `Hola Edis y Dania, confirmo`;

    const msg = `¡Hola Edis y Dania! 💍✨ ${namePart} con mucha alegría nuestra asistencia a su boda el 21 de Noviembre en Calan Park. ¡Muchas gracias por la invitación!`;
    openWhatsApp('+50487788207', msg);
  };

  // =========================================================================
  // PROGRESOS DE ENSAMBLAJE POR CAPA REAL DE CANVA (STAGE 1: INVITACIÓN)
  // =========================================================================
  const p1 = scrollState.p1;
  const s1Watercolors = subProgress(p1, 0.0, 0.38);
  const s1TopLeaves = subProgress(p1, 0.08, 0.50);
  const s1TopRoses = subProgress(p1, 0.12, 0.54);
  const s1LeftRoses = subProgress(p1, 0.16, 0.58);
  const s1BotLeaves = subProgress(p1, 0.20, 0.62);
  const s1Names = subProgress(p1, 0.24, 0.66);
  const s1Subtitle = subProgress(p1, 0.34, 0.72);
  const s1Verse = subProgress(p1, 0.40, 0.77);
  const s1Date = subProgress(p1, 0.48, 0.84);
  const s1Venue = subProgress(p1, 0.56, 0.90);
  const s1Dress = subProgress(p1, 0.64, 0.94);
  const s1Sign = subProgress(p1, 0.72, 1.0);

  // =========================================================================
  // PROGRESOS DE ENSAMBLAJE POR CAPA REAL (STAGE 2: PASES RESERVADOS)
  // =========================================================================
  const p2 = scrollState.p2;
  const s2LeafTL = subProgress(p2, 0.04, 0.55);
  const s2LeafBR = subProgress(p2, 0.08, 0.58);
  const s2Header = subProgress(p2, 0.18, 0.68);
  const s2Box = subProgress(p2, 0.28, 0.80);
  const s2Body = subProgress(p2, 0.40, 0.94);

  // =========================================================================
  // PROGRESOS DE ENSAMBLAJE POR CAPA REAL (STAGE 3: TARJETA DE REGALO)
  // =========================================================================
  const p3 = scrollState.p3;
  const s3Watercolors = subProgress(p3, 0.0, 0.42);
  const s3Botanicals = subProgress(p3, 0.10, 0.62);
  const s3Quote = subProgress(p3, 0.26, 0.82);
  const s3Envelope = subProgress(p3, 0.42, 0.96);

  return (
    <div className="min-h-screen bg-[#EEF2EC] text-[#2F352E] font-sans overflow-x-hidden selection:bg-[#7A8F76]/25">
      {/* Barra flotante superior (El botón "Volver a la App" SOLO existe en los dispositivos desbloqueados de Edis/Dania) */}
      <div className="fixed top-3 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none flex items-center justify-between max-w-5xl mx-auto">
        {isAdminUnlocked ? (
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
            <span>Ir al Panel de Boda</span>
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
      <section className="relative min-h-[86vh] flex flex-col items-center justify-center px-4 pt-16 pb-8 overflow-hidden bg-gradient-to-b from-[#E3EBE0] via-[#EEF2EC] to-[#EEF2EC]">
        <img
          src="/invitacion/leaf-top-left.png"
          alt=""
          className="pointer-events-none select-none absolute -top-4 -left-6 w-44 sm:w-64 md:w-76 opacity-90 transition-transform duration-700"
          style={{
            transform: `translate3d(${isEnvelopeOpened ? '-12px' : '0px'}, 0, 0) rotate(-4deg)`,
          }}
        />
        <img
          src="/invitacion/leaf-bottom-right.png"
          alt=""
          className="pointer-events-none select-none absolute -bottom-4 -right-6 w-44 sm:w-64 md:w-76 opacity-90 transition-transform duration-700"
          style={{
            transform: `translate3d(${isEnvelopeOpened ? '12px' : '0px'}, 0, 0) rotate(4deg)`,
          }}
        />

        <div className="relative z-10 max-w-lg w-full text-center space-y-5 bg-white/85 backdrop-blur-md rounded-3xl p-7 sm:p-10 shadow-[0_20px_60px_-15px_rgba(47,72,56,0.15)] border border-[#7A8F76]/25">
          {/* Sello Monograma E & D (5 toques desbloquean el panel para Edis) */}
          <div
            onClick={handleSecretMonogramTap}
            className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-[#52795C] via-[#3A5A43] to-[#243B2B] p-[2px] shadow-lg flex items-center justify-center select-none"
          >
            <div className="w-full h-full rounded-full bg-[#FAF9F5] border border-[#C5A880]/60 flex flex-col items-center justify-center">
              <span className="font-serif text-xl font-bold text-[#243B2B] tracking-wider leading-none">
                E<span className="text-[#C5A880] italic font-serif text-base mx-0.5">&</span>D
              </span>
              <span className="text-[8px] uppercase tracking-[0.22em] text-stone-400 mt-1">
                21 • 11 • 26
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-[#4C8B54] font-semibold">
              Nuestra Boda
            </p>
            <img
              src="/invitacion/layers/text-edis-dania.png"
              alt="Edis y Dania"
              className="w-52 sm:w-60 mx-auto select-none pointer-events-none"
            />
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

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto italic font-serif">
            “Con la bendición de Dios, tenemos la alegría de invitarte a compartir con nosotros el inicio de nuestra vida juntos.”
          </p>

          <button
            type="button"
            onClick={handleStartJourney}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#2F4838] hover:bg-[#23372A] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          >
            <Heart size={15} className="text-[#C5A880] fill-[#C5A880]" />
            <span>Ver Nuestra Invitación</span>
            <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center gap-1 text-stone-400">
          <span className="text-[10px] uppercase tracking-[0.25em]">Desliza hacia abajo</span>
          <ChevronDown size={18} className="animate-bounce text-[#4C8B54]" />
        </div>
      </section>

      {/* =====================================================================
          STAGE 1: LA INVITACIÓN PRINCIPAL ARMADA PIEZA POR PIEZA CON LAS CAPAS REALES DE CANVA
      ===================================================================== */}
      <section
        ref={stage1Ref}
        className="relative py-6 sm:py-10 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col items-center"
      >
        <div
          className="relative w-full max-w-[500px] aspect-[5/7] rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(31,58,46,0.28)] border border-[#7A8F76]/35 overflow-hidden select-none bg-[#FAF9F6]"
          style={{ containerType: 'inline-size' }}
        >
          {/* 1. FONDO DE PAPEL ACUARELA */}
          <img
            src="/invitacion/layers/paper-bg.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* 2. MANCHAS DE ACUARELA VERDE SALVIA */}
          <img
            src="/invitacion/layers/watercolor-splash.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '-46.75%',
              top: '-2.06%',
              width: '94.17%',
              height: '65.31%',
              opacity: 0.51 * s1Watercolors,
              transform: `translate3d(${(1 - s1Watercolors) * -60}px, ${(1 - s1Watercolors) * -40}px, 0) scale(${0.7 + 0.3 * s1Watercolors})`,
            }}
          />

          <img
            src="/invitacion/layers/watercolor-splash.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '80.9%',
              top: '20.06%',
              width: '91.14%',
              height: '63.21%',
              opacity: 0.51 * s1Watercolors,
              transform: `translate3d(${(1 - s1Watercolors) * 60}px, 0, 0) scale(${0.7 + 0.3 * s1Watercolors})`,
            }}
          />

          <img
            src="/invitacion/layers/watercolor-splash.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '47.42%',
              top: '67.61%',
              width: '92.43%',
              height: '64.1%',
              opacity: 0.39 * s1Watercolors,
              transform: `translate3d(${(1 - s1Watercolors) * 50}px, ${(1 - s1Watercolors) * 50}px, 0) scale(${0.7 + 0.3 * s1Watercolors})`,
            }}
          />

          <img
            src="/invitacion/layers/watercolor-splash.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '33.58%',
              top: '-29.87%',
              width: '94.64%',
              height: '65.64%',
              opacity: 0.26 * s1Watercolors,
              transform: `translate3d(0, ${(1 - s1Watercolors) * -50}px, 0) rotate(59.89deg) scale(${0.75 + 0.25 * s1Watercolors})`,
            }}
          />

          <img
            src="/invitacion/layers/watercolor-splash.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '28.73%',
              top: '50.56%',
              width: '14.06%',
              height: '9.75%',
              opacity: 0.26 * s1Date,
              transform: `rotate(59.89deg) scale(${0.4 + 0.6 * s1Date})`,
            }}
          />

          <img
            src="/invitacion/layers/watercolor-splash.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '-10.75%',
              top: '67.01%',
              width: '35.15%',
              height: '24.37%',
              opacity: 0.26 * s1Watercolors,
              transform: `rotate(59.89deg) scale(${0.7 + 0.3 * s1Watercolors})`,
            }}
          />

          {/* 3. FLORES Y HOJAS BOTÁNICAS TRANSPARENTES */}
          <img
            src="/invitacion/layers/olive-branch.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '-19.35%',
              top: '3.91%',
              width: '39.38%',
              height: '39.13%',
              opacity: s1TopLeaves,
              transform: `translate3d(${(1 - s1TopLeaves) * -130}px, ${(1 - s1TopLeaves) * -80}px, 0) rotate(${(1 - s1TopLeaves) * -25}deg) scale(${0.75 + 0.25 * s1TopLeaves})`,
            }}
          />

          <img
            src="/invitacion/layers/roses-top-right.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '82.07%',
              top: '-1.06%',
              width: '38.91%',
              height: '49.08%',
              opacity: s1TopRoses,
              transform: `translate3d(${(1 - s1TopRoses) * 130}px, ${(1 - s1TopRoses) * -75}px, 0) rotate(${-23.9 + (1 - s1TopRoses) * 28}deg) scale(${0.75 + 0.25 * s1TopRoses})`,
            }}
          />

          <img
            src="/invitacion/layers/roses-left.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '-22.56%',
              top: '43.05%',
              width: '53.17%',
              height: '67.07%',
              opacity: s1LeftRoses,
              transform: `translate3d(${(1 - s1LeftRoses) * -150}px, ${(1 - s1LeftRoses) * 70}px, 0) rotate(${14.96 - (1 - s1LeftRoses) * 22}deg) scale(${0.75 + 0.25 * s1LeftRoses})`,
            }}
          />

          <img
            src="/invitacion/layers/olive-branch.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '66.66%',
              top: '68.76%',
              width: '39.38%',
              height: '39.13%',
              opacity: s1BotLeaves,
              transform: `translate3d(${(1 - s1BotLeaves) * 130}px, ${(1 - s1BotLeaves) * 90}px, 0) rotate(${(1 - s1BotLeaves) * 25}deg) scale(${0.75 + 0.25 * s1BotLeaves})`,
            }}
          />

          {/* 4. CALIGRAFÍA PRINCIPAL TRANSPARENTE "Edis y Dania" */}
          <img
            src="/invitacion/layers/text-edis-dania.png"
            alt="Edis y Dania"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '16.0%',
              top: '7.8%',
              width: '68.0%',
              height: '24.0%',
              opacity: s1Names,
              transform: `translate3d(0, ${(1 - s1Names) * -75}px, 0) scale(${0.72 + 0.28 * s1Names})`,
            }}
          />

          {/* 5. TEXTOS VECTORIALES EN FUENTE SIMONETTA */}
          <div
            className="absolute left-[10%] w-[80%] text-center pointer-events-none will-change-transform"
            style={{
              top: '36.2%',
              fontFamily: "'Simonetta', serif",
              color: '#3A3D36',
              fontSize: 'clamp(11px, 3.6cqw, 19px)',
              letterSpacing: '0.03em',
              opacity: s1Subtitle,
              transform: `translate3d(0, ${(1 - s1Subtitle) * 45}px, 0) scale(${0.88 + 0.12 * s1Subtitle})`,
            }}
          >
            TE INVITAMOS A NUESTRA BODA
          </div>

          <div
            className="absolute left-[14%] w-[72%] text-center pointer-events-none will-change-transform leading-[1.38]"
            style={{
              top: '43.1%',
              fontFamily: "'Simonetta', serif",
              color: '#3A3D36',
              fontSize: 'clamp(9.5px, 2.75cqw, 14.5px)',
              opacity: s1Verse,
              transform: `translate3d(0, ${(1 - s1Verse) * 55}px, 0)`,
            }}
          >
            <p>Así que ya no son dos, sino uno solo. Por tanto, lo</p>
            <p>que Dios ha unido, que no lo separe el hombre.</p>
            <p className="mt-[0.5cqw]">Mateo 19:6</p>
          </div>

          <div
            className="absolute text-center pointer-events-none will-change-transform"
            style={{
              left: '25.5%',
              top: '56.8%',
              width: '18%',
              fontFamily: "'Simonetta', serif",
              color: '#3A3D36',
              fontSize: 'clamp(11px, 3.6cqw, 19px)',
              opacity: s1Date,
              transform: `translate3d(${(1 - s1Date) * -120}px, 0, 0)`,
            }}
          >
            NOV
          </div>

          <div
            className="absolute text-center pointer-events-none will-change-transform leading-none"
            style={{
              left: '35.23%',
              top: '52.2%',
              width: '29.54%',
              fontFamily: "'Simonetta', serif",
              color: '#3A3D36',
              fontSize: 'clamp(34px, 11.4cqw, 58px)',
              opacity: s1Date,
              transform: `translate3d(0, ${(1 - s1Date) * 35}px, 0) scale(${0.4 + 0.6 * s1Date})`,
            }}
          >
            21
          </div>

          <div
            className="absolute text-center pointer-events-none will-change-transform"
            style={{
              left: '56.5%',
              top: '56.8%',
              width: '24%',
              fontFamily: "'Simonetta', serif",
              color: '#3A3D36',
              fontSize: 'clamp(11px, 3.6cqw, 19px)',
              opacity: s1Date,
              transform: `translate3d(${(1 - s1Date) * 120}px, 0, 0)`,
            }}
          >
            4:30 P.M.
          </div>

          <div
            className="absolute left-[14%] w-[72%] text-center pointer-events-none will-change-transform leading-[1.35]"
            style={{
              top: '65.6%',
              fontFamily: "'Simonetta', serif",
              color: '#3A3D36',
              fontSize: 'clamp(9.5px, 2.85cqw, 15px)',
              opacity: s1Venue,
              transform: `translate3d(0, ${(1 - s1Venue) * 60}px, 0)`,
            }}
          >
            <p>CALAN PARK, A 1.5 KM DEL DESVÍO A EL</p>
            <p>CALÁN (ZONA ZIP BÚFALO), VILLANUEVA</p>
          </div>

          <div
            className="absolute left-[20%] w-[60%] text-center pointer-events-none will-change-transform leading-[1.35]"
            style={{
              top: '73.7%',
              fontFamily: "'Simonetta', serif",
              color: '#3A3D36',
              fontSize: 'clamp(8.5px, 2.25cqw, 12px)',
              opacity: s1Venue,
              transform: `translate3d(0, ${(1 - s1Venue) * 65}px, 0)`,
            }}
          >
            <p>CONFIRMAR ASISTENCIA:</p>
            <p>+504 8778-8207</p>
          </div>

          <div
            className="absolute left-[20%] w-[60%] text-center pointer-events-none will-change-transform leading-[1.35]"
            style={{
              top: '80.4%',
              fontFamily: "'Simonetta', serif",
              color: '#3A3D36',
              fontSize: 'clamp(9.5px, 2.75cqw, 14.5px)',
              opacity: s1Dress,
              transform: `translate3d(0, ${(1 - s1Dress) * 65}px, 0)`,
            }}
          >
            <p>CODIGO VESTIMENTA:</p>
            <p>FORMAL</p>
          </div>

          {/* 6. FIRMA CALIGRÁFICA TRANSPARENTE "Te esperamos" */}
          <img
            src="/invitacion/layers/text-te-esperamos.png"
            alt="Te esperamos"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '22.0%',
              top: '87.0%',
              width: '56.0%',
              height: '10.0%',
              opacity: s1Sign,
              transform: `translate3d(0, ${(1 - s1Sign) * 55}px, 0) scale(${0.78 + 0.22 * s1Sign})`,
            }}
          />
        </div>
      </section>

      {/* =====================================================================
          STAGE 2: TARJETA DE PASES RESERVADOS ARMADA POR CAPAS + CONTEO DINÁMICO
      ===================================================================== */}
      <section
        ref={stage2Ref}
        className="relative py-6 sm:py-10 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col items-center"
      >
        <div className="text-center mb-4 space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 border border-[#4C8B54]/25 text-[#3B6E42] text-[11px] font-bold uppercase tracking-widest shadow-2xs">
            <Ticket size={13} />
            Tus Pases Reservados
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-[#2D332B] font-semibold">
            {displaySalutation}
          </h2>
        </div>

        <div
          className="relative w-full max-w-[620px] aspect-[1600/889] rounded-2xl sm:rounded-3xl shadow-[0_22px_55px_-12px_rgba(31,58,46,0.18)] border border-[#4C8B54]/25 bg-white overflow-hidden select-none"
          style={{ containerType: 'inline-size' }}
        >
          <img
            src="/invitacion/leaf-top-left.png"
            alt=""
            aria-hidden="true"
            className="absolute top-0 left-0 w-[28.1%] h-[46.1%] object-contain object-top-left pointer-events-none will-change-transform"
            style={{
              opacity: s2LeafTL,
              transform: `translate3d(${(1 - s2LeafTL) * -110}px, ${(1 - s2LeafTL) * -80}px, 0) rotate(${(1 - s2LeafTL) * -20}deg) scale(${0.75 + 0.25 * s2LeafTL})`,
            }}
          />

          <img
            src="/invitacion/leaf-bottom-right.png"
            alt=""
            aria-hidden="true"
            className="absolute bottom-0 right-0 w-[28.1%] h-[46.1%] object-contain object-bottom-right pointer-events-none will-change-transform"
            style={{
              opacity: s2LeafBR,
              transform: `translate3d(${(1 - s2LeafBR) * 110}px, ${(1 - s2LeafBR) * 80}px, 0) rotate(${(1 - s2LeafBR) * 20}deg) scale(${0.75 + 0.25 * s2LeafBR})`,
            }}
          />

          <div
            className="absolute left-[12%] w-[76%] text-center pointer-events-none will-change-transform font-sans font-normal tracking-[0.22em]"
            style={{
              top: '12.2%',
              color: '#4C8B54',
              fontSize: 'clamp(13px, 4.4cqw, 28px)',
              opacity: s2Header,
              transform: `translate3d(0, ${(1 - s2Header) * -50}px, 0)`,
            }}
          >
            PASES RESERVADOS
          </div>

          <div
            className="absolute flex items-center justify-center pointer-events-none will-change-transform border-[2.5px] sm:border-[3px] border-[#4C8B54] bg-white/90"
            style={{
              left: '44.3%',
              top: '24.8%',
              width: '11.4%',
              height: '17.2%',
              opacity: s2Box,
              transform: `scale(${0.35 + 0.65 * s2Box})`,
            }}
          >
            <span
              className="font-sans font-semibold leading-none"
              style={{
                color: '#4C8B54',
                fontSize: 'clamp(20px, 6.2cqw, 40px)',
              }}
            >
              {displaySeats}
            </span>
          </div>

          <div
            className="absolute left-[14%] w-[72%] text-center pointer-events-none will-change-transform font-sans font-normal leading-[1.52]"
            style={{
              top: '48.5%',
              color: '#4C8B54',
              fontSize: 'clamp(11px, 3.55cqw, 22px)',
              opacity: s2Body,
              transform: `translate3d(0, ${(1 - s2Body) * 60}px, 0)`,
            }}
          >
            <p>Nos encanta tenerte en nuestra boda.</p>
            <p>Para que todos disfrutemos de este día,</p>
            <p>te agradecemos respetar la cantidad</p>
            <p>de invitados indicada en este pase.</p>
          </div>
        </div>

        {/* Listado de integrantes contemplados */}
        {activeCard && activeCard.members && activeCard.members.length > 0 && (
          <div className="mt-4 w-full max-w-[620px] bg-white/90 rounded-2xl p-4 border border-[#4C8B54]/25 shadow-sm text-center space-y-2">
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
          STAGE 3: TARJETA DE REGALO / SOBRE ARMADA POR CAPAS TRANSPARENTES
      ===================================================================== */}
      <section
        ref={stage3Ref}
        className="relative py-6 sm:py-10 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col items-center"
      >
        <div className="text-center mb-4 space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 border border-[#4C8B54]/25 text-[#3B6E42] text-[11px] font-bold uppercase tracking-widest shadow-2xs">
            <Mail size={13} />
            Muestras de Cariño
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-[#2D332B] font-semibold">
            Detalle de Boda
          </h2>
        </div>

        <div
          className="relative w-full max-w-[420px] aspect-[1875/3281] rounded-2xl sm:rounded-3xl shadow-[0_25px_65px_-15px_rgba(31,58,46,0.22)] border border-[#7A8F76]/30 bg-white overflow-hidden select-none"
          style={{ containerType: 'inline-size' }}
        >
          <img
            src="/invitacion/layers/watercolor-splash.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '-46%',
              top: '5%',
              width: '94%',
              height: '55%',
              opacity: 0.45 * s3Watercolors,
              transform: `translate3d(${(1 - s3Watercolors) * -55}px, 0, 0) scale(${0.7 + 0.3 * s3Watercolors})`,
            }}
          />
          <img
            src="/invitacion/layers/watercolor-splash.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '42%',
              top: '-8%',
              width: '92%',
              height: '50%',
              opacity: 0.32 * s3Watercolors,
              transform: `translate3d(${(1 - s3Watercolors) * 55}px, 0, 0) scale(${0.7 + 0.3 * s3Watercolors})`,
            }}
          />
          <img
            src="/invitacion/layers/watercolor-splash.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '48%',
              top: '65%',
              width: '90%',
              height: '50%',
              opacity: 0.38 * s3Watercolors,
              transform: `translate3d(${(1 - s3Watercolors) * 55}px, ${(1 - s3Watercolors) * 45}px, 0) scale(${0.7 + 0.3 * s3Watercolors})`,
            }}
          />

          <img
            src="/invitacion/layers/olive-branch.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '-19%',
              top: '8%',
              width: '40%',
              height: '32%',
              opacity: s3Botanicals,
              transform: `translate3d(${(1 - s3Botanicals) * -120}px, ${(1 - s3Botanicals) * -60}px, 0) rotate(${(1 - s3Botanicals) * -22}deg)`,
            }}
          />
          <img
            src="/invitacion/layers/roses-top-right.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '76%',
              top: '6%',
              width: '40%',
              height: '38%',
              opacity: s3Botanicals,
              transform: `translate3d(${(1 - s3Botanicals) * 120}px, ${(1 - s3Botanicals) * -60}px, 0) rotate(${-23.9 + (1 - s3Botanicals) * 24}deg)`,
            }}
          />
          <img
            src="/invitacion/layers/roses-left.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '-22%',
              top: '41%',
              width: '54%',
              height: '54%',
              opacity: s3Botanicals,
              transform: `translate3d(${(1 - s3Botanicals) * -130}px, ${(1 - s3Botanicals) * 55}px, 0) rotate(${14.96 - (1 - s3Botanicals) * 20}deg)`,
            }}
          />
          <img
            src="/invitacion/layers/olive-branch.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '68%',
              top: '67%',
              width: '38%',
              height: '30%',
              opacity: s3Botanicals,
              transform: `translate3d(${(1 - s3Botanicals) * 120}px, ${(1 - s3Botanicals) * 70}px, 0) rotate(${(1 - s3Botanicals) * 22}deg)`,
            }}
          />

          <img
            src="/invitacion/layers/text-regalo-quote.png"
            alt="Nuestro mejor regalo es tu presencia, pero si tu deseo es tener un detalle con nosotros puedes hacerlo dentro de un sobre"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '10%',
              top: '37.5%',
              width: '80%',
              height: '24.5%',
              opacity: s3Quote,
              transform: `translate3d(0, ${(1 - s3Quote) * 65}px, 0) scale(${0.86 + 0.14 * s3Quote})`,
            }}
          />

          <img
            src="/invitacion/layers/icon-regalo-envelope.png"
            alt="Sobre de regalo"
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: '40%',
              top: '62.5%',
              width: '20%',
              height: '8.5%',
              opacity: s3Envelope,
              transform: `translate3d(0, ${(1 - s3Envelope) * 75}px, 0) scale(${0.45 + 0.55 * s3Envelope})`,
            }}
          />
        </div>
      </section>

      {/* =====================================================================
          STAGE 4: CUENTA REGRESIVA, UBICACIÓN GPS & CONFIRMACIÓN DE ASISTENCIA
      ===================================================================== */}
      <section
        id="confirmar-asistencia"
        className="relative py-8 sm:py-12 px-4 sm:px-6 max-w-3xl mx-auto space-y-6"
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

          <LiveCountdownGrid />

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

        {/* 2. Tarjeta de Confirmación de Asistencia (Solo muestra la tarjeta asignada al invitado, sin buscador público) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_55px_-15px_rgba(31,58,46,0.18)] border border-[#4C8B54]/30 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F3F6F1] border border-[#4C8B54]/25 text-[#3B6E42] flex items-center justify-center mx-auto">
              <UserCheck size={24} />
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#243B2B]">
              Confirmar Asistencia
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              Para nosotros es muy importante contar contigo. Confirma tu asistencia aquí mismo en 1 clic o envíanos un mensaje por WhatsApp.
            </p>
          </div>

          {(activeCard || urlData.cardId) && (
            <div className="bg-[#F3F6F1] border border-[#4C8B54]/30 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#4C8B54]/15 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4C8B54]">
                    Tu Invitación
                  </span>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-[#243B2B]">
                    {displaySalutation}
                  </h4>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#4C8B54]/30 text-xs font-bold text-[#3B6E42] self-start sm:self-auto">
                  <Ticket size={13} />
                  {displaySeats} {displaySeats === 1 ? 'Pase' : 'Pases'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleDirectConfirmCard}
                className={`w-full py-3.5 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  activeCard?.statusSummary?.isAllConfirmed || rsvpSubmitted
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#2F4838] hover:bg-[#23372A] text-white'
                }`}
              >
                <CheckCircle2 size={18} className="text-[#C5A880]" />
                <span>
                  {activeCard?.statusSummary?.isAllConfirmed || rsvpSubmitted
                    ? `¡Asistencia Confirmada para ${displaySalutation}!`
                    : `Confirmar Asistencia de ${displaySalutation} (${displaySeats} ${displaySeats === 1 ? 'Pase' : 'Pases'})`}
                </span>
              </button>
            </div>
          )}

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

        <footer className="text-center pt-4 pb-10 space-y-2 text-stone-500">
          <img
            src="/invitacion/layers/text-te-esperamos.png"
            alt="Te esperamos"
            className="w-40 mx-auto opacity-85 select-none pointer-events-none"
          />
          <p className="text-xs tracking-widest uppercase text-stone-400">
            Edis & Dania • 21 de Noviembre de 2026
          </p>
        </footer>
      </section>
    </div>
  );
}
