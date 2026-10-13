import React from 'react';
import { X, Printer, Utensils, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export function TablePrintModal({ isOpen, onClose, tables, guests }) {
  if (!isOpen) return null;

  const totalSeats = tables.reduce((acc, t) => acc + (t.capacity || 10), 0);
  const totalSeated = tables.reduce((acc, t) => acc + (t.guests?.length || 0), 0);
  const totalGuests = guests.length;
  const unassignedCount = guests.filter(g => !g.table_id).length;

  // Collect all dietary notes
  const dietaryList = tables.flatMap(t => 
    (t.guests || [])
      .filter(g => g.dietary_notes && g.dietary_notes.trim().length > 0)
      .map(g => ({
        table_number: t.table_number,
        table_name: t.name,
        guest_name: g.name,
        notes: g.dietary_notes,
      }))
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Screen only */}
        <div className="bg-gradient-to-r from-wedding-primary to-wedding-primaryDark px-6 py-4 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-wedding-accent">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">
                Plano de Mesas & Reporte de Banquete
              </h3>
              <p className="text-xs text-white/75 font-sans">
                Formato optimizado para impresión y coordinación de banquete
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-wedding-accent text-wedding-primaryDark font-bold text-xs rounded-xl hover:bg-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer size={15} />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 font-sans text-stone-800 print:p-0 print:overflow-visible">
          
          {/* Header Title for Print */}
          <div className="text-center pb-6 mb-6 border-b border-stone-200">
            <div className="inline-block px-3 py-1 rounded-full bg-stone-100 text-[11px] font-bold tracking-widest uppercase text-stone-600 mb-2">
              Recepción de Boda • Edis & Dania
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-wedding-primaryDark">
              Distribución Oficial de Mesas & Banquete
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Documento de Control para Coordinación de Salón y Catering
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-3 mb-6 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center">
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold">Mesas</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-wedding-primaryDark">{tables.length}</span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold">Sentados</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-emerald-700">{totalSeated} / {totalSeats}</span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold">Sin Mesa</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-amber-700">{unassignedCount}</span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold">Menús Especiales</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-stone-800">{dietaryList.length}</span>
            </div>
          </div>

          {/* Dietary Summary Section (Crucial for Catering) */}
          {dietaryList.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 break-inside-avoid">
              <h3 className="font-serif font-bold text-amber-950 text-sm flex items-center gap-1.5 mb-2">
                <Utensils size={15} className="text-amber-700" />
                Resumen de Alergias & Requerimientos Dietarios del Banquete ({dietaryList.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {dietaryList.map((item, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-amber-200/80 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-stone-800">{item.guest_name}</span>
                      <span className="text-[11px] text-stone-500 block">
                        Mesa {item.table_number} {item.table_name ? `(${item.table_name})` : ''}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold text-[11px]">
                      {item.notes}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid of Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => {
              const tableGuests = table.guests || [];
              return (
                <div 
                  key={table.id}
                  className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs break-inside-avoid flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-wedding-primary text-white font-serif font-bold text-xs flex items-center justify-center">
                          {table.table_number}
                        </span>
                        <div>
                          <h4 className="font-serif font-bold text-sm text-wedding-primaryDark">
                            Mesa {table.table_number}
                          </h4>
                          {table.name && (
                            <p className="text-[10px] font-semibold text-wedding-accentDark truncate max-w-[140px]">
                              {table.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                        {tableGuests.length} / {table.capacity} sillas
                      </span>
                    </div>

                    {/* Guests List */}
                    {tableGuests.length === 0 ? (
                      <p className="text-xs text-stone-400 italic py-2 text-center">
                        Mesa sin comensales asignados
                      </p>
                    ) : (
                      <ol className="divide-y divide-stone-100 text-xs">
                        {tableGuests.map((g, idx) => (
                          <li key={g.id} className="py-1.5 flex items-start justify-between gap-1.5">
                            <span className="text-stone-700">
                              <span className="text-stone-400 font-mono text-[10px] mr-1.5">{idx + 1}.</span>
                              <strong>{g.name}</strong>
                              {g.family_name && (
                                <span className="text-stone-400 text-[10px] block ml-4">
                                  {g.family_name}
                                </span>
                              )}
                            </span>
                            {g.dietary_notes && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md font-bold shrink-0">
                                {g.dietary_notes}
                              </span>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {table.notes && (
                    <div className="mt-3 pt-2 border-t border-stone-100 text-[10px] text-stone-500">
                      📍 {table.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-stone-200 text-center text-xs text-stone-400 flex items-center justify-between">
            <span>Boda Edis & Dania • 21 de Noviembre de 2026</span>
            <span>Generado con amor desde la App Oficial</span>
          </div>
        </div>
      </div>
    </div>
  );
}
