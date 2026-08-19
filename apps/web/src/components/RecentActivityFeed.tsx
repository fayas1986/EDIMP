import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Zap,
  Clock,
  User,
  RefreshCw,
  Pause,
  Play,
  ChevronRight,
  Sparkles,
  X,
  Filter,
  ShieldAlert,
  Database,
  ArrowUpRight,
  Check,
  RotateCcw,
} from 'lucide-react';

export interface RecentActivityItem {
  id: string;
  type: 'pipeline' | 'config' | 'error' | 'security' | 'scaling';
  title: string;
  description: string;
  performedBy: string;
  performedRole: string;
  targetResource: string;
  timestamp: string;
  secondsAgo: number;
  status: 'SUCCESS' | 'CRITICAL' | 'WARNING' | 'INFO';
  impactLevel: 'High' | 'Medium' | 'Low' | 'Critical';
  payloadSummary?: string;
}

const INITIAL_RECENT_ACTIVITIES: RecentActivityItem[] = [
  {
    id: 'act-1',
    type: 'pipeline',
    title: 'Customer Master Migration Pipeline Completed',
    description: 'Successfully transferred and validated 145,200 customer master records into Dynamics 365 Business Central with zero data checksum mismatches.',
    performedBy: 'System Auto Engine',
    performedRole: 'Sync Worker Pool',
    targetResource: 'Dynamics 365 BC',
    timestamp: new Date(Date.now() - 15000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    secondsAgo: 15,
    status: 'SUCCESS',
    impactLevel: 'High',
    payloadSummary: 'Pipeline Job ID: JOB-7019 | Throughput: 420 rps | Validation: 100% Passed'
  },
  {
    id: 'act-2',
    type: 'config',
    title: 'Retry & Backoff Policy Updated',
    description: 'Exponential backoff policy modified for SAP S/4HANA: max retries increased from 3 to 5 with jittered delay threshold of 2,500ms.',
    performedBy: 'Sarah Jenkins',
    performedRole: 'Lead Architect',
    targetResource: 'SAP S/4HANA Connector',
    timestamp: new Date(Date.now() - 45000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    secondsAgo: 45,
    status: 'INFO',
    impactLevel: 'Medium',
    payloadSummary: 'Config Param: retryPolicy.maxRetries = 5, retryPolicy.jitter = true'
  },
  {
    id: 'act-3',
    type: 'error',
    title: 'Critical DB Connection Timeout Intercepted',
    description: 'Socket timeout error detected on Legacy SQL Server node (5000ms limit reached). Circuit breaker tripped to prevent cascade failure.',
    performedBy: 'System Guardian',
    performedRole: 'Circuit Breaker',
    targetResource: 'Legacy SQL Database',
    timestamp: new Date(Date.now() - 110000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    secondsAgo: 110,
    status: 'CRITICAL',
    impactLevel: 'Critical',
    payloadSummary: 'Error Code: ETIMEDOUT_SQL_901 | Traffic redirected to replica pool #2'
  },
  {
    id: 'act-4',
    type: 'pipeline',
    title: 'Financial Ledger Batch #802 Sync Finished',
    description: 'Processed and reconciled $12.4M general ledger transaction batch across 18 company codes with automated key mapping.',
    performedBy: 'Alex Mercer',
    performedRole: 'Data Engineer',
    targetResource: 'SAP General Ledger',
    timestamp: new Date(Date.now() - 210000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    secondsAgo: 210,
    status: 'SUCCESS',
    impactLevel: 'High',
    payloadSummary: 'Batch Records: 84,100 rows | Delta Checksum: Match'
  },
  {
    id: 'act-5',
    type: 'security',
    title: 'GDPR Anonymization Tokenizer Applied',
    description: 'Enforced HMAC-SHA256 data masking rules across 6 personal identification fields (SSN, IBAN, Tax ID) for EU data region.',
    performedBy: 'Elena Rostova',
    performedRole: 'Compliance Officer',
    targetResource: 'Data Masking Vault',
    timestamp: new Date(Date.now() - 340000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    secondsAgo: 340,
    status: 'SUCCESS',
    impactLevel: 'Medium',
    payloadSummary: 'Policy ID: POL-GDPR-EU-2026 | Anonymized Fields: 6'
  }
];

const SIMULATED_LIVE_ACTIONS: Omit<RecentActivityItem, 'id' | 'timestamp' | 'secondsAgo'>[] = [
  {
    type: 'pipeline',
    title: 'Salesforce Accounts Delta Sync Completed',
    description: 'Incremental account contacts delta sync finished. 12,450 accounts updated in target warehouse.',
    performedBy: 'System Auto Engine',
    performedRole: 'CDC Streamer',
    targetResource: 'Salesforce Connector',
    status: 'SUCCESS',
    impactLevel: 'Medium',
    payloadSummary: 'Sync Type: Incremental CDC | Total Updates: 12,450 | Latency: 18ms'
  },
  {
    type: 'config',
    title: 'Worker Thread Pool Capacity Scaled',
    description: 'Auto-scaling policy allocated +8 worker threads to absorb incoming ingestion surge on API gateway.',
    performedBy: 'Auto Scaler Engine',
    performedRole: 'Kubernetes Operator',
    targetResource: 'Cluster Pod Pool #1',
    status: 'INFO',
    impactLevel: 'Low',
    payloadSummary: 'Active Pods: 16 -> 24 | CPU Allocation: 85%'
  },
  {
    type: 'error',
    title: 'Rate Limit Threshold Exceeded (HTTP 429)',
    description: 'Target API endpoint rate limit hit. Exponential delay backoff initiated automatically.',
    performedBy: 'Gateway Monitor',
    performedRole: 'Proxy Guard',
    targetResource: 'Business Central API',
    status: 'CRITICAL',
    impactLevel: 'High',
    payloadSummary: 'Status Code: 429 Too Many Requests | Backoff: 1200ms Jitter'
  },
  {
    type: 'config',
    title: 'Schema Field Transformation Rules Saved',
    description: 'Added automated string trimming and date ISO8601 formatting rules to Customer Master pipeline.',
    performedBy: 'David Chen',
    performedRole: 'Integration Admin',
    targetResource: 'Schema Mapper Studio',
    status: 'INFO',
    impactLevel: 'Medium',
    payloadSummary: 'Rule ID: TR-D365-DATE-01 | Target Field: CreatedDateTime'
  },
  {
    type: 'pipeline',
    title: 'Inventory Item Snapshot Pipeline Completed',
    description: 'Extracted and indexed 45,000 SKU inventory records across 5 warehouse locations.',
    performedBy: 'System Auto Engine',
    performedRole: 'Batch Scheduler',
    targetResource: 'Oracle ERP Connector',
    status: 'SUCCESS',
    impactLevel: 'High',
    payloadSummary: 'SKU Count: 45,000 | Indexing Duration: 4.2s | Memory Usage: 1.2GB'
  }
];

interface RecentActivityFeedProps {
  onNavigateTab?: (tab: string) => void;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ onNavigateTab }) => {
  const [activities, setActivities] = useState<RecentActivityItem[]>(INITIAL_RECENT_ACTIVITIES);
  const [filter, setFilter] = useState<'all' | 'pipeline' | 'config' | 'error'>('all');
  const [isLive, setIsLive] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<RecentActivityItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Update relative time counter every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setActivities((prev) =>
        prev.map((act) => ({
          ...act,
          secondsAgo: act.secondsAgo + 1,
        }))
      );
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Live real-time event generator simulation
  useEffect(() => {
    if (!isLive) return;

    const streamInterval = setInterval(() => {
      const template = SIMULATED_LIVE_ACTIONS[Math.floor(Math.random() * SIMULATED_LIVE_ACTIONS.length)];
      const newAction: RecentActivityItem = {
        ...template,
        id: `act-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        secondsAgo: 0,
      };

      setActivities((prev) => [newAction, ...prev.slice(0, 14)]); // Keep last 15 in buffer
    }, 12000);

    return () => clearInterval(streamInterval);
  }, [isLive]);

  // Format seconds ago into friendly relative time string
  const formatRelativeTime = (seconds: number) => {
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  // Filter activities and strictly limit to top 5 most recent significant actions
  const filteredActivities = activities
    .filter((act) => {
      if (filter === 'all') return true;
      if (filter === 'pipeline') return act.type === 'pipeline';
      if (filter === 'config') return act.type === 'config';
      if (filter === 'error') return act.type === 'error' || act.status === 'CRITICAL';
      return true;
    })
    .slice(0, 5); // Strictly show last 5 significant actions

  const handleSimulateAction = (type: 'pipeline' | 'config' | 'error') => {
    let newAction: RecentActivityItem;

    if (type === 'pipeline') {
      newAction = {
        id: `act-manual-${Date.now()}`,
        type: 'pipeline',
        title: 'Enterprise ERP Journal Batch Sync Completed',
        description: 'Successfully synced $4.2M financial journal batch with 100% target schema validation.',
        performedBy: 'System Sync Engine',
        performedRole: 'Pipeline Scheduler',
        targetResource: 'Dynamics 365 Finance',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        secondsAgo: 0,
        status: 'SUCCESS',
        impactLevel: 'High',
        payloadSummary: 'Manual Sync Trigger | Records: 28,400 | Errors: 0',
      };
    } else if (type === 'config') {
      newAction = {
        id: `act-manual-${Date.now()}`,
        type: 'config',
        title: 'Pipeline Parallel Throttling Parameter Modified',
        description: 'Updated max concurrent connection limit to 32 worker threads for High-Throughput CDC connector.',
        performedBy: 'Lead Integration Architect',
        performedRole: 'System Operator',
        targetResource: 'CDC High-Speed Gateway',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        secondsAgo: 0,
        status: 'INFO',
        impactLevel: 'Medium',
        payloadSummary: 'Throttling Config: max_concurrency = 32, buffer_kb = 4096',
      };
    } else {
      newAction = {
        id: `act-manual-${Date.now()}`,
        type: 'error',
        title: 'Target Database Circuit Breaker Engagement',
        description: 'Interrupted connection to SAP S/4HANA DB node after detecting 3 consecutive lock wait timeouts.',
        performedBy: 'System Auto Guard',
        performedRole: 'Safety Circuit',
        targetResource: 'SAP S/4HANA DB Node',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        secondsAgo: 0,
        status: 'CRITICAL',
        impactLevel: 'Critical',
        payloadSummary: 'Alert Level: CRITICAL | Error: LOCK_WAIT_TIMEOUT | Auto-failover initiated',
      };
    }

    setActivities((prev) => [newAction, ...prev.slice(0, 14)]);
  };

  const getCategoryBadge = (type: RecentActivityItem['type'], status: RecentActivityItem['status']) => {
    if (status === 'CRITICAL' || type === 'error') {
      return {
        bg: 'bg-rose-500/10 text-rose-600 border-rose-200',
        dot: 'bg-rose-500',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
        label: 'Critical Error',
      };
    }
    if (type === 'pipeline') {
      return {
        bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
        label: 'Pipeline Done',
      };
    }
    if (type === 'config') {
      return {
        bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500',
        icon: <Sliders className="w-3.5 h-3.5 text-indigo-600 shrink-0" />,
        label: 'Config Change',
      };
    }
    if (type === 'security') {
      return {
        bg: 'bg-blue-500/10 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        icon: <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
        label: 'Security Action',
      };
    }
    return {
      bg: 'bg-slate-500/10 text-slate-700 border-slate-200',
      dot: 'bg-slate-500',
      icon: <Activity className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
      label: 'System Action',
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 border border-indigo-100">
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Recent Platform Activity</h2>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold rounded-full border border-indigo-200 uppercase tracking-wider">
                Last 5 Actions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time audit log of pipeline completions, configuration updates, and critical system alerts.
            </p>
          </div>
        </div>

        {/* CONTROLS AND LIVE FEED TOGGLE */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Stream Pulse Indicator */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLive ? 'bg-emerald-400' : 'bg-slate-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            </span>
            <span>{isLive ? 'Live Feed On' : 'Feed Paused'}</span>
          </button>

          {/* Quick Manual Test Triggers */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5">Simulate:</span>
            <button
              onClick={() => handleSimulateAction('pipeline')}
              className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg border border-slate-200 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Simulate Pipeline Completion Action"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Pipeline</span>
            </button>
            <button
              onClick={() => handleSimulateAction('config')}
              className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 rounded-lg border border-slate-200 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Simulate Configuration Update Action"
            >
              <Sliders className="w-3 h-3 text-indigo-500" />
              <span>Config</span>
            </button>
            <button
              onClick={() => handleSimulateAction('error')}
              className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 rounded-lg border border-slate-200 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Simulate Critical Error Action"
            >
              <ShieldAlert className="w-3 h-3 text-rose-500" />
              <span>Critical</span>
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(
            [
              { id: 'all', label: 'All Recent (5)' },
              { id: 'pipeline', label: 'Pipeline Completions' },
              { id: 'config', label: 'Config Changes' },
              { id: 'error', label: 'Critical Errors' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-white text-indigo-600 font-extrabold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('activity')}
            className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View Full Audit Stream</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ACTIVITY FEED LIST (SHOWING TOP 5 SIGNIFICANT ACTIONS) */}
      <div className="space-y-2.5">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No actions recorded under this filter.</p>
            <p className="text-[11px] text-slate-400 mt-1">Switch to 'All Recent' or simulate a new event above.</p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const badge = getCategoryBadge(act.type, act.status);
            return (
              <div
                key={act.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  act.status === 'CRITICAL'
                    ? 'bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/70 hover:border-rose-300'
                    : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Category icon badge */}
                  <div className={`p-2 rounded-xl border ${badge.bg} shrink-0 mt-0.5`}>
                    {badge.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase tracking-wide flex items-center gap-1 ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{badge.label}</span>
                      </span>

                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <strong className="text-slate-700 font-semibold">{formatRelativeTime(act.secondsAgo)}</strong>
                        <span>({act.timestamp})</span>
                      </span>

                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200/70 text-slate-700 rounded border border-slate-300/60">
                        {act.targetResource}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1 flex items-center gap-1.5">
                      <span>{act.title}</span>
                    </h3>

                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>

                    {/* Performer info */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1.5 font-mono">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{act.performedBy}</span>
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">{act.performedRole}</span>
                    </div>
                  </div>
                </div>

                {/* ACTION DETAILS BUTTON */}
                <div className="flex items-center sm:flex-col justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 border-slate-200/60 pt-2 sm:pt-0">
                  <button
                    onClick={() => setSelectedActivity(act)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 hover:border-slate-300 shrink-0"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER METRICS SUMMARY */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Real-time platform action tracking active. Showing top 5 recent events.</span>
        </div>

        <div className="flex items-center gap-3">
          <span>Feed Buffer: <strong className="text-slate-800">{activities.length} total</strong></span>
          <span>•</span>
          <span className="text-emerald-600 font-bold">100% Audit Fidelity</span>
        </div>
      </div>

      {/* ACTIVITY DETAIL MODAL */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                    Platform Action Log
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{selectedActivity.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-sans">
                <span className="text-[10px] font-bold uppercase text-slate-400">Description</span>
                <p className="text-slate-800 text-xs leading-relaxed">{selectedActivity.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400">Target Resource</div>
                  <strong className="text-slate-800 font-bold">{selectedActivity.targetResource}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400">Timestamp</div>
                  <strong className="text-slate-800 font-bold">{selectedActivity.timestamp} ({formatRelativeTime(selectedActivity.secondsAgo)})</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400">Performed By</div>
                  <strong className="text-indigo-700 font-bold">{selectedActivity.performedBy}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400">User Role</div>
                  <strong className="text-slate-800 font-bold">{selectedActivity.performedRole}</strong>
                </div>
              </div>

              {selectedActivity.payloadSummary && (
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-[11px] space-y-1 font-mono">
                  <div className="text-[10px] text-indigo-400 font-bold uppercase">Technical Payload Summary</div>
                  <p className="text-emerald-300 whitespace-pre-wrap">{selectedActivity.payloadSummary}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all cursor-pointer shadow-2xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
