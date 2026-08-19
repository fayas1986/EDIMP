import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Activity,
  Zap,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  HardDrive,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  Search,
  Maximize2,
  Minimize2,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Globe,
  Briefcase,
  FolderGit2,
  Server,
  Layers,
  X,
  Check,
  TrendingUp,
  Clock,
  BellRing,
  ExternalLink,
  Plus
} from 'lucide-react';

export type AlertSeverity = 'Critical' | 'Warning' | 'Info';
export type AlertStatus = 'Active' | 'Investigating' | 'Resolved';
export type TopologyTier = 'Platform' | 'Partner' | 'Customer' | 'Project';

export interface SpikeAlert {
  id: string;
  title: string;
  nodeCode: string;
  nodeName: string;
  tier: TopologyTier;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: string;
  metricType: 'vCPU' | 'RAM' | 'DB Connections' | 'Latency' | 'Rate Limit' | 'I/O Throttle';
  currentValue: string;
  thresholdValue: string;
  impactDescription: string;
  recommendedAction: string;
  remediatedBy?: string;
  remediatedAt?: string;
}

const INITIAL_ALERTS: SpikeAlert[] = [
  {
    id: 'ALT-1092',
    title: 'Critical vCPU Spike & Compute Exhaustion',
    nodeCode: 'PROJ-001-A',
    nodeName: 'Project A (ERP Sync)',
    tier: 'Project',
    severity: 'Critical',
    status: 'Active',
    timestamp: '2 mins ago',
    metricType: 'vCPU',
    currentValue: '98.4%',
    thresholdValue: '80.0%',
    impactDescription: 'Heavy ETL pipeline job causing thread starvation on shared node worker process. Downstream latency +420ms.',
    recommendedAction: 'Trigger immediate vCPU auto-scaling (+4 vCPUs) or apply worker pool queue throttling.',
  },
  {
    id: 'ALT-1088',
    title: 'Database Connection Pool Saturation',
    nodeCode: 'CUST-001',
    nodeName: 'Customer 001 (Acme Corp)',
    tier: 'Customer',
    severity: 'Critical',
    status: 'Active',
    timestamp: '5 mins ago',
    metricType: 'DB Connections',
    currentValue: '960 / 1000',
    thresholdValue: '850 / 1000',
    impactDescription: 'Unclosed transaction blocks in high-frequency webhooks triggering connection leakage across tenant schema.',
    recommendedAction: 'Drain stagnant DB connections and enforce connection pooling backpressure.',
  },
  {
    id: 'ALT-1075',
    title: 'Memory Utilization Warning & GC Pressure',
    nodeCode: 'PARTNER-A',
    nodeName: 'Partner A (Alpha Cloud)',
    tier: 'Partner',
    severity: 'Warning',
    status: 'Investigating',
    timestamp: '12 mins ago',
    metricType: 'RAM',
    currentValue: '28.4 GB / 32 GB',
    thresholdValue: '24 GB / 32 GB',
    impactDescription: 'Garbage collection pause cycles reaching 340ms during batch export payload serialization.',
    recommendedAction: 'Expand node memory ceiling to 48GB or force chunked payload streaming.',
  },
  {
    id: 'ALT-1062',
    title: 'SSE Telemetry Stream Latency Degradation',
    nodeCode: 'EDMP-ROOT',
    nodeName: 'EDMP Platform Root',
    tier: 'Platform',
    severity: 'Warning',
    status: 'Resolved',
    timestamp: '28 mins ago',
    metricType: 'Latency',
    currentValue: '185 ms',
    thresholdValue: '100 ms',
    impactDescription: 'Kafka event ingress node experienced transient queue congestion during peak hour sync.',
    recommendedAction: 'Auto-balanced partition offsets across standby broker replicas.',
    remediatedBy: 'Auto-Scaling Bot',
    remediatedAt: '22 mins ago',
  },
  {
    id: 'ALT-1051',
    title: 'Rate Limit Threshold Exceeded (HTTP 429)',
    nodeCode: 'PROJ-001-B',
    nodeName: 'Project B (Analytics Workspace)',
    tier: 'Project',
    severity: 'Info',
    status: 'Resolved',
    timestamp: '45 mins ago',
    metricType: 'Rate Limit',
    currentValue: '1,240 r/s',
    thresholdValue: '1,000 r/s',
    impactDescription: 'Burst quota triggered leaky-bucket algorithm throttling non-critical API requests.',
    recommendedAction: 'Increased burst window allowance for premium tier tenant.',
    remediatedBy: 'Tenant Admin',
    remediatedAt: '40 mins ago',
  }
];

export const ResourceSpikeNotificationPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<SpikeAlert[]>(INITIAL_ALERTS);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<SpikeAlert | null>(null);

  // Simulated live event feed stream
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      // 25% chance of generating a new random alert every 12 seconds
      if (Math.random() < 0.25) {
        const nodes = [
          { code: 'PROJ-001-A', name: 'Project A (ERP Sync)', tier: 'Project' as TopologyTier },
          { code: 'CUST-002', name: 'Customer 002 (Beta Tech)', tier: 'Customer' as TopologyTier },
          { code: 'PARTNER-B', name: 'Partner B (Global Systems)', tier: 'Partner' as TopologyTier },
          { code: 'EDMP-ROOT', name: 'EDMP Platform Root', tier: 'Platform' as TopologyTier },
        ];
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        const metrics: ('vCPU' | 'RAM' | 'DB Connections' | 'Latency')[] = ['vCPU', 'RAM', 'DB Connections', 'Latency'];
        const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];

        const newAlert: SpikeAlert = {
          id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
          title: `Real-Time ${randomMetric} Anomaly Detected`,
          nodeCode: randomNode.code,
          nodeName: randomNode.name,
          tier: randomNode.tier,
          severity: Math.random() > 0.4 ? 'Critical' : 'Warning',
          status: 'Active',
          timestamp: 'Just now',
          metricType: randomMetric,
          currentValue: randomMetric === 'vCPU' ? `${(88 + Math.random() * 10).toFixed(1)}%` : randomMetric === 'RAM' ? `${(29 + Math.random() * 2).toFixed(1)} GB` : `${Math.floor(120 + Math.random() * 200)} ms`,
          thresholdValue: randomMetric === 'vCPU' ? '80.0%' : randomMetric === 'RAM' ? '24.0 GB' : '100 ms',
          impactDescription: `Live telemetry feed recorded abnormal ${randomMetric} workload activity on node ${randomNode.code}.`,
          recommendedAction: 'Review topology resource quotas or execute targeted auto-scaling.',
        };

        setAlerts((prev) => [newAlert, ...prev.slice(0, 19)]);
        triggerToast(`New ${newAlert.severity} Alert: ${newAlert.nodeCode} - ${newAlert.title}`);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const triggerToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => {
      setNotificationToast(null);
    }, 4500);
  };

  const simulateManualSpike = () => {
    const manualAlert: SpikeAlert = {
      id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'Manual Test: Critical Memory & I/O Spike',
      nodeCode: 'PROJ-001-A',
      nodeName: 'Project A (ERP Migration)',
      tier: 'Project',
      severity: 'Critical',
      status: 'Active',
      timestamp: 'Just now',
      metricType: 'RAM',
      currentValue: '15.8 GB / 16 GB',
      thresholdValue: '12 GB / 16 GB',
      impactDescription: 'Simulated high-throughput memory heap burst initiated by Tenant Admin test procedure.',
      recommendedAction: 'Trigger immediate vCPU & Memory auto-expansion or clear payload cache.',
    };

    setAlerts((prev) => [manualAlert, ...prev]);
    triggerToast('⚡ Simulated critical resource spike injected into live feed!');
  };

  const handleAutoScale = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'Investigating',
              impactDescription: `${a.impactDescription} [AUTO-SCALING ENGAGED: Allocated +4 vCPU / +16GB RAM].`,
              remediatedBy: 'Admin (Auto-Scale Action)',
              remediatedAt: 'Just now',
            }
          : a
      )
    );
    triggerToast(`Auto-scale executed for node. Resources scaled successfully.`);
  };

  const handleThrottleQuota = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'Investigating',
              impactDescription: `${a.impactDescription} [QUOTA THROTTLED: Enforced 500 req/sec rate limit].`,
              remediatedBy: 'Admin (Throttle Action)',
              remediatedAt: 'Just now',
            }
          : a
      )
    );
    triggerToast(`Quota rate-limiting enforced on node.`);
  };

  const handleResolveAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'Resolved',
              remediatedBy: 'Tenant Admin',
              remediatedAt: 'Just now',
            }
          : a
      )
    );
    triggerToast(`Alert ${id} marked as resolved.`);
  };

  const filteredAlerts = alerts.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nodeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nodeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.impactDescription.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = selectedSeverity === 'All' || item.severity === selectedSeverity;
    const matchesTier = selectedTier === 'All' || item.tier === selectedTier;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;

    return matchesSearch && matchesSeverity && matchesTier && matchesStatus;
  });

  const activeCriticalCount = alerts.filter((a) => a.severity === 'Critical' && a.status !== 'Resolved').length;
  const activeWarningCount = alerts.filter((a) => a.severity === 'Warning' && a.status !== 'Resolved').length;
  const resolvedCount = alerts.filter((a) => a.status === 'Resolved').length;

  const tierBadgeColor = (tier: TopologyTier) => {
    switch (tier) {
      case 'Platform':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Partner':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Customer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Project':
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const severityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            Critical Spike
          </span>
        );
      case 'Warning':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Degradation Warning
          </span>
        );
      case 'Info':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
            <Activity className="w-3 h-3 text-indigo-600" />
            Info Telemetry
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 space-y-6 shadow-xs relative">
      {/* Toast Notification Banner */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <BellRing className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-mono font-medium">{notificationToast}</span>
          <button
            type="button"
            onClick={() => setNotificationToast(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Panel Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center gap-1.5 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> REAL-TIME TELEMETRY ANOMALIES
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono">
              Topology Monitor Active
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" /> Resource Spike &amp; Service Degradation Alerts
          </h2>

          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            Continuous real-time anomaly detection engine monitoring compute CPU/RAM exhaustion, DB connection pool leaks, SSE stream queue latency, and rate-limiting quotas across tenant nodes.
          </p>
        </div>

        {/* Stream Controls & Trigger Simulation */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={simulateManualSpike}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-white" />
            <span>Simulate Resource Spike</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isLiveStreaming
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {isLiveStreaming ? <Pause className="w-3.5 h-3.5 text-emerald-600" /> : <Play className="w-3.5 h-3.5 text-slate-600" />}
            <span>{isLiveStreaming ? 'SSE Feed Live' : 'Feed Paused'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Alert Sound' : 'Unmute Alert Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Critical Resource Spikes</div>
          <div className="text-xl font-black text-rose-600 mt-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            {activeCriticalCount} Active
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Requires immediate vCPU/RAM action</div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Degradation Warnings</div>
          <div className="text-xl font-black text-amber-600 mt-1 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            {activeWarningCount} Warnings
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Latency or memory threshold alerts</div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Auto-Remediated Events</div>
          <div className="text-xl font-black text-emerald-600 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {resolvedCount} Resolved
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Handled via auto-scale or throttle</div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Topology Health Score</div>
          <div className="text-xl font-black text-indigo-700 mt-1 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-600" />
            {activeCriticalCount > 0 ? '97.2%' : '99.8%'} Nominal
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero cross-tenant leakage</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search alerts by tenant code, metric, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
        </div>

        {/* Severity Select */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Severity:</span>
          {['All', 'Critical', 'Warning', 'Info'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                selectedSeverity === sev
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Tier Select */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Tier:</span>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold outline-none cursor-pointer shadow-2xs"
          >
            <option value="All">All Tiers</option>
            <option value="Platform">Platform</option>
            <option value="Partner">Partner</option>
            <option value="Customer">Customer</option>
            <option value="Project">Project</option>
          </select>
        </div>

        {/* Status Select */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold outline-none cursor-pointer shadow-2xs"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm text-slate-800">No Resource Spike Alerts Match Your Filters</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All topology nodes are operating within normal compute, memory, and database connection thresholds.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isResolved = alert.status === 'Resolved';
            const isCritical = alert.severity === 'Critical';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isResolved
                    ? 'bg-slate-50/60 border-slate-200 opacity-80'
                    : isCritical
                    ? 'bg-rose-50/30 border-rose-200 shadow-2xs'
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {severityBadge(alert.severity)}

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${tierBadgeColor(alert.tier)}`}>
                      {alert.tier}: {alert.nodeCode}
                    </span>

                    <span className="text-xs font-extrabold text-slate-900">{alert.nodeName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{alert.timestamp}</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-slate-700">ID: {alert.id}</span>
                  </div>
                </div>

                {/* Content Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  <div className="md:col-span-8 space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{alert.impactDescription}</p>

                    <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      <span className="text-slate-500 font-semibold">Recommended Fix:</span>
                      <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {alert.recommendedAction}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Metric Gauge Card */}
                  <div className="md:col-span-4 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold">
                      <span>Metric: {alert.metricType}</span>
                      <span>Limit</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-base font-extrabold ${isCritical ? 'text-rose-600' : 'text-amber-600'}`}>
                        {alert.currentValue}
                      </span>
                      <span className="text-xs text-slate-600 font-bold">{alert.thresholdValue}</span>
                    </div>

                    {alert.remediatedBy && (
                      <div className="pt-1 border-t border-slate-200 text-[9px] text-emerald-700 flex items-center justify-between font-bold">
                        <span>Remediated by: {alert.remediatedBy}</span>
                        <span>{alert.remediatedAt}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                {!isResolved && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAutoScale(alert.id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-2xs flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                      >
                        <Zap className="w-3.5 h-3.5 text-white" />
                        <span>Auto-Scale Node (+4 vCPU / 16GB)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleThrottleQuota(alert.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                        <span>Throttle Quota Rate Limit</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Acknowledge &amp; Mark Resolved</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
