import React, { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCcw,
  Server,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Sliders,
  ShieldAlert,
  Info,
  Wrench,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export interface HeatmapNode {
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  velocityEvs: number;
  latencyMs: number;
  queueLag: number;
  status: 'Optimal' | 'Normal' | 'Warning' | 'Critical' | 'Inactive';
  activeWorkers: number;
  bufferPercent: number;
  lastSync: string;
  diagnosticNote: string;
}

const INITIAL_SOURCES = [
  { id: 'src-pg', name: 'PostgreSQL CRM', type: 'Transactional' },
  { id: 'src-mssql', name: 'MS SQL Inventory', type: 'Transactional' },
  { id: 'src-oracle', name: 'Oracle Finance', type: 'Legacy ERP' },
  { id: 'src-sap', name: 'SAP S/4HANA Ledger', type: 'Enterprise ERP' },
  { id: 'src-mongo', name: 'MongoDB Payments', type: 'Document Store' }
];

const INITIAL_TARGETS = [
  { id: 'tgt-snowflake', name: 'Snowflake DW', type: 'OLAP Warehouse' },
  { id: 'tgt-kafka', name: 'Apache Kafka Bus', type: 'Event Broker' },
  { id: 'tgt-s3', name: 'AWS S3 Lakehouse', type: 'Object Storage' },
  { id: 'tgt-sfdc', name: 'Salesforce CRM', type: 'Cloud Target' },
  { id: 'tgt-postgres', name: 'Postgres Replica', type: 'Reporting DB' }
];

const INITIAL_NODES: HeatmapNode[] = [
  // Row 1: PostgreSQL CRM (src-pg)
  {
    sourceId: 'src-pg',
    sourceName: 'PostgreSQL CRM',
    targetId: 'tgt-snowflake',
    targetName: 'Snowflake DW',
    velocityEvs: 1450,
    latencyMs: 35,
    queueLag: 12,
    status: 'Optimal',
    activeWorkers: 4,
    bufferPercent: 5,
    lastSync: 'Just now',
    diagnosticNote: 'Row-level WAL captures are streaming smoothly with optimal write-pool flushing.'
  },
  {
    sourceId: 'src-pg',
    sourceName: 'PostgreSQL CRM',
    targetId: 'tgt-kafka',
    targetName: 'Apache Kafka Bus',
    velocityEvs: 2100,
    latencyMs: 14,
    queueLag: 0,
    status: 'Optimal',
    activeWorkers: 8,
    bufferPercent: 2,
    lastSync: 'Just now',
    diagnosticNote: 'High-velocity WebSocket stream capturing transaction mutations at sub-15ms.'
  },
  {
    sourceId: 'src-pg',
    sourceName: 'PostgreSQL CRM',
    targetId: 'tgt-s3',
    targetName: 'AWS S3 Lakehouse',
    velocityEvs: 480,
    latencyMs: 41,
    queueLag: 3,
    status: 'Normal',
    activeWorkers: 2,
    bufferPercent: 8,
    lastSync: '1s ago',
    diagnosticNote: 'Parquet micro-batch consolidation flushing on 10-second rolling windows.'
  },
  {
    sourceId: 'src-pg',
    sourceName: 'PostgreSQL CRM',
    targetId: 'tgt-sfdc',
    targetName: 'Salesforce CRM',
    velocityEvs: 120,
    latencyMs: 128,
    queueLag: 89,
    status: 'Warning',
    activeWorkers: 1,
    bufferPercent: 44,
    lastSync: '4s ago',
    diagnosticNote: 'Downstream Salesforce REST API rate limiting detected. Throttling active workers to avoid 429.'
  },
  {
    sourceId: 'src-pg',
    sourceName: 'PostgreSQL CRM',
    targetId: 'tgt-postgres',
    targetName: 'Postgres Replica',
    velocityEvs: 1850,
    latencyMs: 22,
    queueLag: 2,
    status: 'Optimal',
    activeWorkers: 6,
    bufferPercent: 3,
    lastSync: 'Just now',
    diagnosticNote: 'Physical replication sync capturing changes at optimal page-alignment speed.'
  },

  // Row 2: MS SQL Inventory (src-mssql)
  {
    sourceId: 'src-mssql',
    sourceName: 'MS SQL Inventory',
    targetId: 'tgt-snowflake',
    targetName: 'Snowflake DW',
    velocityEvs: 620,
    latencyMs: 142,
    queueLag: 384,
    status: 'Warning',
    activeWorkers: 2,
    bufferPercent: 68,
    lastSync: '2s ago',
    diagnosticNote: 'Snowflake warehouses waking up from suspended state. Batch sizes scaling dynamically.'
  },
  {
    sourceId: 'src-mssql',
    sourceName: 'MS SQL Inventory',
    targetId: 'tgt-kafka',
    targetName: 'Apache Kafka Bus',
    velocityEvs: 1280,
    latencyMs: 29,
    queueLag: 8,
    status: 'Optimal',
    activeWorkers: 5,
    bufferPercent: 4,
    lastSync: 'Just now',
    diagnosticNote: 'MS SQL CDC SQLAgent streaming WAL logs directly to partitioned Kafka topic.'
  },
  {
    sourceId: 'src-mssql',
    sourceName: 'MS SQL Inventory',
    targetId: 'tgt-s3',
    targetName: 'AWS S3 Lakehouse',
    velocityEvs: 0,
    latencyMs: 0,
    queueLag: 0,
    status: 'Inactive',
    activeWorkers: 0,
    bufferPercent: 0,
    lastSync: 'Never',
    diagnosticNote: 'Connection inactive. No replication pipeline configured for this specific route.'
  },
  {
    sourceId: 'src-mssql',
    sourceName: 'MS SQL Inventory',
    targetId: 'tgt-sfdc',
    targetName: 'Salesforce CRM',
    velocityEvs: 90,
    latencyMs: 210,
    queueLag: 120,
    status: 'Warning',
    activeWorkers: 1,
    bufferPercent: 55,
    lastSync: '5s ago',
    diagnosticNote: 'Downstream HTTP connection latency spike. Target bulk api taking longer to respond.'
  },
  {
    sourceId: 'src-mssql',
    sourceName: 'MS SQL Inventory',
    targetId: 'tgt-postgres',
    targetName: 'Postgres Replica',
    velocityEvs: 980,
    latencyMs: 44,
    queueLag: 15,
    status: 'Normal',
    activeWorkers: 3,
    bufferPercent: 12,
    lastSync: '1s ago',
    diagnosticNote: 'Row captures syncing continuously with secondary reporting instance.'
  },

  // Row 3: Oracle Finance (src-oracle)
  {
    sourceId: 'src-oracle',
    sourceName: 'Oracle Finance',
    targetId: 'tgt-snowflake',
    targetName: 'Snowflake DW',
    velocityEvs: 410,
    latencyMs: 185,
    queueLag: 210,
    status: 'Warning',
    activeWorkers: 2,
    bufferPercent: 52,
    lastSync: '3s ago',
    diagnosticNote: 'Heavy tablespace locks on Oracle tables causing slight read-latency delays.'
  },
  {
    sourceId: 'src-oracle',
    sourceName: 'Oracle Finance',
    targetId: 'tgt-kafka',
    targetName: 'Apache Kafka Bus',
    velocityEvs: 1100,
    latencyMs: 32,
    queueLag: 14,
    status: 'Optimal',
    activeWorkers: 4,
    bufferPercent: 6,
    lastSync: 'Just now',
    diagnosticNote: 'GoldenGate adapter pushing transactional ledgers into intermediate topic queue.'
  },
  {
    sourceId: 'src-oracle',
    sourceName: 'Oracle Finance',
    targetId: 'tgt-s3',
    targetName: 'AWS S3 Lakehouse',
    velocityEvs: 210,
    latencyMs: 95,
    queueLag: 45,
    status: 'Normal',
    activeWorkers: 1,
    bufferPercent: 18,
    lastSync: '2s ago',
    diagnosticNote: 'Periodic ledger archival syncing safely using multi-threaded target drivers.'
  },
  {
    sourceId: 'src-oracle',
    sourceName: 'Oracle Finance',
    targetId: 'tgt-sfdc',
    targetName: 'Salesforce CRM',
    velocityEvs: 0,
    latencyMs: 0,
    queueLag: 0,
    status: 'Inactive',
    activeWorkers: 0,
    bufferPercent: 0,
    lastSync: 'Never',
    diagnosticNote: 'No routing pipeline exists between Oracle ERP and Salesforce target.'
  },
  {
    sourceId: 'src-oracle',
    sourceName: 'Oracle Finance',
    targetId: 'tgt-postgres',
    targetName: 'Postgres Replica',
    velocityEvs: 0,
    latencyMs: 0,
    queueLag: 0,
    status: 'Inactive',
    activeWorkers: 0,
    bufferPercent: 0,
    lastSync: 'Never',
    diagnosticNote: 'Route deactivated by system policy settings.'
  },

  // Row 4: SAP S/4HANA Ledger (src-sap)
  {
    sourceId: 'src-sap',
    sourceName: 'SAP S/4HANA Ledger',
    targetId: 'tgt-snowflake',
    targetName: 'Snowflake DW',
    velocityEvs: 350,
    latencyMs: 380,
    queueLag: 1450,
    status: 'Critical',
    activeWorkers: 1,
    bufferPercent: 92,
    lastSync: '12s ago',
    diagnosticNote: 'CRITICAL BOTTLENECK: High backpressure on SAP RFC gateway. Thread pool exhaustion detected in source connector.'
  },
  {
    sourceId: 'src-sap',
    sourceName: 'SAP S/4HANA Ledger',
    targetId: 'tgt-kafka',
    targetName: 'Apache Kafka Bus',
    velocityEvs: 110,
    latencyMs: 420,
    queueLag: 890,
    status: 'Critical',
    activeWorkers: 1,
    bufferPercent: 88,
    lastSync: '10s ago',
    diagnosticNote: 'CRITICAL BOTTLENECK: Network socket dropping packets. Gateway buffer approaching peak capacity.'
  },
  {
    sourceId: 'src-sap',
    sourceName: 'SAP S/4HANA Ledger',
    targetId: 'tgt-s3',
    targetName: 'AWS S3 Lakehouse',
    velocityEvs: 420,
    latencyMs: 210,
    queueLag: 450,
    status: 'Warning',
    activeWorkers: 2,
    bufferPercent: 64,
    lastSync: '3s ago',
    diagnosticNote: 'SAP RFC listener struggling with transaction record volume spikes.'
  },
  {
    sourceId: 'src-sap',
    sourceName: 'SAP S/4HANA Ledger',
    targetId: 'tgt-sfdc',
    targetName: 'Salesforce CRM',
    velocityEvs: 80,
    latencyMs: 340,
    queueLag: 720,
    status: 'Critical',
    activeWorkers: 1,
    bufferPercent: 85,
    lastSync: '8s ago',
    diagnosticNote: 'CRITICAL BOTTLENECK: SAP ERP ledger export thread stalled waiting on down-level batch API loops.'
  },
  {
    sourceId: 'src-sap',
    sourceName: 'SAP S/4HANA Ledger',
    targetId: 'tgt-postgres',
    targetName: 'Postgres Replica',
    velocityEvs: 150,
    latencyMs: 290,
    queueLag: 390,
    status: 'Warning',
    activeWorkers: 1,
    bufferPercent: 71,
    lastSync: '4s ago',
    diagnosticNote: 'Buffer lagging due to severe write-contention on target reporting server.'
  },

  // Row 5: MongoDB Payments (src-mongo)
  {
    sourceId: 'src-mongo',
    sourceName: 'MongoDB Payments',
    targetId: 'tgt-snowflake',
    targetName: 'Snowflake DW',
    velocityEvs: 1120,
    latencyMs: 38,
    queueLag: 5,
    status: 'Optimal',
    activeWorkers: 4,
    bufferPercent: 4,
    lastSync: 'Just now',
    diagnosticNote: 'MongoDB Atlas change streams flushing smoothly via Snowflake connector.'
  },
  {
    sourceId: 'src-mongo',
    sourceName: 'MongoDB Payments',
    targetId: 'tgt-kafka',
    targetName: 'Apache Kafka Bus',
    velocityEvs: 2450,
    latencyMs: 11,
    queueLag: 0,
    status: 'Optimal',
    activeWorkers: 10,
    bufferPercent: 1,
    lastSync: 'Just now',
    diagnosticNote: 'Ultra-low replication lag. Dynamic broker balancing processing payments audit stream.'
  },
  {
    sourceId: 'src-mongo',
    sourceName: 'MongoDB Payments',
    targetId: 'tgt-s3',
    targetName: 'AWS S3 Lakehouse',
    velocityEvs: 690,
    latencyMs: 34,
    queueLag: 2,
    status: 'Optimal',
    activeWorkers: 3,
    bufferPercent: 6,
    lastSync: 'Just now',
    diagnosticNote: 'Change logs compressed and appended to JSON-lines bucket partition layout.'
  },
  {
    sourceId: 'src-mongo',
    sourceName: 'MongoDB Payments',
    targetId: 'tgt-sfdc',
    targetName: 'Salesforce CRM',
    velocityEvs: 220,
    latencyMs: 78,
    queueLag: 14,
    status: 'Normal',
    activeWorkers: 2,
    bufferPercent: 18,
    lastSync: '2s ago',
    diagnosticNote: 'Payment triggers mapped to accounts contacts in Salesforce CRM logs.'
  },
  {
    sourceId: 'src-mongo',
    sourceName: 'MongoDB Payments',
    targetId: 'tgt-postgres',
    targetName: 'Postgres Replica',
    velocityEvs: 1410,
    latencyMs: 25,
    queueLag: 1,
    status: 'Optimal',
    activeWorkers: 5,
    bufferPercent: 2,
    lastSync: 'Just now',
    diagnosticNote: 'Streaming replication syncing MongoDB transaction documents to Postgres collections.'
  }
];

export const SyncHealthHeatmap: React.FC = () => {
  const [nodes, setNodes] = useState<HeatmapNode[]>(INITIAL_NODES);
  const [activeMetric, setActiveMetric] = useState<'velocity' | 'latency' | 'queuelag'>('velocity');
  const [healthFilter, setHealthFilter] = useState<'ALL' | 'BOTTLENECK' | 'OPTIMAL'>('ALL');
  const [selectedNode, setSelectedNode] = useState<HeatmapNode | null>(INITIAL_NODES.find(n => n.sourceId === 'src-sap' && n.targetId === 'tgt-snowflake') || INITIAL_NODES[0]);
  const [isSimulatingRefreshes, setIsSimulatingRefreshes] = useState(true);

  // Auto-simulate fluctuation in metrics
  useEffect(() => {
    if (!isSimulatingRefreshes) return;

    const interval = setInterval(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.status === 'Inactive') return node;

          // Minor fluctuations based on current status
          let multiplier = 1;
          if (node.status === 'Warning') multiplier = 0.8;
          if (node.status === 'Critical') multiplier = 0.5;

          const velocityDelta = Math.floor((Math.random() - 0.5) * 40 * multiplier);
          const latencyDelta = Math.floor((Math.random() - 0.5) * 4 * multiplier);
          const queueDelta = Math.floor((Math.random() - 0.5) * 5 * multiplier);

          const newVelocity = Math.max(10, node.velocityEvs + velocityDelta);
          const newLatency = Math.max(2, node.latencyMs + latencyDelta);
          const newQueue = Math.max(0, node.queueLag + queueDelta);

          return {
            ...node,
            velocityEvs: newVelocity,
            latencyMs: newLatency,
            queueLag: newQueue,
            lastSync: 'Just now'
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulatingRefreshes]);

  // Synchronize selection state when node updates
  useEffect(() => {
    if (selectedNode) {
      const updated = nodes.find(
        (n) => n.sourceId === selectedNode.sourceId && n.targetId === selectedNode.targetId
      );
      if (updated) {
        setSelectedNode(updated);
      }
    }
  }, [nodes]);

  // Filter handlers
  const filteredNodes = nodes.filter((node) => {
    if (healthFilter === 'BOTTLENECK') {
      return node.status === 'Warning' || node.status === 'Critical';
    }
    if (healthFilter === 'OPTIMAL') {
      return node.status === 'Optimal' || node.status === 'Normal';
    }
    return true;
  });

  // Simulation Trigger: Scale Workers (Optimizes the flow)
  const handleScaleWorkers = () => {
    if (!selectedNode) return;
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.sourceId === selectedNode.sourceId && n.targetId === selectedNode.targetId) {
          return {
            ...n,
            status: 'Optimal',
            activeWorkers: n.activeWorkers + 4,
            bufferPercent: Math.max(1, Math.floor(n.bufferPercent * 0.15)),
            velocityEvs: Math.floor(n.velocityEvs * 2.1) + 200,
            latencyMs: Math.max(5, Math.floor(n.latencyMs * 0.25)),
            queueLag: Math.max(0, Math.floor(n.queueLag * 0.1)),
            diagnosticNote: `Optimized: Successfully allocated 4 additional worker nodes. Backpressure flushed, data replication velocity doubled with sub-50ms latency.`
          };
        }
        return n;
      })
    );
  };

  // Simulation Trigger: Throttle / Inject Bottleneck
  const handleThrottlePipeline = () => {
    if (!selectedNode) return;
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.sourceId === selectedNode.sourceId && n.targetId === selectedNode.targetId) {
          return {
            ...n,
            status: 'Critical',
            activeWorkers: 1,
            bufferPercent: 95,
            velocityEvs: Math.max(10, Math.floor(n.velocityEvs * 0.15)),
            latencyMs: n.latencyMs + 280,
            queueLag: n.queueLag + 1200,
            diagnosticNote: `Simulated Bottleneck: Throttled pipeline due to high downstream read-write contention and worker thread starvation. Message queues are backing up.`
          };
        }
        return n;
      })
    );
  };

  // Simulation Trigger: Inject Burst of Traffic
  const handleInjectBurst = () => {
    if (!selectedNode) return;
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.sourceId === selectedNode.sourceId && n.targetId === selectedNode.targetId) {
          return {
            ...n,
            velocityEvs: n.velocityEvs + 1800,
            queueLag: n.queueLag + 200,
            bufferPercent: Math.min(100, n.bufferPercent + 15),
            diagnosticNote: `Traffic Burst: Injected 1,800 events/sec peak payload batch into stream. Buffer queues loaded, processing threads autoscaling.`
          };
        }
        return n;
      })
    );
  };

  // Simulation Trigger: Reset connection path back to normal/initial state
  const handleResetConnection = () => {
    if (!selectedNode) return;
    const initial = INITIAL_NODES.find(
      (n) => n.sourceId === selectedNode.sourceId && n.targetId === selectedNode.targetId
    );
    if (!initial) return;
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.sourceId === selectedNode.sourceId && n.targetId === selectedNode.targetId) {
          return { ...initial };
        }
        return n;
      })
    );
  };

  // Get color configurations for cells
  const getStatusColor = (status: HeatmapNode['status'], isInteractive: boolean = false) => {
    switch (status) {
      case 'Optimal':
        return {
          bg: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800',
          indicator: 'bg-emerald-500',
          label: 'Optimal',
          darkBg: 'bg-emerald-950/20 text-emerald-400 border-emerald-800/80 hover:bg-emerald-900/30'
        };
      case 'Normal':
        return {
          bg: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100 text-cyan-800',
          indicator: 'bg-cyan-500',
          label: 'Normal',
          darkBg: 'bg-cyan-950/20 text-cyan-400 border-cyan-800/80 hover:bg-cyan-900/30'
        };
      case 'Warning':
        return {
          bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-800',
          indicator: 'bg-amber-500',
          label: 'Warning Lag',
          darkBg: 'bg-amber-950/20 text-amber-400 border-amber-800/80 hover:bg-amber-900/30'
        };
      case 'Critical':
        return {
          bg: 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-800',
          indicator: 'bg-rose-500',
          label: 'Critical Bottleneck',
          darkBg: 'bg-rose-950/25 text-rose-400 border-rose-850/80 hover:bg-rose-900/30 animate-pulse'
        };
      case 'Inactive':
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-50',
          indicator: 'bg-slate-300',
          label: 'Inactive',
          darkBg: 'bg-slate-900/40 text-slate-500 border-slate-800/60 opacity-40 cursor-not-allowed'
        };
    }
  };

  // Render metric value inside grid cells
  const renderCellValue = (node: HeatmapNode) => {
    if (node.status === 'Inactive') return <span className="text-[10px] text-slate-400 font-mono">N/A</span>;
    if (activeMetric === 'velocity') {
      return (
        <div className="flex flex-col items-center">
          <span className="text-xs font-black font-mono">{node.velocityEvs.toLocaleString()}</span>
          <span className="text-[8px] opacity-75 font-semibold">evt/sec</span>
        </div>
      );
    }
    if (activeMetric === 'latency') {
      return (
        <div className="flex flex-col items-center">
          <span className="text-xs font-black font-mono">{node.latencyMs}ms</span>
          <span className="text-[8px] opacity-75 font-semibold">latency</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <span className="text-xs font-black font-mono">{node.queueLag.toLocaleString()}</span>
        <span className="text-[8px] opacity-75 font-semibold">buffered</span>
      </div>
    );
  };

  // Selected Node Recharts Area Chart Data Flow Simulation
  const mockFlowData = React.useMemo(() => {
    if (!selectedNode || selectedNode.status === 'Inactive') {
      return Array.from({ length: 12 }, (_, i) => ({ time: `${i * 5}m`, velocity: 0, lag: 0 }));
    }
    const currentVelocity = selectedNode.velocityEvs;
    const currentLag = selectedNode.queueLag;
    return Array.from({ length: 12 }, (_, i) => {
      // Create some historical variation pointing towards the current value
      const progress = i / 11; // 0 to 1
      const noise = (Math.random() - 0.5) * (currentVelocity * 0.1);
      const lagNoise = (Math.random() - 0.5) * (currentLag * 0.1);
      return {
        time: `${i * 5}m`,
        velocity: Math.max(10, Math.floor(currentVelocity * progress + noise)),
        lag: Math.max(0, Math.floor(currentLag * progress + lagNoise))
      };
    });
  }, [selectedNode?.velocityEvs, selectedNode?.queueLag, selectedNode?.status]);

  return (
    <div className="space-y-6" id="sync-health-heatmap-module">
      
      {/* Upper Title and Controls Bar */}
      <div className="bg-white text-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
              Bi-Directional Sync Health Heatmap
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-normal max-w-2xl">
            Fully interactive source-to-target replication grid. Analyze throughput flow speed, highlight congestion bottlenecks, and manually simulate load balancing directly.
          </p>
        </div>

        {/* Refresh and Simulate Toggle Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSimulatingRefreshes(!isSimulatingRefreshes)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isSimulatingRefreshes
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isSimulatingRefreshes ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span>{isSimulatingRefreshes ? 'Live Fluctuations On' : 'Simulation Paused'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GRID HEATMAP VIEW (Col Span 8) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
          
          {/* Header Controls Inside Grid Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            {/* View Selectors */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Display Value:</span>
              <button
                type="button"
                onClick={() => setActiveMetric('velocity')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeMetric === 'velocity'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Throughput (ev/s)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('latency')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeMetric === 'latency'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Latency (ms)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('queuelag')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeMetric === 'queuelag'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Queue Buffer</span>
              </button>
            </div>

            {/* Health Filter */}
            <div className="flex items-center gap-1.5 border border-slate-200 p-1 bg-slate-50 rounded-xl">
              <button
                type="button"
                onClick={() => setHealthFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  healthFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Nodes
              </button>
              <button
                type="button"
                onClick={() => setHealthFilter('BOTTLENECK')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  healthFilter === 'BOTTLENECK'
                    ? 'bg-rose-500 text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-rose-600'
                }`}
              >
                <ShieldAlert className="w-3 h-3 shrink-0" />
                Bottlenecks
              </button>
              <button
                type="button"
                onClick={() => setHealthFilter('OPTIMAL')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  healthFilter === 'OPTIMAL'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-emerald-700'
                }`}
              >
                Optimal/Healthy
              </button>
            </div>
          </div>

          {/* 5x5 HEATMAP GRID GRAPH */}
          <div className="overflow-x-auto select-none py-3" id="heatmap-matrix-wrapper">
            <div className="min-w-[640px] space-y-3">
              
              {/* TARGET HEADERS (X-AXIS) */}
              <div className="grid grid-cols-12 gap-2 text-center pl-28">
                {INITIAL_TARGETS.map((tgt) => (
                  <div key={tgt.id} className="col-span-2 flex flex-col justify-end pb-1 h-14">
                    <span className="text-[10px] font-extrabold text-slate-800 tracking-tight leading-tight truncate px-1" title={tgt.name}>
                      {tgt.name}
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase font-mono font-bold">
                      {tgt.type.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>

              {/* GRID BODY (Y-AXIS + CELLS) */}
              <div className="space-y-2">
                {INITIAL_SOURCES.map((src) => (
                  <div key={src.id} className="grid grid-cols-12 gap-2 items-center">
                    
                    {/* SOURCE LABEL (Y-AXIS) */}
                    <div className="col-span-2 text-right pr-3 flex flex-col justify-center h-16 w-28 shrink-0">
                      <span className="text-[10px] font-extrabold text-slate-800 tracking-tight leading-tight block truncate" title={src.name}>
                        {src.name}
                      </span>
                      <span className="text-[8px] text-slate-400 uppercase font-mono font-bold block mt-0.5">
                        {src.type.split(' ')[0]}
                      </span>
                    </div>

                    {/* 5 TARGET CELLS FOR THIS SOURCE */}
                    {INITIAL_TARGETS.map((tgt) => {
                      // Find node configuration state
                      const node = nodes.find(
                        (n) => n.sourceId === src.id && n.targetId === tgt.id
                      );

                      if (!node) {
                        return <div key={`${src.id}-${tgt.id}`} className="col-span-2 h-16 bg-slate-50 border border-slate-100 rounded-xl" />;
                      }

                      // Check filter settings
                      const isFilteredOut =
                        (healthFilter === 'BOTTLENECK' && node.status !== 'Warning' && node.status !== 'Critical') ||
                        (healthFilter === 'OPTIMAL' && node.status !== 'Optimal' && node.status !== 'Normal');

                      const colors = getStatusColor(node.status);
                      const isSelected = selectedNode?.sourceId === src.id && selectedNode?.targetId === tgt.id;

                      return (
                        <div
                          key={`${src.id}-${tgt.id}`}
                          onClick={() => {
                            if (node.status !== 'Inactive') {
                              setSelectedNode(node);
                            }
                          }}
                          className={`col-span-2 h-16 rounded-xl border flex flex-col items-center justify-center p-2.5 transition-all duration-300 relative ${
                            isFilteredOut ? 'opacity-15 cursor-not-allowed scale-95' : 'cursor-pointer'
                          } ${colors.bg} ${
                            isSelected && node.status !== 'Inactive'
                              ? 'ring-3 ring-indigo-600 ring-offset-2 border-indigo-400 scale-[1.03] z-10 shadow-sm'
                              : 'shadow-2xs'
                          }`}
                        >
                          {/* Inner Cell Layout */}
                          {renderCellValue(node)}

                          {/* Mini Status Corner Indicator */}
                          {node.status !== 'Inactive' && (
                            <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${colors.indicator}`} />
                          )}
                        </div>
                      );
                    })}

                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Health Color Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Health Index:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <span>Optimal (≤50ms)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500" />
                <span>Normal (51-100ms)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                <span>Warning Lag (101-300ms)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                <span>Critical Bottleneck (&gt;300ms)</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-55">
                <span className="w-2.5 h-2.5 rounded bg-slate-300" />
                <span>Inactive Configuration</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              * Click any active cell block to open real-time diagnostic stream telemetry.
            </div>
          </div>

        </div>

        {/* DETAILED DIAGNOSTIC SIDEBAR / DRAWED (Col Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          {selectedNode ? (
            <div className="bg-white text-slate-800 rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5 flex flex-col justify-between h-full">
              
              {/* Header: Selected Route Description */}
              <div className="space-y-1 pb-3 border-b border-slate-100">
                <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider font-mono">
                  Active Replication Path Diagnostics
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-black truncate max-w-[130px] text-slate-900">{selectedNode.sourceName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-black truncate max-w-[130px] text-indigo-600">{selectedNode.targetName}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`h-2 w-2 rounded-full ${getStatusColor(selectedNode.status).indicator}`} />
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    {getStatusColor(selectedNode.status).label}
                  </span>
                </div>
              </div>

              {/* Path Telemetry Readouts */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px]">
                <div className="space-y-0.5">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Throughput Speed</div>
                  <strong className="text-slate-950 text-xs font-bold">{selectedNode.velocityEvs.toLocaleString()} ev/s</strong>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">End-To-End Latency</div>
                  <strong className={`${selectedNode.latencyMs > 150 ? 'text-rose-600' : 'text-emerald-600'} text-xs font-bold`}>
                    {selectedNode.latencyMs}ms
                  </strong>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Replication Queue Lag</div>
                  <strong className={`${selectedNode.queueLag > 100 ? 'text-amber-600' : 'text-slate-700'} text-xs font-bold`}>
                    {selectedNode.queueLag.toLocaleString()} pkts
                  </strong>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Buffer Utilization</div>
                  <strong className="text-slate-700 text-xs font-bold">{selectedNode.bufferPercent}%</strong>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Allocated Threads</div>
                  <strong className="text-indigo-600 text-xs font-bold">{selectedNode.activeWorkers} Workers</strong>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Last Health Ping</div>
                  <span className="text-slate-500 text-[10px]">{selectedNode.lastSync}</span>
                </div>
              </div>

              {/* Mini Interactive Stream Telemetry Chart */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">1-Hour Speed Telemetry (ev/s)</span>
                  <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5" />
                    Real-Time Output
                  </span>
                </div>
                
                <div className="h-24 w-full bg-slate-50 rounded-xl p-2 border border-slate-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockFlowData} margin={{ top: 5, right: 5, left: -25, bottom: -5 }}>
                      <defs>
                        <linearGradient id="colorPathVelocity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={8} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '10px', color: '#0f172a', fontFamily: 'monospace' }}
                      />
                      <Area type="monotone" dataKey="velocity" stroke="#4f46e5" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPathVelocity)" name="ev/s" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Diagnostic Verbatim Notes */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 font-mono uppercase">
                  <Info className="w-3 h-3 text-indigo-600" />
                  Path Diagnostic Log
                </div>
                <p className="text-[10px] leading-relaxed text-slate-600 font-medium">
                  {selectedNode.diagnosticNote}
                </p>
              </div>

              {/* Real-time Interactive Simulator Controls */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-indigo-600" />
                  Simulate Bottlenecks & Scale Nodes
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleScaleWorkers}
                    className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                    title="Allocate more threads and scale worker nodes to handle queue lag."
                  >
                    <Cpu className="w-3 h-3 shrink-0" />
                    <span>Scale Workers (+4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleThrottlePipeline}
                    className="py-1.5 px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-[10px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Simulate upstream bandwidth bottleneck or database tablespace locking."
                  >
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Force Throttle</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInjectBurst}
                    className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                    title="Inject simulated load burst packet spike into replication stream."
                  >
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>Inject Burst</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetConnection}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-[10px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Re-establish original pipeline parameters and de-allocate burst states."
                  >
                    <RefreshCcw className="w-3 h-3 shrink-0" />
                    <span>Reset Path</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white text-slate-500 rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center h-full space-y-3 shadow-xs">
              <Database className="w-10 h-10 text-slate-300 animate-pulse" />
              <div>
                <h4 className="font-extrabold text-sm text-slate-700">No Target Path Selected</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Hover or click on any active cell in the bi-directional heatmap matrix to query thread allocations, latency limits, and replication buffer queues.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
