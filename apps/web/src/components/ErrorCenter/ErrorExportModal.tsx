import React from 'react';
import { 
  X, 
  Download, 
  Sparkles, 
  Settings2, 
  Clock, 
  Filter, 
  FileJson, 
  FileType 
} from 'lucide-react';
import { ErrorLog, ErrorCategory } from '../../types';

interface ErrorExportModalProps {
  onClose: () => void;
  errors: ErrorLog[];
  exportFilteredErrors: ErrorLog[];
  exportFormat: 'csv' | 'json';
  setExportFormat: (format: 'csv' | 'json') => void;
  exportPreset: 'all' | '15m' | '1h' | '24h' | '7d' | 'custom';
  handleSelectExportPreset: (preset: 'all' | '15m' | '1h' | '24h' | '7d' | 'custom') => void;
  exportStartDate: string;
  setExportStartDate: (date: string) => void;
  exportEndDate: string;
  setExportEndDate: (date: string) => void;
  exportSeverity: string;
  setExportSeverity: (sev: string) => void;
  exportStatus: string;
  setExportStatus: (status: string) => void;
  exportCategory: string;
  setExportCategory: (cat: string) => void;
  onExecuteExport: () => void;
}

export const ErrorExportModal: React.FC<ErrorExportModalProps> = ({
  onClose,
  errors,
  exportFilteredErrors,
  exportFormat,
  setExportFormat,
  exportPreset,
  handleSelectExportPreset,
  exportStartDate,
  setExportStartDate,
  exportEndDate,
  setExportEndDate,
  exportSeverity,
  setExportSeverity,
  exportStatus,
  setExportStatus,
  exportCategory,
  setExportCategory,
  onExecuteExport
}) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-100/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-2xl border border-indigo-100">
              <Download className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Export Temporal Logs</h2>
              <p className="text-xs text-slate-600 font-bold tracking-widest uppercase mt-0.5">Audit compliance reporting</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-modal-scrollbar bg-white">
          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Settings2 className="w-3 h-3 text-slate-500" />
              1. Output Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('csv')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  exportFormat === 'csv' 
                    ? 'bg-indigo-50/50 border-indigo-500 shadow-xs shadow-indigo-500/10' 
                    : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <FileType className={`w-6 h-6 ${exportFormat === 'csv' ? 'text-indigo-600' : 'text-slate-600'}`} />
                <span className={`text-xs font-black uppercase tracking-widest ${exportFormat === 'csv' ? 'text-slate-800' : 'text-slate-500'}`}>Standard CSV</span>
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  exportFormat === 'json' 
                    ? 'bg-indigo-50/50 border-indigo-500 shadow-xs shadow-indigo-500/10' 
                    : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <FileJson className={`w-6 h-6 ${exportFormat === 'json' ? 'text-indigo-600' : 'text-slate-600'}`} />
                <span className={`text-xs font-black uppercase tracking-widest ${exportFormat === 'json' ? 'text-slate-800' : 'text-slate-500'}`}>Structural JSON</span>
              </button>
            </div>
          </div>

          {/* Temporal Boundaries */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3 text-slate-500" />
              2. Temporal Boundaries
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'all', label: 'All History' },
                { id: '15m', label: 'Last 15m' },
                { id: '1h', label: 'Last 1h' },
                { id: '24h', label: 'Last 24h' },
                { id: '7d', label: 'Last 7 Days' },
                { id: 'custom', label: 'Custom Range' },
              ] as const).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectExportPreset(preset.id)}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all cursor-pointer border ${
                    exportPreset === preset.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {exportPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-2 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase ml-1">Start Point</span>
                  <input
                    type="datetime-local"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition-colors font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase ml-1">End Point</span>
                  <input
                    type="datetime-local"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition-colors font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Refined Metadata Filtering */}
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-3 h-3 text-slate-500" />
              3. Contextual Filters
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-600 font-black uppercase ml-1 tracking-widest">Severity</span>
                <select 
                  value={exportSeverity} 
                  onChange={(e) => setExportSeverity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 transition-colors cursor-pointer font-bold appearance-none"
                >
                  <option value="All">All Severities</option>
                  <option value="Critical">Critical Only</option>
                  <option value="Error">Errors & Above</option>
                  <option value="Warning">Include Warnings</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-600 font-black uppercase ml-1 tracking-widest">Category</span>
                <select 
                  value={exportCategory} 
                  onChange={(e) => setExportCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 transition-colors cursor-pointer font-bold appearance-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Network">Infrastructure/Net</option>
                  <option value="Auth">Security/Auth</option>
                  <option value="Schema">Type Schema</option>
                  <option value="Data Mapping">MappingStudio</option>
                  <option value="Database">DB Level</option>
                  <option value="Validation">Logical Check</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-600 font-black uppercase ml-1 tracking-widest">State</span>
                <select 
                  value={exportStatus} 
                  onChange={(e) => setExportStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 transition-colors cursor-pointer font-bold appearance-none"
                >
                  <option value="All">All States</option>
                  <option value="Unresolved">Unresolved Active</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Ignored">Ignored Noise</option>
                  <option value="Flagged">Flagged Items</option>
                </select>
              </div>
            </div>
          </div>

          {/* Report Preview Summary Card */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between text-indigo-900 font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                Report Output Preview Summary
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-black uppercase">
                {exportFilteredErrors.length} Records Matched
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1 text-slate-700">
              <div>
                <span className="text-slate-600 block text-[10px] font-bold">TOTAL IN FILE:</span>
                <strong className="text-slate-900 font-mono text-sm">{exportFilteredErrors.length} / {errors.length}</strong>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] font-bold">ESTIMATED SIZE:</span>
                <strong className="text-slate-900 font-mono text-sm">
                  ~{((JSON.stringify(exportFilteredErrors).length) / 1024).toFixed(1)} KB
                </strong>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] font-bold">FORMAT:</span>
                <strong className="text-indigo-600 font-mono text-sm uppercase font-black">{exportFormat}</strong>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-indigo-100 pt-2 flex items-center justify-between font-bold">
              <span>
                Range Boundary: {exportStartDate ? exportStartDate.replace('T', ' ') : 'Earliest Log'} → {exportEndDate ? exportEndDate.replace('T', ' ') : 'Latest Log'}
              </span>
              {(exportStartDate || exportEndDate || exportCategory !== 'All' || exportSeverity !== 'All' || exportStatus !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectExportPreset('all');
                    setExportCategory('All');
                    setExportSeverity('All');
                    setExportStatus('All');
                  }}
                  className="text-amber-600 hover:underline cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-black text-xs rounded-xl cursor-pointer transition-all uppercase tracking-widest border border-slate-200 shadow-3xs"
          >
            Cancel
          </button>

          <button
            onClick={onExecuteExport}
            disabled={exportFilteredErrors.length === 0}
            className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer uppercase tracking-widest border border-indigo-500/30 ${
              exportFilteredErrors.length > 0
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-500/10'
                : 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed shadow-none'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>
              Generate {exportFormat.toUpperCase()} Bundle
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
