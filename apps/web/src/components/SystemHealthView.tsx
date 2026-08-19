import React, { useState, useEffect } from 'react';
import { WorkerNodeScalingPanel } from './WorkerNodeScalingPanel';
import { HistoricalPerformanceBenchmarkingPanel } from './HistoricalPerformanceBenchmarkingPanel';
import { MigrationRiskForecastingPanel } from './MigrationRiskForecastingPanel';
import { AlertNotificationConfigurator } from './AlertNotificationConfigurator';
import { ResourceMonitor } from './ResourceMonitor';
import { PredictiveRiskDashboard } from './PredictiveRiskDashboard';
import { ClusterHealthHeatMap } from './ClusterHealthHeatMap';
import { LatencyBreakdownChart } from './LatencyBreakdownChart';
import { MigrationLifecycleTimeline } from './MigrationLifecycleTimeline';
import {
  Cpu,
  HardDrive,
  Activity,
  Zap,
  Server,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Wifi,
  BarChart3,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Gauge,
  Database,
  Clock,
  Layers,
  Radio,
  SlidersHorizontal,
  Plus,
  Minus,
  Play,
  Sparkles,
  ShieldCheck,
  Check,
  RotateCcw,
} from 'lucide-react';

interface ClusterNode {
  id: string;
  name: string;
  region: string;
  cpuUsagePct: number;
  ramUsagePct: number;
  diskIoMBps: number;
  status: 'Healthy' | 'High Load' | 'GC Active' | 'Scaling Up';
  jvmGcPauseMs: number;
}

export interface AutoScalingEvent {
  id: string;
  timestamp: string;
  type: 'PROVISION_UP' | 'PROVISION_DOWN' | 'THROTTLE_ENGAGED' | 'THROTTLE_DISENGAGED';
  action: string;
  trigger: string;
  nodesBefore: number;
  nodesAfter: number;
  impactMetrics: {
    cpuBefore: number;
    cpuAfter: number;
    throughputBefore: number;
    throughputAfter: number;
  };
  details: string;
}

export const SystemHealthView: React.FC = () => {
  const [activeHealthTab, setActiveHealthTab] = useState<'worker-scaling' | 'risk-forecasting' | 'telemetry' | 'auto-scaling-events' | 'rules' | 'benchmarking' | 'lifecycle-timeline'>('worker-scaling');
  const [timeRange, setTimeRange] = useState<'5m' | '15m' | '1h'>('5m');
  const [warningThresholdLimit, setWarningThresholdLimit] = useState<number>(90);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(3);
  const [lastUpdated, setLastUpdated] = useState<string>('Just Now');
  const [nodeFilter, setNodeFilter] = useState<string>('All');
  const [isSimulatingSpike, setIsSimulatingSpike] = useState<boolean>(false);

  // Auto-Scaling Configuration State
  const [autoScaleEnabled, setAutoScaleEnabled] = useState<boolean>(true);
  const [autoScaleMode, setAutoScaleMode] = useState<'Reactive' | 'Predictive' | 'Scheduled'>('Reactive');
  const [minNodes, setMinNodes] = useState<number>(16);
  const [maxNodes, setMaxNodes] = useState<number>(256);
  const [targetNodes, setTargetNodes] = useState<number>(128);
  const [cpuThresholdPct, setCpuThresholdPct] = useState<number>(80);
  const [ramThresholdPct, setRamThresholdPct] = useState<number>(85);
  const [evalWindowMins, setEvalWindowMins] = useState<number>(2);
  const [nodesPerScaleStep, setNodesPerScaleStep] = useState<number>(16);
  const [cooldownMins, setCooldownMins] = useState<number>(5);

  // Auto-Scaling Events Audit Log State
  const [eventFilter, setEventFilter] = useState<'all' | 'provisioning' | 'throttling'>('all');
  const [isThrottled, setIsThrottled] = useState<boolean>(false);
  const [lastScaleTime, setLastScaleTime] = useState<number>(0);
  const [autoScalingEvents, setAutoScalingEvents] = useState<AutoScalingEvent[]>([
    {
      id: 'ase-init-1',
      timestamp: '04:12:35 AM',
      type: 'PROVISION_UP',
      action: 'Cluster Scale Up (Automatic)',
      trigger: 'CPU Avg Saturation (84.2% >= 80.0%)',
      nodesBefore: 112,
      nodesAfter: 128,
      impactMetrics: {
        cpuBefore: 84.2,
        cpuAfter: 68.5,
        throughputBefore: 126000,
        throughputAfter: 145000,
      },
      details: 'Workload demand spike across US-East regions triggered automatic provisioning of +16 concurrent Spark processing pods to clear data-lake queuing backlog.',
    },
    {
      id: 'ase-init-2',
      timestamp: '03:45:10 AM',
      type: 'THROTTLE_ENGAGED',
      action: 'Rate Limiting Engaged',
      trigger: 'Iceberg Catalog Metadata Lock Contention (Queue Depth > 3.4 GB)',
      nodesBefore: 112,
      nodesAfter: 112,
      impactMetrics: {
        cpuBefore: 79.1,
        cpuAfter: 62.4,
        throughputBefore: 168000,
        throughputAfter: 84000,
      },
      details: 'Detected intensive catalog locking on Target Iceberg tables. Auto-throttled SAP extractor batch ingest speed by 50% to prevent connection pool exhaustion.',
    },
    {
      id: 'ase-init-3',
      timestamp: '03:52:18 AM',
      type: 'THROTTLE_DISENGAGED',
      action: 'Rate Limiting Disengaged',
      trigger: 'Catalog Lock Restored (Queue Backlog < 50 MB)',
      nodesBefore: 112,
      nodesAfter: 112,
      impactMetrics: {
        cpuBefore: 62.4,
        cpuAfter: 78.8,
        throughputBefore: 84000,
        throughputAfter: 168000,
      },
      details: 'Target Iceberg database write queuing normalized below safety margins. Restored SAP ingestion stream rate to 100% capacity.',
    }
  ]);

  // Rule Test Simulator State
  const [isTestingRules, setIsTestingRules] = useState<boolean>(false);
  const [autoScaleLogs, setAutoScaleLogs] = useState<
    { timestamp: string; level: 'INFO' | 'WARN' | 'SUCCESS'; message: string }[]
  >([
    {
      timestamp: '03:24:12',
      level: 'INFO',
      message: 'Auto-Scaling Engine initialized. Evaluating CPU/RAM telemetry every 30s.',
    },
    {
      timestamp: '03:26:05',
      level: 'SUCCESS',
      message: 'Worker pool balanced at 128 nodes (CPU avg 62.8% <= 80.0% threshold).',
    },
  ]);

  // Global Resource State
  const [metrics, setMetrics] = useState({
    cpuAvgPct: 62.8,
    cpuPeakPct: 84.5,
    ramAllocatedGB: 384,
    ramTotalGB: 512,
    ramPct: 75.0,
    diskReadMBps: 3240,
    diskWriteMBps: 1820,
    iops: 28400,
    netEgressGbps: 4.8,
    netIngressGbps: 6.2,
    jvmGcPauseAvgMs: 82,
    activeWorkers: targetNodes,
    degradedWorkers: 0,
    migrationThroughputRecordsSec: 145000,
  });

  // Keep metrics.activeWorkers aligned with targetNodes
  useEffect(() => {
    setMetrics((prev) => ({
      ...prev,
      activeWorkers: targetNodes,
      migrationThroughputRecordsSec: Math.floor((targetNodes / 128) * 145000),
    }));
  }, [targetNodes]);

  // Generated Node Data
  const initialNodes: ClusterNode[] = Array.from({ length: 32 }, (_, i) => {
    const isGc = i === 7 || i === 22;
    const isHigh = i === 3 || i === 18;
    return {
      id: `wrk-node-${i + 1}`,
      name: `Spark-Worker-${(i + 1).toString().padStart(2, '0')}`,
      region: i < 16 ? 'us-east-1a' : 'us-east-1b',
      cpuUsagePct: isHigh ? 88.4 : Math.floor(45 + Math.random() * 30),
      ramUsagePct: isGc ? 89.2 : Math.floor(60 + Math.random() * 25),
      diskIoMBps: Math.floor(120 + Math.random() * 180),
      status: isHigh ? 'High Load' : isGc ? 'GC Active' : 'Healthy',
      jvmGcPauseMs: isGc ? 240 : Math.floor(20 + Math.random() * 60),
    };
  });

  const [nodes, setNodes] = useState<ClusterNode[]>(initialNodes);

  // Simulation tick logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString());

      // Slight jitter in metric state
      setMetrics((prev) => {
        const cpuJitter = +(prev.cpuAvgPct + (Math.random() * 4 - 2)).toFixed(1);
        const ramJitter = +(prev.ramPct + (Math.random() * 2 - 1)).toFixed(1);
        const readJitter = Math.floor(prev.diskReadMBps + (Math.random() * 100 - 50));
        const writeJitter = Math.floor(prev.diskWriteMBps + (Math.random() * 80 - 40));
        const recJitter = Math.floor(prev.migrationThroughputRecordsSec + (Math.random() * 4000 - 2000));

        return {
          ...prev,
          cpuAvgPct: Math.min(98, Math.max(20, cpuJitter)),
          ramPct: Math.min(95, Math.max(30, ramJitter)),
          ramAllocatedGB: Math.floor((Math.min(95, Math.max(30, ramJitter)) / 100) * 512),
          diskReadMBps: Math.max(1000, readJitter),
          diskWriteMBps: Math.max(500, writeJitter),
          migrationThroughputRecordsSec: Math.max(50000, recJitter),
        };
      });

      // Update node details randomly
      setNodes((prev) =>
        prev.map((node) => {
          const cpuDelta = Math.floor(Math.random() * 10 - 5);
          const newCpu = Math.min(99, Math.max(25, node.cpuUsagePct + cpuDelta));
          const newStatus: ClusterNode['status'] =
            newCpu > 85 ? 'High Load' : node.jvmGcPauseMs > 200 ? 'GC Active' : 'Healthy';

          return {
            ...node,
            cpuUsagePct: newCpu,
            status: newStatus,
          };
        })
      );
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Real-time Auto-Scaling and Throttling Watcher feedback loop
  useEffect(() => {
    if (!autoScaleEnabled) return;

    const nowTime = Date.now();
    const timestampStr = new Date().toLocaleTimeString();

    // 1. Check for scale up trigger
    const isCpuBreached = metrics.cpuAvgPct >= cpuThresholdPct;
    const isRamBreached = metrics.ramPct >= ramThresholdPct;

    if ((isCpuBreached || isRamBreached) && targetNodes < maxNodes) {
      // Cooldown check (8 seconds to avoid rapid consecutive scaling in UI simulation)
      if (nowTime - lastScaleTime > 8000) {
        const nextNodes = Math.min(maxNodes, targetNodes + nodesPerScaleStep);
        const cpuBefore = metrics.cpuAvgPct;
        const cpuAfter = +(metrics.cpuAvgPct * (targetNodes / nextNodes)).toFixed(1);
        const thruBefore = metrics.migrationThroughputRecordsSec;
        const thruAfter = Math.floor((nextNodes / 128) * 145000);

        setTargetNodes(nextNodes);
        setLastScaleTime(nowTime);

        const newEvent: AutoScalingEvent = {
          id: `ase-auto-up-${nowTime}`,
          timestamp: timestampStr,
          type: 'PROVISION_UP',
          action: 'Cluster Scale Up (Automatic)',
          trigger: isCpuBreached
            ? `CPU Saturation (${metrics.cpuAvgPct}% >= ${cpuThresholdPct}%)`
            : `RAM Heap Pressure (${metrics.ramPct}% >= ${ramThresholdPct}%)`,
          nodesBefore: targetNodes,
          nodesAfter: nextNodes,
          impactMetrics: {
            cpuBefore,
            cpuAfter,
            throughputBefore: thruBefore,
            throughputAfter: thruAfter,
          },
          details: `Automatically provisioned +${nextNodes - targetNodes} Kubernetes worker pods in US-East regions to balance distributed workload and reduce queue thread locks.`
        };

        setAutoScalingEvents((prev) => [newEvent, ...prev]);

        // Also add to autoScaleLogs
        setAutoScaleLogs((prev) => [
          {
            timestamp: new Date().toLocaleTimeString().split(' ')[0],
            level: 'SUCCESS' as const,
            message: `[Automatic Scale Up] Telemetry breached threshold! Cluster expanded to ${nextNodes} nodes.`,
          },
          ...prev
        ].slice(0, 10));
      }
    }

    // 2. Check for scale down trigger (cool and quiet)
    const isCpuLow = metrics.cpuAvgPct < cpuThresholdPct - 20;
    const isRamLow = metrics.ramPct < ramThresholdPct - 20;

    if (isCpuLow && isRamLow && targetNodes > minNodes) {
      if (nowTime - lastScaleTime > 12000) { // Slightly longer cooldown for scale down
        const nextNodes = Math.max(minNodes, targetNodes - nodesPerScaleStep);
        const cpuBefore = metrics.cpuAvgPct;
        const cpuAfter = +(metrics.cpuAvgPct * (targetNodes / nextNodes)).toFixed(1);
        const thruBefore = metrics.migrationThroughputRecordsSec;
        const thruAfter = Math.floor((nextNodes / 128) * 145000);

        setTargetNodes(nextNodes);
        setLastScaleTime(nowTime);

        const newEvent: AutoScalingEvent = {
          id: `ase-auto-down-${nowTime}`,
          timestamp: timestampStr,
          type: 'PROVISION_DOWN',
          action: 'Cluster Scale Down (Automatic)',
          trigger: `Workload Normalized (CPU: ${metrics.cpuAvgPct}%, RAM: ${metrics.ramPct}% < thresholds)`,
          nodesBefore: targetNodes,
          nodesAfter: nextNodes,
          impactMetrics: {
            cpuBefore,
            cpuAfter,
            throughputBefore: thruBefore,
            throughputAfter: thruAfter,
          },
          details: `De-provisioned -${targetNodes - nextNodes} idle worker pods to optimize infrastructure resource allocation and reduce cloud spend footprint.`
        };

        setAutoScalingEvents((prev) => [newEvent, ...prev]);

        setAutoScaleLogs((prev) => [
          {
            timestamp: new Date().toLocaleTimeString().split(' ')[0],
            level: 'INFO' as const,
            message: `[Automatic Scale Down] Telemetry safe. Worker pool resized to ${nextNodes} nodes.`,
          },
          ...prev
        ].slice(0, 10));
      }
    }
  }, [
    metrics.cpuAvgPct,
    metrics.ramPct,
    metrics.migrationThroughputRecordsSec,
    autoScaleEnabled,
    cpuThresholdPct,
    ramThresholdPct,
    targetNodes,
    minNodes,
    maxNodes,
    nodesPerScaleStep,
    lastScaleTime,
    setTargetNodes,
    setAutoScaleLogs
  ]);

  // 3. Throttling Watcher
  useEffect(() => {
    const timestampStr = new Date().toLocaleTimeString();
    const nowTime = Date.now();

    // Trigger throttling if CPU Avg goes extremely high (> 90%)
    if (metrics.cpuAvgPct > 90) {
      if (!isThrottled) {
        setIsThrottled(true);
        const thruBefore = metrics.migrationThroughputRecordsSec;
        const thruAfter = Math.floor(metrics.migrationThroughputRecordsSec * 0.45); // 45% of original rate

        const newEvent: AutoScalingEvent = {
          id: `ase-throttle-on-${nowTime}`,
          timestamp: timestampStr,
          type: 'THROTTLE_ENGAGED',
          action: 'Extractor Rate Limiting Engaged',
          trigger: `Critical Node Stress (CPU avg ${metrics.cpuAvgPct}% exceeds 90% critical threshold)`,
          nodesBefore: targetNodes,
          nodesAfter: targetNodes,
          impactMetrics: {
            cpuBefore: metrics.cpuAvgPct,
            cpuAfter: +(metrics.cpuAvgPct * 0.8).toFixed(1),
            throughputBefore: thruBefore,
            throughputAfter: thruAfter,
          },
          details: `Engaged SAP bulk extractor backpressure logic. Decreased stream ingest rate by 55% to preserve core relational write buffers and target Iceberg catalog consistency.`
        };

        setAutoScalingEvents((prev) => [newEvent, ...prev]);

        // Dynamically throttle down the throughput value in state
        setMetrics((prev) => ({
          ...prev,
          migrationThroughputRecordsSec: thruAfter
        }));
      }
    } else if (metrics.cpuAvgPct < 82 && isThrottled) {
      // Disengage throttling once system recovers to safe levels
      setIsThrottled(false);
      const thruBefore = metrics.migrationThroughputRecordsSec;
      const thruAfter = Math.floor((targetNodes / 128) * 145000);

      const newEvent: AutoScalingEvent = {
        id: `ase-throttle-off-${nowTime}`,
        timestamp: timestampStr,
        type: 'THROTTLE_DISENGAGED',
        action: 'Extractor Rate Limiting Disengaged',
        trigger: `System Telemetry Normalized (CPU avg drops to ${metrics.cpuAvgPct}%)`,
        nodesBefore: targetNodes,
        nodesAfter: targetNodes,
        impactMetrics: {
          cpuBefore: metrics.cpuAvgPct,
          cpuAfter: metrics.cpuAvgPct,
          throughputBefore: thruBefore,
          throughputAfter: thruAfter,
        },
        details: `Disengaged SAP backpressure limits. Parallel stream extraction rate fully restored to optimal throughput matching active cluster capacity.`
      };

      setAutoScalingEvents((prev) => [newEvent, ...prev]);

      setMetrics((prev) => ({
        ...prev,
        migrationThroughputRecordsSec: thruAfter
      }));
    }
  }, [metrics.cpuAvgPct, metrics.migrationThroughputRecordsSec, isThrottled, targetNodes]);

  const simulateRandomEvent = () => {
    const timestampStr = new Date().toLocaleTimeString();
    const eventTypes: ('PROVISION_UP' | 'PROVISION_DOWN' | 'THROTTLE_ENGAGED' | 'THROTTLE_DISENGAGED')[] = [
      'PROVISION_UP', 'PROVISION_DOWN', 'THROTTLE_ENGAGED', 'THROTTLE_DISENGAGED'
    ];
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const nowTime = Date.now();

    let newEvent: AutoScalingEvent;

    if (randomType === 'PROVISION_UP') {
      const added = [8, 16, 32][Math.floor(Math.random() * 3)];
      const before = targetNodes;
      const after = Math.min(maxNodes, targetNodes + added);
      newEvent = {
        id: `ase-sim-${nowTime}`,
        timestamp: timestampStr,
        type: 'PROVISION_UP',
        action: 'Manual Simulated Scale Up',
        trigger: 'Injected Workload Simulation Spike (CPU Load: 89.4%)',
        nodesBefore: before,
        nodesAfter: after,
        impactMetrics: {
          cpuBefore: 89.4,
          cpuAfter: 68.2,
          throughputBefore: Math.floor((before / 128) * 145000),
          throughputAfter: Math.floor((after / 128) * 145000),
        },
        details: `Simulated worker scaling event. Kubernetes pod scheduler successfully dispatched +${added} pods across AWS availability zones us-east-1a and us-east-1b.`,
      };
      setTargetNodes(after);
    } else if (randomType === 'PROVISION_DOWN') {
      const removed = [8, 16][Math.floor(Math.random() * 2)];
      const before = targetNodes;
      const after = Math.max(minNodes, targetNodes - removed);
      newEvent = {
        id: `ase-sim-${nowTime}`,
        timestamp: timestampStr,
        type: 'PROVISION_DOWN',
        action: 'Manual Simulated Scale Down',
        trigger: 'Idle Workload Consolidation (All thresholds green for > 15m)',
        nodesBefore: before,
        nodesAfter: after,
        impactMetrics: {
          cpuBefore: 45.1,
          cpuAfter: 58.7,
          throughputBefore: Math.floor((before / 128) * 145000),
          throughputAfter: Math.floor((after / 128) * 145000),
        },
        details: `Simulated worker contraction event. Scaled down -${before - after} Kubernetes pods to trim over-provisioned standby overhead and conserve infrastructure operational expenses.`,
      };
      setTargetNodes(after);
    } else if (randomType === 'THROTTLE_ENGAGED') {
      newEvent = {
        id: `ase-sim-${nowTime}`,
        timestamp: timestampStr,
        type: 'THROTTLE_ENGAGED',
        action: 'Manual Simulated Throttling Engaged',
        trigger: 'Lakehouse Metadata Lock Backlog (Catalog Thread Blocking)',
        nodesBefore: targetNodes,
        nodesAfter: targetNodes,
        impactMetrics: {
          cpuBefore: 88.2,
          cpuAfter: 72.1,
          throughputBefore: metrics.migrationThroughputRecordsSec,
          throughputAfter: Math.floor(metrics.migrationThroughputRecordsSec * 0.5),
        },
        details: `Simulated metadata lock backup. Throttling applied to the primary SAP RFC extractor thread, dropping bulk polling rate from standard batch sizes to prevent connection pool exhaustion.`,
      };
    } else {
      newEvent = {
        id: `ase-sim-${nowTime}`,
        timestamp: timestampStr,
        type: 'THROTTLE_DISENGAGED',
        action: 'Manual Simulated Throttling Disengaged',
        trigger: 'Lakehouse Catalog Queue Lock Released (Health Check Pass)',
        nodesBefore: targetNodes,
        nodesAfter: targetNodes,
        impactMetrics: {
          cpuBefore: 72.1,
          cpuAfter: 85.4,
          throughputBefore: Math.floor(metrics.migrationThroughputRecordsSec * 0.5),
          throughputAfter: metrics.migrationThroughputRecordsSec,
        },
        details: `Simulated rate disengagement. Metadata contention resolved. Main SAP migration ingestion pipe returned to un-throttled high-performance stream rate.`,
      };
    }

    setAutoScalingEvents(prev => [newEvent, ...prev]);
  };

  // Trigger high-load simulation spike
  const triggerSpikeSimulation = () => {
    setIsSimulatingSpike(true);
    setMetrics((prev) => ({
      ...prev,
      cpuAvgPct: 91.4,
      ramPct: 88.5,
      diskReadMBps: 5800,
      diskWriteMBps: 3400,
      migrationThroughputRecordsSec: 280000,
    }));

    setNodes((prev) =>
      prev.map((node, idx) => ({
        ...node,
        cpuUsagePct: Math.min(98, node.cpuUsagePct + 25),
        status: idx % 3 === 0 ? 'High Load' : node.status,
      }))
    );

    setTimeout(() => {
      setIsSimulatingSpike(false);
    }, 4000);
  };

  // Run Test Auto-Scaler Rule Evaluation Simulation
  const runRuleEvaluationTest = () => {
    setIsTestingRules(true);
    const now = new Date().toLocaleTimeString();

    const newLogs: typeof autoScaleLogs = [
      {
        timestamp: now,
        level: 'INFO',
        message: `[Rule Evaluation] Mode: ${autoScaleMode} | Checking CPU (${metrics.cpuAvgPct}%) against threshold (${cpuThresholdPct}%)...`,
      },
    ];

    setTimeout(() => {
      const isBreached = metrics.cpuAvgPct >= cpuThresholdPct || metrics.ramPct >= ramThresholdPct;

      if (isBreached) {
        const nextNodes = Math.min(maxNodes, targetNodes + nodesPerScaleStep);
        newLogs.push({
          timestamp: new Date().toLocaleTimeString(),
          level: 'WARN',
          message: `THRESHOLD BREACH: CPU ${metrics.cpuAvgPct}% >= ${cpuThresholdPct}% over ${evalWindowMins}m window!`,
        });
        newLogs.push({
          timestamp: new Date().toLocaleTimeString(),
          level: 'SUCCESS',
          message: `[Auto-Scaler Action] Provisioning +${nodesPerScaleStep} Kubernetes pods in us-east-1a/b. Cluster expanded from ${targetNodes} to ${nextNodes} nodes!`,
        });
        setTargetNodes(nextNodes);
      } else {
        newLogs.push({
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: `[Auto-Scaler Pass] Metrics within safe operating parameters. CPU ${metrics.cpuAvgPct}% < ${cpuThresholdPct}% limit.`,
        });
      }

      setAutoScaleLogs((prev) => [...newLogs, ...prev].slice(0, 10));
      setIsTestingRules(false);
    }, 1200);
  };

  const filteredNodes = nodes.filter((node) => {
    if (nodeFilter === 'All') return true;
    return node.status === nodeFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-50 via-white to-indigo-50/20">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-mono font-bold rounded-full border border-indigo-100 shadow-3xs">
              Module 15 – Cluster Hardware & Resource Infrastructure Monitor
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-mono font-bold rounded-full border border-emerald-100 flex items-center gap-1 shadow-3xs">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              {targetNodes} Spark Nodes Active ({autoScaleEnabled ? 'Auto-Scaling ON' : 'Manual'})
            </span>
            <PredictiveRiskDashboard
              currentCpu={metrics.cpuAvgPct}
              currentMemory={metrics.ramPct}
              activeWorkers={targetNodes}
              throughput={metrics.migrationThroughputRecordsSec}
              selectedProfileId="sap-extractor"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5 text-slate-950">
            <Activity className="w-6 h-6 text-indigo-600 animate-pulse" />
            Distributed System Health & Resource Monitor
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Real-time telemetry tracking CPU thread contention, RAM allocation & JVM garbage collection, Disk I/O throughput, and network egress for multi-billion record migration pipelines.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 z-10">
          <button
            id="sys-spike-test-btn"
            onClick={triggerSpikeSimulation}
            disabled={isSimulatingSpike}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Flame className={`w-4 h-4 text-slate-950 ${isSimulatingSpike ? 'animate-bounce' : ''}`} />
            <span>{isSimulatingSpike ? 'Spike Load Active...' : 'Simulate Heavy Batch Load'}</span>
          </button>

          <button
            id="sys-auto-refresh-toggle"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl border transition-all cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin text-emerald-600' : 'text-slate-400'}`} />
            <span>{autoRefresh ? 'Live Telemetry ON' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Main Feature View Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          id="sys-tab-worker-scaling"
          onClick={() => setActiveHealthTab('worker-scaling')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeHealthTab === 'worker-scaling'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Gauge className={`w-4 h-4 ${activeHealthTab === 'worker-scaling' ? 'text-amber-200 fill-amber-200' : 'text-amber-500 fill-amber-100'}`} />
          <span>Worker Node Scaling</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold border transition-all ${
            activeHealthTab === 'worker-scaling'
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-indigo-50 text-indigo-700 border-indigo-150'
          }`}>
            Auto-Scale &amp; Simulator
          </span>
        </button>

        <button
          id="sys-tab-risk-forecasting"
          onClick={() => setActiveHealthTab('risk-forecasting')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeHealthTab === 'risk-forecasting'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className={`w-4 h-4 ${activeHealthTab === 'risk-forecasting' ? 'text-indigo-200' : 'text-indigo-600'}`} />
          <span>Risk Forecasting Panel</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold border transition-all ${
            activeHealthTab === 'risk-forecasting'
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-indigo-50 text-indigo-700 border-indigo-150'
          }`}>
            Line Chart Predictive
          </span>
        </button>

        <button
          id="sys-tab-telemetry"
          onClick={() => setActiveHealthTab('telemetry')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeHealthTab === 'telemetry'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className={`w-4 h-4 ${activeHealthTab === 'telemetry' ? 'text-indigo-200 animate-pulse' : 'text-indigo-600'}`} />
          <span>Cluster Telemetry &amp; Nodes</span>
        </button>

        <button
          id="sys-tab-auto-scaling-events"
          onClick={() => setActiveHealthTab('auto-scaling-events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeHealthTab === 'auto-scaling-events'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className={`w-4 h-4 ${activeHealthTab === 'auto-scaling-events' ? 'text-indigo-200 animate-pulse' : 'text-indigo-600'}`} />
          <span>Auto-Scaling Events</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold border transition-all ${
            activeHealthTab === 'auto-scaling-events'
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-indigo-50 text-indigo-700 border-indigo-150'
          }`}>
            Live Logs
          </span>
        </button>

        <button
          id="sys-tab-benchmarking"
          onClick={() => setActiveHealthTab('benchmarking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeHealthTab === 'benchmarking'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className={`w-4 h-4 ${activeHealthTab === 'benchmarking' ? 'text-emerald-200' : 'text-emerald-600'}`} />
          <span>Historical Benchmarking</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold border transition-all ${
            activeHealthTab === 'benchmarking'
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-emerald-50 text-emerald-700 border-emerald-150'
          }`}>
            Job Comparison
          </span>
        </button>

        <button
          id="sys-tab-lifecycle-timeline"
          onClick={() => setActiveHealthTab('lifecycle-timeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeHealthTab === 'lifecycle-timeline'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className={`w-4 h-4 ${activeHealthTab === 'lifecycle-timeline' ? 'text-indigo-200' : 'text-indigo-600'}`} />
          <span>Migration Lifecycle Timeline</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold border transition-all ${
            activeHealthTab === 'lifecycle-timeline'
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-indigo-50 text-indigo-700 border-indigo-150'
          }`}>
            Job Stepper
          </span>
        </button>

        <button
          id="sys-tab-rules"
          onClick={() => setActiveHealthTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeHealthTab === 'rules'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${activeHealthTab === 'rules' ? 'text-rose-200' : 'text-rose-600'}`} />
          <span>Alert Notifications &amp; Thresholds</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold border transition-all ${
            activeHealthTab === 'rules'
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-rose-50 text-rose-700 border-rose-150'
          }`}>
            Email &amp; Webhooks
          </span>
        </button>
      </div>

      {/* Conditional Active Tab Content */}
      {activeHealthTab === 'worker-scaling' && (
        <WorkerNodeScalingPanel />
      )}

      {activeHealthTab === 'risk-forecasting' && (
        <MigrationRiskForecastingPanel
          currentCpu={metrics.cpuAvgPct}
          currentMemory={metrics.ramPct}
        />
      )}

      {activeHealthTab === 'benchmarking' && (
        <HistoricalPerformanceBenchmarkingPanel />
      )}

      {activeHealthTab === 'telemetry' && (
        <>
          {/* Main Core Resource Gauges (4 Grid Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gauge 1: CPU Load */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              Distributed CPU Cores
            </span>
            <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {targetNodes * 4} vCPUs
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{metrics.cpuAvgPct}%</div>
            <div className="text-[11px] font-mono text-slate-500">Threshold {cpuThresholdPct}%</div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  metrics.cpuAvgPct > cpuThresholdPct ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${metrics.cpuAvgPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Idle: {+(100 - metrics.cpuAvgPct).toFixed(1)}%</span>
              <span>Load: {metrics.cpuAvgPct > cpuThresholdPct ? 'High' : 'Normal'}</span>
            </div>
          </div>
        </div>

        {/* Gauge 2: RAM & JVM Heap */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-indigo-600" />
              Cluster RAM & JVM Heap
            </span>
            <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {metrics.ramAllocatedGB} / {metrics.ramTotalGB} GB
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{metrics.ramPct}%</div>
            <div className="text-[11px] font-mono text-slate-500">Threshold {ramThresholdPct}%</div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  metrics.ramPct > ramThresholdPct ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${metrics.ramPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Off-Heap: 128 GB</span>
              <span>G1GC Active</span>
            </div>
          </div>
        </div>

        {/* Gauge 3: Disk I/O Throughput */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              Disk I/O & NVMe Storage
            </span>
            <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {metrics.iops.toLocaleString()} IOPS
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {(metrics.diskReadMBps / 1000).toFixed(2)} GB/s
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Write {(metrics.diskWriteMBps / 1000).toFixed(2)} GB/s
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
              <div className="bg-indigo-600 h-2" style={{ width: '60%' }} />
              <div className="bg-emerald-400 h-2" style={{ width: '30%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Read (Source SAP)</span>
              <span>Write (Iceberg)</span>
            </div>
          </div>
        </div>

        {/* Gauge 4: Migration Pipeline Throughput */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-600" />
              Migration Velocity
            </span>
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              {targetNodes} Nodes
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {(metrics.migrationThroughputRecordsSec / 1000).toFixed(1)}k <span className="text-xs font-normal text-slate-500">rec/sec</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">{metrics.netEgressGbps} Gbps</div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="h-2 bg-indigo-500 rounded-full w-4/5 animate-pulse" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Target DB Ingestion</span>
              <span>TLS 1.3 Streams</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Controls & Time Range Selector */}
      <div id="telemetry-time-selector" className="bg-white rounded-2xl border border-slate-200 p-4 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Diagnostics Time Window & Threshold Monitor</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Filter telemetry duration window and configure critical visual spike threshold highlight limit (default: 90%).
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 self-end sm:self-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-rose-700 font-mono flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Warning Threshold:
            </span>
            <select
              id="sys-telemetry-threshold-limit"
              value={warningThresholdLimit}
              onChange={(e) => setWarningThresholdLimit(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer transition-all"
            >
              <option value={85}>85% Limit</option>
              <option value={90}>90% Limit (Default)</option>
              <option value={95}>95% Limit</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 font-mono">Time Range:</span>
            <select
              id="sys-telemetry-time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '5m' | '15m' | '1h')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
            >
              <option value="5m">Last 5 Minutes</option>
              <option value="15m">Last 15 Minutes</option>
              <option value="1h">Last 1 Hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Trend Chart and Diagnostics */}
      <ResourceMonitor
        currentCpu={metrics.cpuAvgPct}
        currentMemory={metrics.ramPct}
        cpuThreshold={cpuThresholdPct}
        ramThreshold={ramThresholdPct}
        warningThreshold={warningThresholdLimit}
        timeRange={timeRange}
      />

      {/* Latency Phase Decomposition Decomposition Analyzer */}
      <LatencyBreakdownChart currentCpu={metrics.cpuAvgPct} isSpikeActive={isSimulatingSpike} />
        </>
      )}

      {activeHealthTab === 'auto-scaling-events' && (
        <>
          {/* NEW: AUTO-SCALING & THROTTLING EVENTS AUDIT LOG PANEL */}
          <div id="auto-scaling-events-log-panel" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded-full border border-indigo-100 uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                Live Audit Stream
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Container Ingress &amp; Flow Control
              </span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Auto-Scaling &amp; Throttling Events Log
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Real-time register logging cluster node resource provisioning events and active SAP bulk extraction throttling adjustments triggered by the auto-scaler engine.
            </p>
          </div>

          {/* Filters & Actions Group */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setEventFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  eventFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                All Events ({autoScalingEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('provisioning')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  eventFilter === 'provisioning'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Provisioning ({autoScalingEvents.filter(e => e.type === 'PROVISION_UP' || e.type === 'PROVISION_DOWN').length})
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('throttling')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  eventFilter === 'throttling'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Throttling ({autoScalingEvents.filter(e => e.type === 'THROTTLE_ENGAGED' || e.type === 'THROTTLE_DISENGAGED').length})
              </button>
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={simulateRandomEvent}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200/60 transition-all cursor-pointer"
                title="Manually inject a simulated scaling or throttling event into the stream log"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Simulate Event</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoScalingEvents([])}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                title="Clear current log list history"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Clear History</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live System Status Subbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-150 px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-800 uppercase tracking-wider">
              Autoscale Engine Status: Active Watcher
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] font-medium text-slate-500">
              Monitoring CPU ({cpuThresholdPct}%) &amp; RAM ({ramThresholdPct}%) targets
            </span>
          </div>
          <div className="text-[11px] font-mono font-semibold text-slate-500">
            Current Cluster: <strong className="text-slate-800">{targetNodes} Spark Nodes</strong>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
          {autoScalingEvents.filter(e => {
            if (eventFilter === 'provisioning') return e.type === 'PROVISION_UP' || e.type === 'PROVISION_DOWN';
            if (eventFilter === 'throttling') return e.type === 'THROTTLE_ENGAGED' || e.type === 'THROTTLE_DISENGAGED';
            return true;
          }).length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-10 text-center space-y-3 bg-slate-50/40">
              <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">No matching events logged</p>
                <p className="text-[11px] text-slate-500">
                  Either no events have run for this filter, or history has been cleared. Click &quot;Simulate Event&quot; or trigger a simulated load spike to test.
                </p>
              </div>
            </div>
          ) : (
            autoScalingEvents
              .filter(e => {
                if (eventFilter === 'provisioning') return e.type === 'PROVISION_UP' || e.type === 'PROVISION_DOWN';
                if (eventFilter === 'throttling') return e.type === 'THROTTLE_ENGAGED' || e.type === 'THROTTLE_DISENGAGED';
                return true;
              })
              .map((event) => {
                const isUp = event.type === 'PROVISION_UP';
                const isDown = event.type === 'PROVISION_DOWN';
                const isThrottleOn = event.type === 'THROTTLE_ENGAGED';
                const isThrottleOff = event.type === 'THROTTLE_DISENGAGED';

                return (
                  <div
                    key={event.id}
                    className={`group relative overflow-hidden bg-white rounded-xl border p-4.5 transition-all hover:shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                      isUp
                        ? 'border-indigo-100 hover:border-indigo-200 bg-indigo-50/10'
                        : isDown
                        ? 'border-slate-150 hover:border-slate-200 bg-slate-50/20'
                        : isThrottleOn
                        ? 'border-amber-100 hover:border-amber-200 bg-amber-50/10'
                        : 'border-emerald-100 hover:border-emerald-200 bg-emerald-50/10'
                    }`}
                  >
                    {/* Left Stripe Decorator */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                      isUp ? 'bg-indigo-500' : isDown ? 'bg-slate-400' : isThrottleOn ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />

                    {/* Left: Type Icon & Main Description */}
                    <div className="flex items-start gap-3.5 pl-1.5 flex-1">
                      {/* Icon */}
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isUp
                          ? 'bg-indigo-100 text-indigo-700'
                          : isDown
                          ? 'bg-slate-100 text-slate-600'
                          : isThrottleOn
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isUp && <ArrowUpRight className="w-4 h-4 text-indigo-600" />}
                        {isDown && <ArrowDownRight className="w-4 h-4 text-slate-600" />}
                        {isThrottleOn && <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />}
                        {isThrottleOff && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>

                      {/* Info lines */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-black tracking-tight ${
                            isUp
                              ? 'text-indigo-950'
                              : isDown
                              ? 'text-slate-800'
                              : isThrottleOn
                              ? 'text-amber-950 font-extrabold'
                              : 'text-emerald-950'
                          }`}>
                            {event.action}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {event.timestamp}
                          </span>
                          <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isUp
                              ? 'bg-indigo-100 text-indigo-800'
                              : isDown
                              ? 'bg-slate-100 text-slate-800'
                              : isThrottleOn
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isUp || isDown ? 'Provisioning' : 'Flow Control'}
                          </span>
                        </div>

                        {/* Description Details text */}
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-2xl">
                          {event.details}
                        </p>

                        {/* Monospace Trigger explanation */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold font-mono">
                          <span className="text-slate-400">Trigger Parameter:</span>
                          <span className={`px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 border border-slate-200 ${
                            isThrottleOn ? 'bg-amber-50 text-amber-900 border-amber-150' : ''
                          }`}>
                            {event.trigger}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Metrics & Impact Badges */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 pl-11 md:pl-0 border-t md:border-t-0 border-slate-100 pt-3.5 md:pt-0">
                      {/* Node Pool adjustment */}
                      {(isUp || isDown) && (
                        <div className="text-right space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">Node Capacity Adjust</span>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-xs font-mono font-bold text-slate-500">{event.nodesBefore}</span>
                            <span className="text-[11px] text-slate-400">➔</span>
                            <span className={`text-sm font-mono font-black ${isUp ? 'text-indigo-600' : 'text-slate-700'}`}>
                              {event.nodesAfter} Workers
                            </span>
                            <span className={`text-[10px] font-bold font-mono px-1 rounded ${
                              isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isUp ? `+${event.nodesAfter - event.nodesBefore}` : `-${event.nodesBefore - event.nodesAfter}`}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Ingest Rate Throttling status */}
                      {(isThrottleOn || isThrottleOff) && (
                        <div className="text-right space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">Stream Throttle Level</span>
                          <div className="text-xs font-mono font-bold">
                            {isThrottleOn ? (
                              <span className="text-amber-600">Throttled (Ingest -55%)</span>
                            ) : (
                              <span className="text-emerald-600">Full Rate (100% Load)</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Before / After Impact Badges Grid */}
                      <div className="bg-slate-50 rounded-xl border border-slate-150 p-2 text-[10px] font-mono grid grid-cols-2 gap-x-3 gap-y-1 text-right shrink-0">
                        <div className="text-left text-slate-400 font-bold uppercase text-[9px]">Metric</div>
                        <div className="text-slate-400 font-bold uppercase text-[9px]">Impact Effect</div>

                        {/* Row 1: CPU load */}
                        <div className="text-left text-slate-600 font-semibold">CPU:</div>
                        <div>
                          <span className="text-slate-500">{event.impactMetrics.cpuBefore}%</span>
                          <span className="mx-1 text-slate-400">➔</span>
                          <span className={`font-bold ${
                            event.impactMetrics.cpuAfter < event.impactMetrics.cpuBefore ? 'text-emerald-600' : 'text-slate-700'
                          }`}>
                            {event.impactMetrics.cpuAfter}%
                          </span>
                        </div>

                        {/* Row 2: Ingest rate */}
                        <div className="text-left text-slate-600 font-semibold">Ingest:</div>
                        <div>
                          <span className="text-slate-500">{(event.impactMetrics.throughputBefore / 1000).toFixed(0)}k</span>
                          <span className="mx-1 text-slate-400">➔</span>
                          <span className={`font-bold ${
                            event.impactMetrics.throughputAfter > event.impactMetrics.throughputBefore
                              ? 'text-emerald-600'
                              : event.impactMetrics.throughputAfter < event.impactMetrics.throughputBefore
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}>
                            {(event.impactMetrics.throughputAfter / 1000).toFixed(0)}k/s
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* NEW: CONFIGURE AUTO-SCALING PANEL */}
      <div id="auto-scaling-config-panel" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-mono font-bold rounded-full border border-indigo-100 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                Kubernetes Pod Auto-Scaler Engine
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Elastic Worker Pool Scaling
              </span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Gauge className="w-5 h-5 text-indigo-600" />
              Configure Worker Node Auto-Scaling Rules
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set automated CPU/RAM utilization thresholds to dynamically scale parallel migration worker nodes up or down.
            </p>
          </div>

          {/* Master Enable/Disable Switch */}
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">Auto-Scaling Status:</span>
            <button
              type="button"
              id="sys-autoscale-master-toggle"
              onClick={() => setAutoScaleEnabled(!autoScaleEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                autoScaleEnabled
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{autoScaleEnabled ? 'ENABLED (ACTIVE)' : 'DISABLED (MANUAL)'}</span>
            </button>
          </div>
        </div>

        {/* Policy Mode Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <button
            type="button"
            onClick={() => setAutoScaleMode('Reactive')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              autoScaleMode === 'Reactive'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>Reactive Surge Scaling</span>
              {autoScaleMode === 'Reactive' && <Check className="w-4 h-4" />}
            </div>
            <p className={`text-[11px] mt-1 ${autoScaleMode === 'Reactive' ? 'text-indigo-100' : 'text-slate-500'}`}>
              Triggers +16 worker pods immediately when CPU/RAM breaches threshold over evaluation window.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setAutoScaleMode('Predictive')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              autoScaleMode === 'Predictive'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>Predictive ML Scaling</span>
              {autoScaleMode === 'Predictive' && <Check className="w-4 h-4" />}
            </div>
            <p className={`text-[11px] mt-1 ${autoScaleMode === 'Predictive' ? 'text-indigo-100' : 'text-slate-500'}`}>
              Pre-provisions worker nodes 15 minutes before scheduled peak SAP extraction windows.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setAutoScaleMode('Scheduled')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              autoScaleMode === 'Scheduled'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>Scheduled Off-Peak Pool</span>
              {autoScaleMode === 'Scheduled' && <Check className="w-4 h-4" />}
            </div>
            <p className={`text-[11px] mt-1 ${autoScaleMode === 'Scheduled' ? 'text-indigo-100' : 'text-slate-500'}`}>
              Maintains fixed 256 nodes during off-peak night migration shifts (22:00 – 06:00 UTC).
            </p>
          </button>
        </div>

        {/* Sliders & Threshold Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          {/* Column 1: Node Boundaries */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Cluster Pool Boundaries
            </h3>

            {/* Min Nodes */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700">Minimum Node Reserve</label>
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {minNodes} Nodes
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                step={8}
                value={minNodes}
                onChange={(e) => setMinNodes(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Max Nodes */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700">Maximum Scale Ceiling</label>
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {maxNodes} Nodes
                </span>
              </div>
              <input
                type="range"
                min={64}
                max={512}
                step={16}
                value={maxNodes}
                onChange={(e) => setMaxNodes(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Current Manual Override */}
            <div className="space-y-1.5 border-t border-slate-200 pt-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-800">Current Active Pool Target</label>
                <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {targetNodes} Worker Nodes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTargetNodes((prev) => Math.max(minNodes, prev - nodesPerScaleStep))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  -{nodesPerScaleStep}
                </button>
                <div className="flex-1 text-center font-mono font-extrabold text-slate-900 bg-white py-1.5 rounded-lg border border-slate-200">
                  {targetNodes} Worker Nodes ({targetNodes * 4} Cores)
                </div>
                <button
                  type="button"
                  onClick={() => setTargetNodes((prev) => Math.min(maxNodes, prev + nodesPerScaleStep))}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 cursor-pointer"
                >
                  +{nodesPerScaleStep}
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Trigger Thresholds */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Scale-Up Trigger Rules
            </h3>

            {/* CPU Scale Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700">CPU Saturation Trigger</label>
                <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  &gt; {cpuThresholdPct}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                value={cpuThresholdPct}
                onChange={(e) => setCpuThresholdPct(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* RAM Scale Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700">RAM / JVM Heap Pressure Trigger</label>
                <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  &gt; {ramThresholdPct}%
                </span>
              </div>
              <input
                type="range"
                min={60}
                max={95}
                value={ramThresholdPct}
                onChange={(e) => setRamThresholdPct(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Scale-Up Increment Step */}
            <div className="space-y-1.5 border-t border-slate-200 pt-3">
              <label className="font-bold text-slate-700 block">Nodes Added Per Scale Event</label>
              <select
                value={nodesPerScaleStep}
                onChange={(e) => setNodesPerScaleStep(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value={8}>+8 Worker Pods (+32 vCPU Cores)</option>
                <option value={16}>+16 Worker Pods (+64 vCPU Cores)</option>
                <option value={32}>+32 Worker Pods (+128 vCPU Cores)</option>
              </select>
            </div>
          </div>

          {/* Column 3: Impact Estimator & Evaluation Window */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                Pipeline Ingestion Estimator
              </span>
              <span className="text-[10px] font-mono text-emerald-750 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 uppercase font-bold">Live Model</span>
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Active Worker Nodes:</span>
                <strong className="text-slate-900 font-bold">{targetNodes} Nodes</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total vCPU Cores:</span>
                <strong className="text-slate-900 font-bold">{targetNodes * 4} Cores</strong>
              </div>
              <div className="flex justify-between text-indigo-750 font-bold">
                <span>Parallel Ingestion Velocity:</span>
                <strong className="text-emerald-750 text-sm font-extrabold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-150">
                  {((targetNodes / 128) * 145000 / 1000).toFixed(1)}k rec/sec
                </strong>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px] border-t border-slate-150 pt-2">
                <span>Scale-down Cooldown:</span>
                <span className="text-slate-700 font-medium">{cooldownMins} minutes</span>
              </div>
            </div>

            {/* Test Auto-Scale Rule Engine Button */}
            <div className="pt-2">
              <button
                type="button"
                id="sys-autoscale-test-rules-btn"
                onClick={runRuleEvaluationTest}
                disabled={isTestingRules}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-3xs active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-4 h-4 fill-current ${isTestingRules ? 'animate-spin' : ''}`} />
                <span>{isTestingRules ? 'Evaluating Rules...' : 'Test Auto-Scale Rule Engine'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rule Engine Log Trace Terminal */}
        {autoScaleLogs.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 space-y-2 shadow-3xs">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2">
              <span className="text-[10px] text-indigo-750 uppercase font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                Auto-Scaling Telemetry & Rule Execution Trace Log
              </span>
              <span className="text-[10px] text-emerald-750 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 uppercase font-mono">Rule Engine OK</span>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1 font-mono">
              {autoScaleLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] border-b border-slate-50/50 pb-1.5 last:border-0">
                  <span className="text-slate-400 shrink-0 font-bold">[{log.timestamp}]</span>
                  <span
                    className={
                      log.level === 'WARN'
                        ? 'text-amber-700 font-bold'
                        : log.level === 'SUCCESS'
                        ? 'text-emerald-750 font-bold'
                        : 'text-indigo-650 font-medium'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {activeHealthTab === 'telemetry' && (
        <>
          {/* Cluster-Wide Multi-Regional Health Heat Map */}
          <ClusterHealthHeatMap />

          {/* Interactive Worker Node Topology Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Worker Node Topology & Memory Load Distribution ({nodes.length} Sampled Instance Nodes)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual node telemetry showing per-node vCPU saturation, RAM allocation, and JVM garbage collection activity.
            </p>
          </div>

          {/* Node Filter Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Filter Node Status:</span>
            <select
              value={nodeFilter}
              onChange={(e) => setNodeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Nodes ({nodes.length} Nodes)</option>
              <option value="Healthy">Healthy Only</option>
              <option value="High Load">High Load Only</option>
              <option value="GC Active">GC Active Only</option>
            </select>
          </div>
        </div>

        {/* Node Grid Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {filteredNodes.map((node) => (
            <div
              key={node.id}
              className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-all hover:scale-105 cursor-pointer ${
                node.status === 'High Load'
                  ? 'bg-amber-50/80 border-amber-300'
                  : node.status === 'GC Active'
                  ? 'bg-purple-50/80 border-purple-300'
                  : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[11px] text-slate-900">{node.name.replace('Spark-Worker-', 'W-')}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    node.status === 'High Load'
                      ? 'bg-amber-500 animate-ping'
                      : node.status === 'GC Active'
                      ? 'bg-purple-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>

              <div className="font-mono text-[10px] space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>CPU</span>
                  <span className="font-bold text-slate-900">{node.cpuUsagePct}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-1 rounded-full ${node.cpuUsagePct > cpuThresholdPct ? 'bg-amber-500' : 'bg-indigo-600'}`}
                    style={{ width: `${node.cpuUsagePct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                  <span>RAM: {node.ramUsagePct}%</span>
                  <span>{node.jvmGcPauseMs}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}

      {activeHealthTab === 'rules' && (
        /* Resource Guardrails & Alarms Tab */
        <div className="space-y-6">
          <AlertNotificationConfigurator
            initialCpuThreshold={cpuThresholdPct}
            initialRamThreshold={ramThresholdPct}
            onThresholdsChange={(cpu, ram) => {
              setCpuThresholdPct(cpu);
              setRamThresholdPct(ram);
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Resource Threshold Alarming */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                Automatic Resource Guardrails &amp; Auto-Scaling Rules
              </h2>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">CPU Thread Saturation (&gt; {cpuThresholdPct}% for {evalWindowMins} mins)</div>
                    <div className="text-slate-500 text-[11px]">Auto-scales Spark cluster by +{nodesPerScaleStep} worker nodes &amp; dispatches alerts</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[10px]">
                    {autoScaleEnabled ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">RAM Heap Saturation (&gt; {ramThresholdPct}% Heap)</div>
                    <div className="text-slate-500 text-[11px]">Triggers parallel off-heap buffer flush &amp; Webhook dispatch</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[10px]">
                    ACTIVE
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Disk Write Queue Depth (&gt; 50MB Backlog)</div>
                    <div className="text-slate-500 text-[11px]">Throttles source SAP extractor batch window</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[10px]">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Historical Storage Pressure */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600 animate-pulse" />
                  Lakehouse Storage Volume Pressure
                </span>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                  ZSTD Parquet 4.2x Compressed
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Target Iceberg Lakehouse:</span>
                  <span className="font-bold text-slate-900">32.4 TB / 45.8 TB Migrated</span>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="bg-indigo-600 h-2.5 rounded-full w-3/4" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 shadow-3xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Billions Records</span>
                    <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 mt-1 rounded border border-emerald-150 inline-block">
                      13.1B / 18.5B
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 shadow-3xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">NVMe Cache Hit Rate</span>
                    <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 mt-1 rounded border border-indigo-150 inline-block">
                      99.4%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeHealthTab === 'lifecycle-timeline' && (
        <MigrationLifecycleTimeline />
      )}
    </div>
  );
};

