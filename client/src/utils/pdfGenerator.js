import { jsPDF } from 'jspdf';
import autoTableModule from 'jspdf-autotable';
import { MONOTYPE_CORSIVA_BASE64 } from './monotypeCorsivaBase64.js';

const autoTable = autoTableModule?.default || autoTableModule;

/**
 * Genera y descarga un PDF profesional tamaño Carta con la lista de rotulación de sobres y tarjetas
 * @param {Array} cards - Lista completa de tarjetas calculadas
 * @param {Object} summary - Resumen de métricas (totalCards, totalSeatsRequired, etc.)
 */
export function generateInvitationCardsPDF(cards, summary = {}) {
  // Tamaño Carta estándar: 8.5 x 11 pulgadas (215.9 x 279.4 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Paleta de colores elegante de la boda
  const primaryColor = [31, 58, 46];     // #1F3A2E (Verde esmeralda bosque)
  const goldColor = [197, 168, 128];     // #C5A880 (Dorado boda)
  const textDark = [45, 55, 72];         // #2D3748 (Gris carbón)
  const textMuted = [120, 113, 108];     // #78716C (Gris suave)
  const creamBg = [250, 247, 242];       // #FAF7F2 (Fondo crema)

  // 1. Cabecera decorativa
  // Línea dorada superior
  doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.setLineWidth(1.2);
  doc.line(margin, 10, pageWidth - margin, 10);

  // Monograma circular "E & D"
  const logoX = margin + 8;
  const logoY = 22;
  const logoR = 8.5;

  // Círculo exterior dorado
  doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.setLineWidth(0.6);
  doc.circle(logoX, logoY, logoR, 'S');

  // Círculo interior
  doc.setFillColor(creamBg[0], creamBg[1], creamBg[2]);
  doc.circle(logoX, logoY, logoR - 0.7, 'FD');

  // Texto monograma
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('E & D', logoX, logoY + 1.2, { align: 'center' });

  // Título y Subtítulo
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('NUESTRA BODA', margin + 22, 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.text('CONTROL DE ROTULACIÓN DE SOBRES & TARJETAS DE INVITACIÓN', margin + 22, 24.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Documento oficial para imprenta y calígrafo • Generado el ${fechaHoy}`, margin + 22, 29);

  // 2. Tarjetas de Resumen KPI (4 Cajas métricas)
  const boxY = 33;
  const boxHeight = 14;
  const gap = 3.5;
  const boxWidth = (pageWidth - (margin * 2) - (gap * 3)) / 4;

  const kpis = [
    { label: 'TOTAL SOBRES', value: `${summary.totalCards || cards.length}`, sub: 'Tarjetas requeridas' },
    { label: 'FAMILIAS', value: `${summary.totalFamilyCards || 0}`, sub: 'Tarjetas familiares' },
    { label: 'INDIVIDUALES', value: `${summary.totalIndividualCards || 0}`, sub: 'Parejas e ind.' },
    { label: 'PASES TOTALES', value: `${summary.totalSeatsRequired || 0}`, sub: 'Boletos a incluir' }
  ];

  kpis.forEach((kpi, index) => {
    const bx = margin + (index * (boxWidth + gap));
    
    // Fondo de tarjeta
    doc.setFillColor(creamBg[0], creamBg[1], creamBg[2]);
    doc.setDrawColor(225, 218, 205);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, boxY, boxWidth, boxHeight, 2, 2, 'FD');

    // Etiqueta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(kpi.label, bx + (boxWidth / 2), boxY + 4, { align: 'center' });

    // Valor principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(kpi.value, bx + (boxWidth / 2), boxY + 9.5, { align: 'center' });

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(kpi.sub, bx + (boxWidth / 2), boxY + 12.5, { align: 'center' });
  });

  // 3. Preparación de filas de la tabla
  const tableRows = cards.map((card, index) => {
    const num = (index + 1).toString();
    const rotulacion = card.salutation || card.title || 'Sin rotular';
    const tipo = card.type === 'family' ? 'Familiar' : card.type === 'couple' ? 'Pareja' : 'Individual';
    const pases = `${card.seats || 1} ${card.seats === 1 ? 'pase' : 'pases'}`;
    const integrantes = (card.members || []).map((m) => m.name).join(', ') || '-';
    const telefono = card.phone || '-';
    const entregado = card.delivered ? 'Entregada' : 'Por entregar';

    return [num, rotulacion, tipo, pases, integrantes, telefono, entregado];
  });

  // 4. Renderizado de la tabla con autoTable
  autoTable(doc, {
    startY: boxY + boxHeight + 5,
    margin: { left: margin, right: margin, bottom: 16 },
    head: [['#', 'Rotulación en el Sobre', 'Tipo', 'Pases', 'Integrantes Asignados', 'Teléfono', 'Entrega']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 2.5
    },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      textColor: [textDark[0], textDark[1], textDark[2]],
      cellPadding: 2.2,
      lineColor: [230, 225, 215],
      lineWidth: 0.15,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },                               // #
      1: { fontStyle: 'bold', textColor: [primaryColor[0], primaryColor[1], primaryColor[2]], cellWidth: 46 }, // Rotulación
      2: { cellWidth: 20 },                                                // Tipo
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },           // Pases
      4: { cellWidth: 55 },                                                // Integrantes
      5: { cellWidth: 24, fontSize: 7 },                                   // Teléfono
      6: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }            // Entrega
    },
    alternateRowStyles: {
      fillColor: [253, 251, 247] // #FDFBF7 alternante elegante
    },
    didDrawPage: (data) => {
      // Pie de página en cada hoja
      const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
      const totalPages = doc.internal.getNumberOfPages();

      doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.setLineWidth(0.4);
      doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text('Nuestra Boda • Sistema de Gestión de Invitados y Familias', margin, pageHeight - 6.5);

      doc.setFont('helvetica', 'bold');
      doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
    }
  });

  // 5. Descarga directa del archivo PDF
  const fechaStr = new Date().toISOString().split('T')[0];
  const filename = `Lista_Rotulacion_Tarjetas_Boda_ED_${fechaStr}.pdf`;
  doc.save(filename);
}

/**
 * Genera y descarga un PDF listo para imprimir en tamaño Carta con las etiquetas de sobres
 * @param {Array} cards - Lista de tarjetas a incluir
 * @param {Object} options - Opciones de configuración (layoutFormat, styleTheme, showCutLines, showSeats, includeFamilyWord, includeInstructionsPage, fontSize)
 */
export function generateDirectLabelsPDF(cards, options = {}) {
  const {
    layoutFormat = '10', // '10' (2x5), '8' (2x4), '14' (2x7)
    styleTheme = 'frame', // 'clean', 'frame', 'monogram'
    showCutLines = true,
    showSeats = false,
    includeFamilyWord = true,
    includeInstructionsPage = false,
    fontSize = 'md'
  } = options;

  // Tamaño Carta oficial: 215.9 x 279.4 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  // Incrustar fuente auténtica Monotype Corsiva en el PDF
  let hasCorsiva = false;
  try {
    doc.addFileToVFS('MonotypeCorsiva.ttf', MONOTYPE_CORSIVA_BASE64);
    doc.addFont('MonotypeCorsiva.ttf', 'MonotypeCorsiva', 'normal');
    hasCorsiva = true;
  } catch (err) {
    console.warn('Error al incrustar Monotype Corsiva en jsPDF:', err);
  }

  const pageWidth = doc.internal.pageSize.getWidth();   // 215.9 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 279.4 mm
  const goldColor = [197, 168, 128]; // #C5A880
  const darkColor = [35, 35, 35];
  const mutedColor = [120, 113, 108];

  // 1. Hoja de instrucciones opcional (Página 1)
  if (includeInstructionsPage) {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Borde elegante
    doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setLineWidth(0.8);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
    doc.setLineWidth(0.3);
    doc.rect(14, 14, pageWidth - 28, pageHeight - 28);

    // Monograma E & D
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.text('E  &  D', pageWidth / 2, 35, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('NUESTRA BODA', pageWidth / 2, 45, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.text('GUÍA DE IMPRESIÓN PARA ETIQUETAS DE SOBRES', pageWidth / 2, 54, { align: 'center' });

    // Cuadro de parámetros técnicos
    doc.setFillColor(250, 248, 245);
    doc.setDrawColor(220, 215, 205);
    doc.setLineWidth(0.3);
    doc.roundedRect(24, 65, pageWidth - 48, 65, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('PARÁMETROS TÉCNICOS CONFIGURADOS:', 32, 75);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text('• Tamaño de papel oficial: Carta (Letter: 8.5 x 11 pulgadas / 215.9 x 279.4 mm).', 32, 84);
    doc.text('• Margen perimetral: 10 mm estándar.', 32, 92);
    doc.text(`• Distribución: ${layoutFormat === '8' ? '8 etiquetas por hoja (2x4)' : layoutFormat === '14' ? '14 etiquetas por hoja (2x7)' : '10 etiquetas por hoja (2x5)'}.`, 32, 100);
    doc.text('• Fondo de etiqueta: Blanco puro (sin consumo innecesario de tinta ni toner).', 32, 108);
    doc.text(`• Total de tarjetas a rotular: ${cards.length} etiquetas.`, 32, 116);

    // Instrucciones paso a paso
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('INSTRUCCIONES DE IMPRESIÓN RECOMENDADAS:', 24, 145);

    const steps = [
      '1. Escala al 100%: En el menú de tu impresora, desactiva "Ajustar a página" y selecciona "Tamaño Real" (100%).',
      '2. Papel de etiquetas: Puedes alimentar hojas autoadhesivas tamaño Carta (Avery 5163 o compatible).',
      '3. Papel tradicional: Si usas cartulina u opalina blanca/crema, recorta siguiendo las líneas guía.',
      '4. Calidad de impresión: Elige "Calidad Alta" o "Fotográfica" para máxima nitidez caligráfica.'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(70, 70, 70);
    steps.forEach((step, idx) => {
      doc.text(step, 24, 155 + (idx * 9));
    });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('Las etiquetas comienzan en la página siguiente en formato limpio y fondo blanco puro.', pageWidth / 2, 230, { align: 'center' });

    doc.addPage();
  }

  // Dimensiones de cuadrícula
  const cols = 2;
  const rows = layoutFormat === '8' ? 4 : layoutFormat === '14' ? 7 : 5;
  const itemsPerPage = cols * rows;

  const marginLeft = 10;
  const marginTop = 12;
  const gapX = 4;
  const gapY = 3.5;

  const colWidth = (pageWidth - (2 * marginLeft) - ((cols - 1) * gapX)) / cols;
  const rowHeight = (pageHeight - (2 * marginTop) - ((rows - 1) * gapY)) / rows;

  let fontSizePt = 21;
  if (fontSize === 'sm') fontSizePt = 17;
  if (fontSize === 'lg') fontSizePt = 25;
  if (layoutFormat === '14') fontSizePt = Math.min(fontSizePt, 15);

  // Dividir tarjetas en páginas
  for (let i = 0; i < cards.length; i += itemsPerPage) {
    if (i > 0) {
      doc.addPage();
    }

    const pageCards = cards.slice(i, i + itemsPerPage);

    pageCards.forEach((card, idx) => {
      const colIndex = idx % cols;
      const rowIndex = Math.floor(idx / cols);

      const x = marginLeft + (colIndex * (colWidth + gapX));
      const y = marginTop + (rowIndex * (rowHeight + gapY));

      // 1. Fondo 100% BLANCO PURO
      doc.setFillColor(255, 255, 255);
      doc.rect(x, y, colWidth, rowHeight, 'F');

      // 2. Líneas de corte punteadas
      if (showCutLines) {
        doc.setDrawColor(215, 215, 215);
        doc.setLineWidth(0.15);
        doc.setLineDashPattern([2, 2], 0);
        doc.rect(x, y, colWidth, rowHeight, 'S');
        doc.setLineDashPattern([], 0);
      }

      // 3. Marcos decorativos finos y elegantes (100% fondo blanco puro)
      if (styleTheme === 'frame' || styleTheme === 'frame-double') {
        // Estilo 1: Doble línea dorada clásica
        doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.setLineWidth(0.4);
        doc.roundedRect(x + 0.6, y + 0.6, colWidth - 1.2, rowHeight - 1.2, 1.2, 1.2, 'S');

        doc.setLineWidth(0.2);
        doc.roundedRect(x + 1.8, y + 1.8, colWidth - 3.6, rowHeight - 3.6, 0.8, 0.8, 'S');
      } else if (styleTheme === 'frame-minimal') {
        // Estilo 2: Línea fina minimalista moderna
        doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.setLineWidth(0.35);
        doc.roundedRect(x + 1, y + 1, colWidth - 2, rowHeight - 2, 1.5, 1.5, 'S');
      } else if (styleTheme === 'frame-corners') {
        // Estilo 3: Esquinas Art Déco con escuadras
        doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.setLineWidth(0.3);
        doc.rect(x + 1.5, y + 1.5, colWidth - 3, rowHeight - 3, 'S');

        doc.setLineWidth(0.5);
        // Sup-izq
        doc.line(x + 0.8, y + 0.8, x + 4.5, y + 0.8);
        doc.line(x + 0.8, y + 0.8, x + 0.8, y + 4.5);
        // Sup-der
        doc.line(x + colWidth - 0.8, y + 0.8, x + colWidth - 4.5, y + 0.8);
        doc.line(x + colWidth - 0.8, y + 0.8, x + colWidth - 0.8, y + 4.5);
        // Inf-izq
        doc.line(x + 0.8, y + rowHeight - 0.8, x + 4.5, y + rowHeight - 0.8);
        doc.line(x + 0.8, y + rowHeight - 0.8, x + 0.8, y + rowHeight - 4.5);
        // Inf-der
        doc.line(x + colWidth - 0.8, y + rowHeight - 0.8, x + colWidth - 4.5, y + rowHeight - 0.8);
        doc.line(x + colWidth - 0.8, y + rowHeight - 0.8, x + colWidth - 0.8, y + rowHeight - 4.5);
      } else if (styleTheme === 'frame-vintage') {
        // Estilo 4: Romántico con rombos en esquinas
        doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.setLineWidth(0.3);
        doc.rect(x + 2, y + 2, colWidth - 4, rowHeight - 4, 'S');

        // Pequeños rombos decorativos
        const drawDiamond = (cx, cy, r = 0.9) => {
          doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
          doc.lines([[-r, r], [r, r], [r, -r], [-r, -r]], cx, cy - r, [1, 1], 'F');
        };
        drawDiamond(x + 2, y + 2);
        drawDiamond(x + colWidth - 2, y + 2);
        drawDiamond(x + 2, y + rowHeight - 2);
        drawDiamond(x + colWidth - 2, y + rowHeight - 2);
      } else if (styleTheme === 'frame-french') {
        // Estilo 5: Esquinas francesas redondeadas dobles
        doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.setLineWidth(0.38);
        doc.roundedRect(x + 1, y + 1, colWidth - 2, rowHeight - 2, 3, 3, 'S');
        doc.setLineWidth(0.18);
        doc.roundedRect(x + 2.2, y + 2.2, colWidth - 4.4, rowHeight - 4.4, 2, 2, 'S');
      } else if (styleTheme === 'frame-monogram' || styleTheme === 'monogram') {
        // Estilo 6: Con Monograma E & D y filete decorativo
        doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.setLineWidth(0.35);
        doc.roundedRect(x + 0.8, y + 0.8, colWidth - 1.6, rowHeight - 1.6, 1.2, 1.2, 'S');

        doc.setFont('times', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.text('E  &  D', x + (colWidth / 2), y + 6.2, { align: 'center' });

        doc.setLineWidth(0.2);
        doc.line(x + 8, y + 5.5, x + (colWidth / 2) - 8, y + 5.5);
        doc.line(x + (colWidth / 2) + 8, y + 5.5, x + colWidth - 8, y + 5.5);
      }

      // 4. Texto de rotulación
      let labelText = card.salutation || card.title;
      if (!includeFamilyWord && card.type === 'family') {
        labelText = labelText.replace(/^Familia\s+/i, '').replace(/^Famia\s+/i, '').replace(/^Fanilia\s+/i, '');
      }

      if (hasCorsiva) {
        doc.setFont('MonotypeCorsiva', 'normal');
      } else {
        doc.setFont('times', 'italic');
      }
      doc.setFontSize(fontSizePt);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

      const maxTextWidth = colWidth - 10;
      const textLines = doc.splitTextToSize(labelText, maxTextWidth);
      const lineHeightMm = (fontSizePt * 0.3527) * 1.2;
      const totalBlockHeight = textLines.length * lineHeightMm;
      const monogramOffset = (styleTheme === 'frame-monogram' || styleTheme === 'monogram') ? 1.5 : 0;
      const startY = y + (rowHeight / 2) - (totalBlockHeight / 2) + (fontSizePt * 0.3527 * 0.85) + monogramOffset;

      doc.text(textLines, x + (colWidth / 2), startY, { align: 'center' });

      // 5. Micro-indicador de pases (si está activado)
      if (showSeats) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`${card.seats} ${card.seats === 1 ? 'pase' : 'pases'}`, x + colWidth - 3, y + rowHeight - 2.5, { align: 'right' });
      }
    });
  }

  // Descarga directa
  const fechaStr = new Date().toISOString().split('T')[0];
  const filename = `Etiquetas_Sobres_Boda_ED_${fechaStr}.pdf`;
  doc.save(filename);
}

function formatHNL(value, includePrefix = true) {
  const num = Number(value) || 0;
  const isNeg = num < -0.004;
  const absFixed = Math.abs(num).toFixed(2);
  const [intPart, decPart] = absFixed.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = isNeg ? '-' : '';
  return includePrefix ? `${sign}L. ${withCommas}.${decPart}` : `${sign}${withCommas}.${decPart}`;
}

function cleanPdfText(str = '') {
  return String(str || '')
    .replace(/[\u202F\u00A0]/g, ' ')
    .replace(/[^\x20-\x7E\xA1-\xFF•]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatShortDateEs(dateVal) {
  if (!dateVal) return 'Sin fecha';
  try {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    if (dateVal instanceof Date && !Number.isNaN(dateVal.getTime())) {
      const dd = String(dateVal.getUTCDate()).padStart(2, '0');
      const mm = dateVal.getUTCMonth();
      const yyyy = dateVal.getUTCFullYear();
      return `${dd} ${months[mm] || ''} ${yyyy}`;
    }
    const clean = String(dateVal).split('T')[0];
    const [yyyy, mm, dd] = clean.split('-').map(Number);
    if (!yyyy || !mm || !dd) return 'Sin fecha';
    return `${String(dd).padStart(2, '0')} ${months[mm - 1] || ''} ${yyyy}`;
  } catch {
    return 'Sin fecha';
  }
}

function normalizeIsoDateForSort(dateVal) {
  if (!dateVal) return '9999-12-31';
  if (dateVal instanceof Date && !Number.isNaN(dateVal.getTime())) {
    return dateVal.toISOString().split('T')[0];
  }
  const clean = String(dateVal).split('T')[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : '9999-12-31';
}

function formatAssignedLabel(assigned = '') {
  const norm = String(assigned || '').toLowerCase();
  if (norm.includes('novio') || norm.includes('edis')) return 'Edis (Novio)';
  if (norm.includes('novia') || norm.includes('dania')) return 'Dania (Novia)';
  return 'Juntos';
}

/**
 * Genera un Informe Ejecutivo Formal en PDF (Tamaño Carta) del Módulo de Gastos y Presupuesto de Boda.
 * @param {Array} tasks - Lista de tareas/actividades con costos estimados y reales
 * @param {Object} options - Opciones adicionales ({ returnArrayBuffer: boolean, filename?: string })
 */
export function generateExpensesReportPDF(tasks = [], options = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();   // 215.9 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 279.4 mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;          // 187.9 mm

  // Paleta ejecutiva editorial
  const primaryColor = [31, 58, 46];      // #1F3A2E Verde bosque profundo
  const emeraldAccent = [22, 120, 74];    // #16784A Verde esmeralda (pagado)
  const goldColor = [184, 148, 98];       // #B89462 Dorado champaña oscuro legible
  const amberDark = [168, 92, 16];        // #A85C10 Ámbar ejecutivo (saldo pendiente)
  const textDark = [35, 42, 49];          // #232A31 Carbón legible
  const textMuted = [110, 106, 100];      // #6E6A64 Gris cálido secundario
  const creamBg = [250, 248, 244];        // #FAF8F4 Fondo marfil suave
  const borderSoft = [224, 218, 206];     // #E0DACE Borde cálido

  // =========================================================================
  // PROCESAMIENTO Y CÁLCULO FINANCIERO EXACTO
  // =========================================================================
  const normalizedItems = (Array.isArray(tasks) ? tasks : []).map((t) => {
    const est = Math.max(0, parseFloat(t.estimated_cost) || 0);
    const paid = Math.max(0, parseFloat(t.actual_cost) || 0);
    const isCompleted = t.status === 'completed';

    // Si la actividad ya fue marcada como completada y pagada, su saldo pendiente es 0;
    // si sigue en curso, el saldo pendiente a desembolsar es max(0, est - paid).
    const pendingBalance = isCompleted ? 0 : Math.max(0, est - paid);
    const projectedTotal = isCompleted ? (paid > 0 ? paid : est) : Math.max(est, paid);
    const overBudgetDiff = paid > est && est > 0 ? paid - est : 0;

    let paymentState = 'SIN COSTO';
    if (est > 0 || paid > 0) {
      if (pendingBalance <= 0.009 && paid > 0) {
        paymentState = 'LIQUIDADO';
      } else if (isCompleted && paid === 0 && est > 0) {
        paymentState = 'COMPLETADO';
      } else if (paid > 0 && pendingBalance > 0) {
        const pct = Math.min(99, Math.round((paid / projectedTotal) * 100));
        paymentState = `ABONO (${pct}%)`;
      } else {
        paymentState = 'POR PAGAR';
      }
    }

    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
    const pendingSubtasks = subtasks
      .filter((st) => !st.completed && st.title)
      .map((st) => cleanPdfText(st.title));
    const completedSubtasks = subtasks
      .filter((st) => st.completed && st.title)
      .map((st) => cleanPdfText(st.title));

    return {
      id: t.id,
      title: cleanPdfText(t.title || 'Concepto sin nombre'),
      description: cleanPdfText(t.description || ''),
      category: cleanPdfText(t.category || 'General'),
      assigned: formatAssignedLabel(t.assigned_to),
      dueDateStr: formatShortDateEs(t.due_date),
      rawDueDate: normalizeIsoDateForSort(t.due_date),
      isCompleted,
      est,
      paid,
      pendingBalance,
      projectedTotal,
      overBudgetDiff,
      paymentState,
      pendingSubtasks,
      completedSubtasks,
    };
  });

  // Rubros financieros activos (tienen presupuesto estimado o pago registrado)
  const expenseItems = normalizedItems
    .filter((item) => item.est > 0 || item.paid > 0)
    .sort((a, b) => b.projectedTotal - a.projectedTotal || b.pendingBalance - a.pendingBalance);

  // Actividades pendientes que aún no tienen cotización/monto registrado (L. 0.00)
  const unquotedPendingItems = normalizedItems
    .filter((item) => item.est === 0 && item.paid === 0 && !item.isCompleted)
    .sort((a, b) => a.rawDueDate.localeCompare(b.rawDueDate));

  const totalEstimated = expenseItems.reduce((sum, i) => sum + i.est, 0);
  const totalPaid = expenseItems.reduce((sum, i) => sum + i.paid, 0);
  const totalPendingBalance = expenseItems.reduce((sum, i) => sum + i.pendingBalance, 0);
  const totalProjected = expenseItems.reduce((sum, i) => sum + i.projectedTotal, 0);
  const netVariance = totalProjected - totalEstimated;

  const paidPercentage =
    totalProjected > 0 ? Math.min(100, (totalPaid / totalProjected) * 100) : 0;

  const countLiquidated = expenseItems.filter((i) => i.paymentState === 'LIQUIDADO').length;
  const countPartial = expenseItems.filter((i) => i.paymentState.startsWith('ABONO')).length;
  const countUnpaid = expenseItems.filter((i) => i.paymentState === 'POR PAGAR').length;

  // Agrupación por Categoría
  const categoryMap = new Map();
  expenseItems.forEach((item) => {
    const key = item.category || 'General';
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        category: key,
        count: 0,
        est: 0,
        paid: 0,
        pending: 0,
        projected: 0,
      });
    }
    const bucket = categoryMap.get(key);
    bucket.count += 1;
    bucket.est += item.est;
    bucket.paid += item.paid;
    bucket.pending += item.pendingBalance;
    bucket.projected += item.projectedTotal;
  });

  const categorySummary = Array.from(categoryMap.values()).sort(
    (a, b) => b.projected - a.projected
  );

  // =========================================================================
  // 1. CABECERA EJECUTIVA FORMAL
  // =========================================================================
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 4.5, 'F');
  doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.rect(0, 4.5, pageWidth, 1.1, 'F');

  // Monograma circular E & D
  const logoX = margin + 8.5;
  const logoY = 19.5;
  const logoR = 8.2;

  doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.setLineWidth(0.6);
  doc.circle(logoX, logoY, logoR, 'S');
  doc.setFillColor(creamBg[0], creamBg[1], creamBg[2]);
  doc.circle(logoX, logoY, logoR - 0.8, 'FD');

  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('E & D', logoX, logoY + 1.3, { align: 'center' });

  // Títulos principales
  doc.setFont('times', 'bold');
  doc.setFontSize(15.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('INFORME DE PRESUPUESTO Y CONTROL DE GASTOS', margin + 21, 16.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.text('BODA EDIS & DANIA  •  21 DE NOVIEMBRE DE 2026  •  CALAN PARK, VILLANUEVA', margin + 21, 21.3);

  const now = new Date();
  const mesesLargos = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const fechaEmision = `${now.getDate()} de ${mesesLargos[now.getMonth()]} de ${now.getFullYear()}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Fecha de emisión: ${fechaEmision}  •  Moneda: Lempiras (HNL)  •  Rubros presupuestados: ${expenseItems.length}`,
    margin + 21,
    25.8
  );

  doc.setDrawColor(borderSoft[0], borderSoft[1], borderSoft[2]);
  doc.setLineWidth(0.35);
  doc.line(margin, 30.5, pageWidth - margin, 30.5);

  // =========================================================================
  // 2. RESUMEN EJECUTIVO (4 TARJETAS KPI + BARRA DE AVANCE FINANCIERO)
  // =========================================================================
  const kpiY = 34;
  const kpiH = 19.5;
  const kpiGap = 3.3;
  const kpiW = (contentWidth - kpiGap * 3) / 4;

  const varianceNote =
    Math.abs(netVariance) < 0.01
      ? 'Sin desviación vs estimado'
      : netVariance > 0
        ? `+${formatHNL(netVariance)} sobre estimado`
        : `${formatHNL(netVariance)} bajo estimado`;

  const kpiCards = [
    {
      label: 'PRESUPUESTO ESTIMADO',
      value: formatHNL(totalEstimated),
      sub: `${expenseItems.length} rubros cotizados`,
      accent: primaryColor,
      bg: creamBg,
      border: borderSoft,
    },
    {
      label: 'TOTAL PAGADO A LA FECHA',
      value: formatHNL(totalPaid),
      sub: `${paidPercentage.toFixed(1)}% del total cubierto`,
      accent: emeraldAccent,
      bg: [242, 250, 245],
      border: [182, 224, 198],
    },
    {
      label: 'SALDO PENDIENTE POR PAGAR',
      value: formatHNL(totalPendingBalance),
      sub: `${(100 - paidPercentage).toFixed(1)}% restante por liquidar`,
      accent: amberDark,
      bg: [254, 249, 240],
      border: [238, 210, 168],
    },
    {
      label: 'COSTO TOTAL PROYECTADO',
      value: formatHNL(totalProjected),
      sub: varianceNote,
      accent: primaryColor,
      bg: creamBg,
      border: [197, 168, 128],
    },
  ];

  kpiCards.forEach((kpi, idx) => {
    const bx = margin + idx * (kpiW + kpiGap);

    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.setLineWidth(0.35);
    doc.roundedRect(bx, kpiY, kpiW, kpiH, 2, 2, 'FD');

    // Acento superior de color en cada tarjeta
    doc.setFillColor(kpi.accent[0], kpi.accent[1], kpi.accent[2]);
    doc.rect(bx + 2, kpiY, kpiW - 4, 0.9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(kpi.label, bx + kpiW / 2, kpiY + 4.8, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(kpi.accent[0], kpi.accent[1], kpi.accent[2]);
    doc.text(kpi.value, bx + kpiW / 2, kpiY + 11.6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(kpi.sub, bx + kpiW / 2, kpiY + 16.5, { align: 'center' });
  });

  // Barra visual ejecutiva de progreso de pagos y balance en mano
  const cashOnHandNum = Math.max(0, parseFloat(options.cashOnHand) || 0);
  const hasCashOnHand = cashOnHandNum > 0;
  const barBoxY = kpiY + kpiH + 3.5;
  const barBoxH = hasCashOnHand ? 18.5 : 14.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderSoft[0], borderSoft[1], borderSoft[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, barBoxY, contentWidth, barBoxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('AVANCE GENERAL DE LIQUIDACIÓN DE GASTOS', margin + 4, barBoxY + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Liquidados: ${countLiquidated}  •  Con abono parcial: ${countPartial}  •  Pendientes de primer pago: ${countUnpaid}`,
    pageWidth - margin - 4,
    barBoxY + 4.8,
    { align: 'right' }
  );

  // Riel de progreso
  const trackX = margin + 4;
  const trackY = barBoxY + 7.2;
  const trackW = contentWidth - 8;
  const trackH = 4.2;

  doc.setFillColor(238, 232, 222);
  doc.roundedRect(trackX, trackY, trackW, trackH, 1.5, 1.5, 'F');

  if (paidPercentage > 0) {
    const fillW = Math.max(3, (trackW * paidPercentage) / 100);
    doc.setFillColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
    doc.roundedRect(trackX, trackY, fillW, trackH, 1.5, 1.5, 'F');
  }

  // Si hay dinero en mano registrado, mostrar cálculo de cobertura en la barra ejecutiva
  if (hasCashOnHand) {
    const cashDiff = cashOnHandNum - totalPendingBalance;
    const isCovered = cashDiff >= 0;
    const deficit = Math.max(0, totalPendingBalance - cashOnHandNum);
    const surplus = Math.max(0, cashDiff);
    const covPct = totalPendingBalance > 0 ? Math.min(100, Math.round((cashOnHandNum / totalPendingBalance) * 100)) : 100;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(isCovered ? emeraldAccent[0] : amberDark[0], isCovered ? emeraldAccent[1] : amberDark[1], isCovered ? emeraldAccent[2] : amberDark[2]);
    const statusText = isCovered
      ? `DINERO EN MANO: ${formatHNL(cashOnHandNum)}  •  ¡META 100% CUBIERTA! (Superávit de +${formatHNL(surplus)})`
      : `DINERO EN MANO: ${formatHNL(cashOnHandNum)}  •  FALTAN POR CUBRIR: ${formatHNL(deficit)} (${covPct}% cubierto con fondos en mano)`;
    doc.text(statusText, margin + 4, barBoxY + 15.5);
  }

  // Helper para dibujar subtítulos de sección con estilo editorial
  const drawSectionHeading = (numStr, titleStr, subtitleStr, yPos) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, yPos, 5.5, 5.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(numStr, margin + 2.75, yPos + 3.9, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(titleStr, margin + 8, yPos + 4.2);

    if (subtitleStr) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(subtitleStr, pageWidth - margin, yPos + 4.2, { align: 'right' });
    }
    return yPos + 7.5;
  };

  // =========================================================================
  // 3. TABLA 1: DESGLOSE DETALLADO DE RUBROS PRESUPUESTADOS
  // =========================================================================
  let cursorY = barBoxY + barBoxH + 5.5;
  cursorY = drawSectionHeading(
    '1',
    'Desglose Detallado de Gastos y Saldos por Rubro',
    'Ordenado de mayor a menor impacto financiero',
    cursorY
  );

  const detailRows =
    expenseItems.length > 0
      ? expenseItems.map((item, index) => {
          const detailNotes = [];
          if (item.dueDateStr !== 'Sin fecha') {
            detailNotes.push(`Meta: ${item.dueDateStr}`);
          }
          if (item.overBudgetDiff > 0) {
            detailNotes.push(`+${formatHNL(item.overBudgetDiff)} vs estimado`);
          }
          if (item.pendingSubtasks.length > 0) {
            const joined = item.pendingSubtasks.join(', ');
            const prefix = /^pendiente\b/i.test(joined) ? '' : 'Por hacer: ';
            detailNotes.push(`${prefix}${joined}`);
          } else if (item.description) {
            detailNotes.push(item.description);
          }

          const conceptBlock =
            detailNotes.length > 0
              ? `${item.title}\n${detailNotes.join(' • ')}`
              : item.title;

          return [
            String(index + 1),
            conceptBlock,
            item.category,
            item.paymentState,
            formatHNL(item.est, false),
            formatHNL(item.paid, false),
            formatHNL(item.pendingBalance, false),
          ];
        })
      : [['-', 'No hay gastos con monto registrado todavía', '-', '-', '0.00', '0.00', '0.00']];

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin, bottom: 16 },
    head: [[
      '#',
      'Concepto / Rubro y Observaciones',
      'Categoría',
      'Estado Pago',
      'Estimado (L.)',
      'Pagado (L.)',
      'Por Pagar (L.)',
    ]],
    body: detailRows,
    foot: [[
      '',
      'TOTALES GENERALES (LEMPIRAS)',
      `${expenseItems.length} rubros`,
      `${paidPercentage.toFixed(1)}% pagado`,
      formatHNL(totalEstimated, false),
      formatHNL(totalPaid, false),
      formatHNL(totalPendingBalance, false),
    ]],
    showFoot: 'lastPage',
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.6,
      cellPadding: 2.6,
      lineColor: primaryColor,
      lineWidth: 0.2,
    },
    footStyles: {
      fillColor: [38, 66, 52],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.8,
      lineColor: primaryColor,
      lineWidth: 0.2,
    },
    styles: {
      font: 'helvetica',
      fontSize: 7.6,
      textColor: textDark,
      cellPadding: 2.4,
      lineColor: [228, 223, 214],
      lineWidth: 0.18,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [252, 250, 246],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7, textColor: textMuted },
      1: { halign: 'left', cellWidth: 51.9 },
      2: { halign: 'left', cellWidth: 28, fontSize: 7.2 },
      3: { halign: 'center', cellWidth: 27, fontStyle: 'bold', fontSize: 7 },
      4: { halign: 'right', cellWidth: 24.5 },
      5: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
      6: { halign: 'right', cellWidth: 25.5, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'head') {
        if (data.column.index >= 4) data.cell.styles.halign = 'right';
        if (data.column.index === 0 || data.column.index === 3) data.cell.styles.halign = 'center';
      }
      if (data.section === 'foot') {
        if (data.column.index >= 4) data.cell.styles.halign = 'right';
        if (data.column.index === 3) data.cell.styles.halign = 'center';
        if (data.column.index === 6) data.cell.styles.textColor = [255, 226, 173];
      }
      if (data.section === 'body' && expenseItems[data.row.index]) {
        const item = expenseItems[data.row.index];
        // Columna Estado Pago con color semántico claro
        if (data.column.index === 3) {
          if (item.paymentState === 'LIQUIDADO') {
            data.cell.styles.textColor = [18, 112, 66];
            data.cell.styles.fillColor = [236, 249, 241];
          } else if (item.paymentState.startsWith('ABONO')) {
            data.cell.styles.textColor = [154, 88, 14];
            data.cell.styles.fillColor = [254, 246, 232];
          } else if (item.paymentState === 'POR PAGAR') {
            data.cell.styles.textColor = [165, 48, 48];
            data.cell.styles.fillColor = [253, 241, 241];
          }
        }
        // Columna Pagado
        if (data.column.index === 5) {
          data.cell.styles.textColor = item.paid > 0 ? emeraldAccent : textMuted;
        }
        // Columna Saldo Pendiente
        if (data.column.index === 6) {
          data.cell.styles.textColor = item.pendingBalance > 0 ? amberDark : [145, 145, 145];
        }
      }
    },
  });

  cursorY = (doc.lastAutoTable?.finalY || cursorY + 20) + 7.5;

  // =========================================================================
  // 4. TABLA 2: RESUMEN CONSOLIDADO POR CATEGORÍA
  // =========================================================================
  if (categorySummary.length > 0) {
    const estTable2Height = 16 + categorySummary.length * 8.2;
    if (cursorY + estTable2Height > pageHeight - 18) {
      doc.addPage();
      cursorY = 18;
    }

    cursorY = drawSectionHeading(
      '2',
      'Resumen Consolidado por Categoría',
      'Distribución porcentual del presupuesto proyectado',
      cursorY
    );

    const catRows = categorySummary.map((c) => {
      const sharePct =
        totalProjected > 0 ? `${((c.projected / totalProjected) * 100).toFixed(1)}%` : '0.0%';
      return [
        c.category,
        String(c.count),
        sharePct,
        formatHNL(c.est, false),
        formatHNL(c.paid, false),
        formatHNL(c.pending, false),
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin, bottom: 16 },
      head: [[
        'Categoría de Boda',
        'Rubros',
        '% Peso',
        'Estimado (L.)',
        'Pagado (L.)',
        'Saldo Pendiente (L.)',
      ]],
      body: catRows,
      theme: 'grid',
      headStyles: {
        fillColor: [62, 84, 72],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 2.4,
      },
      styles: {
        font: 'helvetica',
        fontSize: 7.6,
        textColor: textDark,
        cellPadding: 2.3,
        lineColor: [228, 223, 214],
        lineWidth: 0.18,
      },
      alternateRowStyles: {
        fillColor: [252, 250, 246],
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 55.9, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 16 },
        2: { halign: 'center', cellWidth: 20, textColor: textMuted },
        3: { halign: 'right', cellWidth: 32 },
        4: { halign: 'right', cellWidth: 32, textColor: emeraldAccent, fontStyle: 'bold' },
        5: { halign: 'right', cellWidth: 32, textColor: amberDark, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'head') {
          if (data.column.index >= 3) data.cell.styles.halign = 'right';
          if (data.column.index === 1 || data.column.index === 2) data.cell.styles.halign = 'center';
        }
      },
    });

    cursorY = (doc.lastAutoTable?.finalY || cursorY + 20) + 7.5;
  }

  // =========================================================================
  // 5. TABLA 3: ACTIVIDADES PENDIENTES POR COTIZAR (SIN MONTO REGISTRADO)
  // =========================================================================
  if (unquotedPendingItems.length > 0) {
    const estTable3Height = 16 + unquotedPendingItems.length * 8;
    if (cursorY + estTable3Height > pageHeight - 18) {
      doc.addPage();
      cursorY = 18;
    }

    cursorY = drawSectionHeading(
      '3',
      'Actividades Pendientes por Cotizar',
      'Rubros activos con L. 0.00 pendientes de definir monto',
      cursorY
    );

    const unquotedRows = unquotedPendingItems.map((item, idx) => [
      String(idx + 1),
      item.title,
      item.category,
      item.assigned,
      item.dueDateStr,
    ]);

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin, bottom: 18 },
      head: [['#', 'Actividad / Compra Pendiente', 'Categoría', 'Responsable', 'Fecha Meta']],
      body: unquotedRows,
      theme: 'grid',
      headStyles: {
        fillColor: [140, 114, 76],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.4,
        cellPadding: 2.2,
      },
      styles: {
        font: 'helvetica',
        fontSize: 7.4,
        textColor: textDark,
        cellPadding: 2.1,
        lineColor: [232, 226, 214],
        lineWidth: 0.16,
      },
      alternateRowStyles: {
        fillColor: [253, 251, 247],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8, textColor: textMuted },
        1: { halign: 'left', cellWidth: 85.9, fontStyle: 'bold' },
        2: { halign: 'left', cellWidth: 38 },
        3: { halign: 'center', cellWidth: 28 },
        4: { halign: 'center', cellWidth: 28 },
      },
      didParseCell: (data) => {
        if (data.section === 'head') {
          if (data.column.index === 0 || data.column.index >= 3) {
            data.cell.styles.halign = 'center';
          }
        }
      },
    });
  }

  // =========================================================================
  // 6. PIE DE PÁGINA CON NUMERACIÓN EXACTA EN TODAS LAS HOJAS
  // =========================================================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);

    doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 11.5, pageWidth - margin, pageHeight - 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      'Boda Edis & Dania • Informe Formal de Presupuesto y Ejecución de Gastos (Valores en Lempiras HNL)',
      margin,
      pageHeight - 7
    );

    doc.setFont('helvetica', 'bold');
    doc.text(
      `Página ${p} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );
  }

  if (options.returnArrayBuffer) {
    return doc.output('arraybuffer');
  }

  const fechaStr = new Date().toISOString().split('T')[0];
  const filename = options.filename || `Informe_Formal_Gastos_Boda_ED_${fechaStr}.pdf`;
  doc.save(filename);
}
