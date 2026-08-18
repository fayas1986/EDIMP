import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts';
import { 
  Network, 
  Activity, 
  Server, 
  ArrowRight, 
  Zap, 
  Cpu, 
  Database, 
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Combine,
  BarChart3,
  Sparkles,
  MonitorDot
} from 'lucide-react';
import { MOCK_CONNECTORS } from '../data/mockData';
import { Connector } from '../types';
import { LoadBalancerDiagnostics } from './LoadBalancerDiagnostics';

interface ConnectorNode extends Connector {
  currentLatency: number;
  maxThroughput: number; // tasks per second
  queue: number;
  processedCount: number;
  statusColor: string;
}

interface IncomingTask {
  id: string;
  size: number;
}

interface GlobalLoadBalancerViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const GlobalLoadBalancerView: React.FC<GlobalLoadBalancerViewProps> = ({ onNavigateTab }) => {
  const [isRunning, setIsRunning] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [nodes, setNodes] = useState<ConnectorNode[]>(
    MOCK_CONNECTORS.map(c => ({
      ...c,
      currentLatency: c.latencyMs || Math.floor(Math.random() * 50) + 10,
      maxThroughput: Math.floor(Math.random() * 80) + 20,
      queue: 0,
      processedCount: 0,
      statusColor: 'text-emerald-500'
    }))
  );

  const [totalProcessed, setTotalProcessed] = useState(0);
  const [incomingQueue, setIncomingQueue] = useState(0);
  const [dispatchLog, setDispatchLog] = useState<{ id: string; msg: string; time: string; nodeId: string }[]>([]);
  
  const [isPredicting, setIsPredicting] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [prediction, setPrediction] = useState<{ forecast: string; suggestedActions: { nodeId: string; action: string }[]; predictedPeakQueue: number } | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const handleRunPrediction = async () => {
    setIsPredicting(true);
    setPredictionError(null);
    try {
      const response = await fetch('/api/loadbalancer/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, queue: incomingQueue })
      });
      const data = await response.json();
      if (data.success) {
        setPrediction(data.prediction);
      } else {
        setPredictionError(data.message || 'Prediction failed');
      }
    } catch (err: any) {
      setPredictionError(err.message || 'Network error');
    } finally {
      setIsPredicting(false);
    }
  };

  // Engine loop
  useEffect(() => {
    if (!isRunning) return;

    const tickMs = 1000 / simulationSpeed;
    const interval = setInterval(() => {
      // 1. Generate new incoming tasks (bursty)
      const newTasks = Math.floor(Math.random() * 300) + 50;
      let tasksToDistribute = incomingQueue + newTasks;

      // 2. Update node capacities and latencies slightly
      let updatedNodes = nodes.map(n => {
        // Random latency jitter
        let newLatency = Math.max(5, n.currentLatency + (Math.random() * 10 - 5));
        
        // Process queue
        const processedThisTick = Math.min(n.queue, Math.floor(n.maxThroughput));
        
        return {
          ...n,
          currentLatency: newLatency,
          queue: n.queue - processedThisTick,
          processedCount: n.processedCount + processedThisTick
        };
      });

      // 3. Load Balance: Distribute tasksToDistribute
      // Score = (maxThroughput / currentLatency)
      // High throughput + low latency = best score
      const totalScore = updatedNodes.reduce((acc, n) => acc + (n.maxThroughput / Math.max(1, n.currentLatency)), 0);
      
      let newLogEntries: any[] = [];

      updatedNodes = updatedNodes.map(n => {
        const score = n.maxThroughput / Math.max(1, n.currentLatency);
        const allocationPct = score / totalScore;
        const allocatedTasks = Math.floor(tasksToDistribute * allocationPct);
        
        // Push to node queue
        const newQueue = n.queue + allocatedTasks;

        if (allocatedTasks > 50) {
          newLogEntries.push({
            id: Math.random().toString(36).substring(7),
            msg: `Dispatched ${allocatedTasks} records`,
            time: new Date().toISOString().substring(11, 23),
            nodeId: n.id
          });
        }

        // Status color logic based on queue size vs max throughput
        let color = 'text-emerald-500';
        if (newQueue > n.maxThroughput * 3) color = 'text-amber-500';
        if (newQueue > n.maxThroughput * 6) color = 'text-rose-500';

        return {
          ...n,
          queue: newQueue,
          statusColor: color
        };
      });

      // Remainder stays in incoming queue if not perfectly distributed
      const distributed = updatedNodes.reduce((acc, n) => acc + (n.queue - (nodes.find(old => old.id === n.id)?.queue || 0)), 0);
      const remainingTasks = Math.max(0, tasksToDistribute - distributed);

      const totalProcessedThisTick = updatedNodes.reduce((acc, n) => acc + (n.processedCount - (nodes.find(old => old.id === n.id)?.processedCount || 0)), 0);

      setIncomingQueue(remainingTasks);
      setNodes(updatedNodes);
      setTotalProcessed(prev => prev + totalProcessedThisTick);
      
      if (newLogEntries.length > 0) {
        setDispatchLog(prev => [...newLogEntries, ...prev].slice(0, 15));
      }

    }, tickMs);

    return () => clearInterval(interval);
  }, [isRunning, simulationSpeed, nodes, incomingQueue]);


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-3xs border border-slate-200/80 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-100 flex items-center gap-2">
                <Combine className="w-4 h-4" />
                Global Load Balancer
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3.5 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 shadow-3xs'}`}></span>
                {isRunning ? 'ACTIVE ROUTING' : 'SUSPENDED'}
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              Adaptive Ingestion Balancer
            </h1>
            <p className="text-slate-400 text-[11px] font-bold uppercase mt-2 max-w-2xl leading-relaxed tracking-tight">
              Dynamically distributes high-volume ingestion payloads across all configured connectors based on real-time latency and throughput metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowDiagnostics(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-100 active:scale-95"
            >
              <MonitorDot className="w-4 h-4" />
              Diagnostics Overlay
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('decision-log-explorer')}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-100 transition-colors shadow-3xs"
            >
              <Sparkles className="w-4 h-4" />
              Decision Explorer
            </button>
            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-1.5 shadow-inner shadow-slate-200/50">
              <span className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Speed</span>
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSimulationSpeed(speed)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                    simulationSpeed === speed
                      ? 'bg-white text-slate-900 shadow-3xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg border ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400 shadow-amber-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-100'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Pause Balancer' : 'Resume Routing'}
            </button>
          </div>
        </div>
      </div>

      {/* Predictive Scaling AI Panel */}
      <div className="bg-indigo-50/30 border border-indigo-100 rounded-3xl p-6 shadow-3xs flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white text-indigo-600 rounded-2xl border border-indigo-100 shadow-3xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">AI Multi-Model Predictive Scaling</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Forecasts incoming peak loads and suggests proactive resource provisioning across Gemini, GPT, Claude, Kimi, GLM & Qwen engines.</p>
            </div>
          </div>
          <button 
            onClick={handleRunPrediction} 
            disabled={isPredicting}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
          >
            {isPredicting ? <span className="animate-pulse">Analyzing Streams...</span> : 'Run Forecast Analysis'}
          </button>
        </div>

        {predictionError && (
          <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-rose-100 shadow-3xs">
            {predictionError}
          </div>
        )}

        {prediction && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="col-span-1 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Load Forecast (1 Hour)</div>
              <p className="text-sm font-black text-slate-900 tracking-tight leading-relaxed uppercase">{prediction.forecast}</p>
              <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                <span>Predicted Peak:</span>
                <span className="text-rose-600 font-mono text-xs">{prediction.predictedPeakQueue.toLocaleString()}</span>
              </div>
            </div>
            <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Suggested Proactive Actions</div>
              <ul className="space-y-3">
                {prediction.suggestedActions.map((action, idx) => {
                  const targetNode = nodes.find(n => n.id === action.nodeId);
                  return (
                    <li key={idx} className="flex items-start gap-3 text-[10px] font-bold uppercase tracking-tight">
                      <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg shadow-3xs mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      </div>
                      <div className="leading-relaxed">
                        <span className="font-black text-slate-900 tracking-widest">{targetNode ? targetNode.name : action.nodeId}: </span>
                        <span className="text-slate-500">{action.action}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="space-y-6">
        {/* Top: Connector Nodes Grid (Full Width) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
          {nodes.map(node => (
            <div key={node.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs overflow-hidden flex flex-col h-full hover:border-indigo-200 transition-all group">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
                <div className="flex items-center gap-4 truncate">
                  <div className={`p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-3xs ${node.statusColor}`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest truncate" title={node.name}>{node.name}</h4>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">{node.category}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Queue Size</div>
                    <div className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                      {node.queue.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Processed</div>
                    <div className="text-sm font-black text-indigo-600 font-mono uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                      {node.processedCount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Capacity Load</span>
                    <span className={`font-black ${node.statusColor}`}>
                      {Math.min(100, Math.round((node.queue / (node.maxThroughput * 5)) * 100))}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner shadow-slate-200/50">
                    <motion.div 
                      className={`h-full rounded-full shadow-3xs ${
                        node.queue > node.maxThroughput * 6 ? 'bg-rose-500' :
                        node.queue > node.maxThroughput * 3 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (node.queue / (node.maxThroughput * 5)) * 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                  <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-3xs">
                    <Zap className="w-4 h-4 text-amber-500 mb-1.5" />
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Latency</span>
                    <span className="text-xs font-black text-slate-900 tracking-tighter font-mono">{node.currentLatency.toFixed(1)}ms</span>
                  </div>
                  <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-3xs">
                    <Cpu className="w-4 h-4 text-indigo-500 mb-1.5" />
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Throughput</span>
                    <span className="text-xs font-black text-slate-900 tracking-tighter font-mono">{node.maxThroughput}/s</span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Bottom Analytics Section: Metrics, Chart & Dispatch Log */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left 3/5: Analytics & Metrics */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs p-8 flex flex-col justify-center group hover:border-indigo-100 transition-colors">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-3xs">
                  <Activity className="w-4 h-4" />
                </div>
                Incoming Queue Backlog
              </h3>
              <div className="text-5xl font-black text-slate-900 font-mono tracking-tighter">
                {incomingQueue.toLocaleString()}
                <span className="text-[11px] text-slate-400 ml-3 font-black uppercase tracking-widest">Tasks</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs p-8 flex flex-col justify-center group hover:border-emerald-100 transition-colors">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shadow-3xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                Total Records Dispatched
              </h3>
              <div className="text-5xl font-black text-indigo-600 font-mono tracking-tighter">
                {totalProcessed.toLocaleString()}
                <span className="text-[11px] text-slate-400 ml-3 font-black uppercase tracking-widest">Records</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs p-8 flex flex-col space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-3xs">
                <BarChart3 className="w-4 h-4" />
              </div>
              Connector Efficiency Ratio (Throughput vs. Latency)
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Real-time efficiency ratio calculated as Throughput (records/sec) divided by Latency (ms).</p>
            <div className="h-[320px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nodes.map(n => ({ name: n.name, efficiency: Number((n.maxThroughput / Math.max(1, n.currentLatency)).toFixed(2)), throughput: n.maxThroughput, latency: n.currentLatency }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', backgroundColor: 'white' }}
                      labelStyle={{ fontSize: '10px', fontWeight: 'black', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'black' }}
                    />
                  <Bar dataKey="efficiency" name="Efficiency Ratio" radius={[8, 8, 0, 0]} barSize={40}>
                    {nodes.map((entry, index) => {
                      const ratio = entry.maxThroughput / Math.max(1, entry.currentLatency);
                      return <Cell key={`cell-${index}`} fill={ratio > 3 ? '#10b981' : ratio > 1.5 ? '#f59e0b' : '#f43f5e'} className="shadow-3xs" />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right 2/5: Dispatch Log */}
        <div className="lg:col-span-2 h-full">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs flex flex-col h-[530px] overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shadow-3xs border border-emerald-100">
                  <Server className="w-4 h-4" />
                </div>
                Live Dispatch Log
              </h3>
              <div className="flex gap-1.5 p-1 bg-white rounded-lg border border-slate-100 shadow-3xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-[10px] no-scrollbar bg-slate-50/30">
              <AnimatePresence initial={false}>
                {dispatchLog.map(log => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 rounded-2xl bg-white text-slate-700 border border-slate-100 flex flex-col gap-3 shadow-3xs hover:border-indigo-100 transition-all group"
                  >
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                      <span className="text-slate-400 tracking-tighter">{log.time}</span>
                      <span className="truncate max-w-[130px] text-indigo-600 flex items-center gap-2" title={nodes.find(n => n.id === log.nodeId)?.name}>
                        <ArrowRight className="w-3 h-3" />
                        {nodes.find(n => n.id === log.nodeId)?.name || 'Node'}
                      </span>
                    </div>
                    <div className="text-emerald-600 font-black tracking-widest text-[11px] uppercase flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {log.msg}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {dispatchLog.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4 opacity-50 uppercase tracking-widest font-black text-[10px]">
                  <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-3xs animate-pulse">
                    <Activity className="w-10 h-10" />
                  </div>
                  <span>Awaiting Stream...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <LoadBalancerDiagnostics 
        isOpen={showDiagnostics} 
        onClose={() => setShowDiagnostics(false)} 
        connectors={nodes}
        incomingRate={incomingQueue / 1000}
      />
    </div>
  );
};

export default GlobalLoadBalancerView;
