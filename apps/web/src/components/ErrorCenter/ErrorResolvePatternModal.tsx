import React from 'react';
import { 
  X, 
  Sparkles, 
  Zap, 
  Trash2, 
  Flag, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { PatternCluster } from '../../types';

interface ErrorResolvePatternModalProps {
  onClose: () => void;
  clusters: PatternCluster[];
  onBulkIgnore: (cluster: PatternCluster) => void;
  onBulkFlag: (cluster: PatternCluster) => void;
  onBulkAutoResolve: (cluster: PatternCluster) => void;
  onAutoResolveAll: () => void;
}

export const ErrorResolvePatternModal: React.FC<ErrorResolvePatternModalProps> = ({
  onClose,
  clusters,
  onBulkIgnore,
  onBulkFlag,
  onBulkAutoResolve,
  onAutoResolveAll
}) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-100/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-2xl border border-indigo-100">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Pattern Auto-Resolver</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Clustering Engine: {clusters.length} active signatures</p>
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
        <div className="flex-1 overflow-y-auto p-6 custom-modal-scrollbar space-y-6 bg-slate-50/20">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Pending Resolution Clusters
            </h3>
            <button
              onClick={onAutoResolveAll}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer border border-emerald-500/30 font-bold"
            >
              <Zap className="w-3.5 h-3.5 fill-emerald-200" />
              Auto-Resolve All High Confidence
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clusters.map((cluster) => (
              <div 
                key={cluster.id} 
                className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden flex flex-col hover:border-indigo-200 transition-all group"
              >
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border ${
                        cluster.ruleCategory === 'Transient Noise' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        cluster.ruleCategory === 'Reference Failure' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {cluster.ruleCategory}
                      </span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {cluster.confidenceScore}% Confidence
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 leading-tight pt-1 uppercase">
                      {cluster.patternTitle}
                    </h4>
                  </div>
                </div>

                <div className="p-4 flex-1 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed font-bold">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <p>{cluster.heuristicReason}</p>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-600">
                          ID
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {cluster.matchedErrors.length > 3 ? `+${cluster.matchedErrors.length - 3} similar records` : `${cluster.matchedErrors.length} matching records`}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => onBulkIgnore(cluster)}
                      className="p-2 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                      title="Bulk Ignore"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onBulkFlag(cluster)}
                      className="p-2 hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-amber-100"
                      title="Bulk Flag for Review"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => onBulkAutoResolve(cluster)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border border-indigo-500/30 uppercase tracking-widest"
                  >
                    <span>Bulk Resolve</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest max-w-md">
            Cleansing rules created here will be applied globally to future ingestion batches across all active worker nodes.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer shadow-3xs uppercase tracking-widest border border-slate-200"
          >
            Close Patterns
          </button>
        </div>
      </div>
    </div>
  );
};
