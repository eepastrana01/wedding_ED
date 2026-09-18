import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
