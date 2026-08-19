import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Combine, Activity, Server, Zap, Cpu, ArrowRight } from 'lucide-react';
import { MOCK_CONNECTORS } from '../data/mockData';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

interface LogEntry {
  id: string;
  time: string;
  action: string;
  node: string;
  type: 'scale' | 'route' | 'throttle';
}

export const GlobalLoadBalancerWidget: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nodeStats, setNodeStats] = useState(
    MOCK_CONNECTORS.slice(0, 5).map(c => ({
      name: c.name,
      id: c.id,
      load: Math.floor(Math.random() * 60) + 10,
      capacity: 100
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      // Update loads randomly
      let actionLog: LogEntry | null = null;
      
      setNodeStats(prev => prev.map(n => {
        const loadChange = Math.floor(Math.random() * 30) - 15;
        let newLoad = Math.max(5, Math.min(120, n.load + loadChange));
        
        if (newLoad > 90 && Math.random() > 0.5) {
          // Trigger a scale or route decision
          actionLog = {
            id: Math.random().toString(36).substr(2, 9),
            time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            action: `Traffic rerouted. Auto-scaled capacity (+20%)`,
            node: n.name,
            type: 'scale'
          };
          newLoad = 60; // Load drops after scaling
        } else if (newLoad < 20 && Math.random() > 0.8) {
           actionLog = {
            id: Math.random().toString(36).substr(2, 9),
            time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            action: `Low utilization detected. Entering power-save mode.`,
            node: n.name,
            type: 'throttle'
          };
        } else if (Math.random() > 0.8 && !actionLog) {
            actionLog = {
                id: Math.random().toString(36).substr(2, 9),
                time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                action: `Routed 15k records from burst queue.`,
                node: n.name,
                type: 'route'
              };
        }

        return { ...n, load: newLoad };
      }));

      if (actionLog) {
        setLogs(prev => [actionLog!, ...prev].slice(0, 5));
      }

    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Combine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Global Load Balancer</h3>
            <p className="text-[10px] text-slate-500 font-mono">Real-time Task Distribution</p>
          </div>
        </div>
        <button
          onClick={onNavigate}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
        >
          View Full
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Chart */}
        <div className="flex flex-col">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Current Node Load (%)</h4>
          <div className="flex-1 min-h-[120px] bg-slate-50 rounded-xl border border-slate-100 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nodeStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 120]} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="load" radius={[4, 4, 0, 0]}>
                  {nodeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.load > 80 ? '#f43f5e' : entry.load > 60 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Logs */}
        <div className="flex flex-col">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Decision Logs</h4>
          <div className="flex-1 bg-slate-900 rounded-xl overflow-hidden p-2 flex flex-col gap-1.5 min-h-[120px]">
            <AnimatePresence>
              {logs.length === 0 ? (
                 <div className="text-xs text-slate-500 font-mono text-center mt-4">Awaiting metrics...</div>
              ) : logs.map(log => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-800/80 rounded border border-slate-700 p-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono text-slate-400">{log.time}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      log.type === 'scale' ? 'bg-indigo-500/20 text-indigo-300' :
                      log.type === 'throttle' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {log.node}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-200 font-medium">
                    {log.action}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
