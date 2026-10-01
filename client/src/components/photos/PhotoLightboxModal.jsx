import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import { 
  X, 
  Heart, 
  Download, 
  Trash2, 
  Calendar, 
  User, 
  Sparkles 
} from 'lucide-react';

export function PhotoLightboxModal({ photo, onClose }) {
  const { likePhoto, deletePhoto } = useWedding();

  if (!photo) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `Boda_ED_${photo.uploader_name.replace(/\s+/g, '_')}_${photo.id}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = () => {
    if (window.confirm('¿Seguro que deseas eliminar esta foto del álbum?')) {
      deletePhoto(photo.id);
      onClose();
    }
  };

  const formattedDate = new Date(photo.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-4xl max-h-[92vh] bg-stone-900 rounded-3xl overflow-hidden border border-stone-700 shadow-2xl flex flex-col md:flex-row z-10 animate-in zoom-in-95 duration-200">
        
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black text-white/80 hover:text-white transition cursor-pointer z-30"
        >
          <X size={20} />
        </button>

        {/* Zona Imagen */}
        <div className="flex-1 flex items-center justify-center bg-black/40 min-h-[300px] md:min-h-[500px] p-2 relative overflow-hidden">
          <img
            src={photo.url}
            alt={photo.uploader_name}
            className="max-w-full max-h-[75vh] object-contain rounded-xl"
          />
        </div>

        {/* Zona Información Lateral */}
        <div className="w-full md:w-80 bg-stone-900 p-5 sm:p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-stone-800 text-white">
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-full bg-amber-500/20 text-amber-400">
                <Sparkles size={14} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Recuerdo de Boda
              </span>
            </div>

            {/* Autor */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-wedding-primary flex items-center justify-center text-amber-200 font-bold text-xs">
                {photo.uploader_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-editorial text-lg font-bold text-white leading-tight">
                  {photo.uploader_name}
                </h3>
                <span className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={11} />
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Mensaje / Dedicatoria */}
            {photo.caption && (
              <div className="my-4 p-3 rounded-2xl bg-stone-800/80 border border-stone-700/60">
                <p className="font-corsiva text-base sm:text-lg text-amber-100/90 italic leading-relaxed">
                  «{photo.caption}»
                </p>
              </div>
            )}
          </div>

          {/* Acciones de la foto */}
          <div className="space-y-2 pt-4 border-t border-stone-800">
            <div className="flex items-center gap-2">
              {/* Botón de Like */}
              <button
                type="button"
                onClick={() => likePhoto(photo.id)}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 py-2.5 px-3 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <Heart size={16} className="fill-rose-400 text-rose-400 animate-pulse" />
                <span>{photo.likes || 0} Me Gusta</span>
              </button>

              {/* Botón Descargar Foto */}
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition cursor-pointer"
                title="Descargar Foto"
              >
                <Download size={16} />
              </button>

              {/* Botón Eliminar Foto */}
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center p-2.5 rounded-xl bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-300 transition cursor-pointer"
                title="Eliminar Foto"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
