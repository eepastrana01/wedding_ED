import React, { useState } from 'react';
import Papa from 'papaparse';
import { useWedding } from '../../context/WeddingContext';
import { csvApi } from '../../services/csvApi';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, Table, Sparkles, RefreshCw } from 'lucide-react';

export function CsvUploader() {
  const { showToast, refreshAll, setActiveTab } = useWedding();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoCreateFamilies, setAutoCreateFamilies] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = (fileToParse) => {
    setFile(fileToParse);
    setImportResult(null);

    Papa.parse(fileToParse, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setHeaders(results.meta.fields || []);
          setParsedData(results.data);
          showToast(`Archivo procesado: ${results.data.length} filas detectadas`);
        } else {
          showToast('El archivo no contiene filas legibles', 'error');
        }
      },
      error: (err) => {
        showToast(`Error al leer archivo: ${err.message}`, 'error');
      }
    });
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);

    try {
      const response = await csvApi.importCsv(parsedData, {
        autoCreateFamilies,
      });

      if (response.success) {
        setImportResult(response.data);
        showToast(response.message || 'Importación completada');
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Error al importar datos a la base de datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setImportResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      
      {/* Introduction Card */}
      <div className="bg-white rounded-2xl border border-wedding-border p-5 sm:p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-wedding-accentLight flex items-center justify-center text-wedding-accentDark shrink-0">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 className="font-editorial text-2xl font-semibold text-stone-900">
              Importar Invitados desde CSV
            </h2>
            <p className="text-stone-600 text-sm mt-1 leading-relaxed">
              Carga tu archivo CSV para poblar directamente tu base de datos en Neon. El sistema reconoce automáticamente las columnas de tu lista:
            </p>

            {/* Expected columns badge list */}
            <div className="flex flex-wrap gap-2 mt-3">
              {['Nombre', 'Pareja', 'Type', 'Grupo/Relacion', 'Tipo Invitado', 'Prioridad'].map((col) => (
                <span key={col} className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 text-xs font-mono font-medium border border-stone-200">
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="bg-white border-2 border-dashed border-stone-300 hover:border-wedding-accent rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer shadow-xs group"
        >
          <input
            type="file"
            id="csv-file-input"
            accept=".csv, text/csv, .txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer space-y-4 block">
            <div className="w-16 h-16 rounded-full bg-wedding-sageLight group-hover:bg-wedding-sageLight/80 text-wedding-primary flex items-center justify-center mx-auto transition-transform group-hover:scale-105">
              <UploadCloud size={30} />
            </div>
            <div>
              <p className="text-base font-semibold text-stone-800">
                Arrastra y suelta tu archivo CSV aquí, o <span className="text-wedding-accentDark underline">explora tu equipo</span>
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Archivos .csv delimitados por comas o punto y coma
              </p>
            </div>
          </label>
        </div>
      ) : (
        /* Preview and Configuration section */
        <div className="bg-white rounded-2xl border border-wedding-border p-5 sm:p-6 shadow-card space-y-5">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <p className="font-semibold text-stone-900 text-sm sm:text-base">{file.name}</p>
                <p className="text-xs text-stone-500">{parsedData.length} invitados listos para importar</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-stone-500 hover:text-stone-800 text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <RefreshCw size={14} />
              <span>Cambiar archivo</span>
            </button>
          </div>

          {/* Import Options */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Opciones de Importación
            </h4>
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-stone-700">
              <input
                type="checkbox"
                checked={autoCreateFamilies}
                onChange={(e) => setAutoCreateFamilies(e.target.checked)}
                className="mt-0.5 rounded-sm text-wedding-primary focus:ring-wedding-accent"
              />
              <div>
                <span className="font-semibold text-stone-900">Crear familias automáticamente para parejas</span>
                <p className="text-stone-500 mt-0.5">
                  Si un registro incluye una columna "Pareja", se creará automáticamente una familia para ellos y se vincularán.
                </p>
              </div>
            </label>
          </div>

          {/* Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Table size={14} />
                <span>Vista Previa (Primeras {Math.min(5, parsedData.length)} filas)</span>
              </h4>
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone-200 max-h-64">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/90 text-stone-600 font-semibold sticky top-0">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="py-2.5 px-3 border-b border-stone-200 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {parsedData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      {headers.map((h) => (
                        <td key={h} className="py-2 px-3 text-stone-700 whitespace-nowrap">
                          {row[h] || <span className="text-stone-300 italic">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Result Notification */}
          {importResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 flex-1">
                <p className="font-bold text-sm">¡Importación Exitosa!</p>
                <p className="mt-0.5">
                  Se guardaron <strong>{importResult.count}</strong> invitados en Neon PostgreSQL
                  {importResult.familiesCreated > 0 && ` y se crearon ${importResult.familiesCreated} familias`}.
                </p>
                <button
                  onClick={() => setActiveTab('guests')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold transition-colors shadow-xs"
                >
                  <span>Ver lista de invitados</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Import Action Button */}
          {!importResult && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={handleImport}
                className="flex items-center gap-2 px-6 py-3 bg-wedding-primary hover:bg-wedding-primaryLight text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando en Neon DB...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Cargar {parsedData.length} Invitados a la BD</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
