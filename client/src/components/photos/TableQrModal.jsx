import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { GOOGLE_PHOTOS_ALBUM_URL } from '../../constants/weddingConstants';
import { 
  X, 
  Printer, 
  Download, 
  Sparkles, 
  Heart, 
  Camera, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';

export function TableQrModal({ isOpen, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const printAreaRef = useRef(null);

  const uploadPageUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}?tab=photos&upload=true` 
    : 'https://wedding-ed.vercel.app?tab=photos&upload=true';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(uploadPageUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: '#1F3A2E',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Error generando QR de alta resolución:', err));
    }
  }, [isOpen, uploadPageUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(uploadPageUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQrPng = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'QR_Fotos_Boda_E_y_D.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-xl bg-white rounded-3xl border-2 border-amber-200/90 shadow-2xl overflow-hidden z-10 p-5 sm:p-7 animate-in zoom-in-95 duration-200">
        
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer z-20 no-print"
        >
          <X size={20} />
        </button>

        {/* Cabecera */}
        <div className="text-center mb-5 no-print">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 border border-amber-300/60 text-[11px] font-bold tracking-wider uppercase mb-2">
            <Sparkles size={12} className="text-amber-700" />
            <span>Cartel Oficial para Mesas</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-wedding-primaryDark">
            Código QR de Recuerdos para las Mesas
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Coloca este cartel en los centros de mesa para que los invitados escaneen y suban sus fotos durante el festejo.
          </p>
        </div>

        {/* ========================================================
            TARJETA DE MESA IMPRIMIBLE CON ESTILO EDITORIAL Y MARCO FINO
            ======================================================== */}
        <div 
          ref={printAreaRef}
          className="relative bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 text-center border-2 border-amber-300/80 shadow-md my-4 max-w-md mx-auto"
        >
          {/* Doble marco fino dorado */}
          <div className="absolute inset-2 border border-amber-300/60 rounded-2xl pointer-events-none" />

          {/* Monograma Medallón */}
          <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-300 to-wedding-primary mx-auto mb-3 shadow-xs">
            <div className="w-full h-full rounded-full bg-[#FAF7F2] border border-amber-200 flex items-center justify-center">
              <span className="font-editorial font-bold text-wedding-primaryDark text-base tracking-widest pl-0.5">
                E<span className="text-amber-600 font-serif italic mx-0.5">&</span>D
              </span>
            </div>
          </div>

          <h3 className="font-editorial text-xl sm:text-2xl font-bold text-wedding-primaryDark leading-tight">
            ¡Captura los Recuerdos con Nosotros!
          </h3>

          <p className="font-corsiva text-base sm:text-lg text-stone-700 italic mt-1 leading-snug">
            «Los mejores momentos son los que compartimos juntos»
          </p>

          {/* Código QR Central de Alta Resolución */}
          <div className="my-5 p-3.5 bg-white rounded-2xl border-2 border-amber-200/90 shadow-inner inline-block">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Código QR de Boda"
                className="w-44 h-44 sm:w-52 sm:h-52 object-contain mx-auto"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-xs text-stone-400">
                Generando QR...
              </div>
            )}
          </div>

          {/* Instrucciones sencillas */}
          <div className="space-y-1">
            <span className="font-bold text-xs uppercase tracking-wider text-wedding-primaryDark block">
              Escanea con la cámara de tu celular
            </span>
            <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
              No necesitas descargar ninguna aplicación ni crear cuentas
            </p>
          </div>

          {/* Pie fechador */}
          <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-center gap-2 text-[10px] font-semibold tracking-widest uppercase text-amber-800/80">
            <span>Sábado, 21 de Noviembre de 2026</span>
          </div>
        </div>

        {/* ========================================================
            BOTONES DE ACCIÓN (NO SE IMPRIMEN)
            ======================================================== */}
        <div className="space-y-3 pt-2 no-print">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-wedding-primary hover:bg-wedding-primaryLight text-white py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
            >
              <Printer size={16} />
              <span>Imprimir Carteles de Mesa</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQrPng}
              className="flex items-center justify-center gap-2 bg-stone-100 hover:bg-amber-50 text-stone-800 hover:text-amber-900 border border-stone-200 hover:border-amber-300 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer"
            >
              <Download size={16} className="text-amber-700" />
              <span>Descargar Imagen QR (PNG)</span>
            </button>
          </div>

          {/* Enlace directo */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs">
            <span className="text-stone-500 truncate flex-1 font-mono text-[11px]">
              {uploadPageUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-wedding-primary hover:text-wedding-primaryDark font-bold px-2 py-1 rounded-lg hover:bg-white transition shrink-0 cursor-pointer"
            >
              {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedLink ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          {/* Enlace alternativo a Google Photos */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5a7 7 0 0 0-7 7v1h7V5z"/>
                <path fill="#4285F4" d="M19 12a7 7 0 0 0-7-7h-1v7h8z"/>
                <path fill="#FBBC05" d="M5 12a7 7 0 0 0 7 7h1v-7H5z"/>
                <path fill="#34A853" d="M12 19a7 7 0 0 0 7-7v-1h-7v8z"/>
              </svg>
              <span className="font-semibold text-blue-900">
                Álbum Oficial de Google Photos
              </span>
            </div>
            <a
              href={GOOGLE_PHOTOS_ALBUM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-xs transition"
            >
              <span>Abrir Álbum</span>
              <ExternalLink size={12} />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
