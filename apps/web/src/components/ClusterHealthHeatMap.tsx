import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  Activity,
  Globe,
  Wifi,
  Clock,
  Radio,
  Server,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Zap,
} from 'lucide-react';

export interface ConnectionNode {
  id: string;
  sourceName: string;
  sourceRegion: string;
  destName: string;
  destRegion: string;
  latencyMs: number;
  packetLossPct: number;
  throughputMbps: number;
  activeStreams: number;
  connectivityPct: number;
  status: 'Healthy' | 'Degraded' | 'Critical' | 'Inactive';
  lastChecked: string;
}

// Initial connection data
const INITIAL_NODES: ConnectionNode[] = [
  {
    id: 'conn-1',
    sourceName: 'SAP ERP Cluster',
    sourceRegion: 'US-East-1',
    destName: 'Iceberg Catalog Main',
    destRegion: 'US-East-1',
    latencyMs: 14,
    packetLossPct: 0.0,
    throughputMbps: 1850,
    activeStreams: 64,
    connectivityPct: 100,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-2',
    sourceName: 'SAP ERP Cluster',
    sourceRegion: 'US-East-1',
    destName: 'Snowflake Core Sync',
    destRegion: 'US-West-2',
    latencyMs: 58,
    packetLossPct: 0.1,
    throughputMbps: 920,
    activeStreams: 32,
    connectivityPct: 100,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-3',
    sourceName: 'SAP ERP Cluster',
    sourceRegion: 'US-East-1',
    destName: 'BigQuery Warehouse',
    destRegion: 'EU-Central-1',
    latencyMs: 108,
    packetLossPct: 0.4,
    throughputMbps: 450,
    activeStreams: 16,
    connectivityPct: 98,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-4',
    sourceName: 'SAP ERP Cluster',
    sourceRegion: 'US-East-1',
    destName: 'Azure Synapse Mirror',
    destRegion: 'AP-South-1',
    latencyMs: 242,
    packetLossPct: 1.8,
    throughputMbps: 150,
    activeStreams: 8,
    connectivityPct: 94,
    status: 'Degraded',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-5',
    sourceName: 'Postgres Core-DB',
    sourceRegion: 'US-West-2',
    destName: 'Iceberg Catalog Main',
    destRegion: 'US-East-1',
    latencyMs: 62,
    packetLossPct: 0.0,
    throughputMbps: 880,
    activeStreams: 24,
    connectivityPct: 100,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-6',
    sourceName: 'Postgres Core-DB',
    sourceRegion: 'US-West-2',
    destName: 'Snowflake Core Sync',
    destRegion: 'US-West-2',
    latencyMs: 8,
    packetLossPct: 0.0,
    throughputMbps: 2200,
    activeStreams: 48,
    connectivityPct: 100,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-7',
    sourceName: 'Postgres Core-DB',
    sourceRegion: 'US-West-2',
    destName: 'BigQuery Warehouse',
    destRegion: 'EU-Central-1',
    latencyMs: 135,
    packetLossPct: 0.5,
    throughputMbps: 380,
    activeStreams: 12,
    connectivityPct: 97,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-8',
    sourceName: 'Postgres Core-DB',
    sourceRegion: 'US-West-2',
    destName: 'Azure Synapse Mirror',
    destRegion: 'AP-South-1',
    latencyMs: 210,
    packetLossPct: 1.1,
    throughputMbps: 240,
    activeStreams: 8,
    connectivityPct: 95,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-9',
    sourceName: 'Oracle Legacy Core',
    sourceRegion: 'EU-Central-1',
    destName: 'Iceberg Catalog Main',
    destRegion: 'US-East-1',
    latencyMs: 112,
    packetLossPct: 0.3,
    throughputMbps: 540,
    activeStreams: 16,
    connectivityPct: 99,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-10',
    sourceName: 'Oracle Legacy Core',
    sourceRegion: 'EU-Central-1',
    destName: 'Snowflake Core Sync',
    destRegion: 'US-West-2',
    latencyMs: 148,
    packetLossPct: 0.6,
    throughputMbps: 420,
    activeStreams: 16,
    connectivityPct: 98,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-11',
    sourceName: 'Oracle Legacy Core',
    sourceRegion: 'EU-Central-1',
    destName: 'BigQuery Warehouse',
    destRegion: 'EU-Central-1',
    latencyMs: 12,
    packetLossPct: 0.0,
    throughputMbps: 1950,
    activeStreams: 40,
    connectivityPct: 100,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-12',
    sourceName: 'Oracle Legacy Core',
    sourceRegion: 'EU-Central-1',
    destName: 'Azure Synapse Mirror',
    destRegion: 'AP-South-1',
    latencyMs: 185,
    packetLossPct: 1.2,
    throughputMbps: 290,
    activeStreams: 10,
    connectivityPct: 96,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-13',
    sourceName: 'API Ingest Broker',
    sourceRegion: 'AP-South-1',
    destName: 'Iceberg Catalog Main',
    destRegion: 'US-East-1',
    latencyMs: 254,
    packetLossPct: 1.5,
    throughputMbps: 180,
    activeStreams: 8,
    connectivityPct: 94,
    status: 'Degraded',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-14',
    sourceName: 'API Ingest Broker',
    sourceRegion: 'AP-South-1',
    destName: 'Snowflake Core Sync',
    destRegion: 'US-West-2',
    latencyMs: 228,
    packetLossPct: 1.2,
    throughputMbps: 210,
    activeStreams: 12,
    connectivityPct: 95,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-15',
    sourceName: 'API Ingest Broker',
    sourceRegion: 'AP-South-1',
    destName: 'BigQuery Warehouse',
    destRegion: 'EU-Central-1',
    latencyMs: 195,
    packetLossPct: 0.9,
    throughputMbps: 310,
    activeStreams: 16,
    connectivityPct: 97,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
  {
    id: 'conn-16',
    sourceName: 'API Ingest Broker',
    sourceRegion: 'AP-South-1',
    destName: 'Azure Synapse Mirror',
    destRegion: 'AP-South-1',
    latencyMs: 18,
    packetLossPct: 0.0,
    throughputMbps: 1650,
    activeStreams: 48,
    connectivityPct: 100,
    status: 'Healthy',
    lastChecked: 'Just Now',
  },
];

// List of source environments
const SOURCES = [
  { name: 'SAP ERP Cluster', region: 'US-East-1' },
  { name: 'Postgres Core-DB', region: 'US-West-2' },
  { name: 'Oracle Legacy Core', region: 'EU-Central-1' },
  { name: 'API Ingest Broker', region: 'AP-South-1' },
];

// List of target environments
const DESTINATIONS = [
  { name: 'Iceberg Catalog Main', region: 'US-East-1' },
  { name: 'Snowflake Core Sync', region: 'US-West-2' },
  { name: 'BigQuery Warehouse', region: 'EU-Central-1' },
  { name: 'Azure Synapse Mirror', region: 'AP-South-1' },
];

export const ClusterHealthHeatMap: React.FC = () => {
  const [connections, setConnections] = useState<ConnectionNode[]>(INITIAL_NODES);
  const [selectedConnId, setSelectedConnId] = useState<string>('conn-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [simulationMode, setSimulationMode] = useState<string>('Normal');
  const [lastCheckTime, setLastCheckTime] = useState<string>(new Date().toLocaleTimeString());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Auto refresh mock interval
  useEffect(() => {
    const interval = setInterval(() => {
      setConnections((prevConns) =>
        prevConns.map((conn) => {
          // Add minor jitter variation
          const jitter = (Math.random() - 0.5) * 4;
          const original = INITIAL_NODES.find((i) => i.id === conn.id);
          if (!original) return conn;

          let targetLatency = original.latencyMs + jitter;
          let targetLoss = original.packetLossPct;
          let targetStreams = original.activeStreams;
          let targetThroughput = original.throughputMbps;
          let statusVal = original.status;

          // Apply regional simulation modifiers
          if (simulationMode === 'EU_FIBER_CUT') {
            if (conn.sourceRegion === 'EU-Central-1' || conn.destRegion === 'EU-Central-1') {
              targetLatency = original.latencyMs * 3.5 + 150;
              targetLoss = +(original.packetLossPct + 3.8 + Math.random()).toFixed(2);
              targetThroughput = Math.max(10, Math.floor(original.throughputMbps * 0.25));
              statusVal = 'Critical';
            }
          } else if (simulationMode === 'AP_CONGESTION') {
            if (conn.sourceRegion === 'AP-South-1' || conn.destRegion === 'AP-South-1') {
              targetLatency = original.latencyMs * 2.2 + 80;
              targetLoss = +(original.packetLossPct + 2.1).toFixed(2);
              targetThroughput = Math.max(30, Math.floor(original.throughputMbps * 0.45));
              statusVal = 'Degraded';
            }
          } else if (simulationMode === 'GLOBAL_SPIKE') {
            targetLatency = original.latencyMs * 1.8 + 45;
            targetLoss = +(original.packetLossPct + 0.8).toFixed(2);
            targetThroughput = Math.max(50, Math.floor(original.throughputMbps * 0.7));
            statusVal = targetLatency > 180 ? 'Critical' : 'Degraded';
          }

          // Compute status based on updated values
          let finalStatus: 'Healthy' | 'Degraded' | 'Critical' | 'Inactive' = 'Healthy';
          if (targetLatency > 220 || targetLoss > 2.5) {
            finalStatus = 'Critical';
          } else if (targetLatency > 95 || targetLoss > 0.8) {
            finalStatus = 'Degraded';
          }

          const connectivityVal = Math.max(
            50,
            Math.min(100, Math.round(100 - targetLoss * 12))
          );

          return {
            ...conn,
            latencyMs: +Math.max(1, targetLatency).toFixed(1),
            packetLossPct: +Math.max(0, targetLoss).toFixed(2),
            activeStreams: targetStreams,
            throughputMbps: Math.floor(targetThroughput),
            connectivityPct: connectivityVal,
            status: finalStatus,
            lastChecked: 'Just Now',
          };
        })
      );
      setLastCheckTime(new Date().toLocaleTimeString());
    }, 4000);

    return () => clearInterval(interval);
  }, [simulationMode]);

  // Manually refresh
  const triggerManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // Active Connection Details Selection
  const activeConn = useMemo(() => {
    return connections.find((c) => c.id === selectedConnId) || connections[0];
  }, [connections, selectedConnId]);

  // Simulation Trigger Controls
  const applySimulation = (mode: string) => {
    setSimulationMode(mode);
  };

  // Helper function to map latency & packet loss to cell styling
  const getCellBgClass = (conn: ConnectionNode) => {
    if (conn.status === 'Critical') {
      return 'bg-rose-500/10 text-rose-700 border-rose-300 hover:bg-rose-500/20';
    }
    if (conn.status === 'Degraded') {
      return 'bg-amber-500/10 text-amber-800 border-amber-300 hover:bg-amber-500/20';
    }
    return 'bg-emerald-500/10 text-emerald-800 border-emerald-300 hover:bg-emerald-500/20';
  };

  const getCellColorClass = (conn: ConnectionNode) => {
    if (conn.status === 'Critical') return 'text-rose-600';
    if (conn.status === 'Degraded') return 'text-amber-600';
    return 'text-emerald-600';
  };

  // Generate Recharts Comparison Data
  const chartData = useMemo(() => {
    return connections.map((conn) => ({
      name: `${conn.sourceRegion} ➔ ${conn.destRegion}`,
      Latency: conn.latencyMs,
      Throughput: conn.throughputMbps,
      Loss: conn.packetLossPct * 10, // scaled for chart representation
    }));
  }, [connections]);

  // Generate historical drift area data for selected active node
  const activeHistoricalData = useMemo(() => {
    if (!activeConn) return [];
    const baseLatency = activeConn.latencyMs;
    return Array.from({ length: 12 }).map((_, i) => {
      const multiplier = 0.8 + (Math.sin(i / 1.5) * 0.15) + (i * 0.03); // simulate slow degradation over time
      return {
        interval: `${i * 2}h ago`,
        currentLatency: +(baseLatency * multiplier).toFixed(1),
        targetBaseline: +(baseLatency * 0.85).toFixed(1),
      };
    }).reverse();
  }, [activeConn]);

  // Filtered Connections List
  const filteredConnections = useMemo(() => {
    return connections.filter((conn) => {
      const matchesSearch =
        conn.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.destName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion =
        regionFilter === 'All' ||
        conn.sourceRegion.includes(regionFilter) ||
        conn.destRegion.includes(regionFilter);
      return matchesSearch && matchesRegion;
    });
  }, [connections, searchQuery, regionFilter]);

  return (
    <div id="cluster-health-heatmap-panel" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
      {/* Panel Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded-full border border-indigo-100 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
              Regional Connectivity Matrix
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Cluster-Wide Network Ingress & Egress
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            Global Lakehouse Link Health Heat Map
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Real-time multi-regional stream latency, connection link congestion, and target catalog connectivity audit nodes mapped across the active migration network.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Refresh indicators */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-500">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="font-mono">Last Checked: {lastCheckTime}</span>
          </div>

          <button
            type="button"
            onClick={triggerManualRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            <span>Scan Nodes</span>
          </button>
        </div>
      </div>

      {/* Network Outage / Spikes Injector Controls */}
      <div className="bg-slate-50 rounded-xl border border-slate-150 p-4.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-600 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-600" />
            Active Regional Network Modifier (Simulation Ingress)
          </span>
          {simulationMode !== 'Normal' && (
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-mono text-[10px] font-bold rounded-full border border-rose-100 animate-pulse uppercase">
              Simulation Active: {simulationMode}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => applySimulation('Normal')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              simulationMode === 'Normal'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Baseline Performance (All Green)
          </button>

          <button
            type="button"
            onClick={() => applySimulation('EU_FIBER_CUT')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              simulationMode === 'EU_FIBER_CUT'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50'
            }`}
            title="Simulate severe transatlantic fiber cut affecting EU regions"
          >
            Simulate EU Fiber Cut (Severe)
          </button>

          <button
            type="button"
            onClick={() => applySimulation('AP_CONGESTION')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              simulationMode === 'AP_CONGESTION'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50'
            }`}
            title="Simulate network ingress traffic bottlenecks in Asia Pacific regions"
          >
            AP Ingress Congestion (Drift)
          </button>

          <button
            type="button"
            onClick={() => applySimulation('GLOBAL_SPIKE')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              simulationMode === 'GLOBAL_SPIKE'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Inject temporary high-load transatlantic network routing jitter"
          >
            Global Wave Latency Spike
          </button>
        </div>
      </div>

      {/* Main Heatmap Matrix and detail section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Heatmap Grid Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Source ➔ Target Regional Link Mesh
            </span>

            {/* Quick Filter Selection */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600">
              {['All', 'US', 'EU', 'AP'].map((rf) => (
                <button
                  key={rf}
                  type="button"
                  onClick={() => setRegionFilter(rf)}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    regionFilter === rf ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  {rf}
                </button>
              ))}
            </div>
          </div>

          {/* Graphical Map Grid Matrix */}
          <div className="border border-slate-150 rounded-2xl bg-slate-950 p-5 space-y-4 shadow-sm overflow-x-auto">
            <div className="min-w-[480px]">
              {/* Columns Header (Destinations) */}
              <div className="grid grid-cols-5 gap-3 pb-3 border-b border-slate-800/80 text-center">
                <div className="text-left text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Server className="w-3 h-3 text-slate-500" /> Source Env
                </div>
                {DESTINATIONS.map((dest) => (
                  <div key={dest.name} className="text-[10px] text-slate-300 font-extrabold uppercase font-mono space-y-0.5 leading-tight">
                    <span className="block truncate text-slate-200">{dest.name.split(' ')[0]}</span>
                    <span className="block text-[9px] text-indigo-400 font-bold">{dest.region}</span>
                  </div>
                ))}
              </div>

              {/* Rows (Sources Grid Matrix) */}
              <div className="space-y-3 pt-3">
                {SOURCES.map((source) => (
                  <div key={source.name} className="grid grid-cols-5 gap-3 items-center">
                    {/* Row Header (Source Environment) */}
                    <div className="text-left leading-tight">
                      <span className="block text-xs font-extrabold text-slate-200 truncate">{source.name.split(' ')[0]}</span>
                      <span className="block text-[9px] text-indigo-400 font-mono font-bold">{source.region}</span>
                    </div>

                    {/* Heatmap cells */}
                    {DESTINATIONS.map((dest) => {
                      const conn = connections.find(
                        (c) => c.sourceRegion === source.region && c.destRegion === dest.region
                      );

                      if (!conn) {
                        return (
                          <div
                            key={dest.name}
                            className="bg-slate-900/40 border border-slate-800 rounded-xl h-18 flex items-center justify-center text-[10px] text-slate-600 italic font-mono"
                          >
                            No Route
                          </div>
                        );
                      }

                      const isSelected = conn.id === selectedConnId;

                      return (
                        <div
                          key={dest.name}
                          onClick={() => setSelectedConnId(conn.id)}
                          className={`relative h-18 rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer text-center group ${getCellBgClass(
                            conn
                          )} ${isSelected ? 'ring-2 ring-indigo-500 scale-[1.02] border-indigo-400 shadow-md' : ''}`}
                        >
                          {/* Selected marker dot */}
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                            </span>
                          )}

                          {/* Latency Number */}
                          <div className="text-sm font-black font-mono tracking-tight leading-none text-slate-100 flex items-center justify-center gap-0.5 mt-1">
                            {conn.latencyMs} <span className="text-[9px] font-normal text-slate-400">ms</span>
                          </div>

                          {/* Connectivity Metric & Visual */}
                          <div className="space-y-1 mt-auto">
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-300">
                              <span className="font-extrabold">Loss:</span>
                              <span className={conn.packetLossPct > 1.5 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                                {conn.packetLossPct}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-1 rounded-full ${
                                  conn.status === 'Critical'
                                    ? 'bg-rose-500'
                                    : conn.status === 'Degraded'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${conn.connectivityPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Map Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono font-bold bg-slate-50 border border-slate-150 p-3 rounded-xl text-slate-600">
            <span className="text-slate-500">Latency Thresholds:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Healthy (&lt; 95ms)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Degraded (95ms - 220ms)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Critical (&gt; 220ms or &gt;2.5% Loss)</span>
            </div>
          </div>
        </div>

        {/* Right: Selected Diagnostics Side panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 shadow-3xs">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                  Details Panel
                </span>
                <h4 className="text-xs font-extrabold text-slate-900 mt-1">
                  Active Connection Diagnostic Telemetry
                </h4>
              </div>
              <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                activeConn.status === 'Critical'
                  ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                  : activeConn.status === 'Degraded'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {activeConn.status}
              </span>
            </div>

            {/* Active Link Descriptions */}
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-150 shadow-2xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Source Endpoint</span>
                  <span className="text-xs font-black text-slate-800 block truncate mt-0.5">{activeConn.sourceName}</span>
                  <span className="text-[10px] text-indigo-500 font-mono font-bold block">{activeConn.sourceRegion}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Target Endpoint</span>
                  <span className="text-xs font-black text-slate-800 block truncate mt-0.5">{activeConn.destName}</span>
                  <span className="text-[10px] text-indigo-500 font-mono font-bold block">{activeConn.destRegion}</span>
                </div>
              </div>

              {/* In-depth Stats Grid */}
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Ingress Latency</span>
                  <div className="text-sm font-black text-slate-800 mt-0.5">{activeConn.latencyMs} ms</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Network Bandwidth</span>
                  <div className="text-sm font-black text-slate-800 mt-0.5">{activeConn.throughputMbps} Mbps</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Packet Loss</span>
                  <div className={`text-sm font-black mt-0.5 ${activeConn.packetLossPct > 1.5 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {activeConn.packetLossPct} %
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Connected Streams</span>
                  <div className="text-sm font-black text-slate-800 mt-0.5">{activeConn.activeStreams} TCP Threads</div>
                </div>
              </div>

              {/* Recharts Latency Degradation Over Time graph */}
              <div className="bg-white p-3 rounded-xl border border-slate-150 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                    Historical Drift Profile (12h)
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono font-bold">Latency vs Baseline</span>
                </div>
                
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeHistoricalData} margin={{ top: 2, right: 2, left: -25, bottom: 2 }}>
                      <defs>
                        <linearGradient id="colorLinkLat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.20}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="interval" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                      />
                      <Area
                        name="Current Link Latency"
                        type="monotone"
                        dataKey="currentLatency"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorLinkLat)"
                        dot={false}
                      />
                      <Area
                        name="SLA Baseline"
                        type="monotone"
                        dataKey="targetBaseline"
                        stroke="#06b6d4"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        fill="none"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
