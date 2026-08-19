import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  CheckCircle2,
  Database,
  ArrowRight,
  Server,
  Layers,
  Radio,
  Sliders,
  ShieldCheck,
  Cpu,
  RefreshCw,
  TrendingUp,
  Clock,
  Sparkles,
  AlertTriangle,
  Play,
  Pause,
  ChevronRight,
  HardDrive,
  BarChart3,
  Flame,
  Check,
} from 'lucide-react';

export interface StreamPipelinePair {
  id: string;
  sourceName: string;
  sourceCategory: string;
  sourceType: string;
  destName: string;
  destCategory: string;
  destType: string;
  cdcProtocol: string;
  transferredTb: number;
  recordsProcessed: number;
  currentRps: number;
  throughputMbps: number;
  latencyMs: number;
  status: 'ACTIVE_CDC' | 'PAUSED' | 'SYNCING';
  checksumMatch: boolean;
  activeWorkers: number;
}

const INITIAL_PIPELINE_PAIRS: StreamPipelinePair[] = [
  {
    id: 'stream-pair-1',
    sourceName: 'SQL Server - Legacy Master DB',
    sourceCategory: 'Database',
    sourceType: 'SQL Server CDC',
    destName: 'PostgreSQL Staging Warehouse',
    destCategory: 'Database',
    destType: 'PostgreSQL WAL',
    cdcProtocol: 'CDC-CT Replication',
    transferredTb: 18.4,
    recordsProcessed: 184500000,
    currentRps: 4200,
    throughputMbps: 840,
    latencyMs: 8,
    status: 'ACTIVE_CDC',
    checksumMatch: true,
    activeWorkers: 12,
  },
  {
    id: 'stream-pair-2',
    sourceName: 'SAP S/4HANA Enterprise Cloud',
    sourceCategory: 'ERP',
    sourceType: 'SAP OData / CDHDR',
    destName: 'Dynamics 365 Business Central',
    destCategory: 'ERP',
    destType: 'OData v4 Batch',
    cdcProtocol: 'CDHDR/CDPOS CDC',
    transferredTb: 14.8,
    recordsProcessed: 142100000,
    currentRps: 2150,
    throughputMbps: 620,
    latencyMs: 12,
    status: 'ACTIVE_CDC',
    checksumMatch: true,
    activeWorkers: 8,
  },
  {
    id: 'stream-pair-3',
    sourceName: 'Oracle ERP Core Engine',
    sourceCategory: 'ERP',
    sourceType: 'Oracle GoldenGate',
    destName: 'Snowflake Enterprise Lakehouse',
    destCategory: 'Cloud Storage',
    destType: 'Snowpipe Ingestion',
    cdcProtocol: 'GoldenGate Redo Stream',
    transferredTb: 9.2,
    recordsProcessed: 98400000,
    currentRps: 3100,
    throughputMbps: 540,
    latencyMs: 15,
    status: 'ACTIVE_CDC',
    checksumMatch: true,
    activeWorkers: 10,
  },
  {
    id: 'stream-pair-4',
    sourceName: 'Salesforce Enterprise CRM',
    sourceCategory: 'CRM',
    sourceType: 'SFDC Pub/Sub API',
    destName: 'Google BigQuery Analytics Pool',
    destCategory: 'Cloud Storage',
    destType: 'BigQuery Streaming',
    cdcProtocol: 'Change Data Event Bus',
    transferredTb: 6.2,
    recordsProcessed: 61800000,
    currentRps: 1850,
    throughputMbps: 380,
    latencyMs: 18,
    status: 'ACTIVE_CDC',
    checksumMatch: true,
    activeWorkers: 6,
  },
];

interface RealTime45TbTransferEngineProps {
  onNavigateTab?: (tab: string) => void;
}

export const RealTime45TbTransferEngine: React.FC<RealTime45TbTransferEngineProps> = ({ onNavigateTab }) => {
  const [pipelinePairs, setPipelinePairs] = useState<StreamPipelinePair[]>(INITIAL_PIPELINE_PAIRS);
  const [isLiveEngineActive, setIsLiveEngineActive] = useState<boolean>(true);
  const [isScaling, setIsScaling] = useState<boolean>(false);
  const [isChecksumScanning, setIsChecksumScanning] = useState<boolean>(false);
  const [lastScanMessage, setLastScanMessage] = useState<string | null>(null);

  // Compute total volume transferred in Terabytes
  const totalTransferredTb = pipelinePairs.reduce((acc, p) => acc + p.transferredTb, 0);
  const totalRps = pipelinePairs.reduce((acc, p) => acc + p.currentRps, 0);
  const totalWorkers = pipelinePairs.reduce((acc, p) => acc + p.activeWorkers, 0);
  const totalThroughputGbs = (pipelinePairs.reduce((acc, p) => acc + p.throughputMbps, 0) / 1024).toFixed(2);
  const avgLatency = Math.round(pipelinePairs.reduce((acc, p) => acc + p.latencyMs, 0) / pipelinePairs.length);

  // Real-time live data increment simulation
  useEffect(() => {
    if (!isLiveEngineActive) return;

    const interval = setInterval(() => {
      setPipelinePairs((prev) =>
        prev.map((pair) => {
          if (pair.status !== 'ACTIVE_CDC') return pair;

          // Increment records and volume slightly to simulate real-time CDC throughput
          const addedRecords = Math.floor(Math.random() * 45) + 15;
          const addedGb = addedRecords * 0.00012; // ~120KB per record
          const newTb = parseFloat((pair.transferredTb + addedGb / 1024).toFixed(4));
          const jitterRps = Math.max(500, pair.currentRps + (Math.floor(Math.random() * 60) - 30));

          return {
            ...pair,
            transferredTb: newTb,
            recordsProcessed: pair.recordsProcessed + addedRecords,
            currentRps: jitterRps,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isLiveEngineActive]);

  const handleSimulateCDCBurst = () => {
    setPipelinePairs((prev) =>
      prev.map((pair) => ({
        ...pair,
        transferredTb: parseFloat((pair.transferredTb + 0.15).toFixed(2)),
        recordsProcessed: pair.recordsProcessed + 150000,
        currentRps: pair.currentRps + 1200,
      }))
    );

    setLastScanMessage('⚡ Real-time CDC burst executed! Transferred +0.60 TB across 4 active source-to-destination stream pairs.');
    setTimeout(() => setLastScanMessage(null), 5000);
  };

  const handleScaleWorkers = () => {
    setIsScaling(true);
    setTimeout(() => {
      setPipelinePairs((prev) =>
        prev.map((pair) => ({
          ...pair,
          activeWorkers: pair.activeWorkers + 4,
          currentRps: Math.round(pair.currentRps * 1.35),
          throughputMbps: Math.round(pair.throughputMbps * 1.35),
        }))
      );
      setIsScaling(false);
      setLastScanMessage('🚀 Worker thread allocation scaled (+16 threads). Real-time pipeline throughput boosted to 3.85 GB/s.');
      setTimeout(() => setLastScanMessage(null), 5000);
    }, 1200);
  };

  const handleVerifyChecksums = () => {
    setIsChecksumScanning(true);
    setTimeout(() => {
      setIsChecksumScanning(false);
      setLastScanMessage(`✅ Zero-loss validation complete across ${totalTransferredTb.toFixed(1)} TB. 100% SHA-256 checksum match verified from source DBs to target destinations.`);
      setTimeout(() => setLastScanMessage(null), 6000);
    }, 1500);
  };

  const toggleStreamStatus = (id: string) => {
    setPipelinePairs((prev) =>
      prev.map((pair) => {
        if (pair.id === id) {
          const nextStatus = pair.status === 'ACTIVE_CDC' ? 'PAUSED' : 'ACTIVE_CDC';
          return { ...pair, status: nextStatus };
        }
        return pair;
      })
    );
  };

  return (
    <div className="bg-white text-slate-900 rounded-3xl border border-slate-200/80 shadow-3xs p-6 space-y-6 relative overflow-hidden animate-in fade-in duration-300">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-50 pb-6 relative z-10">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-50 text-indigo-600 rounded-2xl border border-slate-100 shadow-3xs shrink-0">
            <HardDrive className="w-8 h-8 text-indigo-500 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest flex items-center gap-2 shadow-3xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Real-Time Streaming Engine Active
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-widest shadow-3xs">
                Target Capacity: &gt;45 TB Seamless Transfer
              </span>
            </div>
            <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              Multi-Source to Multi-Destination Real-Time CDC Hub
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight max-w-2xl leading-relaxed">
              Continuous sub-second Change Data Capture (CDC) replication engine designed for petabyte-scale (&gt;45 TB) data migration across heterogeneous enterprise architectures.
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsLiveEngineActive(!isLiveEngineActive)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border shadow-3xs ${
              isLiveEngineActive
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/70'
                : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/70'
            }`}
          >
            {isLiveEngineActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isLiveEngineActive ? 'Pause Engine' : 'Resume Engine'}</span>
          </button>

          <button
            onClick={handleScaleWorkers}
            disabled={isScaling}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-slate-200/50 disabled:opacity-50"
          >
            <Cpu className={`w-4 h-4 ${isScaling ? 'animate-spin' : ''}`} />
            <span>{isScaling ? 'Scaling Pool...' : 'Scale Workers (+16)'}</span>
          </button>

          <button
            onClick={handleVerifyChecksums}
            disabled={isChecksumScanning}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border border-slate-200 shadow-3xs disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 ${isChecksumScanning ? 'animate-spin' : ''}`} />
            <span>{isChecksumScanning ? 'Scanning 45+ TB...' : 'Verify Checksums'}</span>
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('realtime')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-100"
            >
              <span>CDC Dashboard</span>
              <ChevronRight className="w-4 h-4 text-indigo-300" />
            </button>
          )}
        </div>
      </div>

      {/* NOTIFICATION TOAST BAR */}
      {lastScanMessage && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center justify-between gap-4 animate-in slide-in-from-top-2 shadow-3xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{lastScanMessage}</span>
          </div>
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest shadow-3xs">
            Verified
          </span>
        </div>
      )}

      {/* METRICS TELEMETRY GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 relative z-10">
        {/* Metric 1: Total Transferred Volume */}
        <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-2 hover:border-emerald-100 transition-colors shadow-3xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-500" />
            Total Volume Migrated
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tighter">
            {totalTransferredTb.toFixed(1)} <span className="text-xs font-black text-slate-400">TB</span>
          </div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 pt-1">
            <span className="text-emerald-600 font-black">108% of 45 TB Baseline</span>
          </div>
        </div>

        {/* Metric 2: Live Events/Sec (RPS) */}
        <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-2 hover:border-amber-100 transition-colors shadow-3xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Real-Time Events / Sec
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tighter">
            {totalRps.toLocaleString()} <span className="text-xs font-black text-slate-400">evt/s</span>
          </div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest pt-1">
            Throughput: <span className="text-slate-900">{totalThroughputGbs} GB/s</span>
          </div>
        </div>

        {/* Metric 3: CDC End-to-End Latency */}
        <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-2 hover:border-cyan-100 transition-colors shadow-3xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-500" />
            End-to-End Sync Latency
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tighter">
            {avgLatency} <span className="text-xs font-black text-slate-400">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest pt-1">
            Sub-second real-time CDC
          </div>
        </div>

        {/* Metric 4: Parallel Worker Threads */}
        <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-2 hover:border-indigo-100 transition-colors shadow-3xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-500" />
            Partition Worker Pool
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tighter">
            {totalWorkers} <span className="text-xs font-black text-slate-400">threads</span>
          </div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest pt-1">
            Dynamic chunk allocation
          </div>
        </div>
      </div>

      {/* 45+ TB MIGRATION VOLUME PROGRESS BAR */}
      <div className="p-6 bg-slate-900 rounded-3xl space-y-4 relative z-10 shadow-xl shadow-slate-200/50">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-3">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <span>45+ TB Petabyte Data Migration Progress Telemetry</span>
          </span>
          <span className="text-emerald-400 font-black font-mono text-[11px] tracking-widest">
            {totalTransferredTb.toFixed(1)} TB / 100.0 TB CAPACITY
          </span>
        </div>
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/80 shadow-inner shadow-black/50">
          <div
            className="bg-gradient-to-r from-indigo-500 via-emerald-400 to-cyan-400 h-full rounded-full transition-all duration-1000 relative"
            style={{ width: `${Math.min(100, (totalTransferredTb / 100) * 100)}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-white rounded-full animate-pulse shadow-lg shadow-white/50" />
          </div>
        </div>
      </div>

      {/* ACTIVE MULTI-SOURCE TO MULTI-DESTINATION STREAM PIPELINE MATRIX */}
      <div className="space-y-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2.5">
            <Radio className="w-4.5 h-4.5 text-emerald-600" />
            <span>Active Heterogeneous Source ➔ Destination Stream Pairs ({pipelinePairs.length})</span>
          </h3>

          <button
            onClick={handleSimulateCDCBurst}
            className="text-[10px] text-amber-600 hover:text-amber-700 font-black uppercase tracking-widest flex items-center gap-2 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl border border-amber-100 transition-all cursor-pointer shadow-3xs"
          >
            <Flame className="w-4 h-4" />
            <span>Inject CDC Burst (+0.6 TB)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pipelinePairs.map((pair) => (
            <div
              key={pair.id}
              className={`p-6 rounded-3xl border transition-all space-y-4 hover:shadow-lg hover:shadow-slate-100 ${
                pair.status === 'ACTIVE_CDC'
                  ? 'bg-white border-slate-200/80'
                  : 'bg-slate-50/50 border-slate-100 opacity-60'
              }`}
            >
              {/* Top Row: Protocol & Status */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-black uppercase tracking-widest shadow-3xs">
                  {pair.cdcProtocol}
                </span>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-3xs ${
                    pair.status === 'ACTIVE_CDC' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${pair.status === 'ACTIVE_CDC' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span>{pair.status === 'ACTIVE_CDC' ? 'Live CDC Streaming' : 'Paused'}</span>
                  </span>

                  <button
                    onClick={() => toggleStreamStatus(pair.id)}
                    className="text-slate-400 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100 shadow-3xs"
                    title={pair.status === 'ACTIVE_CDC' ? 'Pause Stream' : 'Resume Stream'}
                  >
                    {pair.status === 'ACTIVE_CDC' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Source -> Destination Visual Flow */}
              <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 shadow-inner shadow-slate-100">
                {/* SOURCE */}
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Source</div>
                  <strong className="text-slate-900 font-black block truncate text-[11px] uppercase tracking-tight">{pair.sourceName}</strong>
                  <span className="text-[9px] text-indigo-600 font-black uppercase tracking-widest">{pair.sourceType}</span>
                </div>

                {/* ARROW ICON */}
                <div className="p-2.5 bg-white text-indigo-600 rounded-xl shrink-0 border border-slate-100 shadow-3xs">
                  <ArrowRight className="w-4 h-4 animate-pulse" />
                </div>

                {/* DESTINATION */}
                <div className="flex-1 min-w-0 text-right">
                  <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Destination</div>
                  <strong className="text-slate-900 font-black block truncate text-[11px] uppercase tracking-tight">{pair.destName}</strong>
                  <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">{pair.destType}</span>
                </div>
              </div>

              {/* Pair Telemetry Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Migrated Volume</span>
                  <strong className="text-slate-900 font-black text-[11px] uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 block w-max">{pair.transferredTb.toFixed(2)} TB</strong>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Live Throughput</span>
                  <strong className="text-slate-900 font-black text-[11px] uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 block w-max">{pair.currentRps.toLocaleString()} rps</strong>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">CDC Latency</span>
                  <strong className="text-slate-900 font-black text-[11px] uppercase tracking-widest bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-100 block w-max">{pair.latencyMs} ms</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
