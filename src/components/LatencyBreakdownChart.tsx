import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Clock,
  Database,
  Network,
  Cpu,
  Binary,
  Layers,
  Activity,
  Sliders,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
  BarChart3,
  RefreshCw,
  Zap,
} from 'lucide-react';

export interface LatencyPoint {
  time: string;
  networkTime: number;
  dbQueryTime: number;
  processingTime: number;
  serializationDelay: number;
  totalLatency: number;
}

interface LatencyBreakdownChartProps {
  currentCpu?: number;
  isSpikeActive?: boolean;
}

// Pathway definitions with baseline ratios
interface IngestionPathway {
  id: string;
  name: string;
  description: string;
  baseLatency: number; // in ms
  distribution: {
    network: number; // ratio
    database: number; // ratio
    processing: number; // ratio
    serialization: number; // ratio
  };
}

const PATHWAYS: IngestionPathway[] = [
  {
    id: 'sap-rfc',
    name: 'SAP ERP Bulk RFC Extractor',
    description: 'High network transport overhead due to legacy row-by-row socket streaming.',
    baseLatency: 145,
    distribution: { network: 0.55, database: 0.15, processing: 0.15, serialization: 0.15 },
  },
  {
    id: 'iceberg-parquet',
    name: 'Iceberg Catalog Parquet Sync',
    description: 'High metadata serialization delay during heavy parallel column grouping.',
    baseLatency: 85,
    distribution: { network: 0.10, database: 0.20, processing: 0.25, serialization: 0.45 },
  },
  {
    id: 'snowflake-pipe',
    name: 'Snowflake Direct Pipe Ingress',
    description: 'High staging database queries and bulk micro-batch commit handshakes.',
    baseLatency: 180,
    distribution: { network: 0.20, database: 0.50, processing: 0.15, serialization: 0.15 },
  },
  {
    id: 'spark-g1gc',
    name: 'Spark Core JVM RDD Join',
    description: 'Heavy in-memory computation processing latency during cross-region partition merges.',
    baseLatency: 120,
    distribution: { network: 0.15, database: 0.10, processing: 0.60, serialization: 0.15 },
  },
];

export const LatencyBreakdownChart: React.FC<LatencyBreakdownChartProps> = ({
  currentCpu = 55,
  isSpikeActive = false,
}) => {
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>('sap-rfc');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [simulationMod, setSimulationMod] = useState<'none' | 'db_degrade' | 'network_jitter' | 'compress_leak'>('none');
  const [latencyHistory, setLatencyHistory] = useState<LatencyPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<LatencyPoint | null>(null);
  const [slaLimit, setSlaLimit] = useState<number>(200); // 200ms default SLA limit

  // Generate historical data based on the selected pathway and current simulation/CPU state
  const currentPathway = useMemo(() => {
    return PATHWAYS.find((p) => p.id === selectedPathwayId) || PATHWAYS[0];
  }, [selectedPathwayId]);

  const generateDataPoint = (indexOffset: number, baseModifier: number = 1): LatencyPoint => {
    const d = currentPathway.distribution;
    let base = currentPathway.baseLatency * baseModifier;

    // Adjust base latency based on general CPU load and spike triggers
    if (isSpikeActive || currentCpu > 85) {
      base *= 1.75;
    } else if (currentCpu > 70) {
      base *= 1.3;
    }

    // Apply specific simulation modifiers
    let netMult = 1.0;
    let dbMult = 1.0;
    let procMult = 1.0;
    let serMult = 1.0;

    if (simulationMod === 'db_degrade') {
      dbMult = 3.5;
      base += 80;
    } else if (simulationMod === 'network_jitter') {
      netMult = 4.0;
      base += 120;
    } else if (simulationMod === 'compress_leak') {
      serMult = 3.0;
      base += 65;
    }

    // Add slight random variations over time (sine waves + random jitter)
    const timePhase = ((Date.now() / 8000) + indexOffset) % (Math.PI * 2);
    const sineJitter = Math.sin(timePhase) * 12;
    const randJitter = (Math.random() - 0.5) * 6;

    const net = Math.max(5, Math.round(base * d.network * netMult + sineJitter * 0.3 + randJitter));
    const db = Math.max(5, Math.round(base * d.database * dbMult + sineJitter * 0.2 + randJitter * 0.5));
    const proc = Math.max(5, Math.round(base * d.processing * procMult + sineJitter * 0.4 + randJitter * 0.8));
    const ser = Math.max(5, Math.round(base * d.serialization * serMult + sineJitter * 0.1 + randJitter * 0.4));

    const date = new Date(Date.now() - (15 - indexOffset) * 5000);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return {
      time: timeStr,
      networkTime: net,
      dbQueryTime: db,
      processingTime: proc,
      serializationDelay: ser,
      totalLatency: net + db + proc + ser,
    };
  };

  // Initialize history
  useEffect(() => {
    const initialHistory = Array.from({ length: 15 }).map((_, i) => generateDataPoint(i, 0.9 + (i * 0.01)));
    setLatencyHistory(initialHistory);
  }, [selectedPathwayId, simulationMod]);

  // Real-time slide interval updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyHistory((prev) => {
        const nextPoint = generateDataPoint(15, 1.0);
        return [...prev.slice(1), nextPoint];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedPathwayId, simulationMod, currentCpu, isSpikeActive]);

  // Derived current metrics
  const latestPoint = useMemo(() => {
    return latencyHistory[latencyHistory.length - 1] || {
      networkTime: 0,
      dbQueryTime: 0,
      processingTime: 0,
      serializationDelay: 0,
      totalLatency: 0,
    };
  }, [latencyHistory]);

  const averageMetrics = useMemo(() => {
    if (latencyHistory.length === 0) return { net: 0, db: 0, proc: 0, ser: 0, total: 0 };
    const sums = latencyHistory.reduce(
      (acc, p) => ({
        net: acc.net + p.networkTime,
        db: acc.db + p.dbQueryTime,
        proc: acc.proc + p.processingTime,
        ser: acc.ser + p.serializationDelay,
        total: acc.total + p.totalLatency,
      }),
      { net: 0, db: 0, proc: 0, ser: 0, total: 0 }
    );
    const count = latencyHistory.length;
    return {
      net: Math.round(sums.net / count),
      db: Math.round(sums.db / count),
      proc: Math.round(sums.proc / count),
      ser: Math.round(sums.ser / count),
      total: Math.round(sums.total / count),
    };
  }, [latencyHistory]);

  // SLA violation count
  const slaViolations = useMemo(() => {
    return latencyHistory.filter((p) => p.totalLatency > slaLimit).length;
  }, [latencyHistory, slaLimit]);

  // Pie chart breakdown data for the highlighted point (or latest point if none)
  const pieData = useMemo(() => {
    const point = hoveredPoint || latestPoint;
    return [
      { name: 'Network Time', value: point.networkTime, color: '#4f46e5', icon: Network },
      { name: 'Database Query', value: point.dbQueryTime, color: '#06b6d4', icon: Database },
      { name: 'Processing Time', value: point.processingTime, color: '#10b981', icon: Cpu },
      { name: 'Serialization Delay', value: point.serializationDelay, color: '#f59e0b', icon: Binary },
    ];
  }, [hoveredPoint, latestPoint]);

  return (
    <div id="latency-breakdown-diagnostics" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
      {/* Component Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-mono font-bold rounded-full border border-rose-100 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-rose-500 animate-spin" />
              Ingestion Phase Decomposition
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Microsecond Pipeline Execution Audit
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Distributed Latency Phase Breakdown Analyzer
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Deconstruct total ingestion journey time into transactional phases to instantly isolate transatlantic route latency spikes from heavy parquet conversion overhead or storage lock queues.
          </p>
        </div>

        {/* SLA & Graph Type Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'area' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Stacked Area
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'bar' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Stacked Bar
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-rose-700 font-mono">SLA Alert Threshold:</span>
            <select
              value={slaLimit}
              onChange={(e) => setSlaLimit(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-900 focus:outline-hidden"
            >
              <option value={150}>150ms Limit</option>
              <option value={200}>200ms Limit (SLA)</option>
              <option value={250}>250ms Limit</option>
              <option value={350}>350ms Limit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pathway Selection Header Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PATHWAYS.map((pw) => {
          const isSelected = pw.id === selectedPathwayId;
          return (
            <button
              key={pw.id}
              type="button"
              onClick={() => {
                setSelectedPathwayId(pw.id);
                setHoveredPoint(null);
              }}
              className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 h-28 group relative overflow-hidden ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-[1.01]'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
              }`}
            >
              <div>
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                  Ingress Feed Pathway
                </span>
                <span className={`text-xs font-extrabold block truncate mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {pw.name}
                </span>
              </div>
              <p className={`text-[10px] leading-relaxed line-clamp-2 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                {pw.description}
              </p>
              {isSelected && (
                <div className="absolute right-2 top-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Interactive Simulation / Injector Controls */}
      <div className="bg-slate-50 rounded-xl border border-slate-150 p-4.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-600 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-600" />
            Inject Pathway Friction Modifier (Simulate Phase Bottlenecks)
          </span>
          {simulationMod !== 'none' && (
            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-mono text-[9px] font-extrabold rounded-full border border-rose-200 animate-pulse uppercase tracking-wider">
              Simulation Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setSimulationMod('none')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              simulationMod === 'none'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Baseline Phase Timing
          </button>

          <button
            type="button"
            onClick={() => setSimulationMod('network_jitter')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              simulationMod === 'network_jitter'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Simulate remote router jitter, adding +120ms network time"
          >
            Simulate Transatlantic Jitter (+Net)
          </button>

          <button
            type="button"
            onClick={() => setSimulationMod('db_degrade')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              simulationMod === 'db_degrade'
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Simulate target database index missing, adding +80ms database query time"
          >
            DB Index Lock Degradation (+DB)
          </button>

          <button
            type="button"
            onClick={() => setSimulationMod('compress_leak')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              simulationMod === 'compress_leak'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Simulate massive parquet partition serialization block, adding +65ms serialization delay"
          >
            Metadata Serialization Block (+Ser)
          </button>
        </div>
      </div>

      {/* Charts and Diagnostic Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recharts Stacked Latency Trend Chart */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Accumulated Phase Delay Timeline (Real-time)
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Polling every 4s</span>
            </div>
          </div>

          <div className="border border-slate-150 rounded-2xl bg-white p-4 h-80 shadow-3xs relative">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart
                  data={latencyHistory}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  onMouseMove={(state: any) => {
                    if (state && state.activePayload && state.activePayload[0]) {
                      setHoveredPoint(state.activePayload[0].payload as LatencyPoint);
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorProc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorSer" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    name="Network Time"
                    type="monotone"
                    dataKey="networkTime"
                    stackId="1"
                    stroke="#4f46e5"
                    fillOpacity={1}
                    fill="url(#colorNet)"
                  />
                  <Area
                    name="Database Query"
                    type="monotone"
                    dataKey="dbQueryTime"
                    stackId="1"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorDb)"
                  />
                  <Area
                    name="Processing Time"
                    type="monotone"
                    dataKey="processingTime"
                    stackId="1"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorProc)"
                  />
                  <Area
                    name="Serialization Delay"
                    type="monotone"
                    dataKey="serializationDelay"
                    stackId="1"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorSer)"
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={latencyHistory}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  onMouseMove={(state: any) => {
                    if (state && state.activePayload && state.activePayload[0]) {
                      setHoveredPoint(state.activePayload[0].payload as LatencyPoint);
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar name="Network Time" dataKey="networkTime" stackId="a" fill="#4f46e5" />
                  <Bar name="Database Query" dataKey="dbQueryTime" stackId="a" fill="#06b6d4" />
                  <Bar name="Processing Time" dataKey="processingTime" stackId="a" fill="#10b981" />
                  <Bar name="Serialization Delay" dataKey="serializationDelay" stackId="a" fill="#f59e0b" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Pie/Donut Breakdown and Phase Diagnostics */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              {hoveredPoint ? 'Hovered Point Breakdown' : 'Latest Phase Breakdown'}
            </span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-100">
              {(hoveredPoint || latestPoint).totalLatency} ms Total
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 flex flex-col justify-between h-80 shadow-3xs">
            {/* Visual Donut Chart */}
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={44}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center latency text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-black text-slate-900 leading-none">
                    {(hoveredPoint || latestPoint).totalLatency}
                  </span>
                  <span className="text-[8px] font-mono text-slate-400 uppercase">ms</span>
                </div>
              </div>

              {/* Progress-style Breakdown Lists */}
              <div className="flex-1 space-y-2">
                {pieData.map((p) => {
                  const total = (hoveredPoint || latestPoint).totalLatency || 1;
                  const pct = Math.round((p.value / total) * 100);
                  const Icon = p.icon;
                  return (
                    <div key={p.name} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-extrabold text-slate-700 flex items-center gap-1">
                          <Icon className="w-3 h-3" style={{ color: p.color }} />
                          {p.name}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{p.value}ms ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div className="h-1 rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SLA Diagnostic Status Indicator */}
            <div className="border-t border-slate-200/80 pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">SLA Audit Status</span>
                {averageMetrics.total > slaLimit ? (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    BREACHED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    COMPLIANT
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {averageMetrics.total > slaLimit ? (
                  `Phase bottleneck detected! Average total latency (${averageMetrics.total}ms) violates your target SLA threshold of ${slaLimit}ms across the sliding history window.`
                ) : (
                  `Pipeline is humming gracefully inside target boundaries. Average telemetry latency sits at ${averageMetrics.total}ms (${Math.round((averageMetrics.total / slaLimit) * 100)}% SLA usage).`
                )}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                <span>Recent SLA Violations: <strong>{slaViolations} / 15 points</strong></span>
                <span>Avg Total: <strong>{averageMetrics.total}ms</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
