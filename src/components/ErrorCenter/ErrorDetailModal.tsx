import React from 'react';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  BrainCircuit, 
  AlertTriangle, 
  Lightbulb, 
  Zap,
  Info,
  Code,
  AlertCircle
} from 'lucide-react';
import { ErrorLog } from '../../types';
import { StatusBadge, CategoryBadge } from './ErrorBadges';

interface ErrorDetailModalProps {
  error: ErrorLog;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
  aiExplanation: string | null;
  suggestedFix: any | null;
  isExplaining: boolean;
  onExplain: (error: ErrorLog) => void;
  onApplyFix: (id: string) => void;
  activeDetailTab: 'stackTrace' | 'rawMetadata';
  setActiveDetailTab: (tab: 'stackTrace' | 'rawMetadata') => void;
  copiedField: string | null;
  setCopiedField: (field: string | null) => void;
}

export const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({
  error,
  onClose,
  onToggleStatus,
  aiExplanation,
  suggestedFix,
  isExplaining,
  onExplain,
  onApplyFix,
  activeDetailTab,
  setActiveDetailTab,
  copiedField,
  setCopiedField
}) => {
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-100/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div id="error-detail-modal-header" className="p-6 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span id="detail-error-id-badge" className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] font-black rounded border border-slate-200 uppercase tracking-wider">
                ID: {error.id}
              </span>
              <StatusBadge status={error.status} onClick={() => onToggleStatus(error.id)} size="md" />
              <CategoryBadge category={error.category || 'Validation'} size="md" />
            </div>
            <h2 id="detail-error-title" className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tight">
              {error.errorMessage}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-bold">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-600" />
                Job: <span id="detail-job-id" className="text-slate-700 font-black">{error.jobId}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-slate-600" />
                Entity: <span id="detail-entity-name" className="text-slate-700 font-black">{error.entityName}</span>
              </span>
            </div>
          </div>
          <button 
            id="error-detail-modal-close-btn"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-modal-scrollbar grid grid-cols-1 lg:grid-cols-5 gap-6 bg-white">
          {/* Left Column: AI RCA & Suggested Fixes */}
          <div className="lg:col-span-3 space-y-6">
            <section className="bg-indigo-50/40 rounded-2xl border border-indigo-100/60 overflow-hidden">
              <div className="px-4 py-3 bg-indigo-50/80 border-b border-indigo-100/60 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-black text-indigo-700 flex items-center gap-2 uppercase tracking-widest">
                  <BrainCircuit className="w-4 h-4" />
                  AI Multi-Model Root Cause Analysis
                </h3>
                <div className="flex items-center gap-2">
                  {!aiExplanation && !isExplaining && (
                    <button
                      onClick={() => onExplain(error)}
                      className="text-[10px] font-black text-indigo-700 hover:bg-white bg-indigo-100/80 px-2.5 py-1 rounded-md border border-indigo-200 shadow-3xs transition-all active:scale-95 cursor-pointer uppercase tracking-tighter"
                    >
                      Generate Analysis
                    </button>
                  )}
                </div>
              </div>
              <div className="p-5">
                {isExplaining ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-3">
                    <div className="relative">
                      <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                      <BrainCircuit className="w-5 h-5 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <p className="text-xs font-black text-indigo-600/70 animate-pulse uppercase tracking-widest">Consulting Neural RCA Engine...</p>
                  </div>
                ) : aiExplanation ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-xs border border-indigo-500/30">
                        <SparklesIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-2xl rounded-tl-none shadow-xs border border-slate-100 text-sm text-slate-700 leading-relaxed italic font-bold">
                        {aiExplanation}
                      </div>
                    </div>

                    {suggestedFix && (
                      <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                        <h4 className="text-xs font-black text-emerald-700 flex items-center gap-2 mb-3 uppercase tracking-widest">
                          <Zap className="w-3.5 h-3.5 fill-emerald-200" />
                          Recommended Intelligent Fix
                        </h4>
                        <div className="space-y-3">
                          <p className="text-sm text-emerald-950 font-black leading-snug">
                            {typeof suggestedFix === 'string' ? suggestedFix : 'Apply standard formatting rule to target field.'}
                          </p>
                          <button
                            onClick={() => onApplyFix(error.id)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 uppercase tracking-widest"
                          >
                            <Check className="w-4 h-4" />
                            Apply Fix Automatically
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-sm text-slate-600 font-bold italic">Click "Generate Analysis" to run AI diagnostics on this specific error event.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-4 h-4 animate-pulse" />
                  System Diagnostics
                </h3>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setActiveDetailTab('stackTrace')}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                      activeDetailTab === 'stackTrace' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Stack Trace
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('rawMetadata')}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                      activeDetailTab === 'rawMetadata' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Raw Context
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xs">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    {activeDetailTab === 'stackTrace' ? 'vm-worker-logs.log' : 'source-payload.json'}
                  </span>
                  <button
                    onClick={() => handleCopy(activeDetailTab === 'stackTrace' ? (error.stackTrace || '') : JSON.stringify(error, null, 2), 'log')}
                    className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedField === 'log' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto max-h-[300px] custom-modal-scrollbar">
                  <pre className="text-xs font-mono text-emerald-400/90 leading-relaxed">
                    {activeDetailTab === 'stackTrace' ? (
                      error.stackTrace || 'No stack trace available for this record type.'
                    ) : (
                      JSON.stringify(error, null, 2)
                    )}
                  </pre>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Error Attributes & Telemetry */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Info className="w-4 h-4" />
                Error Context
              </h3>

              <div className="space-y-4">
                {[
                  { label: 'Field Name', value: error.fieldName, color: 'text-indigo-600 bg-indigo-50/50 border-indigo-100' },
                  { label: 'Raw Value', value: error.rawValue, color: 'text-slate-700 bg-white font-mono border-slate-200' },
                  { label: 'Error Code', value: error.errorCode, color: 'text-rose-600 bg-rose-50/50 font-black border-rose-100' },
                  { label: 'Severity', value: error.severity, color: error.severity === 'Critical' ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-amber-600 bg-amber-50 border-amber-100' },
                  { label: 'Row Number', value: error.rowNumber?.toString() || error.recordRowNumber?.toString(), color: 'text-slate-600 bg-white border-slate-200' },
                  { label: 'Time Logged', value: error.timestamp, color: 'text-slate-600 bg-white border-slate-200' },
                ].map((attr) => (
                  <div key={attr.label} className="group relative">
                    <span className="text-[10px] font-black text-slate-600 uppercase block mb-1 tracking-widest">
                      {attr.label}
                    </span>
                    <div className={`p-2.5 rounded-xl border text-xs truncate transition-all group-hover:border-slate-300 shadow-3xs font-bold ${attr.color}`}>
                      {attr.value || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Blast Radius</h5>
                    <p className="text-[11px] text-amber-900 leading-normal font-bold">
                      This error is blocking <span className="text-amber-700 underline decoration-amber-500/40">18 downstream transformations</span> in the financial ledger module.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-950 space-y-4 shadow-3xs relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-100/25 animate-pulse" />
              <h3 className="text-xs font-black flex items-center gap-2 text-indigo-700 uppercase tracking-widest relative z-10">
                <Lightbulb className="w-4 h-4" />
                Proactive Logic
              </h3>
              <p className="text-[11px] text-indigo-900/90 leading-relaxed font-bold relative z-10">
                The AI identified <span className="text-indigo-700 font-black">42 similar instances</span> of this pattern in the last 15 minutes. Create a global auto-cleansing rule?
              </p>
              <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-widest relative z-10 active:scale-95">
                Create Rule
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-black text-xs rounded-xl border border-slate-200 transition-all cursor-pointer active:scale-95 shadow-xs uppercase tracking-widest"
          >
            Close Detail
          </button>
          <button
            onClick={() => onToggleStatus(error.id)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-2 uppercase tracking-widest ${
              error.status === 'Resolved'
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-500/30'
            }`}
          >
            {error.status === 'Resolved' ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Re-open
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Resolve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>
  </svg>
);
