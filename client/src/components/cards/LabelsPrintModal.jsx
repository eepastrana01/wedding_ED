import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Tag, 
  Scissors, 
  CheckCircle2, 
  FileDown,
  Copy,
  Info,
  FileCheck
} from 'lucide-react';
import { generateDirectLabelsPDF } from '../../utils/pdfGenerator';

export function LabelsPrintModal({ isOpen, onClose, cards = [] }) {
  // Configuración de visualización e impresión
  const [layoutFormat, setLayoutFormat] = useState('10'); // '10' (2x5), '8' (2x4), '14' (2x7)
  const [fontSize, setFontSize] = useState('md'); // 'sm', 'md', 'lg'
  const [styleTheme, setStyleTheme] = useState('frame-double'); // 'frame-double', 'frame-minimal', 'frame-corners', 'frame-vintage', 'frame-french', 'frame-monogram', 'clean'
  const [showCutLines, setShowCutLines] = useState(true);
  const [showSeats, setShowSeats] = useState(false);
  const [includeFamilyWord, setIncludeFamilyWord] = useState(true);
  const [includeInstructionsPage, setIncludeInstructionsPage] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'family', 'individual'
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Filtrado de tarjetas a imprimir
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (filterType === 'family') return card.type === 'family';
      if (filterType === 'individual') return card.type === 'individual' || card.type === 'couple';
      return true;
    });
  }, [cards, filterType]);

  // Número de etiquetas por hoja según formato seleccionado
  const itemsPerPage = parseInt(layoutFormat, 10) || 10;

  // Dividir tarjetas en páginas físicas tamaño Carta
  const pages = useMemo(() => {
    const p = [];
    for (let i = 0; i < filteredCards.length; i += itemsPerPage) {
      p.push(filteredCards.slice(i, i + itemsPerPage));
    }
    return p;
  }, [filteredCards, itemsPerPage]);

  // Configuración de tamaño de fuente
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-lg sm:text-xl md:text-[22px] leading-snug';
      case 'lg':
        return 'text-2xl sm:text-3xl md:text-[32px] leading-snug';
      case 'md':
      default:
        return 'text-xl sm:text-2xl md:text-[26px] leading-snug';
    }
  };

  // Altura mínima de cada celda de etiqueta según cuadrícula
  const getLabelHeightClass = () => {
    switch (layoutFormat) {
      case '8': // 2x4
        return 'h-[62mm] min-h-[62mm]';
      case '14': // 2x7
        return 'h-[36mm] min-h-[36mm]';
      case '10': // 2x5 (estándar Avery 5163)
      default:
        return 'h-[49mm] min-h-[49mm]';
    }
  };

  // Obtener texto procesado según toggle de palabra Familia
  const getLabelTitle = (card) => {
    let title = card.salutation || card.title;
    if (!includeFamilyWord && card.type === 'family') {
      title = title.replace(/^Familia\s+/i, '').replace(/^Famia\s+/i, '').replace(/^Fanilia\s+/i, '');
    }
    return title;
  };

  const getStyleBadgeLabel = () => {
    switch (styleTheme) {
      case 'frame-double':
      case 'frame':
        return 'Doble Línea Dorada';
      case 'frame-minimal':
        return 'Minimalista Fino';
      case 'frame-corners':
        return 'Esquinas Art Déco';
      case 'frame-vintage':
        return 'Romántico con Rombos';
      case 'frame-french':
        return 'Esquinas Francesas';
      case 'frame-monogram':
      case 'monogram':
        return 'Monograma E & D';
      case 'clean':
        return 'Caligrafía Pura';
      default:
        return 'Marco Fino Elegante';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDirectPdfDownload = () => {
    try {
      setIsGeneratingPdf(true);
      generateDirectLabelsPDF(filteredCards, {
        layoutFormat,
        styleTheme,
        showCutLines,
        showSeats,
        includeFamilyWord,
        includeInstructionsPage,
        fontSize,
      });
    } catch (err) {
      console.error('Error al generar PDF directo:', err);
      alert('Hubo un error al generar el PDF de etiquetas.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyNames = () => {
    const textList = filteredCards.map((c) => getLabelTitle(c)).join('\n');
    navigator.clipboard.writeText(textList);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      
      {/* Barra Superior Fija de Controles (Se oculta al imprimir) */}
      <header className="sticky top-0 z-30 bg-white border-b border-wedding-border shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Título y badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Tag size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-editorial text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                      Etiquetas de Sobres en Monotype Corsiva
                    </h3>
                    <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                      Fondo Blanco Puro
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {filteredCards.length} etiquetas • {pages.length} {pages.length === 1 ? 'hoja Carta' : 'hojas Carta'}
                  </p>
                </div>
              </div>

              {/* Botón cerrar móvil */}
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-stone-400 hover:text-stone-700 rounded-xl"
                aria-label="Cerrar"
              >
                <X size={22} />
              </button>
            </div>

            {/* Opciones y Controles rápidos */}
            <div className="flex items-center flex-wrap gap-2.5">
              
              {/* Selector de Filtro */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    filterType === 'all' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Todas ({cards.length})
                </button>
                <button
                  onClick={() => setFilterType('family')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    filterType === 'family' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Familias
                </button>
                <button
                  onClick={() => setFilterType('individual')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    filterType === 'individual' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Individuales
                </button>
              </div>

              {/* Selector Formato / Grid */}
              <select
                value={layoutFormat}
                onChange={(e) => setLayoutFormat(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white text-stone-800 focus:ring-2 focus:ring-wedding-accent"
                title="Cantidad de etiquetas por hoja Carta"
              >
                <option value="10">10 por hoja (2x5 - Estándar Avery 5163)</option>
                <option value="8">8 por hoja (2x4 - Amplia 98x62mm)</option>
                <option value="14">14 por hoja (2x7 - Compacta 98x36mm)</option>
              </select>

              {/* Selector Tamaño de Letra */}
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white text-stone-800 focus:ring-2 focus:ring-wedding-accent"
                title="Tamaño de la tipografía caligráfica"
              >
                <option value="sm">Letra Pequeña (18pt)</option>
                <option value="md">Letra Mediana / Ideal (22pt)</option>
                <option value="lg">Letra Grande (26pt)</option>
              </select>

              {/* Estilo Visual */}
              <select
                value={styleTheme}
                onChange={(e) => setStyleTheme(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white text-stone-800 focus:ring-2 focus:ring-wedding-accent"
                title="Diseño del recuadro de etiqueta"
              >
                <option value="frame-double">Doble Línea Dorada (Clásico)</option>
                <option value="frame-minimal">Línea Fina Minimalista</option>
                <option value="frame-corners">Esquinas Art Déco</option>
                <option value="frame-vintage">Romántico con Rombos</option>
                <option value="frame-french">Esquinas Francesas Suaves</option>
                <option value="frame-monogram">Marco con Monograma E & D</option>
                <option value="clean">Sin Marco (Caligrafía Pura)</option>
              </select>

              {/* Checkboxes de Configuración */}
              <div className="flex items-center flex-wrap gap-3 text-xs text-stone-700 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                <label className="flex items-center gap-1.5 cursor-pointer select-none" title="Incluir u omitir la palabra 'Familia' en el rótulo">
                  <input
                    type="checkbox"
                    checked={includeFamilyWord}
                    onChange={(e) => setIncludeFamilyWord(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-wedding-primary focus:ring-wedding-accent border-stone-300"
                  />
                  <span>Prefijo "Familia"</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCutLines}
                    onChange={(e) => setShowCutLines(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-wedding-primary focus:ring-wedding-accent border-stone-300"
                  />
                  <span>Líneas de corte</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none" title="Incluye número de boletos en letra diminuta para control interno">
                  <input
                    type="checkbox"
                    checked={showSeats}
                    onChange={(e) => setShowSeats(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-wedding-primary focus:ring-wedding-accent border-stone-300"
                  />
                  <span>Mostrar pases</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none" title="Incluir hoja de portada con instrucciones técnicas al inicio del PDF">
                  <input
                    type="checkbox"
                    checked={includeInstructionsPage}
                    onChange={(e) => setIncludeInstructionsPage(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-wedding-primary focus:ring-wedding-accent border-stone-300"
                  />
                  <span>Hoja de Instrucciones en PDF</span>
                </label>
              </div>

              {/* Botón Guardar PDF Directo (NUEVO) */}
              <button
                onClick={handleDirectPdfDownload}
                disabled={isGeneratingPdf || filteredCards.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                title="Generar y descargar el archivo PDF directo listo para imprimir en tamaño Carta con fondo blanco puro"
              >
                <FileDown size={16} />
                <span>{isGeneratingPdf ? 'Generando PDF...' : 'Guardar PDF Directo (Carta)'}</span>
              </button>

              {/* Botón Imprimir (Nativo Ctrl + P) */}
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs sm:text-sm font-semibold border border-stone-300 transition-all active:scale-95 cursor-pointer"
                title="Abrir cuadro de diálogo de la impresora de la computadora"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Imprimir (Ctrl + P)</span>
              </button>

              {/* Copiar lista */}
              <button
                onClick={handleCopyNames}
                className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200"
                title="Copiar lista de nombres rotulados"
              >
                {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </button>

              {/* Botón cerrar escritorio */}
              <button
                onClick={onClose}
                className="hidden lg:flex p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
                aria-label="Cerrar ventana"
              >
                <X size={20} />
              </button>
            </div>

          </div>
        </div>

        {/* Panel Informativo de Parámetros de Impresión */}
        <div className="bg-amber-50/90 border-t border-amber-200/70 px-4 sm:px-6 py-2.5 text-xs text-amber-950 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Info size={15} className="shrink-0 text-amber-700" />
            <span>
              <strong>Parámetros garantizados:</strong> Tamaño <strong>Carta (Letter: 215.9 × 279.4 mm)</strong> • Márgenes perimetrales de <strong>10 mm</strong> • Fondo <strong>Blanco Puro (100% sin tinta de fondo)</strong>. En tu impresora, selecciona escala <strong>100% (Tamaño Real)</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[11px] text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/60">
              Estilo: {getStyleBadgeLabel()}
            </span>
          </div>
        </div>
      </header>

      {/* Área Imprimible con Hojas Tamaño Carta */}
      <main id="printable-labels-area" className="max-w-5xl mx-auto py-6 sm:py-10 px-3 sm:px-6 space-y-10">
        {pages.map((pageCards, pageIndex) => (
          <div 
            key={`page-${pageIndex}`}
            className="label-sheet-page relative bg-white mx-auto shadow-2xl rounded-sm border border-stone-300/80 p-[10mm] transition-all"
            style={{
              width: '100%',
              maxWidth: '215.9mm', // Ancho Carta oficial
              minHeight: '279.4mm', // Alto Carta oficial
              backgroundColor: '#FFFFFF',
              boxSizing: 'border-box',
            }}
          >
            {/* Indicador de número de página en pantalla (oculto en impresión) */}
            <div className="no-print absolute top-3 right-4 text-[11px] font-semibold text-stone-400 tracking-wider uppercase">
              Hoja {pageIndex + 1} de {pages.length}
            </div>

            {/* Cuadrícula de 2 columnas de etiquetas */}
            <div className="grid grid-cols-2 gap-[4mm] h-full items-stretch">
              {pageCards.map((card) => {
                const labelText = getLabelTitle(card);

                return (
                  <div
                    key={card.id}
                    className={`relative flex flex-col items-center justify-center text-center p-4 transition-all rounded-xs overflow-hidden bg-white ${getLabelHeightClass()} ${
                      showCutLines ? 'border border-dashed border-stone-300' : 'border border-transparent'
                    }`}
                    style={{ backgroundColor: '#FFFFFF' }}
                  >
                    {/* Estilo 1: Doble línea dorada clásica */}
                    {(styleTheme === 'frame-double' || styleTheme === 'frame') && (
                      <>
                        <div className="absolute inset-1 border border-[#C5A880]/85 pointer-events-none rounded-xs" />
                        <div className="absolute inset-2 border border-[#C5A880]/45 pointer-events-none rounded-xs" />
                      </>
                    )}

                    {/* Estilo 2: Línea fina minimalista moderna */}
                    {styleTheme === 'frame-minimal' && (
                      <div className="absolute inset-1.5 border border-[#C5A880]/85 pointer-events-none rounded-xs" />
                    )}

                    {/* Estilo 3: Esquinas Art Déco con escuadras */}
                    {styleTheme === 'frame-corners' && (
                      <>
                        <div className="absolute inset-2 border border-[#C5A880]/60 pointer-events-none" />
                        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#A68453] pointer-events-none" />
                        <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#A68453] pointer-events-none" />
                        <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#A68453] pointer-events-none" />
                        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#A68453] pointer-events-none" />
                      </>
                    )}

                    {/* Estilo 4: Romántico con rombos en las esquinas */}
                    {styleTheme === 'frame-vintage' && (
                      <>
                        <div className="absolute inset-2 border border-[#C5A880]/70 pointer-events-none" />
                        <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-[#A68453] rotate-45 pointer-events-none" />
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#A68453] rotate-45 pointer-events-none" />
                        <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 bg-[#A68453] rotate-45 pointer-events-none" />
                        <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-[#A68453] rotate-45 pointer-events-none" />
                      </>
                    )}

                    {/* Estilo 5: Esquinas francesas redondeadas dobles */}
                    {styleTheme === 'frame-french' && (
                      <>
                        <div className="absolute inset-1.5 border border-[#C5A880]/85 rounded-md pointer-events-none" />
                        <div className="absolute inset-2.5 border border-[#C5A880]/40 rounded-sm pointer-events-none" />
                      </>
                    )}

                    {/* Estilo 6: Monograma E & D con filete decorativo superior */}
                    {(styleTheme === 'frame-monogram' || styleTheme === 'monogram') && (
                      <>
                        <div className="absolute inset-1 border border-[#C5A880]/80 rounded-xs pointer-events-none" />
                        <div className="absolute top-2 left-0 right-0 flex items-center justify-center gap-2 pointer-events-none px-4">
                          <div className="h-[1px] bg-[#C5A880]/60 flex-1 max-w-[28px]" />
                          <span className="text-[10px] font-serif tracking-[0.2em] text-[#A68453] font-bold select-none">
                            E & D
                          </span>
                          <div className="h-[1px] bg-[#C5A880]/60 flex-1 max-w-[28px]" />
                        </div>
                      </>
                    )}

                    {/* Texto principal con fuente Monotype Corsiva */}
                    <div className={`w-full px-3 my-auto ${(styleTheme === 'frame-monogram' || styleTheme === 'monogram') ? 'pt-2' : ''}`}>
                      <span 
                        className={`font-corsiva text-stone-900 tracking-wide break-words block ${getFontSizeClass()}`}
                        style={{
                          textRendering: 'optimizeLegibility',
                          WebkitFontSmoothing: 'antialiased',
                        }}
                      >
                        {labelText}
                      </span>
                    </div>

                    {/* Micro-indicador de pases (opcional para control de entrega de sobres) */}
                    {showSeats && (
                      <div className="absolute bottom-1.5 right-2.5 text-[10px] text-stone-400 font-sans tracking-tight">
                        {card.seats} {card.seats === 1 ? 'pase' : 'pases'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>

    </div>
  );
}
