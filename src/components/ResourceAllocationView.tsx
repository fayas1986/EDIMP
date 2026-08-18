import React, { useState, useEffect, useRef } from 'react';
import { MigrationJob } from '../types';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Cpu,
  Server,
  Activity,
  Play,
  Pause,
  Zap,
  RefreshCw,
  Sliders,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Flame,
  Database,
  Layers,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  PieChart,
  Info,
  HardDrive,
  Check,
  Trash2,
  Plus,
  X,
} from 'lucide-react';

interface ResourceAllocationViewProps {
  jobs: MigrationJob[];
}

export const ResourceAllocationView: React.FC<ResourceAllocationViewProps> = ({ jobs }) => {
  const [data, setData] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(3000); // ms
  const [eventAlert, setEventAlert] = useState<{ type: 'spike' | 'gc'; message: string; timestamp: string } | null>(null);

  // View & Filter States
  const [activeSubTab, setActiveSubTab] = useState<'demand-forecast' | 'stacked-bars' | 'live-telemetry' | 'forecast' | 'cluster-table' | 'auto-scaling'>('demand-forecast');
  const [barDisplayMode, setBarDisplayMode] = useState<'stacked' | 'grouped'>('stacked');
  const [selectedNodeFilter, setSelectedNodeFilter] = useState<string>('all');

  // Resource Demand Forecast States
  const [demandForecastHorizon, setDemandForecastHorizon] = useState<number>(24); // hours: 12, 24, 72, 168
  const [demandGrowthModel, setDemandGrowthModel] = useState<'linear' | 'burst' | 'cyclical'>('linear');
  const [targetSlaCpuCap, setTargetSlaCpuCap] = useState<number>(75); // % max utilization SLA cap
  const [planAppliedNotification, setPlanAppliedNotification] = useState<string | null>(null);

  // Forecast state
  const [forecastHorizon, setForecastHorizon] = useState<number>(60); // minutes
  const [forecastScenario, setForecastScenario] = useState<'standard' | 'burst' | 'compressed'>('standard');

  // Auto-Scaling state and form fields
  const [autoScalingRules, setAutoScalingRules] = useState<any[]>([
    {
      id: 'RULE-01',
      connectorName: 'SAP S/4HANA GL Sync',
      metric: 'CPU',
      condition: 'greater_than',
      thresholdValue: 80,
      actionType: 'throttle_rps',
      actionValue: 120,
      isActive: true,
      lastTriggered: '10 mins ago',
      triggerCount: 4,
      isCurrentlyTriggered: false,
    },
    {
      id: 'RULE-02',
      connectorName: 'Salesforce Account Delta',
      metric: 'RAM',
      condition: 'greater_than',
      thresholdValue: 70,
      actionType: 'reduce_concurrency',
      actionValue: 3,
      isActive: true,
      lastTriggered: 'Never',
      triggerCount: 0,
      isCurrentlyTriggered: false,
    },
    {
      id: 'RULE-03',
      connectorName: 'PostgreSQL Staging Sync',
      metric: 'CPU',
      condition: 'greater_than',
      thresholdValue: 75,
      actionType: 'pause_pipeline',
      actionValue: 0,
      isActive: false,
      lastTriggered: '1 hour ago',
      triggerCount: 1,
      isCurrentlyTriggered: false,
    },
  ]);

  // Form states
  const [newRuleConnector, setNewRuleConnector] = useState('SAP S/4HANA GL Sync');
  const [newRuleMetric, setNewRuleMetric] = useState<'CPU' | 'RAM'>('CPU');
  const [newRuleCondition, setNewRuleCondition] = useState<'greater_than' | 'less_than'>('greater_than');
  const [newRuleThreshold, setNewRuleThreshold] = useState<number>(85);
  const [newRuleActionType, setNewRuleActionType] = useState<'throttle_rps' | 'reduce_concurrency' | 'pause_pipeline'>('throttle_rps');
  const [newRuleActionValue, setNewRuleActionValue] = useState<number>(100);

  // Simulation Alert logs
  const [autoScalingLogs, setAutoScalingLogs] = useState<any[]>([
    {
      timestamp: new Date(Date.now() - 600000).toLocaleTimeString(),
      message: 'Rule RULE-01 Triggered: CPU usage exceeded 80% (88.4%). Adjusted "SAP S/4HANA GL Sync" Throttling limit to 120 RPS.',
      type: 'warning',
    },
    {
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
      message: 'Rule RULE-03 triggered manually: Paused "PostgreSQL Staging Sync" to conserve staging nodes resources.',
      type: 'info',
    }
  ]);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule = {
      id: `RULE-0${autoScalingRules.length + 1}`,
      connectorName: newRuleConnector,
      metric: newRuleMetric,
      condition: newRuleCondition,
      thresholdValue: Number(newRuleThreshold),
      actionType: newRuleActionType,
      actionValue: Number(newRuleActionValue),
      isActive: true,
      lastTriggered: 'Never',
      triggerCount: 0,
      isCurrentlyTriggered: false,
    };
    setAutoScalingRules([...autoScalingRules, newRule]);
    
    // Add success log
    setAutoScalingLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        message: `New rule ${newRule.id} created for "${newRuleConnector}". Metric: ${newRuleMetric} ${newRuleCondition === 'greater_than' ? '>' : '<'} ${newRuleThreshold}%.`,
        type: 'success',
      },
      ...prev
    ]);
  };

  const handleToggleRule = (id: string) => {
    setAutoScalingRules(prev => prev.map(rule => {
      if (rule.id === id) {
        const nextActive = !rule.isActive;
        // Log status change
        setAutoScalingLogs(logs => [
          {
            timestamp: new Date().toLocaleTimeString(),
            message: `Rule ${rule.id} ${nextActive ? 'Enabled' : 'Disabled'} by administrator.`,
            type: 'info',
          },
          ...logs
        ]);
        return { ...rule, isActive: nextActive };
      }
      return rule;
    }));
  };

  const handleDeleteRule = (id: string) => {
    const deletedRule = autoScalingRules.find(r => r.id === id);
    setAutoScalingRules(prev => prev.filter(rule => rule.id !== id));
    if (deletedRule) {
      setAutoScalingLogs(logs => [
        {
          timestamp: new Date().toLocaleTimeString(),
          message: `Rule ${deletedRule.id} deleted for "${deletedRule.connectorName}".`,
          type: 'danger',
        },
        ...logs
      ]);
    }
  };

  // Dynamic rule evaluation based on live CPU/RAM metrics
  useEffect(() => {
    if (data.length === 0 || isPaused) return;
    const latest = data[data.length - 1];
    if (!latest) return;

    const clusterTotalMemory = 34611;
    const currentCpu = latest.cpu;
    const currentRamPct = parseFloat(((latest.memory / clusterTotalMemory) * 100).toFixed(1));

    setAutoScalingRules(prevRules => {
      let changed = false;
      const updated = prevRules.map(rule => {
        if (!rule.isActive) return rule;

        const currentVal = rule.metric === 'CPU' ? currentCpu : currentRamPct;
        const isTriggered = rule.condition === 'greater_than'
          ? currentVal > rule.thresholdValue
          : currentVal < rule.thresholdValue;

        if (isTriggered && !rule.isCurrentlyTriggered) {
          changed = true;
          const timestamp = new Date().toLocaleTimeString();
          const actionText = rule.actionType === 'throttle_rps'
            ? `Throttled Requests to ${rule.actionValue} RPS`
            : rule.actionType === 'reduce_concurrency'
            ? `Reduced Concurrency to ${rule.actionValue} threads`
            : 'Paused Migration Pipeline';

          // Add a log entry dynamically
          setAutoScalingLogs(logs => [
            {
              timestamp,
              message: `🚨 Rule ${rule.id} Triggered: ${rule.metric} usage at ${currentVal}% crossed threshold of ${rule.thresholdValue}%. ${actionText} on connector "${rule.connectorName}".`,
              type: 'warning',
            },
            ...logs
          ]);

          return {
            ...rule,
            isCurrentlyTriggered: true,
            triggerCount: rule.triggerCount + 1,
            lastTriggered: 'Just now',
          };
        } else if (!isTriggered && rule.isCurrentlyTriggered) {
          changed = true;
          const timestamp = new Date().toLocaleTimeString();
          
          // Clear log entry
          setAutoScalingLogs(logs => [
            {
              timestamp,
              message: `✅ Rule ${rule.id} Recovered: ${rule.metric} usage at ${currentVal}% returned to normal. Restoring default throughput for "${rule.connectorName}".`,
              type: 'success',
            },
            ...logs
          ]);

          return {
            ...rule,
            isCurrentlyTriggered: false,
          };
        }
        return rule;
      });

      return changed ? updated : prevRules;
    });
  }, [data, isPaused]);



  // Simulate Spike or Garbage Collection state
  const spikeFactor = useRef(1.0);
  const gcActive = useRef(false);

  // Compute Node Core Allocation Stacked Data
  const rawComputeNodeData = [
    {
      node: 'Node-01 (Master Spark)',
      shortNode: 'Node-01',
      totalCapacity: 64,
      'SAP S/4HANA GL Sync': 22,
      'Salesforce Account Delta': 14,
      'Oracle ERP Payroll': 8,
      'HRMS Employee Master': 6,
      'PostgreSQL Staging Sync': 4,
      'Reserved System Overhead': 10,
    },
    {
      node: 'Node-02 (Worker Pod A)',
      shortNode: 'Node-02',
      totalCapacity: 32,
      'SAP S/4HANA GL Sync': 12,
      'Salesforce Account Delta': 8,
      'Oracle ERP Payroll': 4,
      'HRMS Employee Master': 2,
      'PostgreSQL Staging Sync': 2,
      'Reserved System Overhead': 4,
    },
    {
      node: 'Node-03 (Worker Pod B)',
      shortNode: 'Node-03',
      totalCapacity: 32,
      'SAP S/4HANA GL Sync': 8,
      'Salesforce Account Delta': 10,
      'Oracle ERP Payroll': 6,
      'HRMS Employee Master': 2,
      'PostgreSQL Staging Sync': 2,
      'Reserved System Overhead': 4,
    },
    {
      node: 'Node-04 (Worker Pod C)',
      shortNode: 'Node-04',
      totalCapacity: 32,
      'SAP S/4HANA GL Sync': 6,
      'Salesforce Account Delta': 12,
      'Oracle ERP Payroll': 4,
      'HRMS Employee Master': 4,
      'PostgreSQL Staging Sync': 2,
      'Reserved System Overhead': 4,
    },
    {
      node: 'Node-05 (Edge Ingestion)',
      shortNode: 'Node-05',
      totalCapacity: 16,
      'SAP S/4HANA GL Sync': 2,
      'Salesforce Account Delta': 2,
      'Oracle ERP Payroll': 4,
      'HRMS Employee Master': 4,
      'PostgreSQL Staging Sync': 2,
      'Reserved System Overhead': 2,
    },
  ];

  const computeNodeData = selectedNodeFilter === 'all'
    ? rawComputeNodeData
    : rawComputeNodeData.filter(n => n.shortNode === selectedNodeFilter);

  const jobCoreKeys = [
    { key: 'SAP S/4HANA GL Sync', color: '#4f46e5' },
    { key: 'Salesforce Account Delta', color: '#0284c7' },
    { key: 'Oracle ERP Payroll', color: '#7c3aed' },
    { key: 'HRMS Employee Master', color: '#059669' },
    { key: 'PostgreSQL Staging Sync', color: '#d97706' },
    { key: 'Reserved System Overhead', color: '#64748b' },
  ];

  // Memory Overhead Stacked Data (in MB)
  const memoryOverheadData = [
    {
      job: 'SAP S/4HANA GL Sync',
      shortJob: 'SAP GL Sync',
      totalMemMb: 12288,
      'JVM Heap Allocation': 6144,
      'Off-Heap Serialization Buffer': 2048,
      'Garbage Collection Overhead': 1536,
      'Network I/O Socket Buffer': 1024,
      'OS & Container Reserved': 1536,
    },
    {
      job: 'Salesforce Account Delta',
      shortJob: 'SFDC Accounts',
      totalMemMb: 8192,
      'JVM Heap Allocation': 4096,
      'Off-Heap Serialization Buffer': 1536,
      'Garbage Collection Overhead': 1024,
      'Network I/O Socket Buffer': 512,
      'OS & Container Reserved': 1024,
    },
    {
      job: 'Oracle ERP Payroll',
      shortJob: 'Oracle Payroll',
      totalMemMb: 6144,
      'JVM Heap Allocation': 3072,
      'Off-Heap Serialization Buffer': 1024,
      'Garbage Collection Overhead': 768,
      'Network I/O Socket Buffer': 512,
      'OS & Container Reserved': 768,
    },
    {
      job: 'HRMS Employee Master',
      shortJob: 'HRMS Master',
      totalMemMb: 4096,
      'JVM Heap Allocation': 2048,
      'Off-Heap Serialization Buffer': 768,
      'Garbage Collection Overhead': 512,
      'Network I/O Socket Buffer': 256,
      'OS & Container Reserved': 512,
    },
    {
      job: 'PostgreSQL Staging Sync',
      shortJob: 'PG Staging',
      totalMemMb: 3072,
      'JVM Heap Allocation': 1536,
      'Off-Heap Serialization Buffer': 512,
      'Garbage Collection Overhead': 384,
      'Network I/O Socket Buffer': 256,
      'OS & Container Reserved': 384,
    },
  ];

  const memComponentKeys = [
    { key: 'JVM Heap Allocation', color: '#3b82f6' },
    { key: 'Off-Heap Serialization Buffer', color: '#8b5cf6' },
    { key: 'Garbage Collection Overhead', color: '#f59e0b' },
    { key: 'Network I/O Socket Buffer', color: '#10b981' },
    { key: 'OS & Container Reserved', color: '#64748b' },
  ];

  // Streaming Data Engine
  useEffect(() => {
    const runningJobs = jobs.filter(j => j.status === 'Running');
    const effectiveCount = runningJobs.length > 0 ? runningJobs.length : 4;
    const baseCpu = effectiveCount * 18;
    const baseMem = effectiveCount * 1250;
    const baseThroughput = runningJobs.reduce((acc, j) => acc + (j.throughputRps || 0), 0) || 1350;

    const generateDataPoint = (timeOffset: number) => {
      const noise = Math.random() * 6 - 3;
      const currentSpike = spikeFactor.current;

      // Slow decay spike factor back to 1.0
      if (timeOffset === 0 && spikeFactor.current > 1.0) {
        spikeFactor.current = Math.max(1.0, spikeFactor.current - 0.25);
      }

      // Memory reclaim drop simulation
      const currentMemMultiplier = gcActive.current ? 0.45 : 1.0;
      if (timeOffset === 0 && gcActive.current) {
        gcActive.current = false; // Reset spike status
      }

      const timestamp = new Date(Date.now() - timeOffset * updateInterval);
      const timeLabel = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return {
        time: timestamp,
        timeLabel,
        cpu: Number(Math.max(5, Math.min(99, (baseCpu + noise) * currentSpike + (baseThroughput / 160))).toFixed(1)),
        memory: Number(Math.max(256, (baseMem + (noise * 30)) * currentMemMultiplier).toFixed(0)),
        throughput: Number(Math.max(50, (baseThroughput + (noise * 15)) * currentSpike).toFixed(0)),
      };
    };

    // Initial fill of 15 data points
    if (data.length === 0) {
      const initialData = Array.from({ length: 15 })
        .map((_, i) => generateDataPoint(14 - i))
        .reverse();
      setData(initialData);
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      setData(prev => {
        const nextPoints = [...prev.slice(1), generateDataPoint(0)];
        return nextPoints;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [jobs, isPaused, updateInterval, data.length]);

  // Simulation Trigger Handlers
  const triggerTrafficSpike = () => {
    spikeFactor.current = 2.4;
    setEventAlert({
      type: 'spike',
      message: 'Traffic Surge Simulated: Pipeline load spiked to 2.4x. Processing queues accelerated!',
      timestamp: new Date().toLocaleTimeString(),
    });
    // Dynamically insert spike immediately into current stream for reactive visual feedback
    setData(prev => {
      const last = prev[prev.length - 1];
      const spikedLast = {
        ...last,
        cpu: Number(Math.min(98, last.cpu * 2.2).toFixed(1)),
        throughput: Number((last.throughput * 2.4).toFixed(0)),
      };
      return [...prev.slice(1), spikedLast];
    });
    setTimeout(() => setEventAlert(null), 5000);
  };

  const triggerGc = () => {
    gcActive.current = true;
    setEventAlert({
      type: 'gc',
      message: 'Memory Garbage Collection Cleansed: JVM/Node heap cleared, reclaiming active segments.',
      timestamp: new Date().toLocaleTimeString(),
    });
    setData(prev => {
      const last = prev[prev.length - 1];
      const reclaimedLast = {
        ...last,
        memory: Number((last.memory * 0.45).toFixed(0)),
      };
      return [...prev.slice(1), reclaimedLast];
    });
    setTimeout(() => setEventAlert(null), 5000);
  };






  // Calculate live average parameters for fast metrics panels
  const latestData = data[data.length - 1] || { cpu: 0, memory: 0, throughput: 0 };
  const avgCpu = data.length > 0 ? (data.reduce((acc, curr) => acc + curr.cpu, 0) / data.length).toFixed(1) : '0';
  const peakThroughput = data.length > 0 ? Math.round(Math.max(...data.map(d => d.throughput))) : 0;

  return (
    <div id="resource-monitor-container" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Title & Header Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Resource Allocation & Utilization</h2>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compute node core usage & memory overhead distribution per migration job via stacked bar visualizer.
          </p>
        </div>

        {/* Streaming & Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 border border-slate-200/80 p-2 rounded-xl">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 px-2.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Feed Rate:</span>
          </div>

          <select
            value={updateInterval}
            onChange={(e) => setUpdateInterval(Number(e.target.value))}
            className="bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg px-2.5 py-1 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value={1000}>Realtime (1s)</option>
            <option value={3000}>Balanced (3s)</option>
            <option value={5000}>Standard (5s)</option>
          </select>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1 px-3 rounded-lg flex items-center gap-1.5 text-[11px] font-bold border transition cursor-pointer ${
              isPaused
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 text-amber-600 fill-current" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-slate-500 fill-current" />
                <span>Pause</span>
              </>
            )}
          </button>

          <div className="h-5 w-px bg-slate-200" />

          {/* Simulation triggers */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={triggerTrafficSpike}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="Simulate load surge"
            >
              <Flame className="w-3 h-3 text-indigo-600 animate-pulse" />
              <span>Simulate Spike</span>
            </button>

            <button
              type="button"
              onClick={triggerGc}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="Simulate garbage collection reclaim"
            >
              <RefreshCw className="w-3 h-3 text-emerald-600" />
              <span>Trigger GC</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
        <div className="flex items-center gap-1.5">
          <button
            id="subtab-demand-forecast"
            type="button"
            onClick={() => setActiveSubTab('demand-forecast')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'demand-forecast'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Demand Forecast</span>
            <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 font-extrabold rounded-full text-[10px] font-mono">AI Predictive</span>
          </button>

          <button
            id="subtab-stacked-bars"
            type="button"
            onClick={() => setActiveSubTab('stacked-bars')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'stacked-bars'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Stacked Bar Analysis</span>
          </button>

          <button
            id="subtab-live-telemetry"
            type="button"
            onClick={() => setActiveSubTab('live-telemetry')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'live-telemetry'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Stream Telemetry</span>
          </button>

          <button
            id="subtab-forecast"
            type="button"
            onClick={() => setActiveSubTab('forecast')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'forecast'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Volume Forecast</span>
          </button>

          <button
            id="subtab-cluster-table"
            type="button"
            onClick={() => setActiveSubTab('cluster-table')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'cluster-table'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Cluster Node Table</span>
          </button>

          <button
            id="subtab-auto-scaling"
            type="button"
            onClick={() => setActiveSubTab('auto-scaling')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'auto-scaling'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap className={`w-4 h-4 ${autoScalingRules.some(r => r.isCurrentlyTriggered) ? 'text-amber-400 animate-bounce' : ''}`} />
            <span>Resource Auto-Scaling</span>
            {autoScalingRules.some(r => r.isCurrentlyTriggered) && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>
        </div>

        {/* Stacked Bar Controls if on Stacked Sub-Tab */}
        {activeSubTab === 'stacked-bars' && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-1.5">Node Filter:</span>
              <select
                value={selectedNodeFilter}
                onChange={(e) => setSelectedNodeFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Compute Nodes (5)</option>
                <option value="Node-01">Node-01 (Master)</option>
                <option value="Node-02">Node-02 (Worker A)</option>
                <option value="Node-03">Node-03 (Worker B)</option>
                <option value="Node-04">Node-04 (Worker C)</option>
                <option value="Node-05">Node-05 (Edge Ingestion)</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={() => setBarDisplayMode('stacked')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                  barDisplayMode === 'stacked' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'
                }`}
              >
                Stacked
              </button>
              <button
                type="button"
                onClick={() => setBarDisplayMode('grouped')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                  barDisplayMode === 'grouped' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'
                }`}
              >
                Grouped
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event Alert Banner */}
      {eventAlert && (
        <div className={`p-3 rounded-xl border flex items-center gap-2.5 justify-between animate-fade-in ${
          eventAlert.type === 'spike'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-4 h-4 shrink-0 ${eventAlert.type === 'spike' ? 'text-rose-600' : 'text-emerald-600'}`} />
            <span className="text-xs font-semibold">
              <strong className="font-extrabold">[{eventAlert.timestamp}]</strong> {eventAlert.message}
            </span>
          </div>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase shrink-0 bg-white/70 shadow-2xs">
            Event Triggered
          </span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-500" /> Compute Cores Allocated
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-900 font-mono">148 / 176</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              84.1% Cores
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Server className="w-3 h-3 text-purple-500" /> Memory Footprint Overhead
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-purple-700 font-mono">33.8 GB</span>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
              5 Jobs Stacked
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-sky-500" /> Active Worker Threads
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-900 font-mono">256 Threads</span>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
              Optimal
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" /> Garbage Collector Overhead
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-amber-700 font-mono">1.8% Time</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              G1GC Healthy
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: STACKED BAR ANALYSIS (Compute Node Usage & Memory Overhead) */}
      {activeSubTab === 'stacked-bars' && (
        <div className="space-y-6 pt-1 animate-fade-in">
          {/* Stacked Chart 1: Compute Node Usage Per Migration Job */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Compute Node CPU Core Usage Per Migration Job (Stacked)
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    Cores / Threads
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Stacked distribution of physical CPU cores allocated to migration pipelines across cluster nodes.
                </p>
              </div>

              {/* Legend Ribbon */}
              <div className="flex flex-wrap items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
                {jobCoreKeys.map(jk => (
                  <div key={jk.key} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs inline-block shadow-2xs" style={{ backgroundColor: jk.color }} />
                    <span className="text-slate-700">{jk.key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recharts Stacked Bar Chart */}
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={computeNodeData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="shortNode" stroke="#64748b" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'monospace' }} unit=" Cores" />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const totalAllocated = payload.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
                      return (
                        <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs font-sans space-y-2 min-w-56">
                          <div className="font-bold border-b border-slate-800 pb-1 text-slate-300 font-mono flex justify-between">
                            <span>{label}</span>
                            <span className="text-indigo-400 font-bold">{totalAllocated} Cores Total</span>
                          </div>
                          <div className="space-y-1">
                            {payload.map((entry: any) => {
                              const val = Number(entry.value) || 0;
                              const pct = ((val / totalAllocated) * 100).toFixed(1);
                              return (
                                <div key={entry.name} className="flex items-center justify-between text-[11px]">
                                  <span className="flex items-center gap-1.5 text-slate-300">
                                    <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ backgroundColor: entry.color }} />
                                    {entry.name}:
                                  </span>
                                  <span className="font-mono font-bold text-white">
                                    {val} Cores ({pct}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }}
                  />
                  {jobCoreKeys.map((jk) => (
                    <Bar
                      key={jk.key}
                      dataKey={jk.key}
                      stackId={barDisplayMode === 'stacked' ? 'a' : undefined}
                      fill={jk.color}
                      radius={barDisplayMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stacked Chart 2: Memory Overhead Per Migration Job */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Memory Overhead & Heap Distribution Per Migration Job (Stacked MB)
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                    RAM / Heap Breakdown
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Itemized memory overhead stack showing JVM heap, off-heap buffers, GC pauses, and OS reservations per migration job.
                </p>
              </div>

              {/* Memory Legend Ribbon */}
              <div className="flex flex-wrap items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
                {memComponentKeys.map(mk => (
                  <div key={mk.key} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs inline-block shadow-2xs" style={{ backgroundColor: mk.color }} />
                    <span className="text-slate-700">{mk.key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recharts Stacked Memory Chart */}
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memoryOverheadData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="shortJob" stroke="#64748b" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'monospace' }} unit=" MB" />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const totalMem = payload.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
                      const totalGb = (totalMem / 1024).toFixed(2);
                      return (
                        <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs font-sans space-y-2 min-w-64">
                          <div className="font-bold border-b border-slate-800 pb-1 text-slate-300 font-mono flex justify-between">
                            <span>{label}</span>
                            <span className="text-purple-400 font-bold">{totalMem.toLocaleString()} MB ({totalGb} GB)</span>
                          </div>
                          <div className="space-y-1">
                            {payload.map((entry: any) => {
                              const val = Number(entry.value) || 0;
                              const pct = ((val / totalMem) * 100).toFixed(1);
                              return (
                                <div key={entry.name} className="flex items-center justify-between text-[11px]">
                                  <span className="flex items-center gap-1.5 text-slate-300">
                                    <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ backgroundColor: entry.color }} />
                                    {entry.name}:
                                  </span>
                                  <span className="font-mono font-bold text-white">
                                    {val.toLocaleString()} MB ({pct}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }}
                  />
                  {memComponentKeys.map((mk) => (
                    <Bar
                      key={mk.key}
                      dataKey={mk.key}
                      stackId={barDisplayMode === 'stacked' ? 'mem' : undefined}
                      fill={mk.color}
                      radius={barDisplayMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE STREAM TELEMETRY */}
      {activeSubTab === 'live-telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 animate-fade-in">
          {/* CPU & Throughput Live Stream Chart */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-600" /> Live CPU Load vs Pipeline Throughput
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time CPU utilization percentage and record processing throughput (RPS).
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span> CPU (%)
                </span>
                <span className="flex items-center gap-1.5 text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> Throughput (RPS)
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="liveCpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <YAxis yAxisId="cpu" stroke="#4f46e5" domain={[0, 100]} unit="%" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <YAxis yAxisId="tp" orientation="right" stroke="#0ea5e9" unit=" RPS" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      return (
                        <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5 min-w-48">
                          <div className="font-mono text-slate-400 font-bold border-b border-slate-800 pb-1 flex justify-between">
                            <span>Time</span>
                            <span className="text-white">{label}</span>
                          </div>
                          {payload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center justify-between text-[11px]">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                                {entry.name}:
                              </span>
                              <span className="font-mono font-bold text-white">
                                {Number(entry.value).toLocaleString()}{entry.unit || ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Area
                    yAxisId="cpu"
                    type="monotone"
                    dataKey="cpu"
                    name="CPU Utilization"
                    unit="%"
                    fill="url(#liveCpuGradient)"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                  />
                  <Line
                    yAxisId="tp"
                    type="monotone"
                    dataKey="throughput"
                    name="Pipeline Throughput"
                    unit=" RPS"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Memory Heap Live Stream Chart */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-600" /> Live Memory Heap Stream (MB)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dynamic JVM heap memory consumption & GC reclamation cycles.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Active Heap (MB)
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="liveMemGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <YAxis stroke="#10b981" unit=" MB" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      return (
                        <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5 min-w-48">
                          <div className="font-mono text-slate-400 font-bold border-b border-slate-800 pb-1 flex justify-between">
                            <span>Time</span>
                            <span className="text-white">{label}</span>
                          </div>
                          {payload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center justify-between text-[11px]">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                                {entry.name}:
                              </span>
                              <span className="font-mono font-bold text-white">
                                {Number(entry.value).toLocaleString()} MB
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    name="Heap Allocation"
                    fill="url(#liveMemGradient)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 0: RESOURCE DEMAND FORECASTING */}
      {activeSubTab === 'demand-forecast' && (() => {
        const currentRps = latestData.throughput || 1350;
        const maxClusterCores = 176; // Total physical cores across Nodes 01-05
        const targetSlaCores = Math.round(maxClusterCores * (targetSlaCpuCap / 100)); // e.g. 132 Cores at 75%

        // Generate Historical + Projected Infrastructure Demand Data Points
        const timeStepHours = demandForecastHorizon / 8; // e.g. 3h for 24h horizon
        const demandForecastData = [];

        // Historical Points (-12h, -9h, -6h, -3h)
        const pastSteps = [4, 3, 2, 1];
        pastSteps.forEach((step) => {
          const hAgo = step * timeStepHours;
          const histRps = Math.round(currentRps * (1 - step * 0.08));
          const histCores = Math.round(histRps / 20 + 22);
          demandForecastData.push({
            timeLabel: `-${Math.round(hAgo)}h`,
            isFuture: false,
            historicalRps: histRps,
            projectedRps: null,
            historicalCores: histCores,
            predictedCores: null,
            upperConfidenceCores: null,
            lowerConfidenceCores: null,
            predictedRamGb: Number((histCores * 0.52).toFixed(1)),
            requiredNodes: Math.ceil(histCores / 32),
            slaTargetCores: targetSlaCores,
            maxClusterCores: maxClusterCores,
          });
        });

        // Current Point ("Now")
        const currentCores = Math.round(currentRps / 19 + 24);
        demandForecastData.push({
          timeLabel: 'Now',
          isFuture: false,
          historicalRps: Math.round(currentRps),
          projectedRps: Math.round(currentRps),
          historicalCores: currentCores,
          predictedCores: currentCores,
          upperConfidenceCores: currentCores,
          lowerConfidenceCores: currentCores,
          predictedRamGb: Number((currentCores * 0.52).toFixed(1)),
          requiredNodes: Math.ceil(currentCores / 32),
          slaTargetCores: targetSlaCores,
          maxClusterCores: maxClusterCores,
        });

        // Future Points (+3h, +6h, +9h, +12h, +15h, +18h, +21h, +24h)
        for (let i = 1; i <= 7; i++) {
          const hFuture = i * timeStepHours;
          
          let growthMultiplier = 1;
          if (demandGrowthModel === 'linear') {
            growthMultiplier = 1 + (hFuture * 0.028); // +2.8% per hour
          } else if (demandGrowthModel === 'burst') {
            growthMultiplier = 1 + (hFuture * 0.062); // +6.2% per hour
          } else if (demandGrowthModel === 'cyclical') {
            const sineSurge = Math.sin((hFuture / demandForecastHorizon) * Math.PI * 2) * 0.25;
            growthMultiplier = 1 + (hFuture * 0.02) + Math.max(0, sineSurge);
          }

          const projRps = Math.round(currentRps * growthMultiplier);
          const projCores = Math.round(projRps / 19 + 24);
          const upperCores = Math.round(projCores * 1.22);
          const lowerCores = Math.round(projCores * 0.82);
          const projRamGb = Number((projCores * 0.54).toFixed(1));
          const reqNodes = Math.ceil(projCores / 32);

          let label = `+${Math.round(hFuture)}h`;
          if (demandForecastHorizon >= 72) {
            const days = (hFuture / 24).toFixed(1);
            label = `+${days}d`;
          }

          demandForecastData.push({
            timeLabel: label,
            isFuture: true,
            historicalRps: null,
            projectedRps: projRps,
            historicalCores: null,
            predictedCores: projCores,
            upperConfidenceCores: upperCores,
            lowerConfidenceCores: lowerCores,
            predictedRamGb: projRamGb,
            requiredNodes: reqNodes,
            slaTargetCores: targetSlaCores,
            maxClusterCores: maxClusterCores,
          });
        }

        // Calculate peak forecasted metrics
        const futurePoints = demandForecastData.filter(d => d.isFuture);
        const peakPredictedCores = Math.max(...futurePoints.map(d => d.predictedCores));
        const peakUpperCores = Math.max(...futurePoints.map(d => d.upperConfidenceCores));
        const peakRamGb = Math.max(...futurePoints.map(d => d.predictedRamGb));
        const maxNodesNeeded = Math.max(...futurePoints.map(d => d.requiredNodes));

        // Find saturation points
        const slaBreachPoint = futurePoints.find(d => d.predictedCores > targetSlaCores);
        const capacityBreachPoint = futurePoints.find(d => d.predictedCores > maxClusterCores);

        const coreDeficit = Math.max(0, peakPredictedCores - maxClusterCores);
        const nodesToAdd = Math.max(0, maxNodesNeeded - 5);

        const handleApplyProvisioningPlan = () => {
          const newRule = {
            id: `RULE-0${autoScalingRules.length + 1}`,
            connectorName: 'SAP S/4HANA GL Sync & Delta Streams',
            metric: 'CPU',
            condition: 'greater_than',
            thresholdValue: targetSlaCpuCap,
            actionType: 'throttle_rps',
            actionValue: Math.round(currentRps * 0.85),
            isActive: true,
            lastTriggered: 'Just scheduled',
            triggerCount: 0,
            isCurrentlyTriggered: false,
          };
          setAutoScalingRules(prev => [...prev, newRule]);
          setPlanAppliedNotification(`Infrastructure Auto-Scaling Plan Activated! Rule ${newRule.id} created to enforce SLA limit (${targetSlaCpuCap}% CPU cap).`);
          setTimeout(() => setPlanAppliedNotification(null), 6000);
        };

        return (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-5 animate-fade-in">
            {/* Header Ribbon & Controls */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Resource Demand Forecasting &amp; Infrastructure Sizing
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Predictive CPU core allocation, RAM footprint, and worker node scaling based on historical migration throughput trends.
                    </p>
                  </div>
                </div>
              </div>

              {/* Control Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Horizon Selector */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Horizon:</span>
                  {[
                    { label: '12 Hours', value: 12 },
                    { label: '24 Hours', value: 24 },
                    { label: '3 Days', value: 72 },
                    { label: '7 Days', value: 168 },
                  ].map((h) => (
                    <button
                      key={h.value}
                      type="button"
                      onClick={() => setDemandForecastHorizon(h.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        demandForecastHorizon === h.value
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>

                {/* Growth Model Selector */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Trend Model:</span>
                  <select
                    value={demandGrowthModel}
                    onChange={(e) => setDemandGrowthModel(e.target.value as any)}
                    className="bg-transparent text-slate-700 font-bold text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="linear">Linear Trend (+2.8%/hr)</option>
                    <option value="burst">Peak Delta Catch-up (+6.2%/hr)</option>
                    <option value="cyclical">Nightly Batch Surge (Cyclical)</option>
                  </select>
                </div>

                {/* Target SLA Cap Selector */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Target SLA Cap:</span>
                  <select
                    value={targetSlaCpuCap}
                    onChange={(e) => setTargetSlaCpuCap(Number(e.target.value))}
                    className="bg-transparent text-slate-700 font-bold text-xs focus:outline-hidden cursor-pointer font-mono"
                  >
                    <option value={60}>60% (105 Cores)</option>
                    <option value={75}>75% (132 Cores)</option>
                    <option value={85}>85% (150 Cores)</option>
                    <option value={90}>90% (158 Cores)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Banner when Provisioning Plan Applied */}
            {planAppliedNotification && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold animate-fade-in shadow-2xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{planAppliedNotification}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPlanAppliedNotification(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Summary Forecast Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Peak Forecasted CPU
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900 font-mono">{peakPredictedCores} Cores</span>
                  {coreDeficit > 0 ? (
                    <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                      +{coreDeficit} Deficit
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Within Cluster
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Upper bound risk envelope: <strong className="text-indigo-600">{peakUpperCores} Cores</strong>
                </p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-purple-500" /> Projected RAM Footprint
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-purple-700 font-mono">{peakRamGb} GB RAM</span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                    Heap + Off-heap
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  JVM Heap allocation cap: <strong className="text-slate-700">{(peakRamGb * 0.6).toFixed(1)} GB</strong>
                </p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-500" /> Cluster Pod Count
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900 font-mono">{maxNodesNeeded} Nodes</span>
                  {nodesToAdd > 0 ? (
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      +{nodesToAdd} Pods Needed
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      5 Nodes Sufficient
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Current cluster instances: <strong className="text-slate-700">5 Active Nodes</strong>
                </p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Predicted SLA Breach
                </span>
                <div className="flex items-baseline gap-1.5">
                  {slaBreachPoint ? (
                    <span className="text-lg font-extrabold text-amber-700 font-mono">{slaBreachPoint.timeLabel}</span>
                  ) : (
                    <span className="text-lg font-extrabold text-emerald-700 font-mono">None</span>
                  )}
                  {slaBreachPoint ? (
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                      &gt; {targetSlaCpuCap}% Cap
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Safe
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Physical capacity limit breach: <strong className="text-slate-700">{capacityBreachPoint ? capacityBreachPoint.timeLabel : 'No breach'}</strong>
                </p>
              </div>
            </div>

            {/* Core Recharts Resource Demand Forecasting Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Infrastructure Demand Trend vs Cluster Capacity (Cores &amp; Throughput)
                  </h4>
                </div>

                {/* Chart Legend Labels */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block"></span> Predicted CPU Cores
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 inline-block"></span> Historical Usage
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-400/60">
                    <span className="w-2.5 h-2.5 rounded-xs bg-indigo-200 inline-block"></span> Risk Envelope
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Projected RPS
                  </span>
                </div>
              </div>

              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={demandForecastData} margin={{ top: 20, right: 35, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="confidenceEnvelopeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="timeLabel"
                      stroke="#64748b"
                      style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}
                    />
                    <YAxis
                      yAxisId="cores"
                      stroke="#4f46e5"
                      style={{ fontSize: '11px', fontFamily: 'monospace' }}
                      unit=" Cores"
                    />
                    <YAxis
                      yAxisId="rps"
                      orientation="right"
                      stroke="#d97706"
                      style={{ fontSize: '11px', fontFamily: 'monospace' }}
                      unit=" RPS"
                    />
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const dataPoint = payload[0]?.payload;
                        if (!dataPoint) return null;

                        const isFuture = dataPoint.isFuture;
                        const coresNeeded = isFuture ? dataPoint.predictedCores : dataPoint.historicalCores;
                        const rpsVal = isFuture ? dataPoint.projectedRps : dataPoint.historicalRps;
                        const pctOfCap = Math.round((coresNeeded / maxClusterCores) * 100);

                        return (
                          <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs font-sans space-y-2 min-w-64">
                            <div className="font-bold border-b border-slate-800 pb-1.5 text-slate-300 font-mono flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                {isFuture ? <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> : <Activity className="w-3.5 h-3.5 text-sky-400" />}
                                Time: <strong className="text-white">{label}</strong>
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${isFuture ? 'bg-indigo-900 text-indigo-300 border border-indigo-700' : 'bg-sky-900 text-sky-300 border border-sky-700'}`}>
                                {isFuture ? 'Forecasted' : 'Historical'}
                              </span>
                            </div>

                            <div className="space-y-1.5 font-mono text-[11px]">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Throughput Rate:</span>
                                <strong className="text-amber-400 font-bold">{rpsVal?.toLocaleString()} RPS</strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Required CPU Cores:</span>
                                <strong className="text-indigo-400 font-bold">{coresNeeded} Cores ({pctOfCap}% cluster cap)</strong>
                              </div>
                              {isFuture && (
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <span>Confidence Interval:</span>
                                  <span className="text-indigo-300">{dataPoint.lowerConfidenceCores} - {dataPoint.upperConfidenceCores} Cores</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Estimated RAM:</span>
                                <strong className="text-purple-300 font-bold">{dataPoint.predictedRamGb} GB</strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Worker Instances:</span>
                                <strong className="text-emerald-400 font-bold">{dataPoint.requiredNodes} Pods Needed</strong>
                              </div>
                            </div>

                            <div className="pt-1 border-t border-slate-800 text-[10px]">
                              {coresNeeded > maxClusterCores ? (
                                <span className="text-rose-400 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-rose-400" /> Physical Capacity Deficit (+{coresNeeded - maxClusterCores} Cores)
                                </span>
                              ) : coresNeeded > targetSlaCores ? (
                                <span className="text-amber-400 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-400" /> Target SLA Limit Crossed ({targetSlaCpuCap}% cap)
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Infrastructure Optimal
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />

                    {/* Target SLA Line (ReferenceLine) */}
                    <ReferenceLine
                      yAxisId="cores"
                      y={targetSlaCores}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Target SLA Cap (${targetSlaCpuCap}% = ${targetSlaCores} Cores)`,
                        fill: '#d97706',
                        fontSize: 10,
                        fontWeight: 'bold',
                        position: 'top',
                      }}
                    />

                    {/* Max Physical Cluster Capacity (ReferenceLine) */}
                    <ReferenceLine
                      yAxisId="cores"
                      y={maxClusterCores}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      strokeWidth={2}
                      label={{
                        value: `Max Cluster Capacity (176 Cores)`,
                        fill: '#dc2626',
                        fontSize: 10,
                        fontWeight: 'bold',
                        position: 'top',
                      }}
                    />

                    {/* Confidence Upper Envelope Area */}
                    <Area
                      yAxisId="cores"
                      type="monotone"
                      dataKey="upperConfidenceCores"
                      name="Confidence Risk Envelope"
                      fill="url(#confidenceEnvelopeGrad)"
                      stroke="#a5b4fc"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />

                    {/* Historical CPU Cores Line */}
                    <Line
                      yAxisId="cores"
                      type="monotone"
                      dataKey="historicalCores"
                      name="Historical Cores"
                      stroke="#0284c7"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0284c7' }}
                    />

                    {/* Predicted CPU Cores Line */}
                    <Line
                      yAxisId="cores"
                      type="monotone"
                      dataKey="predictedCores"
                      name="Predicted Cores"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#4f46e5' }}
                    />

                    {/* Projected Throughput Line (RPS) */}
                    <Line
                      yAxisId="rps"
                      type="monotone"
                      dataKey="projectedRps"
                      name="Projected Throughput"
                      stroke="#d97706"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Infrastructure Recommendation Action Card */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-3.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-200/80 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-700" />
                    <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                      Recommended Infrastructure Auto-Provisioning Action Plan
                    </h4>
                  </div>
                  <p className="text-xs text-indigo-900/80 font-medium">
                    Based on the {demandForecastHorizon}-hour forecast model ({demandGrowthModel} trend), the cluster will require <strong className="text-indigo-950 font-bold">{nodesToAdd > 0 ? `+${nodesToAdd} additional Worker Pods` : 'no additional worker nodes'}</strong> to stay within the {targetSlaCpuCap}% CPU cap.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyProvisioningPlan}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-current" />
                    <span>Apply Provisioning Plan</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Provisioning Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Stage 1: Pre-SLA Breach</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] rounded">
                      {slaBreachPoint ? slaBreachPoint.timeLabel : '+12 Hours'}
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">Provision Node-06 (Worker Pod D)</h5>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Scale compute pool by <strong className="text-indigo-700 font-bold">+32 Cores &amp; 16 GB RAM</strong> to keep utilization below {targetSlaCpuCap}% target limit.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Stage 2: Capacity Deficit</span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-mono font-bold text-[10px] rounded">
                      {capacityBreachPoint ? capacityBreachPoint.timeLabel : '+18 Hours'}
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">Provision Node-07 (Worker Pod E)</h5>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Prevent physical cluster bottleneck at 176 Cores. Adds <strong className="text-amber-700 font-bold">+32 Cores &amp; 16 GB RAM</strong>.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Cloud Cost Impact</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-mono font-bold text-[10px] rounded">
                      Auto-Scales
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">Estimated Cost Delta</h5>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Infrastructure expansion costs <strong className="text-emerald-700 font-bold font-mono">+$2.85 / hr (~$68.40/day)</strong> during peak throughput migration window.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: DATA VOLUME FORECAST */}
      {activeSubTab === 'forecast' && (() => {
        const scenarioMultiplier =
          forecastScenario === 'burst' ? 1.5 : forecastScenario === 'compressed' ? 0.8 : 1.0;

        const currentRps = latestData.throughput || 1200;
        const avgPayloadKb = 1.35;
        const currentMbSec = (currentRps * avgPayloadKb) / 1024;
        const adjustedMbSec = currentMbSec * scenarioMultiplier;

        const pointsCount = 9;
        const stepMin = forecastHorizon / (pointsCount - 1);

        const forecastData = [];
        let cumBaselineMb = 0;
        let cumOptimisticMb = 0;
        let cumPessimisticMb = 0;

        for (let i = 0; i < pointsCount; i++) {
          const min = Math.round(i * stepMin);
          let label = `Now`;
          if (min >= 60) {
            const hrs = (min / 60).toFixed(min % 60 === 0 ? 0 : 1);
            label = `+${hrs}h`;
          } else if (min > 0) {
            label = `+${min}m`;
          }

          if (i > 0) {
            const stepSec = stepMin * 60;
            cumBaselineMb += adjustedMbSec * stepSec;
            cumOptimisticMb += adjustedMbSec * 1.25 * stepSec;
            cumPessimisticMb += adjustedMbSec * 0.72 * stepSec;
          }

          forecastData.push({
            timeLabel: label,
            minutes: min,
            'Baseline Projected (GB)': parseFloat((cumBaselineMb / 1024).toFixed(2)),
            'Optimistic Burst (GB)': parseFloat((cumOptimisticMb / 1024).toFixed(2)),
            'Pessimistic Throttled (GB)': parseFloat((cumPessimisticMb / 1024).toFixed(2)),
          });
        }

        const endBaselineGb = forecastData[forecastData.length - 1]['Baseline Projected (GB)'];
        const minutesToTarget = adjustedMbSec > 0 ? Math.round((250 * 1024) / (adjustedMbSec * 60)) : 0;
        const hoursToTarget = (minutesToTarget / 60).toFixed(1);

        return (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Data Volume Forecast & Bandwidth Modeling
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Predictive migration traffic volume modeling based on active pipeline throughput ({Math.round(currentRps)} RPS ~ {adjustedMbSec.toFixed(2)} MB/s).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Horizon:</span>
                  {[
                    { label: '1H', value: 60 },
                    { label: '6H', value: 360 },
                    { label: '12H', value: 720 },
                    { label: '24H', value: 1440 },
                  ].map((h) => (
                    <button
                      key={h.value}
                      type="button"
                      onClick={() => setForecastHorizon(h.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        forecastHorizon === h.value
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Scenario:</span>
                  <select
                    value={forecastScenario}
                    onChange={(e) => setForecastScenario(e.target.value as any)}
                    className="bg-transparent text-slate-700 font-bold text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="standard">Standard (1.0x)</option>
                    <option value="burst">Heavy Burst (1.5x)</option>
                    <option value="compressed">Compressed (0.8x)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-0.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Database className="w-3 h-3 text-slate-400" /> Target Payload
                </span>
                <div className="text-base font-extrabold text-slate-800 font-mono">250.0 GB</div>
              </div>

              <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-0.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-indigo-500" /> Forecast Volume
                </span>
                <div className="text-base font-extrabold text-indigo-600 font-mono">{endBaselineGb.toLocaleString()} GB</div>
              </div>

              <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-0.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-500" /> Bandwidth Stream
                </span>
                <div className="text-base font-extrabold text-emerald-600 font-mono">{adjustedMbSec.toFixed(2)} MB/s</div>
              </div>

              <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-0.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-500" /> Est. Time to Target
                </span>
                <div className="text-base font-extrabold text-slate-800 font-mono">~{hoursToTarget} hrs</div>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="forecastBaselineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'monospace' }} unit=" GB" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: any, name: any) => [`${value} GB`, name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: '600' }} />
                  <ReferenceLine
                    y={250}
                    label={{ value: 'Target Payload (250 GB)', fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'top' }}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="Baseline Projected (GB)"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#forecastBaselineGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="Optimistic Burst (GB)"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Pessimistic Throttled (GB)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

      {/* TAB 4: CLUSTER NODE INVENTORY TABLE */}
      {activeSubTab === 'cluster-table' && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                Cluster Node Inventory & Resource Allocations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed thread pool status, memory overhead parameters, and container health across compute nodes.
              </p>
            </div>
          </div>

          <OverflowTableWrapper hintLabel="Scroll horizontally to inspect compute node allocation details">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Node Name</th>
                  <th className="py-3 px-4">Node Role</th>
                  <th className="py-3 px-4">CPU Cores (Alloc / Total)</th>
                  <th className="py-3 px-4">Memory Overhead</th>
                  <th className="py-3 px-4">Active Jobs</th>
                  <th className="py-3 px-4">GC Pause</th>
                  <th className="py-3 px-4 text-right">Node Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {rawComputeNodeData.map((node) => {
                  const allocCores = node.totalCapacity - node['Reserved System Overhead'];
                  const pct = Math.round((allocCores / node.totalCapacity) * 100);
                  return (
                    <tr key={node.node} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-800 font-mono">{node.node}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {node.shortNode === 'Node-01' ? 'Spark Master' : node.shortNode === 'Node-05' ? 'Edge Ingestion' : 'Worker Pod'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {allocCores} / {node.totalCapacity} Cores ({pct}%)
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-700 font-bold">
                        {(node.totalCapacity * 256).toLocaleString()} MB RAM
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600 font-medium">5 Jobs Stacked</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-bold">
                        ~12ms / min
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Healthy
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </OverflowTableWrapper>
        </div>
      )}

      {/* TAB 5: RESOURCE AUTO-SCALING CONTROLS */}
      {activeSubTab === 'auto-scaling' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Subtitle */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 fill-current" />
                  Migration Connector Auto-Scaling Engine
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define threshold-based rules (CPU & Memory metrics) to trigger dynamic throttling adjustments on specific migration connectors.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">System Status:</span>
                {autoScalingRules.some(r => r.isCurrentlyTriggered && r.isActive) ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    Throttling Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Normal Operation
                  </span>
                )}
              </div>
            </div>

            {/* Subsystem KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-2xs">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Total Defined Rules</div>
                  <div className="text-lg font-extrabold text-slate-800">{autoScalingRules.length} Rules</div>
                </div>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-2xs">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Active Monitored</div>
                  <div className="text-lg font-extrabold text-slate-800">
                    {autoScalingRules.filter(r => r.isActive).length} / {autoScalingRules.length} Enabled
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-2xs">
                <div className={`p-2 rounded-lg ${autoScalingRules.some(r => r.isCurrentlyTriggered && r.isActive) ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                  <AlertCircle className={`w-4 h-4 ${autoScalingRules.some(r => r.isCurrentlyTriggered && r.isActive) ? 'animate-bounce' : ''}`} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Triggered Adjustments</div>
                  <div className="text-lg font-extrabold text-slate-800">
                    {autoScalingRules.filter(r => r.isCurrentlyTriggered && r.isActive).length} Active
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-2xs">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cumulative Triggers</div>
                  <div className="text-lg font-extrabold text-slate-800">
                    {autoScalingRules.reduce((sum, r) => sum + r.triggerCount, 0)} Events
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Panel - Rules List */}
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-600" />
                    Defined Threshold-Based Rules
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">Total: {autoScalingRules.length}</span>
                </div>

                {autoScalingRules.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                    <Zap className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">No active auto-scaling rules defined.</p>
                    <p className="text-[10px] text-slate-400">Use the form on the right to define a threshold-based rule.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {autoScalingRules.map((rule) => {
                      const isTriggeredAndActive = rule.isActive && rule.isCurrentlyTriggered;
                      return (
                        <div
                          key={rule.id}
                          className={`relative border rounded-xl p-4 transition-all duration-300 ${
                            isTriggeredAndActive
                              ? 'bg-amber-50/50 border-amber-300 shadow-md ring-1 ring-amber-300/40'
                              : rule.isActive
                              ? 'bg-slate-50/40 border-slate-200 hover:border-slate-300'
                              : 'bg-slate-100/30 border-slate-200/60 opacity-65'
                          }`}
                        >
                          {/* Inner container */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  rule.isActive
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'bg-slate-200 text-slate-500 border border-slate-300'
                                }`}>
                                  {rule.id}
                                </span>
                                <span className="text-xs font-extrabold text-slate-800">
                                  {rule.connectorName}
                                </span>
                                {isTriggeredAndActive ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                                    Active Throttling Applied
                                  </span>
                                ) : rule.isActive ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-850 border border-emerald-300">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Monitoring
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-250 text-slate-600 border border-slate-300">
                                    Inactive
                                  </span>
                                )}
                              </div>

                              {/* Rule Spec Description */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 pt-1.5 text-xs">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <span className="font-bold text-slate-400 text-[10px] uppercase w-18">Condition:</span>
                                  <span className="font-medium">
                                    Compute Node <strong className="text-slate-850 font-bold">{rule.metric}</strong> {rule.condition === 'greater_than' ? 'exceeds' : 'drops below'} <strong className="text-indigo-600 font-extrabold font-mono">{rule.thresholdValue}%</strong>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <span className="font-bold text-slate-400 text-[10px] uppercase w-18">Action:</span>
                                  <span className="font-medium text-slate-850">
                                    {rule.actionType === 'throttle_rps' && (
                                      <>Throttle requests to <strong className="text-amber-600 font-mono font-extrabold">{rule.actionValue} RPS</strong></>
                                    )}
                                    {rule.actionType === 'reduce_concurrency' && (
                                      <>Reduce concurrency to <strong className="text-amber-600 font-mono font-extrabold">{rule.actionValue} concurrent threads</strong></>
                                    )}
                                    {rule.actionType === 'pause_pipeline' && (
                                      <strong className="text-rose-600">Pause Job Execution</strong>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Trigger Statistics */}
                              <div className="flex items-center gap-5 pt-1.5 text-[10px] text-slate-400 font-semibold font-mono">
                                <div>Trigger Count: <span className="text-slate-700 font-bold">{rule.triggerCount} times</span></div>
                                <div className="h-2.5 w-px bg-slate-200" />
                                <div>Last Event: <span className="text-slate-700 font-bold">{rule.lastTriggered}</span></div>
                              </div>
                            </div>

                            {/* Control Actions */}
                            <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleToggleRule(rule.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                  rule.isActive
                                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold'
                                }`}
                              >
                                {rule.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="p-1.5 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="Delete auto-scaling rule"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Informational Guidelines Card */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 text-xs text-indigo-950/80">
                <span className="font-extrabold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Info className="w-3.5 h-3.5 text-indigo-600" /> Dynamic Resource Allocation Guidelines
                </span>
                <p className="leading-relaxed text-slate-700">
                  Admins define threshold-based criteria for compute nodes to protect the destination ERP, file store, or database systems from service degradations.
                  When CPU or RAM limits are hit, the <strong className="text-indigo-855 font-bold">throttling adjustment engine</strong> automatically updates the connector's config limits in the runtime container, enforcing the rate limit policy seamlessly.
                </p>
                <p className="leading-relaxed font-bold text-indigo-900">
                  💡 Hint: Click the "Simulate Spike" button in the top control bar to instantly raise CPU metrics and observe the active throttling trigger states in real-time!
                </p>
              </div>
            </div>

            {/* Right Panel - Rule Definition Form & Logs */}
            <div className="space-y-6">
              {/* Add New Rule Form */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    Define New Auto-Scaling Rule
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Define trigger metrics and remediation parameters.</p>
                </div>

                <form onSubmit={handleAddRule} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Connector</label>
                    <select
                      value={newRuleConnector}
                      onChange={(e) => setNewRuleConnector(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      {Array.from(new Set([
                        ...jobs.map(j => j.sourceConnectorName),
                        ...jobs.map(j => j.destConnectorName),
                        'SAP S/4HANA GL Sync',
                        'Salesforce Account Delta',
                        'Oracle ERP Payroll',
                        'HRMS Employee Master',
                        'PostgreSQL Staging Sync'
                      ])).filter(Boolean).map(connector => (
                        <option key={connector} value={connector}>{connector}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Metric Source</label>
                      <select
                        value={newRuleMetric}
                        onChange={(e) => setNewRuleMetric(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="CPU">CPU (%)</option>
                        <option value="RAM">RAM (%)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Condition</label>
                      <select
                        value={newRuleCondition}
                        onChange={(e) => setNewRuleCondition(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="greater_than">Is Greater Than (&gt;)</option>
                        <option value="less_than">Is Less Than (&lt;)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Threshold Value (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={newRuleThreshold}
                      onChange={(e) => setNewRuleThreshold(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-500 font-mono"
                      placeholder="e.g. 85"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Remediation Action</label>
                      <select
                        value={newRuleActionType}
                        onChange={(e) => setNewRuleActionType(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="throttle_rps">Throttle Requests/Sec</option>
                        <option value="reduce_concurrency">Reduce Concurrency</option>
                        <option value="pause_pipeline">Pause Pipeline</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Action Parameter</label>
                      <input
                        type="number"
                        min="0"
                        disabled={newRuleActionType === 'pause_pipeline'}
                        value={newRuleActionType === 'pause_pipeline' ? 0 : newRuleActionValue}
                        onChange={(e) => setNewRuleActionValue(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-500 font-mono disabled:opacity-50"
                        placeholder="Value (RPS/Threads)"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-755 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Auto-Scaling Rule</span>
                  </button>
                </form>
              </div>

              {/* Simulation Log Console */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-md font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Auto-Scaling Audit Logs
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoScalingLogs([])}
                    className="text-[9px] font-bold text-slate-500 hover:text-slate-300 uppercase transition cursor-pointer"
                  >
                    Clear Console
                  </button>
                </div>

                <div className="h-[210px] overflow-y-auto space-y-2.5 pr-1 font-mono text-[10px] leading-relaxed">
                  {autoScalingLogs.length === 0 ? (
                    <div className="text-slate-500 text-center pt-16">
                      No logs generated. Simulating metrics to trigger active rules...
                    </div>
                  ) : (
                    autoScalingLogs.map((log, index) => {
                      let textClass = 'text-slate-300';
                      if (log.type === 'warning') textClass = 'text-amber-400';
                      else if (log.type === 'success') textClass = 'text-emerald-400';
                      else if (log.type === 'danger') textClass = 'text-rose-400';
                      else if (log.type === 'info') textClass = 'text-indigo-300';

                      return (
                        <div key={index} className="space-y-0.5 border-b border-slate-800/40 pb-1.5">
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                            <span>[{log.timestamp}]</span>
                            <span className="uppercase text-[8px] font-extrabold px-1 rounded bg-slate-800 text-slate-400">System</span>
                          </div>
                          <p className={textClass}>{log.message}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
