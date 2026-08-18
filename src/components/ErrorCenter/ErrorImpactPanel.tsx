import React from 'react';
import { Activity, Workflow, Database, AlertCircle, ShieldAlert, Layers } from 'lucide-react';

export interface ConnectedSystemImpact {
  id: string;
  systemName: string;
  systemType: 'Target ERP' | 'Staging DB' | 'Validation Service' | 'Data Lake' | 'CRM Sync';
  status: 'BLOCKED' | 'DEGRADED' | 'WARNING' | 'HEALTHY';
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  recordsBlockedCount: number;
  affectedJobs: string[];
  primaryPatternTrigger: string;
  predictionReason: string;
  estimatedDelayMinutes: number;
  recommendedAction: string;
}

export interface MigrationJobImpact {
  jobId: string;
  jobTitle: string;
  entityName: string;
  activeErrorCount: number;
  failureProbability: number; // percentage
  blastRadiusCategory: 'High Risk - Ingress Blocked' | 'Medium Risk - Format Latency' | 'Low Risk - Transient Retries' | 'Operational Warning';
  affectedDownstreamModule: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  mitigationRecommendation: string;
}

interface ErrorImpactPanelProps {
  systemImpacts: ConnectedSystemImpact[];
  jobImpacts: MigrationJobImpact[];
  activeTab: 'systems' | 'jobs' | 'patterns';
  setActiveTab: (tab: 'systems' | 'jobs' | 'patterns') => void;
}

export const ErrorImpactPanel: React.FC<ErrorImpactPanelProps> = ({
  systemImpacts,
  jobImpacts,
  activeTab,
  setActiveTab
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
          <Activity className="w-4 h-4 text-indigo-600" />
          Predictive Impact Engine
        </h3>
        <div className="flex bg-slate-100/80 p-1 rounded-full border border-slate-200/55 shadow-inner">
          {(['systems', 'jobs', 'patterns'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer ${
                activeTab === t ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-modal-scrollbar p-4 space-y-4 bg-white">
        {activeTab === 'systems' && systemImpacts.map((sys) => (
          <div key={sys.id} className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-md transition-all group shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-indigo-50/30 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  sys.status === 'BLOCKED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                  sys.status === 'DEGRADED' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {sys.systemType === 'Target ERP' ? <Layers className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{sys.systemName}</h4>
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{sys.systemType}</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
                sys.status === 'BLOCKED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                sys.status === 'DEGRADED' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                {sys.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 shadow-inner">
                <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider mb-1">Records Blocked</span>
                <span className="text-sm font-black font-mono text-slate-800 tracking-tighter">{sys.recordsBlockedCount.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 shadow-inner">
                <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider mb-1">Est. Delay</span>
                <span className="text-sm font-black font-mono text-slate-800 tracking-tighter">+{sys.estimatedDelayMinutes}m</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-[10px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50 shadow-inner">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-bold uppercase tracking-tight">{sys.predictionReason}</p>
            </div>
          </div>
        ))}

        {activeTab === 'jobs' && jobImpacts.map((job) => (
          <div key={job.jobId} className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-md transition-all shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <Workflow className="w-4 h-4 text-slate-500" />
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{job.jobTitle}</h4>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full shadow-md ${
                job.riskLevel === 'Critical' ? 'bg-rose-500 animate-pulse shadow-rose-500/20' :
                job.riskLevel === 'High' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-emerald-500 shadow-emerald-500/20'
              }`} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Failure Probability</span>
                <span className={`${job.failureProbability > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>{job.failureProbability}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 shadow-inner">
                <div 
                  className={`h-full transition-all duration-700 shadow-xs ${
                    job.failureProbability > 70 ? 'bg-rose-500' : job.failureProbability > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${job.failureProbability}%` }}
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-[10px] text-indigo-600 font-bold uppercase tracking-tight shadow-inner">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{job.blastRadiusCategory}</span>
              </div>
            </div>
          </div>
        ))}

        {activeTab === 'patterns' && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-3xs">
              <Activity className="w-6 h-6 text-slate-600" />
            </div>
            <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Pattern Analysis Pending</h5>
            <p className="text-[10px] text-slate-600 leading-relaxed font-bold uppercase tracking-widest max-w-[200px]">
              Analyzing stream for repeated failure signatures.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
