import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  FileJson, 
  Search, 
  Server, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Database,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Download,
  Activity
} from 'lucide-react';

interface ReasoningStep {
  step: string;
  detail: string;
  type: 'analysis' | 'evaluation' | 'prediction' | 'decision';
}

interface DecisionLog {
  id: string;
  timestamp: string;
  taskId: string;
  payloadType: string;
  selectedNode: string;
  confidence: number;
  reasoningChain: ReasoningStep[];
  rawJson: string;
}

const MOCK_LOGS: DecisionLog[] = [
  {
    id: "DEC-8842-Alpha",
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    taskId: "SYNC-BATCH-992",
    payloadType: "Financial Ledger Sync (250k rows)",
    selectedNode: "EU-Frankfurt-Replica-1",
    confidence: 0.98,
    reasoningChain: [
      { type: "analysis", step: "Payload Profiling", detail: "Detected high-volume financial ledger sync (250,000 records). Requires high I/O throughput." },
      { type: "evaluation", step: "Node Telemetry Review", detail: "US-East is experiencing maintenance (78% CPU). EU-Frankfurt is operating at 15% capacity." },
      { type: "prediction", step: "SLA Modeling", detail: "Routing to US-East violates 500ms P99 SLA by +120ms. EU-Frankfurt projected completion within 140ms." },
      { type: "decision", step: "Action Execution", detail: "Diverted traffic to EU-Frankfurt-Replica-1. Triggered auto-scaling group warmup." }
    ],
    rawJson: JSON.stringify({
      "task_context": {
        "id": "SYNC-BATCH-992",
        "type": "financial_ledger",
        "volume_records": 250000,
        "priority": "critical",
        "data_residency_constraints": ["EU", "US"]
      },
      "cluster_state": {
        "us_east_primary": { "status": "degraded", "cpu_util": 0.78, "disk_io_wait_ms": 45 },
        "eu_frankfurt_replica_1": { "status": "healthy", "cpu_util": 0.15, "disk_io_wait_ms": 2 }
      },
      "gemini_prompt": "Evaluate optimal routing for critical financial sync given current cluster degradation in US-East.",
      "model_version": "gemini-1.5-pro-002"
    }, null, 2)
  },
  {
    id: "DEC-7731-Beta",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    taskId: "STREAM-INGEST-04",
    payloadType: "IoT Sensor Stream (Real-time)",
    selectedNode: "US-West-Edge-Pool",
    confidence: 0.89,
    reasoningChain: [
      { type: "analysis", step: "Stream Identification", detail: "Identified continuous IoT telemetry stream. Latency sensitive (<20ms required)." },
      { type: "evaluation", step: "Geographic Routing", detail: "Source IP detected in US-West region. Evaluating edge nodes." },
      { type: "prediction", step: "Resource Allocation", detail: "US-West-Edge-Pool has sufficient WebSocket connection capacity (45% utilized)." },
      { type: "decision", step: "Action Execution", detail: "Established persistent connection pool on US-West-Edge-Pool." }
    ],
    rawJson: JSON.stringify({
      "task_context": {
        "id": "STREAM-INGEST-04",
        "type": "iot_telemetry_stream",
        "protocol": "wss",
        "source_region": "us-west-2"
      },
      "edge_nodes": [
        { "id": "us-west-edge-pool", "active_wss": 4500, "max_wss": 10000, "latency_to_source_ms": 12 },
        { "id": "us-east-edge-pool", "active_wss": 8200, "max_wss": 10000, "latency_to_source_ms": 68 }
      ],
      "decision_weights": { "latency": 0.8, "capacity": 0.2 }
    }, null, 2)
  },
  {
    id: "DEC-6620-Gamma",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    taskId: "QUERY-ANALYTICS-X",
    payloadType: "Heavy Ad-hoc Analytics Query",
    selectedNode: "Global-Data-Warehouse",
    confidence: 0.95,
    reasoningChain: [
      { type: "analysis", step: "Query Parsing", detail: "Detected complex JOIN across 5 tables spanning 500GB of historical data." },
      { type: "evaluation", step: "Impact Assessment", detail: "Executing on primary transactional DB would block concurrent writes and spike CPU to 100%." },
      { type: "prediction", step: "Target Selection", detail: "Global-Data-Warehouse is optimized for columnar reads and currently idle." },
      { type: "decision", step: "Action Execution", detail: "Rerouted read-only analytics query to Data Warehouse replica." }
    ],
    rawJson: JSON.stringify({
      "query_metadata": {
        "id": "QUERY-ANALYTICS-X",
        "estimated_cost": 4500,
        "tables_involved": ["orders", "users", "events", "inventory", "transactions"],
        "is_read_only": true
      },
      "system_impact_predictions": {
        "primary_db": { "predicted_cpu": 0.99, "predicted_latency_impact_ms": 450 },
        "data_warehouse": { "predicted_cpu": 0.40, "predicted_latency_impact_ms": 0 }
      }
    }, null, 2)
  }
];


const generateMockLog = (): DecisionLog => {
  const id = `DEC-${Math.floor(Math.random() * 10000)}-Live`;
  const taskNumber = Math.floor(Math.random() * 1000);
  const nodes = ["US-East-Primary", "EU-Frankfurt-Replica-1", "US-West-Edge-Pool", "Global-Data-Warehouse"];
  const selectedNode = nodes[Math.floor(Math.random() * nodes.length)];
  const confidence = 0.85 + Math.random() * 0.14;
  
  return {
    id,
    timestamp: new Date().toISOString(),
    taskId: `AUTO-SYNC-${taskNumber}`,
    payloadType: "Real-time Ad-hoc Sync",
    selectedNode,
    confidence,
    reasoningChain: [
      { type: "analysis", step: "Payload Profiling", detail: `Detected incoming ad-hoc sync request (${Math.floor(Math.random() * 500)} records).` },
      { type: "evaluation", step: "Node Telemetry Review", detail: `Evaluated cluster capacities. ${selectedNode} shows optimal availability.` },
      { type: "prediction", step: "SLA Modeling", detail: "Predicted completion within 120ms." },
      { type: "decision", step: "Action Execution", detail: `Traffic routed to ${selectedNode}.` }
    ],
    rawJson: JSON.stringify({
      "task_context": {
        "id": `AUTO-SYNC-${taskNumber}`,
        "type": "ad_hoc_sync",
        "priority": "standard"
      },
      "cluster_state": {
        "selected_node": selectedNode,
        "status": "healthy"
      },
      "gemini_prompt": "Evaluate optimal routing for ad-hoc sync.",
      "model_version": "gemini-1.5-flash-001"
    }, null, 2)
  };
};

export const DecisionLogExplorerView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<DecisionLog[]>(MOCK_LOGS);
  const [selectedLogId, setSelectedLogId] = useState<string>(MOCK_LOGS[0].id);
  const [isLiveMode, setIsLiveMode] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLiveMode) {
      interval = setInterval(() => {
        const newLog = generateMockLog();
        setLogs(prev => {
          const updatedLogs = [newLog, ...prev].slice(0, 50); // Keep max 50 logs
          // If we auto-select the newest? Optional, let's keep it simple, just add to list.
          return updatedLogs;
        });
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isLiveMode]);

  const filteredLogs = logs.filter(log => 
    log.taskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.payloadType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.selectedNode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLog = logs.find(l => l.id === selectedLogId) || logs[0];

  const getStepIcon = (type: ReasoningStep['type']) => {
    switch (type) {
      case 'analysis': return <Search className="w-4 h-4 text-blue-500" />;
      case 'evaluation': return <Database className="w-4 h-4 text-amber-500" />;
      case 'prediction': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'decision': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Task ID', 'Payload Type', 'Target Node', 'Confidence', 'Raw JSON'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => {
        const escapedJson = log.rawJson.replace(/"/g, '""');
        return [
          `"${log.id}"`,
          `"${log.timestamp}"`,
          `"${log.taskId}"`,
          `"${log.payloadType}"`,
          `"${log.selectedNode}"`,
          `"${log.confidence}"`,
          `"${escapedJson}"`
        ].join(',');
      })
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `decision-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" />
            Decision Log Explorer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit Gemini AI reasoning chains, telemetry contexts, and raw JSON payloads used in Global Load Balancer routing decisions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <span className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {isLiveMode ? 'LIVE INGESTION' : 'POLLING PAUSED'}
            </span>
            <button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isLiveMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isLiveMode ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl border border-indigo-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Log List */}
        <div className="lg:col-span-1 flex flex-col h-[calc(100vh-220px)] bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks, nodes, payloads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredLogs.map(log => (
              <button
                key={log.id}
                onClick={() => setSelectedLogId(log.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  selectedLogId === log.id 
                    ? 'bg-indigo-50 border-indigo-200 border shadow-xs' 
                    : 'bg-transparent border border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-bold ${selectedLogId === log.id ? 'text-indigo-900' : 'text-slate-900'}`}>
                    {log.taskId}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                  {log.payloadType}
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    <Server className="w-3 h-3" />
                    {log.selectedNode}
                  </span>
                  <span className={`font-mono font-bold ${log.confidence >= 0.95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {(log.confidence * 100).toFixed(1)}% Conf
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Col: Details */}
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-220px)] space-y-6">
          
          {/* Top Meta Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Node</div>
              <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-500" />
                {selectedLog.selectedNode}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Confidence Score</div>
              <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Brain className={`w-4 h-4 ${selectedLog.confidence >= 0.95 ? 'text-emerald-500' : 'text-amber-500'}`} />
                {(selectedLog.confidence * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Execution Time</div>
              <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                {new Date(selectedLog.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
            {/* Reasoning Chain */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-500" />
                  Gemini Reasoning Chain
                </h3>
              </div>
              <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50">
                <div className="space-y-6">
                  {selectedLog.reasoningChain.map((step, idx) => (
                    <div key={idx} className="relative flex gap-4">
                      {idx !== selectedLog.reasoningChain.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-slate-200" />
                      )}
                      <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm shrink-0">
                        {getStepIcon(step.type)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{step.step}</div>
                        <div className="text-sm text-slate-600 mt-1 leading-relaxed">
                          {step.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Raw JSON Payload */}
            <div className="bg-[#0D1117] rounded-2xl border border-slate-800 shadow-xs flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-[#161B22] flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-emerald-400" />
                  Raw Telemetry & Prompt Payload
                </h3>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <pre className="text-[11px] font-mono text-slate-300 leading-relaxed">
                  <code>{selectedLog.rawJson}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecisionLogExplorerView;
