import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Search,
  Layers,
  Activity,
  Play,
  RefreshCw,
  Pause,
  Trash2,
  Edit,
  Terminal,
  X,
  Check,
  AlertCircle,
  Sliders,
  Cpu,
  TrendingUp,
  Sparkles,
  StopCircle,
  Database,
  Hash,
  Server,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_CONNECTORS } from '../data/mockData';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  status: 'Success' | 'Warning' | 'Failure';
  ipAddress: string;
}

interface ScheduledJob {
  id: string;
  jobName: string;
  cronExpression: string;
  mode: string;
  targetEntity: string;
  lastRun: string;
  nextRun: string;
  status: 'Active' | 'Paused';
}

interface ThroughputPoint {
  sec: string;
  throughput: number;
}

export const AuditSchedulerView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'scheduler'>('audit');

  // --- Search & Filters State ---
  const [auditSearch, setAuditSearch] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState<'All' | 'Success' | 'Warning' | 'Failure'>('All');

  const [cronSearch, setCronSearch] = useState('');
  const [cronStatusFilter, setCronStatusFilter] = useState<'All' | 'Active' | 'Paused'>('All');

  // --- Audit Logs State ---
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 'a1', timestamp: '2026-07-28 09:14:22', user: 'admin@acme.com', action: 'SCHEMA_MAPPING_UPDATED', entity: 'Customers', status: 'Success', ipAddress: '192.168.1.45' },
    { id: 'a2', timestamp: '2026-07-28 08:45:10', user: 'system_bot', action: 'MIGRATION_JOB_EXECUTED', entity: 'Vendor Master', status: 'Success', ipAddress: '10.0.4.12' },
    { id: 'a3', timestamp: '2026-07-28 08:12:05', user: 'data_lead@acme.com', action: 'CONNECTOR_TESTED', entity: 'SAP S/4HANA', status: 'Success', ipAddress: '192.168.1.88' },
    { id: 'a4', timestamp: '2026-07-28 07:30:00', user: 'system_cron', action: 'PRE_FLIGHT_SIMULATION', entity: 'GL Accounts', status: 'Warning', ipAddress: '127.0.0.1' },
  ]);

  // --- Scheduled Jobs State ---
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([
    { id: 's1', jobName: 'Nightly SAP to BC Customer Delta Sync', cronExpression: '0 2 * * *', mode: 'Delta Sync', targetEntity: 'Customers', lastRun: '2026-07-28 02:00:00', nextRun: '2026-07-29 02:00:00', status: 'Active' },
    { id: 's2', jobName: 'Hourly Vendor Invoice Verification', cronExpression: '0 * * * *', mode: 'Incremental', targetEntity: 'Vendor Master', lastRun: '2026-07-28 09:00:00', nextRun: '2026-07-28 10:00:00', status: 'Active' },
    { id: 's3', jobName: 'Weekly Full Audit & Profiler Sweep', cronExpression: '0 0 * * 0', mode: 'Full Inspection', targetEntity: 'GL Accounts', lastRun: '2026-07-26 00:00:00', nextRun: '2026-08-02 00:00:00', status: 'Paused' },
  ]);

  // --- Live Metrics States ---
  const [recordsSyncedToday, setRecordsSyncedToday] = useState(245810);
  const [systemLoad, setSystemLoad] = useState(14.5);
  const [heartbeatActive, setHeartbeatActive] = useState(true);

  // --- Execution Engine States ---
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [runningJob, setRunningJob] = useState<ScheduledJob | null>(null);
  const [isExecutionFinished, setIsExecutionFinished] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [targetRecordCount, setTargetRecordCount] = useState(12500);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [throughputHistory, setThroughputHistory] = useState<ThroughputPoint[]>([]);

  // --- Modal Form States ---
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [formJobName, setFormJobName] = useState('');
  const [formCron, setFormCron] = useState('*/10 * * * *');
  const [formMode, setFormMode] = useState('Delta Sync');
  const [formTargetEntity, setFormTargetEntity] = useState(MOCK_CONNECTORS[0]?.name || '');
  const [formStatus, setFormStatus] = useState<'Active' | 'Paused'>('Active');

  // --- Toast Notification State ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Heartbeat & Fluctuating Metrics Simulation ---
  useEffect(() => {
    const interval = setInterval(() => {
      // Toggle heartbeat dot briefly
      setHeartbeatActive(false);
      setTimeout(() => setHeartbeatActive(true), 200);

      // Randomly increase cumulative sync counts slightly to show active background processes
      if (Math.random() > 0.4) {
        const increment = Math.floor(Math.random() * 28) + 4;
        setRecordsSyncedToday(prev => prev + increment);
      }

      // Slightly fluctuate system CPU load
      setSystemLoad(prev => {
        const delta = parseFloat((Math.random() * 3 - 1.5).toFixed(1));
        const next = prev + delta;
        return next > 30 ? 25 : next < 5 ? 8 : parseFloat(next.toFixed(1));
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // --- Real-time Execution Engine Sim ---
  useEffect(() => {
    if (!runningJobId || !runningJob) return;

    // Reset metrics
    setExecutionProgress(0);
    setProcessedCount(0);
    setWarningCount(0);
    const targetCount = runningJob.mode === 'Full Inspection' ? 45000 : 12500;
    setTargetRecordCount(targetCount);
    
    // Initial logs
    const initialLogs = [
      `[${new Date().toLocaleTimeString()}] [INFO] Spawning isolated cluster executor worker node #04...`,
      `[${new Date().toLocaleTimeString()}] [INFO] Initializing secure handshake with ERP target platform...`,
      `[${new Date().toLocaleTimeString()}] [INFO] Authenticating credentials via secure OAuth2 token exchange...`
    ];
    setExecutionLogs(initialLogs);

    // Initial throughput history
    setThroughputHistory([
      { sec: '0s', throughput: 0 }
    ]);

    let logCounter = 0;
    const intervalTime = 150; // Milliseconds per progress tick

    const execInterval = setInterval(() => {
      setExecutionProgress(prev => {
        const increment = Math.floor(Math.random() * 5) + 3;
        const nextProgress = Math.min(100, prev + increment);

        // Update processed records matching progress
        const nextRecords = Math.round((nextProgress / 100) * targetCount);
        setProcessedCount(nextRecords);

        // Speed fluctuation
        const speedBase = runningJob.mode === 'Full Inspection' ? 3200 : 1600;
        const speed = Math.floor(speedBase + (Math.random() * 400 - 200));
        setCurrentSpeed(nextProgress === 100 ? 0 : speed);

        // Throughput chart updates every ~1s (when logCounter ticks)
        if (nextProgress % 12 === 0 || nextProgress === 100) {
          setThroughputHistory(hist => {
            const secLabel = `${Math.round((nextProgress / 100) * 10)}s`;
            // Check if label already exists
            if (hist.some(h => h.sec === secLabel)) return hist;
            return [...hist, { sec: secLabel, throughput: nextProgress === 100 ? 0 : speed }];
          });
        }

        // Add periodic logs at key stages
        if (nextProgress >= 15 && prev < 15) {
          setExecutionLogs(logs => [
            ...logs,
            `[${new Date().toLocaleTimeString()}] [SUCCESS] Handshake verified. Channel encrypted with AES-256 GCM.`,
            `[${new Date().toLocaleTimeString()}] [INFO] Executing change-data-capture (CDC) query for entity [${runningJob.targetEntity}]...`,
            `[${new Date().toLocaleTimeString()}] [DATA] Delta tracker identified ${targetCount.toLocaleString()} changes ready to stream.`
          ]);
        }
        else if (nextProgress >= 35 && prev < 35) {
          setExecutionLogs(logs => [
            ...logs,
            `[${new Date().toLocaleTimeString()}] [SYNC] Streaming micro-batches (size=2500) into transfer socket...`,
            `[${new Date().toLocaleTimeString()}] [SYNC] Transferring Batch #01: 2,500 rows - Speed: ${speed.toLocaleString()} rps - Status: OK`,
            `[${new Date().toLocaleTimeString()}] [SYNC] Transferring Batch #02: 2,500 rows - Speed: ${(speed + 150).toLocaleString()} rps - Status: OK`
          ]);
        }
        else if (nextProgress >= 60 && prev < 60) {
          // Occasional warning trigger
          const triggerWarning = Math.random() > 0.3;
          if (triggerWarning) {
            setWarningCount(w => w + 1);
          }
          setExecutionLogs(logs => [
            ...logs,
            `[${new Date().toLocaleTimeString()}] [SYNC] Transferring Batch #03: 2,500 rows - Speed: ${(speed - 100).toLocaleString()} rps - Status: OK`,
            triggerWarning 
              ? `[${new Date().toLocaleTimeString()}] [WARNING] Data truncation safety: Null constraint coerced on column [Status_Flag], Row #${(Math.floor(targetCount * 0.6)).toLocaleString()}`
              : `[${new Date().toLocaleTimeString()}] [INFO] Stream rate verified. Target index alignments matching within threshold.`
          ]);
        }
        else if (nextProgress >= 85 && prev < 85) {
          setExecutionLogs(logs => [
            ...logs,
            `[${new Date().toLocaleTimeString()}] [SYNC] Finalizing last batch transmission...`,
            `[${new Date().toLocaleTimeString()}] [SYNC] Batch #04: Completed successfully. Payload transmitted.`,
            `[${new Date().toLocaleTimeString()}] [INFO] Running target integrity hash checks (SHA-256 checksum sequence)...`
          ]);
        }
        else if (nextProgress === 100) {
          clearInterval(execInterval);
          setTimeout(() => {
            handleExecutionComplete(targetCount);
          }, 800);
        }

        return nextProgress;
      });
    }, intervalTime);

    return () => clearInterval(execInterval);
  }, [runningJobId, runningJob]);

  // Auto scroll terminal logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [executionLogs]);

  const handleExecutionComplete = (totalSynced: number) => {
    if (!runningJob) return;

    // Generate completion audit trail log
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog: AuditLog = {
      id: `a-run-${Date.now()}`,
      timestamp: nowStr,
      user: 'system_cron',
      action: 'MIGRATION_JOB_EXECUTED',
      entity: runningJob.targetEntity,
      status: warningCount > 0 ? 'Warning' : 'Success',
      ipAddress: `10.0.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`
    };

    setAuditLogs(prev => [newLog, ...prev]);
    
    // Update cron job's last run timestamp
    setScheduledJobs(prev => prev.map(j => {
      if (j.id === runningJob.id) {
        // Calculate a dummy next run time (current + 1 hour)
        const nextTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
        return {
          ...j,
          lastRun: nowStr,
          nextRun: nextTime
        };
      }
      return j;
    }));

    // Update global cumulative records count
    setRecordsSyncedToday(prev => prev + totalSynced);

    // Toast and clear execution state
    showToast(
      `Cron job "${runningJob.jobName}" finished! Synced ${totalSynced.toLocaleString()} records (${warningCount} warnings).`,
      warningCount > 0 ? 'info' : 'success'
    );
    
    setIsExecutionFinished(true);
  };

  const closeExecutionModal = () => {
    setRunningJobId(null);
    setRunningJob(null);
    setIsExecutionFinished(false);
  };

  // --- Manual Run Trigger Action ---
  const triggerJobManually = (job: ScheduledJob) => {
    if (runningJobId) {
      showToast('A realtime cron job is already executing. Please wait for it to finish.', 'error');
      return;
    }
    setIsExecutionFinished(false);
    setRunningJob(job);
    setRunningJobId(job.id);
    showToast(`Manually triggering realtime process for "${job.jobName}"...`, 'info');
  };

  // --- Toggle Job Status (Pause/Resume) ---
  const toggleJobStatus = (id: string) => {
    setScheduledJobs(prev => prev.map(job => {
      if (job.id === id) {
        const nextStatus = job.status === 'Active' ? 'Paused' : 'Active';
        showToast(`Job "${job.jobName}" has been ${nextStatus.toLowerCase()}.`);
        return { ...job, status: nextStatus };
      }
      return job;
    }));
  };

  // --- Delete Job Action ---
  const deleteJob = (id: string, name: string) => {
    setScheduledJobs(prev => prev.filter(j => j.id !== id));
    showToast(`Successfully deleted schedule "${name}"`, 'success');
  };

  // --- Open Add / Edit Modal ---
  const openFormModal = (jobToEdit?: ScheduledJob) => {
    if (jobToEdit) {
      setEditingJobId(jobToEdit.id);
      setFormJobName(jobToEdit.jobName);
      setFormCron(jobToEdit.cronExpression);
      setFormMode(jobToEdit.mode);
      setFormTargetEntity(jobToEdit.targetEntity);
      setFormStatus(jobToEdit.status);
    } else {
      setEditingJobId(null);
      setFormJobName('');
      setFormCron('*/10 * * * *');
      setFormMode('Delta Sync');
      setFormTargetEntity('Customers');
      setFormStatus('Active');
    }
    setShowFormModal(true);
  };

  // --- Save / Create Schedule Form Handler ---
  const saveFormSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJobName.trim()) {
      showToast('Please enter a descriptive job name.', 'error');
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const nextTimeStr = new Date(Date.now() + 600 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    if (editingJobId) {
      // Edit mode
      setScheduledJobs(prev => prev.map(j => {
        if (j.id === editingJobId) {
          return {
            ...j,
            jobName: formJobName.trim(),
            cronExpression: formCron,
            mode: formMode,
            targetEntity: formTargetEntity,
            status: formStatus
          };
        }
        return j;
      }));
      showToast(`Successfully updated cron schedule "${formJobName}"`);
    } else {
      // Create mode
      const newJob: ScheduledJob = {
        id: `s-${Date.now()}`,
        jobName: formJobName.trim(),
        cronExpression: formCron,
        mode: formMode,
        targetEntity: formTargetEntity,
        lastRun: 'Never',
        nextRun: formStatus === 'Active' ? nextTimeStr : 'None (Paused)',
        status: formStatus
      };
      setScheduledJobs(prev => [...prev, newJob]);
      showToast(`Created new automated cron schedule "${formJobName}"`);
    }

    setShowFormModal(false);
  };

  // --- Presets Helper ---
  const applyCronPreset = (preset: string) => {
    setFormCron(preset);
  };

  // --- Filtered Lists ---
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = 
        log.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.entity.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.ipAddress.includes(auditSearch);

      const matchesStatus = auditStatusFilter === 'All' || log.status === auditStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [auditLogs, auditSearch, auditStatusFilter]);

  const filteredScheduledJobs = useMemo(() => {
    return scheduledJobs.filter(job => {
      const matchesSearch = 
        job.jobName.toLowerCase().includes(cronSearch.toLowerCase()) ||
        job.cronExpression.includes(cronSearch) ||
        job.mode.toLowerCase().includes(cronSearch.toLowerCase()) ||
        job.targetEntity.toLowerCase().includes(cronSearch.toLowerCase());

      const matchesStatus = cronStatusFilter === 'All' || job.status === cronStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [scheduledJobs, cronSearch, cronStatusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-xl text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white border border-rose-500'
                : toast.type === 'info'
                ? 'bg-slate-900 text-white border border-slate-800'
                : 'bg-emerald-600 text-white border border-emerald-500'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : toast.type === 'info' ? (
              <Activity className="w-4 h-4 shrink-0 animate-pulse text-indigo-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
              Module 28 & 29 – Audit Trail & Cron Job Scheduler
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            System Audit Trail & Cron Job Scheduler
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable user audit logs, security tracking, and automated delta sync cron scheduling.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'audit' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Trail Logs
          </button>
          <button
            onClick={() => setActiveSubTab('scheduler')}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'scheduler' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cron Job Scheduler
          </button>
        </div>
      </div>

      {/* Audit Trail Logs Tab */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          {/* Filters Area */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Search audit events, users, entities, IPs..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-8.5 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="text-slate-500 font-semibold">Event Status:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg font-medium border border-slate-200">
                {(['All', 'Success', 'Warning', 'Failure'] as const).map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setAuditStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                      auditStatusFilter === status ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Immutable System Audit Logs
              </h2>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                {filteredAuditLogs.length} Records Shown
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Action Event</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 font-sans">{log.user}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-indigo-900 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-sans font-medium">{log.entity}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 font-sans ${
                          log.status === 'Success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : log.status === 'Warning'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.status === 'Success' ? 'bg-emerald-500' : log.status === 'Warning' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium">{log.ipAddress}</td>
                    </tr>
                  ))}
                  {filteredAuditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                        No audit events match your search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cron Job Scheduler Tab */}
      {activeSubTab === 'scheduler' && (
        <div className="space-y-6">
          {/* Realtime System Heartbeat HUD */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl text-slate-800 border border-slate-200 shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Cron Engine Status</span>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {heartbeatActive && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="font-extrabold text-sm text-slate-900 font-sans">ONLINE (Heartbeat OK)</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Scheduler CPU load</span>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span className="font-mono font-bold text-sm text-slate-800">{systemLoad}% capacity</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Cron Schedules Status</span>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                <span className="font-extrabold text-sm text-slate-900 font-sans">
                  {scheduledJobs.filter(j => j.status === 'Active').length} Active / {scheduledJobs.length} Total
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Real-time Records Synced</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 animate-bounce" />
                <span className="font-mono font-extrabold text-sm text-emerald-600">
                  {recordsSyncedToday.toLocaleString()} rows
                </span>
              </div>
            </div>
          </div>

          {/* Active Manual Run HUD Overlay */}
          {runningJobId && runningJob && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              {/* Semi-transparent Backdrop overlay that prevents accidental clicks */}
              <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300" 
                onClick={isExecutionFinished ? closeExecutionModal : undefined} 
              />
              <motion.div
                id="active-manual-run-hud"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-10 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl text-slate-800 space-y-5 max-w-4xl w-full max-h-[92vh] overflow-y-auto"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                      <Activity className={`w-5 h-5 ${isExecutionFinished ? '' : 'animate-spin'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 font-mono text-[10px] uppercase font-bold rounded border border-indigo-100">
                          {isExecutionFinished ? 'Execution Complete' : 'Active Job Worker Node'}
                        </span>
                        {warningCount > 0 && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 font-mono text-[10px] uppercase font-bold rounded flex items-center gap-1 border border-amber-100">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> {warningCount} Warning
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 mt-1">{runningJob.jobName}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 font-medium">Progress Rate:</span>
                      <strong className="text-lg font-extrabold font-mono text-indigo-600">{executionProgress}%</strong>
                    </div>
                    {isExecutionFinished && (
                      <button
                        type="button"
                        onClick={closeExecutionModal}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-slate-50"
                        title="Close Monitor"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Real-time stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-extrabold">Transfer Speed</span>
                    <strong className="text-base font-extrabold font-mono text-indigo-600 mt-0.5 block">
                      {currentSpeed > 0 ? `${currentSpeed.toLocaleString()} rows/s` : '0 rps'}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-extrabold">Processed Rows</span>
                    <strong className="text-base font-extrabold font-mono text-slate-900 mt-0.5 block">
                      {processedCount.toLocaleString()} / {targetRecordCount.toLocaleString()}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-extrabold">Sync Format</span>
                    <strong className="text-sm font-extrabold font-mono text-amber-600 mt-1 block">
                      {runningJob.mode}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-extrabold">Entity target</span>
                    <strong className="text-sm font-extrabold font-mono text-emerald-600 mt-1 block">
                      {runningJob.targetEntity}
                    </strong>
                  </div>
                </div>

                {/* Progress animation slider bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-slate-500">
                    <span>Delta sync stream buffer</span>
                    <span>Target: Azure Data Store</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full"
                      animate={{ width: `${executionProgress}%` }}
                      transition={{ ease: 'easeOut', duration: 0.15 }}
                    />
                  </div>
                </div>

                {/* Side-by-side terminal logs & dynamic throughput visualizer */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Real-time console terminal output */}
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 h-56 flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-2 mb-2">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Live Terminal output stream
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase font-mono">Host: cluster-worker-node-04</span>
                    </div>
                    <div className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed text-indigo-300 space-y-1 select-none pr-1">
                      {executionLogs.map((log, idx) => {
                        let colorClass = 'text-slate-300';
                        if (log.includes('[SUCCESS]')) colorClass = 'text-emerald-400 font-semibold';
                        else if (log.includes('[WARNING]')) colorClass = 'text-amber-300 font-semibold';
                        else if (log.includes('[DATA]')) colorClass = 'text-purple-300 font-medium';
                        else if (log.includes('[SYNC]')) colorClass = 'text-sky-300';
                        else if (log.includes('[AUDIT]')) colorClass = 'text-indigo-400';

                        return (
                          <div key={idx} className={colorClass}>
                            {log}
                          </div>
                        );
                      })}
                      <div ref={logsEndRef} />
                    </div>
                  </div>

                  {/* Throughput line graph */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 h-56 flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                      <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                        <Activity className="w-3.5 h-3.5 text-indigo-600" /> Ingestion Speed (rps)
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-mono">Real-time: 500ms</span>
                    </div>
                    <div className="flex-1 h-36">
                      {throughputHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={throughputHistory} margin={{ top: 10, right: 10, left: -20, bottom: -5 }}>
                            <defs>
                              <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="sec" fontSize={9} tickLine={false} stroke="#64748b" />
                            <YAxis fontSize={9} tickLine={false} axisLine={false} stroke="#64748b" />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b', fontSize: '10px' }}
                            />
                            <Area type="monotone" dataKey="throughput" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorThroughput)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 font-mono text-[10px]">
                          Waiting for throughput telemetry...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isExecutionFinished && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-emerald-800">Execution Stream Finalized</h4>
                        <p className="text-[11px] text-emerald-700">All data verified, target queues aligned, and checksum sequence confirmed successfully.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closeExecutionModal}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm shrink-0"
                    >
                      Dismiss Monitor
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Cron Jobs Control List & Filter bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Automated Cron Job Schedules</h2>
                <p className="text-xs text-slate-500 mt-0.5">Automate and control background change data capture sync routines.</p>
              </div>

              <button
                type="button"
                onClick={() => openFormModal()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Cron Sync</span>
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Filter cron jobs, expressions, target entities..."
                  value={cronSearch}
                  onChange={(e) => setCronSearch(e.target.value)}
                  className="w-full pl-8.5 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-500 font-semibold">Job State:</span>
                <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 font-semibold">
                  {(['All', 'Active', 'Paused'] as const).map(state => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => setCronStatusFilter(state)}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                        cronStatusFilter === state ? 'bg-slate-100 text-indigo-700 font-bold border border-slate-200/40' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Jobs List */}
            <div className="space-y-3">
              {filteredScheduledJobs.map((job) => {
                const isExecuting = runningJobId === job.id;
                const isPaused = job.status === 'Paused';

                return (
                  <div
                    key={job.id}
                    className={`p-4 rounded-xl border text-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
                      isExecuting
                        ? 'bg-indigo-50/40 border-indigo-300 shadow-2xs'
                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-slate-300' : 'bg-emerald-500 animate-pulse'}`} />
                        <h4 className="font-bold text-slate-900 text-sm">{job.jobName}</h4>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-500 font-mono text-[11px]">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded flex items-center gap-1 border border-indigo-100">
                          <Clock className="w-3 h-3" /> Cron: {job.cronExpression}
                        </span>
                        <span className="flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-slate-400" /> Mode: <strong>{job.mode}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-slate-600 font-bold font-sans">
                          <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Target: <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{job.targetEntity}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 lg:text-right font-mono text-[11px] text-slate-500 shrink-0">
                      <div>
                        <div>Last Run: <span className="text-slate-700 font-medium">{job.lastRun}</span></div>
                        <div className="text-indigo-600 font-bold flex items-center gap-1 justify-end mt-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Next Scheduled Run: {job.nextRun}
                        </div>
                      </div>

                      {/* Controls toolbar */}
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200/80">
                        {/* Execute manually button */}
                        <button
                          type="button"
                          onClick={() => triggerJobManually(job)}
                          disabled={isExecuting || isPaused}
                          title={isPaused ? 'Cannot run a paused schedule' : 'Run this schedule manually now'}
                          className={`p-1.5 rounded-md cursor-pointer transition-colors flex items-center gap-1 ${
                            isExecuting
                              ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed'
                              : isPaused
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-indigo-600" />
                          <span className="text-[10px] uppercase font-bold tracking-wide pr-1">Trigger</span>
                        </button>

                        {/* Pause / Resume button */}
                        <button
                          type="button"
                          onClick={() => toggleJobStatus(job.id)}
                          title={isPaused ? 'Resume sync schedule' : 'Pause sync schedule'}
                          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                            isPaused 
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => openFormModal(job)}
                          title="Edit this schedule configuration"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => deleteJob(job.id, job.jobName)}
                          title="Delete schedule"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredScheduledJobs.length === 0 && (
                <div className="py-8 text-center text-slate-400 font-sans text-xs">
                  No automated cron job schedules match the search filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save / Edit Schedule Form Modal */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingJobId ? 'Edit Automated Cron Schedule' : 'Schedule New Automated Cron Sync'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={saveFormSchedule} className="space-y-4 text-xs font-sans">
                {/* Job Name */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold block">Descriptive Job Name</label>
                  <input
                    type="text"
                    value={formJobName}
                    onChange={(e) => setFormJobName(e.target.value)}
                    placeholder="e.g., Nightly SAP to Business Central Customer Sync"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Sync Mode */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-semibold block">Execution Sync Mode</label>
                    <select
                      value={formMode}
                      onChange={(e) => setFormMode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Delta Sync">Delta Sync (CDC)</option>
                      <option value="Incremental">Incremental Ingestion</option>
                      <option value="Full Inspection">Full Inspection Sweep</option>
                      <option value="Real-Time Micro-Batch">Real-Time Micro-Batch</option>
                    </select>
                  </div>

                  {/* Target Entity */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-semibold block">Target Entity Schema</label>
                    <select
                      value={formTargetEntity}
                      onChange={(e) => setFormTargetEntity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {MOCK_CONNECTORS.map((connector) => (
                        <option key={connector.id} value={connector.name}>
                          {connector.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cron Expression */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold block flex justify-between">
                    <span>Standard Cron Expression</span>
                    <span className="text-[10px] text-indigo-600 font-mono">Format: min hour day month weekday</span>
                  </label>
                  <input
                    type="text"
                    value={formCron}
                    onChange={(e) => setFormCron(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-mono font-bold tracking-wide focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => applyCronPreset('*/5 * * * *')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-mono text-slate-600 cursor-pointer"
                    >
                      */5 min
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCronPreset('0 * * * *')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-mono text-slate-600 cursor-pointer"
                    >
                      Hourly
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCronPreset('0 0 * * *')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-mono text-slate-600 cursor-pointer"
                    >
                      Daily Midnight
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCronPreset('0 0 * * 0')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-mono text-slate-600 cursor-pointer"
                    >
                      Weekly Sun
                    </button>
                  </div>
                </div>

                {/* Job State */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold block">Initial Job Status</label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="formStatus"
                        checked={formStatus === 'Active'}
                        onChange={() => setFormStatus('Active')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Active (Auto Trigger)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="formStatus"
                        checked={formStatus === 'Paused'}
                        onChange={() => setFormStatus('Paused')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Paused (Manual Only)</span>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{editingJobId ? 'Apply Schedule' : 'Create Sync Schedule'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
