import React, { useState, useEffect, useRef } from 'react';
import { CliDownloadModal } from './CliDownloadModal';
import {
  Code,
  Terminal,
  Package,
  Zap,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  Cpu,
  Layers,
  ShieldCheck,
  Check,
  Copy,
  Radio,
  Activity,
  FileCode2,
  Download,
  Plus,
  Filter,
  ArrowUpRight,
  Settings,
  AlertTriangle,
  Send,
  Database,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Server,
  Workflow,
  X,
  Trash2,
  Save,
  Edit3
} from 'lucide-react';

interface CustomConnector {
  id: string;
  name: string;
  type: 'CDC Stream' | 'Webhook Gateway' | 'Polling API' | 'Message Queue';
  version: string;
  status: 'Active' | 'Idle' | 'Testing' | 'Error';
  throughput: string;
  avgLatency: string;
  lastSync: string;
  language: 'TypeScript' | 'Go' | 'Python';
}

interface SimulatedEvent {
  id: string;
  timestamp: string;
  connector: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'STREAM_PACKET';
  table: string;
  payload: string;
  latencyMs: number;
  status: 'Success' | 'Transformed' | 'Filtered';
}

export default function ConnectorSdkView() {
  const [activeTab, setActiveTab] = useState<'template' | 'sandbox' | 'config' | 'registry'>('sandbox');
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'go' | 'python'>('typescript');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeLogFilter, setActiveLogFilter] = useState<'ALL' | 'INFO' | 'CDC' | 'WARN'>('ALL');
  
  // Real-time Stream Metrics State
  const [metrics, setMetrics] = useState({
    throughput: 14250,
    latency: 3.8,
    activeStreams: 12,
    bufferUtilization: 42,
    processedTotal: 84920410
  });

  // Custom Connectors Registry
  const [customConnectors, setCustomConnectors] = useState<CustomConnector[]>([
    {
      id: 'conn-sdk-01',
      name: 'SAP HANA Real-Time CDC Adapter',
      type: 'CDC Stream',
      version: 'v2.4.0',
      status: 'Active',
      throughput: '4,850 rec/s',
      avgLatency: '2.1 ms',
      lastSync: 'Just now',
      language: 'TypeScript'
    },
    {
      id: 'conn-sdk-02',
      name: 'AS400 DB2 Journal Listener',
      type: 'CDC Stream',
      version: 'v1.8.2',
      status: 'Active',
      throughput: '2,100 rec/s',
      avgLatency: '5.4 ms',
      lastSync: 'Just now',
      language: 'Go'
    },
    {
      id: 'conn-sdk-03',
      name: 'Stripe Real-time Webhook Receiver',
      type: 'Webhook Gateway',
      version: 'v3.0.1',
      status: 'Active',
      throughput: '890 rec/s',
      avgLatency: '1.2 ms',
      lastSync: '1s ago',
      language: 'TypeScript'
    },
    {
      id: 'conn-sdk-04',
      name: 'MongoDB Change Streams Listener',
      type: 'CDC Stream',
      version: 'v2.1.0',
      status: 'Idle',
      throughput: '0 rec/s',
      avgLatency: '0.8 ms',
      lastSync: '4m ago',
      language: 'Python'
    }
  ]);

  // Modal State for CLI Tools Download
  const [showCliModal, setShowCliModal] = useState<boolean>(false);

  // Modal State for Registering Connector
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    type: 'CDC Stream' as CustomConnector['type'],
    version: 'v1.0.0',
    language: 'TypeScript' as CustomConnector['language'],
    status: 'Active' as CustomConnector['status'],
    bufferMs: 50,
    batchSize: 500,
    deadLetterQueue: 'dlq_connector_stream'
  });

  // Modal State for Configuring Connector
  const [selectedConnectorForConfig, setSelectedConnectorForConfig] = useState<CustomConnector | null>(null);
  const [configForm, setConfigForm] = useState({
    name: '',
    type: 'CDC Stream' as CustomConnector['type'],
    version: 'v1.0.0',
    language: 'TypeScript' as CustomConnector['language'],
    status: 'Active' as CustomConnector['status'],
    bufferMs: 50,
    batchSize: 500,
    deadLetterQueue: 'dlq_connector_stream',
    enableCDC: true
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name.trim()) return;

    const newConn: CustomConnector = {
      id: `conn-sdk-${Date.now()}`,
      name: registerForm.name.trim(),
      type: registerForm.type,
      version: registerForm.version || 'v1.0.0',
      status: registerForm.status,
      throughput: registerForm.status === 'Active' ? '1,200 rec/s' : '0 rec/s',
      avgLatency: '1.5 ms',
      lastSync: 'Just now',
      language: registerForm.language
    };

    setCustomConnectors(prev => [newConn, ...prev]);

    setLogs(prev => [
      {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        level: 'INFO',
        msg: `[EDIMP-SDK] Registered new connector "${newConn.name}" (${newConn.type}, ${newConn.language}) with ${registerForm.bufferMs}ms buffer window`
      },
      ...prev
    ]);

    setShowRegisterModal(false);
    setRegisterForm({
      name: '',
      type: 'CDC Stream',
      version: 'v1.0.0',
      language: 'TypeScript',
      status: 'Active',
      bufferMs: 50,
      batchSize: 500,
      deadLetterQueue: 'dlq_connector_stream'
    });
  };

  const handleOpenConfig = (connector: CustomConnector) => {
    setSelectedConnectorForConfig(connector);
    setConfigForm({
      name: connector.name,
      type: connector.type,
      version: connector.version,
      language: connector.language,
      status: connector.status,
      bufferMs: 50,
      batchSize: 500,
      deadLetterQueue: `dlq_${connector.id}`,
      enableCDC: connector.type === 'CDC Stream'
    });
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnectorForConfig) return;

    setCustomConnectors(prev => prev.map(c => {
      if (c.id === selectedConnectorForConfig.id) {
        return {
          ...c,
          name: configForm.name.trim() || c.name,
          type: configForm.type,
          version: configForm.version || c.version,
          language: configForm.language,
          status: configForm.status,
          throughput: configForm.status === 'Active' ? (c.throughput === '0 rec/s' ? '1,500 rec/s' : c.throughput) : '0 rec/s'
        };
      }
      return c;
    }));

    setLogs(prev => [
      {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        level: 'INFO',
        msg: `[EDIMP-SDK] Reconfigured stream pipeline for "${configForm.name}" (Status: ${configForm.status}, Buffer: ${configForm.bufferMs}ms)`
      },
      ...prev
    ]);

    setSelectedConnectorForConfig(null);
  };

  const handleDeleteConnector = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deregister connector "${name}"?`)) return;

    setCustomConnectors(prev => prev.filter(c => c.id !== id));
    setLogs(prev => [
      {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        level: 'WARN',
        msg: `[EDIMP-SDK] Deregistered connector "${name}" (${id})`
      },
      ...prev
    ]);
    setSelectedConnectorForConfig(null);
  };

  // Real-time Event Stream Simulation
  const [events, setEvents] = useState<SimulatedEvent[]>([
    { id: 'evt-101', timestamp: new Date().toLocaleTimeString(), connector: 'SAP HANA CDC', eventType: 'UPDATE', table: 'OINV_INVOICES', payload: '{"invoice_id": 94820, "amount": 14250.00, "status": "PAID"}', latencyMs: 2.1, status: 'Success' },
    { id: 'evt-102', timestamp: new Date().toLocaleTimeString(), connector: 'AS400 DB2', eventType: 'INSERT', table: 'CUST_MASTER', payload: '{"cust_no": "C-8812", "region": "US-EAST", "credit": 50000}', latencyMs: 5.2, status: 'Transformed' },
    { id: 'evt-103', timestamp: new Date().toLocaleTimeString(), connector: 'Stripe Gateway', eventType: 'STREAM_PACKET', table: 'charge.succeeded', payload: '{"charge_id": "ch_3M01", "amount": 29900, "currency": "usd"}', latencyMs: 1.1, status: 'Success' }
  ]);

  // Real-time Terminal Logs
  const [logs, setLogs] = useState<Array<{ id: string; time: string; level: 'INFO' | 'CDC' | 'WARN'; msg: string }>>([
    { id: 'l1', time: new Date().toLocaleTimeString(), level: 'INFO', msg: '[EDIMP-SDK] Initialized StreamEngine v3.4.0 with Zero-Copy Buffer Pool (64MB)' },
    { id: 'l2', time: new Date().toLocaleTimeString(), level: 'CDC', msg: '[SAP-HANA-CDC] Subscribed to LSN 0x00000049f2b810 with 4 parallel stream workers' },
    { id: 'l3', time: new Date().toLocaleTimeString(), level: 'INFO', msg: '[BACKPRESSURE] Pipeline optimal. Buffer memory saturation at 42%' },
    { id: 'l4', time: new Date().toLocaleTimeString(), level: 'CDC', msg: '[AS400-DB2] Change log #88492 parsed into JSON stream in 1.4ms' }
  ]);

  // Real-time Stream Interval
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // 1. Update Metrics
      const deltaThroughput = Math.floor(Math.random() * 400) - 200;
      const newLatency = Number((3.2 + Math.random() * 1.5).toFixed(1));
      const newBuffer = Math.min(95, Math.max(15, Math.floor(40 + (Math.random() * 20 - 10))));

      setMetrics(prev => ({
        ...prev,
        throughput: Math.max(10000, prev.throughput + deltaThroughput),
        latency: newLatency,
        bufferUtilization: newBuffer,
        processedTotal: prev.processedTotal + Math.floor(Math.random() * 150) + 50
      }));

      // 2. Generate Simulated CDC Event
      const connectorsList = ['SAP HANA CDC', 'AS400 DB2', 'Stripe Gateway', 'MongoDB Streams'];
      const tablesList = ['OINV_INVOICES', 'CUST_MASTER', 'SALES_ORDERS', 'INVENTORY_LOG', 'PAYMENT_EVENTS'];
      const eventTypes: Array<'INSERT' | 'UPDATE' | 'DELETE' | 'STREAM_PACKET'> = ['INSERT', 'UPDATE', 'STREAM_PACKET', 'UPDATE'];
      
      const selectedConn = connectorsList[Math.floor(Math.random() * connectorsList.length)];
      const selectedTable = tablesList[Math.floor(Math.random() * tablesList.length)];
      const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const randomId = Math.floor(10000 + Math.random() * 90000);

      const newEvt: SimulatedEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        connector: selectedConn,
        eventType: selectedType,
        table: selectedTable,
        payload: JSON.stringify({ record_id: randomId, ts: Date.now(), sync_status: 'REALTIME_CDC', checksum: '0x' + Math.random().toString(16).substring(2, 8) }),
        latencyMs: Number((1.0 + Math.random() * 4.5).toFixed(1)),
        status: Math.random() > 0.15 ? 'Success' : 'Transformed'
      };

      setEvents(prev => [newEvt, ...prev.slice(0, 7)]);

      // 3. Generate Terminal Log
      if (Math.random() > 0.4) {
        const logLevels: Array<'INFO' | 'CDC' | 'WARN'> = ['INFO', 'CDC', 'CDC', 'WARN'];
        const lvl = logLevels[Math.floor(Math.random() * logLevels.length)];
        let msg = '';

        if (lvl === 'CDC') {
          msg = `[${selectedConn}] Committed Change Batch (${selectedType} ${selectedTable}) -> Pipeline Sink in ${newEvt.latencyMs}ms`;
        } else if (lvl === 'INFO') {
          msg = `[SDK-Worker] Stream partition #${Math.floor(Math.random() * 8)} flushed ${Math.floor(Math.random() * 120 + 30)} CDC events`;
        } else {
          msg = `[RATE-LIMITER] Stream backpressure throttle engaged on buffer #3 (duration: 4ms)`;
        }

        setLogs(prev => [
          { id: `log-${Date.now()}`, time: new Date().toLocaleTimeString(), level: lvl, msg },
          ...prev.slice(0, 15)
        ]);
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Code Snippets
  const codeSnippets = {
    typescript: `import { StreamConnector, CDCProcessor, EdimpStreamContext } from '@edimp/connector-sdk';

/**
 * Custom Real-Time CDC Connector Implementation
 */
export class RealtimeHanaConnector extends StreamConnector {
  async onInitialize(ctx: EdimpStreamContext): Promise<void> {
    ctx.logger.info("Initializing Real-Time CDC Listener for SAP HANA...");
    
    // Configure zero-copy streaming pipeline
    this.setStreamingConfig({
      bufferWindowMs: 50,       // 50ms batching window
      maxBatchSize: 500,        // Max records per micro-batch
      enableCDC: true,          // Enable Change Data Capture
      deadLetterQueue: 'dlq_hana_stream'
    });
  }

  /**
   * Real-Time Event Hook triggered when source DB emits change log
   */
  async onDataEvent(changeRecord: CDCProcessor): Promise<void> {
    const payload = changeRecord.getPayload();
    
    // Apply real-time field transformation & schema validation
    const transformed = {
      source_table: changeRecord.tableName,
      operation: changeRecord.operation, // INSERT | UPDATE | DELETE
      data: payload,
      ingested_at: new Date().toISOString()
    };

    // Emit transformed payload to real-time sync pipeline
    await this.emitStream('target_lakehouse_cdc', transformed);
  }
}`,
    go: `package main

import (
    "context"
    "github.com/edimp/connector-sdk/stream"
    "time"
)

type CustomDB2Connector struct {
    stream.BaseStreamConnector
}

func (c *CustomDB2Connector) OnInitialize(ctx context.Context) error {
    c.ConfigureStream(stream.Config{
        BatchInterval: 50 * time.Millisecond,
        MaxBatchSize:  1000,
        EnableCDC:      true,
    })
    return nil
}

func (c *CustomDB2Connector) OnDataEvent(evt *stream.CDCRecord) error {
    transformed := map[string]interface{}{
        "op":   evt.Operation,
        "data": evt.Payload,
        "ts":   time.Now().UnixNano(),
    }
    return c.Emit("target_sink", transformed)
}`,
    python: `from edimp_sdk import StreamConnector, StreamContext, CDCRecord

class MongoChangeStreamConnector(StreamConnector):
    async def on_initialize(self, ctx: StreamContext) -> None:
        ctx.logger.info("Starting Mongo Change Stream Listener...")
        self.configure_stream(
            buffer_window_ms=50,
            max_batch_size=500,
            enable_cdc=True
        )

    async def on_data_event(self, record: CDCRecord) -> None:
        transformed = {
            "collection": record.collection_name,
            "operation": record.op_type,
            "document": record.full_document,
            "timestamp": record.cluster_time
        }
        await self.emit("destination_stream", transformed)
`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[selectedLanguage]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter(l => activeLogFilter === 'ALL' || l.level === activeLogFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Universal Connector SDK</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-Time Engine Online
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                  SDK v3.4.0
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Develop, test, and run high-throughput Change Data Capture (CDC) and real-time streaming connectors.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 border ${
              isSimulating
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {isSimulating ? (
              <><Pause className="w-4 h-4" /> Pause Stream</>
            ) : (
              <><Play className="w-4 h-4" /> Resume Stream</>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowCliModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm shadow-indigo-200 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download CLI Tools
          </button>
        </div>
      </div>

      {/* Real-time Streaming Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stream Throughput</p>
            <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-2">
              {metrics.throughput.toLocaleString()}
              <span className="text-xs font-medium text-slate-500">rec/sec</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Sub-50ms Micro-Batching
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">SDK Pipeline Latency</p>
            <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
              {metrics.latency}
              <span className="text-xs font-medium text-slate-500">ms</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Zero-Copy Memory Buffer
            </p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Buffer Utilization</p>
            <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
              {metrics.bufferUtilization}%
            </div>
            <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  metrics.bufferUtilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${metrics.bufferUtilization}%` }}
              ></div>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Stream Events</p>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {(metrics.processedTotal / 1000000).toFixed(2)}M
            </div>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">
              100% CDC Event Guarantee
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Radio className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'sandbox'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" /> Real-time Stream Sandbox
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'template'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-4 h-4" /> SDK Code Templates
          </button>

          <button
            onClick={() => setActiveTab('registry')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'registry'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" /> Custom Connectors ({customConnectors.length})
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'config'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" /> Streaming Config & Tuning
          </button>
        </div>
      </div>

      {/* TAB 1: REALTIME STREAM SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time Event Monitor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Live CDC & Streaming Event Monitor</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-mono text-slate-500">Live Socket Active</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {events.map((evt) => (
                  <div key={evt.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          evt.eventType === 'INSERT' ? 'bg-emerald-100 text-emerald-800' :
                          evt.eventType === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                          evt.eventType === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {evt.eventType}
                        </span>
                        <span className="font-bold text-slate-800">{evt.connector}</span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="font-mono text-indigo-600 font-medium">{evt.table}</span>
                      </div>
                      <div className="font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 text-[11px] truncate max-w-xl">
                        {evt.payload}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-slate-400 font-mono text-[11px]">
                      <span className="text-slate-600 font-semibold">{evt.latencyMs} ms</span>
                      <span>{evt.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Terminal / System Stream Console */}
            <div className="bg-white text-slate-900 rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-black text-slate-900 font-mono">Real-Time SDK Engine Console Logs</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                  <button
                    onClick={() => setActiveLogFilter('ALL')}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${activeLogFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setActiveLogFilter('CDC')}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${activeLogFilter === 'CDC' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    CDC
                  </button>
                  <button
                    onClick={() => setActiveLogFilter('INFO')}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${activeLogFilter === 'INFO' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    INFO
                  </button>
                  <button
                    onClick={() => setActiveLogFilter('WARN')}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${activeLogFilter === 'WARN' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    WARN
                  </button>
                </div>
              </div>

              <div className="p-4 font-mono text-xs space-y-2 max-h-64 overflow-y-auto bg-slate-50/50">
                {filteredLogs.map(l => (
                  <div key={l.id} className="flex items-start gap-3">
                    <span className="text-slate-400 shrink-0 font-medium">{l.time}</span>
                    <span className={`font-black shrink-0 px-1 py-0.2 rounded border text-[10px] ${
                      l.level === 'CDC' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      l.level === 'WARN' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      [{l.level}]
                    </span>
                    <span className="text-slate-800 break-all font-semibold">{l.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Interactive Event Injector */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Send className="w-4 h-4 text-indigo-600" /> Inject Simulated CDC Event
              </h3>
              <p className="text-xs text-slate-500">
                Trigger a manual Change Data Capture event into the SDK stream connector buffer to test real-time validation and routing.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Target Table / Entity</label>
                  <input
                    type="text"
                    defaultValue="CUSTOM_TRANSACTIONS_LOG"
                    className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Operation Type</label>
                  <select className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                    <option value="INSERT">INSERT (CDC New Record)</option>
                    <option value="UPDATE">UPDATE (CDC Field Modification)</option>
                    <option value="DELETE">DELETE (CDC Soft Purge)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">JSON Payload Sample</label>
                  <textarea
                    rows={4}
                    defaultValue={`{\n  "txn_id": "TXN-99482",\n  "user_id": 8412,\n  "amount": 499.00,\n  "currency": "USD"\n}`}
                    className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    const newEvt: SimulatedEvent = {
                      id: `evt-${Date.now()}`,
                      timestamp: new Date().toLocaleTimeString(),
                      connector: 'Manual SDK Injector',
                      eventType: 'INSERT',
                      table: 'CUSTOM_TRANSACTIONS_LOG',
                      payload: '{"txn_id": "TXN-99482", "user_id": 8412, "amount": 499.00}',
                      latencyMs: 1.2,
                      status: 'Success'
                    };
                    setEvents(prev => [newEvt, ...prev]);
                  }}
                  className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Zap className="w-4 h-4 text-white" /> Emit Stream Event
                </button>
              </div>
            </div>

            {/* SDK Runtime Info */}
            <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Stream Delivery Assurance
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                The EDIMP Connector SDK guarantees Exactly-Once Semantics (EOS) by storing CDC offsets in distributed consensus log pairs with automatic replay checkpoints.
              </p>
              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-700 font-bold">
                <span>Memory Pool: 64MB</span>
                <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">0 Deadletters</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SDK CODE TEMPLATES */}
      {activeTab === 'template' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCode2 className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Real-Time Stream Connector Interface</h3>
                <p className="text-xs text-slate-500">Implement custom Change Data Capture or webhook listeners</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedLanguage('typescript')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedLanguage === 'typescript' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                TypeScript
              </button>
              <button
                onClick={() => setSelectedLanguage('go')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedLanguage === 'go' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Go
              </button>
              <button
                onClick={() => setSelectedLanguage('python')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedLanguage === 'python' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Python
              </button>
            </div>
          </div>

          <div className="p-6 relative bg-slate-950">
            <button
              onClick={handleCopyCode}
              className="absolute top-8 right-8 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1.5 border border-slate-700"
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy Code</>
              )}
            </button>

            <pre className="text-indigo-300 font-mono text-xs overflow-x-auto p-4 rounded-lg leading-relaxed">
              {codeSnippets[selectedLanguage]}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM CONNECTORS REGISTRY */}
      {activeTab === 'registry' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Deployed SDK Connectors</h3>
              <p className="text-xs text-slate-500 mt-1">Custom data stream integrations built using `@edimp/connector-sdk`</p>
            </div>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" /> Register New Connector
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Connector Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Language Binding</th>
                  <th className="px-6 py-3">Live Throughput</th>
                  <th className="px-6 py-3">Avg Latency</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customConnectors.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                      <Server className="w-4 h-4 text-indigo-600" />
                      {c.name}
                      <span className="text-[10px] text-slate-400 font-mono">({c.version})</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
                        {c.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-600">
                      {c.language}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                      {c.throughput}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {c.avgLatency}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenConfig(c)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 justify-end ml-auto px-2.5 py-1 rounded-md hover:bg-indigo-50 transition"
                      >
                        Configure <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STREAMING CONFIG & TUNING */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Sliders className="w-4 h-4 text-indigo-600" /> Micro-Batching & Buffer Controls
            </h3>
            <p className="text-xs text-slate-500">
              Tune streaming memory window thresholds to optimize between ultra-low sub-millisecond latency and high throughput batching.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Stream Buffer Window</span>
                  <span className="font-mono text-indigo-600">50 ms</span>
                </div>
                <input type="range" min="10" max="500" defaultValue="50" className="w-full accent-indigo-600" />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Max Micro-Batch Size</span>
                  <span className="font-mono text-indigo-600">500 records</span>
                </div>
                <input type="range" min="50" max="5000" defaultValue="500" className="w-full accent-indigo-600" />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                  Enable Dead Letter Queue (DLQ) for malformed CDC events
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> Real-Time Schema Guard
            </h3>
            <p className="text-xs text-slate-500">
              Prevent downstream pipeline breaks by configuring automatic drift handling when source schemas change.
            </p>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Auto-Evolve Schema</span>
                  <span className="text-[11px] text-slate-500">Automatically append new columns without interrupting stream</span>
                </div>
                <input type="radio" name="schemaGuard" defaultChecked className="text-indigo-600" />
              </label>

              <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Strict Mode</span>
                  <span className="text-[11px] text-slate-500">Quarantine records that deviate from registered schema</span>
                </div>
                <input type="radio" name="schemaGuard" className="text-indigo-600" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Register New Connector Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Register New Stream Connector</h3>
                  <p className="text-xs text-slate-500">Deploy custom CDC or webhook integration via `@edimp/connector-sdk`</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Connector Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Postgres CDC Adapter, Kafka Topic Stream"
                  value={registerForm.name}
                  onChange={e => setRegisterForm({...registerForm, name: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Connector Type</label>
                  <select
                    value={registerForm.type}
                    onChange={e => setRegisterForm({...registerForm, type: e.target.value as any})}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="CDC Stream">CDC Stream</option>
                    <option value="Webhook Gateway">Webhook Gateway</option>
                    <option value="Polling API">Polling API</option>
                    <option value="Message Queue">Message Queue</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Language Binding</label>
                  <select
                    value={registerForm.language}
                    onChange={e => setRegisterForm({...registerForm, language: e.target.value as any})}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="TypeScript">TypeScript</option>
                    <option value="Go">Go</option>
                    <option value="Python">Python</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Version tag</label>
                  <input
                    type="text"
                    value={registerForm.version}
                    onChange={e => setRegisterForm({...registerForm, version: e.target.value})}
                    placeholder="v1.0.0"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Status</label>
                  <select
                    value={registerForm.status}
                    onChange={e => setRegisterForm({...registerForm, status: e.target.value as any})}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Idle">Idle</option>
                    <option value="Testing">Testing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Stream Buffer Window ({registerForm.bufferMs} ms)</label>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    value={registerForm.bufferMs}
                    onChange={e => setRegisterForm({...registerForm, bufferMs: Number(e.target.value)})}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Max Batch Size ({registerForm.batchSize} recs)</label>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={registerForm.batchSize}
                    onChange={e => setRegisterForm({...registerForm, batchSize: Number(e.target.value)})}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Dead Letter Queue (DLQ)</label>
                <input
                  type="text"
                  value={registerForm.deadLetterQueue}
                  onChange={e => setRegisterForm({...registerForm, deadLetterQueue: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Register Connector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Connector Modal */}
      {selectedConnectorForConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Configure Connector Pipeline</h3>
                  <p className="text-xs font-mono text-indigo-600">{selectedConnectorForConfig.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedConnectorForConfig(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Connector Name</label>
                <input
                  type="text"
                  required
                  value={configForm.name}
                  onChange={e => setConfigForm({...configForm, name: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Connector Type</label>
                  <select
                    value={configForm.type}
                    onChange={e => setConfigForm({...configForm, type: e.target.value as any})}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="CDC Stream">CDC Stream</option>
                    <option value="Webhook Gateway">Webhook Gateway</option>
                    <option value="Polling API">Polling API</option>
                    <option value="Message Queue">Message Queue</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Runtime Status</label>
                  <select
                    value={configForm.status}
                    onChange={e => setConfigForm({...configForm, status: e.target.value as any})}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Active">Active (Streaming)</option>
                    <option value="Idle">Idle (Paused)</option>
                    <option value="Testing">Testing</option>
                    <option value="Error">Error (Quarantine)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Version</label>
                  <input
                    type="text"
                    value={configForm.version}
                    onChange={e => setConfigForm({...configForm, version: e.target.value})}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Language SDK</label>
                  <select
                    value={configForm.language}
                    onChange={e => setConfigForm({...configForm, language: e.target.value as any})}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="TypeScript">TypeScript</option>
                    <option value="Go">Go</option>
                    <option value="Python">Python</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Stream Micro-Batch Window</span>
                  <span className="font-mono text-indigo-600">{configForm.bufferMs} ms</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  value={configForm.bufferMs}
                  onChange={e => setConfigForm({...configForm, bufferMs: Number(e.target.value)})}
                  className="w-full accent-indigo-600"
                />

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={configForm.enableCDC}
                    onChange={e => setConfigForm({...configForm, enableCDC: e.target.checked})}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Enable Real-time Change Data Capture (CDC) Parsing
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Dead Letter Queue Route</label>
                <input
                  type="text"
                  value={configForm.deadLetterQueue}
                  onChange={e => setConfigForm({...configForm, deadLetterQueue: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteConnector(selectedConnectorForConfig.id, selectedConnectorForConfig.name)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Deregister
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedConnectorForConfig(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Save Configuration
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLI Tools Download Modal */}
      <CliDownloadModal
        isOpen={showCliModal}
        onClose={() => setShowCliModal(false)}
      />
    </div>
  );
}
