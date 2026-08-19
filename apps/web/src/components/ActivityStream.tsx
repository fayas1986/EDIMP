import React, { useState, useEffect } from 'react';
import { ActivityFeedItem } from '../types';
import {
  Activity,
  User,
  ShieldCheck,
  Zap,
  Sliders,
  Database,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  X,
  Plus,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Terminal,
  UserCheck,
  Trash2,
  Send,
  Copy,
  Check,
  Code,
  FileText,
  Download,
  Server,
  GitCommit,
  List,
  CornerDownRight,
  Link2,
} from 'lucide-react';

const INITIAL_ACTIVITY_STREAM: ActivityFeedItem[] = [
  {
    id: 'stream-crit-1',
    userName: 'System Auto',
    userRole: 'System Auto',
    actionType: 'SYSTEM',
    title: 'Critical DB Circuit Breaker Tripped',
    details: 'System circuit breaker engaged on SAP S/4HANA primary DB node due to 5 consecutive socket connection timeouts.',
    timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
    relativeTime: 'Just now',
    status: 'CRITICAL',
    targetResource: 'SAP S/4HANA DB Cluster',
  },
  {
    id: 'stream-1',
    userName: 'Sarah Jenkins',
    userRole: 'Lead Architect',
    actionType: 'MAPPING',
    title: 'Committed AI Mapping Overrides',
    details: 'Manually verified and approved mapping: SAP.BKPF.BELNR -> D365.GL_Entry.Voucher with 99.4% confidence rating.',
    timestamp: new Date(Date.now() - 45000).toLocaleTimeString(),
    relativeTime: '1 min ago',
    status: 'SUCCESS',
    targetResource: 'SAP S/4HANA Finance',
  },
  {
    id: 'stream-2',
    userName: 'System Auto',
    userRole: 'System Auto',
    actionType: 'SCALE',
    title: 'Kubernetes Engine Auto-Scaled',
    details: 'Provisioned +16 dynamic worker pods in response to SAP ingestion spike (2,400 rps).',
    timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
    relativeTime: '2 mins ago',
    status: 'INFO',
    targetResource: 'Cluster Pod Pool #4',
  },
  {
    id: 'stream-3',
    userName: 'Alex Mercer',
    userRole: 'Data Engineer',
    actionType: 'MIGRATION',
    title: 'Manual Pause on Customer Master Sync',
    details: 'Operator paused batch #802 to re-index composite key lookup table before resuming chunking.',
    timestamp: new Date(Date.now() - 280000).toLocaleTimeString(),
    relativeTime: '5 mins ago',
    status: 'WARNING',
    targetResource: 'Customer Master Pipeline',
  },
  {
    id: 'stream-4',
    userName: 'Elena Rostova',
    userRole: 'Compliance Officer',
    actionType: 'SECURITY',
    title: 'Enforced GDPR Anonymization Policy',
    details: 'Applied HMAC-SHA256 Tokenization across 8 PII fields (SSN, Phone, TaxId) for EU customer region.',
    timestamp: new Date(Date.now() - 420000).toLocaleTimeString(),
    relativeTime: '7 mins ago',
    status: 'SUCCESS',
    targetResource: 'Data Masking Vault',
  },
  {
    id: 'stream-5',
    userName: 'System Auto',
    userRole: 'System Auto',
    actionType: 'SYSTEM',
    title: 'Throttling Cooldown Auto-Recovered',
    details: 'HTTP 429 rate limit backoff resolved on Dynamics 365 Business Central endpoint. Restored 250 rps burst limit.',
    timestamp: new Date(Date.now() - 600000).toLocaleTimeString(),
    relativeTime: '10 mins ago',
    status: 'SUCCESS',
    targetResource: 'Dynamics 365 Connector',
  },
  {
    id: 'stream-6',
    userName: 'David Chen',
    userRole: 'Security Admin',
    actionType: 'CONFIG',
    title: 'Adjusted Target Throttling Parameters',
    details: 'Updated maximum concurrent worker connections from 8 to 16 for Salesforce Sales Cloud instance.',
    timestamp: new Date(Date.now() - 900000).toLocaleTimeString(),
    relativeTime: '15 mins ago',
    status: 'INFO',
    targetResource: 'Salesforce Connector',
  },
];

const GENERATED_SYSTEM_EVENTS: Partial<ActivityFeedItem>[] = [
  {
    userName: 'System Auto',
    userRole: 'System Auto',
    actionType: 'SYSTEM',
    title: 'Critical Database Circuit Breaker Intercepted',
    details: 'System circuit breaker engaged on SAP Finance DB pool #2 due to lock escalation. Traffic rerouted to secondary node.',
    status: 'CRITICAL',
    targetResource: 'SAP S/4HANA DB Cluster',
  },
  {
    userName: 'System Auto',
    userRole: 'System Auto',
    actionType: 'SYSTEM',
    title: 'Storage Threshold Critical Exceeded (>95%)',
    details: 'Staging volume disk usage reached 96.2%. Immediate purge policy triggered for logs older than 48 hours.',
    status: 'CRITICAL',
    targetResource: 'Staging Storage Lakehouse',
  },
  {
    userName: 'System Auto',
    userRole: 'System Auto',
    actionType: 'SYSTEM',
    title: 'Schema Integrity Check Completed',
    details: 'Automated assertion engine verified 45,000 table fields with 0 orphan foreign key breaches.',
    status: 'SUCCESS',
    targetResource: 'Data Dictionary Engine',
  },
  {
    userName: 'System Auto',
    userRole: 'System Auto',
    actionType: 'SCALE',
    title: 'Worker Pool Throughput Rebalanced',
    details: 'Dynamic thread balancer reallocated 4 threads from idle inventory pipeline to finance ledger sync.',
    status: 'INFO',
    targetResource: 'Parallel Scheduler',
  },
  {
    userName: 'System Auto',
    userRole: 'System Auto',
    actionType: 'SYSTEM',
    title: 'Checkpoint Backup Replicated',
    details: 'Exported incremental delta snapshot #9102 to Azure Blob Storage staging container.',
    status: 'SUCCESS',
    targetResource: 'Staging Lakehouse',
  },
  {
    userName: 'System Auto',
    userRole: 'System Auto',
    actionType: 'SYSTEM',
    title: 'Transient Rate Limit Warning (429)',
    details: 'Target API responded with status 429. Exponential jitter backoff initiated (Delay: 1200ms).',
    status: 'WARNING',
    targetResource: 'REST API Proxy Gateway',
  },
];

const GENERATED_MANUAL_INTERVENTIONS: Partial<ActivityFeedItem>[] = [
  {
    userName: 'Sarah Jenkins',
    userRole: 'Lead Architect',
    actionType: 'MAPPING',
    title: 'Manual Field Type Override Approved',
    details: 'Force-mapped string timestamp ISO8601 -> SQL datetime2 with timezone offset conversion.',
    status: 'SUCCESS',
    targetResource: 'Mapping Studio',
  },
  {
    userName: 'Alex Mercer',
    userRole: 'Data Engineer',
    actionType: 'CONFIG',
    title: 'Pipeline Priority Promoted',
    details: 'Elevated Financial Transactions batch priority from High to Critical for fiscal year closing.',
    status: 'INFO',
    targetResource: 'Job Orchestrator',
  },
  {
    userName: 'David Chen',
    userRole: 'Security Admin',
    actionType: 'SECURITY',
    title: 'Revoked Stale Service Credentials',
    details: 'Rotated OAuth 2.0 client secret for Legacy SQL staging link after 90-day security policy trigger.',
    status: 'SUCCESS',
    targetResource: 'Key Vault Manager',
  },
];

interface ActivityStreamProps {
  onNavigateTab?: (tab: string) => void;
}

export const ActivityStream: React.FC<ActivityStreamProps> = ({ onNavigateTab }) => {
  const [stream, setStream] = useState<ActivityFeedItem[]>(INITIAL_ACTIVITY_STREAM);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS'>('ALL');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'SYSTEM' | 'MANUAL' | 'WARNINGS' | 'SECURITY'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<ActivityFeedItem | null>(null);
  const [sidePanelTab, setSidePanelTab] = useState<'METADATA' | 'JSON'>('METADATA');
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'STREAM' | 'TIMELINE'>('STREAM');

  // Generate complete structured JSON payload for selected audit event
  const getEventJsonPayload = (item: ActivityFeedItem) => {
    return {
      event_id: item.id,
      schema_version: "2.4.0",
      timestamp_utc: new Date().toISOString(),
      local_time: item.timestamp,
      relative_age: item.relativeTime,
      event_title: item.title,
      severity_status: item.status,
      action_category: item.actionType,
      target_resource: item.targetResource || "Platform Core",
      actor: {
        name: item.userName,
        role: item.userRole,
        type: item.userRole === 'System Auto' ? 'AUTOMATED_AGENT' : 'HUMAN_OPERATOR',
        session_id: `sess_${item.id.replace(/[^a-zA-Z0-9]/g, '')}`,
      },
      telemetry_metadata: {
        trace_id: `trc_${Math.random().toString(36).substring(2, 14)}`,
        span_id: `spn_${Math.random().toString(36).substring(2, 10)}`,
        environment: "production-us-east-1",
        cluster_node: "k8s-worker-pool-04",
        latency_ms: Math.floor(Math.random() * 45) + 8,
        status_code: item.status === 'CRITICAL' ? 500 : item.status === 'WARNING' ? 429 : 200,
      },
      execution_context: {
        details: item.details,
        audit_hash: `sha256_${Math.random().toString(36).substring(2, 18)}`,
        compliance_flags: ["GDPR_AUDITED", "SOC2_TYPE_II", "ENCRYPTED_REST"],
      },
    };
  };

  // Manual Intervention Creation Modal state
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState<boolean>(false);
  const [customOperatorName, setCustomOperatorName] = useState<string>('Sarah Jenkins');
  const [customOperatorRole, setCustomOperatorRole] = useState<'Lead Architect' | 'Data Engineer' | 'Security Admin' | 'Compliance Officer'>('Lead Architect');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDetails, setCustomDetails] = useState<string>('');
  const [customActionType, setCustomActionType] = useState<'MIGRATION' | 'CONFIG' | 'MAPPING' | 'SECURITY' | 'SCALE' | 'SYSTEM'>('MIGRATION');

  // Background Live Stream Interval
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      // 40% chance of system event vs manual intervention simulation
      const isSystem = Math.random() > 0.4;
      const templates = isSystem ? GENERATED_SYSTEM_EVENTS : GENERATED_MANUAL_INTERVENTIONS;
      const chosen = templates[Math.floor(Math.random() * templates.length)];
      const now = new Date();

      const newLog: ActivityFeedItem = {
        id: `stream-live-${Date.now()}`,
        userName: chosen.userName || 'System Auto',
        userRole: chosen.userRole || 'System Auto',
        actionType: chosen.actionType || 'SYSTEM',
        title: chosen.title || 'Event Executed',
        details: chosen.details || 'Real-time telemetry update captured.',
        timestamp: now.toLocaleTimeString(),
        relativeTime: 'Just now',
        status: chosen.status || 'INFO',
        targetResource: chosen.targetResource || 'Telemetry Engine',
      };

      setStream((prev) => [newLog, ...prev.slice(0, 49)]); // Keep latest 50 events
    }, 6000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Handle Manual Intervention Creation
  const handleAddManualIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newLog: ActivityFeedItem = {
      id: `manual-entry-${Date.now()}`,
      userName: customOperatorName,
      userRole: customOperatorRole,
      actionType: customActionType,
      title: customTitle,
      details: customDetails || 'Manual intervention log logged by operator.',
      timestamp: new Date().toLocaleTimeString(),
      relativeTime: 'Just now',
      status: 'SUCCESS',
      targetResource: 'Manual Override Console',
    };

    setStream((prev) => [newLog, ...prev]);
    setCustomTitle('');
    setCustomDetails('');
    setIsInterventionModalOpen(false);
  };

  // Trigger System Event Simulation
  const handleTriggerSimulatedSystemEvent = () => {
    const template = GENERATED_SYSTEM_EVENTS[Math.floor(Math.random() * GENERATED_SYSTEM_EVENTS.length)];
    const newLog: ActivityFeedItem = {
      id: `system-sim-${Date.now()}`,
      userName: 'System Auto',
      userRole: 'System Auto',
      actionType: template.actionType || 'SYSTEM',
      title: template.title || 'System Check Triggered',
      details: template.details || 'On-demand diagnostic telemetry captured.',
      timestamp: new Date().toLocaleTimeString(),
      relativeTime: 'Just now',
      status: template.status || 'INFO',
      targetResource: template.targetResource || 'Diagnostic Engine',
    };

    setStream((prev) => [newLog, ...prev]);
  };

  // Filter Stream Logs
  const filteredStream = stream.filter((item) => {
    // Category Severity Filter (Header Filter)
    let matchesSeverity = true;
    if (severityFilter !== 'ALL') {
      matchesSeverity = item.status === severityFilter;
    }

    // Secondary Feature Tab filter
    let matchesTab = true;
    if (activeTabFilter === 'SYSTEM') matchesTab = item.userRole === 'System Auto';
    if (activeTabFilter === 'MANUAL') matchesTab = item.userRole !== 'System Auto';
    if (activeTabFilter === 'WARNINGS') matchesTab = item.status === 'WARNING' || item.status === 'CRITICAL';
    if (activeTabFilter === 'SECURITY') matchesTab = item.actionType === 'SECURITY';

    // Search query filter
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.details.toLowerCase().includes(query) ||
      item.userName.toLowerCase().includes(query) ||
      (item.targetResource && item.targetResource.toLowerCase().includes(query));

    return matchesSeverity && matchesTab && matchesSearch;
  });

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'MIGRATION':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CONFIG':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'MAPPING':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SECURITY':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SCALE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'IN_PROGRESS':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'WARNING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SUCCESS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INFO':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="activity-stream-section" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Stream Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Real-Time System Events & Manual Intervention Stream
              </h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className={`w-2 h-2 rounded-full ${isLiveStreaming ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
                {isLiveStreaming ? 'LIVE FEED' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit trail of automated infrastructure actions, data mapping overrides, and manual engineer interventions.
            </p>
          </div>
        </div>

        {/* Top Controls: Header Category Filter & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Header Category Severity Filter Control */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-500 px-2 hidden sm:flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Severity:</span>
            </span>
            {[
              { id: 'ALL', label: 'All', icon: Layers, activeColor: 'bg-white text-slate-900 border-slate-200' },
              { id: 'INFO', label: 'Info', icon: Info, activeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
              { id: 'WARNING', label: 'Warning', icon: AlertTriangle, activeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
              { id: 'CRITICAL', label: 'Critical', icon: ShieldAlert, activeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
              { id: 'SUCCESS', label: 'Success', icon: CheckCircle2, activeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map((cat) => {
              const CatIcon = cat.icon;
              const count = cat.id === 'ALL' ? stream.length : stream.filter((s) => s.status === cat.id).length;
              const isActive = severityFilter === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSeverityFilter(cat.id as any)}
                  aria-label={`Filter events by ${cat.label} category severity (${count} events)`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? `${cat.activeColor} shadow-2xs border font-extrabold`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <CatIcon className={`w-3.5 h-3.5 ${
                    cat.id === 'CRITICAL' ? 'text-rose-500' :
                    cat.id === 'WARNING' ? 'text-amber-500' :
                    cat.id === 'SUCCESS' ? 'text-emerald-500' :
                    cat.id === 'INFO' ? 'text-indigo-500' : 'text-slate-500'
                  }`} />
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/80 font-bold border border-slate-200' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Pause / Resume button */}
          <button
            type="button"
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            aria-label={isLiveStreaming ? 'Pause live activity stream' : 'Resume live activity stream'}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isLiveStreaming
                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {isLiveStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isLiveStreaming ? 'Pause' : 'Resume'}</span>
          </button>

          {/* Trigger System Event */}
          <button
            type="button"
            onClick={handleTriggerSimulatedSystemEvent}
            aria-label="Simulate system event entry"
            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Simulate Event</span>
          </button>

          {/* Log Manual Intervention */}
          <button
            type="button"
            onClick={() => setIsInterventionModalOpen(true)}
            aria-label="Log manual intervention entry"
            className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Intervention</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Category Filters, View Mode Toggle & Search Input */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'ALL', label: 'All Events', count: stream.length },
            { id: 'SYSTEM', label: 'System Auto', count: stream.filter((s) => s.userRole === 'System Auto').length },
            { id: 'MANUAL', label: 'Interventions', count: stream.filter((s) => s.userRole !== 'System Auto').length },
            { id: 'WARNINGS', label: 'Warnings', count: stream.filter((s) => s.status === 'WARNING').length },
            { id: 'SECURITY', label: 'Security & PII', count: stream.filter((s) => s.actionType === 'SECURITY').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTabFilter === tab.id
                  ? 'bg-white text-indigo-600 shadow-2xs border border-slate-200/80 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTabFilter === tab.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* View Mode Toggle & Search input */}
        <div className="flex items-center gap-2.5">
          {/* Stream vs Vertical Timeline View Switcher */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl border border-slate-300/80 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('STREAM')}
              aria-label="Switch to standard activity stream feed view"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'STREAM'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden lg:inline">Feed</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('TIMELINE')}
              aria-label="Switch to vertical timeline migration flow visualization mode"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'TIMELINE'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5 text-indigo-600" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Search input */}
          <div className="relative min-w-[160px] sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feed logs..."
              aria-label="Filter real-time stream logs"
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Stream Feed or Vertical Timeline Container */}
      {viewMode === 'TIMELINE' ? (
        <div
          role="feed"
          aria-live="polite"
          aria-label="Sequential migration events vertical timeline with task dependencies"
          className="relative pl-8 sm:pl-10 pr-2 py-3 space-y-5 max-h-[440px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300"
        >
          {/* Continuous Vertical Timeline Spine Line */}
          <div className="absolute left-3.5 sm:left-4.5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-indigo-500 via-indigo-300 to-slate-200" />

          {filteredStream.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-2">
              <Terminal className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
              <p className="text-xs font-semibold text-slate-600">No timeline migration events match your criteria.</p>
              <p className="text-[11px] text-slate-400">Try adjusting your filters or search query.</p>
              <button
                onClick={() => {
                  setSeverityFilter('ALL');
                  setActiveTabFilter('ALL');
                  setSearchQuery('');
                }}
                className="mt-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            filteredStream.map((item, index) => {
              const isManual = item.userRole !== 'System Auto';
              const stepNum = index + 1;
              const prevItem = index > 0 ? filteredStream[index - 1] : null;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedAuditLog(item)}
                  tabIndex={0}
                  role="article"
                  aria-label={`Timeline Step ${stepNum}: ${item.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedAuditLog(item);
                    }
                  }}
                  className="relative group cursor-pointer transition-all"
                >
                  {/* Step Node Marker on Vertical Spine */}
                  <div className={`absolute -left-8 sm:-left-10 top-2.5 w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold shadow-xs transition-transform group-hover:scale-110 z-10 ${
                    item.status === 'CRITICAL'
                      ? 'bg-rose-500 border-rose-200 text-white shadow-rose-200/50'
                      : item.status === 'WARNING'
                      ? 'bg-amber-500 border-amber-200 text-white shadow-amber-200/50'
                      : item.status === 'SUCCESS'
                      ? 'bg-emerald-500 border-emerald-200 text-white shadow-emerald-200/50'
                      : 'bg-indigo-600 border-indigo-200 text-white shadow-indigo-200/50'
                  }`}>
                    {stepNum < 10 ? `0${stepNum}` : stepNum}
                  </div>

                  {/* Timeline Task Card */}
                  <div className={`p-4 rounded-xl border transition-all group-hover:shadow-md space-y-2.5 ${
                    isManual
                      ? 'bg-indigo-50/40 hover:bg-indigo-50/80 border-indigo-200/90'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}>
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-extrabold bg-slate-900 text-white shrink-0">
                          STEP #{stepNum < 10 ? `0${stepNum}` : stepNum}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {item.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Operator / System Badge */}
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border flex items-center gap-1 ${
                          isManual ? 'bg-indigo-100/80 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {isManual ? <UserCheck className="w-3 h-3 text-indigo-600" /> : <Terminal className="w-3 h-3 text-slate-500" />}
                          <span>{item.userName}</span>
                        </span>

                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getStatusBadgeColor(item.status)}`}>
                          {item.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getActionBadgeColor(item.actionType)}`}>
                          {item.actionType}
                        </span>
                      </div>
                    </div>

                    {/* Task Description */}
                    <p className="text-sm text-slate-700 leading-relaxed font-sans">
                      {item.details}
                    </p>

                    {/* Dependency Connection Flow Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] font-mono">
                      {prevItem ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/80 rounded-lg text-slate-600 border border-slate-200 min-w-0 max-w-[320px]">
                          <CornerDownRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="text-slate-400 shrink-0">Depends on:</span>
                          <strong className="text-slate-800 truncate">{prevItem.title}</strong>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg text-emerald-800 border border-emerald-200">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold">Migration Root / Sequence Start</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/70 rounded-lg text-indigo-700 border border-indigo-100 shrink-0">
                        <Link2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-indigo-400">Target:</span>
                        <strong className="text-indigo-900">{item.targetResource || 'Platform Core'}</strong>
                      </div>
                    </div>

                    {/* Timeline Footer Metadata */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                      <div className="flex items-center gap-2">
                        <span>Role: {item.userRole}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{item.timestamp} ({item.relativeTime})</span>
                        <span className="text-indigo-600 font-bold group-hover:underline">Inspect Payload →</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div
          role="feed"
          aria-live="polite"
          aria-label="Real-time system events and manual intervention logs"
          className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300"
        >
          {filteredStream.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-2">
              <Terminal className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
              <p className="text-xs font-semibold text-slate-600">No activity stream logs match your criteria.</p>
              <p className="text-[11px] text-slate-400">Try adjusting your severity category filter or search query.</p>
              <button
                onClick={() => {
                  setSeverityFilter('ALL');
                  setActiveTabFilter('ALL');
                  setSearchQuery('');
                }}
                className="mt-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            filteredStream.map((item) => {
              const isManual = item.userRole !== 'System Auto';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedAuditLog(item)}
                  tabIndex={0}
                  role="article"
                  aria-label={`Event: ${item.title} by ${item.userName} at ${item.timestamp}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedAuditLog(item);
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer group hover:shadow-xs space-y-2 ${
                    isManual
                      ? 'bg-indigo-50/30 hover:bg-indigo-50/70 border-indigo-100/90'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80'
                  }`}
                >
                  {/* Event Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getStatusIcon(item.status)}
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Role / Intervener Tag */}
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border flex items-center gap-1 ${
                        isManual ? 'bg-indigo-100/80 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isManual ? <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> : <Terminal className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{item.userName}</span>
                      </span>

                      {/* Action Category Badge */}
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getActionBadgeColor(item.actionType)}`}>
                        {item.actionType}
                      </span>

                      {/* Severity Level Badge */}
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getStatusBadgeColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <p className="text-sm text-slate-700 leading-relaxed font-sans line-clamp-2">
                    {item.details}
                  </p>

                  {/* Event Footer Info */}
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1.5 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-semibold">{item.targetResource || 'Platform Core'}</span>
                      <span>•</span>
                      <span>Role: {item.userRole}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.timestamp}</span>
                      <span className="text-indigo-600 font-bold group-hover:underline">Audit Record →</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Stream Footer Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 gap-2 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Audit Stream: <strong className="text-slate-800">ACTIVE</strong></span>
          </span>
          <span>•</span>
          <span>Total Stream Logs: <strong className="text-slate-800">{stream.length}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStream([])}
            className="text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 font-bold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Feed</span>
          </button>
        </div>
      </div>

      {/* Manual Intervention Modal */}
      {isInterventionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg space-y-4 p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Log Manual Engineer Intervention</h3>
                  <p className="text-xs text-slate-500">Record a compliance audit checkpoint or manual override.</p>
                </div>
              </div>
              <button
                onClick={() => setIsInterventionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualIntervention} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Operator Name</label>
                  <input
                    type="text"
                    value={customOperatorName}
                    onChange={(e) => setCustomOperatorName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role Context</label>
                  <select
                    value={customOperatorRole}
                    onChange={(e) => setCustomOperatorRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                  >
                    <option value="Lead Architect">Lead Architect</option>
                    <option value="Data Engineer">Data Engineer</option>
                    <option value="Security Admin">Security Admin</option>
                    <option value="Compliance Officer">Compliance Officer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Action Category</label>
                <select
                  value={customActionType}
                  onChange={(e) => setCustomActionType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                >
                  <option value="MIGRATION">MIGRATION (Pipeline adjustments)</option>
                  <option value="CONFIG">CONFIG (Throttling / Settings)</option>
                  <option value="MAPPING">MAPPING (Schema & AI Rules)</option>
                  <option value="SECURITY">SECURITY (GDPR / PII Tokenization)</option>
                  <option value="SCALE">SCALE (Cluster & Pod Limits)</option>
                  <option value="SYSTEM">SYSTEM (System Overrides)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Action Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Manually Cleared Lock File on SAP Connection"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Detailed Description & Context</label>
                <textarea
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  rows={3}
                  placeholder="Provide technical rationale for manual override..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInterventionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-2xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Commit Intervention Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected System Event Side Panel Drawer */}
      {selectedAuditLog && (() => {
        const payload = getEventJsonPayload(selectedAuditLog);
        const jsonString = JSON.stringify(payload, null, 2);

        return (
          <>
            {/* Dark Backdrop Overlay */}
            <div
              onClick={() => setSelectedAuditLog(null)}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            />

            {/* Slide-over Side Panel */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Event details side panel for ${selectedAuditLog.title}`}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900 text-slate-100 shadow-2xl border-l border-slate-800 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200"
            >
              {/* Panel Top Navigation & Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/80 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                      {getStatusIcon(selectedAuditLog.status)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusBadgeColor(selectedAuditLog.status)}`}>
                          {selectedAuditLog.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadgeColor(selectedAuditLog.actionType)}`}>
                          {selectedAuditLog.actionType}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white truncate mt-1">
                        {selectedAuditLog.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedAuditLog(null)}
                    aria-label="Close event inspection side panel"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tab Switcher: Metadata vs JSON Payload */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setSidePanelTab('METADATA')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      sidePanelTab === 'METADATA'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Metadata & Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSidePanelTab('JSON')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      sidePanelTab === 'JSON'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Full JSON Payload</span>
                  </button>
                </div>
              </div>

              {/* Panel Content Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-800">
                {sidePanelTab === 'METADATA' ? (
                  <div className="space-y-4">
                    {/* Execution Details Box */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Detailed Description & Log Message
                      </span>
                      <p className="text-slate-200 font-sans text-xs leading-relaxed">
                        {selectedAuditLog.details}
                      </p>
                    </div>

                    {/* Key Attributes Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase">Actor / Operator</span>
                        <p className="font-bold text-indigo-400 truncate">{selectedAuditLog.userName}</p>
                        <p className="text-[10px] text-slate-400">{selectedAuditLog.userRole}</p>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase">Target Resource</span>
                        <p className="font-bold text-slate-200 truncate">{selectedAuditLog.targetResource || 'Platform Core'}</p>
                        <p className="text-[10px] text-slate-400">Node: k8s-worker-pool-04</p>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase">Timestamp</span>
                        <p className="font-bold text-slate-200">{selectedAuditLog.timestamp}</p>
                        <p className="text-[10px] text-slate-400">{selectedAuditLog.relativeTime}</p>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase">Trace & Status</span>
                        <p className="font-bold text-emerald-400">Status Code: 200 OK</p>
                        <p className="text-[10px] text-slate-400 font-mono">Trace: {payload.telemetry_metadata.trace_id}</p>
                      </div>
                    </div>

                    {/* Audit Security & Hash Verification */}
                    <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="uppercase font-bold text-slate-500">Compliance & Integrity Check</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 break-all font-mono bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                        {payload.execution_context.audit_hash}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {payload.execution_context.compliance_flags.map((flag) => (
                          <span key={flag} className="px-2 py-0.5 bg-slate-900 text-slate-400 text-[10px] font-mono rounded border border-slate-800">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* JSON Toolbar */}
                    <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400 text-[11px] font-mono flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-indigo-400" />
                        <span>event_payload.json</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(jsonString);
                            setCopiedJson(true);
                            setTimeout(() => setCopiedJson(false), 2000);
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                        >
                          {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([jsonString], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `event-${selectedAuditLog.id}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export</span>
                        </button>
                      </div>
                    </div>

                    {/* JSON Code Viewer */}
                    <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed shadow-inner selection:bg-indigo-900 selection:text-indigo-100">
                      <code>{jsonString}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Panel Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Event ID: {selectedAuditLog.id}</span>
                <button
                  type="button"
                  onClick={() => setSelectedAuditLog(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
};
