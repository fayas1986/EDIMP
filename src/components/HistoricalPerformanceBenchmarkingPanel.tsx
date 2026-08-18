import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Cpu,
  Server,
  HardDrive,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Sliders,
  Database,
  Activity,
  Flame,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface HistoricalJob {
  id: string;
  jobName: string;
  sourceTarget: string;
  recordCount: number;
  durationMins: number;
  executedAt: string;
  avgCpuPct: number;
  peakCpuPct: number;
  avgRamGb: number;
  peakRamGb: number;
  avgDiskIoMbSec: number;
  avgThroughputRecSec: number;
  peakThroughputRecSec: number;
  status: 'Completed' | 'Warning' | 'Throttled';
}

const HISTORICAL_JOBS: HistoricalJob[] = [
  {
    id: 'job-101',
    jobName: 'Job #101: SAP S/4HANA Finance (Single-Threaded Baseline)',
    sourceTarget: 'SAP ERP -> Azure SQL Staging',
    recordCount: 1500000,
    durationMins: 45,
    executedAt: 'Yesterday at 09:00 AM',
    avgCpuPct: 62,
    peakCpuPct: 84,
    avgRamGb: 14.2,
    peakRamGb: 22.8,
    avgDiskIoMbSec: 18.5,
    avgThroughputRecSec: 33300,
    peakThroughputRecSec: 52000,
    status: 'Completed',
  },
  {
    id: 'job-102',
    jobName: 'Job #102: SAP S/4HANA Finance (Multi-Pod K8s Scaling)',
    sourceTarget: 'SAP ERP -> Azure SQL Staging',
    recordCount: 1500000,
    durationMins: 18,
    executedAt: 'Yesterday at 02:30 PM',
    avgCpuPct: 88,
    peakCpuPct: 96,
    avgRamGb: 38.5,
    peakRamGb: 54.0,
    avgDiskIoMbSec: 52.4,
    avgThroughputRecSec: 83300,
    peakThroughputRecSec: 142000,
    status: 'Completed',
  },
  {
    id: 'job-103',
    jobName: 'Job #103: Dynamics 365 CE Customer Master Load',
    sourceTarget: 'D365 CRM -> Azure Data Lake',
    recordCount: 2200000,
    durationMins: 32,
    executedAt: 'Yesterday at 08:00 PM',
    avgCpuPct: 74,
    peakCpuPct: 91,
    avgRamGb: 28.0,
    peakRamGb: 36.5,
    avgDiskIoMbSec: 34.2,
    avgThroughputRecSec: 68750,
    peakThroughputRecSec: 110000,
    status: 'Completed',
  },
  {
    id: 'job-104',
    jobName: 'Job #104: Salesforce Sales Cloud Delta Replay (Throttled)',
    sourceTarget: 'Salesforce -> Delta Lake',
    recordCount: 800000,
    durationMins: 40,
    executedAt: 'Today at 01:15 AM',
    avgCpuPct: 48,
    peakCpuPct: 78,
    avgRamGb: 12.0,
    peakRamGb: 18.2,
    avgDiskIoMbSec: 12.1,
    avgThroughputRecSec: 20000,
    peakThroughputRecSec: 38000,
    status: 'Throttled',
  },
  {
    id: 'job-105',
    jobName: 'Job #105: Oracle EBS Payroll & Ledger Full Sync (Optimized Batch)',
    sourceTarget: 'Oracle EBS -> Snowflake DW',
    recordCount: 3500000,
    durationMins: 28,
    executedAt: 'Today at 04:00 AM',
    avgCpuPct: 82,
    peakCpuPct: 94,
    avgRamGb: 42.0,
    peakRamGb: 62.5,
    avgDiskIoMbSec: 68.0,
    avgThroughputRecSec: 125000,
    peakThroughputRecSec: 185000,
    status: 'Completed',
  },
];

// Synthetic 10-point execution timeline profiles
const GENERATE_TIME_SERIES = (jobAId: string, jobBId: string) => {
  const points = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]; // % completed
  const isJobA_Fast = jobAId === 'job-102' || jobAId === 'job-105';
  const isJobB_Fast = jobBId === 'job-102' || jobBId === 'job-105';

  return points.map((pct) => {
    // Generate realistic CPU curves
    const cpuA = isJobA_Fast
      ? Math.round(50 + Math.sin(pct / 15) * 35 + (pct > 20 && pct < 80 ? 12 : 0))
      : Math.round(35 + Math.sin(pct / 20) * 25 + Math.random() * 8);

    const cpuB = isJobB_Fast
      ? Math.round(55 + Math.sin(pct / 15) * 32 + (pct > 15 && pct < 85 ? 10 : 0))
      : Math.round(30 + Math.sin(pct / 22) * 20 + Math.random() * 10);

    // RAM curves
    const ramA = Math.round((cpuA * 0.45 + (pct / 100) * 15) * 10) / 10;
    const ramB = Math.round((cpuB * 0.42 + (pct / 100) * 12) * 10) / 10;

    // Throughput (Rec/sec)
    const tpA = Math.round(cpuA * 1200 + (pct > 30 && pct < 80 ? 25000 : 5000));
    const tpB = Math.round(cpuB * 1100 + (pct > 25 && pct < 75 ? 20000 : 4000));

    // Disk I/O (MB/s)
    const diskA = Math.round(cpuA * 0.65);
    const diskB = Math.round(cpuB * 0.58);

    return {
      timeLabel: `T+${Math.round((pct / 100) * 30)}m (${pct}%)`,
      'Job A CPU (%)': Math.min(99, cpuA),
      'Job B CPU (%)': Math.min(99, cpuB),
      'Job A RAM (GB)': ramA,
      'Job B RAM (GB)': ramB,
      'Job A Throughput (rec/s)': tpA,
      'Job B Throughput (rec/s)': tpB,
      'Job A Disk I/O (MB/s)': diskA,
      'Job B Disk I/O (MB/s)': diskB,
    };
  });
};

export const HistoricalPerformanceBenchmarkingPanel: React.FC = () => {
  const [selectedJobA, setSelectedJobA] = useState<HistoricalJob>(HISTORICAL_JOBS[0]);
  const [selectedJobB, setSelectedJobB] = useState<HistoricalJob>(HISTORICAL_JOBS[1]);
  const [selectedMetric, setSelectedMetric] = useState<'cpu' | 'ram' | 'throughput' | 'disk'>(
    'cpu'
  );
  const [showAnomalies, setShowAnomalies] = useState<boolean>(true);

  const jobAData = selectedJobA;
  const jobBData = selectedJobB;

  const chartData = GENERATE_TIME_SERIES(jobAData.id, jobBData.id);

  // Helper metric calculation
  const getMetricKeys = () => {
    switch (selectedMetric) {
      case 'cpu':
        return {
          keyA: 'Job A CPU (%)',
          keyB: 'Job B CPU (%)',
          unit: '%',
          title: 'CPU Utilization Profile (%)',
        };
      case 'ram':
        return {
          keyA: 'Job A RAM (GB)',
          keyB: 'Job B RAM (GB)',
          unit: ' GB',
          title: 'Memory Heap Allocation Profile (GB)',
        };
      case 'throughput':
        return {
          keyA: 'Job A Throughput (rec/s)',
          keyB: 'Job B Throughput (rec/s)',
          unit: ' rec/s',
          title: 'Record Ingestion Speed Profile (Records / Sec)',
        };
      case 'disk':
        return {
          keyA: 'Job A Disk I/O (MB/s)',
          keyB: 'Job B Disk I/O (MB/s)',
          unit: ' MB/s',
          title: 'Storage & Network Disk I/O Rate (MB/s)',
        };
    }
  };

  const metricMeta = getMetricKeys();

  // Deltas
  const durationDiffMins = jobBData.durationMins - jobAData.durationMins;
  const throughputDiffPct = Math.round(
    ((jobBData.avgThroughputRecSec - jobAData.avgThroughputRecSec) / jobAData.avgThroughputRecSec) *
      100
  );
  const cpuDiffPct = jobBData.peakCpuPct - jobAData.peakCpuPct;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Historical Migration Job Performance Benchmarking
            </h1>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold font-mono rounded-full">
              Side-by-Side Profiling
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Compare resource utilization trajectories, peak CPU/RAM saturation curves, and record ingestion throughput across any two historical migration executions to identify optimization bottlenecks.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const csvData = `Metric,${jobAData.jobName},${jobBData.jobName}\nDuration (Mins),${
                jobAData.durationMins
              },${jobBData.durationMins}\nAvg Throughput (rec/s),${
                jobAData.avgThroughputRecSec
              },${jobBData.avgThroughputRecSec}\nPeak CPU (%),${jobAData.peakCpuPct},${
                jobBData.peakCpuPct
              }`;
              const blob = new Blob([csvData], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `benchmark_comparison_${jobAData.id}_vs_${jobBData.id}.csv`;
              a.click();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Comparison CSV</span>
          </button>
        </div>
      </div>

      {/* Migration Job Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Job A Selection Card */}
        <div className="bg-indigo-950 text-white p-4 rounded-2xl border border-indigo-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-indigo-300 uppercase flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-400 border border-white" />
              Primary Baseline (Job A)
            </span>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-700">
              {jobAData.executedAt}
            </span>
          </div>

          <select
            value={selectedJobA.id}
            onChange={(e) => {
              const j = HISTORICAL_JOBS.find((item) => item.id === e.target.value);
              if (j) setSelectedJobA(j);
            }}
            className="w-full p-2.5 bg-slate-900 border border-indigo-700 text-white rounded-xl text-xs font-bold font-sans focus:outline-none focus:border-indigo-400"
          >
            {HISTORICAL_JOBS.map((job) => (
              <option key={job.id} value={job.id}>
                {job.jobName}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-indigo-900/40 p-2.5 rounded-xl border border-indigo-800/80">
            <div>
              <span className="text-[9px] text-indigo-300 uppercase block">Records</span>
              <strong className="text-white">{(jobAData.recordCount / 1000000).toFixed(2)}M</strong>
            </div>
            <div>
              <span className="text-[9px] text-indigo-300 uppercase block">Duration</span>
              <strong className="text-white">{jobAData.durationMins} Mins</strong>
            </div>
            <div>
              <span className="text-[9px] text-indigo-300 uppercase block">Avg Throughput</span>
              <strong className="text-indigo-200">
                {(jobAData.avgThroughputRecSec / 1000).toFixed(1)}k/s
              </strong>
            </div>
          </div>
        </div>

        {/* Job B Selection Card */}
        <div className="bg-emerald-950 text-white p-4 rounded-2xl border border-emerald-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 border border-white" />
              Comparative Target (Job B)
            </span>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-700">
              {jobBData.executedAt}
            </span>
          </div>

          <select
            value={selectedJobB.id}
            onChange={(e) => {
              const j = HISTORICAL_JOBS.find((item) => item.id === e.target.value);
              if (j) setSelectedJobB(j);
            }}
            className="w-full p-2.5 bg-slate-900 border border-emerald-700 text-white rounded-xl text-xs font-bold font-sans focus:outline-none focus:border-emerald-400"
          >
            {HISTORICAL_JOBS.map((job) => (
              <option key={job.id} value={job.id}>
                {job.jobName}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-emerald-900/40 p-2.5 rounded-xl border border-emerald-800/80">
            <div>
              <span className="text-[9px] text-emerald-300 uppercase block">Records</span>
              <strong className="text-white">{(jobBData.recordCount / 1000000).toFixed(2)}M</strong>
            </div>
            <div>
              <span className="text-[9px] text-emerald-300 uppercase block">Duration</span>
              <strong className="text-white">{jobBData.durationMins} Mins</strong>
            </div>
            <div>
              <span className="text-[9px] text-emerald-300 uppercase block">Avg Throughput</span>
              <strong className="text-emerald-200">
                {(jobBData.avgThroughputRecSec / 1000).toFixed(1)}k/s
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Delta KPI Comparison Scorecard Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Metric 1: Execution Time Delta */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
            Job Duration Variance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {Math.abs(durationDiffMins)}m
            </span>
            <span
              className={`text-xs font-bold flex items-center font-mono ${
                durationDiffMins <= 0 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {durationDiffMins <= 0 ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5" />
              )}
              {durationDiffMins <= 0 ? 'Faster' : 'Slower'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Job A: {jobAData.durationMins}m vs Job B: {jobBData.durationMins}m
          </p>
        </div>

        {/* Metric 2: Throughput Speedup Delta */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
            Ingestion Throughput Delta
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {throughputDiffPct > 0 ? `+${throughputDiffPct}%` : `${throughputDiffPct}%`}
            </span>
            <span
              className={`text-xs font-bold flex items-center font-mono ${
                throughputDiffPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {throughputDiffPct >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {throughputDiffPct >= 0 ? 'Speedup' : 'Regression'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Job B avg: {(jobBData.avgThroughputRecSec / 1000).toFixed(0)}k rec/s
          </p>
        </div>

        {/* Metric 3: Peak CPU Saturation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
            Peak CPU Delta
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {cpuDiffPct > 0 ? `+${cpuDiffPct}%` : `${cpuDiffPct}%`}
            </span>
            <span className="text-xs font-bold text-slate-600 font-mono">
              {jobBData.peakCpuPct}% Peak
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Job A ({jobAData.peakCpuPct}%) vs Job B ({jobBData.peakCpuPct}%)
          </p>
        </div>

        {/* Metric 4: Resource Efficiency Score */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
            Efficiency Rating
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 font-mono">
              {throughputDiffPct > 20 ? 'Optimal (A+)' : 'Standard (B)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Parallel Thread Efficiency
          </p>
        </div>
      </div>

      {/* Main Comparative Time Series Chart Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        {/* Metric Selection Sub-Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Resource Utilization Trajectory Comparison
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedMetric('cpu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMetric === 'cpu'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CPU Load (%)
            </button>
            <button
              onClick={() => setSelectedMetric('ram')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMetric === 'ram'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RAM (GB)
            </button>
            <button
              onClick={() => setSelectedMetric('throughput')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMetric === 'throughput'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ingestion (Rec/s)
            </button>
            <button
              onClick={() => setSelectedMetric('disk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMetric === 'disk'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Disk I/O (MB/s)
            </button>
          </div>
        </div>

        {/* Recharts Line Chart */}
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey={metricMeta.keyA}
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey={metricMeta.keyB}
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Anomaly & Thermal Bottleneck Summary Banner */}
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start justify-between gap-3 text-xs text-indigo-950">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-indigo-900 block">
                Automated Performance Diagnostic Analysis
              </strong>
              <p className="mt-0.5 text-indigo-800">
                {jobBData.avgThroughputRecSec > jobAData.avgThroughputRecSec
                  ? `${jobBData.jobName} achieved a ${throughputDiffPct}% higher ingestion rate due to higher worker pod concurrency and lower GC pause latency.`
                  : `${jobAData.jobName} demonstrated more consistent CPU stability without HTTP 429 rate limiting backoff.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
