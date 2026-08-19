import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Zap,
  BarChart3,
  RefreshCw,
  Terminal,
  Cpu,
  Database
} from 'lucide-react';

const MOCK_ANALYTICS_DATA = [
  { time: '00:00', success: 420, fail: 12 },
  { time: '03:00', success: 380, fail: 8 },
  { time: '06:00', success: 510, fail: 15 },
  { time: '09:00', success: 850, fail: 42 },
  { time: '12:00', success: 1200, fail: 58 },
  { time: '15:00', success: 980, fail: 31 },
  { time: '18:00', success: 740, fail: 19 },
  { time: '21:00', success: 520, fail: 14 },
  { time: '23:59', success: 460, fail: 10 },
];

const EVENT_TYPES = ['SUCCESS', 'VALIDATION_ERR', 'TRANSFORM_FAIL', 'PII_MASKED', 'LOOKUP_MATCH'];
const RULE_NAMES = ['Cust_Account_Link', 'Payment_Terms_Crosswalk', 'Address_Normalization', 'Credit_Limit_Check', 'VAT_Registration_Validation'];

interface ExecutionEvent {
  id: string;
  timestamp: string;
  rule: string;
  type: string;
  latency: string;
  status: 'success' | 'warning' | 'error';
}

export const MappingAnalyticsDashboard: React.FC = () => {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(MOCK_ANALYTICS_DATA);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [events, setEvents] = useState<ExecutionEvent[]>([]);

  // Sparkline data generation based on main metrics
  const [kpiData, setKpiData] = useState([
    { label: 'Success Rate', val: 97.4, trend: '+0.2%', icon: CheckCircle2, color: 'emerald', suffix: '%' },
    { label: 'Throughput', val: 1240, trend: '+14%', icon: Activity, color: 'indigo', suffix: '/s' },
    { label: 'Exceptions', val: 12, trend: '-22%', icon: AlertCircle, color: 'rose', suffix: '' },
    { label: 'Latency', val: 14.2, trend: '-1.2ms', icon: Zap, color: 'purple', suffix: 'ms' }
  ]);

  // Sparkline data generation based on main metrics
  const sparklineData = useMemo(() => {
    return analyticsData.slice(-5).map(d => ({ val: d.success }));
  }, [analyticsData]);

  const refreshMetrics = useCallback(() => {
    setAnalyticsData(current => current.map(item => ({
      ...item,
      success: Math.max(100, Math.floor(item.success * (0.98 + Math.random() * 0.04))),
      fail: Math.max(2, Math.floor(item.fail * (0.95 + Math.random() * 0.1))),
    })));
    
    setKpiData(current => current.map(kpi => {
      const change = (Math.random() - 0.5) * 0.5;
      const newVal = Math.max(0, kpi.val + change);
      return {
        ...kpi,
        val: parseFloat(newVal.toFixed(1)),
        trend: change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`
      };
    }));

    setLastUpdated(new Date());
    
    // Add a new live event
    const newEvent: ExecutionEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      rule: RULE_NAMES[Math.floor(Math.random() * RULE_NAMES.length)],
      type: EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)],
      latency: (Math.random() * 25 + 5).toFixed(1) + 'ms',
      status: Math.random() > 0.15 ? 'success' : Math.random() > 0.5 ? 'warning' : 'error'
    };
    
    setEvents(prev => [newEvent, ...prev].slice(0, 8));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoRefresh) {
      // Refresh every 30s as requested by user
      interval = setInterval(refreshMetrics, 30000);
      refreshMetrics(); // Initial kick
    }
    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshMetrics]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Mapping Intelligence Platform</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium ml-12">
            Enterprise monitoring of rule execution engines, latency distribution, and PII masking effectiveness.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl shadow-inner">
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isAutoRefresh ? 'animate-spin-slow' : ''}`} />
              <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Auto-Refresh (30s)</span>
            </div>
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
                isAutoRefresh ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAutoRefresh ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex flex-col items-end gap-1 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-tight">System Time: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-full h-12 opacity-30">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <Area type="monotone" dataKey="val" stroke={`#${stat.color === 'emerald' ? '10b981' : stat.color === 'indigo' ? '6366f1' : stat.color === 'rose' ? 'f43f5e' : 'a855f7'}`} fill={`#${stat.color === 'emerald' ? '10b981' : stat.color === 'indigo' ? '6366f1' : stat.color === 'rose' ? 'f43f5e' : 'a855f7'}`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-black uppercase ${stat.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.trend}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">{stat.label}</span>
              <p className="text-2xl font-black text-slate-900 tracking-tighter font-mono">{stat.val}{stat.suffix}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Live Execution Trends</h4>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-50" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Success</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-50" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Failed</span>
              </div>
            </div>
          </div>
          
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 900 }}
                  itemStyle={{ padding: '2px 0' }}
                />
                <Line type="monotone" dataKey="success" stroke="#6366f1" strokeWidth={4} dot={{ r: 5, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="fail" stroke="#f43f5e" strokeWidth={4} dot={{ r: 5, fill: '#f43f5e', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Event Feed - Polished Light Theme */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-full transition-all">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Real-Time Execution Feed</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">Live Engine</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-50" />
            </div>
          </div>
          
          <div className="flex-1 p-4 font-mono text-[10px] space-y-3 overflow-y-auto bg-white">
            {events.length === 0 && <div className="text-slate-400 italic">Waiting for engine cycles...</div>}
            {events.map((ev) => (
              <div key={ev.id} className="animate-in slide-in-from-right duration-300 border-b border-slate-50 pb-2 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">[{ev.timestamp}]</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${
                      ev.status === 'success' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : ev.status === 'warning' 
                          ? 'bg-amber-50 text-amber-700' 
                          : 'bg-rose-50 text-rose-700'
                    }`}>
                      {ev.type}
                    </span>
                  </div>
                  <span className="text-slate-400 font-bold">{ev.latency}</span>
                </div>
                <div className="pl-0 text-slate-700 font-black flex items-center gap-1.5">
                  <span className="text-indigo-400">&gt;</span> {ev.rule}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200/60 shadow-4xs">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">CPU Load</span>
                <span className="text-[10px] text-slate-900 font-black">18.4%</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200/60 shadow-4xs">
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Database className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">IO Depth</span>
                <span className="text-[10px] text-slate-900 font-black">428 op/s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
