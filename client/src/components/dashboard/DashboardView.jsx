import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import { CheckCircle2, Clock, XCircle, Users, Home, TrendingUp, Sparkles, Download, Heart } from 'lucide-react';
import Papa from 'papaparse';

export function DashboardView() {
  const { stats, guests, loading } = useWedding();

  const overview = stats?.overview || {};
  const totalGuests = overview.total_guests || 0;
  const confirmedGuests = overview.confirmed_guests || 0;
  const pendingGuests = overview.pending_guests || 0;
  const declinedGuests = overview.declined_guests || 0;
  const totalFamilies = overview.total_families || 0;

  const confirmationRate = totalGuests > 0 ? Math.round((confirmedGuests / totalGuests) * 100) : 0;

  const handleExportCsv = () => {
    if (guests.length === 0) {
      alert('No hay invitados para exportar.');
      return;
    }

    const exportRows = guests.map((g) => ({
      Nombre: g.name,
      Pareja: g.partner_name || '',
      Type: g.type || 'Adulto',
      'Grupo/Relacion': g.group_relation || '',
      'Tipo Invitado': g.guest_type || 'Titular',
      Prioridad: g.priority || 'A',
      Estado: g.status === 'confirmed' ? 'Confirmado' : g.status === 'declined' ? 'No Asiste' : 'Pendiente',
      Familia: g.family_name || '',
      Telefono: g.phone || '',
      Alergias: g.dietary_notes || '',
      Notas: g.notes || '',
    }));

    const csv = Papa.unparse(exportRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Lista_Invitados_Boda_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      
      {/* Header banner with Export button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-wedding-border p-5 sm:p-6 shadow-card">
        <div>
          <h2 className="font-editorial text-2xl font-bold text-stone-900">
            Panel de Métricas & Aforo
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Resumen en tiempo real del estado de confirmación de tu boda
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-stone-200"
        >
          <Download size={16} />
          <span>Exportar Lista a CSV</span>
        </button>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Invitados */}
        <div className="bg-white rounded-2xl border border-wedding-border p-4 sm:p-5 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Invitados</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
              <Users size={16} />
            </div>
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
            {totalGuests}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            En {totalFamilies} familias y grupos
          </p>
        </div>

        {/* Confirmados */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-card relative overflow-hidden bg-linear-to-b from-emerald-50/40 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Confirmados</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-emerald-900 mt-2">
            {confirmedGuests}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            {confirmationRate}% del aforo total
          </p>
        </div>

        {/* Pendientes */}
        <div className="bg-white rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-card relative overflow-hidden bg-linear-to-b from-amber-50/40 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Por Confirmar</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock size={16} />
            </div>
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-amber-900 mt-2">
            {pendingGuests}
          </p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            {totalGuests > 0 ? Math.round((pendingGuests / totalGuests) * 100) : 0}% pendientes
          </p>
        </div>

        {/* No Asisten */}
        <div className="bg-white rounded-2xl border border-rose-200 p-4 sm:p-5 shadow-card relative overflow-hidden bg-linear-to-b from-rose-50/40 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">No Asisten</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
              <XCircle size={16} />
            </div>
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-rose-900 mt-2">
            {declinedGuests}
          </p>
          <p className="text-[11px] text-rose-700 font-medium mt-1">
            Cupos liberados
          </p>
        </div>
      </div>

      {/* Progress Bar of RSVP */}
      <div className="bg-white rounded-2xl border border-wedding-border p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
          <span className="text-stone-700">Progreso de Confirmación Global</span>
          <span className="text-stone-900 font-bold">{confirmedGuests} de {totalGuests} ({confirmationRate}%)</span>
        </div>

        <div className="w-full h-3.5 bg-stone-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${totalGuests > 0 ? (confirmedGuests / totalGuests) * 100 : 0}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title="Confirmados"
          />
          <div
            style={{ width: `${totalGuests > 0 ? (pendingGuests / totalGuests) * 100 : 0}%` }}
            className="bg-amber-400 transition-all duration-500"
            title="Pendientes"
          />
          <div
            style={{ width: `${totalGuests > 0 ? (declinedGuests / totalGuests) * 100 : 0}%` }}
            className="bg-rose-400 transition-all duration-500"
            title="No Asisten"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Confirmados</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Pendientes</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Declinados</span>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Breakdown by Group / Relation */}
        <div className="bg-white rounded-2xl border border-wedding-border p-5 shadow-card space-y-4">
          <h3 className="font-editorial text-lg font-bold text-stone-900 flex items-center gap-2">
            <Heart size={16} className="text-wedding-rose" />
            <span>Distribución por Grupo / Relación</span>
          </h3>

          <div className="space-y-3">
            {stats?.byGroupRelation && stats.byGroupRelation.length > 0 ? (
              stats.byGroupRelation.map((group) => {
                const groupTotal = parseInt(group.total, 10) || 0;
                const groupConfirmed = parseInt(group.confirmed, 10) || 0;
                const percentage = groupTotal > 0 ? Math.round((groupConfirmed / groupTotal) * 100) : 0;

                return (
                  <div key={group.group_relation} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-800">{group.group_relation}</span>
                      <span className="text-stone-500">
                        <strong className="text-emerald-700">{groupConfirmed}</strong> / {groupTotal} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-wedding-primary rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-stone-400 italic">No hay datos suficientes aún.</p>
            )}
          </div>
        </div>

        {/* Breakdown by Priority */}
        <div className="bg-white rounded-2xl border border-wedding-border p-5 shadow-card space-y-4">
          <h3 className="font-editorial text-lg font-bold text-stone-900 flex items-center gap-2">
            <Sparkles size={16} className="text-wedding-accentDark" />
            <span>Distribución por Prioridad</span>
          </h3>

          <div className="space-y-3">
            {stats?.byPriority && stats.byPriority.length > 0 ? (
              stats.byPriority.map((p) => {
                const pTotal = parseInt(p.total, 10) || 0;
                const pConfirmed = parseInt(p.confirmed, 10) || 0;
                const percentage = pTotal > 0 ? Math.round((pConfirmed / pTotal) * 100) : 0;

                return (
                  <div key={p.priority} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-800">Prioridad {p.priority}</span>
                      <span className="text-stone-500">
                        <strong className="text-emerald-700">{pConfirmed}</strong> / {pTotal} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-wedding-accentDark rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-stone-400 italic">No hay datos suficientes aún.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
