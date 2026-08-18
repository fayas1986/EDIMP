import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Connector, MigrationJob, RetryPolicy } from '../types';
import { RetryPolicyConfigurator, DEFAULT_RETRY_POLICY } from './RetryPolicyConfigurator';
import { MigrationTimeline } from './MigrationTimeline';
import { ActivityStream } from './ActivityStream';
import { RecentActivityFeed } from './RecentActivityFeed';
import { DataThroughputChart } from './DataThroughputChart';
import { SyncAnomalyTrendAlertsWidget } from './SyncAnomalyTrendAlertsWidget';
import { PipelineErrorLatencyHeatmapWidget } from './PipelineErrorLatencyHeatmapWidget';
import { ConnectorComparisonModal } from './ConnectorComparisonModal';
import {
  Activity,
  Database,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ArrowRight,
  TrendingUp,
  LineChart,
  Clock,
  Calendar,
  Server,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  Building2,
  Users,
  RotateCcw,
  Sliders,
  X,
  Terminal,
  Trash2,
  RefreshCw,
  Radio,
  GitCompare,
} from 'lucide-react';

interface DashboardViewProps {
  connectors: Connector[];
  jobs: MigrationJob[];
  onNavigateTab: (tab: string) => void;
  onToggleJobStatus: (jobId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  connectors,
  jobs,
  onNavigateTab,
  onToggleJobStatus,
}) => {
  const [selectedJobForRetryPolicy, setSelectedJobForRetryPolicy] = useState<MigrationJob | null>(null);
  const [activeJobPolicies, setActiveJobPolicies] = useState<Record<string, RetryPolicy>>({});

  // Connector Comparison Modal state
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [comparisonConnectorAId, setComparisonConnectorAId] = useState<string | undefined>(undefined);
  const [comparisonConnectorBId, setComparisonConnectorBId] = useState<string | undefined>(undefined);

  const handleOpenComparison = (connAId?: string, connBId?: string) => {
    setComparisonConnectorAId(connAId);
    setComparisonConnectorBId(connBId);
    setIsComparisonModalOpen(true);
  };

  // Real-time polling & auto-refresh state for Dashboard widgets (Heatmap & Trend alerts)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState<number>(30);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(30);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [refreshTriggerTimestamp, setRefreshTriggerTimestamp] = useState<number>(Date.now());
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);

  // Auto-refresh countdown timer effect
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          // Trigger polling pulse
          setLastRefreshedAt(new Date());
          setRefreshTriggerTimestamp(Date.now());
          return refreshIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, refreshIntervalSeconds]);

  // When interval duration changes, sync the countdown
  const handleIntervalChange = (seconds: number) => {
    setRefreshIntervalSeconds(seconds);
    setCountdownSeconds(seconds);
  };

  const handleManualRefreshAll = () => {
    setIsManualRefreshing(true);
    setLastRefreshedAt(new Date());
    setRefreshTriggerTimestamp(Date.now());
    setCountdownSeconds(refreshIntervalSeconds);
    setTimeout(() => {
      setIsManualRefreshing(false);
    }, 600);
  };

  const activeConnectors = connectors.filter((c) => c.status === 'Connected');
  
  const jobsWithHistory = jobs.filter(job => {
    if (job.status !== 'Completed') return true;
    if (!job.endTime) return true;
    
    try {
      const end = new Date(job.endTime.replace(' ', 'T')).getTime();
      const now = new Date().getTime();
      const diffInHours = (now - end) / (1000 * 60 * 60);
      // Keep completed tasks for a week (7 days = 168 hours)
      return diffInHours < 168;
    } catch (e) {
      return true;
    }
  });

  const activePipelinesJobs = jobsWithHistory.filter(j => j.status !== 'Completed');
  const runningJobs = activePipelinesJobs.filter((j) => j.status === 'Running');
  const totalProcessed = jobs.reduce((acc, j) => acc + j.processedRecords, 0);
  const totalErrors = jobs.reduce((acc, j) => acc + j.errorCount, 0);

  const getJobRetryPolicy = (jobId: string): RetryPolicy => {
    return activeJobPolicies[jobId] || DEFAULT_RETRY_POLICY;
  };

  const handleSaveJobRetryPolicy = (updated: RetryPolicy) => {
    if (selectedJobForRetryPolicy) {
      setActiveJobPolicies((prev) => ({
        ...prev,
        [selectedJobForRetryPolicy.id]: updated,
      }));
    }
  };

  // Real-time log terminal state
  const [logs, setLogs] = useState<{ id: string; timestamp: string; type: 'info' | 'warning' | 'error'; message: string; pipeline: string }[]>(() => [
    { id: '1', timestamp: new Date(Date.now() - 30000).toLocaleTimeString(), type: 'info', message: 'Engine cluster successfully initialized on port 3000.', pipeline: 'System' },
    { id: '2', timestamp: new Date(Date.now() - 25000).toLocaleTimeString(), type: 'info', message: 'Established highly concurrent connection pool for Dynamics 365 BC.', pipeline: 'System' },
    { id: '3', timestamp: new Date(Date.now() - 15000).toLocaleTimeString(), type: 'warning', message: 'Slight latency spike detected on SAP S/4HANA (65ms). Auto-adjusting window.', pipeline: 'SAP to BC' },
    { id: '4', timestamp: new Date(Date.now() - 5000).toLocaleTimeString(), type: 'info', message: 'Migration checkpoint saved for Customer Master - Legacy SQL to BC.', pipeline: 'Legacy SQL to BC' },
  ]);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [isLogPaused, setIsLogPaused] = useState(false);

  // Background real-time log generator
  useEffect(() => {
    if (isLogPaused || runningJobs.length === 0) return;

    const interval = setInterval(() => {
      const activeJob = runningJobs[Math.floor(Math.random() * runningJobs.length)];
      const logTypes: ('info' | 'warning' | 'error')[] = ['info', 'info', 'info', 'warning', 'info', 'info', 'error'];
      const chosenType = logTypes[Math.floor(Math.random() * logTypes.length)];
      
      let msg = '';
      if (chosenType === 'info') {
        const processedBatch = Math.floor(Math.random() * 50) + 10;
        const batches = [
          `Batch #${Math.floor(Math.random() * 400) + 100} committed successfully: ${processedBatch} rows synced.`,
          `Validated and mapped target schema keys with 100% data fidelity.`,
          `Synchronized records to ${activeJob.destConnectorName} endpoint.`,
          `Handoff completed to worker thread #${Math.floor(Math.random() * 8) + 1}.`,
          `Throughput rate balanced at ${activeJob.throughputRps} RPS.`
        ];
        msg = batches[Math.floor(Math.random() * batches.length)];
      } else if (chosenType === 'warning') {
        const warnings = [
          `Minor truncation: Customer phone number parsed without international prefix.`,
          `Billing address for entity missing Postal Code. Retrying with fallback postal lookup.`,
          `API rate warning: Approaching 85% limit of Business Central burst pool. Sleeping 50ms.`
        ];
        msg = warnings[Math.floor(Math.random() * warnings.length)];
      } else {
        const errors = [
          `Row integrity fault: Tax Registration No validation rejected. Row skipped.`,
          `Connection timed out to ${activeJob.destConnectorName}. Auto-retry triggered (Backoff: 2s).`,
          `Lookup constraint failed on Payment Terms Code reference.`
        ];
        msg = errors[Math.floor(Math.random() * errors.length)];
      }

      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: chosenType,
        message: msg,
        pipeline: activeJob.jobName.split(' - ')[0],
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 49)]); // Keep latest 50 logs
    }, 3000);

  

    return () => clearInterval(interval);
  }, [runningJobs, isLogPaused]);

  

  // Linear Regression Forecast
  const calculatePrediction = (job: MigrationJob) => {
    if (job.status !== "Running" || job.throughputRps <= 0) return null;
    const remainingRecords = job.totalRecords - job.processedRecords;
    if (remainingRecords <= 0) return null;
    const remainingSeconds = remainingRecords / job.throughputRps;
    const completionDate = new Date(Date.now() + remainingSeconds * 1000);
    
    let bottleneck = "None";
    let bottleneckSeverity = "low";
    if (job.throughputRps < 50) {
      bottleneck = "API Rate Limit (Source)";
      bottleneckSeverity = "high";
    } else if (job.throughputRps < 200) {
      bottleneck = "Database IO / Network Latency";
      bottleneckSeverity = "medium";
    } else if (job.errorCount > 100) {
      bottleneck = "Data Validation Errors";
      bottleneckSeverity = "high";
    }
    
    return {
      completionDate,
      remainingSeconds,
      bottleneck,
      bottleneckSeverity
    };
  };
  
  const predictedJobs = activePipelinesJobs.map(job => ({ job, prediction: calculatePrediction(job) })).filter(item => item.prediction !== null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Welcome Banner with Quick Launch & Real-time Auto-refresh Control */}
      <div id="dash-welcome-banner" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="z-10">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="bg-emerald-50 text-emerald-700 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-3xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              EDIMP Engine Operational
            </span>
            <span className="text-slate-400 text-[11px] font-mono">Tenant: Acme Corp - Global ERP Migration</span>
          </div>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Enterprise Migration Control Center
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed font-medium">
            Real-time telemetry, parallel job orchestration, AI auto-mapping, and multi-system data synchronization monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            id="dash-quick-wizard-btn"
            onClick={() => onNavigateTab('wizard')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-current" />
            <span>New Migration Wizard</span>
          </button>
        </div>
      </div>

      {/* Enterprise KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Records Processed */}
        <div id="kpi-total-processed-card" className="stat-card-elevated p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Migrated Records</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {totalProcessed.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>+14,250 records last hour</span>
          </div>
        </div>

        {/* KPI 2: AI Data Quality Score */}
        <div id="kpi-quality-score-card" className="stat-card-elevated p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">AI Data Quality Score</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">92.4%</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Grade A+
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-bold">Evaluated across 13 core entities</p>
        </div>

        {/* KPI 3: Connected Systems */}
        <div id="kpi-active-connectors-card" className="stat-card-elevated p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Connected Systems</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {activeConnectors.length} / {connectors.length}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <Server className="w-3 h-3 text-emerald-500" />
            <span>Avg Latency: 34ms</span>
          </div>
        </div>

        {/* KPI 4: Parallel Processing Rate */}
        <div id="kpi-throughput-card" className="stat-card-elevated p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Processing Throughput</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {runningJobs.length > 0 ? runningJobs.reduce((acc, j) => acc + (j.throughputRps || 0), 0).toLocaleString() : 0} <span className="text-xs font-normal text-slate-500">rec/sec</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <span className={`w-2 h-2 rounded-full ${runningJobs.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
            <span>{runningJobs.length > 0 ? runningJobs.length * 4 : 0} Active Parallel Workers</span>
          </div>
        </div>
      </div>

      {/* Horizontal Interactive Timeline Summary */}
      <MigrationTimeline
        jobs={jobsWithHistory}
        onToggleJobStatus={onToggleJobStatus}
        onNavigateTab={onNavigateTab}
      />

      <DataThroughputChart />

      {/* Automated Sync Anomaly & Throughput Trend Alerts Widget */}
      <SyncAnomalyTrendAlertsWidget
        jobs={jobs}
        onNavigateTab={onNavigateTab}
        autoRefreshEnabled={autoRefreshEnabled}
        refreshIntervalSeconds={refreshIntervalSeconds}
        refreshTriggerTimestamp={refreshTriggerTimestamp}
      />

      {/* Visual Heatmap Widget for Connectors and Migration Pipelines (Error Rates & Latency Drilldown) */}
      <PipelineErrorLatencyHeatmapWidget
        connectors={connectors}
        jobs={jobs}
        onNavigateTab={onNavigateTab}
        autoRefreshEnabled={autoRefreshEnabled}
        refreshIntervalSeconds={refreshIntervalSeconds}
        refreshTriggerTimestamp={refreshTriggerTimestamp}
      />

      {/* Main Section: Active Migration Jobs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Active Migration Pipelines & Batch Jobs
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Live state, chunk processing telemetry, and real-time error counts.
            </p>
          </div>
          <button
            id="dash-view-all-jobs-btn"
            onClick={() => onNavigateTab('wizard')}
            className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1"
          >
            <span>Launch Wizard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Pipeline Job Name</th>
                <th className="py-3 px-4">Source System</th>
                <th className="py-3 px-4">Destination ERP</th>
                <th className="py-3 px-4">Retry Policy</th>
                <th className="py-3 px-4">Progress & Status</th>
                <th className="py-3 px-4 text-right">Processed / Total</th>
                <th className="py-3 px-4 text-center">Errors</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {activePipelinesJobs.map((job) => {
                const isRunning = job.status === 'Running';
                const jobPolicy = getJobRetryPolicy(job.id);
  

                return (
                  <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          job.status === 'Running' ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'
                        }`} />
                        <span>{job.jobName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700 border border-slate-200">
                        {job.sourceConnectorName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 bg-indigo-50 rounded text-[11px] font-medium text-indigo-700 border border-indigo-100">
                        {job.destConnectorName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <button
                        onClick={() => setSelectedJobForRetryPolicy(job)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all font-bold cursor-pointer"
                        title="Click to configure job retry policy & backoff strategy"
                      >
                        <RotateCcw className="w-3 h-3 text-indigo-600" />
                        <span>{jobPolicy.maxRetries}x Retries ({jobPolicy.backoffStrategy === 'ExponentialWithJitter' ? 'Jitter' : jobPolicy.backoffStrategy})</span>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-600">
                          <span>{job.status}</span>
                          <span>{job.progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                          <motion.div
                            className={`h-full rounded-full relative ${
                              job.status === 'Running'
                                ? 'bg-indigo-600'
                                : job.status === 'Completed'
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progressPct}%` }}
                            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                          >
                            {job.status === 'Running' && (
                              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] bg-[length:200%_100%] animate-pulse" />
                            )}
                          </motion.div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800">
                      {job.processedRecords.toLocaleString()} / {job.totalRecords.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {job.errorCount > 0 ? (
                        <button
                          onClick={() => onNavigateTab('error-center')}
                          className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[11px] font-bold border border-rose-200 hover:bg-rose-100 transition-colors"
                        >
                          {job.errorCount} Errors
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px] flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 0
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedJobForRetryPolicy(job)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                        title="Configure Retry Policy"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleJobStatus(job.id)}
                        className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
                          isRunning
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title={isRunning ? 'Pause Job' : 'Resume Job'}
                      >
                        {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Future Load Prediction & Bottleneck Analysis */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <LineChart className="w-4 h-4 text-indigo-600" />
              Future Load Prediction & Bottleneck Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Forecasted completion times and resource bottleneck indicators based on linear regression of real-time throughput data.
            </p>
          </div>
        </div>
        
        {predictedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictedJobs.map(({ job, prediction }) => (
              <div key={job.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{job.jobName}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-mono text-slate-600">
                      Est. Completion: <span className="font-bold text-indigo-700">{prediction?.completionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-mono text-slate-600">
                      Date: {prediction?.completionDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Predicted Bottleneck</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      prediction?.bottleneckSeverity === 'high' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      prediction?.bottleneckSeverity === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {prediction?.bottleneck}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50">
            <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No active load predictions</p>
            <p className="text-xs text-slate-400 mt-1">Predictions will appear here once migration jobs begin processing.</p>
          </div>
        )}
      </div>

      {/* Connected Systems Health Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Connected Enterprise Source & Destination Systems
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, connection authentication protocol, and ping latency metrics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="dash-compare-connectors-btn"
              onClick={() => handleOpenComparison()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-all cursor-pointer shadow-2xs"
              title="Open Universal Connector Comparison Engine"
            >
              <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Compare Connectors</span>
            </button>
            <button
              id="dash-manage-connectors-btn"
              onClick={() => onNavigateTab('connectors')}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Manage Connectors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {connectors.slice(0, 6).map((conn) => (
            <div
              key={conn.id}
              onClick={() => handleOpenComparison(conn.id)}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-start gap-3 cursor-pointer group"
              title={`Click to compare ${conn.name}`}
            >
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 group-hover:bg-indigo-100 transition-colors">
                <Database className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{conn.name}</h3>
                  <div className="flex items-center gap-1">
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-600 font-semibold transition-opacity flex items-center gap-0.5">
                      <GitCompare className="w-3 h-3" />
                      <span>Compare</span>
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                  <span className="font-medium text-slate-700">{conn.provider}</span>
                  <span>•</span>
                  <span>{conn.authType}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                  <span>Latency: {conn.latencyMs}ms</span>
                  <span>{conn.systemType}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-Time Recent Platform Activity Feed */}
      <RecentActivityFeed onNavigateTab={onNavigateTab} />

      {/* Real-Time System Events & Manual Intervention Stream */}
      <ActivityStream onNavigateTab={onNavigateTab} />

      {/* Live Engine Telemetry & Log Stream Terminal */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Live Data Integration Telemetry Feed
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${runningJobs.length > 0 ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${runningJobs.length > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic execution flow, payload assertions, and network connection pings.
              </p>
            </div>
          </div>

          {/* Action buttons & filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter Tabs */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['all', 'info', 'warning', 'error'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLogFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    logFilter === lvl
                      ? 'bg-white text-indigo-600 font-extrabold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Clear logs */}
            <button
              onClick={() => setLogs([])}
              className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl border border-slate-200 hover:border-rose-200 transition-all text-slate-500 cursor-pointer"
              title="Clear Terminal Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Pause/Resume logs */}
            <button
              onClick={() => setIsLogPaused(!isLogPaused)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                isLogPaused
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isLogPaused ? 'Resume Feed' : 'Pause Feed'}
            </button>
          </div>
        </div>

        {/* Dynamic Log Lines Console */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 h-52 overflow-y-auto p-4 space-y-2.5 text-[11px] leading-relaxed font-mono select-all shadow-inner text-slate-800">
          {logs.filter(log => logFilter === 'all' || log.type === logFilter).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 font-sans py-8">
              <Terminal className="w-8 h-8 text-slate-300 animate-pulse" />
              <p className="text-xs font-semibold text-slate-500">No matching logs in terminal buffer.</p>
              <p className="text-[10px] text-slate-400">Start some migration pipelines or resume feed to stream operations.</p>
            </div>
          ) : (
            logs
              .filter(log => logFilter === 'all' || log.type === logFilter)
              .map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-100/70 py-0.5 px-1 rounded transition-colors">
                  <span className="text-slate-400 font-bold shrink-0">{log.timestamp}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase shrink-0 ${
                    log.type === 'error'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : log.type === 'warning'
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-emerald-700 font-bold shrink-0 text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    [{log.pipeline}]
                  </span>
                  <span className="text-slate-700 font-medium whitespace-pre-wrap">{log.message}</span>
                </div>
              ))
          )}
        </div>

        {/* Real-Time Status & Throughput Readout */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 gap-2 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${runningJobs.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>Engine Cluster: <strong className="text-slate-900 font-bold">{runningJobs.length > 0 ? 'ACTIVE_SYNC' : 'IDLE'}</strong></span>
            </span>
            <span>•</span>
            <span>Active Pipelines: <strong className="text-slate-900 font-bold">{runningJobs.length}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span>Buffer Load: <strong className="text-slate-900 font-bold">{runningJobs.length > 0 ? '14.2%' : '0%'}</strong></span>
            <span>•</span>
            <span>Est Loss Rate: <strong className="text-emerald-600 font-bold">0.0000%</strong></span>
          </div>
        </div>
      </div>

      {/* Retry Policy Configuration Modal */}
      {selectedJobForRetryPolicy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-4 p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded border border-indigo-100">
                    Job ID: {selectedJobForRetryPolicy.id}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {selectedJobForRetryPolicy.sourceConnectorName} → {selectedJobForRetryPolicy.destConnectorName}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-indigo-600" />
                  Configure Retry Policy: {selectedJobForRetryPolicy.jobName}
                </h2>
              </div>

              <button
                onClick={() => setSelectedJobForRetryPolicy(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <RetryPolicyConfigurator
              policy={getJobRetryPolicy(selectedJobForRetryPolicy.id)}
              onChange={handleSaveJobRetryPolicy}
            />

            <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
              <button
                onClick={() => setSelectedJobForRetryPolicy(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
              >
                Close & Save Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Connector Comparison Modal */}
      <ConnectorComparisonModal
        connectors={connectors}
        initialConnectorAId={comparisonConnectorAId}
        initialConnectorBId={comparisonConnectorBId}
        isOpen={isComparisonModalOpen}
        onClose={() => {
          setIsComparisonModalOpen(false);
          setComparisonConnectorAId(undefined);
          setComparisonConnectorBId(undefined);
        }}
        onSelectConnectorForDetails={(conn) => {
          onNavigateTab('connectors');
        }}
      />
    </div>
  );
};
