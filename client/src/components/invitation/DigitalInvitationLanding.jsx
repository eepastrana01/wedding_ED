import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useWedding } from '../../context/WeddingContext';
import { useWeddingCountdown } from '../../hooks/useWeddingCountdown';
import { openWhatsApp } from '../../utils/whatsapp';
import { familyApi } from '../../services/familyApi';
import { guestApi } from '../../services/guestApi';
import {
  decodeInvitationToken,
  extractInvitationTokenFromWindow,
} from '../../utils/invitationToken';
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
  UserX,
  Users,
  Check,
  X,
  ArrowLeft,
  Volume2,
  VolumeX,
  Music,
  Sparkles,
} from 'lucide-react';

const INVALID_PARTNER_VALUES = new Set([
  'novio',
  'novia',
  'comun',
  'general',
  'ninguno',
  'ninguna',
  'no',
  'sin pareja',
]);

function formatSpanishList(names = []) {
  const clean = names.map((n) => String(n || '').trim()).filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} y ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')} y ${clean[clean.length - 1]}`;
}

// Curva suave estilo Canva para interpolar el ensamblaje con el scroll
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
      className="flex items-center justify-center gap-3 py-1.5 max-w-xs mx-auto select-none pointer-events-none"
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
    refreshAll,
  } = useWedding();

  // Decodificación segura del enlace corto (/i/TOKEN) o enlaces previos (?k=TOKEN / ?card=...)
  const urlData = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const token = extractInvitationTokenFromWindow();
    const verified = token ? decodeInvitationToken(token) : null;

    if (verified) {
      return {
        cardId: verified.cardId,
        salutation: verified.salutation,
        seats: verified.seats,
      };
    }

    const p = new URLSearchParams(window.location.search);

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

  const targetCardId = activeCard?.id || urlData.cardId || '';

  const [rsvpSummary, setRsvpSummary] = useState(() => {
    if (typeof window === 'undefined' || !urlData.cardId) return null;
    try {
      const raw = localStorage.getItem(`wedding_rsvp_summary_${urlData.cardId}`);
      if (raw) return JSON.parse(raw);
      if (localStorage.getItem(`wedding_rsvp_done_${urlData.cardId}`) === 'true') {
        return {
          mode: 'all',
          confirmedCount: urlData.seats || 2,
          totalCount: urlData.seats || 2,
          attendingNames: [],
          declinedNames: [],
          allDeclined: false,
        };
      }
    } catch {}
    return null;
  });

  const [rsvpSubmitted, setRsvpSubmitted] = useState(() => {
    if (typeof window === 'undefined') return false;
    const id = urlData.cardId;
    if (!id) return false;
    try {
      return (
        localStorage.getItem(`wedding_rsvp_done_${id}`) === 'true' ||
        Boolean(localStorage.getItem(`wedding_rsvp_summary_${id}`))
      );
    } catch {
      return false;
    }
  });

  const [isEditingRsvp, setIsEditingRsvp] = useState(false);
  const [isOneByOneOpen, setIsOneByOneOpen] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState(null);
  const [memberSelections, setMemberSelections] = useState([]);
  const guestCardMetaRef = useRef(null);

  // =========================================================================
  // ESTADO DEL SOBRE 3D + EXTRACCIÓN CON SCROLL DE LA TARJETA DE BIENVENIDA
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

  // Bloquear scroll únicamente antes de dar clic en el sello del sobre
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

  // Al dar clic en el sobre: se abre la solapa 3D, inicia la música y la Tarjeta de Bienvenida asoma lista para estirarla con scroll
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

  const heroPullSectionRef = useRef(null);
  const stage1Ref = useRef(null);
  const stage2Ref = useRef(null);
  const stage3Ref = useRef(null);
  const stage4Ref = useRef(null);

  const [scrollState, setScrollState] = useState({
    pull: 0,
    p1: 0,
    p2: 0,
    p3: 0,
    p4: 0,
  });

  useEffect(() => {
    let rafId = null;

    const updateScrollProgress = () => {
      const vh = window.innerHeight || 800;

      // Progreso [0..1] de extracción física de la Tarjeta de Bienvenida fuera del sobre (primeros 130vh)
      let pullProg = 0;
      if (heroPullSectionRef.current) {
        const heroRect = heroPullSectionRef.current.getBoundingClientRect();
        const scrolledInHero = Math.max(0, -heroRect.top);
        const pullDistance = vh * 1.3;
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
        p1: calcSectionProgress(stage1Ref.current, 0.95, 0.66),
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

  const handleStartJourney = () => {
    if (stage1Ref.current) {
      stage1Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const persistRsvpSummary = useCallback((cardId, summaryObj) => {
    setRsvpSummary(summaryObj);
    setRsvpSubmitted(true);
    setIsEditingRsvp(false);
    setIsOneByOneOpen(false);
    if (!cardId) return;
    try {
      localStorage.setItem(`wedding_rsvp_done_${cardId}`, 'true');
      localStorage.setItem(`wedding_rsvp_summary_${cardId}`, JSON.stringify(summaryObj));
    } catch {}
  }, []);

  const triggerRsvpConfetti = useCallback(() => {
    confetti({
      particleCount: 110,
      spread: 85,
      origin: { y: 0.65 },
      colors: ['#4C8B54', '#C5A880', '#1F3A2E', '#FAF8F5'],
    });
  }, []);

  // Confirmar TODOS los pases de la tarjeta en 1 solo clic (1 consulta SQL)
  const handleDirectConfirmCard = async () => {
    if (!targetCardId || isSubmittingRsvp) return;
    setIsSubmittingRsvp(true);
    setRsvpError(null);
    try {
      if (String(targetCardId).startsWith('fam-')) {
        const famId = Number(String(targetCardId).replace('fam-', ''));
        if (isAdminUnlocked) {
          await setFamilyStatus(famId, 'confirmed');
        } else {
          await familyApi.updateBulkStatus(famId, 'confirmed');
        }
      } else if (String(targetCardId).startsWith('guest-')) {
        const gId = Number(String(targetCardId).replace('guest-', ''));
        if (isAdminUnlocked && displaySeats <= 1) {
          await setGuestStatus(gId, 'confirmed');
        } else if (displaySeats > 1) {
          await guestApi.update(gId, {
            status: 'confirmed',
            confirmed_seats: displaySeats,
          });
          if (isAdminUnlocked && refreshAll) refreshAll(true);
        } else {
          await guestApi.updateStatus(gId, 'confirmed');
        }
      }

      if (memberSelections.length > 0) {
        setMemberSelections((prev) => prev.map((m) => ({ ...m, attending: true })));
      }

      persistRsvpSummary(targetCardId, {
        mode: 'all',
        confirmedCount: displaySeats,
        totalCount: displaySeats,
        attendingNames: memberSelections.map((m) => m.name),
        declinedNames: [],
        allDeclined: false,
      });
      triggerRsvpConfetti();
    } catch (err) {
      console.error(err);
      setRsvpError('No se pudo guardar en este momento. Intenta de nuevo o confirma por WhatsApp.');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  // Indicar cortésmente que ningún integrante podrá asistir
  const handleDeclineCardAll = async () => {
    if (!targetCardId || isSubmittingRsvp) return;
    setIsSubmittingRsvp(true);
    setRsvpError(null);
    try {
      if (String(targetCardId).startsWith('fam-')) {
        const famId = Number(String(targetCardId).replace('fam-', ''));
        if (isAdminUnlocked) {
          await setFamilyStatus(famId, 'declined');
        } else {
          await familyApi.updateBulkStatus(famId, 'declined');
        }
      } else if (String(targetCardId).startsWith('guest-')) {
        const gId = Number(String(targetCardId).replace('guest-', ''));
        if (isAdminUnlocked) {
          await setGuestStatus(gId, 'declined');
        } else {
          await guestApi.updateStatus(gId, 'declined');
        }
      }

      if (memberSelections.length > 0) {
        setMemberSelections((prev) => prev.map((m) => ({ ...m, attending: false })));
      }

      persistRsvpSummary(targetCardId, {
        mode: 'decline',
        confirmedCount: 0,
        totalCount: displaySeats,
        attendingNames: [],
        declinedNames: memberSelections.map((m) => m.name),
        allDeclined: true,
      });
    } catch (err) {
      console.error(err);
      setRsvpError('No se pudo registrar la respuesta. Intenta nuevamente.');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  // Carga BAJO DEMANDA de los integrantes reales (0 consultas a Neon hasta abrir el modo 1x1)
  const handleToggleOneByOne = async () => {
    if (isOneByOneOpen) {
      setIsOneByOneOpen(false);
      return;
    }

    setIsOneByOneOpen(true);
    setRsvpError(null);

    if (memberSelections.length > 0 || !targetCardId) {
      return;
    }

    setIsLoadingMembers(true);
    try {
      if (String(targetCardId).startsWith('fam-')) {
        const famId = Number(String(targetCardId).replace('fam-', ''));
        const res = await familyApi.getById(famId);
        const fam = res?.data;
        const dbMembers = Array.isArray(fam?.members) ? fam.members : [];

        if (dbMembers.length > 0) {
          const mapped = dbMembers.map((m, idx) => {
            const rawPartner = String(m.partner_name || '').trim();
            const hasPartner =
              Boolean(rawPartner) && !INVALID_PARTNER_VALUES.has(rawPartner.toLowerCase());
            const fullLabel = hasPartner
              ? `${m.name} & ${rawPartner}`
              : m.name || `Integrante ${idx + 1}`;
            return {
              key: String(m.id),
              guestId: m.id,
              name: fullLabel,
              seats: Math.max(1, parseInt(m.confirmed_seats, 10) || (hasPartner ? 2 : 1)),
              attending: m.status !== 'declined',
            };
          });
          setMemberSelections(mapped);
        } else {
          setMemberSelections(
            Array.from({ length: displaySeats }, (_, idx) => ({
              key: `fallback-${idx + 1}`,
              guestId: null,
              name: `Integrante ${idx + 1}`,
              seats: 1,
              attending: true,
            }))
          );
        }
      } else if (String(targetCardId).startsWith('guest-')) {
        const gId = Number(String(targetCardId).replace('guest-', ''));
        const res = await guestApi.getById(gId);
        const guest = res?.data;

        if (guest) {
          const rawPartner = String(guest.partner_name || '').trim();
          const hasPartner =
            Boolean(rawPartner) && !INVALID_PARTNER_VALUES.has(rawPartner.toLowerCase());
          const savedConfirmedSeats = parseInt(guest.confirmed_seats, 10) || displaySeats;
          const totalPasses = Math.max(displaySeats, hasPartner ? 2 : 1);

          guestCardMetaRef.current = {
            id: guest.id,
            notes: guest.notes || '',
            totalPasses,
          };

          const items = [
            {
              key: 'main',
              guestId: null,
              name: guest.name || displaySalutation,
              seats: 1,
              attending: guest.status !== 'declined',
            },
          ];

          if (hasPartner) {
            items.push({
              key: 'partner',
              guestId: null,
              name: rawPartner,
              seats: 1,
              attending: guest.status !== 'declined' && savedConfirmedSeats >= 2,
            });
          }

          for (let i = items.length; i < totalPasses; i += 1) {
            items.push({
              key: `extra-${i}`,
              guestId: null,
              name: `Acompañante ${i}`,
              seats: 1,
              attending: guest.status !== 'declined' && i < savedConfirmedSeats,
            });
          }

          setMemberSelections(items);
        }
      }
    } catch (err) {
      console.error(err);
      setRsvpError('No pudimos cargar la lista de integrantes. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleSetMemberAttending = (memberKey, isAttending) => {
    setMemberSelections((prev) =>
      prev.map((m) => (m.key === memberKey ? { ...m, attending: isAttending } : m))
    );
  };

  const handleSetAllMembersLocal = (isAttending) => {
    setMemberSelections((prev) => prev.map((m) => ({ ...m, attending: isAttending })));
  };

  // Guardar selección 1x1 en 1 sola consulta SQL hacia Neon
  const handleSaveOneByOneRsvp = async () => {
    if (!targetCardId || memberSelections.length === 0 || isSubmittingRsvp) return;
    setIsSubmittingRsvp(true);
    setRsvpError(null);

    const attendingItems = memberSelections.filter((m) => m.attending);
    const declinedItems = memberSelections.filter((m) => !m.attending);
    const confirmedSeatsCount = attendingItems.reduce((sum, m) => sum + (m.seats || 1), 0);
    const totalSeatsCount = memberSelections.reduce((sum, m) => sum + (m.seats || 1), 0);

    try {
      if (String(targetCardId).startsWith('fam-')) {
        const famId = Number(String(targetCardId).replace('fam-', ''));
        const payload = memberSelections
          .filter((m) => m.guestId)
          .map((m) => ({
            id: m.guestId,
            status: m.attending ? 'confirmed' : 'declined',
          }));

        if (payload.length > 0) {
          await familyApi.updateMembersStatus(famId, payload);
        } else {
          await familyApi.updateBulkStatus(
            famId,
            confirmedSeatsCount > 0 ? 'confirmed' : 'declined'
          );
        }

        if (isAdminUnlocked && refreshAll) {
          refreshAll(true);
        }
      } else if (String(targetCardId).startsWith('guest-')) {
        const gId = Number(String(targetCardId).replace('guest-', ''));
        const baseNotes = String(guestCardMetaRef.current?.notes || '')
          .replace(/\s*\[RSVP Web:[^\]]*\]/g, '')
          .trim();

        let rsvpTag = '';
        if (confirmedSeatsCount > 0 && declinedItems.length > 0) {
          rsvpTag = `[RSVP Web: Asiste ${attendingItems.map((i) => i.name).join(', ')}; No asiste ${declinedItems.map((i) => i.name).join(', ')}]`;
        }
        const combinedNotes = [baseNotes, rsvpTag].filter(Boolean).join(' ');

        await guestApi.update(gId, {
          status: confirmedSeatsCount > 0 ? 'confirmed' : 'declined',
          confirmed_seats: confirmedSeatsCount > 0 ? confirmedSeatsCount : totalSeatsCount,
          notes: combinedNotes || null,
        });

        if (guestCardMetaRef.current) {
          guestCardMetaRef.current.notes = combinedNotes;
        }
        if (isAdminUnlocked && refreshAll) {
          refreshAll(true);
        }
      }

      persistRsvpSummary(targetCardId, {
        mode: '1x1',
        confirmedCount: confirmedSeatsCount,
        totalCount: totalSeatsCount,
        attendingNames: attendingItems.map((m) => m.name),
        declinedNames: declinedItems.map((m) => m.name),
        allDeclined: confirmedSeatsCount === 0,
      });

      if (confirmedSeatsCount > 0) {
        triggerRsvpConfetti();
      }
    } catch (err) {
      console.error(err);
      setRsvpError('No se pudo guardar la selección. Intenta de nuevo o envíanos un WhatsApp.');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const handleWhatsAppRsvp = () => {
    let msg;

    if (rsvpSummary?.allDeclined) {
      const sender =
        displaySalutation && displaySalutation !== 'Invitado Especial'
          ? `de parte de *${displaySalutation}*`
          : '';
      msg = `¡Hola Edis y Dania! 🤍 Les saludamos ${sender}. Lamentablemente en esta ocasión no podremos acompañarlos el 21 de Noviembre, pero les enviamos un fuerte abrazo y nuestros mejores deseos en su matrimonio.`;
    } else if (
      rsvpSummary?.mode === '1x1' &&
      rsvpSummary.attendingNames?.length > 0 &&
      rsvpSummary.confirmedCount < rsvpSummary.totalCount
    ) {
      const namesStr = formatSpanishList(rsvpSummary.attendingNames);
      msg = `¡Hola Edis y Dania! 💍✨ De parte de *${displaySalutation}*, confirmamos con mucha alegría la asistencia de *${rsvpSummary.confirmedCount} de ${rsvpSummary.totalCount} pases* (*${namesStr}*) a su boda el 21 de Noviembre en Calan Park. ¡Muchas gracias por la invitación!`;
    } else {
      const seatsText = `${displaySeats} ${displaySeats === 1 ? 'pase' : 'pases'}`;
      const namePart =
        displaySalutation && displaySalutation !== 'Invitado Especial'
          ? displaySeats === 1
            ? `Soy *${displaySalutation}* (${seatsText}) y confirmo`
            : `Somos *${displaySalutation}* (${seatsText}) y confirmamos`
          : `Hola Edis y Dania, confirmo`;

      msg = `¡Hola Edis y Dania! 💍✨ ${namePart} con mucha alegría ${
        displaySeats === 1 ? 'mi' : 'nuestra'
      } asistencia a su boda el 21 de Noviembre en Calan Park. ¡Muchas gracias por la invitación!`;
    }

    openWhatsApp('+50487788207', msg);
  };

  // =========================================================================
  // MATEMÁTICA FÍSICA DE EXTRACCIÓN DE LA TARJETA DE BIENVENIDA DESDE EL SOBRE
  // =========================================================================
  const pull = isSealBroken ? scrollState.pull : 0;

  // Fase 1 (pull 0.00 -> 0.68): El invitado saca la Tarjeta de Bienvenida mientras el sobre verde baja
  const tPull = linearProgress(pull, 0.0, 0.68);
  // Fase 2 (pull 0.65 -> 1.00): La Tarjeta de Bienvenida ya salió completa del sobre y se asienta al 100%
  const tSettle = subProgress(pull, 0.65, 1.0);

  // Coordenadas del Sobre (en % de la altura de la Tarjeta de Bienvenida)
  const envTopPct = !isSealBroken
    ? 25
    : 30 + 82 * tPull + 14 * tSettle;
  const envOpacity = 1 - subProgress(pull, 0.66, 0.94);

  // Coordenadas de la Tarjeta Editorial de Bienvenida
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

  // Recorte inferior invisible detrás del bolsillo verde mientras aún está dentro del sobre
  const clipBottomPct = !isPeekReady
    ? 44
    : Math.max(0, 32 * (1 - linearProgress(tPull, 0.0, 0.42)));

  const isActivelyScrollingPull = pull > 0.008;

  // =========================================================================
  // PROGRESOS DE ENSAMBLAJE POR CAPA REAL DE CANVA (STAGE 1: INVITACIÓN A6)
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
              title="Volver a ver el sobre"
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
          PORTADA INTERACTIVA:
          SOBRE 3D VERDE SALVIA -> EXTRACCIÓN CON SCROLL DE TU TARJETA EDITORIAL DE BIENVENIDA
      ===================================================================== */}
      <section
        ref={heroPullSectionRef}
        className={`relative z-10 w-full ${
          isSealBroken ? 'h-[250vh]' : 'h-[100dvh] overflow-hidden'
        }`}
      >
        <div className="sticky top-0 h-[100dvh] w-full flex flex-col items-center justify-center px-4 pt-14 pb-4 overflow-hidden">
          {/* Ramas de eucalipto en las esquinas con movimiento continuo de brisa */}
          <div className="pointer-events-none select-none absolute -top-4 -left-6 w-48 sm:w-64 md:w-80 opacity-95">
            <img
              src="/invitacion/leaf-top-left.png"
              alt=""
              className="w-full h-auto animate-breeze-a"
            />
          </div>

          <div className="pointer-events-none select-none absolute -bottom-4 -right-6 w-48 sm:w-64 md:w-80 opacity-95">
            <img
              src="/invitacion/leaf-bottom-right.png"
              alt=""
              className="w-full h-auto animate-breeze-b"
            />
          </div>

          {/* ESCENARIO PROPORCIONAL: LA TARJETA EDITORIAL DE BIENVENIDA VIVE DENTRO DEL SOBRE 3D */}
          <div
            className="relative max-w-lg w-full"
            style={{ perspective: '1600px' }}
          >
            {/* Destinatario personalizado encima del sobre mientras está cerrado */}
            <div
              className={`absolute -top-2 left-[-4%] right-[-4%] z-40 text-center space-y-1.5 transition-all duration-500 ${
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

            {/* CAPA Z-10: FORRO INTERIOR MARFIL ACUARELA DEL SOBRE (detrás de la tarjeta) */}
            {envOpacity > 0.01 && (
              <div
                className="absolute left-[-3%] w-[106%] h-[54%] z-10 pointer-events-none"
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

            {/* SOLAPA SUPERIOR 3D INDEPENDIENTE (gira continuo de 0° a 180°, pasa de z-35 a z-12 en 90°) */}
            {envOpacity > 0.01 && (
              <div
                className="absolute left-[-3%] w-[106%] h-[33.5%] pointer-events-none"
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
                {/* Cara exterior verde salvia */}
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

                {/* Cara interior marfil acuarela */}
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
                CAPA Z-20: TU TARJETA EDITORIAL DE BIENVENIDA FAVORITA
                (Guardada dentro del sobre verde salvia; tú mismo la estiras y sacas con el scroll)
            =============================================================== */}
            <div
              className="relative z-20 w-full text-center space-y-4 sm:space-y-5 bg-white/95 backdrop-blur-md rounded-3xl p-7 sm:p-10 shadow-[0_25px_70px_-15px_rgba(36,59,43,0.18)] border border-[#C5A880]/55 will-change-transform"
              style={{
                opacity: isSealBroken ? 1 : 0,
                pointerEvents: isSealBroken ? 'auto' : 'none',
                transform: `translate3d(0, ${cardTranslateYPct}%, 0) scale(${cardScale})`,
                clipPath:
                  clipBottomPct > 0.2
                    ? `inset(0% 0% ${clipBottomPct.toFixed(2)}% 0% round 24px)`
                    : 'none',
                transition: isActivelyScrollingPull
                  ? 'none'
                  : 'transform 680ms cubic-bezier(0.22, 1, 0.36, 1), opacity 250ms ease',
              }}
            >
              <EditorialInnerFrame insetClass="inset-3 sm:inset-4" />

              {/* Sello Circular Dorado E & D con Destello Animado (5 toques desbloquean el panel para Edis) */}
              <div
                onClick={handleSecretMonogramTap}
                className="relative mx-auto w-[84px] h-[84px] sm:w-[88px] sm:h-[88px] rounded-full bg-gradient-to-br from-[#DFC59B] via-[#B89668] to-[#8C6D43] p-[3px] shadow-[0_10px_25px_-5px_rgba(140,109,67,0.45)] flex items-center justify-center select-none overflow-hidden"
              >
                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-golden-shimmer pointer-events-none" />
                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#FAF8F3] to-[#F2ECE1] border border-[#C5A880]/80 flex flex-col items-center justify-center">
                  <span className="font-serif text-xl font-bold text-[#243B2B] tracking-wider leading-none">
                    E<span className="text-[#B38E5D] italic font-serif text-base mx-0.5">&</span>D
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.22em] text-[#8C7756] font-semibold mt-1">
                    21 • 11 • 26
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-0.5">
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.32em] text-[#8C7756] font-bold">
                  Nuestra Boda
                </p>
                <img
                  src="/invitacion/layers/text-edis-dania.png"
                  alt="Edis y Dania"
                  className="w-52 sm:w-64 mx-auto select-none pointer-events-none"
                />
              </div>

              <GoldenBotanicalDivider progress={1} />

              {/* Destinatario personalizado */}
              <div className="relative bg-gradient-to-b from-[#F7F9F5] to-[#EFF4EC] border border-[#C5A880]/45 rounded-2xl px-5 py-3.5 sm:py-4 space-y-1.5 shadow-sm">
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#7A6B53] font-semibold block">
                  Invitación Especial Para
                </span>
                <p className="font-serif text-xl sm:text-2xl font-bold text-[#243B2B]">
                  {displaySalutation}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#C5A880]/55 text-[#3B6E42] text-xs font-bold shadow-sm mt-1">
                  <Ticket size={13} className="text-[#B38E5D]" />
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
                className="relative z-30 overflow-hidden w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#243B2B] via-[#32513C] to-[#243B2B] hover:brightness-110 text-white text-xs sm:text-sm font-semibold tracking-wide shadow-lg hover:shadow-xl border border-[#C5A880]/50 transition-all cursor-pointer group"
              >
                <span className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-golden-shimmer pointer-events-none" />
                <Heart size={15} className="text-[#E0C59B] fill-[#E0C59B]" />
                <span>Ver Nuestra Invitación</span>
                <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform text-[#E0C59B]" />
              </button>
            </div>

            {/* ===============================================================
                CAPA Z-30: BOLSILLO FRONTAL DEL SOBRE VERDE SALVIA
                (Por delante de la parte inferior de la Tarjeta de Bienvenida)
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
                className={`absolute left-[-3%] w-[106%] h-[54%] z-30 ${
                  !isSealBroken ? 'cursor-pointer' : 'pointer-events-none'
                }`}
                style={{
                  top: `${envTopPct}%`,
                  opacity: envOpacity,
                  transition: isActivelyScrollingPull
                    ? 'none'
                    : 'top 650ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
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

                <div className="absolute bottom-3 inset-x-6 text-center pointer-events-none">
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.26em] text-[#EAD6B5]/90 font-medium">
                    Edis & Dania • 21.11.2026
                  </span>
                </div>
              </div>
            )}

            {/* CAPA Z-40: SELLO DE LACRE DORADO ARTESANAL "E & D" */}
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
                  top: `${envTopPct + 30.2}%`,
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
              className={`absolute -bottom-3 left-[-6%] right-[-6%] z-40 flex flex-col items-center gap-2 transition-all duration-400 ${
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

            {/* Indicador táctil DESPUÉS de abrir la solapa: invita a deslizar para sacar la tarjeta */}
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
                  Desliza para sacar tu tarjeta
                </span>
                <ChevronDown size={16} className="animate-bounce text-[#B38E5D]" />
              </div>
            </div>
          </div>

          {/* Indicador "DESLIZA HACIA ABAJO" una vez la Tarjeta de Bienvenida salió completa (idéntico a tu captura) */}
          <div
            className="mt-4 flex flex-col items-center gap-1 text-[#7A6B53] pointer-events-none transition-opacity duration-300"
            style={{ opacity: pull > 0.88 ? 1 : 0 }}
          >
            <span className="text-[10px] uppercase tracking-[0.26em] font-semibold">
              Desliza hacia abajo
            </span>
            <ChevronDown size={18} className="animate-bounce text-[#4C8B54]" />
          </div>
        </div>
      </section>

      {/* =====================================================================
          STAGE 1: LA INVITACIÓN PRINCIPAL A6 DE CANVA (SE ARMA PIEZA POR PIEZA + BRISA VIVA)
      ===================================================================== */}
      <section
        ref={stage1Ref}
        className="relative z-10 py-6 sm:py-10 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col items-center"
      >
        <div className="mb-4 text-center space-y-1">
          <GoldenBotanicalDivider progress={s1Watercolors} />
        </div>

        {/* Marco exterior de lujo con filo dorado */}
        <div className="p-1.5 sm:p-2 rounded-[26px] sm:rounded-[30px] bg-gradient-to-br from-[#E5D1B0]/70 via-white/80 to-[#C5A880]/65 shadow-[0_28px_75px_-15px_rgba(31,58,46,0.3)] w-full max-w-[512px]">
          <div
            className="relative w-full aspect-[5/7] rounded-2xl sm:rounded-3xl border border-[#C5A880]/60 overflow-hidden select-none bg-[#FAF9F6]"
            style={{ containerType: 'inline-size' }}
          >
            <EditorialInnerFrame insetClass="inset-2.5 sm:inset-3.5" />

            {/* 1. FONDO DE PAPEL ACUARELA */}
            <img
              src="/invitacion/layers/paper-bg.jpg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* 2. MANCHAS DE ACUARELA VERDE SALVIA CON RESPIRACIÓN ORGÁNICA */}
            <div
              className="absolute pointer-events-none will-change-transform"
              style={{
                left: '-46.75%',
                top: '-2.06%',
                width: '94.17%',
                height: '65.31%',
                opacity: 0.51 * s1Watercolors,
                transform: `translate3d(${(1 - s1Watercolors) * -60}px, ${(1 - s1Watercolors) * -40}px, 0) scale(${0.7 + 0.3 * s1Watercolors})`,
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
                left: '80.9%',
                top: '20.06%',
                width: '91.14%',
                height: '63.21%',
                opacity: 0.51 * s1Watercolors,
                transform: `translate3d(${(1 - s1Watercolors) * 60}px, 0, 0) scale(${0.7 + 0.3 * s1Watercolors})`,
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
                left: '47.42%',
                top: '67.61%',
                width: '92.43%',
                height: '64.1%',
                opacity: 0.39 * s1Watercolors,
                transform: `translate3d(${(1 - s1Watercolors) * 50}px, ${(1 - s1Watercolors) * 50}px, 0) scale(${0.7 + 0.3 * s1Watercolors})`,
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

            {/* 3. FLORES Y HOJAS CON ENSAMBLAJE POR SCROLL + BRISA VIVA CONTINUA */}
            <div
              className="absolute pointer-events-none will-change-transform"
              style={{
                left: '-19.35%',
                top: '3.91%',
                width: '39.38%',
                height: '39.13%',
                opacity: s1TopLeaves,
                transform: `translate3d(${(1 - s1TopLeaves) * -130}px, ${(1 - s1TopLeaves) * -80}px, 0) rotate(${(1 - s1TopLeaves) * -25}deg) scale(${0.75 + 0.25 * s1TopLeaves})`,
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
                left: '82.07%',
                top: '-1.06%',
                width: '38.91%',
                height: '49.08%',
                opacity: s1TopRoses,
                transform: `translate3d(${(1 - s1TopRoses) * 130}px, ${(1 - s1TopRoses) * -75}px, 0) rotate(${-23.9 + (1 - s1TopRoses) * 28}deg) scale(${0.75 + 0.25 * s1TopRoses})`,
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
                left: '-22.56%',
                top: '43.05%',
                width: '53.17%',
                height: '67.07%',
                opacity: s1LeftRoses,
                transform: `translate3d(${(1 - s1LeftRoses) * -150}px, ${(1 - s1LeftRoses) * 70}px, 0) rotate(${14.96 - (1 - s1LeftRoses) * 22}deg) scale(${0.75 + 0.25 * s1LeftRoses})`,
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
                left: '66.66%',
                top: '68.76%',
                width: '39.38%',
                height: '39.13%',
                opacity: s1BotLeaves,
                transform: `translate3d(${(1 - s1BotLeaves) * 130}px, ${(1 - s1BotLeaves) * 90}px, 0) rotate(${(1 - s1BotLeaves) * 25}deg) scale(${0.75 + 0.25 * s1BotLeaves})`,
              }}
            >
              <img
                src="/invitacion/layers/olive-branch.png"
                alt=""
                aria-hidden="true"
                className="w-full h-full animate-breeze-b"
              />
            </div>

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
                top: '72.9%',
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
              className="absolute left-[14%] w-[72%] text-center pointer-events-none will-change-transform leading-[1.32]"
              style={{
                top: '79.2%',
                fontFamily: "'Simonetta', serif",
                color: '#3A3D36',
                fontSize: 'clamp(9px, 2.6cqw, 14px)',
                opacity: s1Dress,
                transform: `translate3d(0, ${(1 - s1Dress) * 65}px, 0)`,
              }}
            >
              <p>CÓDIGO DE VESTIMENTA: FORMAL</p>
              <p
                className="italic mt-[0.4cqw]"
                style={{ fontSize: 'clamp(8px, 2.2cqw, 12px)', color: '#4E5349' }}
              >
                Mujeres: cualquier color, menos blanco
              </p>
            </div>

            {/* 6. FIRMA CALIGRÁFICA TRANSPARENTE "Te esperamos" */}
            <img
              src="/invitacion/layers/text-te-esperamos.png"
              alt="Te esperamos"
              className="absolute pointer-events-none will-change-transform"
              style={{
                left: '22.0%',
                top: '87.4%',
                width: '56.0%',
                height: '10.0%',
                opacity: s1Sign,
                transform: `translate3d(0, ${(1 - s1Sign) * 55}px, 0) scale(${0.78 + 0.22 * s1Sign})`,
              }}
            />
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
                href="https://www.google.com/maps/search/?api=1&query=15.3963411,-88.0259901&query_place_id=ChIJz-ALtkNnZo8R1gEw4uzkS9k"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#243B2B] to-[#34543E] hover:brightness-110 text-white text-xs font-semibold shadow-sm border border-[#C5A880]/45 transition-all"
              >
                <MapPin size={14} className="text-[#E0C59B]" />
                <span>Ver Ubicación en Google Maps</span>
                <ExternalLink size={12} />
              </a>
              <a
                href="https://ul.waze.com/ul?place=ChIJz-ALtkNnZo8R1gEw4uzkS9k&ll=15.39634110%2C-88.02599010&navigate=yes&utm_campaign=live_map&utm_source=waze_website&utm_medium=lm_share_location"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FAF8F4] hover:bg-[#F0ECE2] text-[#243B2B] border border-[#C5A880]/55 text-xs font-semibold transition-all"
              >
                <span>Abrir en Waze</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-[#C5A880]/30 space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-[#3B6E42] font-bold text-xs uppercase tracking-wider">
              <Sparkles size={14} className="text-[#B38E5D]" />
              <span>Código de Vestimenta: Formal</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 font-medium max-w-md mx-auto">
              Mujeres: pueden usar <strong className="text-[#243B2B]">cualquier color, menos blanco</strong> <span className="text-stone-500 italic">(reservado para la novia)</span>.
            </p>
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
              {displaySeats > 1
                ? 'Para nosotros es muy importante contar con ustedes. Pueden confirmar todos los pases a la vez o elegir integrante por integrante (1 por 1).'
                : 'Para nosotros es muy importante contar contigo. Confirma tu asistencia aquí mismo en 1 clic o envíanos un mensaje por WhatsApp.'}
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

              {rsvpError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700 font-medium text-center">
                  {rsvpError}
                </div>
              )}

              {/* VISTA RESUMEN CUANDO YA CONFIRMÓ (Y NO ESTÁ EDITANDO) */}
              {(rsvpSubmitted || activeCard?.statusSummary?.isAllConfirmed) && !isEditingRsvp ? (
                <div className="space-y-3">
                  {rsvpSummary?.allDeclined ? (
                    <div className="rounded-2xl bg-white/95 border border-stone-300/80 p-4 text-center space-y-1.5 shadow-sm">
                      <p className="font-serif text-base sm:text-lg font-bold text-stone-800">
                        Respuesta registrada para {displaySalutation}
                      </p>
                      <p className="text-xs text-stone-600">
                        Nos indicaron que no podrán acompañarnos en esta ocasión. ¡Muchas gracias por avisarnos, los llevamos en nuestro corazón!
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-gradient-to-b from-emerald-50/90 to-white border border-emerald-300/80 p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-center gap-2 text-emerald-800">
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                        <p className="font-serif text-base sm:text-lg font-bold text-[#243B2B]">
                          {rsvpSummary?.mode === '1x1' &&
                          rsvpSummary.confirmedCount < rsvpSummary.totalCount
                            ? `¡Asistencia Confirmada! (${rsvpSummary.confirmedCount} de ${rsvpSummary.totalCount} pases)`
                            : `¡Asistencia Confirmada para ${displaySalutation}!`}
                        </p>
                      </div>

                      {rsvpSummary?.attendingNames?.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 text-center">
                            Integrantes confirmados
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {rsvpSummary.attendingNames.map((name, idx) => (
                              <span
                                key={`att-${idx}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-[11px] font-semibold"
                              >
                                <Check size={11} className="text-emerald-700" />
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {rsvpSummary?.declinedNames?.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 text-center">
                            No podrán asistir
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {rsvpSummary.declinedNames.map((name, idx) => (
                              <span
                                key={`dec-${idx}`}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-500 text-[11px]"
                              >
                                <X size={10} />
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsEditingRsvp(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF8F4] text-[#5C5343] hover:text-[#243B2B] border border-[#C5A880]/55 text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      <span>Modificar confirmación</span>
                    </button>
                  </div>
                </div>
              ) : displaySeats > 1 ? (
                /* MODO MÚLTIPLES PASES (PAREJA O FAMILIA, EJ. 5 INTEGRANTES): TODOS A LA VEZ O 1x1 */
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A6B53] text-center">
                    ¿Cómo desean confirmar su asistencia?
                  </p>

                  {/* OPCIÓN 1: Confirmar a TODOS en 1 clic */}
                  <button
                    type="button"
                    disabled={isSubmittingRsvp}
                    onClick={handleDirectConfirmCard}
                    className="relative overflow-hidden w-full py-3.5 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md border border-[#C5A880]/45 bg-gradient-to-r from-[#243B2B] via-[#32513C] to-[#243B2B] hover:brightness-110 disabled:opacity-60 text-white transition-all cursor-pointer"
                  >
                    <span className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-golden-shimmer pointer-events-none" />
                    <CheckCircle2 size={18} className="text-[#E0C59B] shrink-0" />
                    <span>
                      {isSubmittingRsvp && !isOneByOneOpen
                        ? 'Guardando confirmación...'
                        : `Confirmar Todos a la vez (${displaySeats} Pases)`}
                    </span>
                  </button>

                  {/* OPCIÓN 2: Confirmar 1 por 1 (Desplegable bajo demanda) */}
                  <button
                    type="button"
                    disabled={isSubmittingRsvp}
                    onClick={handleToggleOneByOne}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-between gap-2 border transition-all cursor-pointer ${
                      isOneByOneOpen
                        ? 'bg-[#FAF8F4] border-[#B38E5D] text-[#243B2B] shadow-sm'
                        : 'bg-white/95 hover:bg-[#FAF8F4] border-[#C5A880]/65 text-[#243B2B] shadow-sm'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Users size={16} className="text-[#B38E5D] shrink-0" />
                      <span>Confirmar 1 por 1 (Elegir quiénes asisten)</span>
                    </span>
                    {isOneByOneOpen ? (
                      <ChevronUp size={17} className="text-[#8C7756] shrink-0" />
                    ) : (
                      <ChevronDown size={17} className="text-[#8C7756] shrink-0" />
                    )}
                  </button>

                  {/* PANEL INTERACTIVO 1x1 */}
                  {isOneByOneOpen && (
                    <div className="rounded-2xl bg-white/95 border border-[#C5A880]/60 p-3.5 sm:p-4 space-y-3.5 shadow-sm">
                      {isLoadingMembers ? (
                        <div className="py-6 flex flex-col items-center justify-center gap-2.5 text-stone-600">
                          <span className="w-6 h-6 rounded-full border-2 border-[#C5A880]/40 border-t-[#243B2B] animate-spin" />
                          <span className="text-xs font-medium">
                            Cargando integrantes de {displaySalutation}...
                          </span>
                        </div>
                      ) : (
                        <>
                          {(() => {
                            const selectedSeats = memberSelections
                              .filter((m) => m.attending)
                              .reduce((sum, m) => sum + (m.seats || 1), 0);
                            const totalLoadedSeats =
                              memberSelections.reduce((sum, m) => sum + (m.seats || 1), 0) ||
                              displaySeats;

                            return (
                              <>
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200/80">
                                  <span className="text-[11px] font-bold text-[#243B2B]">
                                    Seleccionados:{' '}
                                    <span className="text-emerald-700">
                                      {selectedSeats} de {totalLoadedSeats}
                                    </span>{' '}
                                    {totalLoadedSeats === 1 ? 'pase' : 'pases'}
                                  </span>

                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() => handleSetAllMembersLocal(true)}
                                      className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold transition-colors cursor-pointer"
                                    >
                                      Todos
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetAllMembersLocal(false)}
                                      className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 font-semibold transition-colors cursor-pointer"
                                    >
                                      Ninguno
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {memberSelections.map((member, idx) => (
                                    <div
                                      key={member.key}
                                      className={`rounded-xl p-2.5 sm:px-3 sm:py-2.5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                        member.attending
                                          ? 'bg-emerald-50/45 border-emerald-200/90'
                                          : 'bg-stone-50/90 border-stone-200/80'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span
                                          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                            member.attending
                                              ? 'bg-emerald-600 text-white'
                                              : 'bg-stone-300 text-stone-700'
                                          }`}
                                        >
                                          {idx + 1}
                                        </span>
                                        <span
                                          className={`text-xs sm:text-sm font-semibold leading-snug ${
                                            member.attending
                                              ? 'text-[#243B2B]'
                                              : 'text-stone-500 line-through'
                                          }`}
                                        >
                                          {member.name}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 sm:flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSetMemberAttending(member.key, true)
                                          }
                                          className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                            member.attending
                                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                              : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-300 hover:text-emerald-700'
                                          }`}
                                        >
                                          <Check size={12} />
                                          <span>Asiste</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSetMemberAttending(member.key, false)
                                          }
                                          className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                            !member.attending
                                              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                              : 'bg-white text-stone-600 border-stone-200 hover:border-rose-300 hover:text-rose-700'
                                          }`}
                                        >
                                          <X size={12} />
                                          <span>No asiste</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  disabled={isSubmittingRsvp}
                                  onClick={handleSaveOneByOneRsvp}
                                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60 ${
                                    selectedSeats > 0
                                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600'
                                      : 'bg-stone-700 hover:bg-stone-800 text-white border border-stone-600'
                                  }`}
                                >
                                  {selectedSeats > 0 ? (
                                    <CheckCircle2 size={16} className="text-emerald-200 shrink-0" />
                                  ) : (
                                    <UserX size={16} className="text-stone-300 shrink-0" />
                                  )}
                                  <span>
                                    {isSubmittingRsvp
                                      ? 'Guardando selección...'
                                      : selectedSeats === 0
                                        ? 'Confirmar que ninguno podrá asistir'
                                        : selectedSeats === totalLoadedSeats
                                          ? `Guardar Confirmación (Todos asisten • ${selectedSeats})`
                                          : `Guardar Confirmación (${selectedSeats} de ${totalLoadedSeats} asisten)`}
                                  </span>
                                </button>
                              </>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  )}

                  {/* Opción discreta para declinar todos o cancelar edición */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-0.5">
                    {!isOneByOneOpen && (
                      <button
                        type="button"
                        disabled={isSubmittingRsvp}
                        onClick={handleDeclineCardAll}
                        className="text-[11px] font-medium text-stone-500 hover:text-rose-700 underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        No podremos asistir en esta ocasión
                      </button>
                    )}
                    {isEditingRsvp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingRsvp(false);
                          setIsOneByOneOpen(false);
                        }}
                        className="text-[11px] font-semibold text-[#7A6B53] hover:text-[#243B2B] underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Cancelar cambios
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* MODO INDIVIDUAL (1 PASE) */
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={isSubmittingRsvp}
                    onClick={handleDirectConfirmCard}
                    className="relative overflow-hidden w-full py-3.5 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md border border-[#C5A880]/45 bg-gradient-to-r from-[#243B2B] via-[#32513C] to-[#243B2B] hover:brightness-110 disabled:opacity-60 text-white transition-all cursor-pointer"
                  >
                    <span className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-golden-shimmer pointer-events-none" />
                    <CheckCircle2 size={18} className="text-[#E0C59B]" />
                    <span>
                      {isSubmittingRsvp
                        ? 'Guardando confirmación...'
                        : `Confirmar mi Asistencia (1 Pase)`}
                    </span>
                  </button>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={isSubmittingRsvp}
                      onClick={handleDeclineCardAll}
                      className="text-[11px] font-medium text-stone-500 hover:text-rose-700 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      No podré asistir en esta ocasión
                    </button>
                    {isEditingRsvp && (
                      <button
                        type="button"
                        onClick={() => setIsEditingRsvp(false)}
                        className="text-[11px] font-semibold text-[#7A6B53] hover:text-[#243B2B] underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              )}
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
              Código de Vestimenta: <strong className="text-[#243B2B]">FORMAL</strong> (Mujeres: cualquier color, menos blanco) • Teléfono: <strong className="text-[#243B2B]">+504 8778-8207</strong>
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
