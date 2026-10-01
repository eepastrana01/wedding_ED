import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  Heart, 
  Sparkles, 
  Camera,
  QrCode as QrIcon
} from 'lucide-react';

export function LiveSlideshowModal({ isOpen, onClose, photos = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showQrPill, setShowQrPill] = useState(true);

  const containerRef = useRef(null);

  // Filtrar solo fotos aprobadas
  const activePhotos = photos.filter((p) => p.status !== 'hidden');

  // Generar QR para el pie de pantalla del proyector
  useEffect(() => {
    if (isOpen) {
      const uploadUrl = window.location.origin + '?tab=photos&upload=true';
      QRCode.toDataURL(uploadUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#1F3A2E',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Error generando QR:', err));
    }
  }, [isOpen]);

  // Temporizador de avance automático cada 6 segundos
  useEffect(() => {
    if (!isOpen || !isPlaying || activePhotos.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activePhotos.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, activePhotos.length]);

  // Atajos de teclado para controlar la presentación
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activePhotos.length]);

  const handleNext = () => {
    if (activePhotos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activePhotos.length);
  };

  const handlePrev = () => {
    if (activePhotos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + activePhotos.length) % activePhotos.length);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  const currentPhoto = activePhotos[currentIndex];

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300"
    >
      
      {/* ========================================================
          BARRA SUPERIOR (CONTROLES DISCRETOS)
          ======================================================== */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 bg-linear-to-b from-black/80 via-black/40 to-transparent">
        
        {/* Monograma y Título */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full p-[1.5px] bg-linear-to-tr from-amber-300 to-amber-500 shadow-md shrink-0">
            <div className="w-full h-full rounded-full bg-[#1F3A2E] border border-amber-300/40 flex items-center justify-center">
              <span className="font-editorial font-bold text-amber-200 text-xs tracking-widest pl-0.5">
                E&D
              </span>
            </div>
          </div>
          <div>
            <h2 className="font-editorial font-bold text-white text-base sm:text-lg tracking-wide flex items-center gap-2">
              <span>Recuerdos en Vivo de Nuestra Boda</span>
              <Sparkles size={14} className="text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
            </h2>
            <p className="text-[11px] text-amber-200/80 hidden sm:block">
              Foto {activePhotos.length > 0 ? currentIndex + 1 : 0} de {activePhotos.length}
            </p>
          </div>
        </div>

        {/* Botones de Control */}
        <div className="flex items-center gap-2">
          {/* Alternar QR en pantalla */}
          <button
            type="button"
            onClick={() => setShowQrPill((prev) => !prev)}
            className={`p-2 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              showQrPill ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
            title="Mostrar / Ocultar QR de invitación en pantalla"
          >
            <QrIcon size={16} />
            <span className="hidden md:inline">Código QR</span>
          </button>

          {/* Play / Pausa */}
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title={isPlaying ? 'Pausar (Barra espaciadora)' : 'Reproducir'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Pantalla Completa */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer hidden sm:block"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          {/* Cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-rose-600/80 text-white transition cursor-pointer"
            title="Salir de la presentación (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ========================================================
          ZONA CENTRAL DE LA FOTO (PROYECCIÓN)
          ======================================================== */}
      <div className="relative flex-1 flex items-center justify-center w-full h-full p-2 sm:p-6 overflow-hidden">
        
        {activePhotos.length === 0 ? (
          <div className="text-center text-white/70 max-w-md p-6">
            <Camera size={48} className="mx-auto text-amber-300/60 mb-3" />
            <h3 className="font-editorial text-2xl font-bold text-white mb-2">
              Aún no hay fotos en el proyector
            </h3>
            <p className="text-xs text-white/60">
              Escanea el código QR desde tu mesa para subir las primeras fotos y verlas aquí en pantalla gigante.
            </p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Fondo con desenfoque suave para relleno cinematográfico */}
            <div 
              className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-25 scale-110 pointer-events-none transition-all duration-1000"
              style={{ backgroundImage: `url(${currentPhoto?.url})` }}
            />

            {/* Imagen Principal */}
            <img
              key={currentPhoto?.id || currentIndex}
              src={currentPhoto?.url}
              alt={currentPhoto?.uploader_name || 'Foto de Boda'}
              className="relative max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-all duration-700 animate-in fade-in zoom-in-95"
            />
          </div>
        )}

        {/* Flechas de navegación manual */}
        {activePhotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white/70 hover:text-white transition cursor-pointer backdrop-blur-xs"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white/70 hover:text-white transition cursor-pointer backdrop-blur-xs"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* ========================================================
          BARRA INFERIOR: AUTOR, DEDICATORIA Y CÓDIGO QR EN VIVO
          ======================================================== */}
      <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-8 py-3 sm:py-5 bg-linear-to-t from-black/90 via-black/60 to-transparent">
        
        {/* Información del Invitado y su Dedicatoria */}
        {currentPhoto && (
          <div className="max-w-xl text-left">
            <div className="flex items-center gap-2">
              <span className="font-editorial text-lg sm:text-2xl font-bold text-amber-200">
                {currentPhoto.uploader_name}
              </span>
              {currentPhoto.likes > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-400/30">
                  <Heart size={12} className="fill-rose-400" />
                  {currentPhoto.likes}
                </span>
              )}
            </div>

            {currentPhoto.caption && (
              <p className="font-corsiva text-base sm:text-xl text-white/90 italic mt-0.5 line-clamp-2">
                «{currentPhoto.caption}»
              </p>
            )}
          </div>
        )}

        {/* Cápsula de QR interactivo para que los invitados escaneen desde la mesa */}
        {showQrPill && qrCodeDataUrl && (
          <div className="flex items-center gap-3 bg-white/95 rounded-2xl p-2.5 sm:p-3 shadow-2xl border-2 border-amber-300 animate-in slide-in-from-bottom duration-300">
            <img
              src={qrCodeDataUrl}
              alt="QR para subir fotos"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-contain"
            />
            <div className="text-stone-900 leading-tight">
              <span className="font-bold text-[11px] sm:text-xs block text-wedding-primaryDark">
                ¡Sube tu foto y sal aquí!
              </span>
              <span className="text-[10px] text-stone-600 block">
                Escanea con la cámara de tu celular
              </span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-800 mt-0.5 block">
                Álbum Oficial E & D
              </span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
