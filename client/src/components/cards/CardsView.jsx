import React, { useState, useMemo } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Mail, Users, User, Heart, CheckCircle2, Clock, Printer, Search, X, MessageCircle, Phone, Sparkles, Filter, FileDown, Ticket, FileText } from 'lucide-react';
import { openWhatsApp } from '../../utils/whatsapp';
import { generateInvitationCardsPDF } from '../../utils/pdfGenerator';

export function CardsView() {
  const { invitationCards, toggleDeliveryStatus, showToast } = useWedding();
  const [filterType, setFilterType] = useState('all'); // 'all', 'family', 'individual', 'pending', 'delivered'
  const [search, setSearch] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { all = [], summary = {} } = invitationCards || {};

  // Filter cards based on type and search query
  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();

    return all.filter((card) => {
      // Search filter
      if (q) {
        const matchTitle = card.title && card.title.toLowerCase().includes(q);
        const matchSalutation = card.salutation && card.salutation.toLowerCase().includes(q);
        const matchMembers = card.members && card.members.some((m) => m.name && m.name.toLowerCase().includes(q));
        const matchPhone = card.phone && card.phone.toLowerCase().includes(q);
        if (!matchTitle && !matchSalutation && !matchMembers && !matchPhone) {
          return false;
        }
      }

      // Tab filter
      if (filterType === 'family') return card.type === 'family';
      if (filterType === 'individual') return card.type === 'individual' || card.type === 'couple';
      if (filterType === 'pending') return !card.delivered;
      if (filterType === 'delivered') return card.delivered;

      return true;
    });
  }, [all, search, filterType]);

  const handleDownloadPdf = () => {
    try {
      setIsGeneratingPdf(true);
      generateInvitationCardsPDF(all, summary);
      showToast('PDF tamaño Carta generado y descargado correctamente');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast('Error al generar PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppDelivery = (card) => {
    if (!card.phone) {
      alert('Esta tarjeta no tiene un número telefónico asignado.');
      return;
    }

    const message = `¡Hola ${card.title}! Con mucha alegría les compartimos que ya tenemos lista su tarjeta de invitación para nuestra boda. Tienen asignados ${card.seats} ${card.seats === 1 ? 'pase' : 'pases'}. ¡Nos encantará contar con su presencia!`;
    openWhatsApp(card.phone, message);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 md:pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-wedding-border p-4 sm:p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-wedding-accentLight text-wedding-primaryDark">
              <Mail size={20} />
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
              Control de Tarjetas de Invitación
            </h2>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-2xl">
            Cálculo exacto de tarjetas físicas o sobres a imprimir: <strong>1 tarjeta por familia</strong> o <strong>1 por invitado/pareja</strong>, con el total de pases asignados.
          </p>
        </div>

        {/* Action Buttons: PDF Download (Carta) + Print */}
        <div className="flex items-center gap-2 no-print shrink-0">
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || all.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-wedding-primary hover:bg-wedding-primaryLight text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all duration-150 active:scale-95 disabled:opacity-50"
            title="Descargar documento PDF oficial tamaño Carta para calígrafo o imprenta"
          >
            <FileDown size={17} />
            <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF (Carta)'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors border border-stone-200 active:scale-95"
            title="Imprimir directamente desde el navegador"
          >
            <Printer size={17} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        
        {/* Total Tarjetas */}
        <div className="bg-white rounded-2xl border border-wedding-border p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs">Total Tarjetas</span>
            <Mail size={16} className="text-wedding-accentDark" />
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900 mt-1.5">
            {summary.totalCards || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5">Sobres a imprimir</p>
        </div>

        {/* Tarjetas Familiares */}
        <div className="bg-white rounded-2xl border border-wedding-border p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs">Familias</span>
            <Users size={16} className="text-blue-600" />
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-blue-950 mt-1.5">
            {summary.totalFamilyCards || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5">Grupos familiares</p>
        </div>

        {/* Tarjetas Individuales / Parejas */}
        <div className="bg-white rounded-2xl border border-wedding-border p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs">Individual / Pareja</span>
            <User size={16} className="text-purple-600" />
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-purple-950 mt-1.5">
            {summary.totalIndividualCards || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5">Sin familia asignada</p>
        </div>

        {/* Total de Pases Requeridos */}
        <div className="bg-white rounded-2xl border border-wedding-accent/30 p-3.5 sm:p-4 shadow-card bg-linear-to-b from-wedding-accentLight/30 to-white">
          <div className="flex items-center justify-between text-wedding-primary text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs">Pases Totales</span>
            <Sparkles size={16} className="text-wedding-accentDark" />
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-wedding-primaryDark mt-1.5">
            {summary.totalSeatsRequired || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5">Boletos a adjuntar</p>
        </div>

        {/* Progreso de Entrega */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-white rounded-2xl border border-emerald-200 p-3.5 sm:p-4 shadow-card bg-linear-to-b from-emerald-50/40 to-white">
          <div className="flex items-center justify-between text-emerald-800 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs">Entregadas</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-emerald-950 mt-1.5">
            {summary.deliveredCount || 0} <span className="text-xs text-stone-400 font-sans font-normal">/ {summary.totalCards || 0}</span>
          </p>
          <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${summary.deliveryRate || 0}%` }}
            />
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-wedding-border p-3 sm:p-4 shadow-sm space-y-3 no-print">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
          <input
            type="text"
            placeholder="Buscar tarjeta por rotulación, nombre o integrante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-wedding-accent focus:bg-white transition-all placeholder:text-stone-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium select-none">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-150 ${
              filterType === 'all'
                ? 'bg-wedding-primary text-white font-semibold shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Todas ({summary.totalCards || 0})
          </button>

          <button
            onClick={() => setFilterType('family')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
              filterType === 'family'
                ? 'bg-blue-700 text-white font-semibold shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/50'
            }`}
          >
            <Users size={13} />
            Familias ({summary.totalFamilyCards || 0})
          </button>

          <button
            onClick={() => setFilterType('individual')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
              filterType === 'individual'
                ? 'bg-purple-700 text-white font-semibold shadow-xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/50'
            }`}
          >
            <User size={13} />
            Individuales / Parejas ({summary.totalIndividualCards || 0})
          </button>

          <button
            onClick={() => setFilterType('pending')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
              filterType === 'pending'
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/50'
            }`}
          >
            <Clock size={13} />
            Por Entregar ({summary.pendingDeliveryCount || 0})
          </button>

          <button
            onClick={() => setFilterType('delivered')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
              filterType === 'delivered'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
            }`}
          >
            <CheckCircle2 size={13} />
            Entregadas ({summary.deliveredCount || 0})
          </button>
        </div>

      </div>

      {/* Cards Display Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-14 px-4 bg-white rounded-2xl border border-wedding-border shadow-xs space-y-3">
          <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-wedding-accentDark">
            <Mail size={24} />
          </div>
          <h3 className="font-editorial text-lg font-medium text-stone-800">
            No se encontraron tarjetas de invitación
          </h3>
          <p className="text-stone-500 text-xs max-w-sm mx-auto">
            {search
              ? 'Intenta con otro término de búsqueda o limpia los filtros.'
              : 'Registra o importa invitados para generar automáticamente sus tarjetas de invitación.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredCards.map((card, idx) => (
            <div
              key={card.id}
              className={`bg-white rounded-2xl border transition-all duration-200 shadow-card flex flex-col justify-between overflow-hidden ${
                card.delivered
                  ? 'border-emerald-200/90 bg-linear-to-b from-emerald-50/20 to-white'
                  : 'border-wedding-border hover:border-wedding-accent/60'
              }`}
            >
              {/* Card Header & Content */}
              <div className="p-4 sm:p-5 space-y-3">
                
                {/* Type Badge + Pass Count Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      card.type === 'family'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : card.type === 'couple'
                        ? 'bg-pink-50 text-pink-800 border-pink-200'
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}
                  >
                    {card.type === 'family' ? (
                      <Users size={12} />
                    ) : card.type === 'couple' ? (
                      <Heart size={12} className="text-pink-600 fill-pink-600" />
                    ) : (
                      <User size={12} />
                    )}
                    <span>
                      {card.type === 'family' ? 'Tarjeta Familiar' : card.type === 'couple' ? 'Tarjeta Pareja' : 'Tarjeta Individual'}
                    </span>
                  </span>

                  {/* Badges de Pases Requeridos */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-wedding-accentLight text-wedding-primaryDark border border-wedding-accent/40 shadow-2xs">
                    <Ticket size={13} className="text-wedding-primary shrink-0" />
                    <span>{card.seats} {card.seats === 1 ? 'Pase' : 'Pases'}</span>
                  </span>
                </div>

                {/* Rotulación / Título del Sobre */}
                <div>
                  <h3 className="font-editorial text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                    {card.salutation}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Grupo: <span className="font-medium text-stone-700">{card.group}</span> • Prioridad {card.priority}
                  </p>
                </div>

                {/* Lista de Integrantes Cubiertos */}
                <div className="bg-stone-50/90 rounded-xl p-2.5 border border-stone-200/70 space-y-1 text-xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block">
                    Personas contempladas ({card.membersCount}):
                  </span>
                  <div className="space-y-1">
                    {card.members.map((m, i) => (
                      <div key={m.id || i} className="flex items-center justify-between text-stone-700 text-[11px]">
                        <span className="truncate pr-2 font-medium">• {m.name}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-sm shrink-0 ${
                          m.status === 'confirmed'
                            ? 'text-emerald-700 bg-emerald-50'
                            : m.status === 'declined'
                            ? 'text-rose-700 bg-rose-50'
                            : 'text-amber-700 bg-amber-50'
                        }`}>
                          {m.status === 'confirmed' ? 'Confirmado' : m.status === 'declined' ? 'No Asiste' : 'Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {card.notes && (
                  <div className="flex items-start gap-1 text-[11px] text-stone-600 italic bg-amber-50/60 p-2 rounded-lg border border-amber-200/50">
                    <FileText size={12} className="text-amber-700/80 shrink-0 mt-0.5" />
                    <span>{card.notes}</span>
                  </div>
                )}

              </div>

              {/* Bottom Actions Bar */}
              <div className="px-4 py-3 bg-stone-50/80 border-t border-stone-200/80 flex items-center justify-between gap-2">
                
                {/* Delivery Checklist Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleDeliveryStatus(card)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-150 active:scale-95 ${
                    card.delivered
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400 hover:bg-stone-50'
                  }`}
                >
                  <CheckCircle2 size={15} className={card.delivered ? 'text-white' : 'text-stone-400'} />
                  <span>{card.delivered ? 'Entregada' : 'Por Entregar'}</span>
                </button>

                {/* WhatsApp button */}
                {card.phone && (
                  <button
                    type="button"
                    onClick={() => handleWhatsAppDelivery(card)}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors shrink-0"
                    title="Enviar recordatorio de invitación por WhatsApp"
                  >
                    <MessageCircle size={16} />
                  </button>
                )}

                {/* Direct Call button */}
                {card.phone && (
                  <a
                    href={`tel:${card.phone}`}
                    className="p-2 bg-stone-200/70 hover:bg-stone-300/70 text-stone-700 rounded-xl transition-colors shrink-0"
                    title="Llamar"
                  >
                    <Phone size={15} />
                  </a>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Printable View (Visible only when printing Ctrl+P / Cmd+P) */}
      <div className="hidden print:block print-area space-y-4">
        <div className="border-b pb-3 mb-4 text-center">
          <h1 className="text-2xl font-serif font-bold">Nuestra Boda - Lista de Rotulación de Sobres & Tarjetas</h1>
          <p className="text-xs text-gray-600 mt-1">
            Total de Tarjetas: {summary.totalCards} | Total de Pases: {summary.totalSeatsRequired} | Familias: {summary.totalFamilyCards} | Individuales: {summary.totalIndividualCards}
          </p>
        </div>

        <table className="w-full text-left text-xs border border-collapse border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">#</th>
              <th className="border p-2">Rotulación en Sobre</th>
              <th className="border p-2">Tipo</th>
              <th className="border p-2 text-center">Pases</th>
              <th className="border p-2">Integrantes Asignados</th>
              <th className="border p-2">Teléfono</th>
              <th className="border p-2 text-center">Entregada</th>
            </tr>
          </thead>
          <tbody>
            {all.map((c, i) => (
              <tr key={c.id}>
                <td className="border p-2 text-center">{i + 1}</td>
                <td className="border p-2 font-bold">{c.salutation}</td>
                <td className="border p-2">{c.type === 'family' ? 'Familiar' : c.type === 'couple' ? 'Pareja' : 'Individual'}</td>
                <td className="border p-2 text-center font-bold">{c.seats}</td>
                <td className="border p-2">{c.members.map((m) => m.name).join(', ')}</td>
                <td className="border p-2">{c.phone || '-'}</td>
                <td className="border p-2 text-center">{c.delivered ? 'Entregada' : 'Pendiente'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
