import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  XCircle,
  ArrowRight,
  TrendingUp,
  Database,
  Cloud,
  Building2,
  Server,
  Layers,
  Clock,
  RefreshCw,
  ShieldCheck,
  Rocket,
  Terminal,
  GitCompare,
  BarChart3,
  Target,
  ChevronRight,
  X,
  ThumbsUp,
  AlertCircle,
  CheckSquare,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type JobStatus = 'RUNNING' | 'PAUSED' | 'QUEUED' | 'COMPLETED' | 'FAILED';
type Environment = 'SANDBOX' | 'PRODUCTION';

interface LiveMigrationJob {
  id: string;
  name: string;
  source: string;
  target: string;
  sourceIcon: string;
  targetIcon: string;
  status: JobStatus;
  progress: number;
  recordsProcessed: number;
  totalRecords: number;
  recordsPerSec: number;
  errorsCount: number;
  warningsCount: number;
  startTime: string;
  environment: Environment;
  sandboxApproved: boolean;
  year?: number;
}

interface ReconciliationRow {
  entity: string;
  sourceCount: number;
  targetCount: number;
  matched: number;
  unmatched: number;
  pct: number;
}

interface LogEntry {
  ts: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  msg: string;
  jobId?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const INITIAL_JOBS: LiveMigrationJob[] = [
  {
    id: 'j1', name: 'Customer Master Data → BC365',
    source: 'SAP ECC 6.0', target: 'Business Central',
    sourceIcon: 'Building2', targetIcon: 'Cloud',
    status: 'RUNNING', progress: 67, recordsProcessed: 834290, totalRecords: 1250000,
    recordsPerSec: 1240, errorsCount: 312, warningsCount: 891,
    startTime: '08:30', environment: 'SANDBOX', sandboxApproved: true, year: 2021,
  },
  {
    id: 'j2', name: 'GL Transactions 2019–2020 → D365',
    source: 'Oracle EBS', target: 'Dynamics 365',
    sourceIcon: 'Database', targetIcon: 'Cloud',
    status: 'RUNNING', progress: 42, recordsProcessed: 521000, totalRecords: 1240000,
    recordsPerSec: 980, errorsCount: 76, warningsCount: 403,
    startTime: '09:15', environment: 'SANDBOX', sandboxApproved: false, year: 2020,
  },
  {
    id: 'j3', name: 'Vendor Ledger → BC Production',
    source: 'Navision 2017', target: 'Business Central',
    sourceIcon: 'Server', targetIcon: 'Cloud',
    status: 'PAUSED', progress: 89, recordsProcessed: 890000, totalRecords: 1000000,
    recordsPerSec: 0, errorsCount: 1204, warningsCount: 3412,
    startTime: '07:00', environment: 'PRODUCTION', sandboxApproved: true, year: 2022,
  },
  {
    id: 'j4', name: 'Item / Product Catalog → BC365',
    source: 'Excel / CSV', target: 'Business Central',
    sourceIcon: 'Layers', targetIcon: 'Cloud',
    status: 'QUEUED', progress: 0, recordsProcessed: 0, totalRecords: 348000,
    recordsPerSec: 0, errorsCount: 0, warningsCount: 0,
    startTime: '—', environment: 'SANDBOX', sandboxApproved: false, year: 2023,
  },
  {
    id: 'j5', name: 'Sales Orders 2022 → BC Production',
    source: 'SAP S/4HANA', target: 'Business Central',
    sourceIcon: 'Building2', targetIcon: 'Cloud',
    status: 'COMPLETED', progress: 100, recordsProcessed: 680000, totalRecords: 680000,
    recordsPerSec: 0, errorsCount: 24, warningsCount: 156,
    startTime: '06:00', environment: 'PRODUCTION', sandboxApproved: true, year: 2022,
  },
];

const RECON_ROWS: ReconciliationRow[] = [
  { entity: 'Customer', sourceCount: 248540, targetCount: 248309, matched: 248188, unmatched: 352, pct: 99.86 },
  { entity: 'Vendor', sourceCount: 89410, targetCount: 89382, matched: 89310, unmatched: 100, pct: 99.89 },
  { entity: 'GL Account', sourceCount: 12480, targetCount: 12478, matched: 12474, unmatched: 6, pct: 99.95 },
  { entity: 'Sales Order', sourceCount: 680000, targetCount: 679840, matched: 679760, unmatched: 240, pct: 99.96 },
  { entity: 'Item / Product', sourceCount: 348000, targetCount: 0, matched: 0, unmatched: 348000, pct: 0 },
];

const INITIAL_LOGS: LogEntry[] = [
  { ts: '09:41:12', level: 'INFO',    msg: 'Control Tower online. 5 pipelines registered.', },
  { ts: '09:41:15', level: 'SUCCESS', msg: '[j1] Batch 834 committed — 1,240 rec/s sustained throughput.', jobId: 'j1' },
  { ts: '09:41:28', level: 'WARN',    msg: '[j2] GL Transactions: 76 records failed referential constraint check.', jobId: 'j2' },
  { ts: '09:41:33', level: 'INFO',    msg: '[j3] Vendor Ledger paused — awaiting manual approval gate.', jobId: 'j3' },
  { ts: '09:41:40', level: 'SUCCESS', msg: '[j5] Sales Orders 2022 completed. 680,000/680,000 committed.', jobId: 'j5' },
  { ts: '09:41:45', level: 'INFO',    msg: '[j4] Item Catalog queued. Awaiting j2 slot release.', jobId: 'j4' },
];

const LOG_POOL: LogEntry[] = [
  { ts: '', level: 'INFO',    msg: '[j1] Batch checkpoint saved at cursor 835,400.', jobId: 'j1' },
  { ts: '', level: 'SUCCESS', msg: '[j1] Currency normalisation applied — 48 codes corrected.', jobId: 'j1' },
  { ts: '', level: 'WARN',    msg: '[j2] Latency spike detected: 342 ms avg → throttle engaged.', jobId: 'j2' },
  { ts: '', level: 'INFO',    msg: '[j2] Batch 521 committed — 980 rec/s.', jobId: 'j2' },
  { ts: '', level: 'ERROR',   msg: '[j2] 3 records exceeded OData payload limit (4 MB). Routed to quarantine.', jobId: 'j2' },
  { ts: '', level: 'INFO',    msg: 'Auto-refresh: all KPIs recalculated.', },
  { ts: '', level: 'SUCCESS', msg: '[j1] Deduplication sweep: 22 golden records merged.', jobId: 'j1' },
  { ts: '', level: 'WARN',    msg: '[j1] Memory pressure on Worker-04: 88% utilisation.', jobId: 'j1' },
  { ts: '', level: 'INFO',    msg: '[j4] Scheduled start: waiting for j2 slot (ETA +3 min).', jobId: 'j4' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
};

const SourceIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className = 'w-4 h-4' }) => {
  switch (icon) {
    case 'Building2': return <Building2 className={className} />;
    case 'Cloud':     return <Cloud className={className} />;
    case 'Server':    return <Server className={className} />;
    case 'Layers':    return <Layers className={className} />;
    default:          return <Database className={className} />;
  }
};

const statusColors: Record<JobStatus, { badge: string; dot: string; text: string }> = {
  RUNNING:   { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500 animate-pulse', text: 'Running' },
  PAUSED:    { badge: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500',                 text: 'Paused' },
  QUEUED:    { badge: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-400',                  text: 'Queued' },
  COMPLETED: { badge: 'bg-slate-50 text-slate-600 border-slate-200',       dot: 'bg-slate-400',                 text: 'Completed' },
  FAILED:    { badge: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500',                  text: 'Failed' },
};

const logColors: Record<string, string> = {
  INFO:    'text-slate-400',
  WARN:    'text-amber-400',
  ERROR:   'text-rose-400',
  SUCCESS: 'text-emerald-400',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const MigrationControlTowerView: React.FC = () => {
  const [jobs, setJobs] = useState<LiveMigrationJob[]>(INITIAL_JOBS);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [promoteJobId, setPromoteJobId] = useState<string | null>(null);
  const [promoteStep, setPromoteStep] = useState<'confirm' | 'running' | 'done'>('confirm');
  const [promoteProgress, setPromoteProgress] = useState(0);
  const [emergencyStop, setEmergencyStop] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // ── Real-time simulation ──────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (emergencyStop) return;

      setJobs(prev => prev.map(job => {
        if (job.status !== 'RUNNING') return job;
        const increment = Math.floor(Math.random() * 1200) + 600;
        const newProcessed = Math.min(job.totalRecords, job.recordsProcessed + increment);
        const newProgress = Math.round((newProcessed / job.totalRecords) * 100);
        const newRps = Math.floor(Math.random() * 400) + 800;
        const newErrs = job.errorsCount + (Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0);
        const isDone = newProcessed >= job.totalRecords;
        return {
          ...job,
          recordsProcessed: newProcessed,
          progress: newProgress,
          recordsPerSec: isDone ? 0 : newRps,
          errorsCount: newErrs,
          status: isDone ? 'COMPLETED' : 'RUNNING',
        };
      }));

      // Append a random log entry
      const template = LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)];
      setLogs(prev => [...prev.slice(-60), { ...template, ts: now() }]);
    }, 2500);

    return () => clearInterval(interval);
  }, [emergencyStop]);

  // Auto-scroll terminal
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = (() => {
    const active = jobs.filter(j => j.status === 'RUNNING').length;
    const totalRps = jobs.filter(j => j.status === 'RUNNING').reduce((s, j) => s + j.recordsPerSec, 0);
    const done = jobs.filter(j => j.status === 'COMPLETED');
    const successRate = done.length > 0
      ? +((done.reduce((s, j) => s + ((j.totalRecords - j.errorsCount) / j.totalRecords) * 100, 0) / done.length)).toFixed(1)
      : 99.1;
    const allProcessed = jobs.reduce((s, j) => s + j.recordsProcessed, 0);
    const allTotal = jobs.reduce((s, j) => s + j.totalRecords, 0);
    return { active, totalRps, successRate, allProcessed, allTotal, done: done.length };
  })();

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleJobStatus = useCallback((id: string) => {
    setJobs(prev => prev.map(j => j.id !== id ? j : ({
      ...j,
      status: j.status === 'RUNNING' ? 'PAUSED' : j.status === 'PAUSED' ? 'RUNNING' : j.status,
    })));
  }, []);

  const startPromote = useCallback((id: string) => {
    setPromoteJobId(id);
    setPromoteStep('confirm');
    setPromoteProgress(0);
  }, []);

  const handlePromoteRun = useCallback(() => {
    setPromoteStep('running');
    let p = 0;
    const iv = setInterval(() => {
      p += Math.floor(Math.random() * 14) + 5;
      setPromoteProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(iv);
        setPromoteStep('done');
        setJobs(prev => prev.map(j => j.id === promoteJobId ? { ...j, environment: 'PRODUCTION', sandboxApproved: true } : j));
        setLogs(prev => [...prev, { ts: now(), level: 'SUCCESS', msg: `[${promoteJobId}] ✅ Promoted to PRODUCTION successfully.`, jobId: promoteJobId ?? undefined }]);
      }
    }, 220);
  }, [promoteJobId]);

  const handleEmergencyStop = useCallback(() => {
    setEmergencyStop(true);
    setJobs(prev => prev.map(j => j.status === 'RUNNING' ? { ...j, status: 'PAUSED', recordsPerSec: 0 } : j));
    setLogs(prev => [...prev, { ts: now(), level: 'ERROR', msg: '🛑 EMERGENCY STOP engaged — all running pipelines paused by operator.' }]);
  }, []);

  const promoteJob = jobs.find(j => j.id === promoteJobId);

  return (
    <div className="space-y-6 font-sans text-slate-900 pb-12">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE — {kpis.active} active pipeline{kpis.active !== 1 ? 's' : ''}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Control Tower v2</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-indigo-600" />
            Migration Control Tower
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium max-w-2xl">
            Real-time command center for all active, queued, and completed migration pipelines.
            Monitor throughput, inspect errors, reconcile target data, and promote sandbox jobs to production.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          {emergencyStop ? (
            <button
              onClick={() => { setEmergencyStop(false); setJobs(prev => prev.map(j => j.status === 'PAUSED' && j.environment === 'SANDBOX' ? { ...j, status: 'RUNNING' } : j)); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5" /> Resume All
            </button>
          ) : (
            <button
              onClick={handleEmergencyStop}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <XCircle className="w-3.5 h-3.5" /> Emergency Stop
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Pipelines', value: String(kpis.active), sub: `${kpis.done} completed`, icon: <Activity className="w-4 h-4" />, color: 'emerald' },
          { label: 'Aggregate Throughput', value: `${(kpis.totalRps / 1000).toFixed(1)}k`, sub: 'records / second', icon: <Zap className="w-4 h-4" />, color: 'indigo' },
          { label: 'Overall Success Rate', value: `${kpis.successRate}%`, sub: 'across completed jobs', icon: <TrendingUp className="w-4 h-4" />, color: 'blue' },
          { label: 'Records Migrated', value: `${(kpis.allProcessed / 1_000_000).toFixed(2)}M`, sub: `of ${(kpis.allTotal / 1_000_000).toFixed(2)}M total`, icon: <Database className="w-4 h-4" />, color: 'violet' },
        ].map((kpi, i) => {
          const bg: Record<string, string> = { emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100', indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100', blue: 'bg-blue-50 text-blue-600 border-blue-100', violet: 'bg-violet-50 text-violet-600 border-violet-100' };
          const val: Record<string, string> = { emerald: 'text-emerald-700', indigo: 'text-indigo-700', blue: 'text-blue-700', violet: 'text-violet-700' };
          return (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-2 rounded-xl border ${bg[kpi.color]}`}>{kpi.icon}</div>
              </div>
              <div className={`text-2xl font-black tracking-tight font-mono ${val[kpi.color]}`}>{kpi.value}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Live Job Matrix + Terminal ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* Job Matrix (2/3 width) */}
        <div className="xl:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <GitCompare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Live Job Matrix</h3>
                <p className="text-[11px] text-slate-500 font-medium">{jobs.length} pipelines · real-time telemetry</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {jobs.map(job => {
              const sc = statusColors[job.status];
              const canPromote = job.environment === 'SANDBOX' && (job.status === 'COMPLETED' || job.status === 'PAUSED') && !job.sandboxApproved;
              return (
                <div key={job.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  {/* Row header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 truncate">{job.name}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sc.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.text}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${job.environment === 'PRODUCTION' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                          {job.environment}
                        </span>
                        {job.year && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-slate-50 text-slate-600 border-slate-200">
                            FY {job.year}
                          </span>
                        )}
                      </div>
                      {/* Source → Target */}
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 font-medium">
                        <SourceIcon icon={job.sourceIcon} className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.source}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <SourceIcon icon={job.targetIcon} className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.target}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {(job.status === 'RUNNING' || job.status === 'PAUSED') && (
                        <button
                          onClick={() => toggleJobStatus(job.id)}
                          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                          title={job.status === 'RUNNING' ? 'Pause' : 'Resume'}
                        >
                          {job.status === 'RUNNING' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {canPromote && (
                        <button
                          onClick={() => startPromote(job.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm"
                        >
                          <Rocket className="w-3 h-3" />
                          Promote
                        </button>
                      )}
                      {job.environment === 'PRODUCTION' && job.sandboxApproved && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-xl">
                          <ShieldCheck className="w-3 h-3" /> Production
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
                      <span>{job.recordsProcessed.toLocaleString()} / {job.totalRecords.toLocaleString()} records</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          job.status === 'COMPLETED' ? 'bg-emerald-500' :
                          job.status === 'FAILED' ? 'bg-rose-500' :
                          job.status === 'PAUSED' ? 'bg-amber-400' :
                          'bg-indigo-500'
                        }`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div className="flex items-center gap-5 mt-3 text-[10px] font-mono font-bold text-slate-500">
                    {job.status === 'RUNNING' && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Zap className="w-3 h-3" />{job.recordsPerSec.toLocaleString()} rec/s
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-rose-500">
                      <AlertTriangle className="w-3 h-3" />{job.errorsCount.toLocaleString()} errors
                    </span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <AlertCircle className="w-3 h-3" />{job.warningsCount.toLocaleString()} warnings
                    </span>
                    {job.startTime !== '—' && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />Started {job.startTime}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Terminal Log (1/3 width) */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-lg overflow-hidden flex flex-col" style={{ minHeight: '480px' }}>
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-300">Live Event Log</span>
            <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              STREAMING
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[11px]" style={{ maxHeight: '520px' }}>
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-slate-600 shrink-0">{log.ts}</span>
                <span className={`shrink-0 font-bold w-7 ${logColors[log.level]}`}>
                  {log.level === 'SUCCESS' ? 'OK ' : log.level === 'ERROR' ? 'ERR' : log.level === 'WARN' ? 'WRN' : 'INF'}
                </span>
                <span className={logColors[log.level]}>{log.msg}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* ── Reconciliation Health Panel ────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Reconciliation Health — Source vs. Target</h3>
            <p className="text-[11px] text-slate-500 font-medium">Entity-level count verification across all migration pipelines</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Entity', 'Source Count', 'Target Count', 'Matched', 'Unmatched', 'Match Rate'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase text-slate-500 tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RECON_ROWS.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">{row.entity}</td>
                  <td className="px-5 py-3.5 text-slate-600 font-mono">{row.sourceCount.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-slate-600 font-mono">{row.targetCount.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-emerald-700 font-bold font-mono">{row.matched.toLocaleString()}</td>
                  <td className="px-5 py-3.5 font-mono">
                    <span className={`font-bold ${row.unmatched > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{row.unmatched.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${row.pct >= 99 ? 'bg-emerald-500' : row.pct > 0 ? 'bg-amber-500' : 'bg-slate-300'}`} style={{ width: `${row.pct}%` }} />
                      </div>
                      <span className={`font-black font-mono text-xs ${row.pct >= 99 ? 'text-emerald-700' : row.pct > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                        {row.pct > 0 ? `${row.pct}%` : 'Pending'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Promote to Production Modal ────────────────────────────────────── */}
      {promoteJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-base">Promote to Production</h2>
                  <p className="text-xs text-slate-500 font-medium">Production Promotion Gate</p>
                </div>
              </div>
              {promoteStep !== 'running' && (
                <button onClick={() => setPromoteJobId(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-6 space-y-4">
              {promoteStep === 'confirm' && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-800">Production Write Warning</span>
                    </div>
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                      Promoting this job will commit data writes to the PRODUCTION Business Central environment.
                      Ensure the sandbox dry-run has been reviewed and all reconciliation checks pass.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: 'Job', value: promoteJob?.name },
                      { label: 'Records', value: `${(promoteJob?.totalRecords || 0).toLocaleString()}` },
                      { label: 'Source', value: promoteJob?.source },
                      { label: 'Target', value: `${promoteJob?.target} (PRODUCTION)` },
                      { label: 'Sandbox Status', value: promoteJob?.status },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                        <span className="text-slate-500 font-medium">{row.label}</span>
                        <span className="font-bold text-slate-900">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setPromoteJobId(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handlePromoteRun}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      Promote Migration → Production
                    </button>
                  </div>
                </>
              )}

              {promoteStep === 'running' && (
                <div className="py-4 space-y-5">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-900">Promoting to Production…</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Running production-guard validation pipeline</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono font-bold text-slate-600 mb-1.5">
                      <span>Progress</span><span>{promoteProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${promoteProgress}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px] text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-200">
                    {['Running pre-flight validation checks…', 'Verifying reconciliation health…', 'Acquiring production write token…', 'Executing guarded record commits…'].map((step, i) => (
                      promoteProgress > i * 25 && (
                        <div key={i} className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>{step}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {promoteStep === 'done' && (
                <div className="py-4 space-y-5">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-base font-black text-slate-900 mb-1">Promoted Successfully</h3>
                    <p className="text-xs text-slate-500 font-medium">{promoteJob?.name} is now live in the Production environment.</p>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setPromoteJobId(null)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrationControlTowerView;
