import React, { useState, useMemo } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { GuestPhotoUploadModal } from './GuestPhotoUploadModal';
import { LiveSlideshowModal } from './LiveSlideshowModal';
import { TableQrModal } from './TableQrModal';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { GOOGLE_PHOTOS_ALBUM_URL } from '../../constants/weddingConstants';
import JSZip from 'jszip';
import { 
  Camera, 
  Sparkles, 
  Heart, 
  QrCode, 
  Tv, 
  Download, 
  Settings, 
  Trash2, 
  CheckCircle, 
  Filter, 
  Image as ImageIcon,
  Loader2,
  Users,
  ExternalLink
} from 'lucide-react';

export function PhotoWallView() {
  const { 
    photos = [], 
    photoStats, 
    likePhoto, 
    updatePhotoStatus, 
    deletePhoto, 
    showToast 
  } = useWedding();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'popular', 'pending'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState(null);
  const [isZipping, setIsZipping] = useState(false);

  // Cloudinary settings state
  const [cloudName, setCloudName] = useState(() => {
    const config = JSON.parse(localStorage.getItem('wedding_cloudinary_config') || '{}');
    return config.cloudName || '';
  });
  const [uploadPreset, setUploadPreset] = useState(() => {
    const config = JSON.parse(localStorage.getItem('wedding_cloudinary_config') || '{}');
    return config.uploadPreset || '';
  });

  // Guardar configuración Cloudinary
  const handleSaveCloudConfig = (e) => {
    e.preventDefault();
    localStorage.setItem(
      'wedding_cloudinary_config',
      JSON.stringify({ cloudName: cloudName.trim(), uploadPreset: uploadPreset.trim() })
    );
    setIsSettingsOpen(false);
    showToast('Configuración de Cloudinary guardada', 'success');
  };

  // Filtrado de fotos
  const filteredPhotos = useMemo(() => {
    let list = [...photos];
    if (activeFilter === 'popular') {
      list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (activeFilter === 'pending') {
      list = list.filter((p) => p.status === 'pending');
    }
    return list;
  }, [photos, activeFilter]);

  // Descargar todo el álbum en un archivo ZIP
  const handleDownloadAllZip = async () => {
    if (photos.length === 0) {
      showToast('No hay fotos para descargar', 'info');
      return;
    }

    setIsZipping(true);
    showToast('Preparando descarga del álbum (.zip)...', 'info');

    try {
      const zip = new JSZip();
      const folder = zip.folder('Recuerdos_Boda_E_y_D_2026');

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        try {
          const res = await fetch(photo.url);
          const blob = await res.blob();
          const cleanName = (photo.uploader_name || 'Invitado').replace(/[^a-zA-Z0-9_-]/g, '_');
          folder.file(`${i + 1}_${cleanName}_${photo.id}.jpg`, blob);
        } catch (fetchErr) {
          console.warn('Error descargando imagen para zip:', fetchErr);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Album_Completo_Boda_E_y_D_2026.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('¡Álbum descargado con éxito!', 'success');
    } catch (err) {
      console.error('Error generando zip:', err);
      showToast('Error al comprimir las fotos', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* ========================================================
          HERO BANNER: ÁLBUM DE RECUERDOS & ESTADÍSTICAS
          ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-[#FCFAF6] to-[#F7F2E8] border-2 border-amber-200/90 shadow-luxury p-5 sm:p-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          {/* Título e Identidad */}
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-300 via-amber-400 to-wedding-primary shadow-md shrink-0">
              <div className="w-full h-full rounded-full bg-[#FAF7F2] border border-amber-200 flex items-center justify-center">
                <span className="font-editorial font-bold text-wedding-primaryDark text-base sm:text-lg tracking-widest pl-0.5">
                  E<span className="text-amber-600 font-serif italic mx-0.5">&</span>D
                </span>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/60 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-1">
                <Sparkles size={12} className="text-amber-700" />
                <span>Galería Oficial de los Invitados</span>
              </div>
              <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-bold text-wedding-primaryDark leading-tight">
                Álbum de Recuerdos de la Boda
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                Revive cada instante capturado por tus familiares y amigos
              </p>
            </div>
          </div>

          {/* Métricas Rápidas */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-white/80 border border-amber-200/80 text-center shadow-2xs">
              <span className="font-editorial text-xl sm:text-2xl font-bold text-wedding-primaryDark block">
                {photos.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                Fotos Subidas
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white/80 border border-amber-200/80 text-center shadow-2xs">
              <span className="font-editorial text-xl sm:text-2xl font-bold text-rose-700 block">
                {photoStats?.total_likes || photos.reduce((acc, p) => acc + (p.likes || 0), 0)}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                Me Gusta
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white/80 border border-amber-200/80 text-center shadow-2xs">
              <span className="font-editorial text-xl sm:text-2xl font-bold text-amber-800 block">
                {photoStats?.total_uploaders || new Set(photos.map(p => p.uploader_name)).size}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                Invitados
              </span>
            </div>
          </div>

        </div>

        {/* ========================================================
            BARRA DE BOTONES DE ACCIÓN PRINCIPALES
            ======================================================== */}
        <div className="mt-6 pt-5 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Botones Primarios */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Subir Fotos - Prominente y de Alto Contraste */}
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 bg-wedding-primary hover:bg-wedding-primaryLight text-white px-4 sm:px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 transition border border-amber-300/60 cursor-pointer"
            >
              <Camera size={17} className="text-amber-300" />
              <span>Subir Fotos</span>
              <Sparkles size={14} className="text-amber-300" />
            </button>

            {/* Proyector / Modo En Vivo */}
            <button
              type="button"
              onClick={() => setIsSlideshowOpen(true)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md active:scale-95 transition cursor-pointer"
              title="Abrir proyector en pantalla completa para la recepción"
            >
              <Tv size={16} className="text-amber-200" />
              <span>Modo Proyector (En Vivo)</span>
            </button>

            {/* Código QR para Mesas */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-2 bg-white hover:bg-amber-50 text-stone-800 hover:text-amber-900 border border-stone-300 hover:border-amber-400 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition cursor-pointer"
              title="Generar e imprimir cartel con QR para las mesas"
            >
              <QrCode size={16} className="text-wedding-primary" />
              <span>QR para Mesas</span>
            </button>

            {/* Álbum Oficial en Google Photos */}
            <a
              href={GOOGLE_PHOTOS_ALBUM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-900 border border-blue-200 hover:border-blue-400 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition"
              title="Abrir álbum colaborativo oficial en Google Photos"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5a7 7 0 0 0-7 7v1h7V5z"/>
                <path fill="#4285F4" d="M19 12a7 7 0 0 0-7-7h-1v7h8z"/>
                <path fill="#FBBC05" d="M5 12a7 7 0 0 0 7 7h1v-7H5z"/>
                <path fill="#34A853" d="M12 19a7 7 0 0 0 7-7v-1h-7v8z"/>
              </svg>
              <span>Álbum Google Photos</span>
              <ExternalLink size={13} className="text-blue-500" />
            </a>
          </div>

          {/* Botones Secundarios: Descarga ZIP y Ajustes */}
          <div className="flex items-center gap-2">
            
            {/* Descargar Todo en ZIP */}
            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isZipping || photos.length === 0}
              className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3.5 py-2.5 rounded-xl font-bold text-xs transition disabled:opacity-50 cursor-pointer"
              title="Descargar todas las fotos en un archivo .zip"
            >
              {isZipping ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>{isZipping ? 'Comprimiendo...' : 'Descargar Todo (.ZIP)'}</span>
            </button>

            {/* Configurar Cloudinary */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
              title="Ajustes de almacenamiento en la nube (Cloudinary)"
            >
              <Settings size={16} />
            </button>
          </div>

        </div>

      </div>

      {/* ========================================================
          BANNER DE GOOGLE PHOTOS COLABORATIVO
          ======================================================== */}
      <div className="bg-gradient-to-r from-blue-50/80 via-white to-amber-50/50 rounded-2xl p-4 border border-blue-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white border border-blue-200 flex items-center justify-center shadow-xs shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5a7 7 0 0 0-7 7v1h7V5z"/>
              <path fill="#4285F4" d="M19 12a7 7 0 0 0-7-7h-1v7h8z"/>
              <path fill="#FBBC05" d="M5 12a7 7 0 0 0 7 7h1v-7H5z"/>
              <path fill="#34A853" d="M12 19a7 7 0 0 0 7-7v-1h-7v8z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-editorial text-sm sm:text-base font-bold text-stone-900 leading-tight">
                Álbum Oficial en Google Photos
              </h4>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                Colaborativo
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Si prefieres subir lotes grandes de fotos y videos en calidad original directamente con tu cuenta de Google, puedes agregarlas a nuestro álbum compartido.
            </p>
          </div>
        </div>

        <a
          href={GOOGLE_PHOTOS_ALBUM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition shrink-0"
        >
          <span>Abrir Google Photos</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* ========================================================
          PESTAÑAS DE FILTROS & BÚSQUEDA
          ======================================================== */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-stone-100/90 p-1 rounded-2xl border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'all'
                ? 'bg-white text-wedding-primaryDark shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Todas ({photos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('popular')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeFilter === 'popular'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Heart size={12} className="fill-rose-500 text-rose-500" />
            <span>Más Populares</span>
          </button>
          {photos.some((p) => p.status === 'pending') && (
            <button
              type="button"
              onClick={() => setActiveFilter('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeFilter === 'pending'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Por Aprobar
            </button>
          )}
        </div>

        {/* Botón directo de Subir Fotos en la barra de filtros */}
        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-1.5 bg-wedding-primary hover:bg-wedding-primaryLight text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer shrink-0 border border-amber-300/40"
        >
          <Camera size={15} className="text-amber-300" />
          <span className="hidden xs:inline">Subir Fotos</span>
        </button>
      </div>

      {/* ========================================================
          GRILLA DE FOTOS / MURO DE RECUERDOS
          ======================================================== */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-wedding-border p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Camera size={32} />
          </div>
          <h3 className="font-editorial text-2xl font-bold text-wedding-primaryDark">
            Aún no hay fotos en el álbum
          </h3>
          <p className="text-xs text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed">
            ¡Sé el primero en estrenar el álbum! Sube tus fotos favoritas o imprime el código QR para colocar en las mesas de la recepción.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-wedding-primary hover:bg-wedding-primaryLight text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              <Camera size={16} />
              <span>Subir la Primera Foto</span>
            </button>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              <QrCode size={16} />
              <span>Ver QR para Mesas</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              {/* Imagen con Click para Lightbox */}
              <div 
                onClick={() => setSelectedLightboxPhoto(photo)}
                className="relative aspect-square overflow-hidden bg-stone-100 cursor-pointer"
              >
                <img
                  src={photo.thumbnail_url || photo.url}
                  alt={photo.uploader_name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay sutil en hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Botón de Like flotante */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    likePhoto(photo.id);
                  }}
                  className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 hover:bg-white text-stone-800 px-2 py-1 rounded-full text-[11px] font-bold shadow-xs active:scale-90 transition cursor-pointer"
                >
                  <Heart 
                    size={12} 
                    className={photo.likes > 0 ? 'text-rose-500 fill-rose-500' : 'text-stone-400'} 
                  />
                  <span>{photo.likes || 0}</span>
                </button>
              </div>

              {/* Pie de foto con autor y dedicatoria */}
              <div className="p-2.5 sm:p-3 bg-white">
                <span className="font-editorial text-xs sm:text-sm font-bold text-stone-900 block truncate">
                  {photo.uploader_name}
                </span>

                {photo.caption && (
                  <p className="font-corsiva text-xs sm:text-sm text-stone-600 italic truncate mt-0.5">
                    «{photo.caption}»
                  </p>
                )}

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-100 text-[10px] text-stone-400">
                  <span>
                    {new Date(photo.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>

                  {/* Acciones de Moderación */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhoto(photo.id);
                      }}
                      className="p-1 text-stone-400 hover:text-rose-600 transition"
                      title="Eliminar foto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          MODALES AUXILIARES
          ======================================================== */}
      {/* 1. Modal para subir fotos */}
      <GuestPhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* 2. Modal Proyector / Modo En Vivo */}
      <LiveSlideshowModal
        isOpen={isSlideshowOpen}
        onClose={() => setIsSlideshowOpen(false)}
        photos={photos}
      />

      {/* 3. Modal Código QR para Mesas */}
      <TableQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* 4. Lightbox de Foto en Alta Resolución */}
      <PhotoLightboxModal
        photo={selectedLightboxPhoto}
        onClose={() => setSelectedLightboxPhoto(null)}
      />

      {/* 5. Modal de Configuración Cloudinary */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-stone-200 shadow-xl space-y-4">
            <h3 className="font-editorial text-xl font-bold text-stone-900">
              Almacenamiento en la Nube
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Por defecto, las fotos se comprimen en el navegador y se guardan directamente en tu base de datos Neon. Si deseas almacenar fotos ilimitadas en Cloudinary (capa gratuita de 25GB), ingresa tus credenciales:
            </p>

            <form onSubmit={handleSaveCloudConfig} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Cloudinary Cloud Name
                </label>
                <input
                  type="text"
                  value={cloudName}
                  onChange={(e) => setCloudName(e.target.value)}
                  placeholder="ej. mi-boda-ed"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-wedding-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Upload Preset (Unsigned)
                </label>
                <input
                  type="text"
                  value={uploadPreset}
                  onChange={(e) => setUploadPreset(e.target.value)}
                  placeholder="ej. boda_preset_unsigned"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-wedding-primary/20"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-wedding-primary text-white py-2 rounded-xl text-xs font-bold hover:bg-wedding-primaryLight transition"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-200 transition"
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Botón Flotante Permanente (FAB) para subir fotos desde cualquier posición */}
      <button
        type="button"
        onClick={() => setIsUploadModalOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-4 sm:right-7 z-40 flex items-center gap-2 bg-wedding-primary hover:bg-wedding-primaryLight text-white px-4 sm:px-5 py-3 rounded-full font-extrabold text-xs sm:text-sm shadow-2xl shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all border-2 border-amber-300 cursor-pointer group"
        title="Subir fotos al álbum de recuerdos"
      >
        <Camera size={18} className="text-amber-300 group-hover:rotate-12 transition-transform" />
        <span className="tracking-wide">Subir Fotos</span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      </button>

    </div>
  );
}
