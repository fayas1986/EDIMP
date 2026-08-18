import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Flame, 
  Clock, 
  Maximize2,
  Globe,
  Server,
  Activity,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

export interface HourlyTrendPoint {
  hourLabel: string;
  hourNumber: number; // 0..23
  critical: number;
  error: number;
  warning: number;
  total: number;
  isPeakPeriod: boolean;
  topErrorCode: string;
  primaryJob: string;
  affectedRecords: number;
}

interface ErrorTrendChartProps {
  trendData: HourlyTrendPoint[];
  chartType: 'area' | 'bar';
  setChartType: (type: 'area' | 'bar') => void;
  trendDisplayMode: 'combined' | 'chart' | 'heatmap';
  setTrendDisplayMode: (mode: 'combined' | 'chart' | 'heatmap') => void;
  selectedHourFilter: number | null;
  setSelectedHourFilter: (hour: number | null) => void;
}

export const ErrorTrendChart: React.FC<ErrorTrendChartProps> = ({
  trendData,
  chartType,
  setChartType,
  trendDisplayMode,
  setTrendDisplayMode,
  selectedHourFilter,
  setSelectedHourFilter
}) => {
  const [isRegionalMapOpen, setIsRegionalMapOpen] = React.useState(false);
  return (
    <div id="error-trend-chart-container" className="bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-slate-50/40">
        <div>
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            24-Hour Temporal Distribution
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wider">
            Aggregate failure spikes across ingestion clusters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100/80 p-1 rounded-full border border-slate-200/55 shadow-inner">
            {(['combined', 'chart', 'heatmap'] as const).map((m) => (
              <button
                id={`trend-mode-${m}`}
                key={m}
                onClick={() => setTrendDisplayMode(m)}
                className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer ${
                  trendDisplayMode === m ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex bg-slate-100/80 p-1 rounded-full border border-slate-200/55 shadow-inner">
            <button
              id="chart-type-area"
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${chartType === 'area' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-600'}`}
              title="Area Chart"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              id="chart-type-bar"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${chartType === 'bar' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-600'}`}
              title="Bar Chart"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 bg-white flex flex-col justify-between">
        {/* Chart Viewport (for combined or chart mode) */}
        {trendDisplayMode !== 'heatmap' && (
          <div className={`${trendDisplayMode === 'combined' ? 'h-[125px]' : 'h-[215px]'} w-full transition-all duration-300`}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                  <XAxis 
                    dataKey="hourLabel" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }}
                    interval={trendDisplayMode === 'combined' ? 4 : 3}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '10px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ padding: '2px 0' }}
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="critical" 
                    stackId="1" 
                    stroke="#f43f5e" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCritical)" 
                    animationDuration={1200}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="error" 
                    stackId="1" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorError)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              ) : (
                <BarChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                  <XAxis 
                    dataKey="hourLabel" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }}
                    interval={trendDisplayMode === 'combined' ? 4 : 3}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '10px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                  />
                  <Bar dataKey="critical" stackId="a" fill="#f43f5e" radius={[2, 2, 0, 0]} barSize={8} />
                  <Bar dataKey="error" stackId="a" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={8} />
                  <Bar dataKey="warning" stackId="a" fill="#6366f1" radius={[2, 2, 0, 0]} barSize={8} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Combined Mode simple horizontal Heatmap Strip */}
        {trendDisplayMode === 'combined' && (
          <div className="mt-4 pt-3 border-t border-slate-100 overflow-x-auto custom-modal-scrollbar">
            <div className="flex gap-1 min-w-max pb-1">
              {trendData.map((d) => (
                <button
                  id={`heatmap-hour-comb-${d.hourNumber}`}
                  key={d.hourNumber}
                  onClick={() => setSelectedHourFilter(selectedHourFilter === d.hourNumber ? null : d.hourNumber)}
                  className={`flex flex-col items-center gap-1 transition-all p-1 rounded-lg border cursor-pointer ${
                    selectedHourFilter === d.hourNumber ? 'bg-indigo-50 border-indigo-200' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div 
                    className={`w-4 h-4 rounded shadow-3xs transition-transform hover:scale-110 ${
                      d.total > 400 ? 'bg-rose-500' : 
                      d.total > 250 ? 'bg-rose-400' :
                      d.total > 150 ? 'bg-amber-500' :
                      d.total > 80 ? 'bg-indigo-400' : 'bg-slate-100'
                    }`}
                    title={`${d.hourLabel}: ${Math.round(d.total)} total errors`}
                  />
                  <span className="text-[6.5px] font-black text-slate-600 uppercase tracking-tighter">{d.hourLabel}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dedicated Heatmap Mode Layout - Double Row Console Grid */}
        {trendDisplayMode === 'heatmap' && (() => {
          // Robust partitioning based on the hour value
          const amData = trendData.filter(d => {
            const hour = parseInt(d.hourLabel.split(':')[0], 10);
            return !isNaN(hour) && hour < 12;
          });
          const pmData = trendData.filter(d => {
            const hour = parseInt(d.hourLabel.split(':')[0], 10);
            return !isNaN(hour) && hour >= 12;
          });

          return (
            <div className="flex-1 flex flex-col justify-center gap-4 py-1 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  24-Hour Diurnal Matrix Map
                </span>
                <span className="text-[9px] text-slate-600 font-bold uppercase">Click blocks to filter logs</span>
              </div>

              <div className="space-y-4">
                {/* AM Row */}
                <div className="flex items-center gap-3">
                  <span className="w-6 text-[10px] font-black text-slate-600 font-mono text-right tracking-tight shrink-0">AM</span>
                  <div className="flex-1 grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {amData.map((d) => (
                      <button
                        id={`heatmap-hour-am-${d.hourNumber}`}
                        key={d.hourNumber}
                        onClick={() => setSelectedHourFilter(selectedHourFilter === d.hourNumber ? null : d.hourNumber)}
                        className={`flex flex-col items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                          selectedHourFilter === d.hourNumber 
                            ? 'bg-indigo-50 border-indigo-300 shadow-sm' 
                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50'
                        }`}
                      >
                        <span className="text-[9px] font-mono font-black text-slate-500 mb-1">{d.hourLabel}</span>
                        <div 
                          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shadow-3xs transition-transform hover:scale-105 ${
                            d.total > 400 ? 'bg-rose-500 text-white shadow-rose-100' : 
                            d.total > 250 ? 'bg-rose-400 text-white' :
                            d.total > 150 ? 'bg-amber-500 text-white' :
                            d.total > 80 ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                          title={`${Math.round(d.total)} total errors`}
                        >
                          <span className="text-[10px] font-mono font-black leading-none">{Math.round(d.total)}</span>
                          <span className="text-[7px] opacity-90 uppercase tracking-tighter mt-0.5 font-bold">errs</span>
                        </div>
                        <span className="text-[8px] font-mono font-extrabold text-indigo-600 truncate max-w-full mt-1 animate-pulse" title={d.topErrorCode}>
                          {d.topErrorCode ? d.topErrorCode.replace('ERR_', '') : 'OK'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* PM Row */}
                <div className="flex items-center gap-3">
                  <span className="w-6 text-[10px] font-black text-slate-600 font-mono text-right tracking-tight shrink-0">PM</span>
                  <div className="flex-1 grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {pmData.map((d) => (
                      <button
                        id={`heatmap-hour-pm-${d.hourNumber}`}
                        key={d.hourNumber}
                        onClick={() => setSelectedHourFilter(selectedHourFilter === d.hourNumber ? null : d.hourNumber)}
                        className={`flex flex-col items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                          selectedHourFilter === d.hourNumber 
                            ? 'bg-indigo-50 border-indigo-300 shadow-sm' 
                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50'
                        }`}
                      >
                        <span className="text-[9px] font-mono font-black text-slate-500 mb-1">{d.hourLabel}</span>
                        <div 
                          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shadow-3xs transition-transform hover:scale-105 ${
                            d.total > 400 ? 'bg-rose-500 text-white shadow-rose-100' : 
                            d.total > 250 ? 'bg-rose-400 text-white' :
                            d.total > 150 ? 'bg-amber-500 text-white' :
                            d.total > 80 ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                          title={`${Math.round(d.total)} total errors`}
                        >
                          <span className="text-[10px] font-mono font-black leading-none">{Math.round(d.total)}</span>
                          <span className="text-[7px] opacity-90 uppercase tracking-tighter mt-0.5 font-bold">errs</span>
                        </div>
                        <span className="text-[8px] font-mono font-extrabold text-indigo-600 truncate max-w-full mt-1" title={d.topErrorCode}>
                          {d.topErrorCode ? d.topErrorCode.replace('ERR_', '') : 'OK'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Error</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Warning</span>
          </div>
        </div>
        <button 
          id="view-regional-map-btn" 
          onClick={() => setIsRegionalMapOpen(true)}
          className="text-[9px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group uppercase tracking-widest cursor-pointer"
        >
          Regional Map
          <Maximize2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Regional Map Modal Overlay */}
      {isRegionalMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-100/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/50">
                  <Globe className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Regional Failure Radar</h3>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Ingestion Pod Cluster & Network Failover Telemetry</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRegionalMapOpen(false)}
                className="p-1.5 rounded-xl border border-slate-100 text-slate-600 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 custom-modal-scrollbar">
              {/* Left Panel: Regional Node List */}
              <div className="md:col-span-6 space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-indigo-500" />
                  Active Ingestion Clusters
                </h4>

                {[
                  { id: 'us-east', name: 'US-East Ingestion Node', region: 'N. Virginia', status: 'critical', errors: 412, latency: 18, traffic: '14.2 GB/s', failover: 'eu-west', fill: 'w-4/5 bg-rose-500' },
                  { id: 'eu-west', name: 'Europe-West Cluster', region: 'Frankfurt', status: 'healthy', errors: 24, latency: 28, traffic: '18.9 GB/s', failover: 'ap-south', fill: 'w-1/12 bg-emerald-500' },
                  { id: 'ap-south', name: 'APAC-South Worker Pod', region: 'Mumbai', status: 'warning', errors: 189, latency: 54, traffic: '8.4 GB/s', failover: 'us-west', fill: 'w-2/5 bg-amber-500' },
                  { id: 'sa-east', name: 'SA-East Gateway Node', region: 'São Paulo', status: 'healthy', errors: 12, latency: 42, traffic: '4.1 GB/s', failover: 'us-east', fill: 'w-[4%] bg-emerald-500' },
                  { id: 'us-west', name: 'US-West Ingest Pod B', region: 'Oregon', status: 'healthy', errors: 31, latency: 14, traffic: '12.5 GB/s', failover: 'eu-west', fill: 'w-[8%] bg-emerald-500' }
                ].map((node) => (
                  <div key={node.id} className="p-4 bg-white border border-slate-100 hover:border-indigo-100 rounded-2xl shadow-3xs transition-all flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-black text-slate-900 tracking-tight">{node.name}</h5>
                        <p className="text-[9px] font-mono font-bold text-slate-600 mt-0.5">{node.region}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        node.status === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                        node.status === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                        'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                        {node.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 border-t border-slate-50 pt-2.5">
                      <div>
                        <span className="text-[7.5px] font-black text-slate-600 uppercase tracking-tighter">Errors</span>
                        <p className="text-xs font-mono font-black text-slate-800">{node.errors}</p>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-black text-slate-600 uppercase tracking-tighter">Latency</span>
                        <p className="text-xs font-mono font-black text-slate-800">{node.latency}ms</p>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-black text-slate-600 uppercase tracking-tighter">Traffic</span>
                        <p className="text-xs font-mono font-black text-slate-800">{node.traffic}</p>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-black text-slate-600 uppercase tracking-tighter">Failover</span>
                        <p className="text-xs font-mono font-black text-indigo-600 uppercase">{node.failover}</p>
                      </div>
                    </div>

                    <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden mt-1">
                      <div className={`h-full rounded-full ${node.fill}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Panel: Interactive Network Overlay */}
              <div className="md:col-span-6 flex flex-col gap-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  Dynamic Topology & Failover Loop
                </h4>

                <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex flex-col justify-between gap-6 min-h-[350px]">
                  <div className="relative flex-1 flex items-center justify-center">
                    {/* Ring Accents */}
                    <div className="absolute w-48 h-48 border border-slate-200/60 rounded-full animate-ping-slow opacity-25" />
                    <div className="absolute w-36 h-36 border border-slate-100 rounded-full" />
                    <div className="absolute w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center shadow-xs">
                      <Globe className="w-6 h-6 text-indigo-500" />
                    </div>

                    {/* Nodes spread radially */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse ring-4 ring-rose-100" />
                      <span className="text-[8.5px] font-black text-slate-600 uppercase tracking-tighter">US-East</span>
                    </div>

                    <div className="absolute right-4 top-1/4 flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                      <span className="text-[8.5px] font-black text-slate-600 uppercase tracking-tighter">EU-West</span>
                    </div>

                    <div className="absolute right-4 bottom-1/4 flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                      <span className="text-[8.5px] font-black text-slate-600 uppercase tracking-tighter">APAC-South</span>
                    </div>

                    <div className="absolute left-4 bottom-1/4 flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                      <span className="text-[8.5px] font-black text-slate-600 uppercase tracking-tighter">SA-East</span>
                    </div>

                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                      <span className="text-[8.5px] font-black text-slate-600 uppercase tracking-tighter">US-West</span>
                    </div>
                  </div>

                  {/* Operational Failover Action Block */}
                  <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-3xs">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <h6 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Imminent Failure Alert</h6>
                        <p className="text-[9px] text-slate-500 font-bold mt-1">
                          Ingestion failures at <span className="text-rose-500 font-extrabold">US-East Node</span> have exceeded threshold of 10%. Active fallback failover route to <span className="text-indigo-600 font-extrabold">Europe-West</span> is armed and ready.
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        alert('Traffic failover loop initiated. Re-routing US-EAST ingress load to Europe-West pipeline clusters... Done.');
                        setIsRegionalMapOpen(false);
                      }}
                      className="w-full mt-3.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Trigger Automated Failover Redirect
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsRegionalMapOpen(false)}
                className="px-4 py-2 border border-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Close Radar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
