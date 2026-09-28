import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MONOTYPE_CORSIVA_BASE64 } from './monotypeCorsivaBase64';

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
