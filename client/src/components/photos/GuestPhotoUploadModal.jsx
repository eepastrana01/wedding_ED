import React, { useState, useRef, useEffect } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { photoApi } from '../../services/photoApi';
import { WEDDING_ANIMALS, getRandomWeddingAnimal } from '../../constants/weddingAnimals';
import { GOOGLE_PHOTOS_ALBUM_URL } from '../../constants/weddingConstants';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  Dices, 
  Edit3, 
  Loader2, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';

export function GuestPhotoUploadModal({ isOpen, onClose }) {
  const { addPhoto, triggerCelebration } = useWedding();

  // Personaje animal divertido tipo Google Jamboard
  const [currentAnimal, setCurrentAnimal] = useState(() => {
    const saved = localStorage.getItem('wedding_uploader_animal_id');
    if (saved) {
      const found = WEDDING_ANIMALS.find((a) => a.id === saved);
      if (found) return found;
    }
    return getRandomWeddingAnimal();
  });

  const [useCustomName, setUseCustomName] = useState(false);
  const [customName, setCustomName] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]); // { file, preview, fullUrl, thumbUrl }
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState('');
  const [diceRolling, setDiceRolling] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setUploadSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Cambiar personaje divertido aleatorio con animación de dado
  const handleShuffleAnimal = () => {
    setDiceRolling(true);
    setTimeout(() => {
      const next = getRandomWeddingAnimal(currentAnimal.id);
      setCurrentAnimal(next);
      localStorage.setItem('wedding_uploader_animal_id', next.id);
      setDiceRolling(false);
    }, 200);
  };

  // Nombre final que se guardará
  const finalUploaderName = useCustomName && customName.trim()
    ? customName.trim()
    : `${currentAnimal.emoji} ${currentAnimal.name}`;

  // Manejar selección de archivos desde cámara o galería en Máxima Calidad
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setErrorMsg('');
    setIsCompressing(true);

    try {
      const newItems = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        
        let fullUrl;
        const isSmallEnoughForDirect = file.size <= 3.2 * 1024 * 1024; // Hasta 3.2 MB (conserva exactamente los bytes originales)

        if (isSmallEnoughForDirect) {
          // 1. Conservar 100% el archivo original sin tocar ni recomprimir nada (0% pérdida de calidad)
          fullUrl = await photoApi.readFileAsOriginal(file);
        } else {
          // Si pasa de 3.2 MB y va a Neon, se optimiza en ultra alta resolución (3600px, 95% calidad)
          fullUrl = await photoApi.compressImage(file, 3600, 0.95);
        }

        // 2. Miniatura nítida para la grilla rápida (500px)
        const thumbUrl = await photoApi.createThumbnail(fullUrl, 500, 0.82);

        newItems.push({
          file,
          preview: thumbUrl,
          fullUrl,
          thumbUrl,
          sizeMb: (file.size / (1024 * 1024)).toFixed(1),
          isOriginal: isSmallEnoughForDirect,
        });
      }

      setSelectedFiles((prev) => [...prev, ...newItems]);
    } catch (err) {
      console.error('Error procesando fotos:', err);
      setErrorMsg('No se pudieron procesar algunas fotos. Intenta de nuevo.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveItem = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (useCustomName && !customName.trim()) {
      setErrorMsg('Por favor escribe tu nombre o desmarca la opción para usar tu personaje.');
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
      // Guardar nombre en localStorage
      if (useCustomName && customName.trim()) {
        localStorage.setItem('wedding_uploader_custom_name', customName.trim());
      }

      const cloudConfig = JSON.parse(localStorage.getItem('wedding_cloudinary_config') || '{}');
      const useCloudinary = Boolean(cloudConfig.cloudName && cloudConfig.uploadPreset);

      for (let i = 0; i < selectedFiles.length; i++) {
        const item = selectedFiles[i];
        let finalUrl = item.fullUrl;
        let thumbnailUrl = item.thumbUrl;
        let storageKey = null;

        if (useCloudinary) {
          try {
            // Con Cloudinary, subimos el archivo original completo
            const cloudRes = await photoApi.uploadToCloudinary(
              item.file || item.fullUrl,
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
          uploader_name: finalUploaderName,
          caption: caption.trim() || null,
          status: 'approved',
        });

        setUploadProgress({ current: i + 1, total: selectedFiles.length });
      }

      setUploadSuccess(true);
      triggerCelebration();

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#C5A880', '#1F3A2E', '#F3ECE1', '#D9777F', '#E5A93B'],
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
              ¡Muchas Gracias!
            </h3>

            <div className="my-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 border border-amber-300 text-xs font-bold">
              <span>{finalUploaderName}</span>
            </div>

            <p className="text-stone-600 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              Tus fotos en alta resolución ya están en el álbum oficial de bodas y listas para proyectarse en la fiesta. ¡Nos emociona ver este día a través de tus ojos!
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
                <span>Ver el Álbum</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
              FORMULARIO CON PERSONAJE DIVERTIDO ESTILO GOOGLE
              ======================================================== */
          <div className="space-y-4">
            
            {/* Cabecera */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/60 text-[11px] font-bold tracking-wider uppercase mb-1.5 shadow-2xs">
                <Sparkles size={12} className="text-amber-700" />
                <span>Álbum de Recuerdos • E & D</span>
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-wedding-primaryDark">
                Comparte tus Fotos de la Boda
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Fotos nítidas en calidad alta, listas para el proyector
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ========================================================
                SELECTOR DE PERSONAJE AMIGABLE (CERO ESCRITURA OBLIGATORIA)
                ======================================================== */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50/60 border-2 border-amber-200/90 shadow-2xs">
              
              {!useCustomName ? (
                <div className="flex items-center justify-between gap-3">
                  
                  {/* Avatar & Nombre del Animal */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-amber-300 flex items-center justify-center text-2xl shadow-xs shrink-0 select-none">
                      {currentAnimal.emoji}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-amber-800/80 font-bold block">
                        Compartiendo como:
                      </span>
                      <h4 className="font-editorial text-base sm:text-lg font-bold text-stone-900 leading-tight">
                        {currentAnimal.name}
                      </h4>
                      <span className="text-[10px] text-stone-500 font-medium block">
                        {currentAnimal.badge}
                      </span>
                    </div>
                  </div>

                  {/* Botón de Cambiar / Dado Aleatorio */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleShuffleAnimal}
                      disabled={diceRolling}
                      className="flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs active:scale-95 transition cursor-pointer"
                      title="Cambiar a otro personaje divertido"
                    >
                      <Dices size={14} className={diceRolling ? 'animate-spin text-amber-700' : 'text-amber-700'} />
                      <span>{diceRolling ? 'Girando...' : 'Cambiar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseCustomName(true)}
                      className="text-[10px] text-stone-400 hover:text-stone-700 underline underline-offset-2 transition"
                    >
                      Escribir mi nombre
                    </button>
                  </div>

                </div>
              ) : (
                /* Modo Escritura Manual */
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-800">
                      Tu Nombre o Familia:
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseCustomName(false)}
                      className="text-[11px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 transition"
                    >
                      <RotateCcw size={11} />
                      <span>Volver a personaje ({currentAnimal.emoji})</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ej. Familia Alberto Mairena o Carlos & Andrea"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-wedding-primary/20 focus:border-wedding-primary"
                    disabled={isUploading}
                    autoFocus
                  />
                </div>
              )}

            </div>

            {/* Dedicatoria o mensaje opcional */}
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
                    ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50/70'
                    : 'border-stone-300 bg-stone-50 hover:bg-stone-100 hover:border-wedding-primary/40'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-300 to-amber-500 text-stone-900 flex items-center justify-center shadow-xs">
                    <Camera size={22} className="text-stone-900" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-stone-900 block">
                      Toca aquí para tomar foto o elegir de tu galería
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Puedes seleccionar varias fotos a la vez (Calidad Alta)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicador de optimización en progreso */}
            {isCompressing && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-amber-800 font-medium">
                <Loader2 size={16} className="animate-spin text-amber-600" />
                <span>Preparando fotos en alta resolución...</span>
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

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1.5 border border-stone-200 rounded-xl bg-stone-50/50">
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
                  <span>Guardando recuerdos en alta calidad...</span>
                  <span>{uploadProgress.current} de {uploadProgress.total}</span>
                </div>
                <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-wedding-primary via-emerald-600 to-amber-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Botón de Enviar Fuerte y Visible */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleUploadAll}
                disabled={isUploading || isCompressing || selectedFiles.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-wedding-primary hover:bg-wedding-primaryLight text-white font-extrabold py-3 px-5 rounded-2xl text-xs sm:text-sm shadow-lg hover:shadow-xl active:scale-98 transition disabled:opacity-50 cursor-pointer border border-amber-300/40"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-amber-300" />
                    <span>Guardando recuerdos ({uploadProgress.current}/{uploadProgress.total})...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} className="text-amber-300" />
                    <span>Compartir {selectedFiles.length > 0 ? `${selectedFiles.length} Foto(s)` : 'Fotos'} con los Novios ✨</span>
                  </>
                )}
              </button>
            </div>

            {/* Alternativa Google Photos para lotes grandes */}
            <div className="pt-2 text-center border-t border-stone-100">
              <a
                href={GOOGLE_PHOTOS_ALBUM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 font-semibold transition py-1 hover:underline"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5a7 7 0 0 0-7 7v1h7V5z"/>
                  <path fill="#4285F4" d="M19 12a7 7 0 0 0-7-7h-1v7h8z"/>
                  <path fill="#FBBC05" d="M5 12a7 7 0 0 0 7 7h1v-7H5z"/>
                  <path fill="#34A853" d="M12 19a7 7 0 0 0 7-7v-1h-7v8z"/>
                </svg>
                <span>¿Prefieres usar Google Photos? Abre el álbum compartido</span>
                <span className="text-blue-500 font-bold">↗</span>
              </a>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
