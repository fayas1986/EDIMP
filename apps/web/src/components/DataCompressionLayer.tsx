import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Zap,
  Sliders,
  BarChart3,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Play,
  Layers,
  ShieldCheck,
  Sparkles,
  FileText,
  Activity,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Info,
  Check,
  ChevronRight,
  Gauge,
  Database,
  Radio,
  Minimize2,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export type CompressionAlgorithm = 'ZSTD' | 'LZ4' | 'SNAPPY' | 'BROTLI' | 'GZIP_PARALLEL';

export interface CompressionProfile {
  algorithm: CompressionAlgorithm;
  name: string;
  ratio: number; // e.g. 4.1
  compressSpeedMbps: number; // e.g. 850
  decompressSpeedMbps: number; // e.g. 2400
  cpuOverheadPct: number; // e.g. 14
  recommendedFor: string;
  description: string;
}

export const COMPRESSION_PROFILES: Record<CompressionAlgorithm, CompressionProfile> = {
  ZSTD: {
    algorithm: 'ZSTD',
    name: 'Zstandard (Zstd v1.5)',
    ratio: 4.15,
    compressSpeedMbps: 920,
    decompressSpeedMbps: 2800,
    cpuOverheadPct: 12,
    recommendedFor: '45+ TB High-Throughput Enterprise Pipelines & Lakehouses',
    description: 'Optimal balance of high compression ratio and ultra-fast decompression speed using dictionary-based streaming.',
  },
  LZ4: {
    algorithm: 'LZ4',
    name: 'LZ4 High Speed',
    ratio: 2.85,
    compressSpeedMbps: 2400,
    decompressSpeedMbps: 4900,
    cpuOverheadPct: 4,
    recommendedFor: 'Sub-millisecond Low Latency CDC Streams & Real-time Caches',
    description: 'Ultra-lightweight compression algorithm emphasizing extreme speed over maximum ratio.',
  },
  SNAPPY: {
    algorithm: 'SNAPPY',
    name: 'Snappy Framed',
    ratio: 3.10,
    compressSpeedMbps: 1800,
    decompressSpeedMbps: 3600,
    cpuOverheadPct: 6,
    recommendedFor: 'Kafka, Parquet, and Columnar Data Warehouses',
    description: 'Framed chunk compression optimized for CPU efficiency and structured block storage.',
  },
  BROTLI: {
    algorithm: 'BROTLI',
    name: 'Brotli Max Ratio',
    ratio: 5.40,
    compressSpeedMbps: 280,
    decompressSpeedMbps: 1200,
    cpuOverheadPct: 32,
    recommendedFor: 'Cold Storage Archiving & Wide-Area Network (WAN) Egress',
    description: 'Maximum density payload compression for bandwidth-constrained cross-region network links.',
  },
  GZIP_PARALLEL: {
    algorithm: 'GZIP_PARALLEL',
    name: 'Parallel Pigz / Gzip',
    ratio: 3.75,
    compressSpeedMbps: 650,
    decompressSpeedMbps: 1600,
    cpuOverheadPct: 18,
    recommendedFor: 'Legacy REST APIs, Webhooks, and Standard Blob Stores',
    description: 'Multi-threaded block Gzip compression designed for universal system compatibility.',
  },
};

interface DataCompressionLayerProps {
  uncompressedTotalTb?: number;
  globalRps?: number;
  onApplyProfileToEngine?: (algorithm: CompressionAlgorithm, ratio: number) => void;
}

export const DataCompressionLayer: React.FC<DataCompressionLayerProps> = ({
  uncompressedTotalTb = 48.6,
  globalRps = 14500,
  onApplyProfileToEngine,
}) => {
  const [selectedAlgo, setSelectedAlgo] = useState<CompressionAlgorithm>('ZSTD');
  const [compressionLevel, setCompressionLevel] = useState<number>(12); // 1 - 22 for Zstd
  const [enableDictionaryMode, setEnableDictionaryMode] = useState<boolean>(true);
  const [enableDeduplication, setEnableDeduplication] = useState<boolean>(true);
  const [blockSizeKb, setBlockSizeKb] = useState<number>(512); // 64, 128, 512, 1024 KB
  const [parallelThreads, setParallelThreads] = useState<number>(32);

  // Live Benchmark Simulator state
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<{
    originalMb: number;
    compressedMb: number;
    durationMs: number;
    ratio: string;
    savedPct: string;
  } | null>(null);

  // Active Profile details
  const activeProfile = COMPRESSION_PROFILES[selectedAlgo];

  // Payload Size Analysis Chart State
  const [chartMetricView, setChartMetricView] = useState<'volume' | 'throughput' | 'ratio'>('volume');
  const [chartTimeWindow, setChartTimeWindow] = useState<'24h' | '7d' | '45tb_stream'>('45tb_stream');

  // Dynamic calculations for 45+ TB dataset
  const effectiveRatio = enableDictionaryMode ? activeProfile.ratio * 1.18 : activeProfile.ratio;
  const compressedTb = uncompressedTotalTb / effectiveRatio;
  const savedTb = uncompressedTotalTb - compressedTb;
  const savedPercent = ((savedTb / uncompressedTotalTb) * 100).toFixed(1);

  // Time-series dataset generation for Payload Size Analysis over time
  const timeSeriesData = useMemo(() => {
    const rawVolumes24h = [3.2, 3.8, 4.1, 4.6, 4.9, 5.2, 4.8, 4.4, 3.9, 3.5, 3.1, 3.1]; // sum ~ 48.6 TB
    const timestamps24h = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

    const timestamps7d = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    const rawVolumes7d = [6.8, 7.2, 8.1, 7.9, 8.5, 9.2, 7.4]; // 55.1 TB

    const timestamps45tb = ['Chunk 01-05 TB', 'Chunk 06-10 TB', 'Chunk 11-15 TB', 'Chunk 16-20 TB', 'Chunk 21-25 TB', 'Chunk 26-30 TB', 'Chunk 31-35 TB', 'Chunk 36-40 TB', 'Chunk 41-45+ TB'];
    const rawVolumes45tb = [5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 8.6];

    let timestamps = timestamps24h;
    let rawVolumes = rawVolumes24h;

    if (chartTimeWindow === '7d') {
      timestamps = timestamps7d;
      rawVolumes = rawVolumes7d;
    } else if (chartTimeWindow === '45tb_stream') {
      timestamps = timestamps45tb;
      rawVolumes = rawVolumes45tb;
    }

    const dedupMultiplier = enableDeduplication ? 1.08 : 1.0;
    const finalRatio = effectiveRatio * dedupMultiplier;

    return timestamps.map((time, idx) => {
      const rawTb = rawVolumes[idx];
      const jitter = (idx % 3 === 0 ? 0.05 : idx % 2 === 0 ? -0.04 : 0.02);
      const pointRatio = Math.max(1.5, parseFloat((finalRatio + jitter).toFixed(2)));
      const compressedTbVal = parseFloat((rawTb / pointRatio).toFixed(2));
      const savedTbVal = parseFloat((rawTb - compressedTbVal).toFixed(2));
      const wireSpeedMbps = Math.round(350 + idx * 22 + ((idx * 17) % 30));
      const effectiveSpeedMbps = Math.round(wireSpeedMbps * pointRatio);

      return {
        timestamp: time,
        rawTb,
        compressedTb: compressedTbVal,
        savedTb: savedTbVal,
        ratio: pointRatio,
        wireSpeedMbps,
        effectiveSpeedMbps,
        savedPct: Math.round(((rawTb - compressedTbVal) / rawTb) * 100),
      };
    });
  }, [effectiveRatio, chartTimeWindow, enableDeduplication]);

  // Throughput boost calculations
  const rawMbps = (globalRps * 0.0026).toFixed(1); // approx MB/s
  const effectiveThroughputMbps = (parseFloat(rawMbps) * effectiveRatio).toFixed(1);

  const handleRunBenchmark = () => {
    setIsBenchmarking(true);
    setBenchmarkResult(null);

    setTimeout(() => {
      const originalMb = 1024; // 1 GB test payload
      const compressedMb = Math.round(originalMb / effectiveRatio);
      const durationMs = Math.round((originalMb / activeProfile.compressSpeedMbps) * 1000 + Math.random() * 45);
      const ratioStr = effectiveRatio.toFixed(2) + 'x';
      const savedPctStr = (((originalMb - compressedMb) / originalMb) * 100).toFixed(1) + '%';

      setBenchmarkResult({
        originalMb,
        compressedMb,
        durationMs,
        ratio: ratioStr,
        savedPct: savedPctStr,
      });

      setIsBenchmarking(false);

      if (onApplyProfileToEngine) {
        onApplyProfileToEngine(selectedAlgo, effectiveRatio);
      }
    }, 1200);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 shrink-0">
            <Minimize2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                In-Flight Payload Compression Layer
              </h2>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full border border-emerald-200 uppercase tracking-wider">
                45+ TB Pipeline Accelerator
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Reduces network wire payload sizes before egress transmission, boosting effective pipeline throughput up to 5.4x.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={isBenchmarking}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} />
          <span>{isBenchmarking ? 'Compressing 1 GB Batch Sample...' : 'Run Live Benchmark'}</span>
        </button>
      </div>

      {/* TOP COMPRESSION METRICS DISPLAY FOR 45+ TB DATASETS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Uncompressed vs Wire Size */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-emerald-200 transition-colors">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Payload Size Reduction</span>
            <span className="text-emerald-600 font-bold">{savedPercent}% Saved</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono flex items-baseline gap-1.5">
            <span className="text-slate-400 text-sm line-through">{uncompressedTotalTb.toFixed(1)} TB</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-emerald-600 text-2xl">{compressedTb.toFixed(1)} TB</span>
          </div>
          <div className="text-[10px] text-slate-500">
            Saved <strong className="text-slate-800">{savedTb.toFixed(1)} TB</strong> of network egress transfer
          </div>
        </div>

        {/* Metric 2: Compression Ratio */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-indigo-200 transition-colors">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Effective Compression Ratio</span>
            <span className="text-indigo-600 font-bold">Active</span>
          </div>
          <div className="text-2xl font-black text-indigo-600 font-mono">
            {effectiveRatio.toFixed(2)}x
          </div>
          <div className="text-[10px] text-slate-500">
            Algorithm: <strong className="text-slate-800">{activeProfile.name}</strong>
          </div>
        </div>

        {/* Metric 3: Wire vs Effective Throughput */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-amber-200 transition-colors">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Effective Throughput</span>
            <span className="text-amber-600 font-bold">Boosted</span>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {effectiveThroughputMbps} <span className="text-xs font-normal text-slate-500">MB/s</span>
          </div>
          <div className="text-[10px] text-slate-500">
            Wire Bandwidth Used: <strong className="text-slate-800">{rawMbps} MB/s</strong>
          </div>
        </div>

        {/* Metric 4: CPU Budget Utilization */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-slate-300 transition-colors">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Worker CPU Overhead</span>
            <span className="text-slate-500 font-mono">32 Worker Threads</span>
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {activeProfile.cpuOverheadPct}%
          </div>
          <div className="text-[10px] text-slate-500">
            Chunk Decompression: <strong className="text-slate-800">{activeProfile.decompressSpeedMbps} MB/s</strong>
          </div>
        </div>
      </div>

      {/* BENCHMARK RESULT MODAL / TOAST */}
      {benchmarkResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-slate-900 space-y-2 animate-fadeIn shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase font-mono text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Compression Benchmark Test Complete (1 GB Sample Payload)</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              Duration: {benchmarkResult.durationMs} ms
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
            <div>Original Size: <strong className="text-slate-800">{benchmarkResult.originalMb} MB</strong></div>
            <div>Compressed Size: <strong className="text-emerald-700">{benchmarkResult.compressedMb} MB</strong></div>
            <div>Compression Ratio: <strong className="text-indigo-700">{benchmarkResult.ratio}</strong></div>
            <div>Payload Reduction: <strong className="text-amber-700">{benchmarkResult.savedPct}</strong></div>
          </div>
        </div>
      )}

      {/* PAYLOAD SIZE ANALYSIS CHART SECTION */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-mono">
                Payload Size Analysis & Telemetry
              </h3>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded border border-indigo-200">
                Codec: {activeProfile.name} ({effectiveRatio.toFixed(2)}x)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical visualization of raw vs. compressed bandwidth consumption across the 45+ TB data transfer timeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-mono font-bold">
              <button
                onClick={() => setChartMetricView('volume')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMetricView === 'volume'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Volume (TB)
              </button>
              <button
                onClick={() => setChartMetricView('throughput')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMetricView === 'throughput'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Throughput (MB/s)
              </button>
              <button
                onClick={() => setChartMetricView('ratio')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMetricView === 'ratio'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ratio (x)
              </button>
            </div>

            {/* Time Window Switcher */}
            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-mono">
              <button
                onClick={() => setChartTimeWindow('45tb_stream')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  chartTimeWindow === '45tb_stream'
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                45+ TB Job
              </button>
              <button
                onClick={() => setChartTimeWindow('24h')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  chartTimeWindow === '24h'
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                24 Hours
              </button>
              <button
                onClick={() => setChartTimeWindow('7d')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  chartTimeWindow === '7d'
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                7 Days
              </button>
            </div>
          </div>
        </div>

        {/* RECHARTS VISUALIZER */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartMetricView === 'volume' ? (
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRaw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCompressed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" TB" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 text-slate-900 text-xs p-3 rounded-xl shadow-lg space-y-1.5 font-mono">
                          <div className="font-bold border-b border-slate-100 pb-1 text-slate-800 flex justify-between gap-4">
                            <span>{label}</span>
                            <span className="text-emerald-600 font-extrabold">{data.savedPct}% Compressed</span>
                          </div>
                          <div className="text-slate-600 flex justify-between gap-4">
                            <span>Raw Uncompressed:</span>
                            <strong className="text-indigo-600">{data.rawTb} TB</strong>
                          </div>
                          <div className="text-slate-600 flex justify-between gap-4">
                            <span>Compressed Wire Size:</span>
                            <strong className="text-emerald-600">{data.compressedTb} TB</strong>
                          </div>
                          <div className="text-slate-600 flex justify-between gap-4 border-t border-slate-100 pt-1">
                            <span>Bandwidth Saved:</span>
                            <strong className="text-amber-600">{data.savedTb} TB</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="rawTb"
                  name="Uncompressed Raw Volume (TB)"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorRaw)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="compressedTb"
                  name="Compressed Wire Volume (TB)"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorCompressed)"
                  strokeWidth={2}
                />
              </AreaChart>
            ) : chartMetricView === 'throughput' ? (
              <RechartsBarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" MB/s" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 text-slate-900 text-xs p-3 rounded-xl shadow-lg space-y-1 font-mono">
                          <div className="font-bold border-b border-slate-100 pb-1 text-amber-600">{label}</div>
                          <div className="text-slate-600">Wire Speed: <strong className="text-slate-900">{data.wireSpeedMbps} MB/s</strong></div>
                          <div className="text-slate-600">Virtual Effective Speed: <strong className="text-emerald-600">{data.effectiveSpeedMbps} MB/s</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="wireSpeedMbps" name="Wire Speed (MB/s)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="effectiveSpeedMbps" name="Effective Speed (MB/s)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            ) : (
              <RechartsLineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="x" domain={[1, 7]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 text-slate-900 text-xs p-3 rounded-xl shadow-lg space-y-1 font-mono">
                          <div className="font-bold border-b border-slate-100 pb-1 text-emerald-600">{label}</div>
                          <div className="text-slate-600">Compression Ratio: <strong className="text-amber-600">{data.ratio}x</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="ratio"
                  name="Compression Ratio Curve (x)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </RechartsLineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* SUMMARY TELEMETRY STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            <span>Peak Load: <strong className="text-slate-900">5.2 TB/chunk</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Compressed Wire: <strong className="text-emerald-600">1.25 TB/chunk</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>Net Bandwidth Saved: <strong className="text-amber-600">{savedTb.toFixed(1)} TB</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 justify-end">
            <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
            <span>Speedup: <strong className="text-indigo-600">{effectiveRatio.toFixed(2)}x</strong></span>
          </div>
        </div>
      </div>

      {/* ALGORITHM SELECTOR MATRIX */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Select Compression Engine Codec for 45+ TB Datasets</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.keys(COMPRESSION_PROFILES) as CompressionAlgorithm[]).map((algoKey) => {
            const profile = COMPRESSION_PROFILES[algoKey];
            const isSelected = selectedAlgo === algoKey;

            return (
              <div
                key={algoKey}
                onClick={() => setSelectedAlgo(algoKey)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-500 shadow-xs ring-1 ring-indigo-500/40'
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>{profile.name}</span>
                    {isSelected && (
                      <span className="p-1 bg-indigo-600 text-white rounded-full">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                    {profile.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ratio:</span>
                    <strong className="text-indigo-600">{profile.ratio}x</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Speed:</span>
                    <strong className="text-emerald-600">{profile.compressSpeedMbps} MB/s</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CPU Overhead:</span>
                    <strong className="text-slate-700">{profile.cpuOverheadPct}%</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADVANCED CONFIGURATION & DICTIONARY OPTIMIZATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Panel 1: Tuning Controls */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase font-mono flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-indigo-600" />
              <span>Compression Level & Block Tuning</span>
            </h4>
            <span className="text-[10px] font-mono text-indigo-600 font-bold">
              {activeProfile.name}
            </span>
          </div>

          {/* Compression Level Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Compression Level (Effort):</span>
              <strong className="font-mono text-indigo-600">{compressionLevel} (High Density)</strong>
            </div>
            <input
              type="range"
              min="1"
              max="22"
              value={compressionLevel}
              onChange={(e) => setCompressionLevel(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Level 1 (Fastest)</span>
              <span>Level 12 (Balanced)</span>
              <span>Level 22 (Max Ultra)</span>
            </div>
          </div>

          {/* Block Size Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-600 block">Stream Chunk Block Size:</label>
            <div className="grid grid-cols-4 gap-2 text-xs font-mono">
              {[64, 128, 512, 1024].map((size) => (
                <button
                  key={size}
                  onClick={() => setBlockSizeKb(size)}
                  className={`py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                    blockSizeKb === size
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {size} KB
                </button>
              ))}
            </div>
          </div>

          {/* Parallel Worker Thread Count */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Parallel Compression Worker Threads:</span>
              <strong className="font-mono text-emerald-600">{parallelThreads} Threads</strong>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-mono">
              {[8, 16, 32, 64].map((threads) => (
                <button
                  key={threads}
                  onClick={() => setParallelThreads(threads)}
                  className={`py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                    parallelThreads === threads
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {threads} Workers
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 2: Big Data 45+ TB Dictionary & Deduplication */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>45+ TB Pre-Transfer Dictionary Training</span>
            </h4>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">+18% Ratio Boost</span>
          </div>

          {/* Feature Toggle 1: Pre-trained Dictionary */}
          <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="space-y-0.5">
              <strong className="text-xs font-bold text-slate-900 block">
                Zstd Record Schema Dictionary
              </strong>
              <p className="text-[11px] text-slate-500">
                Pre-trains 64KB dictionary buffers on customer, ledger, and JSON record schemas to strip redundant field keys.
              </p>
            </div>
            <button
              onClick={() => setEnableDictionaryMode(!enableDictionaryMode)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                enableDictionaryMode ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  enableDictionaryMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Feature Toggle 2: Deduplication Engine */}
          <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="space-y-0.5">
              <strong className="text-xs font-bold text-slate-900 block">
                In-Memory Chunk Deduplication
              </strong>
              <p className="text-[11px] text-slate-500">
                SHA-256 block fingerprints detect and filter identical payload chunks across 45+ TB data streams before network socket write.
              </p>
            </div>
            <button
              onClick={() => setEnableDeduplication(!enableDeduplication)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                enableDeduplication ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  enableDeduplication ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 text-xs text-indigo-950 font-mono space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>45+ TB Petabyte Pipeline Impact Summary</span>
            </div>
            <p className="text-[11px] leading-relaxed text-indigo-900">
              Applying <strong>{activeProfile.name}</strong> with dictionary training compresses a 48.6 TB data transfer down to <strong>{compressedTb.toFixed(1)} TB</strong>, reducing total network transit time from ~14 hours to <strong>~3.2 hours</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
