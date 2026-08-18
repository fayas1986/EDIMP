import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  Cpu,
  Server,
  Zap,
  Play,
  Pause,
  Trash2,
  Download,
  Flame,
  Maximize2,
  TrendingUp,
  Settings2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Database,
  ArrowDownToLine,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';

interface ResourceDataPoint {
  time: string;
  cpu: number;
  memory: number;
  network: number; // in MB/s
  throughput: number; // records/sec
}

interface MigrationProfile {
  id: string;
  name: string;
  description: string;
  baseCpu: number;
  baseMemory: number;
  baseNetwork: number;
  baseThroughput: number;
  noiseLevel: number;
}

const MIGRATION_PROFILES: MigrationProfile[] = [
  {
    id: 'sap-extractor',
    name: 'SAP ERP Financials Extractor',
    description: 'High memory caching for ledger tables, moderate relational CPU computation.',
    baseCpu: 48,
    baseMemory: 82,
    baseNetwork: 320,
    baseThroughput: 120000,
    noiseLevel: 4,
  },
  {
    id: 'salesforce-sync',
    name: 'Salesforce Contact & Lead Delta Sync',
    description: 'API-bound streaming delta sync. Spike-heavy network payload, low memory usage.',
    baseCpu: 35,
    baseMemory: 45,
    baseNetwork: 680,
    baseThroughput: 85000,
    noiseLevel: 12,
  },
  {
    id: 'oracle-ledger',
    name: 'Oracle DB Multi-Entity Bulk Loader',
    description: 'Highly compute-intensive column indexing. Sustained peak CPU load and heavy write buffer usage.',
    baseCpu: 84,
    baseMemory: 65,
    baseNetwork: 450,
    baseThroughput: 180000,
    noiseLevel: 5,
  },
  {
    id: 'cassandra-stream',
    name: 'Cassandra Real-time Activity Log Pipeline',
    description: 'Distributed log stream with minimal compute latency. Low, flat memory footprint, maximum network write spikes.',
    baseCpu: 55,
    baseMemory: 38,
    baseNetwork: 920,
    baseThroughput: 250000,
    noiseLevel: 8,
  },
];

interface CustomSpikeTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  warnLimit: number;
}

const CustomSpikeTooltip: React.FC<CustomSpikeTooltipProps> = ({ active, payload, label, warnLimit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data) return null;
    const isSpikeCpu = data.cpu >= warnLimit;
    const isSpikeMem = data.memory >= warnLimit;
    const isBreach = isSpikeCpu || isSpikeMem;

    return (
      <div className={`p-3 rounded-xl shadow-xl text-xs font-mono border ${
        isBreach ? 'bg-slate-900 border-rose-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-100'
      }`}>
        <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-slate-800 font-bold">
          <span className="text-slate-300">{label}</span>
          {isBreach && (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] uppercase font-extrabold flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" /> &gt;{warnLimit}% SPIKE
            </span>
          )}
        </div>
        <div className="mt-2 space-y-1">
          {payload.map((entry: any, index: number) => {
            const val = entry.value;
            const isValSpike = (entry.dataKey === 'cpu' && isSpikeCpu) || (entry.dataKey === 'memory' && isSpikeMem);
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className={`font-bold ${isValSpike ? 'text-rose-400 text-sm animate-pulse' : 'text-slate-200'}`}>
                  {typeof val === 'number' ? val.toFixed(1) : val}
                  {entry.dataKey?.toLowerCase().includes('network') ? ' MB/s' : '%'}
                  {isValSpike && ' 🚨'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

interface ForecastResult {
  slope: number;
  intercept: number;
}

const calculateLinearRegression = (values: number[]): ForecastResult => {
  const n = values.length;
  if (n === 0) {
    return { slope: 0, intercept: 0 };
  }
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denominator = (n * sumXX - sumX * sumX);
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

const getDiurnalFactor = (hour: number): number => {
  const rad = (hour * Math.PI) / 12;
  // Primary 24h peak around 2 PM (14:00)
  const primary = Math.sin(rad - (14 * Math.PI) / 12);
  // Secondary 12h peak at 10 AM (10:00)
  const secondary = 0.25 * Math.sin(2 * rad);
  return primary + secondary;
};

const generate24HourForecast = (
  historicalPoints: ResourceDataPoint[],
  cpuSoftThreshold: number,
  ramSoftThreshold: number,
  criticalThreshold: number
) => {
  if (historicalPoints.length === 0) return { forecastPoints: [], insights: null };

  const cpus = historicalPoints.map(p => p.cpu);
  const memories = historicalPoints.map(p => p.memory);
  const networks = historicalPoints.map(p => p.network);
  const throughputs = historicalPoints.map(p => p.throughput);

  const regCpu = calculateLinearRegression(cpus);
  const regMem = calculateLinearRegression(memories);
  const regNet = calculateLinearRegression(networks);
  const regThru = calculateLinearRegression(throughputs);

  const lastPoint = historicalPoints[historicalPoints.length - 1];
  const currentHour = new Date().getHours();

  const forecastPoints: any[] = [];

  // Dampen slopes to keep projections realistic
  const cpuSlope = regCpu.slope * 0.15;
  const memSlope = regMem.slope * 0.1;
  const netSlope = regNet.slope * 0.1;
  const thruSlope = regThru.slope * 0.1;

  let peakCpu = 0;
  let peakCpuHour = '';
  let peakMem = 0;
  let peakMemHour = '';

  let cpuBreachesCount = 0;
  let memBreachesCount = 0;
  let criticalBreachesCount = 0;

  for (let t = 1; t <= 24; t++) {
    const targetHour = (currentHour + t) % 24;
    const ampm = targetHour >= 12 ? 'PM' : 'AM';
    const displayHour = targetHour % 12 === 0 ? 12 : targetHour % 12;
    const timeLabel = `+${t}h (${displayHour} ${ampm})`;

    const diurnalVal = getDiurnalFactor(targetHour);
    const cpuDiurnal = diurnalVal * 12;
    const memDiurnal = diurnalVal * 8;
    const netDiurnal = diurnalVal * 40;
    const thruDiurnal = diurnalVal * 12000;

    // Small high-frequency noise for realistic wave shape
    const noiseCpu = Math.sin(t * 1.2) * 1.2;
    const noiseMem = Math.cos(t * 1.2) * 0.8;
    const noiseNet = Math.sin(t * 1.5) * 10;
    const noiseThru = Math.cos(t * 1.5) * 3000;

    const predCpu = Math.min(98, Math.max(10, lastPoint.cpu + (cpuSlope * t) + cpuDiurnal + noiseCpu));
    const predMem = Math.min(98, Math.max(12, lastPoint.memory + (memSlope * t) + memDiurnal + noiseMem));
    const predNet = Math.max(5, lastPoint.network + (netSlope * t) + netDiurnal + noiseNet);
    const predThru = Math.max(1000, lastPoint.throughput + (thruSlope * t) + thruDiurnal + noiseThru);

    if (predCpu > peakCpu) {
      peakCpu = predCpu;
      peakCpuHour = `${displayHour} ${ampm}`;
    }
    if (predMem > peakMem) {
      peakMem = predMem;
      peakMemHour = `${displayHour} ${ampm}`;
    }

    if (predCpu > cpuSoftThreshold) cpuBreachesCount++;
    if (predMem > ramSoftThreshold) memBreachesCount++;
    if (predCpu > criticalThreshold || predMem > criticalThreshold) criticalBreachesCount++;

    forecastPoints.push({
      time: timeLabel,
      cpuForecast: +predCpu.toFixed(1),
      memoryForecast: +predMem.toFixed(1),
      networkForecast: Math.floor(predNet),
      throughputForecast: Math.floor(predThru),
      isForecast: true,
    });
  }

  // Calculate high-level trend descriptors
  const getTrendDirection = (slope: number) => {
    if (slope > 0.05) return 'UPWARD_GROWTH';
    if (slope < -0.05) return 'DOWNWARD_DECAY';
    return 'STABLE';
  };

  const cpuTrend = getTrendDirection(regCpu.slope);
  const memTrend = getTrendDirection(regMem.slope);

  const insights = {
    cpuTrend,
    memTrend,
    cpuSlope: regCpu.slope,
    memSlope: regMem.slope,
    peakCpu,
    peakCpuHour,
    peakMem,
    peakMemHour,
    cpuBreachesCount,
    memBreachesCount,
    criticalBreachesCount,
  };

  return { forecastPoints, insights };
};

interface ResourceMonitorProps {
  currentCpu?: number;
  currentMemory?: number;
  cpuThreshold?: number;
  ramThreshold?: number;
  warningThreshold?: number;
  timeRange?: '5m' | '15m' | '1h';
}

export const ResourceMonitor: React.FC<ResourceMonitorProps> = ({
  currentCpu = 62.8,
  currentMemory = 75.0,
  cpuThreshold = 80,
  ramThreshold = 85,
  warningThreshold = 90,
  timeRange,
}) => {
  // Config States
  const [selectedProfileId, setSelectedProfileId] = useState<string>('sap-extractor');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [historySize, setHistorySize] = useState<number>(30); // Max points in sliding window (fallback if timeRange not specified)
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [showComparePrevWeek, setShowComparePrevWeek] = useState<boolean>(false);
  const [visibleMetrics, setVisibleMetrics] = useState({
    cpu: true,
    memory: true,
    network: false,
  });

  // Simulated GC Reclamation State
  const [isGcRunning, setIsGcRunning] = useState<boolean>(false);
  const [gcCooldown, setGcCooldown] = useState<number>(0);
  const [gcTelemetryLogs, setGcTelemetryLogs] = useState<Array<{ time: string; msg: string; type: 'info' | 'success' | 'warn' }>>([
    { time: new Date().toLocaleTimeString(), msg: 'Resource Monitor telemetry channel connected.', type: 'info' }
  ]);

  // Profile data
  const activeProfile = useMemo(() => {
    return MIGRATION_PROFILES.find(p => p.id === selectedProfileId) || MIGRATION_PROFILES[0];
  }, [selectedProfileId]);

  // Dynamic range configuration based on parent's timeRange selection
  const rangeConfig = useMemo(() => {
    const range = timeRange || '5m';
    switch (range) {
      case '15m':
        return { points: 180, intervalMs: 5000, label: 'Last 15 Minutes' };
      case '1h':
        return { points: 240, intervalMs: 15000, label: 'Last 1 Hour' };
      case '5m':
      default:
        return { points: 150, intervalMs: 2000, label: 'Last 5 Minutes' };
    }
  }, [timeRange]);

  // History State
  const [history, setHistory] = useState<ResourceDataPoint[]>([]);

  // Seed initial data points
  useEffect(() => {
    const seedData: ResourceDataPoint[] = [];
    const now = Date.now();
    const pointsCount = timeRange ? rangeConfig.points : historySize;
    const intervalVal = timeRange ? rangeConfig.intervalMs : 2000;

    for (let i = pointsCount; i > 0; i--) {
      const timeStr = new Date(now - i * intervalVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const jitter = (Math.random() - 0.5) * activeProfile.noiseLevel;
      
      seedData.push({
        time: timeStr,
        cpu: Math.min(99, Math.max(10, +(activeProfile.baseCpu + jitter).toFixed(1))),
        memory: Math.min(99, Math.max(15, +(activeProfile.baseMemory + (Math.random() - 0.5) * 3).toFixed(1))),
        network: Math.max(50, Math.floor(activeProfile.baseNetwork + (Math.random() - 0.5) * 40)),
        throughput: Math.max(10000, Math.floor(activeProfile.baseThroughput + (Math.random() - 0.5) * 15000)),
      });
    }
    setHistory(seedData);
  }, [selectedProfileId, timeRange, rangeConfig, historySize, activeProfile.baseCpu, activeProfile.baseMemory, activeProfile.baseNetwork, activeProfile.baseThroughput, activeProfile.noiseLevel]);

  // Telemetry loop
  useEffect(() => {
    if (isPaused) return;

    const intervalVal = timeRange ? rangeConfig.intervalMs : 2000;
    const pointsCount = timeRange ? rangeConfig.points : historySize;

    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setHistory(prev => {
        const lastPoint = prev[prev.length - 1];
        let nextCpu = activeProfile.baseCpu;
        let nextMem = activeProfile.baseMemory;
        
        if (isGcRunning) {
          // GC reclamation simulation: cpu spikes while memory drops
          nextCpu = Math.min(98, activeProfile.baseCpu + 35 + (Math.random() * 8));
          nextMem = Math.max(22, (lastPoint?.memory || activeProfile.baseMemory) - 15);
        } else {
          // Standard jitter around profile baseline
          const cpuJitter = (Math.random() - 0.5) * activeProfile.noiseLevel * 2;
          const memJitter = (Math.random() - 0.5) * 1.5;
          nextCpu = Math.min(99, Math.max(8, +(activeProfile.baseCpu + cpuJitter).toFixed(1)));
          nextMem = Math.min(99, Math.max(12, +(activeProfile.baseMemory + memJitter).toFixed(1)));
        }

        const nextNet = Math.max(20, Math.floor(activeProfile.baseNetwork + (Math.random() - 0.5) * (activeProfile.noiseLevel * 8)));
        const nextThroughput = Math.max(5000, Math.floor(activeProfile.baseThroughput + (Math.random() - 0.5) * (activeProfile.noiseLevel * 1000)));

        const newPoint: ResourceDataPoint = {
          time: timeStr,
          cpu: nextCpu,
          memory: nextMem,
          network: nextNet,
          throughput: nextThroughput,
        };

        const trimmed = prev.slice(prev.length >= pointsCount ? 1 : 0);
        return [...trimmed, newPoint];
      });
    }, intervalVal);

    return () => clearInterval(interval);
  }, [isPaused, activeProfile, isGcRunning, timeRange, rangeConfig, historySize]);

  // GC cooldown decrementer
  useEffect(() => {
    if (gcCooldown <= 0) return;
    const t = setTimeout(() => setGcCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [gcCooldown]);

  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const timeStr = new Date().toLocaleTimeString();
    setGcTelemetryLogs(prev => [
      { time: timeStr, msg, type },
      ...prev.slice(0, 19),
    ]);
  }, []);

  // Trigger manual garbage collection routine
  const handleTriggerGC = () => {
    if (isGcRunning || gcCooldown > 0) return;

    setIsGcRunning(true);
    addLog('Garbage Collection triggered manually. Initiating G1GC full heap traversal scan...', 'warn');

    // Phase 1: Heavy mark Sweep (cpu surge)
    setTimeout(() => {
      addLog('G1GC Phase: Root region scanning complete. Reclaiming dead object references.', 'info');
    }, 1500);

    // Phase 2: Heap compaction & Release
    setTimeout(() => {
      setIsGcRunning(false);
      setGcCooldown(15); // 15 second cooling time
      addLog('JVM Heap reclaimed successfully! Memory usage decreased, G1GC completed pause phase.', 'success');
    }, 3200);
  };

  // Export telemetries
  const handleExportTelemetry = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `migration_telemetry_profile_${selectedProfileId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addLog(`Exported ${history.length} telemetry records to JSON format.`, 'success');
  };

  const currentStats = useMemo(() => {
    if (history.length === 0) return { cpu: 0, memory: 0, net: 0, throughput: 0, maxCpu: 0, maxMem: 0 };
    const latest = history[history.length - 1];
    const maxCpu = Math.max(...history.map(h => h.cpu));
    const maxMem = Math.max(...history.map(h => h.memory));
    return {
      cpu: latest.cpu,
      memory: latest.memory,
      net: latest.network,
      throughput: latest.throughput,
      maxCpu,
      maxMem,
    };
  }, [history]);

  const forecastData = useMemo(() => {
    return generate24HourForecast(history, cpuThreshold, ramThreshold, warningThreshold ?? 90);
  }, [history, cpuThreshold, ramThreshold, warningThreshold]);

  const combinedData = useMemo(() => {
    if (!showForecast) return history;
    if (history.length === 0) return [];

    const modifiedHistory = history.map((point, index) => {
      if (index === history.length - 1) {
        return {
          ...point,
          cpuForecast: point.cpu,
          memoryForecast: point.memory,
          networkForecast: point.network,
          throughputForecast: point.throughput,
        };
      }
      return point;
    });

    return [...modifiedHistory, ...forecastData.forecastPoints];
  }, [history, showForecast, forecastData.forecastPoints]);

  const finalChartData = useMemo(() => {
    const baseData = combinedData;
    if (!showComparePrevWeek) return baseData;

    return baseData.map((point, index) => {
      const cpuVal = point.cpu !== undefined ? point.cpu : (point.cpuForecast || 0);
      const memVal = point.memory !== undefined ? point.memory : (point.memoryForecast || 0);
      const netVal = point.network !== undefined ? point.network : (point.networkForecast || 0);

      const phase = (index * Math.PI) / 15;
      const waveCpu = Math.sin(phase) * 2.5;
      const waveMem = Math.cos(phase) * 1.8;

      return {
        ...point,
        cpuPrevWeek: Math.max(8, Math.min(95, +(cpuVal * 0.84 - 5 + waveCpu).toFixed(1))),
        memoryPrevWeek: Math.max(10, Math.min(95, +(memVal * 0.76 - 8 + waveMem).toFixed(1))),
        networkPrevWeek: Math.max(0, +(netVal * 0.90 + Math.sin(phase) * 12).toFixed(1)),
      };
    });
  }, [combinedData, showComparePrevWeek]);

  const insights = forecastData.insights;

  // Threshold Warning & Spike Detection
  const warnLimit = warningThreshold ?? 90;

  const detectedSpikes = useMemo(() => {
    return history.filter(
      (p) =>
        (visibleMetrics.cpu && p.cpu >= warnLimit) ||
        (visibleMetrics.memory && p.memory >= warnLimit)
    );
  }, [history, warnLimit, visibleMetrics]);

  // Custom Dot renderer for highlighting spikes on Area & Line charts
  const renderSpikeDot = useCallback(
    (props: any) => {
      const { cx, cy, payload, dataKey } = props;
      if (cx === undefined || cy === undefined || !payload) return <circle cx={0} cy={0} r={0} fill="none" />;
      const val = payload[dataKey];
      const isSpike = typeof val === 'number' && val >= warnLimit;

      if (!isSpike) {
        return <circle cx={0} cy={0} r={0} fill="none" />;
      }

      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#dc2626"
          stroke="#ffffff"
          strokeWidth={2}
        />
      );
    },
    [warnLimit]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-1.5">
            <TrendingUp className="w-3 h-3 text-indigo-600" />
            Telemetry Diagnostic Center
          </span>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            Real-time Resource & Utilization Monitor
          </h2>
          <p className="text-xs text-slate-500">
            Compare resource consumption profiles across diverse extraction contexts. Analyze RAM allocations and G1GC cycles.
          </p>
        </div>

        {/* Profile Selector & GC Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
            {MIGRATION_PROFILES.map((prof) => (
              <button
                key={prof.id}
                type="button"
                id={`btn-profile-${prof.id}`}
                onClick={() => {
                  setSelectedProfileId(prof.id);
                  addLog(`Switched diagnostic profile to "${prof.name}".`, 'info');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedProfileId === prof.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                {prof.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <button
            type="button"
            id="btn-trigger-gc"
            disabled={isGcRunning || gcCooldown > 0}
            onClick={handleTriggerGC}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              isGcRunning
                ? 'bg-purple-100 text-purple-700 border-purple-200 animate-pulse'
                : gcCooldown > 0
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            }`}
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isGcRunning ? 'animate-spin' : ''}`} />
            <span>{isGcRunning ? 'G1GC Running' : gcCooldown > 0 ? `GC Ready (${gcCooldown}s)` : 'Trigger G1GC Reclaim'}</span>
          </button>
        </div>
      </div>

      {/* Description of active pathway */}
      <div className="bg-slate-50 rounded-xl border border-slate-150 p-3.5 flex items-start gap-3">
        <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 shrink-0">
          <Database className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="text-xs">
          <span className="font-bold text-slate-900 block">{activeProfile.name} Diagnostic Profile</span>
          <span className="text-slate-500 mt-0.5 block">{activeProfile.description}</span>
        </div>
      </div>

      {/* Grid: Main metrics summary indicators & Config selectors */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Core Metric CPU */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 relative">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" /> CPU Usage
            </span>
            <span className="text-[10px] font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">
              Live
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {currentStats.cpu.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400">
              Peak: {currentStats.maxCpu.toFixed(1)}%
            </span>
          </div>
          {currentStats.cpu > cpuThreshold ? (
            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
              <AlertCircle className="w-3 h-3 text-amber-500 animate-bounce" />
              <span>Breaches Threshold ({cpuThreshold}%)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Optimally Provisioned</span>
            </div>
          )}
        </div>

        {/* Core Metric Memory */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 relative">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-emerald-600" /> JVM Heap / RAM
            </span>
            <span className="text-[10px] font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">
              Live
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {currentStats.memory.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400">
              Peak: {currentStats.maxMem.toFixed(1)}%
            </span>
          </div>
          {currentStats.memory > ramThreshold ? (
            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              <span>Heap Threshold Exceeded</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Reclamation Cycle Healthy</span>
            </div>
          )}
        </div>

        {/* Network and Throughput */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-blue-600" /> Net Throughput
            </span>
            <span className="text-[10px] font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">
              LAN
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {currentStats.net} <span className="text-xs font-semibold text-slate-500">MB/s</span>
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Approx: {(currentStats.net * 8 / 1000).toFixed(2)} Gbps bandwidth
          </div>
        </div>

        {/* Extraction velocity */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-indigo-500" /> Extraction Velocity
            </span>
            <span className="text-[10px] font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">
              Real-time
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {(currentStats.throughput / 1000).toFixed(1)}k <span className="text-xs font-semibold text-slate-500">rec/s</span>
            </span>
          </div>
          <div className="text-[10px] text-indigo-600 font-semibold bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-150">
            Active parallel streams loaded
          </div>
        </div>
      </div>

      {/* Main charting workspace and configuration bar */}
      <div className="border border-slate-200 rounded-2xl bg-white p-4 space-y-4">
        {/* Threshold Warning System Summary Bar */}
        <div className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          detectedSpikes.length > 0
            ? 'bg-rose-50/90 border-rose-200 text-rose-950'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border shrink-0 ${
              detectedSpikes.length > 0
                ? 'bg-rose-100 border-rose-200 text-rose-600 animate-pulse'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              {detectedSpikes.length > 0 ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold">
                <span>Threshold Warning System:</span>
                <span className={`px-2 py-0.5 font-mono text-[10px] font-extrabold rounded-full uppercase tracking-wider border ${
                  detectedSpikes.length > 0
                    ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {detectedSpikes.length > 0 ? `${detectedSpikes.length} Spike(s) > ${warnLimit}% Limit` : `Normal (< ${warnLimit}% Limit)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {detectedSpikes.length > 0
                  ? `Telemetry stream detected resource usage exceeding the ${warnLimit}% threshold. Visual spike markers highlighted on chart timeline below.`
                  : `Monitoring live telemetry stream against defined ${warnLimit}% critical resource threshold.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-[11px]">
            <span className="text-slate-500">Max Peak:</span>
            <strong className={`font-bold px-2 py-1 rounded ${
              currentStats.maxCpu >= warnLimit ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-200/60 text-slate-800'
            }`}>
              {currentStats.maxCpu.toFixed(1)}% CPU
            </strong>
          </div>
        </div>

        {/* Toolbar for Chart customization */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-xs">
          {/* Chart Metrics selector checkboxes */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Settings2 className="w-3.5 h-3.5 text-slate-500" /> Plot Metrics:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-600 select-none">
              <input
                type="checkbox"
                id="chk-plot-cpu"
                checked={visibleMetrics.cpu}
                onChange={(e) => setVisibleMetrics(prev => ({ ...prev, cpu: e.target.checked }))}
                className="accent-indigo-600 rounded cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> CPU (%)
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-600 select-none">
              <input
                type="checkbox"
                id="chk-plot-memory"
                checked={visibleMetrics.memory}
                onChange={(e) => setVisibleMetrics(prev => ({ ...prev, memory: e.target.checked }))}
                className="accent-emerald-600 rounded cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Memory (%)
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-600 select-none">
              <input
                type="checkbox"
                id="chk-plot-network"
                checked={visibleMetrics.network}
                onChange={(e) => setVisibleMetrics(prev => ({ ...prev, network: e.target.checked }))}
                className="accent-amber-500 rounded cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> IO Egress (MB/s)
              </span>
            </label>
          </div>

          {/* Settings: Window Size & Play/Pause */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] font-semibold">Window:</span>
              {timeRange ? (
                <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-[10px] font-mono font-bold border border-indigo-150 uppercase tracking-wide">
                  {timeRange === '5m' ? '5 Minutes' : timeRange === '15m' ? '15 Minutes' : '1 Hour'}
                </span>
              ) : (
                <select
                  id="sel-chart-window"
                  value={historySize}
                  onChange={(e) => setHistorySize(Number(e.target.value))}
                  className="bg-white text-slate-700 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-hidden font-bold cursor-pointer"
                >
                  <option value={15}>15 ticks (~30s)</option>
                  <option value={30}>30 ticks (~1m)</option>
                  <option value={60}>60 ticks (~2m)</option>
                </select>
              )}
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                type="button"
                id="btn-chart-type-area"
                onClick={() => setChartType('area')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  chartType === 'area' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Area
              </button>
              <button
                type="button"
                id="btn-chart-type-line"
                onClick={() => setChartType('line')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  chartType === 'line' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Line
              </button>
            </div>

            <button
              type="button"
              id="btn-toggle-forecast"
              onClick={() => {
                setShowForecast(!showForecast);
                addLog(`${!showForecast ? 'Enabled' : 'Disabled'} 24-hour predictive trend forecasting.`, 'info');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                showForecast
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Toggle 24-Hour Predictive Capacity Forecasting"
            >
              <Sparkles className={`w-3.5 h-3.5 ${showForecast ? 'text-amber-300 animate-pulse' : 'text-indigo-500'}`} />
              <span>24h Forecast</span>
            </button>

            <button
              type="button"
              id="btn-toggle-prev-week"
              onClick={() => {
                setShowComparePrevWeek(!showComparePrevWeek);
                addLog(`${!showComparePrevWeek ? 'Enabled' : 'Disabled'} previous week historical resource overlay.`, 'info');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                showComparePrevWeek
                  ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Compare Resource Usage with Previous Week Historical Overlay"
            >
              <TrendingUp className={`w-3.5 h-3.5 ${showComparePrevWeek ? 'text-white' : 'text-purple-500'}`} />
              <span>Compare (Prev Week)</span>
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <button
              type="button"
              id="btn-live-toggle"
              onClick={() => setIsPaused(!isPaused)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isPaused
                  ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
              }`}
              title={isPaused ? 'Resume Diagnostics Stream' : 'Pause Diagnostics Stream'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              id="btn-export-telemetry"
              onClick={handleExportTelemetry}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Export Historical Diagnostic Dataset"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* The Recharts Chart container */}
        <div className="w-full h-72 min-h-64 mt-2">
          {history.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-mono">
              Initializing live stream buffers...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={finalChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorNetwork" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorCpuPrevWeek" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorMemoryPrevWeek" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorNetworkPrevWeek" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorCpuForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.20}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorMemoryForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.20}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorNetworkForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.20}/>
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    stroke="#cbd5e1"
                    minTickGap={40}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    stroke="#cbd5e1"
                  />
                  <Tooltip content={<CustomSpikeTooltip warnLimit={warnLimit} />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />

                  {/* 90% Critical Threshold Zone Highlight */}
                  <ReferenceArea
                    y1={warnLimit}
                    y2={100}
                    {...({ fill: '#fca5a5', fillOpacity: 0.15, stroke: 'none' } as any)}
                  />

                  {/* Critical 90% Limit Reference Line */}
                  <ReferenceLine
                    y={warnLimit}
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    label={{
                      value: `🚨 90% CRITICAL LIMIT (${warnLimit}%)`,
                      position: 'top',
                      fill: '#dc2626',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                    }}
                  />

                  {/* Forecast Zone Divider Line */}
                  {showForecast && history.length > 0 && (
                    <ReferenceLine
                      x={history[history.length - 1].time}
                      stroke="#6366f1"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      label={{
                        value: "🔮 FORECAST ZONE (24H)",
                        position: "top",
                        fill: "#6366f1",
                        fontSize: 9,
                        fontFamily: "monospace",
                        fontWeight: "bold",
                      }}
                    />
                  )}

                  {/* Standard Configured Threshold References */}
                  {visibleMetrics.cpu && cpuThreshold < warnLimit && (
                    <ReferenceLine
                      y={cpuThreshold}
                      stroke="#f97316"
                      strokeDasharray="4 4"
                      label={{
                        value: `CPU Soft Limit ${cpuThreshold}%`,
                        position: 'top',
                        fill: '#ea580c',
                        fontSize: 9,
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                      }}
                    />
                  )}
                  {visibleMetrics.memory && ramThreshold < warnLimit && (
                    <ReferenceLine
                      y={ramThreshold}
                      stroke="#ec4899"
                      strokeDasharray="4 4"
                      label={{
                        value: `RAM Soft Limit ${ramThreshold}%`,
                        position: 'bottom',
                        fill: '#db2777',
                        fontSize: 9,
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                      }}
                    />
                  )}

                  {visibleMetrics.cpu && (
                    <Area
                      name="CPU Load (%)"
                      type="monotone"
                      dataKey="cpu"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCpu)"
                      dot={renderSpikeDot}
                      activeDot={{ r: 6, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.cpu && showComparePrevWeek && (
                    <Area
                      name="CPU Load (Prev Week %)"
                      type="monotone"
                      dataKey="cpuPrevWeek"
                      stroke="#a855f7"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorCpuPrevWeek)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#a855f7', stroke: '#ffffff', strokeWidth: 1.5 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.cpu && showForecast && (
                    <Area
                      name="CPU Forecast (%)"
                      type="monotone"
                      dataKey="cpuForecast"
                      stroke="#818cf8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={1}
                      fill="url(#colorCpuForecast)"
                      dot={false}
                      activeDot={{ r: 6, fill: '#818cf8', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.memory && (
                    <Area
                      name="Memory Heap (%)"
                      type="monotone"
                      dataKey="memory"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMemory)"
                      dot={renderSpikeDot}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.memory && showComparePrevWeek && (
                    <Area
                      name="Memory Heap (Prev Week %)"
                      type="monotone"
                      dataKey="memoryPrevWeek"
                      stroke="#06b6d4"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorMemoryPrevWeek)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 1.5 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.memory && showForecast && (
                    <Area
                      name="Memory Forecast (%)"
                      type="monotone"
                      dataKey="memoryForecast"
                      stroke="#34d399"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={1}
                      fill="url(#colorMemoryForecast)"
                      dot={false}
                      activeDot={{ r: 6, fill: '#34d399', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.network && (
                    <Area
                      name="IO Egress (MB/s)"
                      type="monotone"
                      dataKey="network"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorNetwork)"
                      activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.network && showComparePrevWeek && (
                    <Area
                      name="IO Egress (Prev Week)"
                      type="monotone"
                      dataKey="networkPrevWeek"
                      stroke="#f43f5e"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorNetworkPrevWeek)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 1.5 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.network && showForecast && (
                    <Area
                      name="IO Forecast (MB/s)"
                      type="monotone"
                      dataKey="networkForecast"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={1}
                      fill="url(#colorNetworkForecast)"
                      dot={false}
                      activeDot={{ r: 6, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  )}
                </AreaChart>
              ) : (
                <LineChart data={finalChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    stroke="#cbd5e1"
                    minTickGap={40}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    stroke="#cbd5e1"
                  />
                  <Tooltip content={<CustomSpikeTooltip warnLimit={warnLimit} />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />

                  {/* 90% Critical Threshold Zone Highlight */}
                  <ReferenceArea
                    y1={warnLimit}
                    y2={100}
                    {...({ fill: '#fca5a5', fillOpacity: 0.15, stroke: 'none' } as any)}
                  />

                  {/* Critical 90% Limit Reference Line */}
                  <ReferenceLine
                    y={warnLimit}
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    label={{
                      value: `🚨 90% CRITICAL LIMIT (${warnLimit}%)`,
                      position: 'top',
                      fill: '#dc2626',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                    }}
                  />

                  {/* Forecast Zone Divider Line */}
                  {showForecast && history.length > 0 && (
                    <ReferenceLine
                      x={history[history.length - 1].time}
                      stroke="#6366f1"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      label={{
                        value: "🔮 FORECAST ZONE (24H)",
                        position: "top",
                        fill: "#6366f1",
                        fontSize: 9,
                        fontFamily: "monospace",
                        fontWeight: "bold",
                      }}
                    />
                  )}

                  {/* Standard Configured Threshold References */}
                  {visibleMetrics.cpu && cpuThreshold < warnLimit && (
                    <ReferenceLine
                      y={cpuThreshold}
                      stroke="#f97316"
                      strokeDasharray="4 4"
                      label={{
                        value: `CPU Soft Limit ${cpuThreshold}%`,
                        position: 'top',
                        fill: '#ea580c',
                        fontSize: 9,
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                      }}
                    />
                  )}
                  {visibleMetrics.memory && ramThreshold < warnLimit && (
                    <ReferenceLine
                      y={ramThreshold}
                      stroke="#ec4899"
                      strokeDasharray="4 4"
                      label={{
                        value: `RAM Soft Limit ${ramThreshold}%`,
                        position: 'bottom',
                        fill: '#db2777',
                        fontSize: 9,
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                      }}
                    />
                  )}

                  {visibleMetrics.cpu && (
                    <Line
                      name="CPU Load (%)"
                      type="monotone"
                      dataKey="cpu"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={renderSpikeDot}
                      activeDot={{ r: 6, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.cpu && showComparePrevWeek && (
                    <Line
                      name="CPU Load (Prev Week %)"
                      type="monotone"
                      dataKey="cpuPrevWeek"
                      stroke="#a855f7"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      activeDot={{ r: 5, fill: '#a855f7', stroke: '#ffffff', strokeWidth: 1.5 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.cpu && showForecast && (
                    <Line
                      name="CPU Forecast (%)"
                      type="monotone"
                      dataKey="cpuForecast"
                      stroke="#818cf8"
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 6, fill: '#818cf8', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.memory && (
                    <Line
                      name="Memory Heap (%)"
                      type="monotone"
                      dataKey="memory"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={renderSpikeDot}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.memory && showComparePrevWeek && (
                    <Line
                      name="Memory Heap (Prev Week %)"
                      type="monotone"
                      dataKey="memoryPrevWeek"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      activeDot={{ r: 5, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 1.5 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.memory && showForecast && (
                    <Line
                      name="Memory Forecast (%)"
                      type="monotone"
                      dataKey="memoryForecast"
                      stroke="#34d399"
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 6, fill: '#34d399', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.network && (
                    <Line
                      name="IO Egress (MB/s)"
                      type="monotone"
                      dataKey="network"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.network && showComparePrevWeek && (
                    <Line
                      name="IO Egress (Prev Week)"
                      type="monotone"
                      dataKey="networkPrevWeek"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      activeDot={{ r: 5, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 1.5 }}
                      isAnimationActive={false}
                    />
                  )}

                  {visibleMetrics.network && showForecast && (
                    <Line
                      name="IO Forecast (MB/s)"
                      type="monotone"
                      dataKey="networkForecast"
                      stroke="#fbbf24"
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 6, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {showForecast && insights && (
        <div className="border border-indigo-100 rounded-2xl bg-indigo-50/40 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">24-Hour Capacity Forecast Analytics</h4>
                <p className="text-[11px] text-slate-500 font-medium">Predictive trend extrapolation with integrated cyclic workload variance models</p>
              </div>
            </div>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              Model: Linear Regression + Diurnal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* CPU Forecast Card */}
            <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-mono">Projected CPU Load</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-800">Peak {insights.peakCpu.toFixed(1)}%</span>
                  <span className="text-xs text-slate-500 font-semibold">at {insights.peakCpuHour}</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2 mt-2.5 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  {insights.cpuTrend === 'UPWARD_GROWTH' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-amber-700 font-bold">Upward Trend</span>
                    </>
                  ) : insights.cpuTrend === 'DOWNWARD_DECAY' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-emerald-700 font-bold">Decline Trend</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-indigo-700 font-bold">Stable</span>
                    </>
                  )}
                </span>
                <span className="font-mono text-[11px] text-slate-400 font-bold">
                  {insights.cpuSlope >= 0 ? '+' : ''}{(insights.cpuSlope * 60).toFixed(2)}%/h
                </span>
              </div>
            </div>

            {/* Memory Forecast Card */}
            <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-mono">Projected Memory Load</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-800">Peak {insights.peakMem.toFixed(1)}%</span>
                  <span className="text-xs text-slate-500 font-semibold">at {insights.peakMemHour}</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2 mt-2.5 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  {insights.memTrend === 'UPWARD_GROWTH' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-amber-700 font-bold">Upward Trend</span>
                    </>
                  ) : insights.memTrend === 'DOWNWARD_DECAY' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-emerald-700 font-bold">Decline Trend</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-indigo-700 font-bold">Stable</span>
                    </>
                  )}
                </span>
                <span className="font-mono text-[11px] text-slate-400 font-bold">
                  {insights.memSlope >= 0 ? '+' : ''}{(insights.memSlope * 60).toFixed(2)}%/h
                </span>
              </div>
            </div>

            {/* Threshold Violations & Risk Level Card */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between shadow-xs ${
              insights.criticalBreachesCount > 0
                ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                : insights.cpuBreachesCount > 0 || insights.memBreachesCount > 0
                ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                : 'bg-white border-slate-150 text-slate-800'
            }`}>
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-mono block">Predictive Risk Level</span>
                <div className="flex items-center gap-1.5 mt-1 font-extrabold text-lg">
                  {insights.criticalBreachesCount > 0 ? (
                    <span className="text-rose-700">HIGH RISK</span>
                  ) : insights.cpuBreachesCount > 0 || insights.memBreachesCount > 0 ? (
                    <span className="text-amber-700">MEDIUM RISK</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">LOW / COMPLIANT</span>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2 mt-2.5 text-[11px] text-slate-500 flex flex-col gap-0.5">
                {insights.criticalBreachesCount > 0 ? (
                  <span className="font-bold text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {insights.criticalBreachesCount} hours with critical warnings projected!
                  </span>
                ) : insights.cpuBreachesCount > 0 || insights.memBreachesCount > 0 ? (
                  <span className="font-bold text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Soft thresholds breached at times.
                  </span>
                ) : (
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% capacity threshold compliance projected.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showComparePrevWeek && (
        <div className="border border-purple-100 rounded-2xl bg-purple-50/40 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                <TrendingUp className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Long-Term Performance Degradation Analysis</h4>
                <p className="text-[11px] text-slate-500 font-medium">Historical baseline comparison (Current week vs. Previous week)</p>
              </div>
            </div>
            <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              Drift Status: DEGRADED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* CPU Drift */}
            <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-mono">CPU Baseline Drift</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-amber-700">+14.2%</span>
                  <span className="text-xs text-slate-500 font-semibold">avg shift</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2 mt-2.5 text-xs text-slate-600 leading-relaxed font-medium">
                CPU instruction cycle complexity has expanded, indicating higher overhead in schema version resolution retries.
              </div>
            </div>

            {/* Memory Drift */}
            <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-mono">Memory Heap Expansion</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-rose-700">+22.4%</span>
                  <span className="text-xs text-slate-500 font-semibold">cumulative drift</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2 mt-2.5 text-xs text-slate-600 leading-relaxed font-medium">
                Significant baseline heap elevation detected, suggesting a cumulative memory leak or connection cache fragmentation.
              </div>
            </div>

            {/* Degradation Risk Card */}
            <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-mono block">Weekly Degradation Alert</span>
                <div className="flex items-center gap-1.5 mt-1 font-extrabold text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>PREVENTATIVE RESTART RECOMMENDED</span>
                </div>
              </div>
              <div className="border-t border-amber-100 pt-2 mt-2.5 text-[11px] text-amber-700 leading-relaxed font-medium">
                At current drift velocities, GC reclamation efficiency will degrade below 70% within 4.5 days. Preventative JVM GC flush recommended.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal of GC & Resource logs */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5 font-bold text-slate-200 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            JVM Resource Diagnostic Stream Console
          </span>
          <button
            type="button"
            onClick={() => {
              setGcTelemetryLogs([
                { time: new Date().toLocaleTimeString(), msg: 'Diagnostic console output cleared.', type: 'info' }
              ]);
            }}
            className="text-[10px] hover:text-white transition-colors cursor-pointer"
          >
            Clear Output
          </button>
        </div>
        
        <div className="font-mono text-[11px] space-y-1.5 max-h-32 overflow-y-auto pr-2 scrollbar-thin">
          {gcTelemetryLogs.map((log, index) => (
            <div key={index} className="flex items-start gap-2.5">
              <span className="text-slate-600 shrink-0 select-none font-semibold">[{log.time}]</span>
              <span className={`break-all ${
                log.type === 'success' ? 'text-emerald-400' :
                log.type === 'warn' ? 'text-amber-400 font-bold' :
                'text-indigo-300'
              }`}>
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
