import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Zap,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Sliders,
  Database,
  Layers,
  Flame,
  Radio,
  X,
  ArrowRight,
  ShieldCheck,
  Clock,
  Gauge,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { MigrationJob } from '../types';

export type AnomalyType = 'throughput_dip' | 'data_spike' | 'error_surge' | 'latency_spike' | 'payload_bloat';
export type AnomalySeverity = 'critical' | 'warning' | 'info' | 'resolved';

export interface SyncAnomalyAlert {
  id: string;
  pipelineId: string;
  pipelineName: string;
  sourceSystem: string;
  destSystem: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  detectedAt: string;
  timestamp: number;
  baselineValue: string;
  observedValue: string;
  variancePercentage: number;
  confidenceScore: number;
  rootCause: string;
  recommendedAction: string;
  actionLabel: string;
  status: 'active' | 'mitigating' | 'resolved' | 'dismissed';
  trendData: { time: string; baseline: number; actual: number; threshold: number }[];
}

const INITIAL_ALERTS: SyncAnomalyAlert[] = [
  {
    id: 'alt-001',
    pipelineId: 'job-1',
    pipelineName: 'SAP ECC to Dynamics 365 BC',
    sourceSystem: 'SAP ECC (Production)',
    destSystem: 'Microsoft Dynamics 365 BC',
    type: 'throughput_dip',
    severity: 'critical',
    title: 'Severe Throughput Dip Detected (-78.4%)',
    description: 'Ingestion speed suddenly plummeted from 1,240 rec/s down to 268 rec/s over a 90-second rolling window.',
    detectedAt: '2 mins ago',
    timestamp: Date.now() - 120000,
    baselineValue: '1,240 rec/s',
    observedValue: '268 rec/s',
    variancePercentage: -78.4,
    confidenceScore: 98.2,
    rootCause: 'Target ERP API connection pool exhaustion with HTTP 429 burst rate-limiting on Customer Ledger Entries table.',
    recommendedAction: 'Engage adaptive exponential jitter backoff and scale destination connection pool from 16 to 48 workers.',
    actionLabel: 'Auto-Scale Connection Pool & Jitter',
    status: 'active',
    trendData: [
      { time: 'T-10m', baseline: 1200, actual: 1210, threshold: 800 },
      { time: 'T-8m', baseline: 1220, actual: 1240, threshold: 800 },
      { time: 'T-6m', baseline: 1240, actual: 1250, threshold: 800 },
      { time: 'T-4m', baseline: 1230, actual: 920, threshold: 800 },
      { time: 'T-2m', baseline: 1240, actual: 340, threshold: 800 },
      { time: 'Now', baseline: 1240, actual: 268, threshold: 800 },
    ],
  },
  {
    id: 'alt-002',
    pipelineId: 'job-2',
    pipelineName: 'Salesforce CRM to Dataverse',
    sourceSystem: 'Salesforce Enterprise',
    destSystem: 'Microsoft Dataverse',
    type: 'data_spike',
    severity: 'warning',
    title: 'Anomalous Data Ingestion Spike (+380%)',
    description: 'Unusual transaction volume burst detected in CDC change-log stream (6,400 rec/s vs normal 1,330 rec/s).',
    detectedAt: '6 mins ago',
    timestamp: Date.now() - 360000,
    baselineValue: '1,330 rec/s',
    observedValue: '6,400 rec/s',
    variancePercentage: +381.2,
    confidenceScore: 96.5,
    rootCause: 'Source CRM batch Opportunity update triggered unexpected cascading webhook flood into CDC sync queues.',
    recommendedAction: 'Expand partition queue buffer ring to 512 MB and enable elastic micro-batching to prevent memory spill.',
    actionLabel: 'Activate Elastic Micro-Batching',
    status: 'active',
    trendData: [
      { time: 'T-12m', baseline: 1300, actual: 1320, threshold: 2500 },
      { time: 'T-10m', baseline: 1320, actual: 1350, threshold: 2500 },
      { time: 'T-8m', baseline: 1340, actual: 1410, threshold: 2500 },
      { time: 'T-6m', baseline: 1330, actual: 4800, threshold: 2500 },
      { time: 'T-4m', baseline: 1330, actual: 6100, threshold: 2500 },
      { time: 'Now', baseline: 1330, actual: 6400, threshold: 2500 },
    ],
  },
  {
    id: 'alt-003',
    pipelineId: 'job-3',
    pipelineName: 'Snowflake Analytics to Fabric OneLake',
    sourceSystem: 'Snowflake Enterprise',
    destSystem: 'Microsoft Fabric OneLake',
    type: 'error_surge',
    severity: 'warning',
    title: 'Schema Coercion Error Rate Surge (+12.4%)',
    description: 'Transformation failure frequency crossed 3-sigma statistical threshold on nested JSON variant columns.',
    detectedAt: '14 mins ago',
    timestamp: Date.now() - 840000,
    baselineValue: '0.08% Errors',
    observedValue: '12.48% Errors',
    variancePercentage: +1550.0,
    confidenceScore: 99.1,
    rootCause: 'Unannounced upstream schema mutation in Snowflake staging view introduced ISO8601 millisecond timestamp offsets.',
    recommendedAction: 'Hot-apply dynamic ISO timestamp regex coercion rule across worker pipelines without restarting job.',
    actionLabel: 'Apply Live Schema Coercion Patch',
    status: 'active',
    trendData: [
      { time: 'T-15m', baseline: 10, actual: 12, threshold: 50 },
      { time: 'T-12m', baseline: 10, actual: 14, threshold: 50 },
      { time: 'T-9m', baseline: 11, actual: 18, threshold: 50 },
      { time: 'T-6m', baseline: 11, actual: 290, threshold: 50 },
      { time: 'T-3m', baseline: 10, actual: 640, threshold: 50 },
      { time: 'Now', baseline: 10, actual: 820, threshold: 50 },
    ],
  },
  {
    id: 'alt-004',
    pipelineId: 'job-4',
    pipelineName: 'Oracle EBS to Dynamics 365 F&O',
    sourceSystem: 'Oracle EBS (General Ledger)',
    destSystem: 'Microsoft Dynamics 365 F&O',
    type: 'latency_spike',
    severity: 'resolved',
    title: 'Source Read Latency Spike Recovered',
    description: 'Database lock wait timeouts reduced back to baseline (28ms) following automatic dead-lock resolver cycle.',
    detectedAt: '28 mins ago',
    timestamp: Date.now() - 1680000,
    baselineValue: '32ms Ping',
    observedValue: '480ms Ping',
    variancePercentage: +1400.0,
    confidenceScore: 94.0,
    rootCause: 'Oracle table lock contention during concurrent nocturnal snapshot export.',
    recommendedAction: 'Auto-tuned read isolation to Read Committed with row-level locks.',
    actionLabel: 'Auto-Resolved',
    status: 'resolved',
    trendData: [
      { time: 'T-30m', baseline: 30, actual: 32, threshold: 150 },
      { time: 'T-25m', baseline: 32, actual: 480, threshold: 150 },
      { time: 'T-20m', baseline: 31, actual: 410, threshold: 150 },
      { time: 'T-15m', baseline: 32, actual: 120, threshold: 150 },
      { time: 'T-10m', baseline: 30, actual: 38, threshold: 150 },
      { time: 'Now', baseline: 30, actual: 28, threshold: 150 },
    ],
  },
];

interface SyncAnomalyTrendAlertsWidgetProps {
  jobs?: MigrationJob[];
  onNavigateTab?: (tab: string) => void;
  autoRefreshEnabled?: boolean;
  refreshIntervalSeconds?: number;
  refreshTriggerTimestamp?: number;
}

export const SyncAnomalyTrendAlertsWidget: React.FC<SyncAnomalyTrendAlertsWidgetProps> = ({
  jobs = [],
  onNavigateTab,
  autoRefreshEnabled: parentAutoRefreshEnabled,
  refreshIntervalSeconds: parentRefreshIntervalSeconds,
  refreshTriggerTimestamp: parentRefreshTriggerTimestamp,
}) => {
  const [alerts, setAlerts] = useState<SyncAnomalyAlert[]>(INITIAL_ALERTS);
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'throughput' | 'spikes' | 'errors' | 'resolved'>('all');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>('alt-001');
  const [isSimulatingSpike, setIsSimulatingSpike] = useState(false);
  const [isSimulatingDip, setIsSimulatingDip] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string } | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toLocaleTimeString());

  const localAutoRefresh = true;
  const localIntervalSeconds = 30;
  const isAutoRefreshActive = parentAutoRefreshEnabled !== undefined ? parentAutoRefreshEnabled : localAutoRefresh;
  const activeInterval = parentRefreshIntervalSeconds !== undefined ? parentRefreshIntervalSeconds : localIntervalSeconds;

  // Poll / refresh alerts telemetry
  const handleAutoRefreshAlerts = () => {
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.status !== 'active') return alert;
        // Minor dynamic trend jitter for live telemetry
        const jitterVariance = +(alert.variancePercentage + (Math.random() * 2 - 1)).toFixed(1);
        const lastVal = alert.trendData[alert.trendData.length - 1];
        const newActual = Math.max(10, Math.round(lastVal.actual + (Math.random() * 60 - 30)));
        const newTrendData = [
          ...alert.trendData.slice(1),
          { ...lastVal, actual: newActual, time: 'Now' },
        ];

        return {
          ...alert,
          variancePercentage: jitterVariance,
          trendData: newTrendData,
        };
      })
    );
    setLastRefreshedAt(new Date().toLocaleTimeString());
  };

  // Synchronize with parent polling pulses
  useEffect(() => {
    if (parentRefreshTriggerTimestamp) {
      handleAutoRefreshAlerts();
    }
  }, [parentRefreshTriggerTimestamp]);

  // Standalone polling fallback
  useEffect(() => {
    if (parentRefreshTriggerTimestamp !== undefined) return;
    if (!isAutoRefreshActive) return;

    const intervalId = setInterval(() => {
      handleAutoRefreshAlerts();
    }, activeInterval * 1000);

    return () => clearInterval(intervalId);
  }, [isAutoRefreshActive, activeInterval, parentRefreshTriggerTimestamp]);

  // Active statistics
  const activeAlerts = useMemo(() => alerts.filter((a) => a.status === 'active'), [alerts]);
  const criticalCount = useMemo(() => alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length, [alerts]);
  const warningCount = useMemo(() => alerts.filter((a) => a.severity === 'warning' && a.status === 'active').length, [alerts]);
  const resolvedCount = useMemo(() => alerts.filter((a) => a.status === 'resolved').length, [alerts]);

  // Filtered alerts list
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filterType === 'all') return true;
      if (filterType === 'critical') return alert.severity === 'critical' && alert.status === 'active';
      if (filterType === 'throughput') return alert.type === 'throughput_dip' && alert.status === 'active';
      if (filterType === 'spikes') return alert.type === 'data_spike' && alert.status === 'active';
      if (filterType === 'errors') return alert.type === 'error_surge' && alert.status === 'active';
      if (filterType === 'resolved') return alert.status === 'resolved';
      return true;
    });
  }, [alerts, filterType]);

  // Handle mitigation trigger
  const handleMitigate = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'mitigating' } : a))
    );

    setActionFeedback({
      id: alertId,
      message: 'Automated remediation policy triggered. Adjusting connection pool & load parameters...',
    });

    setTimeout(() => {
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.id === alertId) {
            return {
              ...a,
              status: 'resolved',
              severity: 'resolved',
              title: `${a.title.replace('Detected', 'Mitigated')} (Auto-Remediated)`,
              trendData: a.trendData.map((td, i) =>
                i >= a.trendData.length - 2 ? { ...td, actual: td.baseline } : td
              ),
            };
          }
          return a;
        })
      );
      setActionFeedback({
        id: alertId,
        message: 'Successfully mitigated anomaly! Metric normalized to baseline.',
      });
      setTimeout(() => setActionFeedback(null), 4000);
    }, 2200);
  };

  // Dismiss alert
  const handleDismiss = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Simulate dynamic live throughput dip
  const handleSimulateThroughputDip = () => {
    if (isSimulatingDip) return;
    setIsSimulatingDip(true);

    setTimeout(() => {
      const newAlert: SyncAnomalyAlert = {
        id: `alt-${Date.now()}`,
        pipelineId: 'job-sim-dip',
        pipelineName: 'PostgreSQL Orders to Dataverse Sync',
        sourceSystem: 'PostgreSQL DB (Cluster-02)',
        destSystem: 'Microsoft Dataverse',
        type: 'throughput_dip',
        severity: 'critical',
        title: 'Real-Time Throughput Drop Discovered (-82.5%)',
        description: 'Instantaneous processing velocity dropped from 2,100 rec/s to 360 rec/s due to downstream bulk batch lock.',
        detectedAt: 'Just now',
        timestamp: Date.now(),
        baselineValue: '2,100 rec/s',
        observedValue: '360 rec/s',
        variancePercentage: -82.8,
        confidenceScore: 99.4,
        rootCause: 'Dataverse transactional throttle triggered on bulk SalesLine entity write operations.',
        recommendedAction: 'Engage dynamic micro-chunking (size 250 -> 50) and distribute write tasks across 4 supplementary nodes.',
        actionLabel: 'Execute Dynamic Micro-Chunking',
        status: 'active',
        trendData: [
          { time: 'T-5m', baseline: 2100, actual: 2080, threshold: 1200 },
          { time: 'T-4m', baseline: 2100, actual: 2120, threshold: 1200 },
          { time: 'T-3m', baseline: 2100, actual: 2090, threshold: 1200 },
          { time: 'T-2m', baseline: 2100, actual: 1400, threshold: 1200 },
          { time: 'T-1m', baseline: 2100, actual: 520, threshold: 1200 },
          { time: 'Now', baseline: 2100, actual: 360, threshold: 1200 },
        ],
      };

      setAlerts((prev) => [newAlert, ...prev]);
      setExpandedAlertId(newAlert.id);
      setIsSimulatingDip(false);
    }, 800);
  };

  // Simulate dynamic live data spike
  const handleSimulateDataSpike = () => {
    if (isSimulatingSpike) return;
    setIsSimulatingSpike(true);

    setTimeout(() => {
      const newAlert: SyncAnomalyAlert = {
        id: `alt-${Date.now()}`,
        pipelineId: 'job-sim-spike',
        pipelineName: 'MongoDB Product Catalog to Business Central',
        sourceSystem: 'MongoDB Atlas',
        destSystem: 'Microsoft Dynamics 365 BC',
        type: 'data_spike',
        severity: 'warning',
        title: 'CDC Ingestion Velocity Spike Discovered (+415%)',
        description: 'Sudden influx of 8,500 rec/s detected across inventory delta stream exceeding normal buffer threshold.',
        detectedAt: 'Just now',
        timestamp: Date.now(),
        baselineValue: '1,650 rec/s',
        observedValue: '8,500 rec/s',
        variancePercentage: +415.1,
        confidenceScore: 97.8,
        rootCause: 'Upstream catalog batch SKU republish generated burst of change events in replica stream.',
        recommendedAction: 'Engage rate-controlled stream dampener and prioritize live delta commit ring.',
        actionLabel: 'Activate Stream Dampener & Flow Control',
        status: 'active',
        trendData: [
          { time: 'T-5m', baseline: 1650, actual: 1640, threshold: 3000 },
          { time: 'T-4m', baseline: 1650, actual: 1680, threshold: 3000 },
          { time: 'T-3m', baseline: 1650, actual: 1700, threshold: 3000 },
          { time: 'T-2m', baseline: 1650, actual: 4900, threshold: 3000 },
          { time: 'T-1m', baseline: 1650, actual: 7800, threshold: 3000 },
          { time: 'Now', baseline: 1650, actual: 8500, threshold: 3000 },
        ],
      };

      setAlerts((prev) => [newAlert, ...prev]);
      setExpandedAlertId(newAlert.id);
      setIsSimulatingSpike(false);
    }, 800);
  };

  const getSeverityBadge = (severity: AnomalySeverity, status: string) => {
    if (status === 'resolved' || severity === 'resolved') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Resolved
        </span>
      );
    }
    if (severity === 'critical') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Critical Anomaly
        </span>
      );
    }
    if (severity === 'warning') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Warning Deviation
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <Activity className="w-3 h-3 text-indigo-600" />
        Trend Anomaly
      </span>
    );
  };

  const getTypeIcon = (type: AnomalyType) => {
    switch (type) {
      case 'throughput_dip':
        return <TrendingDown className="w-4 h-4 text-rose-600" />;
      case 'data_spike':
        return <Flame className="w-4 h-4 text-amber-600" />;
      case 'error_surge':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'latency_spike':
        return <Gauge className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 relative overflow-hidden">
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-rose-500/5 via-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-mono font-bold rounded-full border border-rose-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              Automated Trend Anomaly Watcher
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold rounded-full border border-slate-200">
              Model: Rolling EWMA + 3σ Z-Score
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Live Sync Anomaly & Throughput Trend Alerts
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Continuously monitors real-time data ingestion rates, highlighting sudden throughput drops, abnormal change-data ingestion spikes, and error surges with automated remediation triggers.
          </p>
        </div>

        {/* Live Simulation Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Live Auto-Polling Status Indicator */}
          <span
            className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border inline-flex items-center gap-1.5 shadow-3xs ${
              isAutoRefreshActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title={
              isAutoRefreshActive
                ? `Real-time Anomaly Polling Active (Every ${activeInterval}s) • Last evaluated at ${lastRefreshedAt}`
                : 'Anomaly polling is currently paused'
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAutoRefreshActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{isAutoRefreshActive ? `Live (${activeInterval}s)` : 'Polling Paused'}</span>
          </span>

          <button
            id="sim-trigger-dip-btn"
            onClick={handleSimulateThroughputDip}
            disabled={isSimulatingDip}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Simulate sudden downstream throughput plummet"
          >
            {isSimulatingDip ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>Simulate Throughput Dip</span>
          </button>

          <button
            id="sim-trigger-spike-btn"
            onClick={handleSimulateDataSpike}
            disabled={isSimulatingSpike}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl border border-amber-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Simulate sudden CDC ingest volume burst"
          >
            {isSimulatingSpike ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Simulate Ingestion Spike</span>
          </button>
        </div>
      </div>

      {/* KPI & Diagnostic Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Critical Anomalies</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 font-mono">{criticalCount}</div>
          <div className="text-[10px] text-slate-500">Requires Immediate Attention</div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Warning Deviations</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 font-mono">{warningCount}</div>
          <div className="text-[10px] text-slate-500">Under Adaptive Monitoring</div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Detection Latency</span>
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">1.2s</div>
          <div className="text-[10px] text-emerald-600 font-bold">Sub-Second Stream Window</div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Auto-Mitigated Rate</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">94.8%</div>
          <div className="text-[10px] text-slate-500">Zero Manual Downtime</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilterType('critical')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              filterType === 'critical'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setFilterType('throughput')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              filterType === 'throughput'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Throughput Dips
          </button>
          <button
            onClick={() => setFilterType('spikes')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              filterType === 'spikes'
                ? 'bg-white text-amber-700 shadow-2xs'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            Data Ingestion Spikes
          </button>
          <button
            onClick={() => setFilterType('errors')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              filterType === 'errors'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            Error Surges
          </button>
          <button
            onClick={() => setFilterType('resolved')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              filterType === 'resolved'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Adaptive Threshold: Dynamic ±25% Rolling Baseline</span>
        </div>
      </div>

      {/* Global Action Feedback Toast */}
      {actionFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-indigo-600 hover:text-indigo-800 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Anomaly Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800">No Anomalies Matching Filter</h4>
            <p className="text-[11px] text-slate-500">All synchronization pipelines are operating within standard tolerance thresholds.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isExpanded = expandedAlertId === alert.id;
            const isCritical = alert.severity === 'critical';
            const isResolved = alert.status === 'resolved';

            return (
              <div
                key={alert.id}
                className={`rounded-xl border transition-all ${
                  isCritical
                    ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                    : isResolved
                    ? 'border-emerald-200 bg-emerald-50/10 hover:border-emerald-300'
                    : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                }`}
              >
                {/* Alert Top Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isCritical
                          ? 'bg-rose-100 text-rose-700'
                          : isResolved
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {getTypeIcon(alert.type)}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSeverityBadge(alert.severity, alert.status)}
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-200 font-mono">
                          {alert.pipelineName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Detected {alert.detectedAt}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                        {alert.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-1">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  {/* Variance & Action CTA */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="text-right font-mono">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Variance vs Baseline</div>
                      <div
                        className={`text-sm font-black flex items-center justify-end gap-1 ${
                          alert.variancePercentage < 0
                            ? 'text-rose-600'
                            : alert.type === 'error_surge'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {alert.variancePercentage > 0 ? `+${alert.variancePercentage.toFixed(1)}%` : `${alert.variancePercentage.toFixed(1)}%`}
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                      className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-all cursor-pointer"
                      title={isExpanded ? 'Collapse analysis' : 'Expand detailed trend breakdown'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Diagnostic & Chart View */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-200/80 p-4 bg-white rounded-b-xl space-y-4"
                    >
                      {/* Metric Comparison & Root Cause Diagnostic */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Historical Baseline</span>
                          <div className="text-base font-black text-slate-800 font-mono">{alert.baselineValue}</div>
                          <span className="text-[10px] text-slate-500">5-min Rolling EWMA</span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Anomalous Peak Observation</span>
                          <div
                            className={`text-base font-black font-mono ${
                              alert.variancePercentage < 0 || alert.type === 'error_surge' ? 'text-rose-600' : 'text-amber-600'
                            }`}
                          >
                            {alert.observedValue}
                          </div>
                          <span className="text-[10px] text-slate-500">Confidence: {alert.confidenceScore}%</span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Source to Destination Route</span>
                          <div className="text-xs font-bold text-indigo-700 truncate">{alert.sourceSystem} → {alert.destSystem}</div>
                          <span className="text-[10px] text-slate-500 font-mono">Channel: Direct Low-Latency API</span>
                        </div>
                      </div>

                      {/* Root Cause & Recommendation Highlight */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div>
                          <strong className="text-slate-900 font-bold">Root Cause Analysis: </strong>
                          <span className="text-slate-700">{alert.rootCause}</span>
                        </div>
                        <div className="p-2.5 bg-indigo-50/80 rounded-lg border border-indigo-100 text-indigo-900 flex items-start gap-2 text-[11px] font-medium">
                          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold">Recommended Automated Mitigation: </strong>
                            <span>{alert.recommendedAction}</span>
                          </div>
                        </div>
                      </div>

                      {/* Mini Trend Sparkline / Area Chart */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-indigo-600" />
                            Trend Telemetry Breakdown vs Static Threshold
                          </span>
                          <div className="flex items-center gap-3 font-mono text-[10px]">
                            <span className="flex items-center gap-1 text-indigo-600">
                              <span className="w-2 h-0.5 bg-indigo-500 inline-block" /> Baseline
                            </span>
                            <span className="flex items-center gap-1 text-rose-600">
                              <span className="w-2 h-0.5 bg-rose-500 inline-block" /> Actual Rate
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <span className="w-2 h-0.5 bg-slate-400 border-dashed inline-block" /> Warning Threshold
                            </span>
                          </div>
                        </div>

                        <div className="h-40 w-full bg-slate-50/60 p-2 rounded-xl border border-slate-200">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={alert.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`gradActual-${alert.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={alert.variancePercentage < 0 ? '#f43f5e' : '#f59e0b'} stopOpacity={0.4} />
                                  <stop offset="95%" stopColor={alert.variancePercentage < 0 ? '#f43f5e' : '#f59e0b'} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id={`gradBase-${alert.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-slate-900 text-white text-[11px] p-2.5 rounded-lg shadow-lg border border-slate-800 space-y-1 font-mono">
                                        <div className="text-slate-400 font-bold">{payload[0]?.payload?.time}</div>
                                        <div className="text-rose-300">Actual Value: {payload[0]?.value}</div>
                                        <div className="text-indigo-300">Expected Baseline: {payload[1]?.value}</div>
                                        <div className="text-slate-400">Threshold: {payload[0]?.payload?.threshold}</div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <ReferenceLine y={alert.trendData[0]?.threshold} stroke="#94a3b8" strokeDasharray="3 3" />
                              <Area type="monotone" dataKey="actual" stroke={alert.variancePercentage < 0 ? '#f43f5e' : '#f59e0b'} strokeWidth={2} fillOpacity={1} fill={`url(#gradActual-${alert.id})`} />
                              <Area type="monotone" dataKey="baseline" stroke="#6366f1" strokeWidth={2} strokeDasharray="2 2" fillOpacity={1} fill={`url(#gradBase-${alert.id})`} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          {onNavigateTab && (
                            <button
                              onClick={() => onNavigateTab('error-center')}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              Inspect in Error Center
                            </button>
                          )}
                          <button
                            onClick={() => handleDismiss(alert.id)}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-semibold rounded-lg border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>

                        {!isResolved && (
                          <button
                            onClick={() => handleMitigate(alert.id)}
                            disabled={alert.status === 'mitigating'}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            {alert.status === 'mitigating' ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Applying Mitigation Policy...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                                <span>{alert.actionLabel}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
