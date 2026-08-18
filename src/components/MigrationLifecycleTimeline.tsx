import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Zap,
  ShieldCheck,
  Layers,
  Check,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Server,
  Activity,
  Terminal,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  name: string;
  description: string;
  detailedLog: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  icon: any;
  iconColor: string;
  timestamp?: string;
}

interface MigrationLifecycleJob {
  id: string;
  name: string;
  source: string;
  target: string;
  totalRecords: number;
  currentRecords: number;
  status: 'Idle' | 'Scanning' | 'Mapping' | 'Syncing' | 'Verifying' | 'Completed' | 'Failed';
  currentStageIndex: number; // 0: Idle, 1: Pre-Flight Check, 2: Mapping, 3: Syncing, 4: Verifying, 5: Completed
  stages: TimelineEvent[];
  logs: string[];
}

export const MigrationLifecycleTimeline: React.FC = () => {
  // Initial enterprise-grade jobs list with custom lifecycle configurations
  const [jobs, setJobs] = useState<MigrationLifecycleJob[]>([
    {
      id: 'ml-job-sap',
      name: 'SAP S/4HANA Ledger ➔ Iceberg Data Lake',
      source: 'SAP S/4HANA ERP (prod-cluster)',
      target: 'Apache Iceberg Target Catalog',
      totalRecords: 1425000,
      currentRecords: 0,
      status: 'Idle',
      currentStageIndex: 0,
      logs: [`[${new Date().toLocaleTimeString()}] Pipeline calibrated. Standing by for execution context.`],
      stages: [
        {
          id: 'stage-1',
          name: 'Pre-flight check passed',
          description: 'Establish database connections and check cluster overhead',
          detailedLog: 'Establishing cluster socket connectivity, executing pg_catalog schema introspection, and verifying CPU headroom.',
          status: 'pending',
          icon: ShieldCheck,
          iconColor: 'indigo',
        },
        {
          id: 'stage-2',
          name: 'Mapping validated',
          description: 'Analyze structural parity and column configurations',
          detailedLog: 'Comparing staging columns, validating indices/primary keys, and cross-referencing nested OData templates.',
          status: 'pending',
          icon: Layers,
          iconColor: 'cyan',
        },
        {
          id: 'stage-3',
          name: 'Data sync initiated',
          description: 'Provision ingest streams and begin record pipeline transfer',
          detailedLog: 'Calculating 64 dynamic partition chunks. Dispatching Spark node parallel ingest worker threads.',
          status: 'pending',
          icon: Zap,
          iconColor: 'amber',
        },
        {
          id: 'stage-4',
          name: 'Post-migration verification passed',
          description: 'Validate records integrity, error count, and final schemas',
          detailedLog: 'Comparing row counts, running cryptographic checksum matches, and compiling final validation metadata.',
          status: 'pending',
          icon: CheckCircle2,
          iconColor: 'emerald',
        },
      ],
    },
    {
      id: 'ml-job-sfdc',
      name: 'Salesforce CRM Contacts ➔ Postgres Staging',
      source: 'Salesforce (sObject CRM Endpoint)',
      target: 'PostgreSQL Staging DB',
      totalRecords: 245000,
      currentRecords: 245000,
      status: 'Completed',
      currentStageIndex: 5,
      logs: [
        `[${new Date().toLocaleTimeString()}] [System] Pre-flight socket scan completed. Latency: 12ms.`,
        `[${new Date().toLocaleTimeString()}] [System] Schema mapped: 100% matched with target sObject structure.`,
        `[${new Date().toLocaleTimeString()}] [System] Ingest active: parallel thread poll rate 2,500 rec/sec.`,
        `[${new Date().toLocaleTimeString()}] [System] Ingest finished. Completed count: 245,000 / 245,000 rows.`,
        `[${new Date().toLocaleTimeString()}] [System] Checksum verification PASSED. Zero anomaly logs.`,
      ],
      stages: [
        {
          id: 'stage-1',
          name: 'Pre-flight check passed',
          description: 'Establish database connections and check cluster overhead',
          detailedLog: 'All cluster sockets verified online. Pings returned 12ms. Target overhead cleared.',
          status: 'completed',
          icon: ShieldCheck,
          iconColor: 'indigo',
          timestamp: '11:15:02 AM',
        },
        {
          id: 'stage-2',
          name: 'Mapping validated',
          description: 'Analyze structural parity and column configurations',
          detailedLog: 'PostgreSQL staging column schemas validated against source Salesforce Contact metadata templates.',
          status: 'completed',
          icon: Layers,
          iconColor: 'cyan',
          timestamp: '11:15:10 AM',
        },
        {
          id: 'stage-3',
          name: 'Data sync initiated',
          description: 'Provision ingest streams and begin record pipeline transfer',
          detailedLog: 'Ingest pipeline successfully initialized. 245,000 rows transferred over high-performance connection.',
          status: 'completed',
          icon: Zap,
          iconColor: 'amber',
          timestamp: '11:15:35 AM',
        },
        {
          id: 'stage-4',
          name: 'Post-migration verification passed',
          description: 'Validate records integrity, error count, and final schemas',
          detailedLog: 'Row count checksum verification passed (245k target vs 245k source). 0 exceptions.',
          status: 'completed',
          icon: CheckCircle2,
          iconColor: 'emerald',
          timestamp: '11:16:00 AM',
        },
      ],
    },
    {
      id: 'ml-job-file',
      name: 'Legacy File Ingestion ➔ AWS S3 Object Store',
      source: 'On-Premises NAS SMB Files',
      target: 'AWS S3 Glacier Deep Archive',
      totalRecords: 890000,
      currentRecords: 0,
      status: 'Idle',
      currentStageIndex: 0,
      logs: [`[${new Date().toLocaleTimeString()}] Pipeline calibrated. Standing by for execution context.`],
      stages: [
        {
          id: 'stage-1',
          name: 'Pre-flight check passed',
          description: 'Establish database connections and check cluster overhead',
          detailedLog: 'Pinged SMB storage cluster. Access permissions cleared. Target S3 API quotas validated.',
          status: 'pending',
          icon: ShieldCheck,
          iconColor: 'indigo',
        },
        {
          id: 'stage-2',
          name: 'Mapping validated',
          description: 'Analyze structural parity and column configurations',
          detailedLog: 'MIME types verified. S3 bucket key mapping patterns validated.',
          status: 'pending',
          icon: Layers,
          iconColor: 'cyan',
        },
        {
          id: 'stage-3',
          name: 'Data sync initiated',
          description: 'Provision ingest streams and begin record pipeline transfer',
          detailedLog: 'Multiplying multi-part file stream upload channels. Active data sync launched.',
          status: 'pending',
          icon: Zap,
          iconColor: 'amber',
        },
        {
          id: 'stage-4',
          name: 'Post-migration verification passed',
          description: 'Validate records integrity, error count, and final schemas',
          detailedLog: 'File count matches source. SHA-256 integrity hash verification successfully finalized.',
          status: 'pending',
          icon: CheckCircle2,
          iconColor: 'emerald',
        },
      ],
    },
  ]);

  const [selectedJobId, setSelectedJobId] = useState<string>('ml-job-sap');
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);
  const [simulationTimer, setSimulationTimer] = useState<NodeJS.Timeout | null>(null);

  // Find active selected job details
  const activeJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  // Auto-play / Continuous simulation logic
  useEffect(() => {
    if (isPlayingAuto) {
      const interval = setInterval(() => {
        handleNextStage();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPlayingAuto, selectedJobId, jobs]);

  // Action: Advance current job stage by 1 step
  const handleNextStage = () => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job.id !== selectedJobId) return job;

        if (job.currentStageIndex >= 5) {
          // If already completed, do nothing
          return job;
        }

        const nextIndex = job.currentStageIndex + 1;
        const updatedStages = [...job.stages];
        const newLogs = [...job.logs];
        const timestampStr = new Date().toLocaleTimeString();

        let nextStatus: MigrationLifecycleJob['status'] = job.status;
        let nextRecords = job.currentRecords;

        // Stage transitions logic
        if (nextIndex === 1) {
          // pre-flight
          updatedStages[0] = {
            ...updatedStages[0],
            status: 'completed',
            timestamp: timestampStr,
          };
          nextStatus = 'Scanning';
          newLogs.push(`[${timestampStr}] [Pre-Flight Scan] Activating distributed socket ping checks.`);
          newLogs.push(`[${timestampStr}] [Pre-Flight Scan] DB clusters connected. Socket handshakes established.`);
          newLogs.push(`[${timestampStr}] [Success] Pre-flight check passed! Node overhead validated safe.`);
        } else if (nextIndex === 2) {
          // mapping
          updatedStages[1] = {
            ...updatedStages[1],
            status: 'completed',
            timestamp: timestampStr,
          };
          nextStatus = 'Mapping';
          newLogs.push(`[${timestampStr}] [Schema Mapping] Triggering DDL parity compiler.`);
          newLogs.push(`[${timestampStr}] [Schema Mapping] Comparing primary/foreign key relationships & constraints.`);
          newLogs.push(`[${timestampStr}] [Success] Mapping validated! Columns are completely compatible.`);
        } else if (nextIndex === 3) {
          // sync initiated
          updatedStages[2] = {
            ...updatedStages[2],
            status: 'completed',
            timestamp: timestampStr,
          };
          nextStatus = 'Syncing';
          nextRecords = Math.floor(job.totalRecords * 0.45); // Start sync records count
          newLogs.push(`[${timestampStr}] [Data Ingestion] Dynamic partitioning calculated. Chunk ranges: 64.`);
          newLogs.push(`[${timestampStr}] [Data Ingestion] Dispatching worker threads across clusters...`);
          newLogs.push(`[${timestampStr}] [Success] Data sync initiated successfully! parallel stream flows active.`);
        } else if (nextIndex === 4) {
          // verifying
          updatedStages[3] = {
            ...updatedStages[3],
            status: 'completed',
            timestamp: timestampStr,
          };
          nextStatus = 'Verifying';
          nextRecords = job.totalRecords; // Transfer completed
          newLogs.push(`[${timestampStr}] [Verification] Stream flow complete. Fetching count checksums.`);
          newLogs.push(`[${timestampStr}] [Verification] Cross-referencing source records vs target records.`);
          newLogs.push(`[${timestampStr}] [Success] Post-migration verification passed! Record checksum match 100%.`);
        } else if (nextIndex === 5) {
          // completed
          nextStatus = 'Completed';
          newLogs.push(`[${timestampStr}] [System] Pipeline execution context completed. All structures green.`);
        }

        return {
          ...job,
          currentStageIndex: nextIndex,
          status: nextStatus,
          currentRecords: nextRecords,
          stages: updatedStages,
          logs: newLogs,
        };
      })
    );
  };

  // Action: Reset pipeline stages & logs back to Idle
  const handleResetPipeline = () => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job.id !== selectedJobId) return job;

        const timestampStr = new Date().toLocaleTimeString();
        const resetStages: TimelineEvent[] = job.stages.map((stg) => ({
          ...stg,
          status: 'pending',
          timestamp: undefined,
        }));

        return {
          ...job,
          currentStageIndex: 0,
          status: 'Idle',
          currentRecords: 0,
          stages: resetStages,
          logs: [`[${timestampStr}] Pipeline reset manually. Standing by for execution context.`],
        };
      })
    );
    setIsPlayingAuto(false);
  };

  // Action: Set selected job index to complete immediately
  const handleFastForwardComplete = () => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job.id !== selectedJobId) return job;

        const timestampStr = new Date().toLocaleTimeString();
        const finalStages: TimelineEvent[] = job.stages.map((stg) => ({
          ...stg,
          status: 'completed',
          timestamp: timestampStr,
        }));

        return {
          ...job,
          currentStageIndex: 5,
          status: 'Completed',
          currentRecords: job.totalRecords,
          stages: finalStages,
          logs: [
            ...job.logs,
            `[${timestampStr}] Fast-forward completed by admin override.`,
            `[${timestampStr}] [System] All stages bypassed and validated. Record throughput successfully synchronized.`,
          ],
        };
      })
    );
  };

  return (
    <div id="migration-lifecycle-timeline-widget" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* LEFT COLUMN: Pipeline Jobs Selection List (4 grid span) */}
      <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              Active Migration Pipelines
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select an active cloud workspace integration to inspect its lifecycle timeline.
            </p>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
            {jobs.map((job) => {
              const isActive = job.id === selectedJobId;
              const isJobIdle = job.status === 'Idle';
              const isJobCompleted = job.status === 'Completed';

              return (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setIsPlayingAuto(false);
                  }}
                  className={`p-3.5 rounded-xl border transition-all duration-150 text-left cursor-pointer group ${
                    isActive
                      ? 'bg-indigo-50/50 border-indigo-500 shadow-3xs ring-1 ring-indigo-500/30'
                      : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">
                      {job.id === 'ml-job-sap' ? 'SAP STAGING' : job.id === 'ml-job-sfdc' ? 'CRM INGEST' : 'FILE STREAM'}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded font-mono border ${
                      isJobCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      isJobIdle ? 'bg-slate-200 text-slate-600 border-slate-300' :
                      'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  <p className={`text-[11px] font-extrabold mt-1.5 leading-snug ${isActive ? 'text-indigo-950' : 'text-slate-800'}`}>
                    {job.name}
                  </p>

                  <div className="mt-3.5 space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>Records Migrated</span>
                      <span className="font-bold text-slate-700">
                        {job.currentRecords.toLocaleString()} / {job.totalRecords.toLocaleString()}
                      </span>
                    </div>

                    {/* Simple progress track */}
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-1 rounded-full transition-all duration-500 ${isJobCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                        style={{ width: `${(job.currentRecords / job.totalRecords) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Small cluster overview info box */}
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-left space-y-1.5">
          <span className="text-[9px] font-black text-slate-400 font-mono block">PIPELINE RUNTIME CLUSTER</span>
          <p className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Nodes: 128 Spark Pods
          </p>
          <p className="text-[9px] text-slate-400 leading-normal">
            Cluster autoscale threshold config is synced with regional Kubernetes scheduler nodes.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Chronological Timeline Stepper & Logs (8 grid span) */}
      <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black text-slate-500 font-mono tracking-wider uppercase bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                Selected Job Audit
              </span>
              <span className="text-[10px] text-slate-400">➔</span>
              <span className="text-[11px] font-bold text-indigo-700 font-mono">{activeJob.source}</span>
            </div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
              {activeJob.name}
            </h3>
          </div>

          {/* Interactive Simulation Trigger Panel */}
          <div className="flex items-center gap-2 flex-wrap sm:self-center shrink-0">
            <button
              type="button"
              id="btn-advance-lifecycle-stage"
              onClick={handleNextStage}
              disabled={activeJob.currentStageIndex >= 5}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
                activeJob.currentStageIndex >= 5
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              <span>
                {activeJob.currentStageIndex === 0 ? 'Start Pipeline' : 'Simulate Next Stage'}
              </span>
            </button>

            <button
              type="button"
              id="btn-continuous-sim"
              onClick={() => setIsPlayingAuto(!isPlayingAuto)}
              disabled={activeJob.currentStageIndex >= 5}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                isPlayingAuto
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60'
              }`}
            >
              {isPlayingAuto ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlayingAuto ? 'Stop Auto' : 'Auto Play'}</span>
            </button>

            <button
              type="button"
              id="btn-fast-forward"
              onClick={handleFastForwardComplete}
              disabled={activeJob.status === 'Completed'}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 cursor-pointer"
              title="Instantly bypass stages and complete migration"
            >
              Skip to End
            </button>

            <button
              type="button"
              id="btn-reset-lifecycle"
              onClick={handleResetPipeline}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-lg cursor-pointer"
              title="Reset stages to idle state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Stepper Timeline (Chronological Flow) */}
        <div className="relative pl-7 md:pl-10 border-l border-slate-200/80 space-y-6 ml-3 md:ml-5 py-2 text-left">
          {activeJob.stages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed' || activeJob.currentStageIndex > idx + 1 || activeJob.status === 'Completed';
            const isActive = activeJob.currentStageIndex === idx + 1;
            const isPending = !isCompleted && !isActive;

            const IconComponent = stage.icon;

            return (
              <div key={stage.id} className="relative group animate-in slide-in-from-left duration-150">
                {/* Stepper Node Bullet */}
                <div
                  className={`absolute -left-[39px] md:-left-[51px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 shadow-2xs ${
                    isActive
                      ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100 scale-110 z-10 animate-bounce'
                      : isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span className="text-[10px] font-black font-mono">{idx + 1}</span>
                  )}
                </div>

                {/* Stepper Event Card Content */}
                <div className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-indigo-50/30 border-indigo-200 shadow-3xs ring-1 ring-indigo-100/30'
                    : isCompleted
                    ? 'bg-emerald-50/20 border-emerald-100/80'
                    : 'bg-slate-50/50 border-slate-150'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border font-mono tracking-wider ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          isActive ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                          'bg-slate-200 text-slate-500 border-slate-300'
                        }`}>
                          {idx === 0 ? 'Pre-Flight' : idx === 1 ? 'Mapping' : idx === 2 ? 'Data Sync' : 'Verification'}
                        </span>
                        {stage.timestamp && (
                          <span className="text-[9px] font-bold text-slate-400 font-mono">
                            Timestamp: {stage.timestamp}
                          </span>
                        )}
                      </div>

                      <h4 className={`text-xs font-black mt-1 ${
                        isActive ? 'text-indigo-950 font-black' : isCompleted ? 'text-slate-800 font-extrabold' : 'text-slate-400 font-bold'
                      }`}>
                        {stage.name}
                      </h4>
                    </div>

                    {/* Category Label Indicator with Icon */}
                    <div className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center border self-start sm:self-center ${
                      isActive ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                      isCompleted ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <p className={`text-[11px] mt-1.5 font-medium leading-relaxed ${
                    isActive ? 'text-indigo-900/80' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {stage.description}
                  </p>

                  {/* Expanded detailed log description inside cards */}
                  {(isActive || isCompleted) && (
                    <div className={`mt-3 p-2.5 rounded-lg border font-mono text-[10px] leading-relaxed text-left transition-all ${
                      isActive ? 'bg-indigo-950 text-indigo-200 border-indigo-900/50' : 'bg-slate-50 border-slate-200/60 text-slate-600'
                    }`}>
                      <span className="font-bold uppercase text-[8px] tracking-wider block mb-0.5 opacity-80">
                        {isActive ? 'Active Processing Log' : 'Archived Verification Record'}
                      </span>
                      {stage.detailedLog}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Stepper Diagnostic Logs Terminal Panel */}
        <div className="space-y-2 text-left bg-slate-950 p-4.5 rounded-xl border border-slate-900 font-mono text-[11px] text-indigo-400 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
            <span className="text-[9px] text-slate-500 uppercase font-black flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Ingestion Pipeline Diagnostic Output Logs
            </span>
            <span className="text-[9px] bg-indigo-950 text-indigo-300 font-bold px-1.5 py-0.2 rounded border border-indigo-900/40">
              STD_OUT stream
            </span>
          </div>

          <div className="space-y-1.5 max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {activeJob.logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed font-semibold">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
