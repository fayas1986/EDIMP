import React, { useState } from 'react';
import { Connector, ConnectorBenchmarkResult, BenchmarkScenario } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Gauge,
  Play,
  RotateCcw,
  Zap,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Download,
  Flame,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Server,
  ShieldAlert,
} from 'lucide-react';

interface ConnectorBenchmarkPanelProps {
  connectors: Connector[];
}

const DEFAULT_SCENARIOS: BenchmarkScenario[] = [
  {
    id: 'scen-light',
    name: 'Light Baseline Load',
    type: 'Light Baseline',
    concurrency: 10,
    targetRps: 100,
    batchSizeRecords: 1000,
    payloadSizeKb: 64,
    durationSeconds: 15,
  },
  {
    id: 'scen-medium',
    name: 'Medium Peak Batch Load',
    type: 'Medium Peak',
    concurrency: 50,
    targetRps: 500,
    batchSizeRecords: 5000,
    payloadSizeKb: 256,
    durationSeconds: 30,
  },
  {
    id: 'scen-heavy',
    name: 'Heavy Migration Stress Test',
    type: 'Heavy Migration Stress',
    concurrency: 200,
    targetRps: 2000,
    batchSizeRecords: 25000,
    payloadSizeKb: 1024,
    durationSeconds: 60,
  },
];

const MOCK_INITIAL_BENCHMARKS: ConnectorBenchmarkResult[] = [
  {
    id: 'bm-1',
    connectorId: 'conn-1',
    connectorName: 'SAP S/4HANA Finance ERP',
    scenarioName: 'Medium Peak Batch Load',
    timestamp: 'Today at 04:30 PM',
    avgLatencyMs: 22,
    p50LatencyMs: 18,
    p95LatencyMs: 38,
    p99LatencyMs: 54,
    achievedRps: 485,
    achievedThroughputRecordsSec: 12400,
    dataThroughputMbSec: 14.8,
    successRatePercent: 99.8,
    throttling429Count: 2,
    grade: 'A+',
  },
  {
    id: 'bm-2',
    connectorId: 'conn-2',
    connectorName: 'Dynamics 365 CE (CRM)',
    scenarioName: 'Medium Peak Batch Load',
    timestamp: 'Today at 04:30 PM',
    avgLatencyMs: 46,
    p50LatencyMs: 38,
    p95LatencyMs: 82,
    p99LatencyMs: 120,
    achievedRps: 380,
    achievedThroughputRecordsSec: 8900,
    dataThroughputMbSec: 9.6,
    successRatePercent: 98.4,
    throttling429Count: 14,
    grade: 'A',
  },
  {
    id: 'bm-3',
    connectorId: 'conn-3',
    connectorName: 'Azure SQL Staging Database',
    scenarioName: 'Medium Peak Batch Load',
    timestamp: 'Today at 04:30 PM',
    avgLatencyMs: 11,
    p50LatencyMs: 8,
    p95LatencyMs: 19,
    p99LatencyMs: 28,
    achievedRps: 1820,
    achievedThroughputRecordsSec: 48000,
    dataThroughputMbSec: 42.5,
    successRatePercent: 100.0,
    throttling429Count: 0,
    grade: 'A+',
  },
  {
    id: 'bm-4',
    connectorId: 'conn-4',
    connectorName: 'Salesforce Sales Cloud',
    scenarioName: 'Medium Peak Batch Load',
    timestamp: 'Today at 04:30 PM',
    avgLatencyMs: 68,
    p50LatencyMs: 52,
    p95LatencyMs: 140,
    p99LatencyMs: 210,
    achievedRps: 240,
    achievedThroughputRecordsSec: 4200,
    dataThroughputMbSec: 5.2,
    successRatePercent: 96.2,
    throttling429Count: 38,
    grade: 'B',
  },
];

export const ConnectorBenchmarkPanel: React.FC<ConnectorBenchmarkPanelProps> = ({
  connectors,
}) => {
  const [scenarios] = useState<BenchmarkScenario[]>(DEFAULT_SCENARIOS);
  const [selectedScenario, setSelectedScenario] = useState<BenchmarkScenario>(DEFAULT_SCENARIOS[1]);
  const [benchmarkResults, setBenchmarkResults] =
    useState<ConnectorBenchmarkResult[]>(MOCK_INITIAL_BENCHMARKS);

  // Custom Scenario Controls
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customConcurrency, setCustomConcurrency] = useState<number>(100);
  const [customTargetRps, setCustomTargetRps] = useState<number>(1000);
  const [customPayloadKb, setCustomPayloadKb] = useState<number>(512);

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [activeTestMessage, setActiveTestMessage] = useState<string>('');
  const [selectedConnectorFilter, setSelectedConnectorFilter] = useState<string>('All');

  const handleRunBenchmark = () => {
    setIsRunning(true);
    setProgressPercent(0);
    setActiveTestMessage('Initializing HTTP/gRPC connection pools...');

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgressPercent(currentProgress);

      if (currentProgress === 20) {
        setActiveTestMessage('Ramping up concurrent threads & payload generation...');
      } else if (currentProgress === 50) {
        setActiveTestMessage('Injecting peak traffic & monitoring p95/p99 latency histogram...');
      } else if (currentProgress === 80) {
        setActiveTestMessage('Measuring HTTP 429 throttling backoff and TCP socket saturation...');
      } else if (currentProgress >= 100) {
        clearInterval(interval);
        setIsRunning(false);
        setActiveTestMessage('');

        // Generate updated realistic synthetic results based on scenario
        const mult = isCustomMode
          ? customTargetRps / 500
          : selectedScenario.targetRps / 500;

        const updated = connectors.map((c, idx) => {
          const baseLat = (idx + 1) * 15 + Math.floor(Math.random() * 8);
          const achievedRps = Math.min(
            Math.round(450 * mult * (1 - idx * 0.12) + (Math.random() * 30 - 15)),
            c.throttlingConfig?.maxRequestsPerSecond || 2500
          );
          const throttling429 = achievedRps > 400 ? Math.floor(Math.random() * 12) : 0;

          return {
            id: `bm-${Date.now()}-${idx}`,
            connectorId: c.id,
            connectorName: c.name,
            scenarioName: isCustomMode ? 'Custom Synthetic Load' : selectedScenario.name,
            timestamp: 'Just now',
            avgLatencyMs: Math.round(baseLat * (1 + (mult - 1) * 0.2)),
            p50LatencyMs: Math.round(baseLat * 0.8),
            p95LatencyMs: Math.round(baseLat * 1.8),
            p99LatencyMs: Math.round(baseLat * 2.6),
            achievedRps,
            achievedThroughputRecordsSec: achievedRps * 25,
            dataThroughputMbSec: Number((achievedRps * 0.03).toFixed(1)),
            successRatePercent: throttling429 > 10 ? 97.5 : 99.9,
            throttling429Count: throttling429,
            grade: throttling429 > 10 ? 'B' : achievedRps > 1000 ? 'A+' : 'A',
          } as ConnectorBenchmarkResult;
        });

        setBenchmarkResults(updated);
      }
    }, 300);
  };

  const chartData = benchmarkResults.map((b) => ({
    name: b.connectorName.split(' ')[0] + ' ' + (b.connectorName.split(' ')[1] || ''),
    'Avg Latency (ms)': b.avgLatencyMs,
    'p95 Latency (ms)': b.p95LatencyMs,
    'p99 Latency (ms)': b.p99LatencyMs,
    'Throughput (Req/sec)': b.achievedRps,
    'Throughput (x100 Rec/s)': Math.round(b.achievedThroughputRecordsSec / 100),
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Gauge className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              API & Connector Performance Benchmarking Studio
            </h1>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold font-mono rounded-full">
              Load Testing Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Simulate realistic peak migration traffic, record throughput (RPS & records/sec), measure p50/p95/p99 latencies, and detect connector throttling limits before execution.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running Benchmark...' : 'Run Benchmark Test'}</span>
          </button>
        </div>
      </div>

      {/* Load Scenario Preset Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            1. Select Load Testing Scenario
          </h2>

          <button
            onClick={() => setIsCustomMode(!isCustomMode)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-1"
          >
            {isCustomMode ? 'Use Preset Load Scenarios' : 'Switch to Custom Load Parameters'}
          </button>
        </div>

        {!isCustomMode ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarios.map((scen) => {
              const isSelected = selectedScenario.id === scen.id;
              return (
                <div
                  key={scen.id}
                  onClick={() => setSelectedScenario(scen)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{scen.name}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                        scen.type === 'Light Baseline'
                          ? 'bg-emerald-100 text-emerald-800'
                          : scen.type === 'Medium Peak'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {scen.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-3 bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Concurrency</span>
                      <span className="font-bold text-slate-800">{scen.concurrency} Threads</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Target RPS</span>
                      <span className="font-bold text-indigo-700">{scen.targetRps} req/s</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Batch Size</span>
                      <span className="font-bold text-slate-800">{scen.batchSizeRecords.toLocaleString()} Recs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Payload</span>
                      <span className="font-bold text-slate-800">{scen.payloadSizeKb} KB/req</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900">Custom Synthetic Load Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Concurrent Worker Threads ({customConcurrency})
                </label>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={customConcurrency}
                  onChange={(e) => setCustomConcurrency(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Requests/Sec ({customTargetRps} RPS)
                </label>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={customTargetRps}
                  onChange={(e) => setCustomTargetRps(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Payload Buffer Size ({customPayloadKb} KB)
                </label>
                <input
                  type="range"
                  min="32"
                  max="2048"
                  step="32"
                  value={customPayloadKb}
                  onChange={(e) => setCustomPayloadKb(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Animation during Live Test */}
      {isRunning && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-400 flex items-center gap-2">
              <Activity className="w-4 h-4 animate-spin text-indigo-400" />
              {activeTestMessage}
            </span>
            <span className="font-mono text-indigo-300 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Comparative Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Throughput Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Connector Throughput Comparison (RPS & Records/sec)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Higher is Better</span>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
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
                <Bar dataKey="Throughput (Req/sec)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Throughput (x100 Rec/s)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Latency Percentiles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Latency Distribution (Avg vs. p95 vs. p99 in ms)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Lower is Better</span>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
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
                <Line type="monotone" dataKey="Avg Latency (ms)" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="p95 Latency (ms)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="p99 Latency (ms)" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Benchmark Matrix Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Recorded Benchmark Scorecards</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive latency percentiles, payload bandwidth, and throttling error resilience.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">
              Scenario: <strong className="text-slate-900">{isCustomMode ? 'Custom' : selectedScenario.name}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2.5 px-3">Connector Name</th>
                <th className="py-2.5 px-3">Avg Latency</th>
                <th className="py-2.5 px-3">p95 / p99 Latency</th>
                <th className="py-2.5 px-3">Achieved RPS</th>
                <th className="py-2.5 px-3">Record Throughput</th>
                <th className="py-2.5 px-3">Bandwidth</th>
                <th className="py-2.5 px-3">429 Throttles</th>
                <th className="py-2.5 px-3 text-center">Score Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {benchmarkResults.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 font-sans">{res.connectorName}</td>
                  <td className="py-3 px-3 text-slate-800 font-bold">{res.avgLatencyMs} ms</td>
                  <td className="py-3 px-3 text-slate-600">
                    <span className="text-amber-700 font-semibold">{res.p95LatencyMs}ms</span> /{' '}
                    <span className="text-rose-700 font-semibold">{res.p99LatencyMs}ms</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-indigo-700">{res.achievedRps} req/s</td>
                  <td className="py-3 px-3 text-emerald-700 font-bold">
                    {res.achievedThroughputRecordsSec.toLocaleString()} rec/s
                  </td>
                  <td className="py-3 px-3 text-slate-700">{res.dataThroughputMbSec} MB/s</td>
                  <td className="py-3 px-3">
                    {res.throttling429Count > 0 ? (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-semibold border border-amber-200 text-[10px]">
                        {res.throttling429Count} events
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold text-[10px]">Zero</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono ${
                        res.grade === 'A+'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : res.grade === 'A'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {res.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
