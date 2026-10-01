import React, { useState, useRef } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { photoApi } from '../../services/photoApi';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

export function GuestPhotoUploadModal({ isOpen, onClose }) {
  const { guests, families, addPhoto, triggerCelebration } = useWedding();

  const [uploaderName, setUploaderName] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]); // { file, preview, compressedUrl }
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Manejar selección de archivos desde cámara o galería
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setErrorMsg('');
    setIsCompressing(true);

    try {
      const newItems = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        // Compresión instantánea en el navegador
        const compressedUrl = await photoApi.compressImage(file, 1600, 0.85);
        newItems.push({
          file,
          preview: compressedUrl,
          compressedUrl,
        });
      }

      setSelectedFiles((prev) => [...prev, ...newItems]);
    } catch (err) {
      console.error('Error procesando fotos:', err);
      setErrorMsg('No se pudieron procesar algunas fotos. Intenta de nuevo.');
    } finally {
      setIsCompressing(false);
      // Limpiar input para permitir seleccionar la misma foto si se desea
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveItem = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (!uploaderName.trim()) {
      setErrorMsg('Por favor escribe tu nombre o el de tu familia.');
      return;
    }

    if (selectedFiles.length === 0) {
      setErrorMsg('Por favor selecciona al menos una foto para compartir.');
      return;
    }

    setErrorMsg('');
    setIsUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    try {
      // Intentar verificar si hay configuración de Cloudinary en localStorage
      const cloudConfig = JSON.parse(localStorage.getItem('wedding_cloudinary_config') || '{}');
      const useCloudinary = Boolean(cloudConfig.cloudName && cloudConfig.uploadPreset);

      for (let i = 0; i < selectedFiles.length; i++) {
        const item = selectedFiles[i];
        let finalUrl = item.compressedUrl;
        let thumbnailUrl = item.compressedUrl;
        let storageKey = null;

        if (useCloudinary) {
          try {
            const cloudRes = await photoApi.uploadToCloudinary(
              item.compressedUrl,
              cloudConfig.cloudName,
              cloudConfig.uploadPreset
            );
            finalUrl = cloudRes.url;
            thumbnailUrl = cloudRes.thumbnailUrl;
            storageKey = cloudRes.storageKey;
          } catch (cloudErr) {
            console.warn('Fallo Cloudinary, usando almacenamiento directo:', cloudErr);
          }
        }

        await addPhoto({
          url: finalUrl,
          thumbnail_url: thumbnailUrl,
          storage_key: storageKey,
          uploader_name: uploaderName.trim(),
          caption: caption.trim() || null,
          status: 'approved',
        });

        setUploadProgress({ current: i + 1, total: selectedFiles.length });
      }

      setUploadSuccess(true);
      triggerCelebration();

      // Confetti burst
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C5A880', '#1F3A2E', '#F3ECE1', '#D9777F'],
      });
    } catch (err) {
      console.error('Error subiendo fotos:', err);
      setErrorMsg(err.message || 'Error al subir las fotos. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setCaption('');
    setUploadSuccess(false);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0" 
        onClick={!isUploading ? onClose : undefined} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-lg bg-white rounded-3xl border-2 border-amber-200/90 shadow-2xl overflow-hidden z-10 p-5 sm:p-7 animate-in zoom-in-95 duration-200">
        
        {/* Botón cerrar */}
        {!isUploading && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer z-20"
          >
            <X size={20} />
          </button>
        )}

        {/* ========================================================
            ESTADO DE ÉXITO TRAS SUBIR
            ======================================================== */}
        {uploadSuccess ? (
          <div className="text-center py-6 animate-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-wedding-primaryDark">
              ¡Muchas Gracias, {uploaderName}!
            </h3>

            <p className="text-stone-600 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              Tus fotos y momentos ya forman parte de nuestro álbum oficial de bodas. ¡Nos llena el corazón revivir este día con tus recuerdos!
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-2 bg-wedding-primary hover:bg-wedding-primaryLight text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <Camera size={16} />
                <span>Subir Más Fotos</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                <span>Ver Álbum de Fotos</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
              FORMULARIO DE SUBIDA DE FOTOS
              ======================================================== */
          <div className="space-y-4">
            
            {/* Cabecera */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 border border-amber-300/60 text-[11px] font-bold tracking-wider uppercase mb-2">
                <Sparkles size={12} className="text-amber-700" />
                <span>Álbum de Recuerdos • E & D</span>
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-wedding-primaryDark">
                Comparte tus Fotos de la Boda
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Toma una foto con tu cámara o elige tus favoritas de la fiesta
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Campo: Nombre del Invitado o Familia */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ¿Quién comparte estas fotos? <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="Ej. Familia Alberto Mairena, Tío Carlos, o María & Luis"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-wedding-primary/20 focus:border-wedding-primary transition"
                disabled={isUploading}
              />
            </div>

            {/* Campo: Mensaje o Dedicatoria */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Dedicatoria o mensaje para los novios <span className="text-stone-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                placeholder="¡Qué vivan los novios! Les deseamos toda la felicidad del mundo..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-wedding-primary/20 focus:border-wedding-primary transition resize-none"
                disabled={isUploading}
              />
            </div>

            {/* Selector de Fotos / Botón de Cámara */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading || isCompressing}
              />

              <div
                onClick={() => !isUploading && !isCompressing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer ${
                  selectedFiles.length > 0
                    ? 'border-amber-300 bg-amber-50/30 hover:bg-amber-50/60'
                    : 'border-stone-300 bg-stone-50/60 hover:bg-stone-100/60 hover:border-wedding-primary/40'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-linear-to-tr from-amber-200 to-amber-400 text-amber-950 flex items-center justify-center shadow-xs">
                    <Camera size={22} />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-stone-800 block">
                      Toca aquí para tomar foto o elegir de tu galería
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Puedes seleccionar varias fotos a la vez
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicador de compresión en progreso */}
            {isCompressing && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-amber-800 font-medium">
                <Loader2 size={16} className="animate-spin text-amber-600" />
                <span>Optimizando fotos para subida rápida...</span>
              </div>
            )}

            {/* Vista Previa de Fotos Seleccionadas */}
            {selectedFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
                  <span>Fotos seleccionadas ({selectedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-stone-400 hover:text-rose-600 text-[11px] transition"
                  >
                    Quitar todas
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 border border-stone-200 rounded-xl bg-stone-50/50">
                  {selectedFiles.map((item, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-stone-200 shadow-2xs">
                      <img
                        src={item.preview}
                        alt="Previsualización"
                        className="w-full h-full object-cover"
                      />
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Barra de progreso durante la subida */}
            {isUploading && (
              <div className="space-y-1.5 py-1">
                <div className="flex justify-between text-xs font-bold text-amber-900">
                  <span>Subiendo fotos a los recuerdos...</span>
                  <span>{uploadProgress.current} de {uploadProgress.total}</span>
                </div>
                <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-wedding-primary via-emerald-600 to-amber-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Botón de Enviar */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleUploadAll}
                disabled={isUploading || isCompressing || selectedFiles.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-amber-500 via-amber-600 to-wedding-primary hover:from-amber-600 hover:to-wedding-primaryDark text-white font-bold py-3 px-5 rounded-2xl text-xs sm:text-sm shadow-md active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Guardando recuerdos ({uploadProgress.current}/{uploadProgress.total})...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Compartir {selectedFiles.length > 0 ? `${selectedFiles.length} Foto(s)` : 'Fotos'} con los Novios ✨</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
