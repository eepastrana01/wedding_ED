import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  ChevronUp,
  Ticket,
  Mail,
  ExternalLink,
  UserCheck,
  ArrowLeft,
  Volume2,
  VolumeX,
  Music,
} from 'lucide-react';

// Curva suave para transiciones secundarias
function easeOutCubic(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

// Interpolación lineal acotada [0..1] para seguimiento físico 1:1 con el dedo/scroll
function linearProgress(progress, start, end) {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return (progress - start) / (end - start);
}

// Calcula progreso [0..1] suavizado para un sub-rango [start..end]
function subProgress(progress, start, end) {
  return easeOutCubic(linearProgress(progress, start, end));
}

// Partículas doradas y hojas botánicas mecidas por la brisa (100% GPU CSS, 0 costo de red/BD)
const GOLD_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 19 + 7) % 96}%`,
  top: `${(i * 29 + 11) % 94}%`,
  size: i % 3 === 0 ? 5 : i % 2 === 0 ? 3.5 : 2.5,
  delay: `${(i * 0.45).toFixed(2)}s`,
  duration: `${(6.2 + (i % 5) * 1.3).toFixed(1)}s`,
  isGold: i % 4 !== 0,
}));

const BREEZE_PETALS = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  left: `${8 + ((i * 14) % 84)}%`,
  delay: `${(i * 2.1).toFixed(1)}s`,
  duration: `${(13 + (i % 4) * 2.5).toFixed(1)}s`,
  size: i % 2 === 0 ? 15 : 12,
  isGold: i % 3 === 0,
}));

const FloatingBreezeAtmosphere = React.memo(function FloatingBreezeAtmosphere() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-20 overflow-hidden select-none"
      aria-hidden="true"
    >
      {GOLD_PARTICLES.map((pt) => (
        <span
          key={`pt-${pt.id}`}
          className="absolute rounded-full"
          style={{
            left: pt.left,
            top: pt.top,
            width: `${pt.size}px`,
            height: `${pt.size}px`,
            background: pt.isGold
              ? 'radial-gradient(circle, #E7CFA8 0%, #C5A880 70%, transparent 100%)'
              : 'radial-gradient(circle, #8FAF89 0%, #5F8559 75%, transparent 100%)',
            boxShadow: pt.isGold ? '0 0 8px rgba(197, 168, 128, 0.65)' : 'none',
            animation: `particleDrift ${pt.duration} ease-in-out ${pt.delay} infinite`,
          }}
        />
      ))}

      {BREEZE_PETALS.map((leaf) => (
        <svg
          key={`leaf-${leaf.id}`}
          viewBox="0 0 24 24"
          className="absolute top-0"
          style={{
            left: leaf.left,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            animation: `breezeLeafDrift ${leaf.duration} linear ${leaf.delay} infinite`,
          }}
        >
          <path
            d="M19 4C11 4 5 10 5 18C13 18 19 12 19 4Z"
            fill={leaf.isGold ? '#D6BC94' : '#7E9E78'}
            fillOpacity={leaf.isGold ? '0.52' : '0.42'}
          />
        </svg>
      ))}
    </div>
  );
});

// Marco editorial dorado interno con esquinas Art-Déco finas
const EditorialInnerFrame = React.memo(function EditorialInnerFrame({
  insetClass = 'inset-2.5 sm:inset-3.5',
}) {
  return (
    <div
      className={`absolute ${insetClass} pointer-events-none z-20 rounded-xl sm:rounded-2xl border border-[#C5A880]/45`}
      aria-hidden="true"
    >
      <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#C5A880]" />
      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#C5A880]" />
      <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#C5A880]" />
      <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#C5A880]" />
    </div>
  );
});

// Divisor ornamental dorado que se expande al hacer scroll
function GoldenBotanicalDivider({ progress = 1 }) {
  const scale = 0.25 + 0.75 * easeOutCubic(progress);
  return (
    <div
      className="flex items-center justify-center gap-3 py-2 max-w-xs mx-auto select-none pointer-events-none"
      style={{ opacity: Math.max(0.25, progress) }}
      aria-hidden="true"
    >
      <div
        className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C5A880] to-[#C5A880] origin-right"
        style={{ transform: `scaleX(${scale})` }}
      />
      <div
        className="w-2.5 h-2.5 rotate-45 border border-[#C5A880] bg-[#FAF8F4] shadow-sm"
        style={{ transform: `rotate(45deg) scale(${0.6 + 0.4 * progress})` }}
      />
      <div
        className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#C5A880] to-[#C5A880] origin-left"
        style={{ transform: `scaleX(${scale})` }}
      />
    </div>
  );
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
          className="relative bg-gradient-to-b from-[#FAF9F5] to-[#F1F5EE] border border-[#C5A880]/45 rounded-2xl py-3.5 px-2 flex flex-col items-center justify-center shadow-sm overflow-hidden"
        >
          <span className="font-serif text-2xl sm:text-3xl font-bold text-[#243B2B] tabular-nums">
            {String(item.value).padStart(2, '0')}
          </span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-[#7A6B53] font-bold mt-1">
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

  const activeCard = useMemo(() => {
    if (!urlData.cardId) return null;
    return allCards.find((c) => String(c.id) === String(urlData.cardId)) || null;
  }, [allCards, urlData.cardId]);

  const displaySalutation =
    activeCard?.salutation ||
    urlData.salutation ||
    'Invitado Especial';

  const displaySeats =
    activeCard?.seats ||
    urlData.seats ||
    2;

  const [rsvpSubmitted, setRsvpSubmitted] = useState(() => {
    if (typeof window === 'undefined') return false;
    const id = urlData.cardId;
    if (!id) return false;
    try {
      return localStorage.getItem(`wedding_rsvp_done_${id}`) === 'true';
    } catch {
      return false;
    }
  });

  // =========================================================================
  // ESTADO DEL SOBRE INTERACTIVO + EXTRACCIÓN FÍSICA POR SCROLL
  // =========================================================================
  const [isSealBroken, setIsSealBroken] = useState(false);
  const [flapBehind, setFlapBehind] = useState(false);
  const [isPeekReady, setIsPeekReady] = useState(false);
  const sealTimersRef = useRef([]);

  // Audio romántico de fondo (Canon in D - Cuerdas & Arpa) servido estáticamente
  const audioRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const userMutedRef = useRef(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const clearAudioFade = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  const startMusicWithFadeIn = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    clearAudioFade();
    userMutedRef.current = false;
    audio.volume = 0.04;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsMusicPlaying(true);
          let vol = 0.04;
          fadeIntervalRef.current = setInterval(() => {
            vol = Math.min(0.55, vol + 0.03);
            if (audioRef.current) {
              audioRef.current.volume = vol;
            }
            if (vol >= 0.55) {
              clearAudioFade();
            }
          }, 90);
        })
        .catch(() => {
          setIsMusicPlaying(false);
        });
    }
  }, []);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    clearAudioFade();
    if (audio.paused) {
      startMusicWithFadeIn();
    } else {
      userMutedRef.current = true;
      audio.pause();
      setIsMusicPlaying(false);
    }
  }, [startMusicWithFadeIn]);

  // Pausar suavemente si el invitado sale a WhatsApp/Google Maps y reanudar al volver
  useEffect(() => {
    const handleVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        if (!audio.paused) {
          audio.pause();
          setIsMusicPlaying(false);
        }
      } else if (!userMutedRef.current && isSealBroken) {
        audio
          .play()
          .then(() => setIsMusicPlaying(true))
          .catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearAudioFade();
    };
  }, [isSealBroken]);

  // Asegurar que la invitación siempre inicie arriba frente al sobre cerrado
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
    }
    return () => {
      sealTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Bloquear scroll únicamente antes de tocar el sello del sobre
  useEffect(() => {
    if (!isSealBroken) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSealBroken]);

  // Al dar clic en el sobre: se abre la solapa 3D, inicia la música y la tarjeta asoma lista para que el usuario la estire/saque con scroll
  const handleBreakSeal = useCallback(() => {
    if (isSealBroken) return;

    startMusicWithFadeIn();
    setIsSealBroken(true);

    confetti({
      particleCount: 38,
      spread: 58,
      origin: { y: 0.56 },
      colors: ['#C5A880', '#EAD3AA', '#4C8B54', '#FAF8F5'],
    });

    sealTimersRef.current.forEach((t) => clearTimeout(t));
    // Justo cuando la solapa pasa de 90°, pasa detrás de la tarjeta y ésta asoma ligeramente del bolsillo
    const t1 = setTimeout(() => {
      setFlapBehind(true);
      setIsPeekReady(true);
    }, 340);

    sealTimersRef.current = [t1];
  }, [isSealBroken, startMusicWithFadeIn]);

  const handleResetEnvelope = useCallback(() => {
    sealTimersRef.current.forEach((t) => clearTimeout(t));
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIsPeekReady(false);
    setFlapBehind(false);
    setIsSealBroken(false);
    setScrollState((prev) => ({ ...prev, pull: 0 }));
  }, []);

  // Gesto secreto de 5 toques en el sello E & D superior para desbloquear el panel en dispositivos de Edis/Dania
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

  const heroPullSectionRef = useRef(null);
  const stage2Ref = useRef(null);
  const stage3Ref = useRef(null);
  const stage4Ref = useRef(null);

  const [scrollState, setScrollState] = useState({
    pull: 0,
    p2: 0,
    p3: 0,
    p4: 0,
  });

  useEffect(() => {
    let rafId = null;

    const updateScrollProgress = () => {
      const vh = window.innerHeight || 800;

      // Progreso [0..1] de extracción física de la tarjeta fuera del sobre (primeros 132vh de scroll)
      let pullProg = 0;
      if (heroPullSectionRef.current) {
        const heroRect = heroPullSectionRef.current.getBoundingClientRect();
        const scrolledInHero = Math.max(0, -heroRect.top);
        const pullDistance = vh * 1.32;
        pullProg = Math.max(0, Math.min(1, scrolledInHero / pullDistance));
      }

      const calcSectionProgress = (el, startFactor = 0.95, travelFactor = 0.65) => {
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const startY = vh * startFactor;
        const travel = vh * travelFactor;
        const raw = (startY - rect.top) / travel;
        return Math.max(0, Math.min(1, raw));
      };

      setScrollState({
        pull: pullProg,
        p2: calcSectionProgress(stage2Ref.current, 0.95, 0.62),
        p3: calcSectionProgress(stage3Ref.current, 0.95, 0.64),
        p4: calcSectionProgress(stage4Ref.current, 0.96, 0.55),
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
        particleCount: 110,
        spread: 85,
        origin: { y: 0.65 },
        colors: ['#4C8B54', '#C5A880', '#1F3A2E', '#FAF8F5'],
      });
    } catch (err) {
      console.error(err);
    }
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
  // MATEMÁTICA FÍSICA DE EXTRACCIÓN DE LA TARJETA DESDE EL SOBRE (pull: 0..1)
  // =========================================================================
  const pull = isSealBroken ? scrollState.pull : 0;

  // Fase 1 (pull 0.00 -> 0.68): El invitado estira/saca la tarjeta hacia arriba mientras el sobre baja
  const tPull = linearProgress(pull, 0.0, 0.68);
  // Fase 2 (pull 0.65 -> 1.00): La tarjeta ya salió completa de la boca del sobre y crece al 100%
  const tSettle = subProgress(pull, 0.65, 1.0);

  // Coordenadas del Sobre (en % de la altura de la tarjeta A6):
  // Cerrado: centrado en top 26%. Al abrir solapa: baja suavemente a 30%. Al hacer scroll: baja hasta 112% y desaparece.
  const envTopPct = !isSealBroken
    ? 26
    : 30 + 82 * tPull + 14 * tSettle;
  const envOpacity = 1 - subProgress(pull, 0.66, 0.94);

  // Coordenadas de la Tarjeta A6 (en % de su propia altura):
  // Cerrado: guardada en +23% (100% dentro del sobre).
  // Al romper el sello (peek): asoma a +12% mostrando "Edis y Dania" fuera del bolsillo.
  // Al hacer scroll: sube hasta -5% (saliendo por completo del bolsillo) y luego se centra en 0% a escala 1.0.
  const cardTranslateYPct = !isPeekReady
    ? 23
    : pull <= 0.68
      ? 12 - 17 * tPull
      : -5 + 5 * tSettle;

  const cardScale = !isPeekReady
    ? 0.82
    : pull <= 0.68
      ? 0.84 + 0.03 * tPull
      : 0.87 + 0.13 * tSettle;

  // Recorte inferior invisible detrás del bolsillo verde mientras la tarjeta aún está guardada (evita que asome por debajo del sobre)
  const clipBottomPct = !isPeekReady
    ? 44
    : Math.max(0, 32 * (1 - linearProgress(tPull, 0.0, 0.42)));

  const isActivelyScrollingPull = pull > 0.008;

  // Aparición progresiva de los textos internos conforme cada parte de la tarjeta sale del bolsillo verde
  const s1Subtitle = isPeekReady ? Math.max(0.25, subProgress(pull, 0.02, 0.34)) : 0;
  const s1Verse = isPeekReady ? Math.max(0.15, subProgress(pull, 0.08, 0.42)) : 0;
  const s1Date = isPeekReady ? subProgress(pull, 0.16, 0.52) : 0;
  const s1Venue = isPeekReady ? subProgress(pull, 0.26, 0.62) : 0;
  const s1Dress = isPeekReady ? subProgress(pull, 0.34, 0.70) : 0;
  const s1Sign = isPeekReady ? subProgress(pull, 0.42, 0.78) : 0;

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

  // =========================================================================
  // PROGRESOS STAGE 4 (CONTADOR & RSVP)
  // =========================================================================
  const p4 = scrollState.p4;
  const s4Card1 = subProgress(p4, 0.0, 0.65);
  const s4Card2 = subProgress(p4, 0.22, 0.95);

  return (
    <div
      className="relative min-h-screen bg-[#F2F5EF] text-[#2F352E] font-sans selection:bg-[#7A8F76]/25"
      style={{ overflowX: 'clip' }}
    >
      {/* Reproductor de audio estático (0 consultas a Neon DB) */}
      <audio
        ref={audioRef}
        src="/invitacion/musica-boda.mp3"
        loop
        preload="auto"
      />

      {/* Textura editorial sutil de papel acuarela fija en el fondo + iluminación cálida dorada */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-45"
        style={{
          backgroundImage: 'url(/invitacion/layers/paper-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 15% 20%, rgba(197, 168, 128, 0.12) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgba(76, 139, 84, 0.10) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />

      {/* Brisa de partículas doradas y hojitas de olivo flotantes */}
      <FloatingBreezeAtmosphere />

      {/* Botón flotante de Música (esquina inferior derecha) */}
      {isSealBroken && (
        <button
          type="button"
          onClick={toggleMusic}
          aria-label={isMusicPlaying ? 'Pausar música de fondo' : 'Reproducir música de fondo'}
          className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white/95 backdrop-blur-md text-[#243B2B] shadow-[0_10px_28px_-4px_rgba(31,58,46,0.28)] border border-[#C5A880]/75 hover:scale-105 transition-all cursor-pointer"
        >
          {isMusicPlaying ? (
            <>
              <span className="flex items-end gap-[2.5px] h-3.5 px-0.5" aria-hidden="true">
                <span className="w-[2.5px] h-full rounded-full bg-[#B38E5D] animate-eq-1" />
                <span className="w-[2.5px] h-full rounded-full bg-[#4C8B54] animate-eq-2" />
                <span className="w-[2.5px] h-full rounded-full bg-[#B38E5D] animate-eq-3" />
                <span className="w-[2.5px] h-full rounded-full bg-[#4C8B54] animate-eq-4" />
              </span>
              <span className="text-[11px] font-bold tracking-wide text-[#243B2B]">
                Música
              </span>
            </>
          ) : (
            <>
              <VolumeX size={15} className="text-stone-400" />
              <span className="text-[11px] font-semibold text-stone-500">
                Música
              </span>
            </>
          )}
        </button>
      )}

      {/* Barra flotante superior */}
      <div className="fixed top-3 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2 pointer-events-auto">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md text-stone-700 hover:text-wedding-primaryDark text-xs font-semibold shadow-md border border-[#C5A880]/50 transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Ir al Panel</span>
            </button>
          ) : (
            <div
              onClick={handleSecretMonogramTap}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-[#C5A880]/45 select-none"
            >
              <span className="font-serif font-bold text-xs text-[#2F4838]">E & D</span>
              <span className="text-[11px] text-[#8C7756] font-medium">• 21 Nov 2026</span>
            </div>
          )}

          {isSealBroken && pull > 0.25 && (
            <button
              type="button"
              onClick={handleResetEnvelope}
              title="Guardar en el sobre"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#6E624E] hover:text-[#243B2B] text-[11px] font-semibold shadow-sm border border-[#C5A880]/45 transition-all cursor-pointer"
            >
              <Mail size={13} className="text-[#B38E5D]" />
              <span className="hidden sm:inline">Sobre</span>
            </button>
          )}
        </div>

        {isSealBroken && (
          <a
            href="#confirmar-asistencia"
            className="pointer-events-auto relative overflow-hidden inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#243B2B] via-[#2F4838] to-[#243B2B] hover:brightness-110 text-white text-xs font-semibold shadow-md border border-[#C5A880]/45 transition-all"
          >
            <CheckCircle2 size={14} className="text-[#E0C59B]" />
            <span>Confirmar Asistencia</span>
          </a>
        )}
      </div>

      {/* =====================================================================
          EXPERIENCIA INTERACTIVA PRINCIPAL:
          SOBRE 3D VERDE SALVIA + EXTRACCIÓN REAL DE LA TARJETA A6 CON SCROLL
      ===================================================================== */}
      <section
        ref={heroPullSectionRef}
        className={`relative z-10 w-full ${
          isSealBroken ? 'h-[255vh]' : 'h-[100dvh] overflow-hidden'
        }`}
      >
        <div className="sticky top-0 h-[100dvh] w-full flex flex-col items-center justify-center px-3 pt-11 pb-4 overflow-hidden">
          {/* Ramas de eucalipto en las esquinas de la pantalla mecidas por la brisa */}
          <div
            className="pointer-events-none select-none absolute -top-4 -left-6 w-44 sm:w-60 md:w-72 transition-opacity duration-500"
            style={{ opacity: Math.max(0.35, 0.92 - pull * 0.45) }}
          >
            <img
              src="/invitacion/leaf-top-left.png"
              alt=""
              className="w-full h-auto animate-breeze-a"
            />
          </div>

          <div
            className="pointer-events-none select-none absolute -bottom-4 -right-6 w-44 sm:w-60 md:w-72 transition-opacity duration-500"
            style={{ opacity: Math.max(0.35, 0.92 - pull * 0.45) }}
          >
            <img
              src="/invitacion/leaf-bottom-right.png"
              alt=""
              className="w-full h-auto animate-breeze-b"
            />
          </div>

          {/* CONTENEDOR PROPORCIONAL COMPARTIDO (5:7) DONDE LA TARJETA VIVE FÍSICAMENTE DENTRO DEL SOBRE */}
          <div
            className="relative select-none"
            style={{
              width: 'min(88vw, 455px, calc((100dvh - 102px) * 5 / 7))',
              aspectRatio: '5 / 7',
              perspective: '1600px',
            }}
          >
            {/* Destinatario personalizado encima del sobre cerrado */}
            <div
              className={`absolute -top-2 left-[-6%] right-[-6%] z-40 text-center space-y-1.5 transition-all duration-500 ${
                isSealBroken
                  ? 'opacity-0 -translate-y-5 pointer-events-none'
                  : 'opacity-100 translate-y-0'
              }`}
            >
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#7A6B53] font-bold">
                Invitación Especial Para
              </p>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#243B2B] leading-tight px-2">
                {displaySalutation}
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/95 border border-[#C5A880]/60 text-[#34593C] text-[11px] font-bold shadow-sm">
                <Ticket size={12} className="text-[#B38E5D]" />
                <span>
                  {displaySeats} {displaySeats === 1 ? 'Pase Reservado' : 'Pases Reservados'}
                </span>
              </div>
            </div>

            {/* ===============================================================
                CAPA Z-10: FORRO INTERIOR MARFIL ACUARELA DEL SOBRE
                (Detrás de la tarjeta A6 para que se vea salir de adentro)
            =============================================================== */}
            {envOpacity > 0.01 && (
              <div
                className="absolute left-[-4%] w-[108%] h-[53%] z-10 pointer-events-none"
                style={{
                  top: `${envTopPct}%`,
                  opacity: envOpacity,
                  transition: isActivelyScrollingPull
                    ? 'none'
                    : 'top 650ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <div className="absolute inset-0 rounded-[18px] bg-[#FAF8F2] border border-[#C5A880]/70 shadow-[0_30px_65px_-14px_rgba(24,42,30,0.42)] overflow-hidden">
                  <img
                    src="/invitacion/layers/paper-bg.jpg"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                  <img
                    src="/invitacion/layers/watercolor-splash.png"
                    alt=""
                    className="absolute -left-14 -top-6 w-52 h-40 opacity-35"
                  />
                  <img
                    src="/invitacion/layers/watercolor-splash.png"
                    alt=""
                    className="absolute -right-12 bottom-0 w-48 h-36 opacity-30"
                  />
                  <div className="absolute inset-2 rounded-[13px] border border-[#C5A880]/45" />
                </div>
              </div>
            )}

            {/* ===============================================================
                SOLAPA SUPERIOR 3D INDEPENDIENTE (0° -> 180° continuo sin cortes;
                cambia de z-35 a z-12 justo al pasar por 90° de canto)
            =============================================================== */}
            {envOpacity > 0.01 && (
              <div
                className="absolute left-[-4%] w-[108%] h-[32.86%] pointer-events-none"
                style={{
                  top: `${envTopPct}%`,
                  opacity: envOpacity,
                  zIndex: flapBehind ? 12 : 35,
                  transformOrigin: 'top center',
                  transformStyle: 'preserve-3d',
                  transition: isActivelyScrollingPull
                    ? 'transform 780ms cubic-bezier(0.33, 1, 0.68, 1)'
                    : 'top 650ms cubic-bezier(0.22, 1, 0.36, 1), transform 780ms cubic-bezier(0.33, 1, 0.68, 1)',
                  transform: isSealBroken ? 'rotateX(180deg)' : 'rotateX(0deg)',
                }}
              >
                {/* Cara exterior verde salvia (visible de 0° a 90°) */}
                <div
                  className="absolute inset-0"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  <svg
                    viewBox="0 0 440 186"
                    preserveAspectRatio="none"
                    className="w-full h-full drop-shadow-[0_10px_14px_rgba(18,32,23,0.32)]"
                  >
                    <defs>
                      <linearGradient id="sageTopFlapClosed" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#4F745B" />
                        <stop offset="65%" stopColor="#385742" />
                        <stop offset="100%" stopColor="#2B4433" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,14 Q 0,0 14,0 L 426,0 Q 440,0 440,14 L 246,166 Q 220,185 194,166 Z"
                      fill="url(#sageTopFlapClosed)"
                      stroke="#D8BE96"
                      strokeOpacity="0.75"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M 12,8 L 428,8 L 241,157 Q 220,173 199,157 Z"
                      fill="none"
                      stroke="#E8D3B0"
                      strokeOpacity="0.38"
                      strokeWidth="1"
                    />
                  </svg>
                </div>

                {/* Cara interior marfil acuarela (visible de 90° a 180°) */}
                <div
                  className="absolute inset-0"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateX(180deg)',
                  }}
                >
                  <svg
                    viewBox="0 0 440 186"
                    preserveAspectRatio="none"
                    className="w-full h-full drop-shadow-[0_-6px_14px_rgba(24,42,30,0.16)]"
                  >
                    <defs>
                      <linearGradient id="ivoryFlapOpenBg" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#FAF8F2" />
                        <stop offset="100%" stopColor="#EFECE2" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,14 Q 0,0 14,0 L 426,0 Q 440,0 440,14 L 246,166 Q 220,185 194,166 Z"
                      fill="url(#ivoryFlapOpenBg)"
                      stroke="#C5A880"
                      strokeOpacity="0.7"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 16,10 L 424,10 L 240,155 Q 220,170 200,155 Z"
                      fill="none"
                      stroke="#7E9E78"
                      strokeOpacity="0.35"
                      strokeWidth="1"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* ===============================================================
                CAPA Z-20: LA TARJETA DE INVITACIÓN A6 OFICIAL REAL
                (Emparedada entre el forro trasero z-10 y el bolsillo verde frontal z-30;
                 el invitado la saca él mismo deslizando con el dedo / rueda)
            =============================================================== */}
            <div
              className="absolute inset-0 z-20 will-change-transform"
              style={{
                opacity: isSealBroken ? 1 : 0,
                transform: `translate3d(0, ${cardTranslateYPct}%, 0) scale(${cardScale})`,
                clipPath:
                  clipBottomPct > 0.2
                    ? `inset(0% 0% ${clipBottomPct.toFixed(2)}% 0% round 18px)`
                    : 'none',
                transition: isActivelyScrollingPull
                  ? 'none'
                  : 'transform 680ms cubic-bezier(0.22, 1, 0.36, 1), opacity 250ms ease',
              }}
            >
              {/* Halo exterior dorado que cobra vida cuando la tarjeta sale completa */}
              <div
                className="w-full h-full rounded-[22px] sm:rounded-[28px] transition-shadow duration-300"
                style={{
                  padding: `${4 + 3 * tSettle}px`,
                  background:
                    'linear-gradient(135deg, rgba(229,209,176,0.82) 0%, rgba(255,255,255,0.92) 50%, rgba(197,168,128,0.78) 100%)',
                  boxShadow:
                    pull > 0.35
                      ? `0 ${16 + 14 * tSettle}px ${40 + 35 * tSettle}px -14px rgba(31,58,46,${(0.18 + 0.14 * tSettle).toFixed(2)})`
                      : '0 8px 24px -8px rgba(31,58,46,0.18)',
                }}
              >
                {/* LIENZO A6 OFICIAL DE CANVA (5 : 7) */}
                <div
                  className="relative w-full h-full rounded-2xl sm:rounded-3xl border border-[#C5A880]/65 overflow-hidden bg-[#FAF9F6]"
                  style={{ containerType: 'inline-size' }}
                >
                  <EditorialInnerFrame insetClass="inset-2 sm:inset-3" />

                  {/* 1. Papel acuarela original */}
                  <img
                    src="/invitacion/layers/paper-bg.jpg"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />

                  {/* 2. Manchas de acuarela verde salvia con respiración orgánica */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: '-46.75%',
                      top: '-2.06%',
                      width: '94.17%',
                      height: '65.31%',
                      opacity: 0.51,
                    }}
                  >
                    <img
                      src="/invitacion/layers/watercolor-splash.png"
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full animate-watercolor-breathe"
                    />
                  </div>

                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: '80.9%',
                      top: '20.06%',
                      width: '91.14%',
                      height: '63.21%',
                      opacity: 0.51,
                    }}
                  >
                    <img
                      src="/invitacion/layers/watercolor-splash.png"
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full animate-watercolor-breathe"
                    />
                  </div>

                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: '47.42%',
                      top: '67.61%',
                      width: '92.43%',
                      height: '64.1%',
                      opacity: 0.39,
                    }}
                  >
                    <img
                      src="/invitacion/layers/watercolor-splash.png"
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full animate-watercolor-breathe"
                    />
                  </div>

                  <img
                    src="/invitacion/layers/watercolor-splash.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute pointer-events-none"
                    style={{
                      left: '33.58%',
                      top: '-29.87%',
                      width: '94.64%',
                      height: '65.64%',
                      opacity: 0.26,
                      transform: 'rotate(59.89deg)',
                    }}
                  />

                  <img
                    src="/invitacion/layers/watercolor-splash.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute pointer-events-none"
                    style={{
                      left: '28.73%',
                      top: '50.56%',
                      width: '14.06%',
                      height: '9.75%',
                      opacity: 0.26 * s1Date,
                      transform: 'rotate(59.89deg)',
                    }}
                  />

                  <img
                    src="/invitacion/layers/watercolor-splash.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute pointer-events-none"
                    style={{
                      left: '-10.75%',
                      top: '67.01%',
                      width: '35.15%',
                      height: '24.37%',
                      opacity: 0.26,
                      transform: 'rotate(59.89deg)',
                    }}
                  />

                  {/* 3. Ramas de olivo y rosas blancas con Brisa Viva continua */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: '-19.35%',
                      top: '3.91%',
                      width: '39.38%',
                      height: '39.13%',
                    }}
                  >
                    <img
                      src="/invitacion/layers/olive-branch.png"
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full animate-breeze-a"
                    />
                  </div>

                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: '82.07%',
                      top: '-1.06%',
                      width: '38.91%',
                      height: '49.08%',
                      transform: 'rotate(-23.9deg)',
                    }}
                  >
                    <img
                      src="/invitacion/layers/roses-top-right.png"
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full animate-breeze-roses-r"
                    />
                  </div>

                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: '-22.56%',
                      top: '43.05%',
                      width: '53.17%',
                      height: '67.07%',
                      transform: 'rotate(14.96deg)',
                    }}
                  >
                    <img
                      src="/invitacion/layers/roses-left.png"
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full animate-breeze-roses-l"
                    />
                  </div>

                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: '66.66%',
                      top: '68.76%',
                      width: '39.38%',
                      height: '39.13%',
                    }}
                  >
                    <img
                      src="/invitacion/layers/olive-branch.png"
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full animate-breeze-b"
                    />
                  </div>

                  {/* 4. Caligrafía principal "Edis y Dania" (asoma desde el primer instante al abrir el sobre) */}
                  <img
                    src="/invitacion/layers/text-edis-dania.png"
                    alt="Edis y Dania"
                    className="absolute pointer-events-none"
                    style={{
                      left: '16.0%',
                      top: '7.8%',
                      width: '68.0%',
                      height: '24.0%',
                    }}
                  />

                  {/* 5. Textos en fuente Simonetta que cobran foco conforme salen del bolsillo del sobre */}
                  <div
                    className="absolute left-[10%] w-[80%] text-center pointer-events-none will-change-transform"
                    style={{
                      top: '36.2%',
                      fontFamily: "'Simonetta', serif",
                      color: '#3A3D36',
                      fontSize: 'clamp(11px, 3.6cqw, 19px)',
                      letterSpacing: '0.03em',
                      opacity: s1Subtitle,
                      transform: `translate3d(0, ${(1 - s1Subtitle) * 18}px, 0)`,
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
                      transform: `translate3d(0, ${(1 - s1Verse) * 20}px, 0)`,
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
                      transform: `translate3d(${(1 - s1Date) * -28}px, 0, 0)`,
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
                      transform: `scale(${0.78 + 0.22 * s1Date})`,
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
                      transform: `translate3d(${(1 - s1Date) * 28}px, 0, 0)`,
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
                      transform: `translate3d(0, ${(1 - s1Venue) * 22}px, 0)`,
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
                      transform: `translate3d(0, ${(1 - s1Venue) * 22}px, 0)`,
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
                      transform: `translate3d(0, ${(1 - s1Dress) * 22}px, 0)`,
                    }}
                  >
                    <p>CODIGO VESTIMENTA:</p>
                    <p>FORMAL</p>
                  </div>

                  {/* 6. Firma caligráfica "Te esperamos" */}
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
                      transform: `translate3d(0, ${(1 - s1Sign) * 18}px, 0)`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ===============================================================
                CAPA Z-30: BOLSILLO FRONTAL DEL SOBRE VERDE SALVIA + SOLAPA 3D + SELLO DE LACRE
                (Por delante de la parte inferior de la tarjeta A6 para que la tarjeta salga de adentro)
            =============================================================== */}
            {envOpacity > 0.01 && (
              <div
                onClick={!isSealBroken ? handleBreakSeal : undefined}
                role={!isSealBroken ? 'button' : undefined}
                tabIndex={!isSealBroken ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!isSealBroken && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleBreakSeal();
                  }
                }}
                aria-label={!isSealBroken ? 'Tocar el sobre para abrir tu invitación' : undefined}
                className={`absolute left-[-4%] w-[108%] h-[53%] z-30 ${
                  !isSealBroken ? 'cursor-pointer group' : 'pointer-events-none'
                }`}
                style={{
                  top: `${envTopPct}%`,
                  opacity: envOpacity,
                  perspective: '1500px',
                  transition: isActivelyScrollingPull
                    ? 'none'
                    : 'top 650ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                {/* Bolsillo frontal verde salvia en SVG con doble hilo dorado */}
                <svg
                  viewBox="0 0 440 300"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full rounded-[18px] overflow-hidden drop-shadow-[0_-4px_12px_rgba(18,32,23,0.18)]"
                >
                  <defs>
                    <linearGradient id="sageLeftFoldMain" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#43644D" />
                      <stop offset="100%" stopColor="#2B4433" />
                    </linearGradient>
                    <linearGradient id="sageRightFoldMain" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#40604A" />
                      <stop offset="100%" stopColor="#283F30" />
                    </linearGradient>
                    <linearGradient id="sageBottomPocketMain" x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor="#4A6D55" />
                      <stop offset="55%" stopColor="#35523E" />
                      <stop offset="100%" stopColor="#263D2E" />
                    </linearGradient>
                  </defs>

                  <polygon
                    points="0,0 228,158 0,300"
                    fill="url(#sageLeftFoldMain)"
                    stroke="#C5A880"
                    strokeOpacity="0.45"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="440,0 212,158 440,300"
                    fill="url(#sageRightFoldMain)"
                    stroke="#C5A880"
                    strokeOpacity="0.45"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 0,300 L 188,144 Q 220,122 252,144 L 440,300 Z"
                    fill="url(#sageBottomPocketMain)"
                    stroke="#D8BE96"
                    strokeOpacity="0.68"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 14,296 L 193,151 Q 220,131 247,151 L 426,296"
                    fill="none"
                    stroke="#E5CFA9"
                    strokeOpacity="0.34"
                    strokeWidth="1"
                  />
                </svg>

                {/* Sello tipográfico dorado en el borde inferior del sobre */}
                <div className="absolute bottom-3 inset-x-6 text-center pointer-events-none">
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.26em] text-[#EAD6B5]/90 font-medium">
                    Edis & Dania • 21.11.2026
                  </span>
                </div>
              </div>
            )}

            {/* ===============================================================
                CAPA Z-40: SELLO DE LACRE DORADO ARTESANAL "E & D"
                (Por encima de la solapa cerrada z-35; al hacer clic abre el sobre)
            =============================================================== */}
            {envOpacity > 0.01 && (
              <div
                onClick={!isSealBroken ? handleBreakSeal : undefined}
                role={!isSealBroken ? 'button' : undefined}
                tabIndex={!isSealBroken ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!isSealBroken && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleBreakSeal();
                  }
                }}
                aria-label={!isSealBroken ? 'Tocar el sello dorado para abrir el sobre' : undefined}
                className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 transition-all duration-500 ${
                  isSealBroken
                    ? 'opacity-0 scale-125 -translate-y-14 pointer-events-none'
                    : 'opacity-100 cursor-pointer hover:scale-105'
                }`}
                style={{
                  top: `${envTopPct + 29.6}%`,
                }}
              >
                <span className="absolute -inset-2.5 rounded-full border-2 border-[#DFC59B] animate-seal-halo pointer-events-none" />
                <div className="relative w-[78px] h-[78px] sm:w-[88px] sm:h-[88px] rounded-full bg-gradient-to-br from-[#F0D9B5] via-[#C69F68] to-[#876435] p-[5px] shadow-[0_12px_28px_rgba(18,32,23,0.48),inset_0_2px_4px_rgba(255,255,255,0.65)] flex items-center justify-center overflow-hidden">
                  <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/55 to-transparent animate-golden-shimmer pointer-events-none" />
                  <div className="w-full h-full rounded-full bg-gradient-to-b from-[#DEC094] via-[#B89058] to-[#96713E] border-2 border-[#F3E1C3]/75 shadow-inner flex flex-col items-center justify-center">
                    <span className="font-serif text-lg sm:text-xl font-bold text-[#FFFDF9] drop-shadow-[0_1px_2px_rgba(74,50,19,0.65)] tracking-wider leading-none">
                      E<span className="italic text-sm mx-0.5 text-[#FAF0DF]">&</span>D
                    </span>
                    <Heart
                      size={10}
                      className="text-[#FFFDF9] fill-[#FFFDF9] mt-1 opacity-90 drop-shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Indicador inferior ANTES de dar clic en el sobre */}
            <div
              className={`absolute -bottom-3 left-[-8%] right-[-8%] z-40 flex flex-col items-center gap-2 transition-all duration-400 ${
                isSealBroken
                  ? 'opacity-0 translate-y-4 pointer-events-none'
                  : 'opacity-100 translate-y-0'
              }`}
            >
              <button
                type="button"
                onClick={handleBreakSeal}
                className="relative overflow-hidden inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#243B2B] via-[#35553F] to-[#243B2B] hover:brightness-110 text-white text-xs sm:text-sm font-semibold tracking-wide shadow-lg border border-[#C5A880]/65 cursor-pointer"
              >
                <span className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-golden-shimmer pointer-events-none" />
                <Music size={14} className="text-[#E5CFA9]" />
                <span>Toca el Sello para Abrir el Sobre</span>
              </button>
              <span className="text-[11px] text-[#6E624E] font-medium flex items-center gap-1.5">
                <Volume2 size={13} className="text-[#4C8B54]" />
                Incluye música de fondo
              </span>
            </div>

            {/* Indicador táctil DESPUÉS de abrir la solapa: invita al usuario a deslizar para sacar él mismo la tarjeta */}
            <div
              className={`absolute bottom-1 left-1/2 -translate-x-1/2 z-40 w-max max-w-[92vw] pointer-events-none transition-all duration-300 ${
                isPeekReady && pull < 0.12
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-3'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#C5A880]/80 shadow-[0_10px_28px_rgba(24,42,30,0.28)] text-[#243B2B]">
                <ChevronUp size={16} className="animate-bounce text-[#4C8B54]" />
                <span className="text-xs font-bold tracking-wide">
                  Desliza para sacar tu invitación
                </span>
                <ChevronDown size={16} className="animate-bounce text-[#B38E5D]" />
              </div>
            </div>
          </div>

          {/* Indicador sutil para continuar hacia los pases una vez extraída al 100% */}
          <div
            className="mt-2.5 flex items-center gap-1.5 text-[#7A6B53] pointer-events-none transition-opacity duration-300"
            style={{ opacity: pull > 0.92 ? 0.9 : 0 }}
          >
            <span className="text-[10px] uppercase tracking-[0.24em] font-semibold">
              Sigue deslizando para ver tus pases
            </span>
            <ChevronDown size={15} className="animate-bounce text-[#4C8B54]" />
          </div>
        </div>
      </section>

      {/* =====================================================================
          STAGE 2: TARJETA DE PASES RESERVADOS CON MARCO DORADO & BRISA VIVA
      ===================================================================== */}
      <section
        ref={stage2Ref}
        className="relative z-10 py-6 sm:py-10 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col items-center"
      >
        <div
          className="text-center mb-4 space-y-1.5 will-change-transform"
          style={{
            opacity: Math.max(0.2, s2Header),
            transform: `translate3d(0, ${(1 - s2Header) * 24}px, 0)`,
          }}
        >
          <GoldenBotanicalDivider progress={s2LeafTL} />
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 border border-[#C5A880]/55 text-[#3B6E42] text-[11px] font-bold uppercase tracking-widest shadow-sm">
            <Ticket size={13} className="text-[#B38E5D]" />
            Tus Pases Reservados
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-[#243B2B] font-bold">
            {displaySalutation}
          </h2>
        </div>

        <div className="p-1.5 sm:p-2 rounded-[26px] sm:rounded-[30px] bg-gradient-to-br from-[#E5D1B0]/70 via-white/85 to-[#C5A880]/65 shadow-[0_24px_60px_-14px_rgba(31,58,46,0.22)] w-full max-w-[632px]">
          <div
            className="relative w-full aspect-[1600/889] rounded-2xl sm:rounded-3xl border border-[#C5A880]/55 bg-white overflow-hidden select-none"
            style={{ containerType: 'inline-size' }}
          >
            <EditorialInnerFrame insetClass="inset-2 sm:inset-3" />

            <div
              className="absolute top-0 left-0 w-[28.1%] h-[46.1%] pointer-events-none will-change-transform"
              style={{
                opacity: s2LeafTL,
                transform: `translate3d(${(1 - s2LeafTL) * -110}px, ${(1 - s2LeafTL) * -80}px, 0) rotate(${(1 - s2LeafTL) * -20}deg) scale(${0.75 + 0.25 * s2LeafTL})`,
              }}
            >
              <img
                src="/invitacion/leaf-top-left.png"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain object-top-left animate-breeze-a"
              />
            </div>

            <div
              className="absolute bottom-0 right-0 w-[28.1%] h-[46.1%] pointer-events-none will-change-transform"
              style={{
                opacity: s2LeafBR,
                transform: `translate3d(${(1 - s2LeafBR) * 110}px, ${(1 - s2LeafBR) * 80}px, 0) rotate(${(1 - s2LeafBR) * 20}deg) scale(${0.75 + 0.25 * s2LeafBR})`,
              }}
            >
              <img
                src="/invitacion/leaf-bottom-right.png"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain object-bottom-right animate-breeze-b"
              />
            </div>

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
              className="absolute flex items-center justify-center pointer-events-none will-change-transform border-[2.5px] sm:border-[3px] border-[#4C8B54] bg-white/95 shadow-[0_6px_20px_-4px_rgba(76,139,84,0.25)] overflow-hidden"
              style={{
                left: '44.3%',
                top: '24.8%',
                width: '11.4%',
                height: '17.2%',
                opacity: s2Box,
                transform: `scale(${0.35 + 0.65 * s2Box})`,
              }}
            >
              <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#E5D1B0]/40 to-transparent animate-golden-shimmer" />
              <span
                className="relative font-sans font-semibold leading-none"
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
        </div>
      </section>

      {/* =====================================================================
          STAGE 3: TARJETA DE REGALO / SOBRE CON MARCO DORADO, BRISA VIVA & SOBRE FLOTANTE
      ===================================================================== */}
      <section
        ref={stage3Ref}
        className="relative z-10 py-6 sm:py-10 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col items-center"
      >
        <div
          className="text-center mb-4 space-y-1.5 will-change-transform"
          style={{
            opacity: Math.max(0.2, s3Botanicals),
            transform: `translate3d(0, ${(1 - s3Botanicals) * 24}px, 0)`,
          }}
        >
          <GoldenBotanicalDivider progress={s3Watercolors} />
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 border border-[#C5A880]/55 text-[#3B6E42] text-[11px] font-bold uppercase tracking-widest shadow-sm">
            <Mail size={13} className="text-[#B38E5D]" />
            Muestras de Cariño
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-[#243B2B] font-bold">
            Detalle de Boda
          </h2>
        </div>

        <div className="p-1.5 sm:p-2 rounded-[26px] sm:rounded-[30px] bg-gradient-to-br from-[#E5D1B0]/70 via-white/85 to-[#C5A880]/65 shadow-[0_26px_65px_-15px_rgba(31,58,46,0.24)] w-full max-w-[432px]">
          <div
            className="relative w-full aspect-[1875/3281] rounded-2xl sm:rounded-3xl border border-[#C5A880]/55 bg-[#FAF9F6] overflow-hidden select-none"
            style={{ containerType: 'inline-size' }}
          >
            <EditorialInnerFrame insetClass="inset-2.5 sm:inset-3.5" />

            <img
              src="/invitacion/layers/paper-bg.jpg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
            />

            <div
              className="absolute pointer-events-none will-change-transform"
              style={{
                left: '-46%',
                top: '5%',
                width: '94%',
                height: '55%',
                opacity: 0.45 * s3Watercolors,
                transform: `translate3d(${(1 - s3Watercolors) * -55}px, 0, 0) scale(${0.7 + 0.3 * s3Watercolors})`,
              }}
            >
              <img
                src="/invitacion/layers/watercolor-splash.png"
                alt=""
                aria-hidden="true"
                className="w-full h-full animate-watercolor-breathe"
              />
            </div>

            <div
              className="absolute pointer-events-none will-change-transform"
              style={{
                left: '42%',
                top: '-8%',
                width: '92%',
                height: '50%',
                opacity: 0.32 * s3Watercolors,
                transform: `translate3d(${(1 - s3Watercolors) * 55}px, 0, 0) scale(${0.7 + 0.3 * s3Watercolors})`,
              }}
            >
              <img
                src="/invitacion/layers/watercolor-splash.png"
                alt=""
                aria-hidden="true"
                className="w-full h-full animate-watercolor-breathe"
              />
            </div>

            <div
              className="absolute pointer-events-none will-change-transform"
              style={{
                left: '48%',
                top: '65%',
                width: '90%',
                height: '50%',
                opacity: 0.38 * s3Watercolors,
                transform: `translate3d(${(1 - s3Watercolors) * 55}px, ${(1 - s3Watercolors) * 45}px, 0) scale(${0.7 + 0.3 * s3Watercolors})`,
              }}
            >
              <img
                src="/invitacion/layers/watercolor-splash.png"
                alt=""
                aria-hidden="true"
                className="w-full h-full animate-watercolor-breathe"
              />
            </div>

            <div
              className="absolute pointer-events-none will-change-transform"
              style={{
                left: '-19%',
                top: '8%',
                width: '40%',
                height: '32%',
                opacity: s3Botanicals,
                transform: `translate3d(${(1 - s3Botanicals) * -120}px, ${(1 - s3Botanicals) * -60}px, 0) rotate(${(1 - s3Botanicals) * -22}deg)`,
              }}
            >
              <img
                src="/invitacion/layers/olive-branch.png"
                alt=""
                aria-hidden="true"
                className="w-full h-full animate-breeze-a"
              />
            </div>

            <div
              className="absolute pointer-events-none will-change-transform"
              style={{
                left: '76%',
                top: '6%',
                width: '40%',
                height: '38%',
                opacity: s3Botanicals,
                transform: `translate3d(${(1 - s3Botanicals) * 120}px, ${(1 - s3Botanicals) * -60}px, 0) rotate(${-23.9 + (1 - s3Botanicals) * 24}deg)`,
              }}
            >
              <img
                src="/invitacion/layers/roses-top-right.png"
                alt=""
                aria-hidden="true"
                className="w-full h-full animate-breeze-roses-r"
              />
            </div>

            <div
              className="absolute pointer-events-none will-change-transform"
              style={{
                left: '-22%',
                top: '41%',
                width: '54%',
                height: '54%',
                opacity: s3Botanicals,
                transform: `translate3d(${(1 - s3Botanicals) * -130}px, ${(1 - s3Botanicals) * 55}px, 0) rotate(${14.96 - (1 - s3Botanicals) * 20}deg)`,
              }}
            >
              <img
                src="/invitacion/layers/roses-left.png"
                alt=""
                aria-hidden="true"
                className="w-full h-full animate-breeze-roses-l"
              />
            </div>

            <div
              className="absolute pointer-events-none will-change-transform"
              style={{
                left: '68%',
                top: '67%',
                width: '38%',
                height: '30%',
                opacity: s3Botanicals,
                transform: `translate3d(${(1 - s3Botanicals) * 120}px, ${(1 - s3Botanicals) * 70}px, 0) rotate(${(1 - s3Botanicals) * 22}deg)`,
              }}
            >
              <img
                src="/invitacion/layers/olive-branch.png"
                alt=""
                aria-hidden="true"
                className="w-full h-full animate-breeze-b"
              />
            </div>

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

            <div
              className="absolute pointer-events-none will-change-transform"
              style={{
                left: '40%',
                top: '62.5%',
                width: '20%',
                height: '8.5%',
                opacity: s3Envelope,
                transform: `translate3d(0, ${(1 - s3Envelope) * 75}px, 0) scale(${0.45 + 0.55 * s3Envelope})`,
              }}
            >
              <img
                src="/invitacion/layers/icon-regalo-envelope.png"
                alt="Sobre de regalo"
                className="w-full h-full animate-envelope-float"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          STAGE 4: CUENTA REGRESIVA, UBICACIÓN GPS & CONFIRMACIÓN DE ASISTENCIA
      ===================================================================== */}
      <section
        id="confirmar-asistencia"
        ref={stage4Ref}
        className="relative z-10 py-8 sm:py-12 px-4 sm:px-6 max-w-3xl mx-auto space-y-7"
      >
        <GoldenBotanicalDivider progress={s4Card1} />

        {/* 1. Cuenta Regresiva y Ubicación con Marco Dorado */}
        <div
          className="relative bg-white/95 backdrop-blur-md rounded-3xl p-7 sm:p-9 shadow-[0_22px_55px_-15px_rgba(31,58,46,0.16)] border border-[#C5A880]/55 text-center space-y-6 will-change-transform"
          style={{
            opacity: Math.max(0.15, s4Card1),
            transform: `translate3d(0, ${(1 - s4Card1) * 45}px, 0) scale(${0.96 + 0.04 * s4Card1})`,
          }}
        >
          <EditorialInnerFrame insetClass="inset-2.5 sm:inset-3.5" />

          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-[0.28em] text-[#8C7756] font-bold">
              Falta Muy Poco
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#243B2B] font-bold">
              Sábado 21 de Noviembre, 2026 • 4:30 P.M.
            </h3>
          </div>

          <LiveCountdownGrid />

          <div className="pt-4 border-t border-[#C5A880]/30 space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-[#3B6E42] font-bold text-xs uppercase tracking-wider">
              <MapPin size={15} className="text-[#B38E5D]" />
              <span>Lugar de la Celebración</span>
            </div>
            <p className="font-serif text-base sm:text-lg font-semibold text-stone-800 max-w-lg mx-auto">
              Calan Park, a 1.5 km del desvío a El Calán (Zona Zip Búfalo), Villanueva
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1 relative z-30">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Calan+Park+El+Calan+Villanueva+Honduras"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#243B2B] to-[#34543E] hover:brightness-110 text-white text-xs font-semibold shadow-sm border border-[#C5A880]/45 transition-all"
              >
                <MapPin size={14} className="text-[#E0C59B]" />
                <span>Ver Ubicación en Google Maps</span>
                <ExternalLink size={12} />
              </a>
              <a
                href="https://waze.com/ul?q=Calan%20Park%20Villanueva"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FAF8F4] hover:bg-[#F0ECE2] text-[#243B2B] border border-[#C5A880]/55 text-xs font-semibold transition-all"
              >
                <span>Abrir en Waze</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* 2. Tarjeta de Confirmación de Asistencia con Marco Dorado */}
        <div
          className="relative bg-white/95 backdrop-blur-md rounded-3xl p-7 sm:p-9 shadow-[0_24px_60px_-15px_rgba(31,58,46,0.2)] border border-[#C5A880]/55 space-y-6 will-change-transform"
          style={{
            opacity: Math.max(0.15, s4Card2),
            transform: `translate3d(0, ${(1 - s4Card2) * 45}px, 0) scale(${0.96 + 0.04 * s4Card2})`,
          }}
        >
          <EditorialInnerFrame insetClass="inset-2.5 sm:inset-3.5" />

          <div className="text-center space-y-2 relative z-30">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F4] border border-[#C5A880]/55 text-[#3B6E42] flex items-center justify-center mx-auto shadow-sm">
              <UserCheck size={24} className="text-[#2F4838]" />
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#243B2B]">
              Confirmar Asistencia
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              Para nosotros es muy importante contar contigo. Confirma tu asistencia aquí mismo en 1 clic o envíanos un mensaje por WhatsApp.
            </p>
          </div>

          {(activeCard || urlData.cardId) && (
            <div className="relative z-30 bg-gradient-to-b from-[#F7F9F5] to-[#EFF4EC] border border-[#C5A880]/45 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C5A880]/30 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7756]">
                    Tu Invitación
                  </span>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-[#243B2B]">
                    {displaySalutation}
                  </h4>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#C5A880]/50 text-xs font-bold text-[#3B6E42] self-start sm:self-auto">
                  <Ticket size={13} className="text-[#B38E5D]" />
                  {displaySeats} {displaySeats === 1 ? 'Pase' : 'Pases'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleDirectConfirmCard}
                className={`relative overflow-hidden w-full py-3.5 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md border border-[#C5A880]/45 transition-all cursor-pointer ${
                  activeCard?.statusSummary?.isAllConfirmed || rsvpSubmitted
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-gradient-to-r from-[#243B2B] via-[#32513C] to-[#243B2B] hover:brightness-110 text-white'
                }`}
              >
                <span className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-golden-shimmer pointer-events-none" />
                <CheckCircle2 size={18} className="text-[#E0C59B]" />
                <span>
                  {activeCard?.statusSummary?.isAllConfirmed || rsvpSubmitted
                    ? `¡Asistencia Confirmada para ${displaySalutation}!`
                    : `Confirmar Asistencia de ${displaySalutation} (${displaySeats} ${displaySeats === 1 ? 'Pase' : 'Pases'})`}
                </span>
              </button>
            </div>
          )}

          <div className="space-y-2 pt-1 relative z-30">
            <button
              type="button"
              onClick={handleWhatsAppRsvp}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <MessageCircle size={18} />
              <span>Confirmar por WhatsApp (+504 8778-8207)</span>
            </button>
            <p className="text-center text-[11px] text-stone-500">
              Código de Vestimenta: <strong className="text-[#243B2B]">FORMAL</strong> • Teléfono Oficial: <strong className="text-[#243B2B]">+504 8778-8207</strong>
            </p>
          </div>
        </div>

        <footer className="text-center pt-4 pb-16 space-y-2 text-stone-500">
          <img
            src="/invitacion/layers/text-te-esperamos.png"
            alt="Te esperamos"
            className="w-44 mx-auto opacity-90 select-none pointer-events-none"
          />
          <p className="text-xs tracking-[0.22em] uppercase text-[#8C7756] font-semibold">
            Edis & Dania • 21 de Noviembre de 2026
          </p>
        </footer>
      </section>
    </div>
  );
}
