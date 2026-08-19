import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Connector, MigrationJob, ThrottlingConfig } from '../types';
import * as d3 from 'd3';
import {
  Network,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Play,
  Pause,
  Sliders,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Wifi,
  WifiOff,
  Gauge,
  Server,
  Code,
  Building2,
  Users,
  FileSpreadsheet,
  SlidersHorizontal,
  Globe,
  Info,
} from 'lucide-react';

const REGIONS = [
  { id: 'us-east', name: 'US East', provider: 'AWS N. Virginia', multiplier: 1.0, baseOffset: 12 },
  { id: 'us-west', name: 'US West', provider: 'AWS Oregon', multiplier: 1.25, baseOffset: 38 },
  { id: 'eu-central', name: 'EU Central', provider: 'Azure Frankfurt', multiplier: 1.7, baseOffset: 68 },
  { id: 'ap-northeast', name: 'AP Northeast', provider: 'GCP Tokyo', multiplier: 2.3, baseOffset: 115 },
  { id: 'sa-east', name: 'SA East', provider: 'Oracle São Paulo', multiplier: 2.7, baseOffset: 155 },
];

interface GlobalConnectionHealthViewProps {
  connectors: Connector[];
  jobs: MigrationJob[];
  onNavigateTab?: (tab: string) => void;
  onTestConnector?: (connectorId: string) => void;
  onUpdateConnectorThrottling?: (connectorId: string, config: ThrottlingConfig) => void;
}

export const GlobalConnectionHealthView: React.FC<GlobalConnectionHealthViewProps> = ({
  connectors: initialConnectors,
  jobs: initialJobs,
  onNavigateTab,
  onTestConnector,
  onUpdateConnectorThrottling,
}) => {
  // Real local state so we can dynamically simulate and interact in real-time
  const [connectors, setConnectors] = useState<Connector[]>(initialConnectors);
  const [jobs, setJobs] = useState<MigrationJob[]>(initialJobs);

  // Simulation parameters
  const [injectedLatency, setInjectedLatency] = useState<number>(0); // ms spike
  const [offlineConnectorIds, setOfflineConnectorIds] = useState<string[]>([]);
  const [isSimulatingSpike, setIsSimulatingSpike] = useState<boolean>(false);
  const [rateLimitOverrides, setRateLimitOverrides] = useState<Record<string, number>>({});
  const [diagnosticLogs, setDiagnosticLogs] = useState<{ timestamp: string; level: 'info' | 'warn' | 'success'; message: string }[]>([
    { timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Diagnostic engine initialized. Monitoring 9 connectors.' },
    { timestamp: new Date().toLocaleTimeString(), level: 'success', message: 'Cross-referencing 5 active migration jobs with topology registry.' }
  ]);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [highlightSlowOnly, setHighlightSlowOnly] = useState<boolean>(false);
  const [heatmapOverlayMode, setHeatmapOverlayMode] = useState<'latency' | 'errors'>('latency');
  const d3OverlayRef = useRef<SVGSVGElement | null>(null);
  const [hoveredHeatSpot, setHoveredHeatSpot] = useState<{
    id: string;
    connectorName: string;
    regionName: string;
    errorRate: number;
    errorCount: number;
    status: string;
    cx: number;
    cy: number;
  } | null>(null);

  // Path Tracing States
  const [traceJobId, setTraceJobId] = useState<string>('job-101');
  const [traceRegionId, setTraceRegionId] = useState<string>('all');
  const [tableDimensions, setTableDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [pathLines, setPathLines] = useState<{
    id: string;
    fromX: number;
    fromY: number;
    midX: number;
    midY: number;
    toX: number;
    toY: number;
    regionName: string;
    latency: number;
    isOffline: boolean;
  }[]>([]);

  // Sync with initial props when they change
  useEffect(() => {
    setConnectors(initialConnectors);
  }, [initialConnectors]);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  // Periodic simulated polling/tick to keep throughput data alive and moving
  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate job throughputs slightly
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          if (job.status !== 'Running') return job;
          const fluctuation = Math.floor(Math.random() * 40) - 20;
          const originalThroughput = job.throughputRps || 120;
          const newThroughput = Math.max(25, originalThroughput + fluctuation);
          return {
            ...job,
            throughputRps: newThroughput,
          };
        })
      );

      // Random healthy status ticker
      if (Math.random() > 0.85) {
        const time = new Date().toLocaleTimeString();
        const randLogMessages = [
          'Heartbeat ping succeeded for all cloud gateways.',
          'PostgreSQL relational write buffers synchronized.',
          'Dynamics 365 Business Central API rate compliance at 100%.',
          'SAP extraction buffer allocation optimal (62% free).'
        ];
        const msg = randLogMessages[Math.floor(Math.random() * randLogMessages.length)];
        setDiagnosticLogs(prev => [
          { timestamp: time, level: 'info', message: msg },
          ...prev.slice(0, 15)
        ]);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Compute calculated values with applied simulation parameters
  const activeConnectors = useMemo(() => {
    return connectors.map(c => {
      let status = c.status;
      if (offlineConnectorIds.includes(c.id)) {
        status = 'Disconnected';
      }
      
      const latencyMs = (c.latencyMs || 25) + injectedLatency;

      const overriddenMaxRequests = rateLimitOverrides[c.id] !== undefined
        ? rateLimitOverrides[c.id]
        : (c.throttlingConfig?.maxRequestsPerSecond || 150);

      const throttlingConfig: ThrottlingConfig = {
        isEnabled: c.throttlingConfig?.isEnabled ?? (c.id === 'conn-excel-files' || c.id === 'conn-postgres-warehouse' ? false : true),
        maxRequestsPerSecond: overriddenMaxRequests,
        maxConcurrentRequests: c.throttlingConfig?.maxConcurrentRequests || 10,
        retryStrategy: c.throttlingConfig?.retryStrategy || 'ExponentialBackoff',
        maxRetries: c.throttlingConfig?.maxRetries || 5,
        burstLimit: c.throttlingConfig?.burstLimit,
        autoCooldownOn429: c.throttlingConfig?.autoCooldownOn429 ?? true,
        cooldownPeriodSeconds: c.throttlingConfig?.cooldownPeriodSeconds || 30,
      };

      return {
        ...c,
        status,
        latencyMs,
        throttlingConfig,
      };
    });
  }, [connectors, offlineConnectorIds, injectedLatency, rateLimitOverrides]);

  // Identify Bottlenecks
  const systemBottlenecks = useMemo(() => {
    const list: {
      connectorId: string;
      connectorName: string;
      type: 'Offline' | 'HighLatency' | 'ThrottlingCongestion' | 'UnusedConfigured';
      severity: 'critical' | 'high' | 'warning' | 'info';
      message: string;
      metrics: string;
      actionText: string;
      remedyType: 'retest' | 'increase_limit' | 'configure_rate_limiting' | 'start_job';
    }[] = [];

    activeConnectors.forEach(c => {
      // Find jobs connected to this connector
      const associatedJobs = jobs.filter(j => j.sourceConnectorId === c.id || j.destConnectorId === c.id);
      const runningJobs = associatedJobs.filter(j => j.status === 'Running');
      const totalTps = runningJobs.reduce((sum, j) => sum + (j.throughputRps || 0), 0);

      // Case 1: Connector is Offline but has running jobs -> CRITICAL
      if (c.status === 'Disconnected' || c.status === 'Error') {
        if (runningJobs.length > 0) {
          list.push({
            connectorId: c.id,
            connectorName: c.name,
            type: 'Offline',
            severity: 'critical',
            message: `Connector is currently offline/disconnected, completely blocking ${runningJobs.length} active migration pipelines!`,
            metrics: `${runningJobs.length} blocked jobs`,
            actionText: 'Trigger Gateway Reconnection Test',
            remedyType: 'retest'
          });
        } else {
          list.push({
            connectorId: c.id,
            connectorName: c.name,
            type: 'Offline',
            severity: 'warning',
            message: 'System connector is offline. No running pipelines depend on it currently, but future scheduling is blocked.',
            metrics: '0 active dependencies',
            actionText: 'Verify Host endpoint',
            remedyType: 'retest'
          });
        }
      }

      // Case 2: High Latency (> 80ms) and has running jobs -> HIGH
      if (c.status === 'Connected' && (c.latencyMs || 0) > 85 && runningJobs.length > 0) {
        list.push({
          connectorId: c.id,
          connectorName: c.name,
          type: 'HighLatency',
          severity: 'high',
          message: `Elevated system response latency of ${c.latencyMs}ms is limiting maximum packet transfer speeds.`,
          metrics: `${c.latencyMs}ms delay`,
          actionText: 'Rerun Packet Ingress Test',
          remedyType: 'retest'
        });
      }

      // Case 3: Throttling Congestion (> 80% capacity utilization)
      if (c.status === 'Connected' && c.throttlingConfig?.isEnabled && runningJobs.length > 0) {
        const limit = c.throttlingConfig.maxRequestsPerSecond;
        const utilization = Math.round((totalTps / limit) * 100);
        
        if (utilization >= 85) {
          list.push({
            connectorId: c.id,
            connectorName: c.name,
            type: 'ThrottlingCongestion',
            severity: utilization >= 95 ? 'high' : 'warning',
            message: `Throughput rate (${totalTps} RPS) is pushing up against the max throttling allocation limit of ${limit} RPS. Bottleneck queue delays likely.`,
            metrics: `${utilization}% utilization`,
            actionText: 'Double Throttling Cap (+100%)',
            remedyType: 'increase_limit'
          });
        }
      }

      // Case 4: No throttling configured for heavy parallel loads -> WARNING
      if (c.status === 'Connected' && !c.throttlingConfig?.isEnabled && runningJobs.length > 0 && totalTps > 200) {
        list.push({
          connectorId: c.id,
          connectorName: c.name,
          type: 'UnusedConfigured',
          severity: 'warning',
          message: `Ingestion speed (${totalTps} RPS) is unthrottled. Destination risk of database buffer starvation or rate-limit lockouts.`,
          metrics: `Unthrottled ${totalTps} RPS`,
          actionText: 'Enable Rate Limiting',
          remedyType: 'configure_rate_limiting'
        });
      }
    });

    return list;
  }, [activeConnectors, jobs]);

  // Global Health Score calculation
  const globalHealthScore = useMemo(() => {
    let score = 100;
    
    // Deduct points based on bottleneck severity
    systemBottlenecks.forEach(b => {
      if (b.severity === 'critical') score -= 18;
      else if (b.severity === 'high') score -= 10;
      else if (b.severity === 'warning') score -= 5;
      else score -= 2;
    });

    return Math.max(12, score);
  }, [systemBottlenecks]);

  // Connector Icon resolver
  const getConnectorIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return <Building2 className="w-4 h-4 text-slate-500" />;
      case 'Database': return <Database className="w-4 h-4 text-slate-500" />;
      case 'FileSpreadsheet': return <FileSpreadsheet className="w-4 h-4 text-slate-500" />;
      case 'Layers': return <Layers className="w-4 h-4 text-slate-500" />;
      case 'Users': return <Users className="w-4 h-4 text-slate-500" />;
      case 'Server': return <Server className="w-4 h-4 text-slate-500" />;
      case 'Cloud': return <Server className="w-4 h-4 text-slate-500" />;
      case 'Code': return <Code className="w-4 h-4 text-slate-500" />;
      default: return <Database className="w-4 h-4 text-slate-500" />;
    }
  };

  // Quick Remediation Handler
  const handleRemedyAction = (
    connectorId: string, 
    type: 'retest' | 'increase_limit' | 'configure_rate_limiting' | 'start_job'
  ) => {
    const timestampStr = new Date().toLocaleTimeString();
    const conn = activeConnectors.find(c => c.id === connectorId);
    if (!conn) return;

    if (type === 'retest') {
      // Simulate checking connection latency resetting and restoring
      setDiagnosticLogs(prev => [
        { timestamp: timestampStr, level: 'info', message: `Executing deep-packet network diagnostic ping to ${conn.name}...` },
        ...prev
      ]);
      
      setTimeout(() => {
        // If it was offline, bring it back online
        if (offlineConnectorIds.includes(connectorId)) {
          setOfflineConnectorIds(prev => prev.filter(id => id !== connectorId));
          setDiagnosticLogs(prev => [
            { timestamp: new Date().toLocaleTimeString(), level: 'success', message: `Connection restored successfully! Host gateway ${conn.name} is fully accessible.` },
            ...prev
          ]);
        } else {
          // Normal test
          setDiagnosticLogs(prev => [
            { timestamp: new Date().toLocaleTimeString(), level: 'success', message: `Connectivity check passed. Latency stable at ${conn.latencyMs - injectedLatency}ms.` },
            ...prev
          ]);
        }
        
        if (onTestConnector) {
          onTestConnector(connectorId);
        }
      }, 1000);
    } 
    else if (type === 'increase_limit') {
      const currentLimit = conn.throttlingConfig?.maxRequestsPerSecond || 60;
      const nextLimit = currentLimit * 2;
      setRateLimitOverrides(prev => ({
        ...prev,
        [connectorId]: nextLimit
      }));
      
      setDiagnosticLogs(prev => [
        { timestamp: timestampStr, level: 'success', message: `Optimized: Doubled rate-limiting throttle on ${conn.name} to ${nextLimit} RPS to absorb parallel queue pressure.` },
        ...prev
      ]);

      if (onUpdateConnectorThrottling && conn.throttlingConfig) {
        onUpdateConnectorThrottling(connectorId, {
          ...conn.throttlingConfig,
          maxRequestsPerSecond: nextLimit
        });
      }
    } 
    else if (type === 'configure_rate_limiting') {
      // Turn on rate limiting safely
      setRateLimitOverrides(prev => ({
        ...prev,
        [connectorId]: 120
      }));
      setDiagnosticLogs(prev => [
        { timestamp: timestampStr, level: 'success', message: `Safety Override: Engaged backpressure rate limiting on ${conn.name} (capped at 120 RPS) to safeguard database queues.` },
        ...prev
      ]);
    }
  };

  // Latency Spike Simulation Toggle
  const handleToggleLatencySpike = () => {
    const timestampStr = new Date().toLocaleTimeString();
    if (injectedLatency > 0) {
      setInjectedLatency(0);
      setDiagnosticLogs(prev => [
        { timestamp: timestampStr, level: 'success', message: 'Global latency injection removed. Returning to normal fiber speeds.' },
        ...prev
      ]);
    } else {
      setInjectedLatency(150);
      setDiagnosticLogs(prev => [
        { timestamp: timestampStr, level: 'warn', message: 'CRITICAL EVENT TRIGGERED: Injected 150ms of network routing jitter. Check pipeline flow speeds!' },
        ...prev
      ]);
    }
  };

  // Disconnect Random Connector Simulation
  const handleSimulateDisconnection = () => {
    const timestampStr = new Date().toLocaleTimeString();
    const onlineConnectors = activeConnectors.filter(c => c.status === 'Connected' && !offlineConnectorIds.includes(c.id));
    
    if (onlineConnectors.length === 0) {
      setOfflineConnectorIds([]);
      setDiagnosticLogs(prev => [
        { timestamp: timestampStr, level: 'success', message: 'Reconnected all simulated offline systems.' },
        ...prev
      ]);
      return;
    }

    // Pick a random connector to fail
    const target = onlineConnectors[Math.floor(Math.random() * onlineConnectors.length)];
    setOfflineConnectorIds(prev => [...prev, target.id]);
    setDiagnosticLogs(prev => [
      { timestamp: timestampStr, level: 'warn', message: `CRITICAL OUTAGE OUTBREAK: Simulated sudden connection failure on ${target.name}. Monitoring queue backlash.` },
      ...prev
    ]);
  };

  // Automated optimization: automatically fixes all rate limiting and high-load warnings
  const handleTriggerAutoOptimization = () => {
    setIsSimulatingSpike(true);
    const timestampStr = new Date().toLocaleTimeString();
    
    setTimeout(() => {
      // Find throttling congestion cases and automatically bump their rate limiting cap
      const remedies: Record<string, number> = {};
      activeConnectors.forEach(c => {
        const associatedJobs = jobs.filter(j => j.sourceConnectorId === c.id || j.destConnectorId === c.id);
        const runningJobs = associatedJobs.filter(j => j.status === 'Running');
        const totalTps = runningJobs.reduce((sum, j) => sum + (j.throughputRps || 0), 0);

        if (c.throttlingConfig?.isEnabled && totalTps > 0) {
          const currentLimit = c.throttlingConfig.maxRequestsPerSecond;
          if (totalTps >= currentLimit * 0.8) {
            remedies[c.id] = Math.ceil(totalTps * 1.5);
          }
        }
      });

      setRateLimitOverrides(prev => ({
        ...prev,
        ...remedies
      }));

      // Clear offline systems
      setOfflineConnectorIds([]);
      setInjectedLatency(0);

      setDiagnosticLogs(prev => [
        { timestamp: timestampStr, level: 'success', message: 'AI Optimization Complete: Elevated congestion thresholds, removed high latencies, and restored healthy active pathways.' },
        ...prev
      ]);
      setIsSimulatingSpike(false);
    }, 1200);
  };

  // Filter connectors list
  const filteredConnectors = useMemo(() => {
    return activeConnectors.filter(c => {
      const matchQuery = c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
                         c.provider.toLowerCase().includes(filterQuery.toLowerCase()) ||
                         c.category.toLowerCase().includes(filterQuery.toLowerCase());
      return matchQuery;
    });
  }, [activeConnectors, filterQuery]);

  const selectedSystem = useMemo(() => {
    if (!selectedSystemId) return null;
    return activeConnectors.find(c => c.id === selectedSystemId) || null;
  }, [activeConnectors, selectedSystemId]);

  // Heatmap statistics calculations
  const heatmapStats = useMemo(() => {
    let totalLatency = 0;
    let count = 0;
    let maxLatencyVal = -1;
    let maxLatencyRoute = 'None';
    let minLatencyVal = 9999;
    let minLatencyRoute = 'None';
    let hopsAtRisk = 0;

    activeConnectors.forEach(c => {
      const isOffline = c.status === 'Disconnected' || offlineConnectorIds.includes(c.id);
      if (isOffline) return;

      REGIONS.forEach(r => {
        const baseLat = c.latencyMs || 25;
        const rawLat = Math.round((baseLat * r.multiplier) + r.baseOffset);
        totalLatency += rawLat;
        count++;

        if (rawLat > maxLatencyVal) {
          maxLatencyVal = rawLat;
          maxLatencyRoute = `${c.name} ➔ ${r.name}`;
        }
        if (rawLat < minLatencyVal) {
          minLatencyVal = rawLat;
          minLatencyRoute = `${c.name} ➔ ${r.name}`;
        }
        if (rawLat >= 120) {
          hopsAtRisk++;
        }
      });
    });

    return {
      average: count > 0 ? Math.round(totalLatency / count) : 0,
      maxVal: maxLatencyVal === -1 ? 0 : maxLatencyVal,
      maxRoute: maxLatencyRoute,
      minVal: minLatencyVal === 9999 ? 0 : minLatencyVal,
      minRoute: minLatencyRoute,
      hopsAtRisk,
    };
  }, [activeConnectors, offlineConnectorIds]);

  const getLatencyColorClass = (latency: number, isOffline: boolean, highlightSlow: boolean) => {
    if (isOffline) {
      return 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer';
    }

    if (highlightSlow && latency < 120) {
      return 'bg-slate-100/50 text-slate-400/70 border-slate-200/50 hover:bg-slate-150 transition-colors opacity-40 cursor-pointer';
    }

    if (latency < 45) {
      return 'bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-xs shadow-emerald-500/10 cursor-pointer transition-colors';
    }
    if (latency < 90) {
      return 'bg-teal-500 hover:bg-teal-600 text-white font-medium shadow-xs shadow-teal-500/10 cursor-pointer transition-colors';
    }
    if (latency < 150) {
      return 'bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold shadow-xs shadow-amber-400/10 cursor-pointer transition-colors';
    }
    if (latency < 220) {
      return 'bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-xs shadow-orange-500/10 cursor-pointer transition-colors';
    }
    return 'bg-rose-600 hover:bg-rose-700 text-white font-bold animate-pulse shadow-sm shadow-rose-600/20 cursor-pointer transition-colors';
  };

  // Dynamically calculate and track Path Tracing line positions
  useEffect(() => {
    const updatePaths = () => {
      const container = document.getElementById('heatmap-grid-table-container');
      if (!container) return;

      setTableDimensions({
        width: container.scrollWidth,
        height: container.scrollHeight,
      });

      const selectedJob = jobs.find(j => j.id === traceJobId);
      const containerRect = container.getBoundingClientRect();
      const lines: typeof pathLines = [];

      if (selectedJob) {
        REGIONS.forEach(r => {
          if (traceRegionId !== 'all' && traceRegionId !== r.id) return;

          const srcId = selectedJob.sourceConnectorId;
          const destId = selectedJob.destConnectorId;

          const srcEl = document.getElementById(`heatmap-cell-${srcId}-${r.id}`);
          const destEl = document.getElementById(`heatmap-cell-${destId}-${r.id}`);

          if (srcEl && destEl) {
            const srcRect = srcEl.getBoundingClientRect();
            const destRect = destEl.getBoundingClientRect();

            // Calculate center coordinates of each cell relative to the scrollable container content
            const fromX = srcRect.left - containerRect.left + container.scrollLeft + srcRect.width / 2;
            const fromY = srcRect.top - containerRect.top + container.scrollTop + srcRect.height / 2;

            const toX = destRect.left - containerRect.left + container.scrollLeft + destRect.width / 2;
            const toY = destRect.top - containerRect.top + container.scrollTop + destRect.height / 2;

            // Latency and Status for this cell
            const srcC = activeConnectors.find(c => c.id === srcId);
            const destC = activeConnectors.find(c => c.id === destId);
            
            const isOffline = (srcC?.status === 'Disconnected' || offlineConnectorIds.includes(srcId)) ||
                              (destC?.status === 'Disconnected' || offlineConnectorIds.includes(destId));

            const baseC = srcC || destC;
            const baseLat = baseC?.latencyMs || 25;
            const cellLatency = Math.round((baseLat * r.multiplier) + r.baseOffset);

            // We draw a curve between the cells. To keep it aesthetically satisfying within the vertical column,
            // we add a horizontal bend (control point) in the middle.
            const offset = 24; // curve offset
            const midX = (fromX + toX) / 2 + (fromY < toY ? offset : -offset);
            const midY = (fromY + toY) / 2;

            lines.push({
              id: `${r.id}`,
              fromX,
              fromY,
              midX,
              midY,
              toX,
              toY,
              regionName: r.name,
              latency: cellLatency,
              isOffline,
            });
          }
        });
      }

      setPathLines(lines);

      // Render D3 Cumulative Error Heatmap Overlay on top of cell nodes
      if (d3OverlayRef.current) {
        const d3Svg = d3.select(d3OverlayRef.current);
        d3Svg.selectAll(".d3-heat-spot-group").remove();

        if (heatmapOverlayMode === 'errors') {
          const heatSpotsData: {
            id: string;
            connectorId: string;
            regionId: string;
            cx: number;
            cy: number;
            errorRate: number;
            errorCount: number;
            connectorName: string;
            regionName: string;
            status: string;
          }[] = [];

          REGIONS.forEach(r => {
            filteredConnectors.forEach(c => {
              const isOffline = c.status === 'Disconnected' || offlineConnectorIds.includes(c.id);
              const el = document.getElementById(`heatmap-cell-${c.id}-${r.id}`);
              if (el) {
                const rect = el.getBoundingClientRect();
                const cx = rect.left - containerRect.left + container.scrollLeft + rect.width / 2;
                const cy = rect.top - containerRect.top + container.scrollTop + rect.height / 2;

                // Calculate realistic cumulative error rates over 24h
                let errorRate = 0.15; // default %
                if (isOffline) {
                  errorRate = 100.0;
                } else {
                  switch (c.id) {
                    case 'conn-bc-prod': errorRate = 0.04; break;
                    case 'conn-excel-files': errorRate = 0.12; break;
                    case 'conn-sfdc-main': errorRate = 4.6; break;
                    case 'conn-sap-s4': errorRate = 1.2; break;
                    case 'conn-sql-legacy': errorRate = 8.4; break;
                    case 'conn-d365-fo': errorRate = 1.9; break;
                    case 'conn-postgres-warehouse': errorRate = 0.35; break;
                    case 'conn-sharepoint-docs': errorRate = 12.1; break;
                    case 'conn-custom-rest': errorRate = 1.75; break;
                  }
                  // Fluctuate on high latency simulation
                  if (injectedLatency > 0) {
                    errorRate = parseFloat((errorRate * 2.2 + 1.5).toFixed(2));
                  }
                }

                const totalRequests24h = c.id === 'conn-excel-files' ? 18000 : 1540000;
                const errorCount = Math.round((totalRequests24h * errorRate) / 100);

                heatSpotsData.push({
                  id: `${c.id}-${r.id}`,
                  connectorId: c.id,
                  regionId: r.id,
                  cx,
                  cy,
                  errorRate,
                  errorCount,
                  connectorName: c.name,
                  regionName: r.name,
                  status: isOffline ? 'Offline' : errorRate >= 5 ? 'Critical' : errorRate >= 1.5 ? 'Degraded' : 'Optimal',
                });
              }
            });
          });

          const group = d3Svg.append("g").attr("class", "d3-heat-spot-group");
          const defs = group.append("defs");

          // Optimal (green radial gradient)
          const optGrad = defs.append("radialGradient").attr("id", "grad-optimal");
          optGrad.append("stop").attr("offset", "0%").attr("stop-color", "#10b981").attr("stop-opacity", 0.45);
          optGrad.append("stop").attr("offset", "100%").attr("stop-color", "#10b981").attr("stop-opacity", 0);

          // Degraded (yellow/amber radial gradient)
          const degGrad = defs.append("radialGradient").attr("id", "grad-degraded");
          degGrad.append("stop").attr("offset", "0%").attr("stop-color", "#f59e0b").attr("stop-opacity", 0.6);
          degGrad.append("stop").attr("offset", "100%").attr("stop-color", "#f59e0b").attr("stop-opacity", 0);

          // Critical (rose/red radial gradient)
          const critGrad = defs.append("radialGradient").attr("id", "grad-critical");
          critGrad.append("stop").attr("offset", "0%").attr("stop-color", "#f43f5e").attr("stop-opacity", 0.75);
          critGrad.append("stop").attr("offset", "100%").attr("stop-color", "#f43f5e").attr("stop-opacity", 0);

          // Offline (crimson deep radial gradient)
          const offGrad = defs.append("radialGradient").attr("id", "grad-offline");
          offGrad.append("stop").attr("offset", "0%").attr("stop-color", "#be123c").attr("stop-opacity", 0.85);
          offGrad.append("stop").attr("offset", "100%").attr("stop-color", "#be123c").attr("stop-opacity", 0);

          // Render soft pulse halos
          group.selectAll(".d3-pulse-halo")
            .data(heatSpotsData)
            .enter()
            .append("circle")
            .attr("class", "d3-pulse-halo")
            .attr("cx", d => d.cx)
            .attr("cy", d => d.cy)
            .attr("r", d => {
              if (d.status === 'Offline') return 34;
              if (d.status === 'Critical') return 26;
              if (d.status === 'Degraded') return 20;
              return 12;
            })
            .attr("fill", d => {
              if (d.status === 'Offline') return "url(#grad-offline)";
              if (d.status === 'Critical') return "url(#grad-critical)";
              if (d.status === 'Degraded') return "url(#grad-degraded)";
              return "url(#grad-optimal)";
            })
            .style("mix-blend-mode", "multiply");

          // Render interactive center core indicator
          group.selectAll(".d3-core-node")
            .data(heatSpotsData)
            .enter()
            .append("circle")
            .attr("class", "d3-core-node")
            .attr("cx", d => d.cx)
            .attr("cy", d => d.cy)
            .attr("r", d => {
              if (d.status === 'Offline') return 10;
              if (d.status === 'Critical') return 7;
              if (d.status === 'Degraded') return 5.5;
              return 4.5;
            })
            .attr("fill", d => {
              if (d.status === 'Offline') return "#be123c";
              if (d.status === 'Critical') return "#f43f5e";
              if (d.status === 'Degraded') return "#f59e0b";
              return "#10b981";
            })
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 1.5)
            .style("pointer-events", "all")
            .style("cursor", "crosshair")
            .on("mouseenter", function(event, d) {
              d3.select(this)
                .transition()
                .duration(120)
                .attr("r", d.status === 'Offline' ? 13 : d.status === 'Critical' ? 10 : 8)
                .attr("stroke-width", 2);
              
              setHoveredHeatSpot({
                id: d.id,
                connectorName: d.connectorName,
                regionName: d.regionName,
                errorRate: d.errorRate,
                errorCount: d.errorCount,
                status: d.status,
                cx: d.cx,
                cy: d.cy
              });
            })
            .on("mouseleave", function(event, d) {
              d3.select(this)
                .transition()
                .duration(120)
                .attr("r", d.status === 'Offline' ? 10 : d.status === 'Critical' ? 7 : d.status === 'Degraded' ? 5.5 : 4.5)
                .attr("stroke-width", 1.5);
              
              setHoveredHeatSpot(null);
            });
        }
      }
    };

    updatePaths();

    window.addEventListener('resize', updatePaths);
    const container = document.getElementById('heatmap-grid-table-container');
    if (container) {
      container.addEventListener('scroll', updatePaths);
    }

    // Interval keep-alive for real-time throughput metrics & fluctuation updates
    const interval = setInterval(updatePaths, 1500);

    return () => {
      window.removeEventListener('resize', updatePaths);
      if (container) {
        container.removeEventListener('scroll', updatePaths);
      }
      clearInterval(interval);
    };
  }, [traceJobId, traceRegionId, filteredConnectors, offlineConnectorIds, injectedLatency, highlightSlowOnly, activeConnectors, jobs, heatmapOverlayMode]);

  return (
    <div id="global-connection-health-wrapper" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Panel */}
      <div id="health-header" className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-mono font-bold rounded-full border border-indigo-100 uppercase tracking-wider">
              Connection Control Matrix & Telemetry Sync
            </span>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5 text-slate-900">
              <Network className="w-6 h-6 text-indigo-600" />
              Global Connection Health Monitor
            </h1>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Real-time cross-reference mapping of relational system endpoints, flatfile storages, and enterprise API providers alongside live running Migration Wizard workflows. Quickly pinpoint and resolve high-contention throttles and blocked pathways.
            </p>
          </div>

          {/* Quick Stats Indicator */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0">
            <div className="text-center border-r border-slate-200 pr-4">
              <div className={`text-3xl font-black tracking-tight ${
                globalHealthScore >= 90 ? 'text-emerald-600' :
                globalHealthScore >= 75 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {globalHealthScore}%
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Health Index</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900 flex items-center justify-center gap-1.5">
                <span>{activeConnectors.filter(c => c.status === 'Connected').length}</span>
                <span className="text-slate-400 text-xs">/</span>
                <span className="text-slate-500 text-xs">{activeConnectors.length}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Pings OK</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Interactive Simulation Control Panel */}
      <div id="health-simulation-sandbox" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-sm">Real-Time Routing &amp; Stress Simulation Sandbox</h3>
        </div>
        <p className="text-xs text-slate-500">
          Inject manual stress tests to evaluate the dynamic error-catching response of the EDIMP pipeline engine. Trigger network delays, cut connection pathways, or trigger AI throttling correction scripts on-the-fly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 pt-1">
          <button
            id="sim-latency-spike-btn"
            type="button"
            onClick={handleToggleLatencySpike}
            className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left group cursor-pointer ${
              injectedLatency > 0 
                ? 'bg-amber-50 border-amber-300 text-amber-900' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
              <Activity className={`w-4 h-4 ${injectedLatency > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-500'}`} />
              <span>{injectedLatency > 0 ? 'Remove Latency Spike' : 'Inject Latency Spike'}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {injectedLatency > 0 ? 'Currently adding +150ms packet delay' : 'Simulate WAN routing congestions (+150ms lag)'}
            </p>
          </button>

          <button
            id="sim-disconnect-btn"
            type="button"
            onClick={handleSimulateDisconnection}
            className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left group cursor-pointer ${
              offlineConnectorIds.length > 0 
                ? 'bg-rose-50 border-rose-300 text-rose-900' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
              <WifiOff className={`w-4 h-4 ${offlineConnectorIds.length > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-500'}`} />
              <span>{offlineConnectorIds.length > 0 ? 'Reconnect All Systems' : 'Simulate Server Outage'}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {offlineConnectorIds.length > 0 ? `${offlineConnectorIds.length} system offline` : 'Forcibly disconnect a random active connector'}
            </p>
          </button>

          <button
            id="sim-optimize-btn"
            type="button"
            onClick={handleTriggerAutoOptimization}
            disabled={isSimulatingSpike}
            className="flex flex-col items-start p-3 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100/80 text-indigo-900 rounded-xl transition-all text-left cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-indigo-950">
              <Sparkles className={`w-4 h-4 text-indigo-600 ${isSimulatingSpike ? 'animate-spin' : ''}`} />
              <span>AI Auto-Optimize Flows</span>
            </div>
            <p className="text-[10px] text-indigo-700 mt-1">
              Run heuristic balancing to clear all active latency, throttling, or blockage warnings
            </p>
          </button>

          <button
            id="sim-clear-overrides-btn"
            type="button"
            onClick={() => {
              setRateLimitOverrides({});
              setOfflineConnectorIds([]);
              setInjectedLatency(0);
              setDiagnosticLogs(prev => [
                { timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Manually cleared all system overrides.' },
                ...prev
              ]);
            }}
            className="flex flex-col items-start p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Reset Configuration</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Restore default throttling and original host values for all connectors
            </p>
          </button>
        </div>
      </div>

      {/* Visual Latency Heatmap Grid Card */}
      <div id="regional-latency-heatmap-card" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1 bg-white">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              {heatmapOverlayMode === 'latency' ? 'Regional Ingress Latency Heatmap Grid' : '24-Hour Regional Cumulative Error Rates'}
            </h2>
            <p className="text-[11px] text-slate-500">
              {heatmapOverlayMode === 'latency'
                ? 'Aggregated real-time response times across all active connectors mapped to global cloud edge gateways.'
                : 'Cumulative dropped packet rates over the last 24 hours on each connector node mapped to global gateway hubs.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Heatmap Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="heatmap-mode-latency-btn"
                type="button"
                onClick={() => setHeatmapOverlayMode('latency')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  heatmapOverlayMode === 'latency'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Ingress Latency
              </button>
              <button
                id="heatmap-mode-errors-btn"
                type="button"
                onClick={() => {
                  setHeatmapOverlayMode('errors');
                  setDiagnosticLogs(prev => [
                    {
                      timestamp: new Date().toLocaleTimeString(),
                      level: 'success',
                      message: 'Loaded D3 Cumulative 24h Error Rate Topology Heatmap. Bound 45 active nodes to error rate sequence...',
                    },
                    ...prev,
                  ]);
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                  heatmapOverlayMode === 'errors'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                24h Error Rate (D3)
              </button>
            </div>

            {/* Highlight Slow Toggle */}
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                id="heatmap-highlight-slow-checkbox"
                type="checkbox"
                checked={highlightSlowOnly}
                onChange={(e) => setHighlightSlowOnly(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded-sm cursor-pointer"
              />
              <span>Highlight Congestion (&ge;120ms)</span>
            </label>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[10px] font-bold font-mono">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
              Real-time Feeds
            </span>
          </div>
        </div>

        {/* Visual Path Tracing Dashboard Control Area */}
        <div id="path-tracing-control-center" className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                <Zap className="w-5 h-5 text-indigo-600 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-mono">
                  Live Path Tracing & Network Routing Telemetry
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select an active integration job to overlay real-time routing pipelines on the latency cells.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Job Selector */}
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Migration Job</span>
                <select
                  id="path-trace-job-select"
                  value={traceJobId}
                  onChange={(e) => {
                    setTraceJobId(e.target.value);
                    if (e.target.value) {
                      const selected = jobs.find(j => j.id === e.target.value);
                      if (selected) {
                        setDiagnosticLogs(prev => [
                          {
                            timestamp: new Date().toLocaleTimeString(),
                            level: 'info',
                            message: `Engaged live path tracing for job: "${selected.jobName}". Identifying source-destination mapping...`,
                          },
                          ...prev,
                        ]);
                      }
                    }
                  }}
                  className="bg-white border border-slate-250 hover:border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[220px]"
                >
                  <option value="">-- Path Tracing Disabled --</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.jobName} ({j.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Region Routing Selector */}
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Routing Gateway Hub</span>
                <select
                  id="path-trace-region-select"
                  value={traceRegionId}
                  onChange={(e) => setTraceRegionId(e.target.value)}
                  disabled={!traceJobId}
                  className="bg-white border border-slate-250 hover:border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[150px] disabled:opacity-50"
                >
                  <option value="all">All Regions (Parallel)</option>
                  {REGIONS.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.provider})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active Job Flow Inspection Bar */}
          {traceJobId && (() => {
            const selectedJob = jobs.find(j => j.id === traceJobId);
            if (!selectedJob) return null;

            const sourceConn = activeConnectors.find(c => c.id === selectedJob.sourceConnectorId);
            const destConn = activeConnectors.find(c => c.id === selectedJob.destConnectorId);

            const isJobRunning = selectedJob.status === 'Running';

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white rounded-lg p-3 border border-slate-150 text-xs shadow-3xs">
                {/* Source Mapping */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg shrink-0">
                    <Database className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Data Ingress Source</span>
                    <strong className="text-slate-800 text-xs block truncate" title={selectedJob.sourceConnectorName}>
                      {selectedJob.sourceConnectorName}
                    </strong>
                    <span className="text-[9px] text-slate-500 block truncate">
                      Host: {sourceConn?.hostUrl || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Animated Connection Status Indicator */}
                <div className="flex flex-col justify-center items-center py-2 px-4 border-y md:border-y-0 md:border-x border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[11px] font-mono text-slate-700">
                      {isJobRunning ? 'ACTIVE FLOWING' : 'PATH SUSPENDED'}
                    </span>
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isJobRunning ? 'bg-indigo-400' : 'bg-slate-300'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isJobRunning ? 'bg-indigo-600' : 'bg-slate-400'}`}></span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-indigo-700 font-mono">
                    <Activity className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{selectedJob.throughputRps || 0} RPS throughput</span>
                  </div>

                  <p className="text-[9px] text-slate-400 text-center mt-0.5">
                    {isJobRunning 
                      ? 'Live animated flows matching packet delivery times.' 
                      : `Pipeline is not running. Status: ${selectedJob.status}`}
                  </p>
                </div>

                {/* Destination Mapping */}
                <div className="flex items-center gap-3 md:justify-end">
                  <div className="min-w-0 md:text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Data Egress Target</span>
                    <strong className="text-slate-800 text-xs block truncate" title={selectedJob.destConnectorName}>
                      {selectedJob.destConnectorName}
                    </strong>
                    <span className="text-[9px] text-slate-500 block truncate">
                      Tenant: {destConn?.tenantId || destConn?.dbName || 'Production'}
                    </span>
                  </div>
                  <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg shrink-0">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Heatmap Table Grid */}
        <div id="heatmap-grid-table-container" className="relative overflow-x-auto rounded-xl border border-slate-150 scrollbar-thin">
          
          {/* Path Tracing SVG Overlay */}
          {((traceJobId && pathLines.length > 0) || heatmapOverlayMode === 'errors') && (
            <svg
              ref={d3OverlayRef}
              className="absolute top-0 left-0 pointer-events-none z-10"
              style={{
                width: tableDimensions.width || '100%',
                height: tableDimensions.height || '100%',
              }}
            >
              <defs>
                {/* Glow Filter */}
                <filter id="glow-path" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                {/* Marker for active flow arrow direction */}
                <marker
                  id="flow-arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366f1" />
                </marker>
                
                {/* Marker for blocked flow arrow */}
                <marker
                  id="flow-arrow-blocked"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
                </marker>
              </defs>

              {traceJobId && pathLines.length > 0 && pathLines.map(line => {
                const isSlow = line.latency >= 120;
                const isCritical = line.latency >= 220;
                
                const pathColor = line.isOffline 
                  ? '#ef4444' 
                  : isCritical 
                    ? '#f43f5e' 
                    : isSlow 
                      ? '#f59e0b' 
                      : '#10b981';

                const pathD = `M ${line.fromX} ${line.fromY} Q ${line.midX} ${line.midY} ${line.toX} ${line.toY}`;

                // Speed adapts proportionally to regional network network congestion
                const animationDuration = line.isOffline
                  ? '0s'
                  : line.latency < 45
                    ? '1s'
                    : line.latency < 90
                      ? '1.8s'
                      : line.latency < 150
                        ? '3.2s'
                        : '5.5s';

                return (
                  <g key={line.id}>
                    {/* Wider transparent glow shadow */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={pathColor}
                      strokeWidth="6"
                      strokeLinecap="round"
                      opacity="0.12"
                      filter="url(#glow-path)"
                    />

                    {/* Main path line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={pathColor}
                      strokeWidth={line.isOffline ? '1.5' : '2'}
                      strokeLinecap="round"
                      strokeDasharray={line.isOffline ? '4 4' : '8 6'}
                      opacity={line.isOffline ? '0.4' : '0.8'}
                      markerEnd={line.isOffline ? 'url(#flow-arrow-blocked)' : 'url(#flow-arrow)'}
                    >
                      {!line.isOffline && (
                        <animate
                          attributeName="stroke-dashoffset"
                          values="100;0"
                          dur={animationDuration}
                          repeatCount="indefinite"
                        />
                      )}
                    </path>

                    {/* Glowing particle bubble */}
                    {!line.isOffline && (
                      <circle r="4.5" fill={pathColor} filter="url(#glow-path)">
                        <animateMotion
                          path={pathD}
                          dur={animationDuration}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* Dynamic D3 Heat Spot Tooltip Overlay */}
          {heatmapOverlayMode === 'errors' && hoveredHeatSpot && (
            <div
              className="absolute z-30 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 p-3 text-xs w-64 pointer-events-none transition-all duration-100 font-sans"
              style={{
                left: hoveredHeatSpot.cx + 12,
                top: hoveredHeatSpot.cy - 12,
                transform: 'translate3d(0, 0, 0)',
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 mb-1.5">
                <span className="font-extrabold text-slate-200 truncate pr-2 max-w-[140px]" title={hoveredHeatSpot.connectorName}>
                  {hoveredHeatSpot.connectorName}
                </span>
                <span className="text-[10px] font-mono bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700 font-bold uppercase shrink-0">
                  {hoveredHeatSpot.regionName}
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex items-center justify-between">
                  <span>24h Error Rate:</span>
                  <span className={`font-mono font-bold ${
                    hoveredHeatSpot.status === 'Offline' ? 'text-red-500' :
                    hoveredHeatSpot.status === 'Critical' ? 'text-rose-400 animate-pulse' :
                    hoveredHeatSpot.status === 'Degraded' ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {hoveredHeatSpot.errorRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dropped Packets:</span>
                  <span className="font-mono text-white font-semibold">
                    {hoveredHeatSpot.errorCount.toLocaleString()} pkts
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className={`font-semibold flex items-center gap-1.5 ${
                    hoveredHeatSpot.status === 'Offline' ? 'text-red-500' :
                    hoveredHeatSpot.status === 'Critical' ? 'text-rose-400' :
                    hoveredHeatSpot.status === 'Degraded' ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      hoveredHeatSpot.status === 'Offline' ? 'bg-red-500 animate-pulse' :
                      hoveredHeatSpot.status === 'Critical' ? 'bg-rose-400 animate-ping' :
                      hoveredHeatSpot.status === 'Degraded' ? 'bg-amber-400' :
                      'bg-emerald-400'
                    }`} />
                    {hoveredHeatSpot.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          <table id="heatmap-grid-table" className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider font-mono">
                <th className="py-3 px-4 w-1/4">Ingress Connector Node</th>
                {REGIONS.map(r => (
                  <th key={r.id} id={`heatmap-header-${r.id}`} className="py-3 px-3 text-center">
                    <div className="space-y-0.5">
                      <span className="text-slate-800 block">{r.name}</span>
                      <span className="text-[9px] text-slate-400 block font-normal normal-case">{r.provider}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConnectors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic">
                    No active connectors match your current search query.
                  </td>
                </tr>
              ) : (
                filteredConnectors.map(c => {
                  const isOffline = c.status === 'Disconnected' || offlineConnectorIds.includes(c.id);
                  const isSelected = selectedSystemId === c.id;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isSelected ? 'bg-indigo-50/25' : ''
                      }`}
                    >
                      {/* Connector Meta column */}
                      <td className="py-3.5 px-4 font-sans">
                        <div
                          onClick={() => setSelectedSystemId(c.id)}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          <div className={`p-1.5 rounded-lg border shrink-0 transition-transform group-hover:scale-105 ${
                            isOffline ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            {getConnectorIcon(c.icon)}
                          </div>
                          <div className="max-w-[180px] truncate">
                            <span className="font-bold text-slate-800 block truncate group-hover:text-indigo-600 transition-colors">
                              {c.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-slate-500 font-mono">{c.provider}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 border border-slate-200 rounded font-mono uppercase font-bold">
                                {c.systemType}
                              </span>
                              {c.isTransferring && !isOffline && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-mono font-extrabold animate-pulse">
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                  </span>
                                  <span>TRANSFERRING</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Regional Cell Hops */}
                      {REGIONS.map(r => {
                        const baseLat = c.latencyMs || 25;
                        const cellLatency = Math.round((baseLat * r.multiplier) + r.baseOffset);
                        const cellColorClass = getLatencyColorClass(cellLatency, isOffline, highlightSlowOnly);

                        return (
                          <td key={r.id} className="py-3 px-2 text-center">
                            <div
                              id={`heatmap-cell-${c.id}-${r.id}`}
                              onClick={() => {
                                setSelectedSystemId(c.id);
                                const timestampStr = new Date().toLocaleTimeString();
                                setDiagnosticLogs(prev => [
                                  {
                                    timestamp: timestampStr,
                                    level: isOffline ? 'warn' : cellLatency >= 150 ? 'warn' : 'success',
                                    message: `Telemetry query: ${c.name} ➔ ${r.name} (${r.provider}). Link Status: ${isOffline ? 'Offline' : `${cellLatency}ms latency`}.`,
                                  },
                                  ...prev,
                                ]);
                              }}
                              className={`mx-auto w-16 h-11 rounded-lg border flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${cellColorClass} ${
                                isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                              }`}
                              title={`${c.name} in ${r.name} (${r.provider})`}
                            >
                              {isOffline ? (
                                <>
                                  <WifiOff className="w-3.5 h-3.5 opacity-75" />
                                  <span className="text-[9px] uppercase tracking-tighter font-extrabold opacity-90 mt-0.5">OFF</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[11px] font-black tracking-tight">{cellLatency}</span>
                                  <span className="text-[8px] uppercase tracking-widest font-mono opacity-80 -mt-0.5">ms</span>
                                </>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend and Advanced Insights Footer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
          {/* Heatmap Legend */}
          <div className="flex flex-wrap items-center gap-3.5 bg-white">
            {heatmapOverlayMode === 'latency' ? (
              <>
                <span className="text-slate-400 font-mono font-bold text-[10px] uppercase tracking-wider">Latency Scale:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 block" />
                    <span className="text-[10px] text-slate-600 font-semibold font-mono">&lt;45ms Fast</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <span className="w-2.5 h-2.5 rounded bg-teal-500 block" />
                    <span className="text-[10px] text-slate-600 font-semibold font-mono">45-90ms Normal</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <span className="w-2.5 h-2.5 rounded bg-amber-400 block" />
                    <span className="text-[10px] text-slate-600 font-semibold font-mono">90-150ms Moderate</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <span className="w-2.5 h-2.5 rounded bg-orange-50 block" />
                    <span className="text-[10px] text-slate-600 font-semibold font-mono">150-220ms Slow</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <span className="w-2.5 h-2.5 rounded bg-rose-600 block animate-pulse" />
                    <span className="text-[10px] text-slate-600 font-semibold font-mono">&gt;220ms Critical</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <span className="w-2.5 h-2.5 rounded bg-slate-200 block border border-slate-300" />
                    <span className="text-[10px] text-slate-600 font-semibold font-mono">Offline / Blocked</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <span className="text-slate-400 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  D3 Error Rate Scale (24h):
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 block" />
                    <span className="text-[10px] text-slate-600 font-semibold font-mono">&lt;0.5% Optimal</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500 block" />
                    <span className="text-[10px] text-slate-600 font-semibold font-mono">0.5%-1.5% Degraded</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500 block" />
                    <span className="text-[10px] text-slate-600 font-semibold font-mono">1.5%-5.0% High Loss</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <span className="w-2.5 h-2.5 rounded bg-red-600 block animate-pulse" />
                    <span className="text-[10px] text-slate-600 font-semibold font-mono">&gt;5.0% Critical</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <span className="w-2.5 h-2.5 rounded bg-rose-950 block border border-rose-800" />
                    <span className="text-[10px] text-slate-600 font-semibold font-mono">Offline / 100%</span>
                  </div>
                </div>
              </>
            )}
          </div>
 
          <div className="text-[11px] text-slate-400 italic flex items-center gap-1 font-sans">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {heatmapOverlayMode === 'latency'
                ? 'Click any cell to query that regional gateway link.'
                : 'Hover over the D3 pulse nodes to inspect regional cumulative error rates.'}
            </span>
          </div>
        </div>

        {/* Heatmap Derived Analytical Metrics Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="space-y-1">
            <span className="text-[9px] font-extrabold uppercase font-mono text-slate-400 block tracking-wider">Global Average Latency</span>
            <div className="text-base font-black text-slate-800 font-mono">
              {heatmapStats.average > 0 ? `${heatmapStats.average}ms` : 'N/A'}
            </div>
            <p className="text-[10px] text-slate-500">Normal operating bound</p>
          </div>

          <div className="space-y-1 border-l border-slate-200 pl-4">
            <span className="text-[9px] font-extrabold uppercase font-mono text-slate-400 block tracking-wider">Fastest Regional Gateway</span>
            <div className="text-[11px] font-bold text-emerald-600 truncate" title={heatmapStats.minRoute}>
              {heatmapStats.minVal > 0 ? `${heatmapStats.minVal}ms` : 'N/A'}
            </div>
            <p className="text-[10px] text-slate-500 truncate">{heatmapStats.minRoute || 'None'}</p>
          </div>

          <div className="space-y-1 border-l border-slate-200 pl-4">
            <span className="text-[9px] font-extrabold uppercase font-mono text-slate-400 block tracking-wider">Hops At Congestion Risk</span>
            <div className={`text-base font-black font-mono ${heatmapStats.hopsAtRisk > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {heatmapStats.hopsAtRisk} / {filteredConnectors.length * REGIONS.length}
            </div>
            <p className="text-[10px] text-slate-500">Latency &ge; 120ms</p>
          </div>

          <div className="space-y-1 border-l border-slate-200 pl-4">
            <span className="text-[9px] font-extrabold uppercase font-mono text-slate-400 block tracking-wider">Worst Bottleneck Link</span>
            <div className={`text-[11px] font-bold truncate ${heatmapStats.maxVal >= 150 ? 'text-rose-600' : 'text-slate-800'}`} title={heatmapStats.maxRoute}>
              {heatmapStats.maxVal > 0 ? `${heatmapStats.maxVal}ms` : 'N/A'}
            </div>
            <p className="text-[10px] text-slate-500 truncate">{heatmapStats.maxRoute || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left column (Active Alerts & Connectors), Right Column (System Detail Inspector & Diagnosis Logs) */}
      <div id="health-grid-content" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Dynamic Bottleneck Alert Center & Connectors list (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Dynamic Bottleneck Spotlight Alert Panel */}
          <div id="bottleneck-spotlight-box" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Real-Time Bottleneck Analyst</h2>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                systemBottlenecks.length > 0 
                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {systemBottlenecks.length} Active System Risks
              </span>
            </div>

            {systemBottlenecks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 stroke-1.5 mb-2" />
                <span className="font-bold text-slate-800 text-sm">All Ingress Channels Healthy</span>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Connectors are communicating optimally. Latency averages are within safe boundaries and no rate-limit thresholds have been breached.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                {systemBottlenecks.map((bottleneck, index) => (
                  <div
                    key={index}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      bottleneck.severity === 'critical' ? 'bg-rose-50/70 border-rose-200 text-rose-900' :
                      bottleneck.severity === 'high' ? 'bg-amber-50/90 border-amber-300 text-amber-900' :
                      bottleneck.severity === 'warning' ? 'bg-indigo-50/50 border-indigo-100 text-indigo-900' :
                      'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold font-mono uppercase rounded-full ${
                          bottleneck.severity === 'critical' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          bottleneck.severity === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}>
                          {bottleneck.type} • {bottleneck.severity}
                        </span>
                        <strong className="text-xs font-bold font-sans">
                          {bottleneck.connectorName}
                        </strong>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90 max-w-xl">
                        {bottleneck.message}
                      </p>
                      <div className="text-[10px] font-mono opacity-75">
                        Metric Trigger: <strong className="font-bold">{bottleneck.metrics}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemedyAction(bottleneck.connectorId, bottleneck.remedyType)}
                      className={`px-3 py-2 rounded-lg text-[10px] font-bold shadow-xs shrink-0 transition-all active:scale-95 cursor-pointer ${
                        bottleneck.severity === 'critical' 
                          ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                          : bottleneck.severity === 'high' 
                          ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {bottleneck.actionText}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Global System Registry Map & Traffic cross-referencing */}
          <div id="system-registry-matrix-box" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  Connector Status & Active Pipeline Matrix
                </h2>
                <p className="text-[11px] text-slate-500">
                  Calculates capacity exhaustion based on live jobs throughput relative to the connector's rate caps.
                </p>
              </div>

              {/* Filter input */}
              <input
                id="connector-matrix-search-input"
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search matrix by name or provider..."
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full sm:w-56"
              />
            </div>

            <div className="overflow-x-auto">
              <table id="health-matrix-table" className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">
                    <th className="py-2.5 px-2">Connector System</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2">Role</th>
                    <th className="py-2.5 px-2">Ping Latency</th>
                    <th className="py-2.5 px-2">Active Jobs In-Flight</th>
                    <th className="py-2.5 px-2">Capacity Load</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredConnectors.map((c) => {
                    const associatedJobs = jobs.filter(j => j.sourceConnectorId === c.id || j.destConnectorId === c.id);
                    const runningJobs = associatedJobs.filter(j => j.status === 'Running');
                    const totalTps = runningJobs.reduce((sum, j) => sum + (j.throughputRps || 0), 0);
                    
                    const isThrottlingEnabled = c.throttlingConfig?.isEnabled;
                    const maxRequests = c.throttlingConfig?.maxRequestsPerSecond || 150;
                    const utilizationPct = isThrottlingEnabled 
                      ? Math.min(100, Math.round((totalTps / maxRequests) * 100)) 
                      : 0;

                    // Row-specific styling
                    const isSystemOffline = c.status === 'Disconnected' || c.status === 'Error';
                    const isSystemHighLatency = (c.latencyMs || 0) > 85;
                    const isSystemCongested = isThrottlingEnabled && utilizationPct >= 85;

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedSystemId(c.id)}
                        className={`text-xs hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          selectedSystemId === c.id ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        {/* Name and Icon */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg border shrink-0 ${
                              isSystemOffline ? 'bg-rose-50 border-rose-200 text-rose-500' :
                              isSystemHighLatency ? 'bg-amber-50 border-amber-200 text-amber-500' :
                              'bg-slate-100 border-slate-200 text-slate-600'
                            }`}>
                              {getConnectorIcon(c.icon)}
                            </div>
                            <div className="max-w-[140px] sm:max-w-[200px] truncate">
                              <span className="font-bold text-slate-800 block truncate">{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-medium truncate">{c.provider}</span>
                            </div>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            c.status === 'Connected'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              c.status === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                            }`} />
                            {c.status}
                          </span>
                        </td>

                        {/* System role */}
                        <td className="py-3 px-2 font-mono text-[10px] font-semibold text-slate-500">
                          {c.systemType}
                        </td>

                        {/* Latency */}
                        <td className="py-3 px-2">
                          <div className="space-y-0.5">
                            <span className={`font-mono font-bold block ${
                              isSystemHighLatency ? 'text-amber-600' : 'text-slate-700'
                            }`}>
                              {c.latencyMs}ms
                            </span>
                            <div className="w-12 bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isSystemHighLatency ? 'bg-amber-500' : 'bg-emerald-400'}`}
                                style={{ width: `${Math.min(100, ((c.latencyMs || 0) / 200) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Active Jobs */}
                        <td className="py-3 px-2">
                          {associatedJobs.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">No registered jobs</span>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-bold text-slate-700 font-mono text-[10px]">
                                  {runningJobs.length} active
                                </span>
                                <span className="text-slate-400 text-[10px]">({associatedJobs.length} total)</span>
                              </div>
                              {runningJobs.length > 0 && (
                                <div className="text-[9px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 py-0.2 rounded inline-block">
                                  Pipeline TPS: {totalTps}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Capacity Utilization Progress Bar */}
                        <td className="py-3 px-2">
                          {runningJobs.length === 0 ? (
                            <span className="text-slate-400 text-[11px] font-mono">0% Idle</span>
                          ) : (
                            <div className="space-y-1 max-w-[100px]">
                              <div className="flex justify-between font-mono text-[9px] text-slate-500 font-bold">
                                <span>{utilizationPct}%</span>
                                <span>{isThrottlingEnabled ? `${maxRequests} RPS` : 'No Cap'}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isSystemCongested ? 'bg-rose-500' :
                                    utilizationPct > 60 ? 'bg-amber-500' : 'bg-indigo-500'
                                  }`}
                                  style={{ width: `${isThrottlingEnabled ? utilizationPct : 10}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Direct action triggers */}
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`ping-${c.id}`}
                              type="button"
                              title="Test Connection"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemedyAction(c.id, 'retest');
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            {isThrottlingEnabled && (
                              <button
                                id={`boost-${c.id}`}
                                type="button"
                                title="Double Throttling Cap"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemedyAction(c.id, 'increase_limit');
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: System Inspector Detail Pane & Diagnosis Logs (1/3 width on large screens) */}
        <div className="space-y-6">
          
          {/* Section: Live Diagnostic Inspector Card */}
          <div id="connector-detail-inspector" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Cpu className="w-4.5 h-4.5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Active Node Inspector</h3>
            </div>

            {selectedSystem ? (
              <div className="space-y-4 text-xs font-sans">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-lg border text-slate-700 border-slate-200">
                      {getConnectorIcon(selectedSystem.icon)}
                    </div>
                    <div>
                      <strong className="text-slate-900 font-bold block">{selectedSystem.name}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{selectedSystem.provider}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    selectedSystem.status === 'Connected' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedSystem.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl font-mono text-[11px] space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Endpoint URL:</span>
                    <span className="text-slate-900 break-all text-right max-w-[180px]">{selectedSystem.hostUrl || 'localhost:1433'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Authorization:</span>
                    <span className="text-slate-900">{selectedSystem.authType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gateway Latency:</span>
                    <span className={`font-bold ${selectedSystem.latencyMs && selectedSystem.latencyMs > 85 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {selectedSystem.latencyMs}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Throttling Status:</span>
                    <span className="text-slate-900">
                      {selectedSystem.throttlingConfig?.isEnabled ? 'Engaged cap' : 'Disabled'}
                    </span>
                  </div>
                  {selectedSystem.throttlingConfig?.isEnabled && (
                    <div className="flex justify-between pl-3 border-l border-slate-200 text-slate-500 text-[10px]">
                      <span>Max Rate Cap:</span>
                      <span className="text-indigo-600 font-bold">{selectedSystem.throttlingConfig.maxRequestsPerSecond} RPS</span>
                    </div>
                  )}
                </div>

                {/* List Associated Migration runs */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase font-mono text-slate-400 tracking-wider block">
                    Associated Migration Runs
                  </span>

                  {jobs.filter(j => j.sourceConnectorId === selectedSystem.id || j.destConnectorId === selectedSystem.id).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No registered migration jobs depend on this connector.</p>
                  ) : (
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {jobs
                        .filter(j => j.sourceConnectorId === selectedSystem.id || j.destConnectorId === selectedSystem.id)
                        .map(j => (
                          <div key={j.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg space-y-1 hover:border-slate-300 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 text-[11px] truncate max-w-[150px]">{j.jobName}</span>
                              <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                                j.status === 'Running' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                j.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {j.status}
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                              <span>Throughput: {j.throughputRps || 120} RPS</span>
                              <span>Progress: {j.progressPct}%</span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>

                {/* Real-Time Congestion Action Selector */}
                {selectedSystem.throttlingConfig?.isEnabled && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase font-mono text-slate-400 tracking-wider block">
                      Fine-Tune Ingress Control Caps
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        id="inspector-tps-slider"
                        type="range"
                        min="10"
                        max="500"
                        value={selectedSystem.throttlingConfig.maxRequestsPerSecond}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRateLimitOverrides(prev => ({ ...prev, [selectedSystem.id]: val }));
                        }}
                        className="flex-1 accent-indigo-600 h-1 bg-slate-100 rounded-lg cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-slate-800 w-16 text-right">
                        {selectedSystem.throttlingConfig.maxRequestsPerSecond} RPS
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                <SlidersHorizontal className="w-8 h-8 text-slate-300 stroke-1.5 mb-2" />
                <span className="font-bold text-slate-700 text-xs">No System Selected</span>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] leading-relaxed">
                  Click on any connection row in the status matrix to inspect its active nodes, latencies, and in-flight migration workloads.
                </p>
              </div>
            )}
          </div>

          {/* Section: Live Diagnostic Logs Stream */}
          <div id="diagnostic-audit-logs" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight font-sans">Diagnostic Event Stream</h3>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
              {diagnosticLogs.map((log, i) => (
                <div key={i} className="flex gap-2 text-[10px] font-mono leading-relaxed p-1.5 rounded hover:bg-slate-50 transition-colors">
                  <span className="text-slate-400 shrink-0 select-none">[{log.timestamp}]</span>
                  <span className={`${
                    log.level === 'warn' ? 'text-rose-600 font-bold' :
                    log.level === 'success' ? 'text-emerald-600 font-semibold' : 'text-slate-600'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GlobalConnectionHealthView;
