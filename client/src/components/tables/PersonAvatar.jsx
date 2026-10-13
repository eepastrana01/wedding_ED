import React, { useState } from 'react';
import { Utensils, AlertCircle, X, Phone, Heart, RefreshCw } from 'lucide-react';
import { detectGuestGender, setGuestGenderOverride } from '../../utils/genderUtils';

// Generador determinista de color y estilo basado en el ID y nombre del invitado
function getAvatarStyle(guest, isBride = false, isGroom = false, genderOverride = null) {
  if (isBride) {
    return {
      type: 'bride',
      hairColor: '#3D2817', // Castaño / elegante
      hairStyle: 'updo_veil',
      clothingColor: '#FFFFFF',
      accentColor: '#F5E6D3',
      necklace: true,
      label: 'Novia',
    };
  }

  if (isGroom) {
    return {
      type: 'groom',
      hairColor: '#1F1F1F',
      hairStyle: 'classic_short',
      clothingColor: '#1C1C1E',
      tieColor: '#D9777F', // Rosa empolvado / corbatín elegante
      accentColor: '#FFFFFF',
      label: 'Novio',
    };
  }

  // Hash determinista del nombre o ID para que el avatar mantenga su ropa favorita
  const seed = (guest?.id || 1) * 31 + (guest?.name?.charCodeAt(0) || 65);
  
  // Paleta de trajes y vestidos de boda (editorial & luxury)
  const dressColors = [
    '#EBBEC4', // Rosa empolvado / Blush
    '#A5C4B4', // Verde salvia
    '#B8C5E6', // Azul cielo
    '#D6C2E6', // Lavanda
    '#F2DEC2', // Champaña
    '#DCAE96', // Terracota suave
  ];

  const suitColors = [
    '#253443', // Azul medianoche
    '#363D45', // Gris carbón
    '#1F3A2E', // Verde bosque / boda
    '#4A4A4A', // Grafito
    '#2E4A62', // Azul marino
  ];

  const hairColors = [
    '#1A1A1A', // Negro
    '#3B271A', // Castaño oscuro
    '#5C3D2E', // Castaño medio
    '#B8860B', // Rubio dorado
    '#6E3725', // Cobrizo
  ];

  const hairColor = hairColors[seed % hairColors.length];

  // Detección precisa de género por catálogo de nombres de la boda
  const detected = genderOverride || detectGuestGender(guest);
  const isFemale = detected === 'woman';

  if (isFemale) {
    return {
      type: 'woman',
      hairColor,
      hairStyle: (seed % 3 === 0) ? 'bun' : 'long',
      clothingColor: dressColors[seed % dressColors.length],
      necklace: true,
    };
  } else {
    return {
      type: 'man',
      hairColor,
      hairStyle: 'short',
      clothingColor: suitColors[seed % suitColors.length],
      tieColor: dressColors[(seed + 1) % dressColors.length],
      accentColor: '#FFFFFF',
    };
  }
}

export function PersonAvatar({
  guest,
  isBride = false,
  isGroom = false,
  seatNumber,
  namePosition = 'radial', // 'radial', 'top', 'bottom', 'side'
  radialAngle = 0, // En radianes para rotar la etiqueta hacia afuera de la mesa
  onRemove,
  onDragStart,
  onClick,
  showName = true,
  size = 46, // Tamaño en px
}) {
  const [genderOverride, setGenderOverride] = useState(null);
  const style = getAvatarStyle(guest, isBride, isGroom, genderOverride);
  const hasDietary = Boolean(guest?.dietary_notes && guest?.dietary_notes.trim());
  const fullName = isBride ? 'Dania (Novia)' : isGroom ? 'Eduardo (Novio)' : guest?.name || 'Invitado';

  const handleToggleGender = (e) => {
    e.stopPropagation();
    if (!guest) return;
    const currentGender = style.type === 'woman' ? 'woman' : 'man';
    const newGender = currentGender === 'woman' ? 'man' : 'woman';
    setGuestGenderOverride(guest.id, newGender);
    setGenderOverride(newGender);
  };

  // Cortar nombre para visualización limpia en 2 líneas si es largo
  const formatDisplayName = (name) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]}\n${parts[1]}`;
    return `${parts[0]}\n${parts[1]}`;
  };

  // Cálculo de rotación del texto de la persona para que apunte hacia afuera del círculo de la mesa
  // Convertir radianes a grados
  const deg = (radialAngle * 180) / Math.PI;
  // Normalizar ángulo entre -180 y 180
  const normalizedDeg = ((deg + 180) % 360) - 180;
  // Si el texto queda de cabeza (entre 90 y 270 grados o < -90 / > 90), voltearlo 180 para que siempre se lea derecho
  const textAngle = (normalizedDeg > 90 || normalizedDeg < -90) ? normalizedDeg + 180 : normalizedDeg;

  return (
    <div
      draggable={Boolean(guest && onDragStart)}
      onDragStart={onDragStart}
      onClick={onClick}
      className="relative group/person select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Ilustración SVG 360 Vista Cenital (Top-Down Person) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className="transition-transform duration-200 group-hover/person:scale-115 drop-shadow-md overflow-visible"
      >
        <defs>
          {/* Sombras suaves para dar relieve y volumen 3D */}
          <filter id={`shadow-${guest?.id || (isBride ? 'b' : 'g')}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* 1. Respaldo de la Silla de banquete (Detrás de los hombros) */}
        <path
          d="M 12 50 C 14 58, 50 58, 52 50 C 50 47, 14 47, 12 50 Z"
          fill="#D1C7BD"
          stroke="#9E9284"
          strokeWidth="1.5"
        />

        {/* 2. Hombros y Torso con ropa formal de gala */}
        {style.type === 'groom' ? (
          // Traje de novio con solapas y corbatín
          <g>
            {/* Saco negro */}
            <path
              d="M 14 44 C 14 34, 50 34, 50 44 L 46 54 C 36 57, 28 57, 18 54 Z"
              fill={style.clothingColor}
              stroke="#0D0D0E"
              strokeWidth="1"
            />
            {/* Camisa blanca pechera */}
            <path d="M 27 38 L 37 38 L 33 50 L 31 50 Z" fill="#FFFFFF" />
            {/* Corbatín rosa */}
            <path
              d="M 29 40 L 35 44 L 35 40 L 29 44 Z"
              fill={style.tieColor}
              stroke="#B35E66"
              strokeWidth="0.8"
            />
            <circle cx="32" cy="42" r="1.5" fill="#B35E66" />
          </g>
        ) : style.type === 'bride' ? (
          // Vestido de novia blanco con escote elegante y velo
          <g>
            {/* Hombros y vestido blanco */}
            <path
              d="M 14 44 C 14 34, 50 34, 50 44 L 48 54 C 36 58, 28 58, 16 54 Z"
              fill="#FFFFFF"
              stroke="#E2DDD5"
              strokeWidth="1.2"
            />
            {/* Escote corazón / detalle perlas */}
            <path
              d="M 24 41 C 28 44, 36 44, 40 41"
              stroke="#EAD5C5"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="28" cy="42" r="1" fill="#FCECE0" />
            <circle cx="32" cy="43" r="1" fill="#FCECE0" />
            <circle cx="36" cy="42" r="1" fill="#FCECE0" />
          </g>
        ) : style.type === 'man' ? (
          // Traje masculino de invitado con corbata
          <g>
            <path
              d="M 14 44 C 14 34, 50 34, 50 44 L 46 54 C 36 57, 28 57, 18 54 Z"
              fill={style.clothingColor}
              stroke="#1A2530"
              strokeWidth="1"
            />
            {/* Cuello de camisa */}
            <path d="M 28 38 L 36 38 L 34 46 L 30 46 Z" fill="#FFFFFF" />
            {/* Corbata */}
            <path d="M 31 40 L 33 40 L 34 49 L 32 52 L 30 49 Z" fill={style.tieColor} />
          </g>
        ) : (
          // Vestido de dama/invitada
          <g>
            <path
              d="M 14 44 C 14 34, 50 34, 50 44 L 47 54 C 36 57, 28 57, 17 54 Z"
              fill={style.clothingColor}
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="1"
            />
            {/* Escote y collar de perlas */}
            <path
              d="M 25 41 C 28 44, 36 44, 39 41"
              stroke="#E8B896"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="28" cy="42.5" r="1" fill="#FFFFFF" />
            <circle cx="32" cy="43.5" r="1" fill="#FFFFFF" />
            <circle cx="36" cy="42.5" r="1" fill="#FFFFFF" />
          </g>
        )}

        {/* 3. Cabeza y Piel (Vista cenital desde arriba) */}
        <circle cx="32" cy="27" r="12" fill="#F5D0B5" stroke="#E0B69B" strokeWidth="0.8" />

        {/* 4. Cabello peinado con brillo */}
        {style.type === 'bride' ? (
          // Velo y peinado recogido de novia
          <g>
            <path
              d="M 21 28 C 21 16, 43 16, 43 28 C 40 23, 24 23, 21 28 Z"
              fill={style.hairColor}
            />
            {/* Diadema / Tiara de novia brillante */}
            <path d="M 23 23 C 27 20, 37 20, 41 23" stroke="#FDE68A" strokeWidth="1.5" fill="none" />
            <circle cx="32" cy="21" r="1.5" fill="#F59E0B" />
            {/* Velo blanco traslúcido cayendo hacia atrás */}
            <path
              d="M 20 25 C 16 38, 48 38, 44 25 C 40 32, 24 32, 20 25 Z"
              fill="rgba(255, 255, 255, 0.7)"
              stroke="#E5E7EB"
              strokeWidth="0.8"
            />
          </g>
        ) : style.hairStyle === 'bun' ? (
          // Chongo / Recogido elegante femenino
          <g>
            <path
              d="M 21 28 C 21 17, 43 17, 43 28 C 39 23, 25 23, 21 28 Z"
              fill={style.hairColor}
            />
            {/* Chongo central */}
            <circle cx="32" cy="23" r="5" fill={style.hairColor} stroke="rgba(0,0,0,0.2)" strokeWidth="0.6" />
          </g>
        ) : style.hairStyle === 'long' ? (
          // Cabello largo con caída
          <g>
            <path
              d="M 20 29 C 19 16, 45 16, 44 29 C 41 22, 23 22, 20 29 Z"
              fill={style.hairColor}
            />
            {/* Mechones cayendo a los hombros */}
            <path d="M 19 28 C 17 38, 20 44, 21 46" stroke={style.hairColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 45 28 C 47 38, 44 44, 43 46" stroke={style.hairColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </g>
        ) : (
          // Cabello corto masculino con raya y brillo
          <g>
            <path
              d="M 21 28 C 21 16, 43 16, 43 28 C 39 22, 25 22, 21 28 Z"
              fill={style.hairColor}
            />
            {/* Brillo del cabello */}
            <path
              d="M 26 21 C 29 19, 36 19, 39 21"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1.2"
              fill="none"
            />
          </g>
        )}
      </svg>

      {/* Indicador de menú especial / Alergia (Badge pequeño) */}
      {hasDietary && (
        <span 
          className="absolute -top-1 -right-1 z-30 w-4 h-4 rounded-full bg-amber-500 border-2 border-white text-white flex items-center justify-center text-[9px] font-bold shadow-xs animate-bounce"
          title={`Menú Especial: ${guest.dietary_notes}`}
        >
          !
        </span>
      )}

      {/* Botón rápido desasignar (X) que aparece en hover */}
      {guest && onRemove && !isBride && !isGroom && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(guest);
          }}
          className="absolute -bottom-1 -right-1 z-30 w-4 h-4 rounded-full bg-stone-800 text-white opacity-0 group-hover/person:opacity-100 hover:bg-rose-600 flex items-center justify-center transition-opacity shadow-sm cursor-pointer"
          title={`Quitar a ${guest.name} de esta mesa`}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}

      {/* Botón cambiar atuendo (traje ↔ vestido) en hover */}
      {guest && !isBride && !isGroom && (
        <button
          type="button"
          onClick={handleToggleGender}
          className="absolute -bottom-1 -left-1 z-30 w-4 h-4 rounded-full bg-stone-800 text-white opacity-0 group-hover/person:opacity-100 hover:bg-wedding-primary flex items-center justify-center transition-opacity shadow-sm cursor-pointer"
          title={style.type === 'woman' ? 'Cambiar a traje' : 'Cambiar a vestido'}
        >
          <RefreshCw size={8} />
        </button>
      )}

      {/* Etiqueta con el NOMBRE de la persona (Exacto a la imagen de referencia) */}
      {showName && (
        <div
          className="absolute pointer-events-none z-20 whitespace-pre text-center"
          style={{
            // Posicionar el nombre hacia afuera de la mesa
            top: `${50 + 72 * Math.sin(radialAngle)}%`,
            left: `${50 + 72 * Math.cos(radialAngle)}%`,
            transform: `translate(-50%, -50%) rotate(${textAngle}deg)`,
            transformOrigin: 'center center',
          }}
        >
          <span 
            className="font-sans font-extrabold text-[11px] leading-[1.05] tracking-tight text-stone-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] bg-white/80 px-1 py-0.5 rounded-md border border-stone-200/50 shadow-2xs block"
            style={{ maxWidth: '78px' }}
          >
            {formatDisplayName(fullName)}
          </span>
        </div>
      )}
    </div>
  );
}

// Componente para la SILLA VACÍA (Dashed circle con número de silla, igual a la imagen)
export function EmptySeatSlot({
  seatNumber,
  radialAngle = 0,
  onClick,
  onDrop,
  size = 42,
}) {
  return (
    <div
      onClick={onClick}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={onDrop}
      className="group/empty cursor-pointer flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
      style={{ width: size, height: size }}
      title={`Silla libre ${seatNumber} - Toca o arrastra un invitado aquí`}
    >
      <div className="w-9 h-9 rounded-full border-2 border-dashed border-stone-300 group-hover/empty:border-wedding-primary group-hover/empty:bg-emerald-50/80 bg-white/80 flex items-center justify-center font-mono font-bold text-xs text-stone-400 group-hover/empty:text-wedding-primary shadow-2xs transition-colors">
        {seatNumber}
      </div>
    </div>
  );
}
