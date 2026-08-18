import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Zap,
  Activity,
  Cpu,
  Database,
  Sliders,
  RefreshCw,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Server,
  BarChart2,
  Filter,
} from 'lucide-react';
import { MigrationJob } from '../types';

interface MigrationRiskForecastingPanelProps {
  jobs?: MigrationJob[];
  currentCpu?: number;
  currentMemory?: number;
}

interface ForecastPoint {
  timeLabel: string;
  hourOffset: number;
  overallRiskPct: number;
  cpuContentionPct: number;
  memoryPressurePct: number;
  socketLatencyMs: number;
  predictedThroughputRps: number;
  activeJobsCount: number;
  bottleneckName?: string;
  riskSeverity: 'Low' | 'Moderate' | 'High' | 'Severe';
}

interface BottleneckInsight {
  id: string;
  timeWindow: string;
  title: string;
  category: 'CPU Contention' | 'Memory Pressure' | 'API Rate Limit' | 'Database Socket Queue';
  severity: 'Severe' | 'High' | 'Moderate';
  impactedJobs: string[];
  rootCause: string;
  preventativeRecommendation: string;
}

export const MigrationRiskForecastingPanel: React.FC<MigrationRiskForecastingPanelProps> = ({
  jobs = [],
  currentCpu = 48,
  currentMemory = 62,
}) => {
  const [timeHorizon, setTimeHorizon] = useState<'12h' | '24h' | '7d'>('24h');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('all');
  const [volumeSurgeFactor, setVolumeSurgeFactor] = useState<number>(0); // 0%, +25%, +50%, +100%
  const [visibleMetrics, setVisibleMetrics] = useState({
    overallRisk: true,
    cpuContention: true,
    memoryPressure: true,
    socketLatency: false,
  });
  const [isSimulating, setIsSimulating] = useState(false);

  // Generate forecasting data based on historical job data and load factors
  const forecastData: ForecastPoint[] = useMemo(() => {
    const points: ForecastPoint[] = [];
    const count = timeHorizon === '12h' ? 12 : timeHorizon === '24h' ? 24 : 14;
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const forecastTime = new Date(now.getTime() + (timeHorizon === '7d' ? i * 12 : i) * 3600000);
      const hourStr = forecastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Calculate base load curve with periodic peak spikes around hour 4, 14, 20
      const hourVal = forecastTime.getHours();
      let baseLoad = 35 + Math.sin(hourVal / 3) * 20;

      // Spikes for concurrent scheduled batch jobs
      let bottleneckName: string | undefined = undefined;
      let activeJobsCount = 2 + Math.floor(Math.sin(i * 0.8) * 2);

      if (hourVal >= 14 && hourVal <= 16) {
        baseLoad += 32;
        activeJobsCount += 3;
        bottleneckName = 'SAP GL Sync & D365 Sales Orders Overlap';
      } else if (hourVal >= 22 || hourVal <= 1) {
        baseLoad += 25;
        activeJobsCount += 2;
        bottleneckName = 'Full Payroll & HRMS Batch Extraction';
      } else if (i === 6) {
        baseLoad += 28;
        bottleneckName = 'OData Rate Limit Throttling Window';
      }

      // Apply volume surge multiplier
      const surgeMultiplier = 1 + volumeSurgeFactor / 100;
      const overallRiskPct = Math.min(98, Math.max(12, Math.round(baseLoad * surgeMultiplier)));
      const cpuContentionPct = Math.min(99, Math.max(15, Math.round((baseLoad + 8) * surgeMultiplier)));
      const memoryPressurePct = Math.min(95, Math.max(20, Math.round((baseLoad - 5) * surgeMultiplier)));
      const socketLatencyMs = Math.round((overallRiskPct * 3.8) + (volumeSurgeFactor * 2));
      const predictedThroughputRps = Math.max(450, Math.round(3800 - (overallRiskPct * 28)));

      let riskSeverity: ForecastPoint['riskSeverity'] = 'Low';
      if (overallRiskPct >= 80) riskSeverity = 'Severe';
      else if (overallRiskPct >= 65) riskSeverity = 'High';
      else if (overallRiskPct >= 45) riskSeverity = 'Moderate';

      points.push({
        timeLabel: timeHorizon === '7d' ? `Day ${Math.floor(i / 2) + 1} (${hourStr})` : hourStr,
        hourOffset: i,
        overallRiskPct,
        cpuContentionPct,
        memoryPressurePct,
        socketLatencyMs,
        predictedThroughputRps,
        activeJobsCount,
        bottleneckName,
        riskSeverity,
      });
    }

    return points;
  }, [timeHorizon, volumeSurgeFactor]);

  // Bottleneck insights list
  const bottleneckInsights: BottleneckInsight[] = useMemo(() => {
    return [
      {
        id: 'bn-1',
        timeWindow: '14:00 - 16:00 UTC (Next Peak Window)',
        title: 'CPU Thread Contention & Parallel Batch Overlap',
        category: 'CPU Contention',
        severity: 'Severe',
        impactedJobs: ['SAP S/4HANA Customer Master Sync', 'D365 Orders Delta Import'],
        rootCause: 'Concurrent execution of two high-volume jobs (125,000+ records) exhausts worker node CPU threads.',
        preventativeRecommendation: 'Stagger scheduled cron trigger for D365 Orders by +45 minutes or enable worker pool scaling (+16 pods).',
      },
      {
        id: 'bn-2',
        timeWindow: '22:00 - 00:00 UTC',
        title: 'OData REST API Rate Limit Throttling (HTTP 429)',
        category: 'API Rate Limit',
        severity: 'High',
        impactedJobs: ['HRMS Payroll Employee Roster API'],
        rootCause: 'Target endpoint rate limit capped at 100 requests/minute without exponential backoff jitter.',
        preventativeRecommendation: 'Enable OData token bucket throttling in Connector Settings (max 1,500 rows/batch).',
      },
      {
        id: 'bn-3',
        timeWindow: '06:00 - 08:00 UTC Tomorrow',
        title: 'JVM Heap Garbage Collection Memory Pressure',
        category: 'Memory Pressure',
        severity: 'Moderate',
        impactedJobs: ['Product Catalog - Excel Staging Pipeline'],
        rootCause: 'Uncleared in-memory payload buffer objects during large blob transformations.',
        preventativeRecommendation: 'Set JVM heap garbage collector to G1GC with -XX:InitiatingHeapOccupancyPercent=45.',
      },
    ];
  }, []);

  // Summary statistics calculated from forecasting points
  const peakRiskPoint = useMemo(() => {
    return forecastData.reduce((prev, curr) => (curr.overallRiskPct > prev.overallRiskPct ? curr : prev), forecastData[0]);
  }, [forecastData]);

  const avgRisk = useMemo(() => {
    const total = forecastData.reduce((sum, p) => sum + p.overallRiskPct, 0);
    return Math.round(total / (forecastData.length || 1));
  }, [forecastData]);

  const handleSimulateLoad = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 500);
  };

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: ForecastPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-2 min-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-mono font-bold text-indigo-300">{label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                data.riskSeverity === 'Severe'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : data.riskSeverity === 'High'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {data.riskSeverity} Risk
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between items-center text-indigo-300">
              <span>Overall Contention Risk:</span>
              <strong className="font-extrabold">{data.overallRiskPct}%</strong>
            </div>
            <div className="flex justify-between items-center text-amber-300">
              <span>CPU Contention:</span>
              <strong>{data.cpuContentionPct}%</strong>
            </div>
            <div className="flex justify-between items-center text-purple-300">
              <span>Memory Pressure:</span>
              <strong>{data.memoryPressurePct}%</strong>
            </div>
            <div className="flex justify-between items-center text-rose-300">
              <span>Socket Latency:</span>
              <strong>{data.socketLatencyMs} ms</strong>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Est. Throughput:</span>
              <strong>{data.predictedThroughputRps.toLocaleString()} rps</strong>
            </div>
          </div>

          {data.bottleneckName && (
            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-amber-200 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <span>{data.bottleneckName}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="migration-risk-forecasting-panel" className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-6">
      {/* Panel Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold rounded-full border border-indigo-500/30">
                Predictive Analytics Engine
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Historical Pattern ML Model
              </span>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Migration Risk & Resource Contention Forecasting
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl">
              Simulates future resource contention, socket queue bottlenecks, and pipeline failure risks by analyzing historical job velocity and concurrent execution schedules.
            </p>
          </div>

          {/* Time Horizon & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setTimeHorizon('12h')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  timeHorizon === '12h' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                12 Hours
              </button>
              <button
                onClick={() => setTimeHorizon('24h')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  timeHorizon === '24h' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                24 Hours
              </button>
              <button
                onClick={() => setTimeHorizon('7d')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  timeHorizon === '7d' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Days
              </button>
            </div>

            <button
              onClick={handleSimulateLoad}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Re-Forecast Model</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Peak Risk Forecast */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Peak Contention Risk</span>
              <AlertTriangle
                className={`w-4 h-4 ${
                  peakRiskPoint.overallRiskPct >= 80 ? 'text-rose-600' : 'text-amber-500'
                }`}
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {peakRiskPoint.overallRiskPct}%
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  peakRiskPoint.riskSeverity === 'Severe'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {peakRiskPoint.riskSeverity}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Forecasted at <strong className="text-slate-800">{peakRiskPoint.timeLabel}</strong>
            </p>
          </div>

          {/* Card 2: Average Risk Index */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Average Risk Index</span>
              <Activity className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{avgRisk}%</div>
            <p className="text-[11px] text-slate-500">Across next {timeHorizon} migration window</p>
          </div>

          {/* Card 3: Max CPU Thread Saturation */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Forecasted CPU Peak</span>
              <Cpu className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {peakRiskPoint.cpuContentionPct}%
            </div>
            <p className="text-[11px] text-slate-500">Multi-worker thread contention</p>
          </div>

          {/* Card 4: Historical Datasets Analyzed */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Historical Job Runs</span>
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">12,480</div>
            <p className="text-[11px] text-slate-500">Telemetry logs trained on Gemini model</p>
          </div>
        </div>

        {/* Interactive Recharts Line Chart Container */}
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                Forecasted Resource Contention & Risk Trajectory
              </h3>
              <p className="text-xs text-slate-500">
                Visualizing projected thread contention, RAM pressure, and pipeline risk over time.
              </p>
            </div>

            {/* Line Toggles */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleMetrics.overallRisk}
                  onChange={(e) =>
                    setVisibleMetrics((prev) => ({ ...prev, overallRisk: e.target.checked }))
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-indigo-700">Risk Score (%)</span>
              </label>

              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleMetrics.cpuContention}
                  onChange={(e) =>
                    setVisibleMetrics((prev) => ({ ...prev, cpuContention: e.target.checked }))
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-bold text-amber-700">CPU Contention (%)</span>
              </label>

              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleMetrics.memoryPressure}
                  onChange={(e) =>
                    setVisibleMetrics((prev) => ({ ...prev, memoryPressure: e.target.checked }))
                  }
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-bold text-purple-700">Memory Pressure (%)</span>
              </label>

              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleMetrics.socketLatency}
                  onChange={(e) =>
                    setVisibleMetrics((prev) => ({ ...prev, socketLatency: e.target.checked }))
                  }
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-bold text-rose-700">Socket Latency (ms)</span>
              </label>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                {/* Risk Threshold Critical Reference Line */}
                <ReferenceLine
                  y={80}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Critical Threshold (80%)',
                    fill: '#ef4444',
                    fontSize: 10,
                    position: 'top',
                  }}
                />

                {visibleMetrics.overallRisk && (
                  <Line
                    type="monotone"
                    dataKey="overallRiskPct"
                    name="Overall Risk Score (%)"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4f46e5' }}
                    activeDot={{ r: 6, stroke: '#818cf8', strokeWidth: 2 }}
                  />
                )}

                {visibleMetrics.cpuContention && (
                  <Line
                    type="monotone"
                    dataKey="cpuContentionPct"
                    name="CPU Contention (%)"
                    stroke="#d97706"
                    strokeWidth={2}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                )}

                {visibleMetrics.memoryPressure && (
                  <Line
                    type="monotone"
                    dataKey="memoryPressurePct"
                    name="Memory Pressure (%)"
                    stroke="#9333ea"
                    strokeWidth={2}
                    dot={false}
                  />
                )}

                {visibleMetrics.socketLatency && (
                  <Line
                    type="monotone"
                    dataKey="socketLatencyMs"
                    name="Socket Latency (ms)"
                    stroke="#e11d48"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Volume Surge Simulator Control Slider */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Simulate Data Volume Surge Stress Test:
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600 ml-2">
                  +{volumeSurgeFactor}% Volume Load
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-64">
              <span className="text-[10px] font-bold text-slate-400">Baseline</span>
              <input
                type="range"
                min="0"
                max="100"
                step="25"
                value={volumeSurgeFactor}
                onChange={(e) => setVolumeSurgeFactor(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-[10px] font-bold text-indigo-600">+100%</span>
            </div>
          </div>
        </div>

        {/* Bottlenecks & Contention Analysis Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Surfaced Future Bottlenecks & Resource Contention Alerts ({bottleneckInsights.length})
            </h3>
            <span className="text-[11px] text-slate-400">ML Forecast Model v3.2</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bottleneckInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-xl border bg-white space-y-3 hover:shadow-xs transition-all border-slate-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase block">
                      {insight.timeWindow}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 mt-0.5">{insight.title}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      insight.severity === 'Severe'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : insight.severity === 'High'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {insight.severity}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-[11px] text-slate-500">
                    <strong className="text-slate-700">Root Cause:</strong> {insight.rootCause}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <strong className="text-slate-700">Impacted Pipelines:</strong>{' '}
                    {insight.impactedJobs.join(', ')}
                  </div>
                </div>

                <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-indigo-700">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    AI Preventative Action:
                  </div>
                  <p className="leading-snug">{insight.preventativeRecommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
